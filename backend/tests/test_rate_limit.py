"""Tests for the shared Redis-backed collector rate limit."""

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from redis.exceptions import ConnectionError

from app.v2.context import RequestContext
from app.v2.rate_limit import DistributedRateLimiter, RateLimitUnavailable


class _FakeRedis:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = []

    async def eval(self, *args):
        self.calls.append(args)
        if self.error:
            raise self.error
        return self.result

    async def aclose(self):
        return None


def _context() -> RequestContext:
    return RequestContext(
        request_id="rate-limit-test",
        principal_id=uuid4(),
        external_subject="collector|test",
        tenant_id=uuid4(),
        membership_id=uuid4(),
        role="collector",
        scopes=frozenset({"projects:read", "evidence:write"}),
        principal_type="service",
        token_id="collector-token",
        token_expires_at=datetime.now(timezone.utc),
        auth_time=None,
        acr=None,
        amr=frozenset(),
    )


def test_distributed_rate_limit_returns_remaining_budget_without_identity_in_key():
    redis = _FakeRedis(result=[3, 42_001])
    context = _context()
    decision = asyncio.run(
        DistributedRateLimiter(redis, namespace="psychs:test").check(
            context, "evidence-ingest", limit=5, window_seconds=60
        )
    )
    assert decision.allowed is True
    assert decision.remaining == 2
    assert decision.retry_after_seconds == 43
    key = redis.calls[0][2]
    assert str(context.tenant_id) not in key
    assert str(context.principal_id) not in key


def test_distributed_rate_limit_denies_exhausted_budget_and_fails_closed():
    decision = asyncio.run(
        DistributedRateLimiter(_FakeRedis(result=[6, 1_000]), namespace="psychs:test").check(
            _context(), "evidence-ingest", limit=5, window_seconds=60
        )
    )
    assert decision.allowed is False
    assert decision.remaining == 0
    assert decision.retry_after_seconds == 1

    limiter = DistributedRateLimiter(
        _FakeRedis(error=ConnectionError("unavailable")), namespace="psychs:test"
    )
    with pytest.raises(RateLimitUnavailable):
        asyncio.run(limiter.check(_context(), "evidence-ingest", limit=5, window_seconds=60))
