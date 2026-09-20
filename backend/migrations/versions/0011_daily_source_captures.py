"""Bounded daily source scheduling through a dedicated worker capability."""

from alembic import op

revision = "0011_daily_source_captures"
down_revision = "0010_source_snapshots"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE INDEX ix_snapshot_active_source
        ON jobs (tenant_id, project_id, (payload->>'source_id'))
        WHERE job_type = 'source_snapshot' AND status IN ('queued', 'running', 'retry_wait')
    """)
    op.execute("""
        CREATE FUNCTION schedule_daily_source_snapshots(p_batch_limit INTEGER)
        RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, public
        SET row_security = off
        AS $$
        DECLARE
            v_day TEXT := to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
            v_count INTEGER;
        BEGIN
            IF p_batch_limit IS NULL OR p_batch_limit < 1 OR p_batch_limit > 100 THEN
                RAISE EXCEPTION 'batch limit must be between 1 and 100';
            END IF;
            -- Serialize scheduling replicas without delaying job processing.
            IF NOT pg_try_advisory_xact_lock(73119, 11) THEN
                RETURN 0;
            END IF;
            WITH eligible AS (
                SELECT source.*, 'daily:' || source.id::text || ':' || v_day AS daily_key,
                       row_number() OVER (
                           PARTITION BY source.tenant_id ORDER BY source.created_at, source.id
                       ) AS tenant_position,
                       (SELECT count(*) FROM public.jobs AS scheduled
                        WHERE scheduled.tenant_id = source.tenant_id
                          AND scheduled.job_type = 'source_snapshot'
                          AND scheduled.idempotency_key LIKE 'daily:%:' || v_day
                       ) AS tenant_scheduled
                FROM public.authoritative_sources AS source
                JOIN public.tenants AS tenant ON tenant.id = source.tenant_id
                JOIN public.projects AS project
                  ON project.tenant_id = source.tenant_id AND project.id = source.project_id
                WHERE source.snapshot_policy = 'daily'
                  AND source.verification_status = 'verified'
                  AND project.domain_verification_status = 'verified'
                  AND tenant.status = 'active'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.jobs AS existing
                      WHERE existing.tenant_id = source.tenant_id
                        AND existing.job_type = 'source_snapshot'
                        AND existing.idempotency_key = 'daily:' || source.id::text || ':' || v_day
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM public.jobs AS active
                      WHERE active.tenant_id = source.tenant_id
                        AND active.project_id = source.project_id
                        AND active.job_type = 'source_snapshot'
                        AND active.payload->>'source_id' = source.id::text
                        AND active.status IN ('queued', 'running', 'retry_wait')
                  )
            ), inserted AS (
                INSERT INTO public.jobs (
                    tenant_id, project_id, job_type, priority, payload,
                    idempotency_key, request_hash, max_attempts, created_by
                )
                SELECT tenant_id, project_id, 'source_snapshot', 30,
                       jsonb_build_object('source_id', id::text, 'trigger', 'daily'),
                       daily_key, encode(sha256(convert_to(daily_key, 'UTF8')), 'hex'),
                       3, created_by
                FROM eligible
                WHERE tenant_position <= greatest(30 - tenant_scheduled, 0)
                ORDER BY tenant_position, tenant_id, id LIMIT p_batch_limit
                ON CONFLICT (tenant_id, job_type, idempotency_key) DO NOTHING
                RETURNING id, tenant_id, project_id, created_by, payload
            ), audited AS (
                INSERT INTO public.audit_events (
                    tenant_id, actor_user_id, request_id, action, resource_type, resource_id, payload
                )
                SELECT tenant_id, created_by, 'scheduler:' || id::text,
                       'job.scheduled', 'job', id,
                       jsonb_build_object('job_type', 'source_snapshot', 'trigger', 'daily',
                                          'source_id', payload->>'source_id',
                                          'project_id', project_id::text)
                FROM inserted RETURNING id
            )
            SELECT count(*)::INTEGER INTO v_count FROM audited;
            RETURN v_count;
        END;
        $$
    """)
    op.execute("REVOKE ALL ON FUNCTION schedule_daily_source_snapshots(INTEGER) FROM PUBLIC")


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS schedule_daily_source_snapshots(INTEGER)")
    op.execute("DROP INDEX IF EXISTS ix_snapshot_active_source")
