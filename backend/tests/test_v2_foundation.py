"""Dependency-free tests for v2 context, policy, and migration invariants."""

import ast
from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from app.v2.context import RequestContext
from app.v2.dependencies import _has_recent_step_up
from app.v2.policy import VIEW_PROJECTS, WRITE_PROJECTS, authorize


def _context(role: str, scopes=frozenset({VIEW_PROJECTS, WRITE_PROJECTS})) -> RequestContext:
    return RequestContext(
        request_id="req-test-v2",
        principal_id=uuid4(),
        external_subject="oidc|test-user",
        tenant_id=uuid4(),
        membership_id=uuid4(),
        role=role,
        scopes=frozenset(scopes),
        principal_type="human",
        token_id="test-token-id",
        token_expires_at=datetime.now(timezone.utc),
        auth_time=datetime.now(timezone.utc),
        acr=None,
        amr=frozenset({"mfa"}),
    )


def test_v2_request_context_is_immutable():
    context = _context("analyst")
    try:
        context.tenant_id = uuid4()
        raise AssertionError("RequestContext tenant_id was mutable")
    except FrozenInstanceError:
        pass


def test_v2_policy_requires_role_and_scope():
    assert authorize(_context("analyst"), WRITE_PROJECTS).allowed is True
    assert authorize(_context("viewer"), WRITE_PROJECTS).reason == "role_missing_permission"
    assert authorize(_context("analyst", {VIEW_PROJECTS}), WRITE_PROJECTS).reason == "token_missing_scope"
    assert authorize(_context("unknown-role"), VIEW_PROJECTS).allowed is False
    assert _has_recent_step_up(_context("analyst")) is True


def test_step_up_rejects_service_stale_and_unverified_authentication():
    context = _context("admin")
    assert _has_recent_step_up(replace(context, principal_type="service")) is False
    assert _has_recent_step_up(replace(context, auth_time=datetime.now(timezone.utc) - timedelta(hours=1))) is False
    assert _has_recent_step_up(replace(context, acr=None, amr=frozenset({"pwd"}))) is False


def test_v2_migration_forces_rls_with_write_checks():
    versions = Path(__file__).resolve().parents[1] / "migrations" / "versions"
    migrations = {
        path.name: path.read_text(encoding="utf-8")
        for path in versions.glob("*.py")
    }
    for migration_name in ("0001_v2_control_plane.py", "0002_authoritative_sources.py"):
        migration = migrations[migration_name]
        assert "FORCE ROW LEVEL SECURITY" in migration
        assert "WITH CHECK" in migration
        assert "current_setting('app.current_tenant_id', true)" in migration

    foundation = migrations["0001_v2_control_plane.py"]
    sources = migrations["0002_authoritative_sources.py"]
    assert "audit_events_append_only" in foundation
    assert "fk_source_tenant_project" in sources
    assert "fk_domain_challenge_tenant_project" in sources
    assert "token_hash CHAR(64)" in sources
    assert "raw_token" not in sources
    assert "uq_domain_challenge_pending" in sources

    attempts = migrations["0003_domain_verification_attempts.py"]
    assert 'down_revision = "0002_authoritative_sources"' in attempts
    assert "attempt_count >= 0" in attempts

    jobs = migrations["0004_durable_jobs.py"]
    assert 'down_revision = "0003_domain_verify_attempts"' in jobs
    assert "FORCE ROW LEVEL SECURITY" in jobs
    assert "uq_jobs_idempotency" in jobs
    assert "uq_job_attempt_event" in jobs
    assert "prevent_job_history_mutation" in jobs

    identity = migrations["0005_identity_assurance.py"]
    assert 'down_revision = "0004_durable_jobs"' in identity
    assert "principal_type IN ('human', 'service')" in identity
    assert "revoked_access_tokens_tenant_isolation" in identity
    assert "revoked_access_tokens_immutability" in identity
    assert "OLD.expires_at > clock_timestamp() - interval '30 seconds'" in identity

    for migration_name, migration in migrations.items():
        module = ast.parse(migration)
        revision = next(
            node.value.value
            for node in module.body
            if isinstance(node, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id == "revision" for target in node.targets)
            and isinstance(node.value, ast.Constant)
        )
        assert len(revision) <= 32, f"{migration_name} exceeds Alembic's default version_num width"
