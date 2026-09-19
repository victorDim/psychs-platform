"""Unit tests for durable worker safety and retry policy."""

import pytest

from app.v2.worker import WorkerSettings, retry_delay_seconds


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
