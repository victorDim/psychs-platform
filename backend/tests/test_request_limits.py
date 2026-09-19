"""Tests for request-size enforcement, including transfer without Content-Length."""

import asyncio
import json

from app.v2.request_limits import RequestBodyLimitMiddleware


def _exercise(*, chunks: list[bytes], headers: list[tuple[bytes, bytes]] | None = None, limit: int = 8):
    received_messages = [
        {"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1}
        for index, chunk in enumerate(chunks)
    ]
    sent_messages = []
    app_called = False

    async def receive():
        return received_messages.pop(0)

    async def send(message):
        sent_messages.append(message)

    async def consuming_app(_scope, app_receive, app_send):
        nonlocal app_called
        app_called = True
        while True:
            message = await app_receive()
            if not message.get("more_body", False):
                break
        await app_send({"type": "http.response.start", "status": 204, "headers": []})
        await app_send({"type": "http.response.body", "body": b""})

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "https",
        "path": "/api/v2/test",
        "raw_path": b"/api/v2/test",
        "query_string": b"",
        "headers": headers or [],
        "client": ("127.0.0.1", 1234),
        "server": ("test", 443),
    }
    middleware = RequestBodyLimitMiddleware(consuming_app, max_body_bytes=limit)
    asyncio.run(middleware(scope, receive, send))
    status = next(message["status"] for message in sent_messages if message["type"] == "http.response.start")
    body = b"".join(message.get("body", b"") for message in sent_messages if message["type"] == "http.response.body")
    return status, body, app_called


def test_rejects_declared_oversized_body_before_application_execution():
    status, body, app_called = _exercise(chunks=[b"ignored"], headers=[(b"content-length", b"9")])
    assert status == 413
    assert json.loads(body)["detail"] == "Request body exceeds the configured limit"
    assert app_called is False


def test_rejects_chunked_body_when_accumulated_bytes_exceed_limit():
    status, body, app_called = _exercise(chunks=[b"12345", b"6789"])
    assert status == 413
    assert json.loads(body)["detail"] == "Request body exceeds the configured limit"
    assert app_called is True


def test_allows_body_at_exact_limit_and_rejects_ambiguous_length():
    status, _, app_called = _exercise(chunks=[b"1234", b"5678"], headers=[(b"content-length", b"8")])
    assert status == 204
    assert app_called is True

    status, body, app_called = _exercise(
        chunks=[b"ignored"],
        headers=[(b"content-length", b"7"), (b"content-length", b"8")],
    )
    assert status == 400
    assert json.loads(body)["detail"] == "Invalid Content-Length header"
    assert app_called is False
