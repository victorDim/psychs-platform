"""ASGI request-size enforcement that also covers chunked request bodies."""

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .metrics import record_api_protection_event


class _RequestBodyTooLarge(Exception):
    pass


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp, *, max_body_bytes: int) -> None:
        if max_body_bytes <= 0:
            raise ValueError("max_body_bytes must be positive")
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def _reject(self, scope: Scope, receive: Receive, send: Send, status_code: int, detail: str) -> None:
        response = JSONResponse({"detail": detail}, status_code=status_code)
        await response(scope, receive, send)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        content_lengths = [value for name, value in scope.get("headers", []) if name.lower() == b"content-length"]
        if content_lengths:
            try:
                parsed_lengths = {int(value.decode("ascii")) for value in content_lengths}
            except (UnicodeDecodeError, ValueError):
                await self._reject(scope, receive, send, 400, "Invalid Content-Length header")
                return
            if len(parsed_lengths) != 1 or next(iter(parsed_lengths)) < 0:
                await self._reject(scope, receive, send, 400, "Invalid Content-Length header")
                return
            if next(iter(parsed_lengths)) > self.max_body_bytes:
                record_api_protection_event("request_body", "rejected")
                await self._reject(scope, receive, send, 413, "Request body exceeds the configured limit")
                return

        received_bytes = 0
        response_started = False

        async def limited_receive() -> Message:
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self.max_body_bytes:
                    raise _RequestBodyTooLarge
            return message

        async def tracked_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except _RequestBodyTooLarge:
            if response_started:
                raise RuntimeError("Request body limit exceeded after the response started")
            record_api_protection_event("request_body", "rejected")
            await self._reject(scope, receive, send, 413, "Request body exceeds the configured limit")
