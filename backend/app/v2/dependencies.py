"""FastAPI dependencies for identity, membership, context, and policy."""

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
from .models import Membership, User
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    try:
        identity = get_authenticator().verify(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    await set_tenant_context(session, str(identity.tenant_id))
    result = await session.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(
            Membership.tenant_id == identity.tenant_id,
            Membership.active.is_(True),
            User.external_subject == identity.subject,
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
    )
    request.state.context = context
    return context


def require_permission(permission: str) -> Callable:
    async def dependency(context: RequestContext = Depends(get_request_context)) -> RequestContext:
        decision = authorize(context, permission)
        if not decision.allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=decision.reason)
        return context

    return dependency
