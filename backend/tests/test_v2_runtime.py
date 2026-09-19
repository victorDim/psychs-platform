"""Dependency-backed validation for v2 startup and security contracts."""

import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from pydantic import ValidationError

from app.v2.auth import AuthenticationError, OIDCAuthenticator
from app.v2.domain_verification import DnsVerificationUnavailable, dns_txt_matches
from app.v2.routes import (
    AuthoritativeSourceCreate,
    DomainVerificationResultResponse,
    EvidenceObservationCreate,
    ProjectCreate,
    TokenRevocationCreate,
)
from app.v2.settings import V2Settings


class _SigningKey:
    def __init__(self, key):
        self.key = key


class _StaticJwksClient:
    def __init__(self, public_key):
        self.public_key = public_key

    def get_signing_key_from_jwt(self, token):
        return _SigningKey(self.public_key)


def _oidc_fixture(**setting_overrides):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    settings = V2Settings(
        _env_file=None,
        PSYCHS_ENVIRONMENT="test",
        PSYCHS_OIDC_ISSUER="https://identity.example.test/",
        PSYCHS_OIDC_AUDIENCE="psychs-api",
        PSYCHS_OIDC_JWKS_URL="https://identity.example.test/.well-known/jwks.json",
        PSYCHS_OIDC_ALGORITHMS="RS256",
        **setting_overrides,
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
        "jti": f"token-{uuid4()}",
        "auth_time": int(now.timestamp()),
        "amr": ["pwd", "mfa"],
    }
    claims.update(overrides)
    return jwt.encode(claims, private_key, algorithm="RS256", headers={"kid": "test-key"})


def test_production_settings_fail_closed_when_incomplete():
    with pytest.raises(ValidationError):
        V2Settings(_env_file=None, PSYCHS_ENVIRONMENT="production")


def test_production_settings_require_revocable_tokens():
    with pytest.raises(ValidationError, match="PSYCHS_OIDC_REQUIRE_JTI"):
        V2Settings(
            _env_file=None,
            PSYCHS_ENVIRONMENT="production",
            PSYCHS_V2_ENABLED=True,
            DATABASE_URL="postgresql://app:secret@example.test/psychs",
            REDIS_URL="rediss://example.test/0",
            PSYCHS_CORS_ALLOWED_ORIGINS="https://app.example.test",
            PSYCHS_OIDC_ISSUER="https://identity.example.test/",
            PSYCHS_OIDC_AUDIENCE="psychs-api",
            PSYCHS_OIDC_JWKS_URL="https://identity.example.test/jwks",
        )


def test_telemetry_configuration_fails_closed_and_requires_tls_in_production():
    with pytest.raises(ValidationError):
        V2Settings(_env_file=None, PSYCHS_ENVIRONMENT="test", OTEL_ENABLED=True)
    with pytest.raises(ValidationError):
        V2Settings(
            _env_file=None,
            PSYCHS_ENVIRONMENT="production",
            PSYCHS_V2_ENABLED=True,
            DATABASE_URL="postgresql://app:secret@example.test/psychs",
            REDIS_URL="rediss://example.test/0",
            PSYCHS_CORS_ALLOWED_ORIGINS="https://app.example.test",
            PSYCHS_OIDC_ISSUER="https://identity.example.test/",
            PSYCHS_OIDC_AUDIENCE="psychs-api",
            PSYCHS_OIDC_JWKS_URL="https://identity.example.test/jwks",
            OTEL_ENABLED=True,
            OTEL_EXPORTER_OTLP_ENDPOINT="http://collector:4318/v1/traces",
        )


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


def test_token_revocation_command_requires_timezone_and_bounded_identifier():
    with pytest.raises(ValidationError, match="timezone"):
        TokenRevocationCreate(token_id="token-identifier", expires_at=datetime.now(), reason="security response")
    with pytest.raises(ValidationError):
        TokenRevocationCreate(
            token_id="short",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
            reason="security response",
        )


def test_domain_verification_result_maps_persisted_challenge_identifier():
    challenge_id = uuid4()
    persisted = SimpleNamespace(
        id=challenge_id,
        status="pending",
        attempt_count=0,
        last_checked_at=None,
        verified_at=None,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    result = DomainVerificationResultResponse.model_validate(persisted)
    assert result.challenge_id == challenge_id


def test_observed_evidence_command_rejects_unbounded_or_untrusted_provenance():
    valid = EvidenceObservationCreate(
        provider="openai",
        model_identifier="gpt-observed",
        provider_request_id="request-123",
        prompt_text="What does Example make?",
        response_text="Example makes production software.",
        citations=["https://example.com/about"],
        observed_at=datetime.now(timezone.utc),
    )
    assert valid.citations == ["https://example.com/about"]
    with pytest.raises(ValidationError, match="timezone"):
        EvidenceObservationCreate(
            provider="openai",
            model_identifier="gpt-observed",
            prompt_text="Prompt",
            response_text="Response",
            observed_at=datetime.now(),
        )
    with pytest.raises(ValidationError, match="credentials"):
        EvidenceObservationCreate(
            provider="openai",
            model_identifier="gpt-observed",
            prompt_text="Prompt",
            response_text="Response",
            citations=["https://user:secret@example.com/source"],
            observed_at=datetime.now(timezone.utc),
        )


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


def test_oidc_enforces_jti_lifetime_and_service_principal_type():
    private_key, authenticator = _oidc_fixture(PSYCHS_OIDC_REQUIRE_JTI=True)
    identity = authenticator.verify(_token(private_key, gty="client-credentials", auth_time=None, amr=["MFA"]))
    assert identity.principal_type == "service"
    assert identity.token_id
    assert identity.amr == frozenset({"mfa"})

    with pytest.raises(AuthenticationError, match="identifier"):
        authenticator.verify(_token(private_key, jti=""))
    with pytest.raises(AuthenticationError, match="lifetime"):
        authenticator.verify(_token(private_key, exp=datetime.now(timezone.utc) + timedelta(hours=2)))
    with pytest.raises(AuthenticationError, match="principal type"):
        authenticator.verify(_token(private_key, principal_type="robot"))
    with pytest.raises(AuthenticationError, match="conflicts"):
        authenticator.verify(_token(private_key, principal_type="human", gty="client-credentials"))
    with pytest.raises(AuthenticationError, match="scope claim"):
        authenticator.verify(_token(private_key, scope={"projects:write": True}))
    with pytest.raises(AuthenticationError, match="authentication-method"):
        authenticator.verify(_token(private_key, amr={"mfa": True}))
