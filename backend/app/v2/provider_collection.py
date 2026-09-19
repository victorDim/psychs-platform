"""Fail-closed adapters for collecting observed provider responses."""

from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx


MAX_PROVIDER_RESPONSE_BYTES = 1_048_576


class ProviderTemporaryError(RuntimeError):
    """A retryable provider or network failure with a sanitized message."""


class ProviderPermanentError(RuntimeError):
    """A non-retryable provider contract or request failure."""


@dataclass(frozen=True, slots=True)
class ObservedProviderResponse:
    provider: str
    model_identifier: str
    provider_request_id: str
    response_text: str
    citations: tuple[str, ...]


def _citations(payload: dict) -> tuple[str, ...]:
    citations: list[str] = []
    seen: set[str] = set()
    for item in payload.get("output", []):
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict) or content.get("type") != "output_text":
                continue
            for annotation in content.get("annotations", []):
                if not isinstance(annotation, dict) or annotation.get("type") != "url_citation":
                    continue
                url = annotation.get("url")
                if not isinstance(url, str) or len(url) > 2048:
                    continue
                parsed = urlparse(url)
                if parsed.scheme not in {"http", "https"} or not parsed.hostname:
                    continue
                if parsed.username or parsed.password or url in seen:
                    continue
                citations.append(url)
                seen.add(url)
                if len(citations) == 50:
                    return tuple(citations)
    return tuple(citations)


def _output_text(payload: dict) -> str:
    fragments: list[str] = []
    for item in payload.get("output", []):
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if isinstance(content, dict) and content.get("type") == "output_text":
                text = content.get("text")
                if isinstance(text, str) and text:
                    fragments.append(text)
    combined = "\n".join(fragments).strip()
    if not combined:
        raise ProviderPermanentError("Provider returned no observed text")
    if len(combined) > 64_000:
        raise ProviderPermanentError("Provider response exceeded the evidence size limit")
    return combined


def collect_openai_response(
    *,
    api_key: str,
    model: str,
    prompt: str,
    timeout_seconds: float,
    max_output_tokens: int,
    client: httpx.Client | None = None,
) -> ObservedProviderResponse:
    """Call the OpenAI Responses API without storage or synthetic fallback."""
    if not api_key:
        raise ProviderPermanentError("OpenAI collection is not configured")
    owned_client = client is None
    http_client = client or httpx.Client(
        timeout=httpx.Timeout(timeout_seconds, connect=min(timeout_seconds, 5.0)),
        follow_redirects=False,
    )
    try:
        try:
            with http_client.stream(
                "POST",
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "psychs-evidence-collector/2.0",
                },
                json={
                    "model": model,
                    "input": prompt,
                    "tools": [{"type": "web_search"}],
                    "store": False,
                    "max_output_tokens": max_output_tokens,
                },
            ) as response:
                if response.status_code == 429 or response.status_code >= 500:
                    raise ProviderTemporaryError(
                        f"OpenAI returned retryable status {response.status_code}"
                    )
                if response.status_code >= 400:
                    raise ProviderPermanentError(
                        f"OpenAI rejected the request with status {response.status_code}"
                    )
                declared_length = response.headers.get("content-length")
                if declared_length and declared_length.isdigit() and int(declared_length) > MAX_PROVIDER_RESPONSE_BYTES:
                    raise ProviderPermanentError("OpenAI response exceeded the transport size limit")
                raw_response = bytearray()
                for chunk in response.iter_bytes():
                    raw_response.extend(chunk)
                    if len(raw_response) > MAX_PROVIDER_RESPONSE_BYTES:
                        raise ProviderPermanentError("OpenAI response exceeded the transport size limit")
        except (httpx.TimeoutException, httpx.NetworkError) as exc:
            raise ProviderTemporaryError("OpenAI request was unavailable") from exc
        try:
            payload = json.loads(raw_response)
        except (UnicodeDecodeError, ValueError) as exc:
            raise ProviderPermanentError("OpenAI returned malformed JSON") from exc
        if not isinstance(payload, dict):
            raise ProviderPermanentError("OpenAI returned an invalid response object")
        if payload.get("status") not in {None, "completed"}:
            raise ProviderTemporaryError("OpenAI response did not complete")
        response_id = payload.get("id")
        actual_model = payload.get("model")
        if not isinstance(response_id, str) or not response_id or len(response_id) > 255:
            raise ProviderPermanentError("OpenAI response identifier is missing or invalid")
        if not isinstance(actual_model, str) or not actual_model or len(actual_model) > 128:
            raise ProviderPermanentError("OpenAI model identifier is missing or invalid")
        return ObservedProviderResponse(
            provider="openai",
            model_identifier=actual_model,
            provider_request_id=response_id,
            response_text=_output_text(payload),
            citations=_citations(payload),
        )
    finally:
        if owned_client:
            http_client.close()
