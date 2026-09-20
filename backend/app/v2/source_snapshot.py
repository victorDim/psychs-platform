"""Bounded, DNS-pinned source acquisition for durable evidence snapshots."""

from __future__ import annotations

import http.client
import socket
import ssl
import time
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit

from app.ingestion.ssrf_guard import ALLOWED_CONTENT_TYPES, resolve_public_target


REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})


class SourceSnapshotPermanentError(RuntimeError):
    """The source or response violates a policy that retries cannot repair."""


class SourceSnapshotTemporaryError(RuntimeError):
    """The source could not be reached because of a transient failure."""


@dataclass(frozen=True, slots=True)
class SourceSnapshotResponse:
    requested_url: str
    final_url: str
    status_code: int
    content_type: str
    charset: str
    body: bytes


class _PinnedHTTPSConnection(http.client.HTTPSConnection):
    def __init__(self, hostname: str, address: str, port: int, timeout: float):
        super().__init__(hostname, port=port, timeout=timeout, context=ssl.create_default_context())
        self._address = address

    def connect(self) -> None:
        raw_socket = socket.create_connection((self._address, self.port), self.timeout)
        self.sock = self._context.wrap_socket(raw_socket, server_hostname=self.host)


def _request_once(url: str, timeout_seconds: float):
    parsed = urlsplit(url)
    target = resolve_public_target(url)
    address = target.addresses[0]
    if parsed.scheme == "https":
        connection = _PinnedHTTPSConnection(target.hostname, address, target.port, timeout_seconds)
    else:
        connection = http.client.HTTPConnection(address, port=target.port, timeout=timeout_seconds)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    default_port = 443 if parsed.scheme == "https" else 80
    display_host = f"[{target.hostname}]" if ":" in target.hostname else target.hostname
    host_header = display_host if target.port == default_port else f"{display_host}:{target.port}"
    connection.request(
        "GET",
        path,
        headers={
            "Host": host_header,
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9",
            "User-Agent": "Psychs-Source-Snapshot/2.0 (+https://psychs.ai/crawler)",
            "Connection": "close",
        },
    )
    return connection, connection.getresponse()


def fetch_source_snapshot(
    url: str,
    *,
    timeout_seconds: float,
    max_bytes: int,
    max_redirects: int = 3,
) -> SourceSnapshotResponse:
    """Fetch public text with DNS pinning and strict redirect/size policies."""
    current_url = url
    deadline = time.monotonic() + timeout_seconds
    try:
        for redirect_count in range(max_redirects + 1):
            remaining_seconds = deadline - time.monotonic()
            if remaining_seconds <= 0:
                raise SourceSnapshotTemporaryError("Public source request timed out")
            connection, response = _request_once(current_url, remaining_seconds)
            try:
                if response.status in REDIRECT_STATUSES:
                    if redirect_count >= max_redirects:
                        raise SourceSnapshotPermanentError("Source redirect limit exceeded")
                    location = response.getheader("Location", "").strip()
                    if not location:
                        raise SourceSnapshotPermanentError("Source redirect omitted Location")
                    current_url = urljoin(current_url, location)
                    continue
                if response.status == 429 or 500 <= response.status <= 599:
                    raise SourceSnapshotTemporaryError(f"Source returned HTTP {response.status}")
                if not 200 <= response.status <= 299:
                    raise SourceSnapshotPermanentError(f"Source returned HTTP {response.status}")
                content_type_header = response.getheader("Content-Type", "text/plain")
                content_type = content_type_header.split(";", 1)[0].strip().lower()
                if content_type not in ALLOWED_CONTENT_TYPES:
                    raise SourceSnapshotPermanentError("Source content type is not permitted")
                content_length = response.getheader("Content-Length")
                if content_length:
                    try:
                        if int(content_length) > max_bytes:
                            raise SourceSnapshotPermanentError("Source response exceeds the byte limit")
                    except ValueError as exc:
                        raise SourceSnapshotPermanentError("Source Content-Length is invalid") from exc
                body_parts: list[bytes] = []
                body_length = 0
                while body_length <= max_bytes:
                    remaining_seconds = deadline - time.monotonic()
                    if remaining_seconds <= 0:
                        raise SourceSnapshotTemporaryError("Public source request timed out")
                    if connection.sock is not None:
                        connection.sock.settimeout(remaining_seconds)
                    chunk = response.read(min(65_536, max_bytes + 1 - body_length))
                    if not chunk:
                        break
                    body_parts.append(chunk)
                    body_length += len(chunk)
                body = b"".join(body_parts)
                if len(body) > max_bytes:
                    raise SourceSnapshotPermanentError("Source response exceeds the byte limit")
                charset = "utf-8"
                for parameter in content_type_header.split(";")[1:]:
                    name, separator, value = parameter.strip().partition("=")
                    if separator and name.lower() == "charset":
                        charset = value.strip(' "').lower() or "utf-8"
                try:
                    body.decode(charset)
                except LookupError as exc:
                    raise SourceSnapshotPermanentError("Source declared an unknown charset") from exc
                return SourceSnapshotResponse(url, current_url, response.status, content_type, charset, body)
            finally:
                response.close()
                connection.close()
    except SourceSnapshotPermanentError:
        raise
    except SourceSnapshotTemporaryError:
        raise
    except ValueError as exc:
        raise SourceSnapshotPermanentError(str(exc)) from exc
    except (OSError, socket.timeout, TimeoutError, http.client.HTTPException, ssl.SSLError) as exc:
        raise SourceSnapshotTemporaryError("Public source request failed") from exc
    raise SourceSnapshotPermanentError("Source redirect limit exceeded")
