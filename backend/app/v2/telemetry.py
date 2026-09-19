"""Vendor-neutral OpenTelemetry traces and metrics with bounded export."""

from opentelemetry import metrics, trace
from fastapi import FastAPI
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

from .settings import V2Settings


_configured = False
_meter_provider: MeterProvider | None = None


def configure_worker_metrics(
    *, enabled: bool, endpoint: str, service_name: str, environment: str, version: str
) -> bool:
    """Configure metrics in the worker process without importing the API app."""
    global _meter_provider
    if not enabled or _meter_provider is not None:
        return False
    resource = Resource.create({
        "service.name": service_name,
        "service.version": version,
        "deployment.environment.name": environment,
    })
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=endpoint),
        export_interval_millis=60000,
        export_timeout_millis=10000,
    )
    _meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(_meter_provider)
    return True


def shutdown_metrics(timeout_millis: float = 10000) -> None:
    """Flush bounded worker telemetry during graceful termination."""
    if _meter_provider is not None:
        _meter_provider.force_flush(timeout_millis=timeout_millis)
        _meter_provider.shutdown(timeout_millis=timeout_millis)


def configure_telemetry(app: FastAPI, settings: V2Settings, version: str) -> bool:
    """Configure OTLP traces once; disabled environments remain no-op."""
    global _configured
    if not settings.otel_enabled or _configured:
        return False

    provider = TracerProvider(
        resource=Resource.create({
            "service.name": settings.otel_service_name,
            "service.version": version,
            "deployment.environment.name": settings.environment,
        }),
        sampler=ParentBased(TraceIdRatioBased(settings.otel_trace_sample_ratio)),
    )
    provider.add_span_processor(BatchSpanProcessor(
        OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint),
        max_queue_size=2048,
        max_export_batch_size=512,
        schedule_delay_millis=5000,
        export_timeout_millis=10000,
    ))
    trace.set_tracer_provider(provider)
    global _meter_provider
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(endpoint=settings.metrics_endpoint),
        export_interval_millis=60000,
        export_timeout_millis=10000,
    )
    _meter_provider = MeterProvider(resource=provider.resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(_meter_provider)
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=provider,
        excluded_urls="livez,readyz,startupz,health",
        exclude_spans=["send", "receive"],
    )
    _configured = True
    return True
