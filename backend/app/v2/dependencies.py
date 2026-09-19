"""FastAPI dependencies for identity, membership, context, and policy."""

import hashlib
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Callable
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import AuthenticationError, OIDCAuthenticator
from .context import RequestContext
from .database import get_session, set_tenant_context
from .models import Membership, RevokedAccessToken, User
from .policy import authorize
from .settings import get_v2_settings


bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_authenticator() -> OIDCAuthenticator:
    return OIDCAuthenticator(get_v2_settings())


async def get_request_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> RequestContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        identity = get_authenticator().verify(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        ) from exc

    await set_tenant_context(session, str(identity.tenant_id))
    if identity.token_id:
        token_hash = hashlib.sha256(identity.token_id.encode("utf-8")).hexdigest()
        revoked = (
            await session.execute(
                select(RevokedAccessToken.id).where(
                    RevokedAccessToken.tenant_id == identity.tenant_id,
                    RevokedAccessToken.token_hash == token_hash,
                    RevokedAccessToken.expires_at > datetime.now(timezone.utc) - timedelta(seconds=30),
                )
            )
        ).scalar_one_or_none()
        if revoked is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
                headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
            )
    result = await session.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(
            Membership.tenant_id == identity.tenant_id,
            Membership.active.is_(True),
            User.external_subject == identity.subject,
            User.principal_type == identity.principal_type,
            User.active.is_(True),
        )
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active tenant membership required")
    membership, user = row
    request_id = getattr(request.state, "request_id", "") or request.headers.get("X-Request-ID", "").strip() or str(uuid4())
    if len(request_id) > 64:
        request_id = str(uuid4())
    context = RequestContext(
        request_id=request_id,
        principal_id=user.id,
        external_subject=identity.subject,
        tenant_id=identity.tenant_id,
        membership_id=membership.id,
        role=membership.role,
        scopes=identity.scopes,
        principal_type=identity.principal_type,
        token_id=identity.token_id,
        token_expires_at=identity.expires_at,
        auth_time=identity.auth_time,
        acr=identity.acr,
        amr=identity.amr,
    )
    request.state.context = context
    return context


def _has_recent_step_up(context: RequestContext) -> bool:
    settings = get_v2_settings()
    if context.principal_type != "human" or context.auth_time is None:
        return False
    now = datetime.now(timezone.utc)
    if context.auth_time > now + timedelta(seconds=30):
        return False
    if context.auth_time < now - timedelta(seconds=settings.oidc_step_up_max_age_seconds):
        return False
    acr_match = bool(context.acr and context.acr in settings.oidc_step_up_acr_values)
    amr_match = bool(context.amr.intersection(settings.oidc_step_up_amr_values))
    return acr_match or amr_match


def require_permission(permission: str, *, step_up: bool = False, human_only: bool = False) -> Callable:
    async def dependency(context: RequestContext = Depends(get_request_context)) -> RequestContext:
        decision = authorize(context, permission)
        if not decision.allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=decision.reason)
        if human_only and context.principal_type != "human":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="human_principal_required")
        if step_up and not _has_recent_step_up(context):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="step_up_authentication_required",
                headers={"WWW-Authenticate": 'Bearer error="insufficient_user_authentication"'},
            )
        return context

    return dependency
