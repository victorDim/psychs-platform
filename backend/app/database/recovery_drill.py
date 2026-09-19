"""Destructive, guarded PostgreSQL logical-backup recovery drill.

The drill restores a custom-format dump into a disposable database, verifies
row counts and security controls, and then removes the restored database. It is
intended for CI and scheduled staging recovery exercises, never the live
database itself.
"""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse, urlunparse
from uuid import uuid4

import psycopg
from psycopg import sql

from app.database.migrate import provision_application_role, provision_worker_role


TABLES = (
    "tenants",
    "users",
    "memberships",
    "projects",
    "idempotency_records",
    "audit_events",
    "authoritative_sources",
    "domain_verification_challenges",
    "jobs",
    "job_attempts",
    "job_dead_letters",
    "revoked_access_tokens",
    "evidence_observations",
    "evidence_retention_events",
)
RLS_TABLES = TABLES
TARGET_SUFFIX = "_restore_drill"


def _required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def _normalize_url(url: str) -> str:
    return url.replace("postgresql+psycopg://", "postgresql://", 1)


def _database_name(url: str) -> str:
    parsed = urlparse(_normalize_url(url))
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise RuntimeError("Recovery drill URLs must use PostgreSQL")
    database = unquote(parsed.path.removeprefix("/"))
    if not database:
        raise RuntimeError("Recovery drill URLs must include a database name")
    return database


def _replace_database(url: str, database: str) -> str:
    parsed = urlparse(_normalize_url(url))
    return urlunparse(parsed._replace(path=f"/{database}"))


def _validate_target(source_url: str, target_database: str) -> None:
    if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]{2,62}", target_database):
        raise RuntimeError("RESTORE_DRILL_DATABASE must be a safe PostgreSQL identifier")
    if not target_database.endswith(TARGET_SUFFIX):
        raise RuntimeError(f"RESTORE_DRILL_DATABASE must end with {TARGET_SUFFIX}")
    if _database_name(source_url) == target_database:
        raise RuntimeError("Recovery drill target must not be the source database")
    if os.environ.get("PSYCHS_ALLOW_DESTRUCTIVE_RESTORE_DRILL", "").lower() != "true":
        raise RuntimeError("PSYCHS_ALLOW_DESTRUCTIVE_RESTORE_DRILL=true is required")


def _pg_environment(url: str) -> dict[str, str]:
    """Translate a URL to libpq environment variables without CLI secrets."""
    parsed = urlparse(_normalize_url(url))
    environment = os.environ.copy()
    if parsed.hostname:
        environment["PGHOST"] = parsed.hostname
    if parsed.port:
        environment["PGPORT"] = str(parsed.port)
    if parsed.username:
        environment["PGUSER"] = unquote(parsed.username)
    if parsed.password:
        environment["PGPASSWORD"] = unquote(parsed.password)
    environment["PGDATABASE"] = _database_name(url)
    query = parse_qs(parsed.query)
    for parameter, variable in {
        "sslmode": "PGSSLMODE",
        "sslrootcert": "PGSSLROOTCERT",
        "sslcert": "PGSSLCERT",
        "sslkey": "PGSSLKEY",
    }.items():
        if query.get(parameter):
            environment[variable] = query[parameter][-1]
    return environment


def _run(command: list[str], database_url: str) -> None:
    subprocess.run(
        command,
        check=True,
        env=_pg_environment(database_url),
        stdin=subprocess.DEVNULL,
    )


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as artifact:
        for chunk in iter(lambda: artifact.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _snapshot(connection: psycopg.Connection) -> dict[str, int | str]:
    snapshot: dict[str, int | str] = {}
    with connection.cursor() as cursor:
        cursor.execute("SELECT version_num FROM alembic_version")
        snapshot["alembic_revision"] = cursor.fetchone()[0]
        for table in TABLES:
            cursor.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table)))
            snapshot[table] = cursor.fetchone()[0]
    return snapshot


def _recreate_database(owner_url: str, target_database: str) -> None:
    maintenance_url = _replace_database(owner_url, "postgres")
    with psycopg.connect(maintenance_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = %s AND pid <> pg_backend_pid()",
                (target_database,),
            )
            cursor.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(target_database)))
            cursor.execute(
                sql.SQL("CREATE DATABASE {} TEMPLATE template0").format(sql.Identifier(target_database))
            )


def _drop_database(owner_url: str, target_database: str) -> None:
    maintenance_url = _replace_database(owner_url, "postgres")
    with psycopg.connect(maintenance_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = %s AND pid <> pg_backend_pid()",
                (target_database,),
            )
            cursor.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(target_database)))


def _verify_restored_security(owner_url: str, app_url: str, expected: dict[str, int | str]) -> None:
    with psycopg.connect(owner_url) as connection:
        restored = _snapshot(connection)
        if restored != expected:
            raise RuntimeError(f"Restored control-plane snapshot mismatch: {restored!r} != {expected!r}")
        if int(restored["projects"]) < 1 or int(restored["audit_events"]) < 1:
            raise RuntimeError("Recovery drill requires seeded project and audit-event fixtures")

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT relname, relrowsecurity, relforcerowsecurity
                FROM pg_class
                WHERE relname = ANY(%s) AND relkind = 'r'
                """,
                (list(RLS_TABLES),),
            )
            rls = {name: (enabled, forced) for name, enabled, forced in cursor.fetchall()}
            invalid = [table for table in RLS_TABLES if rls.get(table) != (True, True)]
            if invalid:
                raise RuntimeError(f"Restored RLS controls are incomplete: {', '.join(invalid)}")

            cursor.execute(
                """
                SELECT tenant_id, id FROM projects
                ORDER BY created_at, id
                LIMIT 1
                """
            )
            tenant_id, project_id = cursor.fetchone()
            cursor.execute("SELECT id FROM audit_events ORDER BY created_at, id LIMIT 1")
            audit_event_id = cursor.fetchone()[0]

        try:
            with connection.transaction():
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE audit_events SET action = 'restore-drill.invalid-mutation' WHERE id = %s",
                        (audit_event_id,),
                    )
        except psycopg.errors.RaiseException as error:
            if "append-only" not in str(error):
                raise
        else:
            raise RuntimeError("Restored append-only audit trigger did not reject mutation")

    with psycopg.connect(app_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*) FROM projects")
            if cursor.fetchone()[0] != 0:
                raise RuntimeError("Restored RLS exposed projects without tenant context")
            cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))
            cursor.execute("SELECT count(*) FROM projects WHERE id = %s", (project_id,))
            if cursor.fetchone()[0] != 1:
                raise RuntimeError("Restored RLS hid the project from its owning tenant")
            cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(uuid4()),))
            cursor.execute("SELECT count(*) FROM projects WHERE id = %s", (project_id,))
            if cursor.fetchone()[0] != 0:
                raise RuntimeError("Restored RLS exposed a project across tenant boundaries")


def main() -> None:
    owner_url = _required("MIGRATION_DATABASE_URL")
    app_url = _required("DATABASE_URL")
    app_user = _required("DATABASE_APP_USER")
    app_password = _required("DATABASE_APP_PASSWORD")
    worker_user = _required("DATABASE_WORKER_USER")
    worker_password = _required("DATABASE_WORKER_PASSWORD")
    if app_user == worker_user:
        raise RuntimeError("Recovery drill requires distinct application and worker roles")
    target_database = _required("RESTORE_DRILL_DATABASE")
    _validate_target(owner_url, target_database)

    pg_dump = os.environ.get("PG_DUMP_BIN", "pg_dump")
    pg_restore = os.environ.get("PG_RESTORE_BIN", "pg_restore")
    target_owner_url = _replace_database(owner_url, target_database)
    target_app_url = _replace_database(app_url, target_database)
    keep_database = os.environ.get("PSYCHS_KEEP_RESTORE_DRILL_DATABASE", "").lower() == "true"

    with psycopg.connect(_normalize_url(owner_url)) as source:
        expected = _snapshot(source)

    _recreate_database(owner_url, target_database)
    try:
        with tempfile.TemporaryDirectory(prefix="psychs-recovery-") as temporary_directory:
            backup_path = Path(temporary_directory) / "control-plane.dump"
            _run(
                [
                    pg_dump,
                    "--format=custom",
                    "--no-owner",
                    "--no-privileges",
                    f"--file={backup_path}",
                ],
                owner_url,
            )
            backup_path.chmod(0o600)
            backup_digest = _sha256_file(backup_path)
            _run(
                [
                    pg_restore,
                    "--exit-on-error",
                    "--no-owner",
                    "--no-privileges",
                    f"--dbname={target_database}",
                    str(backup_path),
                ],
                target_owner_url,
            )

        provision_application_role(target_owner_url, app_user, app_password)
        provision_worker_role(target_owner_url, worker_user, worker_password)
        _verify_restored_security(target_owner_url, target_app_url, expected)
        print(
            "PostgreSQL recovery drill passed: "
            f"revision={expected['alembic_revision']} tables={len(TABLES)} sha256={backup_digest}"
        )
    finally:
        if not keep_database:
            _drop_database(owner_url, target_database)


if __name__ == "__main__":
    main()
