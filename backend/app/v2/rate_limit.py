"""Distributed fixed-window rate limits backed by an atomic Redis script."""

import hashlib
from dataclasses import dataclass
from functools import lru_cache

from redis.asyncio import Redis
from redis.exceptions import RedisError

from .context import RequestContext
from .settings import get_v2_settings


_INCREMENT_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
"""


class RateLimitUnavailable(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    remaining: int
    retry_after_seconds: int


class DistributedRateLimiter:
    def __init__(self, redis: Redis, *, namespace: str) -> None:
        self._redis = redis
        self._namespace = namespace

    async def check(
        self,
        context: RequestContext,
        bucket: str,
        *,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        if limit <= 0 or window_seconds <= 0:
            raise ValueError("Rate-limit policy values must be positive")
        principal_hash = hashlib.sha256(
            f"{context.tenant_id}:{context.principal_id}".encode("utf-8")
        ).hexdigest()[:32]
        key = f"{self._namespace}:rate:{bucket}:{principal_hash}"
        try:
            count, ttl_ms = await self._redis.eval(
                _INCREMENT_SCRIPT,
                1,
                key,
                window_seconds * 1000,
            )
        except RedisError as exc:
            raise RateLimitUnavailable("Distributed rate limiting is unavailable") from exc
        count_value = int(count)
        retry_after = max(1, (int(ttl_ms) + 999) // 1000)
        return RateLimitDecision(
            allowed=count_value <= limit,
            remaining=max(limit - count_value, 0),
            retry_after_seconds=retry_after,
        )

    async def close(self) -> None:
        await self._redis.aclose()


@lru_cache(maxsize=1)
def get_rate_limiter() -> DistributedRateLimiter:
    settings = get_v2_settings()
    if not settings.redis_url:
        raise RateLimitUnavailable("REDIS_URL is required for distributed rate limiting")
    client = Redis.from_url(
        settings.redis_url,
        decode_responses=False,
        socket_connect_timeout=1.0,
        socket_timeout=1.0,
        health_check_interval=30,
    )
    return DistributedRateLimiter(client, namespace=f"psychs:{settings.environment}")


async def close_rate_limiter() -> None:
    if get_rate_limiter.cache_info().currsize:
        limiter = get_rate_limiter()
        await limiter.close()
        get_rate_limiter.cache_clear()
