"""Dependency-backed validation for v2 startup and security contracts."""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from pydantic import ValidationError

from app.v2.auth import AuthenticationError, OIDCAuthenticator
from app.v2.routes import ProjectCreate
from app.v2.settings import V2Settings


class _SigningKey:
    def __init__(self, key):
        self.key = key


class _StaticJwksClient:
    def __init__(self, public_key):
        self.public_key = public_key

    def get_signing_key_from_jwt(self, token):
        return _SigningKey(self.public_key)


def _oidc_fixture():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    settings = V2Settings(
        _env_file=None,
        PSYCHS_ENVIRONMENT="test",
        PSYCHS_OIDC_ISSUER="https://identity.example.test/",
        PSYCHS_OIDC_AUDIENCE="psychs-api",
        PSYCHS_OIDC_JWKS_URL="https://identity.example.test/.well-known/jwks.json",
        PSYCHS_OIDC_ALGORITHMS="RS256",
    )
    authenticator = OIDCAuthenticator(settings)
    authenticator._jwks = _StaticJwksClient(private_key.public_key())
    return private_key, authenticator


def _token(private_key, **overrides):
    now = datetime.now(timezone.utc)
    claims = {
        "sub": "oidc|security-test",
        "tenant_id": str(uuid4()),
        "scope": "projects:read projects:write",
        "iss": "https://identity.example.test/",
        "aud": "psychs-api",
        "iat": now,
        "exp": now + timedelta(minutes=5),
    }
    claims.update(overrides)
    return jwt.encode(claims, private_key, algorithm="RS256", headers={"kid": "test-key"})


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


def test_oidc_verifies_signature_claims_tenant_and_scopes():
    private_key, authenticator = _oidc_fixture()
    identity = authenticator.verify(_token(private_key))
    assert identity.subject == "oidc|security-test"
    assert identity.scopes == frozenset({"projects:read", "projects:write"})


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "different-api"},
        {"iss": "https://attacker.example/"},
        {"exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        {"tenant_id": "not-a-uuid"},
        {"tenant_id": None},
    ],
)
def test_oidc_rejects_invalid_or_expired_claims(overrides):
    private_key, authenticator = _oidc_fixture()
    with pytest.raises(AuthenticationError):
        authenticator.verify(_token(private_key, **overrides))


def test_oidc_rejects_token_signed_by_another_key():
    _, authenticator = _oidc_fixture()
    attacker_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with pytest.raises(AuthenticationError):
        authenticator.verify(_token(attacker_key))
