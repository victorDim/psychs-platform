"""
================================================================================
Psychs GEO Platform v2.0.0-PROD - Enterprise 5-Tier Role-Based Access Control
================================================================================
Strict RBAC hierarchy enforcing fine-grained enterprise security policies across
tenants, prompt audits, CAB sign-offs, KMS shredding, and billing management.
================================================================================
"""

from enum import Enum
from typing import Dict, List, Set, Optional, Any

class UserRole(Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SECOPS_ADMIN = "SECOPS_ADMIN"
    BRAND_MANAGER = "BRAND_MANAGER"
    CAB_APPROVER = "CAB_APPROVER"
    ANALYST_VIEWER = "ANALYST_VIEWER"

class Permission(Enum):
    # Tenant & Billing Control
    MANAGE_TENANT = "MANAGE_TENANT"
    MANAGE_BILLING = "MANAGE_BILLING"
    EXECUTE_CRYPTO_SHRED = "EXECUTE_CRYPTO_SHRED"
    
    # Security & Audit
    MANAGE_SSO = "MANAGE_SSO"
    MANAGE_USERS = "MANAGE_USERS"
    VIEW_WORM_AUDIT = "VIEW_WORM_AUDIT"
    ROTATE_API_KEYS = "ROTATE_API_KEYS"
    
    # GEO Operations
    TRIGGER_LIVE_AUDIT = "TRIGGER_LIVE_AUDIT"
    TRIGGER_GEO_OPTIMIZER = "TRIGGER_GEO_OPTIMIZER"
    MANAGE_CANARIES = "MANAGE_CANARIES"
    MANAGE_SCHEDULES = "MANAGE_SCHEDULES"
    MANAGE_WEBHOOKS = "MANAGE_WEBHOOKS"
    
    # GitOps CAB
    SIGN_CAB_APPROVAL = "SIGN_CAB_APPROVAL"
    MERGE_GITOPS_PR = "MERGE_GITOPS_PR"
    
    # Read Telemetry
    VIEW_TELEMETRY = "VIEW_TELEMETRY"
    EXPORT_REPORTS = "EXPORT_REPORTS"

ROLE_PERMISSIONS_MATRIX: Dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: {
        Permission.MANAGE_TENANT,
        Permission.MANAGE_BILLING,
        Permission.EXECUTE_CRYPTO_SHRED,
        Permission.MANAGE_SSO,
        Permission.MANAGE_USERS,
        Permission.VIEW_WORM_AUDIT,
        Permission.ROTATE_API_KEYS,
        Permission.TRIGGER_LIVE_AUDIT,
        Permission.TRIGGER_GEO_OPTIMIZER,
        Permission.MANAGE_CANARIES,
        Permission.MANAGE_SCHEDULES,
        Permission.MANAGE_WEBHOOKS,
        Permission.SIGN_CAB_APPROVAL,
        Permission.MERGE_GITOPS_PR,
        Permission.VIEW_TELEMETRY,
        Permission.EXPORT_REPORTS
    },
    UserRole.SECOPS_ADMIN: {
        Permission.MANAGE_SSO,
        Permission.MANAGE_USERS,
        Permission.VIEW_WORM_AUDIT,
        Permission.ROTATE_API_KEYS,
        Permission.EXECUTE_CRYPTO_SHRED,
        Permission.VIEW_TELEMETRY,
        Permission.EXPORT_REPORTS
    },
    UserRole.BRAND_MANAGER: {
        Permission.TRIGGER_LIVE_AUDIT,
        Permission.TRIGGER_GEO_OPTIMIZER,
        Permission.MANAGE_CANARIES,
        Permission.MANAGE_SCHEDULES,
        Permission.MANAGE_WEBHOOKS,
        Permission.VIEW_TELEMETRY,
        Permission.EXPORT_REPORTS
    },
    UserRole.CAB_APPROVER: {
        Permission.SIGN_CAB_APPROVAL,
        Permission.MERGE_GITOPS_PR,
        Permission.VIEW_TELEMETRY,
        Permission.EXPORT_REPORTS
    },
    UserRole.ANALYST_VIEWER: {
        Permission.VIEW_TELEMETRY,
        Permission.EXPORT_REPORTS
    }
}

class RBACManager:
    """Evaluates granular permissions against user roles."""
    
    @staticmethod
    def has_permission(role_name: str, permission: Permission) -> bool:
        try:
            role = UserRole(role_name)
            allowed_perms = ROLE_PERMISSIONS_MATRIX.get(role, set())
            return permission in allowed_perms
        except ValueError:
            return False

    @staticmethod
    def get_role_summary() -> List[Dict[str, Any]]:
        result = []
        for role, perms in ROLE_PERMISSIONS_MATRIX.items():
            result.append({
                "role": role.value,
                "permission_count": len(perms),
                "permissions": [p.value for p in perms]
            })
        return result
