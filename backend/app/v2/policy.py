"""Central deny-by-default v2 authorization policy."""

from dataclasses import dataclass
from typing import Dict, FrozenSet

from .context import RequestContext


VIEW_PROJECTS = "projects:read"
WRITE_PROJECTS = "projects:write"
MANAGE_TENANT = "tenant:manage"
APPROVE_CHANGES = "changes:approve"
MANAGE_SECURITY = "security:manage"
MANAGE_BILLING = "billing:manage"
INGEST_EVIDENCE = "evidence:write"


ROLE_PERMISSIONS: Dict[str, FrozenSet[str]] = {
    "viewer": frozenset({VIEW_PROJECTS}),
    "analyst": frozenset({VIEW_PROJECTS, WRITE_PROJECTS}),
    "brand_manager": frozenset({VIEW_PROJECTS, WRITE_PROJECTS}),
    "approver": frozenset({VIEW_PROJECTS, APPROVE_CHANGES}),
    "security_admin": frozenset({VIEW_PROJECTS, MANAGE_SECURITY, MANAGE_TENANT}),
    "billing_admin": frozenset({VIEW_PROJECTS, MANAGE_BILLING}),
    "platform_admin": frozenset({
        VIEW_PROJECTS,
        WRITE_PROJECTS,
        MANAGE_TENANT,
        APPROVE_CHANGES,
        MANAGE_SECURITY,
        MANAGE_BILLING,
        INGEST_EVIDENCE,
    }),
    "collector": frozenset({VIEW_PROJECTS, INGEST_EVIDENCE}),
}


@dataclass(frozen=True, slots=True)
class AuthorizationDecision:
    allowed: bool
    reason: str


def authorize(context: RequestContext, permission: str) -> AuthorizationDecision:
    role_permissions = ROLE_PERMISSIONS.get(context.role, frozenset())
    if permission not in role_permissions:
        return AuthorizationDecision(False, "role_missing_permission")
    if permission not in context.scopes:
        return AuthorizationDecision(False, "token_missing_scope")
    return AuthorizationDecision(True, "allowed")
