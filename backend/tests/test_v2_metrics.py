"""Metric-label and telemetry endpoint safety tests."""

import json
import logging
import sys

import pytest
from pydantic import ValidationError

from app.v2 import metrics as platform_metrics
from app.v2.observability import JsonFormatter
from app.v2.settings import V2Settings
from app.v2.worker import WorkerSettings


class _Instrument:
    def __init__(self):
        self.calls = []

    def add(self, value, attributes=None):
        self.calls.append((value, attributes))

    def record(self, value, attributes=None):
        self.calls.append((value, attributes))


def test_http_metrics_use_route_templates_and_bounded_method(monkeypatch):
    counter, histogram = _Instrument(), _Instrument()
    monkeypatch.setattr(platform_metrics, "HTTP_REQUESTS", counter)
    monkeypatch.setattr(platform_metrics, "HTTP_DURATION", histogram)
    platform_metrics.record_http_request("TRACE", "/api/v2/jobs/{job_id}", 503, 12.5)
    attributes = counter.calls[0][1]
    assert attributes == {
        "http.request.method": "OTHER",
        "http.route": "/api/v2/jobs/{job_id}",
        "http.response.status_code": 503,
    }
    assert histogram.calls[0][0] == 12.5


def test_api_protection_metrics_bound_labels(monkeypatch):
    counter = _Instrument()
    monkeypatch.setattr(platform_metrics, "API_PROTECTION_EVENTS", counter)
    platform_metrics.record_api_protection_event("attacker-controlled", "unexpected")
    assert counter.calls == [
        (1, {"protection.control": "other", "protection.outcome": "other"})
    ]


def test_retention_metrics_bound_outcomes_and_count_deletions(monkeypatch):
    runs, deletions = _Instrument(), _Instrument()
    monkeypatch.setattr(platform_metrics, "EVIDENCE_RETENTION_RUNS", runs)
    monkeypatch.setattr(platform_metrics, "EVIDENCE_RETENTION_DELETIONS", deletions)
    platform_metrics.record_evidence_retention("unexpected", 99)
    platform_metrics.record_evidence_retention("success", 3)
    assert runs.calls == [
        (1, {"retention.outcome": "failure"}),
        (1, {"retention.outcome": "success"}),
    ]
    assert deletions.calls == [(3, None)]


def test_metrics_endpoint_is_derived_from_trace_endpoint():
    settings = V2Settings(
        _env_file=None,
        PSYCHS_ENVIRONMENT="test",
        OTEL_ENABLED=True,
        OTEL_EXPORTER_OTLP_ENDPOINT="https://collector.example/v1/traces",
    )
    assert settings.metrics_endpoint == "https://collector.example/v1/metrics"


def test_worker_metrics_fail_closed_in_production(monkeypatch):
    monkeypatch.setenv("DATABASE_WORKER_URL", "postgresql://worker:secret@database/psychs")
    monkeypatch.setenv("PSYCHS_ENVIRONMENT", "production")
    monkeypatch.setenv("OTEL_ENABLED", "true")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318/v1/traces")
    with pytest.raises(RuntimeError, match="HTTPS"):
        WorkerSettings.from_environment()


def test_api_metrics_reject_plaintext_override_in_production():
    with pytest.raises(ValidationError, match="metrics export must use HTTPS"):
        V2Settings(
            _env_file=None,
            PSYCHS_ENVIRONMENT="production",
            PSYCHS_V2_ENABLED=True,
            DATABASE_URL="postgresql://app:secret@database/psychs",
            REDIS_URL="rediss://cache/0",
            PSYCHS_CORS_ALLOWED_ORIGINS="https://app.example.test",
            PSYCHS_OIDC_ISSUER="https://identity.example.test/",
            PSYCHS_OIDC_AUDIENCE="psychs-api",
            PSYCHS_OIDC_JWKS_URL="https://identity.example.test/jwks",
            OTEL_ENABLED=True,
            OTEL_EXPORTER_OTLP_ENDPOINT="https://collector.example/v1/traces",
            OTEL_EXPORTER_OTLP_METRICS_ENDPOINT="http://collector:4318/v1/metrics",
        )


def test_structured_exception_logs_expose_type_not_sensitive_message():
    try:
        raise ValueError("credential-value-must-not-be-logged")
    except ValueError:
        record = logging.LogRecord("psychs.worker", logging.ERROR, __file__, 1, "worker_failed", (), sys.exc_info())
    payload = json.loads(JsonFormatter().format(record))
    assert payload["exception_type"] == "ValueError"
    assert "credential-value" not in json.dumps(payload)
