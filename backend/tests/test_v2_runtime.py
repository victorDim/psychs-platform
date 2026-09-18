"""Dependency-backed validation for v2 startup and security contracts."""

import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from pydantic import ValidationError

from app.v2.auth import AuthenticationError, OIDCAuthenticator
from app.v2.domain_verification import DnsVerificationUnavailable, dns_txt_matches
from app.v2.routes import AuthoritativeSourceCreate, ProjectCreate
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


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/admin",
        "http://169.254.169.254/latest/meta-data",
        "https://user:password@example.com/",
        "https://example.com/page#private-fragment",
        "https://example.com:8443/",
    ],
)
def test_authoritative_source_rejects_unsafe_or_noncanonical_urls(url):
    with pytest.raises(ValidationError):
        AuthoritativeSourceCreate(
            canonical_url=url,
            source_type="website",
            owner_label="Security test",
        )


def test_authoritative_source_forbids_tenant_selection_and_normalizes_url():
    with pytest.raises(ValidationError):
        AuthoritativeSourceCreate(
            canonical_url="https://example.com/",
            source_type="website",
            owner_label="Cross tenant attempt",
            tenant_id="00000000-0000-0000-0000-000000000001",
        )

    command = AuthoritativeSourceCreate(
        canonical_url="HTTPS://Example.COM/docs?version=2",
        source_type="documentation",
        owner_label="Product documentation",
    )
    assert command.canonical_url == "https://example.com/docs?version=2"


class _TxtRecord:
    def __init__(self, *chunks: bytes):
        self.strings = chunks


class _TxtResolver:
    def __init__(self, result=None, error=None):
        self.result = result or []
        self.error = error
        self.calls = []

    async def resolve(self, name, rdtype, **kwargs):
        self.calls.append((name, rdtype, kwargs))
        if self.error:
            raise self.error
        return self.result


def test_dns_verification_matches_chunked_txt_token_with_bounded_query():
    token = "one-time-domain-token"
    resolver = _TxtResolver([_TxtRecord(b"psychs-verification=one-time-", b"domain-token")])
    matched = asyncio.run(
        dns_txt_matches(
            "_psychs-verification.example.com",
            hashlib.sha256(token.encode()).hexdigest(),
            resolver=resolver,
        )
    )
    assert matched is True
    _, record_type, options = resolver.calls[0]
    assert record_type == "TXT"
    assert options["lifetime"] == 3.0
    assert options["search"] is False


def test_dns_verification_rejects_wrong_token_and_surfaces_resolver_failure():
    resolver = _TxtResolver([_TxtRecord(b"psychs-verification=wrong")])
    matched = asyncio.run(
        dns_txt_matches(
            "_psychs-verification.example.com",
            hashlib.sha256(b"expected").hexdigest(),
            resolver=resolver,
        )
    )
    assert matched is False

    import dns.exception

    with pytest.raises(DnsVerificationUnavailable):
        asyncio.run(
            dns_txt_matches(
                "_psychs-verification.example.com",
                hashlib.sha256(b"expected").hexdigest(),
                resolver=_TxtResolver(error=dns.exception.Timeout()),
            )
        )


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
