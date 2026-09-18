"""Dependency-backed validation for v2 startup and command contracts."""

import pytest
from pydantic import ValidationError

from app.v2.routes import ProjectCreate
from app.v2.settings import V2Settings


def test_production_settings_fail_closed_when_incomplete():
    with pytest.raises(ValidationError):
        V2Settings(_env_file=None, PSYCHS_ENVIRONMENT="production")


def test_oidc_rejects_symmetric_or_unsigned_algorithms():
    for algorithm in ("HS256", "none", ""):
        with pytest.raises(ValidationError):
            V2Settings(_env_file=None, PSYCHS_ENVIRONMENT="test", PSYCHS_OIDC_ALGORITHMS=algorithm)


def test_project_command_forbids_tenant_selection_and_non_domain_urls():
    with pytest.raises(ValidationError):
        ProjectCreate(
            name="Cross tenant attempt",
            slug="cross-tenant",
            canonical_domain="example.com",
            tenant_id="00000000-0000-0000-0000-000000000001",
        )
    with pytest.raises(ValidationError):
        ProjectCreate(name="Bad domain", slug="bad-domain", canonical_domain="example.com/private")

    command = ProjectCreate(name="Valid", slug="valid-project", canonical_domain="https://Example.com/")
    assert command.canonical_domain == "example.com"
