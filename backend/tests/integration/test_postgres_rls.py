"""Live PostgreSQL tests for the tenant-isolation security boundary."""

import os
from uuid import uuid4

import psycopg
import pytest


OWNER_URL = os.environ.get("MIGRATION_DATABASE_URL", "")
APP_URL = os.environ.get("DATABASE_URL", "")

pytestmark = pytest.mark.skipif(
    not OWNER_URL or not APP_URL,
    reason="PostgreSQL integration URLs are not configured",
)


def _seed_two_tenants():
    tenant_a, tenant_b = uuid4(), uuid4()
    user_a, user_b = uuid4(), uuid4()
    membership_a, membership_b = uuid4(), uuid4()
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                "INSERT INTO tenants (id, slug, name) VALUES (%s, %s, %s)",
                [
                    (tenant_a, f"tenant-a-{tenant_a.hex[:8]}", "Tenant A"),
                    (tenant_b, f"tenant-b-{tenant_b.hex[:8]}", "Tenant B"),
                ],
            )
            cursor.executemany(
                "INSERT INTO users (id, external_subject, email) VALUES (%s, %s, %s)",
                [
                    (user_a, f"oidc|{user_a}", "a@example.invalid"),
                    (user_b, f"oidc|{user_b}", "b@example.invalid"),
                ],
            )
            cursor.executemany(
                "INSERT INTO memberships (id, tenant_id, user_id, role) VALUES (%s, %s, %s, 'analyst')",
                [
                    (membership_a, tenant_a, user_a),
                    (membership_b, tenant_b, user_b),
                ],
            )
    return tenant_a, tenant_b, user_a, user_b


def _set_tenant(cursor, tenant_id):
    cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))


def test_rls_denies_missing_context_and_cross_tenant_access():
    tenant_a, tenant_b, user_a, user_b = _seed_two_tenants()
    project_a = uuid4()

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*) FROM tenants")
            assert cursor.fetchone()[0] == 0

            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                VALUES (%s, %s, 'tenant-a-project', 'Tenant A Project', 'a.example.com', %s)
                """,
                (project_a, tenant_a, user_a),
            )
            cursor.execute("SELECT id FROM projects")
            assert cursor.fetchall() == [(project_a,)]

            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute(
                        """
                        INSERT INTO projects (tenant_id, slug, name, canonical_domain, created_by)
                        VALUES (%s, 'forged-project', 'Forged', 'b.example.com', %s)
                        """,
                        (tenant_b, user_b),
                    )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_b)
            cursor.execute("SELECT id FROM projects WHERE id = %s", (project_a,))
            assert cursor.fetchone() is None


def test_audit_events_are_append_only_for_application_role():
    tenant_a, _, user_a, _ = _seed_two_tenants()
    event_id = uuid4()
    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO audit_events
                    (id, tenant_id, actor_user_id, request_id, action, resource_type, payload)
                VALUES (%s, %s, %s, 'req-integration', 'test.created', 'test', '{}'::jsonb)
                """,
                (event_id, tenant_a, user_a),
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute("DELETE FROM audit_events WHERE id = %s", (event_id,))
