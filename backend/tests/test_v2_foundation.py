"""Dependency-free tests for v2 context, policy, and migration invariants."""

from dataclasses import FrozenInstanceError
from pathlib import Path
from uuid import uuid4

from app.v2.context import RequestContext
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


def test_v2_migration_forces_rls_with_write_checks():
    migration = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "versions"
        / "0001_v2_control_plane.py"
    ).read_text(encoding="utf-8")
    assert "FORCE ROW LEVEL SECURITY" in migration
    assert "WITH CHECK" in migration
    assert "current_setting('app.current_tenant_id', true)" in migration
    assert "audit_events_append_only" in migration
