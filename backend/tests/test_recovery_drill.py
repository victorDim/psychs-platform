"""Unit tests for recovery-drill safety boundaries."""

import pytest

from app.database.recovery_drill import (
    _database_name,
    _pg_environment,
    _replace_database,
    _run,
    _validate_target,
)


def test_restore_target_must_be_disposable_and_explicitly_authorized(monkeypatch):
    source = "postgresql://owner:secret@database.example/psychs"
    monkeypatch.delenv("PSYCHS_ALLOW_DESTRUCTIVE_RESTORE_DRILL", raising=False)
    with pytest.raises(RuntimeError, match="ALLOW_DESTRUCTIVE"):
        _validate_target(source, "psychs_restore_drill")

    monkeypatch.setenv("PSYCHS_ALLOW_DESTRUCTIVE_RESTORE_DRILL", "true")
    for unsafe in ("psychs", "psychs_restore", "psychs-restore_restore_drill"):
        with pytest.raises(RuntimeError):
            _validate_target(source, unsafe)
    _validate_target(source, "psychs_restore_drill")


def test_database_url_replacement_preserves_connection_security_options(monkeypatch):
    source = "postgresql+psycopg://owner:p%40ss@db.example:5433/psychs?sslmode=verify-full"
    target = _replace_database(source, "psychs_restore_drill")
    assert _database_name(target) == "psychs_restore_drill"
    environment = _pg_environment(target)
    assert environment["PGHOST"] == "db.example"
    assert environment["PGPORT"] == "5433"
    assert environment["PGUSER"] == "owner"
    assert environment["PGPASSWORD"] == "p@ss"
    assert environment["PGDATABASE"] == "psychs_restore_drill"
    assert environment["PGSSLMODE"] == "verify-full"

    invocation = {}

    def capture(command, **options):
        invocation["command"] = command
        invocation["options"] = options

    monkeypatch.setattr("app.database.recovery_drill.subprocess.run", capture)
    _run(["pg_dump", "--format=custom"], source)
    assert invocation["command"] == ["pg_dump", "--format=custom"]
    assert "p@ss" not in " ".join(invocation["command"])
    assert invocation["options"]["env"]["PGPASSWORD"] == "p@ss"
