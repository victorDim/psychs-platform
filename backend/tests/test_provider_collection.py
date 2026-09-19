"""Contract tests for fail-closed observed provider collection."""

import httpx
import pytest

from app.v2.provider_collection import (
    ProviderPermanentError,
    ProviderTemporaryError,
    collect_openai_response,
)


def _client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_openai_collection_preserves_observed_text_request_id_and_citations():
    def handler(request):
        assert request.url == "https://api.openai.com/v1/responses"
        assert b'"store":false' in request.content
        return httpx.Response(200, json={
            "id": "resp_observed_123",
            "status": "completed",
            "model": "gpt-5",
            "output": [{
                "type": "message",
                "content": [{
                    "type": "output_text",
                    "text": "Observed provider answer.",
                    "annotations": [
                        {"type": "url_citation", "url": "https://example.com/source"},
                        {"type": "url_citation", "url": "https://example.com/source"},
                        {"type": "url_citation", "url": "file:///etc/passwd"},
                    ],
                }],
            }],
        })

    with _client(handler) as client:
        result = collect_openai_response(
            api_key="secret-test-key",
            model="gpt-5",
            prompt="What does Example make?",
            timeout_seconds=30,
            max_output_tokens=1024,
            client=client,
        )
    assert result.provider_request_id == "resp_observed_123"
    assert result.response_text == "Observed provider answer."
    assert result.citations == ("https://example.com/source",)


@pytest.mark.parametrize("status", [429, 500, 503])
def test_openai_collection_classifies_retryable_status_without_response_body(status):
    with _client(lambda _request: httpx.Response(status, text="sensitive-provider-body")) as client:
        with pytest.raises(ProviderTemporaryError, match=str(status)) as raised:
            collect_openai_response(
                api_key="secret", model="gpt-5", prompt="Prompt", timeout_seconds=30,
                max_output_tokens=1024, client=client,
            )
    assert "sensitive-provider-body" not in str(raised.value)


def test_openai_collection_never_synthesizes_missing_output():
    with _client(lambda _request: httpx.Response(200, json={
        "id": "resp_empty", "status": "completed", "model": "gpt-5", "output": [],
    })) as client:
        with pytest.raises(ProviderPermanentError, match="no observed text"):
            collect_openai_response(
                api_key="secret", model="gpt-5", prompt="Prompt", timeout_seconds=30,
                max_output_tokens=1024, client=client,
            )


def test_openai_collection_rejects_oversized_transport_body():
    with _client(lambda _request: httpx.Response(200, content=b"x" * 1_048_577)) as client:
        with pytest.raises(ProviderPermanentError, match="transport size limit"):
            collect_openai_response(
                api_key="secret", model="gpt-5", prompt="Prompt", timeout_seconds=30,
                max_output_tokens=1024, client=client,
            )
