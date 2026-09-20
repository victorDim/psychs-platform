"""Unit tests for durable worker safety and retry policy."""

import pytest

from app.v2.worker import ClaimedJob, WorkerSettings, _safe_job_error, retry_delay_seconds
from uuid import uuid4
from unittest.mock import MagicMock
from datetime import datetime, timezone


def test_disabled_snapshot_feature_does_not_schedule_or_connect(monkeypatch):
    from app.v2 import worker

    def unexpected_connection(*args, **kwargs):
        raise AssertionError("Disabled scheduler attempted database access")

    monkeypatch.setattr(worker.psycopg, "connect", unexpected_connection)
    settings = WorkerSettings(database_url="unused", worker_id="test", source_snapshots_enabled=False)
    assert worker.schedule_daily_source_snapshots(settings) == 0


def test_daily_job_rechecks_withdrawn_policy_before_network_access():
    from app.v2.worker import execute_source_snapshot
    from app.v2.source_snapshot import SourceSnapshotPermanentError

    connection = MagicMock()
    cursor = connection.cursor.return_value.__enter__.return_value
    cursor.fetchone.side_effect = [None, {
        "canonical_url": "https://example.com/", "verification_status": "verified",
        "snapshot_policy": "manual",
    }]
    identifier = uuid4()
    job = ClaimedJob(identifier, identifier, identifier, identifier, "source_snapshot",
                     {"source_id": str(identifier), "trigger": "daily"}, 1, 3)
    fetcher = MagicMock()
    with pytest.raises(SourceSnapshotPermanentError, match="withdrawn"):
        execute_source_snapshot(connection, job, WorkerSettings("unused", "test"), fetcher=fetcher)
    fetcher.assert_not_called()


def test_evidence_snapshot_context_is_bounded_and_explicit_about_relationship():
    from app.v2.worker import select_evidence_snapshot_context

    connection = MagicMock()
    cursor = connection.cursor.return_value.__enter__.return_value
    now = datetime.now(timezone.utc)
    rows = [{"source_id": uuid4(), "snapshot_id": uuid4(), "content_sha256": "a" * 64,
             "fetched_at": now, "retention_expires_at": now} for _ in range(101)]
    cursor.fetchall.return_value = rows
    identifier = uuid4()
    job = ClaimedJob(identifier, identifier, identifier, identifier, "evidence_collection", {}, 1, 3)
    context = select_evidence_snapshot_context(connection, job)
    assert context["relationship"] == "available_at_collection_start"
    assert context["truncated"] is True
    assert len(context["snapshots"]) == context["selection_limit"] == 100
    assert context["snapshots"][0]["snapshot_id"] == str(rows[0]["snapshot_id"])
    cursor.fetchall.return_value = []
    empty = select_evidence_snapshot_context(connection, job)
    assert empty["snapshots"] == []
    assert empty["truncated"] is False


def test_retry_delay_is_exponential_and_capped():
    assert [retry_delay_seconds(attempt, 10, 60) for attempt in range(1, 6)] == [10, 20, 40, 60, 60]


def test_worker_requires_dedicated_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_WORKER_URL", raising=False)
    with pytest.raises(RuntimeError, match="DATABASE_WORKER_URL"):
        WorkerSettings.from_environment()


def test_worker_rejects_unsafe_timing(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_JOB_LEASE_SECONDS", "1")
    with pytest.raises(RuntimeError, match="LEASE_SECONDS"):
        WorkerSettings.from_environment()


def test_worker_rejects_unbounded_retention_batch(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_RETENTION_CLEANUP_BATCH_SIZE", "10001")
    with pytest.raises(RuntimeError, match="CLEANUP_BATCH_SIZE"):
        WorkerSettings.from_environment()


def test_worker_rejects_aggressive_retention_interval(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_RETENTION_CLEANUP_INTERVAL_SECONDS", "59")
    with pytest.raises(RuntimeError, match="CLEANUP_INTERVAL_SECONDS"):
        WorkerSettings.from_environment()


def test_worker_requires_provider_key_when_collection_is_enabled(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_EVIDENCE_COLLECTION_ENABLED", "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        WorkerSettings.from_environment()


def test_worker_rejects_retention_outside_policy(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_EVIDENCE_RETENTION_DAYS", "0")
    with pytest.raises(RuntimeError, match="EVIDENCE_RETENTION_DAYS"):
        WorkerSettings.from_environment()


def test_worker_rejects_unbounded_source_snapshot_download(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_SOURCE_SNAPSHOT_MAX_BYTES", "5242881")
    with pytest.raises(RuntimeError, match="SOURCE_SNAPSHOT_MAX_BYTES"):
        WorkerSettings.from_environment()


def test_worker_rejects_snapshot_timeout_beyond_lease(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_JOB_LEASE_SECONDS", "60")
    monkeypatch.setenv("PSYCHS_SOURCE_SNAPSHOT_TIMEOUT_SECONDS", "60")
    with pytest.raises(RuntimeError, match="snapshot timeout"):
        WorkerSettings.from_environment()


def test_collection_errors_do_not_expose_database_exception_details():
    identifier = uuid4()
    job = ClaimedJob(
        identifier,
        identifier,
        identifier,
        identifier,
        "evidence_collection",
        {"prompt": "customer secret"},
        1,
        3,
    )
    sanitized = _safe_job_error(job, RuntimeError("failed row contains customer secret"))
    assert sanitized == "RuntimeError: Evidence collection failed internally"
    assert "customer secret" not in sanitized


def test_snapshot_internal_errors_do_not_expose_response_details():
    identifier = uuid4()
    job = ClaimedJob(
        identifier, identifier, identifier, identifier,
        "source_snapshot", {"source_id": str(identifier)}, 1, 3,
    )
    sanitized = _safe_job_error(job, RuntimeError("response contained customer secret"))
    assert sanitized == "RuntimeError: Source snapshot failed internally"
    assert "customer secret" not in sanitized
