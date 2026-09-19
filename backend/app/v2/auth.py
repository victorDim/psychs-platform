"""OIDC access-token verification for API v2."""

from dataclasses import dataclass
from datetime import datetime, timezone
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
    principal_type: str
    token_id: str | None
    issued_at: datetime
    expires_at: datetime
    auth_time: datetime | None
    acr: str | None
    amr: FrozenSet[str]


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
            if isinstance(raw_scopes, str):
                scopes = raw_scopes.split()
            elif isinstance(raw_scopes, (list, tuple, set)) and all(isinstance(value, str) for value in raw_scopes):
                scopes = list(raw_scopes)
            else:
                raise AuthenticationError("Access token scope claim is invalid")
            issued_at = datetime.fromtimestamp(int(claims["iat"]), tz=timezone.utc)
            expires_at = datetime.fromtimestamp(int(claims["exp"]), tz=timezone.utc)
            lifetime = (expires_at - issued_at).total_seconds()
            if lifetime <= 0 or lifetime > self._settings.oidc_max_token_lifetime_seconds:
                raise AuthenticationError("Access token lifetime exceeds policy")

            token_id_value = claims.get("jti")
            token_id = str(token_id_value).strip() if token_id_value is not None else None
            if token_id and len(token_id) > 255:
                raise AuthenticationError("Access token identifier is invalid")
            if self._settings.oidc_require_jti and not token_id:
                raise AuthenticationError("Access token identifier is required")

            raw_amr = claims.get("amr", [])
            if isinstance(raw_amr, str):
                amr_values = raw_amr.split()
            elif isinstance(raw_amr, (list, tuple, set)) and all(isinstance(value, str) for value in raw_amr):
                amr_values = list(raw_amr)
            else:
                raise AuthenticationError("Access token authentication-method claim is invalid")
            auth_time_value = claims.get("auth_time")
            auth_time = (
                datetime.fromtimestamp(int(auth_time_value), tz=timezone.utc)
                if auth_time_value is not None
                else None
            )
            explicit_type = str(claims.get("principal_type", "")).strip().lower()
            service_markers = {
                str(claims.get("gty", "")).strip().lower(),
                str(claims.get("idtyp", "")).strip().lower(),
            }
            inferred_service = bool(service_markers.intersection({"client-credentials", "app", "service"}))
            if explicit_type and explicit_type not in {"human", "service"}:
                raise AuthenticationError("Token principal type is invalid")
            if explicit_type == "human" and inferred_service:
                raise AuthenticationError("Token principal type conflicts with service grant")
            principal_type = explicit_type or ("service" if inferred_service else "human")
            acr_value = claims.get("acr")
            return VerifiedIdentity(
                subject=subject,
                tenant_id=tenant_id,
                scopes=frozenset(map(str, scopes)),
                principal_type=principal_type,
                token_id=token_id,
                issued_at=issued_at,
                expires_at=expires_at,
                auth_time=auth_time,
                acr=str(acr_value).strip() if acr_value is not None else None,
                amr=frozenset(str(value).strip().lower() for value in amr_values if str(value).strip()),
            )
        except AuthenticationError:
            raise
        except Exception as exc:
            raise AuthenticationError("Invalid access token") from exc
