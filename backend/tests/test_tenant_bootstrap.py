"""Safety tests for explicit first-tenant provisioning."""

import pytest

from app.database.bootstrap_tenant import BootstrapSettings


def _environment(monkeypatch):
    values = {
        "MIGRATION_DATABASE_URL": "postgresql://owner:secret@database/psychs",
        "PSYCHS_ENVIRONMENT": "development",
        "PSYCHS_BOOTSTRAP_TENANT_SLUG": "acme",
        "PSYCHS_BOOTSTRAP_TENANT_NAME": "Acme",
        "PSYCHS_BOOTSTRAP_EXTERNAL_SUBJECT": "oidc|acme-admin",
        "PSYCHS_BOOTSTRAP_EMAIL": "admin@acme.example",
        "PSYCHS_BOOTSTRAP_ROLE": "platform_admin",
    }
    for name, value in values.items():
        monkeypatch.setenv(name, value)


def test_bootstrap_requires_exact_production_confirmation(monkeypatch):
    _environment(monkeypatch)
    monkeypatch.setenv("PSYCHS_ENVIRONMENT", "production")
    with pytest.raises(RuntimeError, match="CONFIRM"):
        BootstrapSettings.from_environment()
    monkeypatch.setenv("PSYCHS_BOOTSTRAP_CONFIRM", "acme")
    assert BootstrapSettings.from_environment().tenant_slug == "acme"


@pytest.mark.parametrize("slug", ["Acme!", "-acme", "acme_organization", "a" * 81])
def test_bootstrap_rejects_unsafe_tenant_slugs(monkeypatch, slug):
    _environment(monkeypatch)
    monkeypatch.setenv("PSYCHS_BOOTSTRAP_TENANT_SLUG", slug)
    with pytest.raises(RuntimeError, match="valid slug"):
        BootstrapSettings.from_environment()


def test_bootstrap_rejects_unknown_privileged_role(monkeypatch):
    _environment(monkeypatch)
    monkeypatch.setenv("PSYCHS_BOOTSTRAP_ROLE", "superuser")
    with pytest.raises(RuntimeError, match="ROLE"):
        BootstrapSettings.from_environment()
