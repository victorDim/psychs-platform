"""Run migrations and provision the least-privileged application role.

This command is intended for an explicit deployment job. Owner credentials are
never loaded by the API process.
"""

import os
import re

import psycopg
from alembic import command
from alembic.config import Config
from psycopg import sql


def _required(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def _validate_role_credentials(role: str, password: str, variable_prefix: str) -> None:
    if not re.fullmatch(r"[a-z_][a-z0-9_]{2,62}", role):
        raise RuntimeError(f"{variable_prefix}_USER must be a safe PostgreSQL role name")
    if len(password) < 20:
        raise RuntimeError(f"{variable_prefix}_PASSWORD must contain at least 20 characters")


def _ensure_role(cursor, role: str, password: str, *, bypass_rls: bool) -> None:
    bypass_clause = sql.SQL("BYPASSRLS") if bypass_rls else sql.SQL("NOBYPASSRLS")
    cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (role,))
    command = sql.SQL("ALTER ROLE") if cursor.fetchone() else sql.SQL("CREATE ROLE")
    cursor.execute(
        sql.SQL("{} {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT {}").format(
            command, sql.Identifier(role), sql.Literal(password), bypass_clause
        )
    )


def _grant_connection(cursor, role: str) -> None:
    cursor.execute("SELECT current_database()")
    database_name = cursor.fetchone()[0]
    cursor.execute(
        sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
            sql.Identifier(database_name), sql.Identifier(role)
        )
    )
    cursor.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(sql.Identifier(role)))


def provision_application_role(owner_url: str, role: str, password: str) -> None:
    _validate_role_credentials(role, password, "DATABASE_APP")

    psycopg_url = owner_url.replace("postgresql+psycopg://", "postgresql://", 1)
    with psycopg.connect(psycopg_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            _ensure_role(cursor, role, password, bypass_rls=False)
            _grant_connection(cursor, role)
            cursor.execute(
                sql.SQL("REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {}").format(
                    sql.Identifier(role)
                )
            )
            cursor.execute(
                sql.SQL("GRANT SELECT ON tenants, users, memberships TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT ON idempotency_records, audit_events TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT, UPDATE, DELETE ON authoritative_sources TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT, UPDATE ON domain_verification_challenges TO {}").format(sql.Identifier(role))
            )
            cursor.execute(sql.SQL("GRANT SELECT, INSERT ON jobs TO {}").format(sql.Identifier(role)))
            cursor.execute(
                sql.SQL(
                    "GRANT UPDATE (status, cancellation_requested_at, completed_at, updated_at) ON jobs TO {}"
                ).format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT ON job_attempts, job_dead_letters TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT ON revoked_access_tokens TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT ON evidence_observations TO {}").format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT ON evidence_retention_events TO {}").format(sql.Identifier(role))
            )


def provision_worker_role(owner_url: str, role: str, password: str) -> None:
    """Provision the trusted cross-tenant worker identity with narrow grants."""
    _validate_role_credentials(role, password, "DATABASE_WORKER")
    psycopg_url = owner_url.replace("postgresql+psycopg://", "postgresql://", 1)
    with psycopg.connect(psycopg_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            _ensure_role(cursor, role, password, bypass_rls=True)
            _grant_connection(cursor, role)
            cursor.execute(
                sql.SQL("REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM {}").format(
                    sql.Identifier(role)
                )
            )
            cursor.execute(sql.SQL("GRANT SELECT ON jobs TO {}").format(sql.Identifier(role)))
            cursor.execute(
                sql.SQL(
                    "GRANT UPDATE (status, result, payload, attempt_count, available_at, lease_owner, "
                    "lease_expires_at, last_error, started_at, completed_at, updated_at) ON jobs TO {}"
                ).format(sql.Identifier(role))
            )
            cursor.execute(
                sql.SQL("GRANT SELECT, INSERT ON job_attempts, job_dead_letters TO {}").format(sql.Identifier(role))
            )
            cursor.execute(sql.SQL("GRANT SELECT ON projects TO {}").format(sql.Identifier(role)))
            cursor.execute(sql.SQL("GRANT SELECT ON domain_verification_challenges TO {}").format(sql.Identifier(role)))
            cursor.execute(
                sql.SQL(
                    "GRANT UPDATE (status, verified_at, last_checked_at, attempt_count) "
                    "ON domain_verification_challenges TO {}"
                ).format(sql.Identifier(role))
            )
            cursor.execute(sql.SQL("GRANT INSERT ON audit_events TO {}").format(sql.Identifier(role)))
            cursor.execute(sql.SQL("GRANT INSERT ON evidence_observations TO {}").format(sql.Identifier(role)))
            cursor.execute(
                sql.SQL("GRANT SELECT (id, collection_job_id) ON evidence_observations TO {}").format(
                    sql.Identifier(role)
                )
            )
            cursor.execute(
                sql.SQL(
                    "GRANT EXECUTE ON FUNCTION purge_expired_evidence(INTEGER, VARCHAR) TO {}"
                ).format(sql.Identifier(role))
            )


def main() -> None:
    owner_url = _required("MIGRATION_DATABASE_URL")
    app_user = _required("DATABASE_APP_USER")
    worker_user = _required("DATABASE_WORKER_USER")
    app_password = _required("DATABASE_APP_PASSWORD")
    worker_password = _required("DATABASE_WORKER_PASSWORD")
    if app_user == worker_user:
        raise RuntimeError("DATABASE_APP_USER and DATABASE_WORKER_USER must be distinct roles")
    _validate_role_credentials(app_user, app_password, "DATABASE_APP")
    _validate_role_credentials(worker_user, worker_password, "DATABASE_WORKER")
    config = Config(os.path.join(os.path.dirname(__file__), "..", "..", "alembic.ini"))
    command.upgrade(config, "head")
    provision_application_role(
        owner_url=owner_url,
        role=app_user,
        password=app_password,
    )
    provision_worker_role(
        owner_url=owner_url,
        role=worker_user,
        password=worker_password,
    )


if __name__ == "__main__":
    main()
