"""Add durable tenant-scoped background jobs and dead-letter history.

Revision ID: 0004_durable_jobs
Revises: 0003_domain_verify_attempts
"""

from alembic import op


revision = "0004_durable_jobs"
down_revision = "0003_domain_verify_attempts"
branch_labels = None
depends_on = None


def _tenant_rls(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    op.execute(f"""
        CREATE POLICY {table}_tenant_isolation ON {table}
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)


def upgrade() -> None:
    op.execute("""
        CREATE TABLE jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            project_id UUID NOT NULL,
            job_type VARCHAR(64) NOT NULL CHECK (job_type IN ('domain_verification')),
            status VARCHAR(32) NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'running', 'retry_wait', 'succeeded', 'dead_letter', 'cancelled')),
            priority SMALLINT NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            result JSONB,
            idempotency_key VARCHAR(255) NOT NULL,
            request_hash CHAR(64) NOT NULL,
            attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
            max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
            available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            lease_owner VARCHAR(128),
            lease_expires_at TIMESTAMPTZ,
            cancellation_requested_at TIMESTAMPTZ,
            last_error VARCHAR(2000),
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            CONSTRAINT uq_jobs_tenant_id UNIQUE (tenant_id, id),
            CONSTRAINT uq_jobs_idempotency UNIQUE (tenant_id, job_type, idempotency_key),
            CONSTRAINT fk_jobs_tenant_project FOREIGN KEY (tenant_id, project_id)
                REFERENCES projects(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("""
        CREATE INDEX ix_jobs_claim
        ON jobs (priority DESC, available_at, created_at)
        WHERE status IN ('queued', 'retry_wait', 'running')
    """)
    op.execute("CREATE INDEX ix_jobs_tenant_created ON jobs (tenant_id, created_at DESC)")
    op.execute("""
        CREATE TABLE job_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            job_id UUID NOT NULL,
            attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
            worker_id VARCHAR(128) NOT NULL,
            outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('running', 'succeeded', 'retry', 'dead_letter', 'cancelled')),
            error VARCHAR(2000),
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ,
            CONSTRAINT uq_job_attempt_event UNIQUE (tenant_id, job_id, attempt_number, outcome),
            CONSTRAINT fk_attempt_tenant_job FOREIGN KEY (tenant_id, job_id)
                REFERENCES jobs(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("CREATE INDEX ix_job_attempts_tenant_job ON job_attempts (tenant_id, job_id, attempt_number)")
    op.execute("""
        CREATE TABLE job_dead_letters (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            job_id UUID NOT NULL,
            final_error VARCHAR(2000) NOT NULL,
            failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_job_dead_letter UNIQUE (tenant_id, job_id),
            CONSTRAINT fk_dead_letter_tenant_job FOREIGN KEY (tenant_id, job_id)
                REFERENCES jobs(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("CREATE INDEX ix_job_dead_letters_tenant_failed ON job_dead_letters (tenant_id, failed_at DESC)")

    for table in ("jobs", "job_attempts", "job_dead_letters"):
        _tenant_rls(table)

    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_job_history_mutation()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'job history is append-only';
        END;
        $$
    """)
    for table in ("job_attempts", "job_dead_letters"):
        op.execute(f"""
            CREATE TRIGGER {table}_append_only
            BEFORE UPDATE OR DELETE ON {table}
            FOR EACH ROW EXECUTE FUNCTION prevent_job_history_mutation()
        """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS job_dead_letters")
    op.execute("DROP TABLE IF EXISTS job_attempts")
    op.execute("DROP TABLE IF EXISTS jobs")
    op.execute("DROP FUNCTION IF EXISTS prevent_job_history_mutation")
