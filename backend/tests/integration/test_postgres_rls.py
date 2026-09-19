"""Live PostgreSQL tests for the tenant-isolation security boundary."""

import os
from uuid import uuid4

import psycopg
import pytest

from app.v2.worker import ClaimedJob, WorkerSettings, claim_next_job, fail_job


OWNER_URL = os.environ.get("MIGRATION_DATABASE_URL", "")
APP_URL = os.environ.get("DATABASE_URL", "")
WORKER_URL = os.environ.get("DATABASE_WORKER_URL", "")

pytestmark = pytest.mark.skipif(
    not OWNER_URL or not APP_URL,
    reason="PostgreSQL integration URLs are not configured",
)


def _seed_two_tenants():
    tenant_a, tenant_b = uuid4(), uuid4()
    user_a, user_b = uuid4(), uuid4()
    membership_a, membership_b = uuid4(), uuid4()
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                "INSERT INTO tenants (id, slug, name) VALUES (%s, %s, %s)",
                [
                    (tenant_a, f"tenant-a-{tenant_a.hex[:8]}", "Tenant A"),
                    (tenant_b, f"tenant-b-{tenant_b.hex[:8]}", "Tenant B"),
                ],
            )
            cursor.executemany(
                "INSERT INTO users (id, external_subject, email) VALUES (%s, %s, %s)",
                [
                    (user_a, f"oidc|{user_a}", "a@example.invalid"),
                    (user_b, f"oidc|{user_b}", "b@example.invalid"),
                ],
            )
            cursor.executemany(
                "INSERT INTO memberships (id, tenant_id, user_id, role) VALUES (%s, %s, %s, 'analyst')",
                [
                    (membership_a, tenant_a, user_a),
                    (membership_b, tenant_b, user_b),
                ],
            )
    return tenant_a, tenant_b, user_a, user_b


def _set_tenant(cursor, tenant_id):
    cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))


def test_rls_denies_missing_context_and_cross_tenant_access():
    tenant_a, tenant_b, user_a, user_b = _seed_two_tenants()
    project_a = uuid4()

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT count(*) FROM tenants")
            assert cursor.fetchone()[0] == 0

            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                VALUES (%s, %s, 'tenant-a-project', 'Tenant A Project', 'a.example.com', %s)
                """,
                (project_a, tenant_a, user_a),
            )
            cursor.execute("SELECT id FROM projects")
            assert cursor.fetchall() == [(project_a,)]

            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute(
                        """
                        INSERT INTO projects (tenant_id, slug, name, canonical_domain, created_by)
                        VALUES (%s, 'forged-project', 'Forged', 'b.example.com', %s)
                        """,
                        (tenant_b, user_b),
                    )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_b)
            cursor.execute("SELECT id FROM projects WHERE id = %s", (project_a,))
            assert cursor.fetchone() is None


def test_source_registry_enforces_rls_and_tenant_project_integrity():
    tenant_a, tenant_b, user_a, user_b = _seed_two_tenants()
    project_a, project_b, source_a, challenge_a = uuid4(), uuid4(), uuid4(), uuid4()

    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                """
                INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                [
                    (project_a, tenant_a, f"project-a-{project_a.hex[:8]}", "Project A", "a.example.com", user_a),
                    (project_b, tenant_b, f"project-b-{project_b.hex[:8]}", "Project B", "b.example.com", user_b),
                ],
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO authoritative_sources
                    (id, tenant_id, project_id, canonical_url, source_type, owner_label, created_by)
                VALUES (%s, %s, %s, 'https://a.example.com/', 'website', 'Tenant A', %s)
                """,
                (source_a, tenant_a, project_a, user_a),
            )
            cursor.execute(
                """
                INSERT INTO domain_verification_challenges
                    (id, tenant_id, project_id, token_hash, expires_at, created_by)
                VALUES (%s, %s, %s, repeat('a', 64), now() + interval '15 minutes', %s)
                """,
                (challenge_a, tenant_a, project_a, user_a),
            )

            with pytest.raises(psycopg.errors.ForeignKeyViolation):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute(
                        """
                        INSERT INTO authoritative_sources
                            (tenant_id, project_id, canonical_url, source_type, owner_label, created_by)
                        VALUES (%s, %s, 'https://forged.example.com/', 'website', 'Forged', %s)
                        """,
                        (tenant_a, project_b, user_a),
                    )

            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute(
                        """
                        INSERT INTO authoritative_sources
                            (tenant_id, project_id, canonical_url, source_type, owner_label, created_by)
                        VALUES (%s, %s, 'https://tenant-b.example.com/', 'website', 'Tenant B', %s)
                        """,
                        (tenant_b, project_b, user_b),
                    )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_b)
            cursor.execute("SELECT id FROM authoritative_sources WHERE id = %s", (source_a,))
            assert cursor.fetchone() is None
            cursor.execute("SELECT id FROM domain_verification_challenges WHERE id = %s", (challenge_a,))
            assert cursor.fetchone() is None


def test_audit_events_are_append_only_for_application_role():
    tenant_a, _, user_a, _ = _seed_two_tenants()
    event_id = uuid4()
    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO audit_events
                    (id, tenant_id, actor_user_id, request_id, action, resource_type, payload)
                VALUES (%s, %s, %s, 'req-integration', 'test.created', 'test', '{}'::jsonb)
                """,
                (event_id, tenant_a, user_a),
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute("DELETE FROM audit_events WHERE id = %s", (event_id,))


def test_active_token_revocations_are_tenant_scoped_and_immutable():
    tenant_a, tenant_b, user_a, _ = _seed_two_tenants()
    revocation_id = uuid4()
    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO revoked_access_tokens
                    (id, tenant_id, token_hash, expires_at, reason, revoked_by)
                VALUES (%s, %s, repeat('e', 64), now() + interval '15 minutes', 'integration test', %s)
                """,
                (revocation_id, tenant_a, user_a),
            )
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute("DELETE FROM revoked_access_tokens WHERE id = %s", (revocation_id,))

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_b)
            cursor.execute("SELECT id FROM revoked_access_tokens WHERE id = %s", (revocation_id,))
            assert cursor.fetchone() is None

    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            with pytest.raises(psycopg.errors.RaiseException, match="active revoked access tokens are immutable"):
                with connection.transaction():
                    cursor.execute("DELETE FROM revoked_access_tokens WHERE id = %s", (revocation_id,))


def test_observed_evidence_is_tenant_scoped_and_immutable():
    tenant_a, tenant_b, user_a, _ = _seed_two_tenants()
    project_id, observation_id = uuid4(), uuid4()
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                VALUES (%s, %s, %s, 'Evidence Project', 'evidence.example.com', %s)
                """,
                (project_id, tenant_a, f"evidence-{project_id.hex[:8]}", user_a),
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO evidence_observations (
                    id, tenant_id, project_id, provider, model_identifier, prompt_text,
                    response_text, observed_at, content_hash, idempotency_key, request_hash, collected_by
                ) VALUES (
                    %s, %s, %s, 'provider', 'model', 'prompt', 'observed response', now(),
                    repeat('c', 64), 'evidence-idempotency-key', repeat('d', 64), %s
                )
                """,
                (observation_id, tenant_a, project_id, user_a),
            )
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute("DELETE FROM evidence_observations WHERE id = %s", (observation_id,))

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_b)
            cursor.execute("SELECT id FROM evidence_observations WHERE id = %s", (observation_id,))
            assert cursor.fetchone() is None

    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            with pytest.raises(psycopg.errors.RaiseException, match="retained evidence observations are immutable"):
                with connection.transaction():
                    cursor.execute(
                        "UPDATE evidence_observations SET response_text = 'tampered' WHERE id = %s",
                        (observation_id,),
                    )


def test_jobs_are_tenant_isolated_and_worker_can_claim_across_tenants():
    if not WORKER_URL:
        pytest.skip("Worker PostgreSQL URL is not configured")
    tenant_a, tenant_b, user_a, user_b = _seed_two_tenants()
    project_a, project_b, job_a, job_b = uuid4(), uuid4(), uuid4(), uuid4()
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                """
                INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                [
                    (project_a, tenant_a, f"job-a-{project_a.hex[:8]}", "Job A", "a.example.com", user_a),
                    (project_b, tenant_b, f"job-b-{project_b.hex[:8]}", "Job B", "b.example.com", user_b),
                ],
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute(
                """
                INSERT INTO jobs
                    (id, tenant_id, project_id, job_type, payload, idempotency_key, request_hash, created_by)
                VALUES (%s, %s, %s, 'domain_verification', '{}'::jsonb, %s, repeat('a', 64), %s)
                """,
                (job_a, tenant_a, project_a, f"idempotency-{job_a}", user_a),
            )
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    _set_tenant(cursor, tenant_a)
                    cursor.execute(
                        """
                        INSERT INTO jobs
                            (id, tenant_id, project_id, job_type, payload, idempotency_key, request_hash, created_by)
                        VALUES (%s, %s, %s, 'domain_verification', '{}'::jsonb, %s, repeat('b', 64), %s)
                        """,
                        (job_b, tenant_b, project_b, f"idempotency-{job_b}", user_b),
                    )

    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO jobs
                    (id, tenant_id, project_id, job_type, payload, idempotency_key, request_hash, created_by)
                VALUES (%s, %s, %s, 'domain_verification', '{}'::jsonb, %s, repeat('b', 64), %s)
                """,
                (job_b, tenant_b, project_b, f"idempotency-{job_b}", user_b),
            )

    with psycopg.connect(APP_URL) as connection:
        with connection.cursor() as cursor:
            _set_tenant(cursor, tenant_a)
            cursor.execute("SELECT id FROM jobs ORDER BY id")
            assert cursor.fetchall() == [(job_a,)]

    with psycopg.connect(WORKER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM jobs WHERE id IN (%s, %s) ORDER BY id", (job_a, job_b))
            assert {row[0] for row in cursor.fetchall()} == {job_a, job_b}
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    cursor.execute("INSERT INTO projects (tenant_id, slug, name, canonical_domain, created_by) VALUES (%s, 'forbidden', 'Forbidden', 'forbidden.example.com', %s)", (tenant_a, user_a))


def test_worker_claim_retry_and_dead_letter_are_durable():
    if not WORKER_URL:
        pytest.skip("Worker PostgreSQL URL is not configured")
    tenant, _, user, _ = _seed_two_tenants()
    project, challenge, job_id = uuid4(), uuid4(), uuid4()
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                   VALUES (%s, %s, %s, 'Worker Project', 'worker.example.com', %s)""",
                (project, tenant, f"worker-{project.hex[:8]}", user),
            )
            cursor.execute(
                """INSERT INTO domain_verification_challenges
                       (id, tenant_id, project_id, token_hash, expires_at, created_by)
                   VALUES (%s, %s, %s, repeat('c', 64), now() + interval '15 minutes', %s)""",
                (challenge, tenant, project, user),
            )
            cursor.execute(
                """INSERT INTO jobs
                       (id, tenant_id, project_id, job_type, payload, idempotency_key,
                        request_hash, created_by, max_attempts, priority)
                   VALUES (%s, %s, %s, 'domain_verification', jsonb_build_object('challenge_id', %s::text),
                           %s, repeat('c', 64), %s, 2, 100)""",
                (job_id, tenant, project, challenge, f"idempotency-{job_id}", user),
            )

    settings = WorkerSettings(
        database_url=WORKER_URL,
        worker_id=f"integration-worker-{job_id.hex[:8]}",
        retry_base_seconds=1,
        retry_cap_seconds=1,
    )
    with psycopg.connect(WORKER_URL) as connection:
        first = claim_next_job(connection, settings)
        assert first is not None and first.id == job_id and first.attempt_count == 1
        assert fail_job(connection, first, settings, RuntimeError("temporary"), retryable=True)

    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE jobs SET available_at = now() - interval '1 second' WHERE id = %s", (job_id,))

    with psycopg.connect(WORKER_URL) as connection:
        second = claim_next_job(connection, settings)
        assert second is not None and second.id == job_id and second.attempt_count == 2
        assert fail_job(connection, second, settings, RuntimeError("permanent"), retryable=True)
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, attempt_count FROM jobs WHERE id = %s", (job_id,))
            assert cursor.fetchone() == ("dead_letter", 2)
            cursor.execute("SELECT outcome FROM job_attempts WHERE job_id = %s ORDER BY started_at, outcome", (job_id,))
            assert sorted(outcome for outcome, in cursor.fetchall()) == ["dead_letter", "retry", "running", "running"]
            cursor.execute("SELECT count(*) FROM job_dead_letters WHERE job_id = %s", (job_id,))
            assert cursor.fetchone()[0] == 1
            with pytest.raises(psycopg.errors.InsufficientPrivilege):
                with connection.transaction():
                    cursor.execute("DELETE FROM job_attempts WHERE job_id = %s", (job_id,))


def test_running_job_cancellation_wins_over_retry():
    if not WORKER_URL:
        pytest.skip("Worker PostgreSQL URL is not configured")
    tenant, _, user, _ = _seed_two_tenants()
    project, job_id = uuid4(), uuid4()
    worker_id = f"cancel-worker-{job_id.hex[:8]}"
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO projects (id, tenant_id, slug, name, canonical_domain, created_by)
                   VALUES (%s, %s, %s, 'Cancellation Project', 'cancel.example.com', %s)""",
                (project, tenant, f"cancel-{project.hex[:8]}", user),
            )
            cursor.execute(
                """INSERT INTO jobs
                       (id, tenant_id, project_id, job_type, payload, idempotency_key, request_hash,
                        created_by, status, attempt_count, lease_owner, lease_expires_at,
                        cancellation_requested_at)
                   VALUES (%s, %s, %s, 'domain_verification', '{}'::jsonb, %s, repeat('d', 64),
                           %s, 'running', 1, %s, now() + interval '1 minute', now())""",
                (job_id, tenant, project, f"idempotency-{job_id}", user, worker_id),
            )

    settings = WorkerSettings(database_url=WORKER_URL, worker_id=worker_id)
    job = ClaimedJob(job_id, tenant, project, user, "domain_verification", {}, 1, 5)
    with psycopg.connect(WORKER_URL) as connection:
        outcome = fail_job(connection, job, settings, RuntimeError("transient"), retryable=True)
        assert outcome == "cancelled"
        with connection.cursor() as cursor:
            cursor.execute("SELECT status, last_error FROM jobs WHERE id = %s", (job_id,))
            assert cursor.fetchone() == ("cancelled", None)
            cursor.execute("SELECT outcome, error FROM job_attempts WHERE job_id = %s", (job_id,))
            assert cursor.fetchone() == ("cancelled", None)
            cursor.execute("SELECT count(*) FROM job_dead_letters WHERE job_id = %s", (job_id,))
            assert cursor.fetchone()[0] == 0

    # The table owner bypasses grants, so this separately proves the immutable
    # history trigger protects records even from privileged maintenance paths.
    with psycopg.connect(OWNER_URL) as connection:
        with connection.cursor() as cursor:
            with pytest.raises(psycopg.errors.RaiseException, match="append-only"):
                with connection.transaction():
                    cursor.execute("DELETE FROM job_attempts WHERE job_id = %s", (job_id,))
