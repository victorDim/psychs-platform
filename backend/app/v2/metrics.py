"""Low-cardinality OpenTelemetry instruments for API and worker SLOs."""

from opentelemetry import metrics


_meter = metrics.get_meter("psychs.platform")

HTTP_REQUESTS = _meter.create_counter(
    "psychs.http.server.requests",
    description="Completed HTTP requests",
    unit="{request}",
)
HTTP_DURATION = _meter.create_histogram(
    "psychs.http.server.duration",
    description="HTTP request duration",
    unit="ms",
)
JOB_CLAIMS = _meter.create_counter(
    "psychs.jobs.claims",
    description="Durable jobs claimed by a worker",
    unit="{job}",
)
JOB_COMPLETIONS = _meter.create_counter(
    "psychs.jobs.completions",
    description="Durable job terminal and retry outcomes",
    unit="{job}",
)
JOB_DURATION = _meter.create_histogram(
    "psychs.jobs.duration",
    description="Durable job execution duration",
    unit="ms",
)
JOB_RETRY_DELAY = _meter.create_histogram(
    "psychs.jobs.retry_delay",
    description="Scheduled retry delay",
    unit="s",
)
WORKER_LOOP_FAILURES = _meter.create_counter(
    "psychs.worker.loop.failures",
    description="Unhandled worker-loop failures",
    unit="{failure}",
)
API_PROTECTION_EVENTS = _meter.create_counter(
    "psychs.api.protection.events",
    description="Requests rejected or degraded by API abuse controls",
    unit="{event}",
)


def _method(value: str) -> str:
    candidate = value.upper()
    return candidate if candidate in {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"} else "OTHER"


def record_http_request(method: str, route: str, status_code: int, duration_ms: float) -> None:
    attributes = {
        "http.request.method": _method(method),
        # Route templates are bounded; never use raw request paths here.
        "http.route": route if route.startswith("/") else "unmatched",
        "http.response.status_code": status_code,
    }
    HTTP_REQUESTS.add(1, attributes)
    HTTP_DURATION.record(max(duration_ms, 0), attributes)


def record_job_claim(job_type: str) -> None:
    JOB_CLAIMS.add(1, {"job.type": job_type})


def record_job_outcome(job_type: str, outcome: str, duration_ms: float) -> None:
    attributes = {"job.type": job_type, "job.outcome": outcome}
    JOB_COMPLETIONS.add(1, attributes)
    JOB_DURATION.record(max(duration_ms, 0), attributes)


def record_retry_delay(job_type: str, delay_seconds: int) -> None:
    JOB_RETRY_DELAY.record(max(delay_seconds, 0), {"job.type": job_type})


def record_worker_loop_failure() -> None:
    WORKER_LOOP_FAILURES.add(1)


def record_api_protection_event(control: str, outcome: str) -> None:
    safe_control = control if control in {"request_body", "rate_limit"} else "other"
    safe_outcome = outcome if outcome in {"rejected", "unavailable"} else "other"
    API_PROTECTION_EVENTS.add(1, {"protection.control": safe_control, "protection.outcome": safe_outcome})
