"""Durable PostgreSQL worker for trusted, bounded background operations."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import signal
import socket
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .domain_verification import DnsVerificationUnavailable, dns_txt_matches, source_belongs_to_domain
from .metrics import (
    record_evidence_retention,
    record_job_claim,
    record_job_outcome,
    record_retry_delay,
    record_worker_loop_failure,
)
from .observability import configure_logging
from .provider_collection import (
    ObservedProviderResponse,
    ProviderPermanentError,
    ProviderTemporaryError,
    collect_openai_response,
)
from .telemetry import configure_worker_metrics, shutdown_metrics


LOGGER = logging.getLogger("psychs.worker")
TERMINAL_STATUSES = frozenset({"succeeded", "dead_letter", "cancelled"})


class RetryableJobError(RuntimeError):
    """An expected transient failure which should consume a retry attempt."""


@dataclass(frozen=True, slots=True)
class WorkerSettings:
    database_url: str
    worker_id: str
    lease_seconds: int = 60
    poll_seconds: float = 2.0
    retry_base_seconds: int = 10
    retry_cap_seconds: int = 900
    environment: str = "production"
    otel_enabled: bool = False
    otel_metrics_endpoint: str = ""
    otel_service_name: str = "psychs-worker"
    retention_cleanup_interval_seconds: int = 300
    retention_cleanup_batch_size: int = 1000
    evidence_retention_days: int = 90
    evidence_collection_enabled: bool = False
    openai_api_key: str = ""
    openai_model: str = "gpt-5"
    openai_timeout_seconds: int = 30
    openai_max_output_tokens: int = 2048

    @classmethod
    def from_environment(cls) -> "WorkerSettings":
        database_url = os.environ.get("DATABASE_WORKER_URL", "").strip()
        if not database_url:
            raise RuntimeError("DATABASE_WORKER_URL is required")
        otel_enabled_raw = os.environ.get("OTEL_ENABLED", "false").strip().lower()
        if otel_enabled_raw not in {"true", "false"}:
            raise RuntimeError("OTEL_ENABLED must be true or false")
        collection_enabled_raw = os.environ.get(
            "PSYCHS_EVIDENCE_COLLECTION_ENABLED", "false"
        ).strip().lower()
        if collection_enabled_raw not in {"true", "false"}:
            raise RuntimeError("PSYCHS_EVIDENCE_COLLECTION_ENABLED must be true or false")
        trace_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip().rstrip("/")
        metrics_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "").strip()
        if not metrics_endpoint and trace_endpoint:
            metrics_endpoint = (
                f"{trace_endpoint.removesuffix('/v1/traces')}/v1/metrics"
                if trace_endpoint.endswith("/v1/traces")
                else f"{trace_endpoint}/v1/metrics"
            )
        settings = cls(
            database_url=database_url.replace("postgresql+psycopg://", "postgresql://", 1),
            worker_id=os.environ.get("PSYCHS_WORKER_ID", "").strip() or f"{socket.gethostname()}:{os.getpid()}",
            lease_seconds=int(os.environ.get("PSYCHS_JOB_LEASE_SECONDS", "60")),
            poll_seconds=float(os.environ.get("PSYCHS_JOB_POLL_SECONDS", "2")),
            retry_base_seconds=int(os.environ.get("PSYCHS_JOB_RETRY_BASE_SECONDS", "10")),
            retry_cap_seconds=int(os.environ.get("PSYCHS_JOB_RETRY_CAP_SECONDS", "900")),
            environment=os.environ.get("PSYCHS_ENVIRONMENT", "production").strip().lower(),
            otel_enabled=otel_enabled_raw == "true",
            otel_metrics_endpoint=metrics_endpoint,
            otel_service_name=os.environ.get("OTEL_SERVICE_NAME", "psychs-worker").strip(),
            retention_cleanup_interval_seconds=int(
                os.environ.get("PSYCHS_RETENTION_CLEANUP_INTERVAL_SECONDS", "300")
            ),
            retention_cleanup_batch_size=int(
                os.environ.get("PSYCHS_RETENTION_CLEANUP_BATCH_SIZE", "1000")
            ),
            evidence_retention_days=int(
                os.environ.get("PSYCHS_EVIDENCE_RETENTION_DAYS", "90")
            ),
            evidence_collection_enabled=collection_enabled_raw == "true",
            openai_api_key=os.environ.get("OPENAI_API_KEY", "").strip(),
            openai_model=os.environ.get("PSYCHS_OPENAI_MODEL", "gpt-5").strip(),
            openai_timeout_seconds=int(os.environ.get("PSYCHS_OPENAI_TIMEOUT_SECONDS", "30")),
            openai_max_output_tokens=int(
                os.environ.get("PSYCHS_OPENAI_MAX_OUTPUT_TOKENS", "2048")
            ),
        )
        if not 15 <= settings.lease_seconds <= 3600:
            raise RuntimeError("PSYCHS_JOB_LEASE_SECONDS must be between 15 and 3600")
        if not 0.1 <= settings.poll_seconds <= 60:
            raise RuntimeError("PSYCHS_JOB_POLL_SECONDS must be between 0.1 and 60")
        if not 1 <= settings.retry_base_seconds <= settings.retry_cap_seconds <= 86400:
            raise RuntimeError("Job retry timing is invalid")
        if len(settings.worker_id) > 128:
            raise RuntimeError("PSYCHS_WORKER_ID must contain at most 128 characters")
        if not settings.otel_service_name or len(settings.otel_service_name) > 128:
            raise RuntimeError("OTEL_SERVICE_NAME must contain between 1 and 128 characters")
        if settings.environment not in {"development", "test", "staging", "production"}:
            raise RuntimeError("PSYCHS_ENVIRONMENT is invalid")
        if not 60 <= settings.retention_cleanup_interval_seconds <= 86400:
            raise RuntimeError(
                "PSYCHS_RETENTION_CLEANUP_INTERVAL_SECONDS must be between 60 and 86400"
            )
        if not 1 <= settings.retention_cleanup_batch_size <= 10000:
            raise RuntimeError("PSYCHS_RETENTION_CLEANUP_BATCH_SIZE must be between 1 and 10000")
        if not 1 <= settings.evidence_retention_days <= 2555:
            raise RuntimeError("PSYCHS_EVIDENCE_RETENTION_DAYS must be between 1 and 2555")
        if settings.evidence_collection_enabled:
            if not settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is required when evidence collection is enabled")
            if not settings.openai_model or len(settings.openai_model) > 128:
                raise RuntimeError("PSYCHS_OPENAI_MODEL must contain between 1 and 128 characters")
            if not 5 <= settings.openai_timeout_seconds <= 120:
                raise RuntimeError("PSYCHS_OPENAI_TIMEOUT_SECONDS must be between 5 and 120")
            if settings.openai_timeout_seconds >= settings.lease_seconds:
                raise RuntimeError("OpenAI timeout must be shorter than the worker lease")
            if not 64 <= settings.openai_max_output_tokens <= 8192:
                raise RuntimeError("PSYCHS_OPENAI_MAX_OUTPUT_TOKENS must be between 64 and 8192")
        if settings.otel_enabled and not settings.otel_metrics_endpoint:
            raise RuntimeError("An OTLP endpoint is required when OTEL_ENABLED is true")
        if (
            settings.otel_enabled
            and settings.environment in {"staging", "production"}
            and not settings.otel_metrics_endpoint.startswith("https://")
        ):
            raise RuntimeError("Production OTLP metrics export must use HTTPS")
        return settings


@dataclass(frozen=True, slots=True)
class ClaimedJob:
    id: UUID
    tenant_id: UUID
    project_id: UUID
    created_by: UUID
    job_type: str
    payload: dict
    attempt_count: int
    max_attempts: int


def retry_delay_seconds(attempt_number: int, base_seconds: int, cap_seconds: int) -> int:
    return min(base_seconds * (2 ** max(attempt_number - 1, 0)), cap_seconds)


def _safe_job_error(job: ClaimedJob, error: Exception) -> str:
    if job.job_type != "evidence_collection":
        return f"{type(error).__name__}: {error}"[:2000]
    if isinstance(error, (ProviderPermanentError, RetryableJobError, ValueError)):
        return f"{type(error).__name__}: {error}"[:2000]
    return f"{type(error).__name__}: Evidence collection failed internally"


def _record_event(
    cursor: psycopg.Cursor,
    job: ClaimedJob,
    worker_id: str,
    outcome: str,
    error: str | None = None,
) -> None:
    cursor.execute(
        """
        INSERT INTO job_attempts
            (tenant_id, job_id, attempt_number, worker_id, outcome, error, completed_at)
        VALUES (%s, %s, %s, %s, %s, %s, CASE WHEN %s = 'running' THEN NULL ELSE now() END)
        """,
        (job.tenant_id, job.id, job.attempt_count, worker_id, outcome, error, outcome),
    )


def _reap_exhausted_leases(connection: psycopg.Connection, worker_id: str) -> int:
    """Dead-letter final attempts whose workers disappeared after claiming them."""
    reaped_job_types: list[str] = []
    with connection.transaction(), connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT * FROM jobs
            WHERE status = 'running' AND lease_expires_at <= now() AND attempt_count >= max_attempts
            FOR UPDATE SKIP LOCKED
            """
        )
        rows = cursor.fetchall()
        for row in rows:
            job = ClaimedJob(**{key: row[key] for key in ClaimedJob.__dataclass_fields__})
            error = "Worker lease expired during the final permitted attempt"
            cursor.execute(
                """
                UPDATE jobs SET status = 'dead_letter', last_error = %s, completed_at = now(),
                    payload = CASE WHEN job_type = 'evidence_collection' THEN '{}'::jsonb ELSE payload END,
                    lease_owner = NULL, lease_expires_at = NULL, updated_at = now()
                WHERE id = %s AND status = 'running'
                """,
                (error, job.id),
            )
            _record_event(cursor, job, worker_id, "dead_letter", error)
            cursor.execute(
                """INSERT INTO job_dead_letters (tenant_id, job_id, final_error)
                   VALUES (%s, %s, %s) ON CONFLICT (tenant_id, job_id) DO NOTHING""",
                (job.tenant_id, job.id, error),
            )
            _audit(cursor, job, "job.dead_letter", {"job_type": job.job_type, "error": error})
            reaped_job_types.append(job.job_type)
    for job_type in reaped_job_types:
        record_job_outcome(job_type, "dead_letter", 0)
    return len(reaped_job_types)


def claim_next_job(connection: psycopg.Connection, settings: WorkerSettings) -> ClaimedJob | None:
    _reap_exhausted_leases(connection, settings.worker_id)
    with connection.transaction(), connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            WITH candidate AS (
                SELECT id FROM jobs
                WHERE attempt_count < max_attempts AND (
                    (status IN ('queued', 'retry_wait') AND available_at <= now())
                    OR (status = 'running' AND lease_expires_at <= now())
                )
                ORDER BY priority DESC, available_at, created_at
                FOR UPDATE SKIP LOCKED LIMIT 1
            )
            UPDATE jobs AS job SET
                status = CASE WHEN cancellation_requested_at IS NULL THEN 'running' ELSE 'cancelled' END,
                attempt_count = CASE WHEN cancellation_requested_at IS NULL THEN attempt_count + 1 ELSE attempt_count END,
                lease_owner = CASE WHEN cancellation_requested_at IS NULL THEN %s ELSE NULL END,
                lease_expires_at = CASE WHEN cancellation_requested_at IS NULL
                    THEN now() + make_interval(secs => %s) ELSE NULL END,
                started_at = CASE WHEN cancellation_requested_at IS NULL THEN COALESCE(started_at, now()) ELSE started_at END,
                completed_at = CASE WHEN cancellation_requested_at IS NULL THEN NULL ELSE now() END,
                payload = CASE
                    WHEN cancellation_requested_at IS NOT NULL AND job_type = 'evidence_collection'
                    THEN '{}'::jsonb ELSE payload END,
                updated_at = now()
            FROM candidate WHERE job.id = candidate.id
            RETURNING job.*
            """,
            (settings.worker_id, settings.lease_seconds),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        job = ClaimedJob(**{key: row[key] for key in ClaimedJob.__dataclass_fields__})
        if row["status"] == "cancelled":
            if job.attempt_count > 0:
                _record_event(cursor, job, settings.worker_id, "cancelled")
            return None
        _record_event(cursor, job, settings.worker_id, "running")
        return job


def _audit(cursor: psycopg.Cursor, job: ClaimedJob, action: str, payload: dict) -> None:
    cursor.execute(
        """
        INSERT INTO audit_events
            (tenant_id, actor_user_id, request_id, action, resource_type, resource_id, payload)
        VALUES (%s, %s, %s, %s, 'job', %s, %s)
        """,
        (job.tenant_id, job.created_by, f"worker:{job.id}", action, job.id, Jsonb(payload)),
    )


def complete_job(
    connection: psycopg.Connection, job: ClaimedJob, settings: WorkerSettings, result: dict
) -> str | None:
    with connection.transaction(), connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE jobs SET
                status = CASE WHEN cancellation_requested_at IS NULL THEN 'succeeded' ELSE 'cancelled' END,
                result = CASE WHEN cancellation_requested_at IS NULL THEN %s ELSE NULL END,
                payload = CASE WHEN job_type = 'evidence_collection' THEN '{}'::jsonb ELSE payload END,
                lease_owner = NULL, lease_expires_at = NULL, completed_at = now(), updated_at = now()
            WHERE id = %s AND status = 'running' AND lease_owner = %s
            RETURNING status
            """,
            (Jsonb(result), job.id, settings.worker_id),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        outcome = row[0]
        _record_event(cursor, job, settings.worker_id, outcome)
        _audit(cursor, job, f"job.{outcome}", {"job_type": job.job_type})
        return outcome


def fail_job(
    connection: psycopg.Connection,
    job: ClaimedJob,
    settings: WorkerSettings,
    error: Exception,
    *,
    retryable: bool,
) -> str | None:
    safe_error = _safe_job_error(job, error)
    should_retry = retryable and job.attempt_count < job.max_attempts
    delay = retry_delay_seconds(job.attempt_count, settings.retry_base_seconds, settings.retry_cap_seconds)
    outcome = "retry" if should_retry else "dead_letter"
    with connection.transaction(), connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE jobs SET
                status = CASE WHEN cancellation_requested_at IS NULL THEN %s ELSE 'cancelled' END,
                last_error = CASE WHEN cancellation_requested_at IS NULL THEN %s ELSE last_error END,
                available_at = CASE WHEN cancellation_requested_at IS NULL AND %s
                    THEN now() + make_interval(secs => %s) ELSE available_at END,
                completed_at = CASE WHEN cancellation_requested_at IS NULL AND %s THEN NULL ELSE now() END,
                payload = CASE
                    WHEN job_type = 'evidence_collection'
                         AND (cancellation_requested_at IS NOT NULL OR NOT %s)
                    THEN '{}'::jsonb ELSE payload END,
                lease_owner = NULL, lease_expires_at = NULL, updated_at = now()
            WHERE id = %s AND status = 'running' AND lease_owner = %s
            RETURNING status
            """,
            ("retry_wait" if should_retry else "dead_letter", safe_error, should_retry, delay,
             should_retry, should_retry, job.id, settings.worker_id),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        persisted_status = row[0]
        outcome = "retry" if persisted_status == "retry_wait" else persisted_status
        event_error = safe_error if outcome != "cancelled" else None
        _record_event(cursor, job, settings.worker_id, outcome, event_error)
        if outcome == "dead_letter":
            cursor.execute(
                """INSERT INTO job_dead_letters (tenant_id, job_id, final_error)
                   VALUES (%s, %s, %s) ON CONFLICT (tenant_id, job_id) DO NOTHING""",
                (job.tenant_id, job.id, safe_error),
            )
        audit_payload = {"job_type": job.job_type}
        if outcome != "cancelled":
            audit_payload["error"] = safe_error
        _audit(cursor, job, f"job.{outcome}", audit_payload)
    if outcome == "retry":
        record_retry_delay(job.job_type, delay)
    return outcome


def execute_domain_verification(connection: psycopg.Connection, job: ClaimedJob) -> dict:
    challenge_id = UUID(str(job.payload.get("challenge_id", "")))
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT challenge.*, project.canonical_domain
            FROM domain_verification_challenges AS challenge
            JOIN projects AS project
              ON project.tenant_id = challenge.tenant_id AND project.id = challenge.project_id
            WHERE challenge.id = %s AND challenge.tenant_id = %s AND challenge.project_id = %s
            """,
            (challenge_id, job.tenant_id, job.project_id),
        )
        challenge = cursor.fetchone()
    if challenge is None:
        raise ValueError("Domain verification challenge no longer exists")
    if challenge["status"] == "verified":
        return {"challenge_id": str(challenge_id), "status": "verified"}
    if challenge["status"] != "pending":
        raise ValueError(f"Domain verification challenge is {challenge['status']}")

    checked_at = datetime.now(timezone.utc)
    if challenge["expires_at"] <= checked_at:
        with connection.transaction(), connection.cursor() as cursor:
            cursor.execute(
                """UPDATE domain_verification_challenges
                   SET status = 'expired', last_checked_at = now(), attempt_count = attempt_count + 1
                   WHERE id = %s AND status = 'pending'""",
                (challenge_id,),
            )
        return {"challenge_id": str(challenge_id), "status": "expired"}

    try:
        matched = asyncio.run(
            dns_txt_matches(
                f"_psychs-verification.{challenge['canonical_domain']}", challenge["token_hash"]
            )
        )
    except DnsVerificationUnavailable as error:
        raise RetryableJobError(str(error)) from error
    if not matched:
        raise RetryableJobError("DNS TXT verification record does not match yet")

    with connection.transaction(), connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
            (f"{job.tenant_id}:{job.project_id}:domain-verification",),
        )
        cursor.execute(
            """UPDATE domain_verification_challenges
               SET status = 'verified', verified_at = now(), last_checked_at = now(),
                   attempt_count = attempt_count + 1
               WHERE id = %s AND status = 'pending'""",
            (challenge_id,),
        )
        cursor.execute(
            """UPDATE projects
               SET domain_verification_status = 'verified', domain_verified_at = now(),
                   updated_at = now()
               WHERE id = %s AND tenant_id = %s""",
            (job.project_id, job.tenant_id),
        )
        cursor.execute(
            """SELECT id, canonical_url FROM authoritative_sources
               WHERE tenant_id = %s AND project_id = %s
                 AND verification_status != 'verified'""",
            (job.tenant_id, job.project_id),
        )
        verified_source_ids = [
            source_id
            for source_id, canonical_url in cursor.fetchall()
            if source_belongs_to_domain(canonical_url, challenge["canonical_domain"])
        ]
        if verified_source_ids:
            cursor.execute(
                """UPDATE authoritative_sources
                   SET verification_status = 'verified', updated_at = now()
                   WHERE tenant_id = %s AND project_id = %s AND id = ANY(%s::uuid[])""",
                (job.tenant_id, job.project_id, verified_source_ids),
            )
    return {"challenge_id": str(challenge_id), "status": "verified"}


def execute_evidence_collection(
    connection: psycopg.Connection,
    job: ClaimedJob,
    settings: WorkerSettings,
    *,
    collector=collect_openai_response,
) -> dict:
    prompt = job.payload.get("prompt")
    if not isinstance(prompt, str) or not 1 <= len(prompt) <= 8000 or "\x00" in prompt:
        raise ValueError("Evidence collection prompt is invalid")
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM evidence_observations WHERE collection_job_id = %s",
            (job.id,),
        )
        existing = cursor.fetchone()
    if existing:
        return {"observation_id": str(existing[0]), "provider": "openai", "deduplicated": True}

    try:
        observed: ObservedProviderResponse = collector(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            prompt=prompt,
            timeout_seconds=settings.openai_timeout_seconds,
            max_output_tokens=settings.openai_max_output_tokens,
        )
    except ProviderTemporaryError as exc:
        raise RetryableJobError(str(exc)) from exc

    observed_at = datetime.now(timezone.utc)
    canonical_payload = {
        "evidence_class": "observed",
        "project_id": str(job.project_id),
        "provider": observed.provider,
        "model_identifier": observed.model_identifier,
        "provider_request_id": observed.provider_request_id,
        "prompt_text": prompt,
        "response_text": observed.response_text,
        "citations": list(observed.citations),
        "observed_at": observed_at.isoformat(),
        "collection_job_id": str(job.id),
    }
    content_hash = hashlib.sha256(
        json.dumps(canonical_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    observation_id = uuid4()
    with connection.transaction(), connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO evidence_observations (
                id, tenant_id, project_id, evidence_class, provider, model_identifier,
                provider_request_id, prompt_text, response_text, citations, observed_at,
                content_hash, idempotency_key, request_hash, collected_by,
                collection_job_id, retention_expires_at
            ) VALUES (
                %s, %s, %s, 'observed', %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, now() + make_interval(days => %s)
            )
            """,
            (
                observation_id,
                job.tenant_id,
                job.project_id,
                observed.provider,
                observed.model_identifier,
                observed.provider_request_id,
                prompt,
                observed.response_text,
                Jsonb(list(observed.citations)),
                observed_at,
                content_hash,
                f"job:{job.id}",
                content_hash,
                job.created_by,
                job.id,
                settings.evidence_retention_days,
            ),
        )
        _audit(
            cursor,
            job,
            "evidence_observation.created",
            {
                "observation_id": str(observation_id),
                "provider": observed.provider,
                "model_identifier": observed.model_identifier,
                "content_hash": content_hash,
            },
        )
    return {
        "observation_id": str(observation_id),
        "provider": observed.provider,
        "model_identifier": observed.model_identifier,
    }


def run_once(settings: WorkerSettings) -> bool:
    with psycopg.connect(settings.database_url) as connection:
        job = claim_next_job(connection, settings)
        if job is None:
            return False
        record_job_claim(job.job_type)
        started = time.perf_counter()
        outcome = "stale_lease"
        try:
            if job.job_type == "domain_verification":
                result = execute_domain_verification(connection, job)
            elif job.job_type == "evidence_collection":
                if not settings.evidence_collection_enabled:
                    raise ValueError("Evidence collection is disabled on this worker")
                result = execute_evidence_collection(connection, job, settings)
            else:
                raise ValueError(f"Unsupported job type: {job.job_type}")
            persisted_outcome = complete_job(connection, job, settings, result)
            if persisted_outcome:
                outcome = persisted_outcome
        except Exception as error:
            retryable = isinstance(error, RetryableJobError)
            persisted_outcome = fail_job(connection, job, settings, error, retryable=retryable)
            if persisted_outcome:
                outcome = persisted_outcome
            LOGGER.warning(
                "Job %s failed (retryable=%s): %s",
                job.id,
                retryable,
                _safe_job_error(job, error),
            )
        finally:
            record_job_outcome(job.job_type, outcome, (time.perf_counter() - started) * 1000)
        return True


def purge_expired_evidence(settings: WorkerSettings) -> int:
    """Delete one bounded batch through the database-owned retention contract."""
    try:
        with psycopg.connect(settings.database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT deleted_count FROM purge_expired_evidence(%s, %s)",
                    (settings.retention_cleanup_batch_size, settings.worker_id),
                )
                deleted_count = sum(row[0] for row in cursor.fetchall())
        record_evidence_retention("success", deleted_count)
        return deleted_count
    except Exception:
        record_evidence_retention("failure")
        raise


def main() -> None:
    settings = WorkerSettings.from_environment()
    global LOGGER
    LOGGER = configure_logging("psychs.worker")
    configure_worker_metrics(
        enabled=settings.otel_enabled,
        endpoint=settings.otel_metrics_endpoint,
        service_name=settings.otel_service_name,
        environment=settings.environment,
        version=os.environ.get("PSYCHS_VERSION", "2.0.0"),
    )
    stopping = False
    next_retention_cleanup = time.monotonic()

    def request_stop(_signum, _frame) -> None:
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)
    LOGGER.info("Worker %s started", settings.worker_id)
    try:
        while not stopping:
            try:
                now = time.monotonic()
                if now >= next_retention_cleanup:
                    # Schedule the next attempt before I/O so an outage cannot create
                    # a tight retry loop across every worker replica.
                    next_retention_cleanup = now + settings.retention_cleanup_interval_seconds
                    deleted_count = purge_expired_evidence(settings)
                    if deleted_count:
                        LOGGER.info("Expired evidence observations deleted: %s", deleted_count)
                if not run_once(settings):
                    time.sleep(settings.poll_seconds)
            except Exception:
                record_worker_loop_failure()
                LOGGER.exception("worker_loop_failed")
                time.sleep(min(max(settings.poll_seconds, 1.0), 10.0))
    finally:
        LOGGER.info("Worker %s stopped", settings.worker_id)
        shutdown_metrics()


if __name__ == "__main__":
    main()
