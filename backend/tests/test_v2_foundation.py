"""Dependency-free tests for v2 context, policy, and migration invariants."""

import ast
import asyncio
from dataclasses import FrozenInstanceError, replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.v2.context import RequestContext
from app.v2.dependencies import _has_recent_step_up, require_permission
from app.v2.policy import INGEST_EVIDENCE, VIEW_PROJECTS, WRITE_PROJECTS, authorize


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


def test_observed_evidence_ingestion_requires_collector_service_identity():
    service = replace(
        _context("collector", {VIEW_PROJECTS, INGEST_EVIDENCE}),
        principal_type="service",
        auth_time=None,
        amr=frozenset(),
    )
    dependency = require_permission(INGEST_EVIDENCE, service_only=True)
    assert asyncio.run(dependency(service)) is service
    with pytest.raises(HTTPException, match="service_principal_required"):
        asyncio.run(dependency(replace(service, principal_type="human")))
    with pytest.raises(ValueError):
        require_permission(INGEST_EVIDENCE, human_only=True, service_only=True)


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

    evidence = migrations["0006_observed_evidence.py"]
    assert 'down_revision = "0005_identity_assurance"' in evidence
    assert "evidence_class = 'observed'" in evidence
    assert "evidence_observations_tenant_isolation" in evidence
    assert "evidence_observations_immutable" in evidence
    assert "uq_evidence_provider_request" in evidence
    assert "'collector'" in evidence

    retention = migrations["0007_evidence_retention.py"]
    assert 'down_revision = "0006_observed_evidence"' in retention
    assert "FOR UPDATE SKIP LOCKED" in retention
    assert "SECURITY DEFINER" in retention
    assert "SET row_security = off" in retention
    assert "evidence_retention_events_tenant_read" in retention
    assert "evidence_retention_events_immutable" in retention
    assert "REVOKE ALL ON FUNCTION purge_expired_evidence" in retention

    collection = migrations["0008_evidence_collection.py"]
    assert 'down_revision = "0007_evidence_retention"' in collection
    assert "'evidence_collection'" in collection
    assert "fk_evidence_collection_job" in collection
    assert "uq_evidence_collection_job" in collection

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
