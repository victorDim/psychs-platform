"""Vendor-neutral OpenTelemetry tracing with bounded batch export."""

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

from .settings import V2Settings


_configured = False


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
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=provider,
        excluded_urls="livez,readyz,startupz,health",
        exclude_spans=["send", "receive"],
    )
    _configured = True
    return True
