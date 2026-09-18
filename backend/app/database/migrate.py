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


def provision_application_role(owner_url: str, role: str, password: str) -> None:
    if not re.fullmatch(r"[a-z_][a-z0-9_]{2,62}", role):
        raise RuntimeError("DATABASE_APP_USER must be a safe PostgreSQL role name")
    if len(password) < 20:
        raise RuntimeError("DATABASE_APP_PASSWORD must contain at least 20 characters")

    psycopg_url = owner_url.replace("postgresql+psycopg://", "postgresql://", 1)
    with psycopg.connect(psycopg_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (role,))
            role_exists = cursor.fetchone() is not None
            if not role_exists:
                cursor.execute(
                    sql.SQL("CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS").format(
                        sql.Identifier(role), sql.Literal(password)
                    )
                )
            else:
                cursor.execute(
                    sql.SQL("ALTER ROLE {} PASSWORD {} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS").format(
                        sql.Identifier(role), sql.Literal(password)
                    )
                )

            cursor.execute("SELECT current_database()")
            database_name = cursor.fetchone()[0]
            cursor.execute(
                sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
                    sql.Identifier(database_name), sql.Identifier(role)
                )
            )
            cursor.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(sql.Identifier(role)))
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


def main() -> None:
    owner_url = _required("MIGRATION_DATABASE_URL")
    config = Config(os.path.join(os.path.dirname(__file__), "..", "..", "alembic.ini"))
    command.upgrade(config, "head")
    provision_application_role(
        owner_url=owner_url,
        role=_required("DATABASE_APP_USER"),
        password=_required("DATABASE_APP_PASSWORD"),
    )


if __name__ == "__main__":
    main()
