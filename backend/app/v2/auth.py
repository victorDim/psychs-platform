"""OIDC access-token verification for API v2."""

from dataclasses import dataclass
from typing import FrozenSet
from uuid import UUID

import jwt
from jwt import PyJWKClient

from .settings import V2Settings


class AuthenticationError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class VerifiedIdentity:
    subject: str
    tenant_id: UUID
    scopes: FrozenSet[str]


class OIDCAuthenticator:
    def __init__(self, settings: V2Settings):
        if not settings.oidc_jwks_url:
            raise AuthenticationError("OIDC is not configured")
        self._settings = settings
        self._jwks = PyJWKClient(settings.oidc_jwks_url, cache_keys=True, lifespan=300)

    def verify(self, token: str) -> VerifiedIdentity:
        try:
            signing_key = self._jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=self._settings.oidc_algorithms,
                audience=self._settings.oidc_audience,
                issuer=self._settings.oidc_issuer,
                leeway=30,
                options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            )
            subject = str(claims["sub"]).strip()
            tenant_claim = claims.get("tenant_id") or claims.get("tid")
            if not subject or not tenant_claim:
                raise AuthenticationError("Token is missing subject or tenant claim")
            tenant_id = UUID(str(tenant_claim))
            raw_scopes = claims.get("scope", claims.get("scp", []))
            scopes = raw_scopes.split() if isinstance(raw_scopes, str) else list(raw_scopes)
            return VerifiedIdentity(subject=subject, tenant_id=tenant_id, scopes=frozenset(map(str, scopes)))
        except AuthenticationError:
            raise
        except Exception as exc:
            raise AuthenticationError("Invalid access token") from exc
