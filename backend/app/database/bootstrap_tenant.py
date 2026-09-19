"""Idempotently provision the first human membership for an OIDC tenant.

This is an explicit operator command. It uses the migration-owner credential,
which must never be mounted into the API or worker runtime.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from uuid import UUID, uuid4

import psycopg


ROLES = frozenset(
    {
        "viewer",
        "analyst",
        "brand_manager",
        "approver",
        "security_admin",
        "billing_admin",
        "platform_admin",
    }
)


def _required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    if "\x00" in value:
        raise RuntimeError(f"{name} contains invalid characters")
    return value


@dataclass(frozen=True, slots=True)
class BootstrapSettings:
    database_url: str
    environment: str
    tenant_slug: str
    tenant_name: str
    external_subject: str
    email: str | None
    role: str

    @classmethod
    def from_environment(cls) -> "BootstrapSettings":
        environment = _required("PSYCHS_ENVIRONMENT").lower()
        tenant_slug = _required("PSYCHS_BOOTSTRAP_TENANT_SLUG").lower()
        settings = cls(
            database_url=_required("MIGRATION_DATABASE_URL").replace(
                "postgresql+psycopg://", "postgresql://", 1
            ),
            environment=environment,
            tenant_slug=tenant_slug,
            tenant_name=_required("PSYCHS_BOOTSTRAP_TENANT_NAME"),
            external_subject=_required("PSYCHS_BOOTSTRAP_EXTERNAL_SUBJECT"),
            email=os.environ.get("PSYCHS_BOOTSTRAP_EMAIL", "").strip() or None,
            role=os.environ.get("PSYCHS_BOOTSTRAP_ROLE", "platform_admin").strip().lower(),
        )
        if environment not in {"development", "test", "staging", "production"}:
            raise RuntimeError("PSYCHS_ENVIRONMENT is invalid")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", tenant_slug) or len(tenant_slug) > 80:
            raise RuntimeError("PSYCHS_BOOTSTRAP_TENANT_SLUG must be a valid slug")
        if len(settings.tenant_name) > 255:
            raise RuntimeError("PSYCHS_BOOTSTRAP_TENANT_NAME must contain at most 255 characters")
        if len(settings.external_subject) > 255:
            raise RuntimeError("PSYCHS_BOOTSTRAP_EXTERNAL_SUBJECT must contain at most 255 characters")
        if settings.email and (len(settings.email) > 320 or "@" not in settings.email):
            raise RuntimeError("PSYCHS_BOOTSTRAP_EMAIL must be a valid bounded email address")
        if settings.role not in ROLES:
            raise RuntimeError("PSYCHS_BOOTSTRAP_ROLE is invalid")
        if environment in {"staging", "production"}:
            confirmation = os.environ.get("PSYCHS_BOOTSTRAP_CONFIRM", "").strip()
            if confirmation != tenant_slug:
                raise RuntimeError(
                    "PSYCHS_BOOTSTRAP_CONFIRM must exactly match the tenant slug in staging and production"
                )
        return settings


def bootstrap_tenant(settings: BootstrapSettings) -> tuple[UUID, UUID, bool]:
    tenant_id, user_id = uuid4(), uuid4()
    membership_created = False
    with psycopg.connect(settings.database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO tenants (id, slug, name)
                VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
                """,
                (tenant_id, settings.tenant_slug, settings.tenant_name),
            )
            inserted_tenant = cursor.fetchone()
            if inserted_tenant:
                tenant_id = inserted_tenant[0]
            else:
                cursor.execute("SELECT id, name, status FROM tenants WHERE slug = %s", (settings.tenant_slug,))
                existing_tenant = cursor.fetchone()
                if existing_tenant is None or existing_tenant[2] != "active":
                    raise RuntimeError("Existing tenant is unavailable")
                if existing_tenant[1] != settings.tenant_name:
                    raise RuntimeError("Existing tenant name does not match bootstrap input")
                tenant_id = existing_tenant[0]

            cursor.execute(
                """
                INSERT INTO users (id, external_subject, email, principal_type)
                VALUES (%s, %s, %s, 'human')
                ON CONFLICT (external_subject) DO NOTHING
                RETURNING id
                """,
                (user_id, settings.external_subject, settings.email),
            )
            inserted_user = cursor.fetchone()
            if inserted_user:
                user_id = inserted_user[0]
            else:
                cursor.execute(
                    "SELECT id, active, principal_type, email FROM users WHERE external_subject = %s",
                    (settings.external_subject,),
                )
                existing_user = cursor.fetchone()
                if existing_user is None or not existing_user[1] or existing_user[2] != "human":
                    raise RuntimeError("Existing OIDC subject is unavailable or is not a human principal")
                if settings.email and existing_user[3] != settings.email:
                    raise RuntimeError("Existing OIDC subject email does not match bootstrap input")
                user_id = existing_user[0]

            cursor.execute(
                """
                INSERT INTO memberships (tenant_id, user_id, role)
                VALUES (%s, %s, %s)
                ON CONFLICT (tenant_id, user_id) DO NOTHING
                RETURNING id
                """,
                (tenant_id, user_id, settings.role),
            )
            membership_created = cursor.fetchone() is not None
            if not membership_created:
                cursor.execute(
                    "SELECT role, active FROM memberships WHERE tenant_id = %s AND user_id = %s",
                    (tenant_id, user_id),
                )
                membership = cursor.fetchone()
                if membership is None or not membership[1] or membership[0] != settings.role:
                    raise RuntimeError("Existing membership does not match bootstrap role")
            else:
                cursor.execute(
                    """
                    INSERT INTO audit_events (
                        tenant_id, actor_user_id, request_id, action,
                        resource_type, resource_id, payload
                    ) VALUES (%s, %s, %s, 'tenant.bootstrap_completed', 'tenant', %s, '{}'::jsonb)
                    """,
                    (tenant_id, user_id, f"bootstrap:{uuid4()}", tenant_id),
                )
    return tenant_id, user_id, membership_created


def main() -> None:
    settings = BootstrapSettings.from_environment()
    tenant_id, user_id, membership_created = bootstrap_tenant(settings)
    outcome = "created" if membership_created else "already_exists"
    print(f"tenant_bootstrap={outcome} tenant_id={tenant_id} user_id={user_id}")


if __name__ == "__main__":
    main()
