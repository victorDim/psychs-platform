"""Security and bounded-I/O tests for production source snapshots."""

import socket

import pytest

from app.ingestion.ssrf_guard import resolve_public_target
from app.v2 import source_snapshot
from app.v2.source_snapshot import (
    SourceSnapshotPermanentError,
    SourceSnapshotTemporaryError,
    fetch_source_snapshot,
)


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
