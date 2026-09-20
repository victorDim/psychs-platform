"""Security and bounded-I/O tests for production source snapshots."""

import socket
import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.ingestion.ssrf_guard import resolve_public_target
from app.v2 import source_snapshot
from app.v2.source_snapshot import (
    SourceSnapshotPermanentError,
    SourceSnapshotTemporaryError,
    fetch_source_snapshot,
)
from app.v2.snapshot_changes import classify_snapshot_change


def _snapshot(**overrides):
    values = dict(
        id=uuid4(), project_id=uuid4(), source_id=uuid4(), collection_job_id=uuid4(),
        requested_url="https://example.com/", final_url="https://example.com/",
        content_sha256="a" * 64, http_status=200, content_type="text/html",
        charset="utf-8", byte_length=10, fetched_at=datetime.now(timezone.utc),
        retention_expires_at=datetime.now(timezone.utc), created_at=datetime.now(timezone.utc),
    )
    values.update(overrides)
    return SimpleNamespace(**values)


@pytest.mark.parametrize(
    "changes,expected",
    [
        ({}, "unchanged"),
        ({"content_sha256": "b" * 64}, "content_changed"),
        ({"final_url": "https://example.com/new"}, "metadata_changed"),
        ({"http_status": 203}, "metadata_changed"),
        ({"content_type": "text/plain"}, "metadata_changed"),
        ({"charset": "ascii"}, "metadata_changed"),
        ({"content_sha256": "b" * 64, "http_status": 203}, "content_changed"),
    ],
)
def test_snapshot_changes_distinguish_bytes_from_response_metadata(changes, expected):
    assert classify_snapshot_change(_snapshot(**changes), _snapshot()) == expected


def test_missing_retained_baseline_is_not_reported_as_unchanged():
    assert classify_snapshot_change(_snapshot(), None) == "baseline_unavailable"


def test_history_compares_last_visible_capture_to_extra_row_without_loading_bodies(monkeypatch):
    from app.v2 import routes

    tenant_id, project_id, source_id = uuid4(), uuid4(), uuid4()
    current = _snapshot(project_id=project_id, source_id=source_id, content_sha256="b" * 64)
    previous = _snapshot(project_id=project_id, source_id=source_id)
    result = SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: [current, previous]))
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    monkeypatch.setattr(routes, "_tenant_source", AsyncMock())
    history = asyncio.run(routes.list_source_snapshots(
        project_id, source_id, limit=1,
        context=SimpleNamespace(tenant_id=tenant_id), session=session,
    ))
    assert len(history) == 1
    assert history[0].change_status == "content_changed"
    assert history[0].baseline_snapshot_id == previous.id
    statement = session.execute.call_args.args[0]
    compiled = statement.compile()
    assert "body_text" not in str(compiled)
    assert tenant_id in compiled.params.values()
    assert project_id in compiled.params.values()
    assert source_id in compiled.params.values()
    assert 2 in compiled.params.values()
    assert "fetched_at DESC, source_snapshots.id DESC" in str(compiled)


def test_history_reports_missing_baseline_and_empty_history(monkeypatch):
    from app.v2 import routes

    monkeypatch.setattr(routes, "_tenant_source", AsyncMock())
    rows = [_snapshot()]
    result = SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: rows))
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    args = dict(project_id=uuid4(), source_id=uuid4(), context=SimpleNamespace(tenant_id=uuid4()), session=session)
    history = asyncio.run(routes.list_source_snapshots(**args))
    assert history[0].change_status == "baseline_unavailable"
    assert history[0].baseline_snapshot_id is None
    rows.clear()
    assert asyncio.run(routes.list_source_snapshots(**args)) == []


class _Response:
    def __init__(self, status=200, body=b"trusted body", headers=None):
        self.status = status
        self._body = body
        self._headers = headers or {"Content-Type": "text/plain; charset=utf-8"}
        self.closed = False
        self._offset = 0

    def getheader(self, name, default=None):
        return self._headers.get(name, default)

    def read(self, amount):
        chunk = self._body[self._offset:self._offset + amount]
        self._offset += len(chunk)
        return chunk

    def close(self):
        self.closed = True


class _Connection:
    def __init__(self):
        self.closed = False
        self.sock = None

    def close(self):
        self.closed = True


def test_resolver_rejects_mixed_public_and_private_dns(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443)),
        ],
    )
    with pytest.raises(ValueError, match="private/reserved"):
        resolve_public_target("https://example.com/")


def test_resolver_returns_only_validated_addresses(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
        ],
    )
    target = resolve_public_target("https://example.com/docs")
    assert target.hostname == "example.com"
    assert target.port == 443
    assert target.addresses == ("93.184.216.34",)


def test_snapshot_fetch_is_bounded_and_hash_input_is_exact_bytes(monkeypatch):
    connection = _Connection()
    response = _Response(body=b"observed source bytes")
    monkeypatch.setattr(source_snapshot, "_request_once", lambda *args: (connection, response))
    observed = fetch_source_snapshot(
        "https://example.com/docs", timeout_seconds=10, max_bytes=1024
    )
    assert observed.body == b"observed source bytes"
    assert observed.final_url == "https://example.com/docs"
    assert response.closed is True
    assert connection.closed is True


def test_snapshot_revalidates_redirect_target(monkeypatch):
    calls = []

    def request_once(url, timeout):
        calls.append(url)
        if len(calls) == 1:
            return _Connection(), _Response(status=302, headers={"Location": "https://redirect.example/path"})
        return _Connection(), _Response()

    monkeypatch.setattr(source_snapshot, "_request_once", request_once)
    observed = fetch_source_snapshot("https://example.com/", timeout_seconds=10, max_bytes=1024)
    assert calls == ["https://example.com/", "https://redirect.example/path"]
    assert observed.final_url == "https://redirect.example/path"


@pytest.mark.parametrize(
    ("response", "error_type"),
    [
        (_Response(status=503), SourceSnapshotTemporaryError),
        (_Response(status=404), SourceSnapshotPermanentError),
        (_Response(headers={"Content-Type": "application/octet-stream"}), SourceSnapshotPermanentError),
        (_Response(body=b"x" * 11), SourceSnapshotPermanentError),
    ],
)
def test_snapshot_classifies_retryable_and_policy_failures(monkeypatch, response, error_type):
    monkeypatch.setattr(source_snapshot, "_request_once", lambda *args: (_Connection(), response))
    with pytest.raises(error_type):
        fetch_source_snapshot("https://example.com/", timeout_seconds=10, max_bytes=10)
