"""Add bounded evidence retention automation and tenant-visible receipts.

Revision ID: 0007_evidence_retention
Revises: 0006_observed_evidence
"""

from alembic import op


revision = "0007_evidence_retention"
down_revision = "0006_observed_evidence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE evidence_observations
        ADD CONSTRAINT evidence_retention_after_creation
        CHECK (retention_expires_at > created_at)
    """)
    op.execute("""
        CREATE INDEX ix_evidence_retention_expiry
        ON evidence_observations (retention_expires_at, id)
    """)
    op.execute("""
        CREATE TABLE evidence_retention_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
            deleted_count INTEGER NOT NULL CHECK (deleted_count > 0),
            retention_cutoff TIMESTAMPTZ NOT NULL,
            oldest_observed_at TIMESTAMPTZ NOT NULL,
            newest_observed_at TIMESTAMPTZ NOT NULL,
            executor VARCHAR(128) NOT NULL CHECK (length(btrim(executor)) > 0),
            executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE INDEX ix_evidence_retention_events_tenant_executed
        ON evidence_retention_events (tenant_id, executed_at DESC)
    """)
    op.execute("ALTER TABLE evidence_retention_events ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE evidence_retention_events FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY evidence_retention_events_tenant_read ON evidence_retention_events
        FOR SELECT
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("""
        CREATE FUNCTION prevent_evidence_retention_event_mutation()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'evidence retention events are append-only';
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER evidence_retention_events_immutable
        BEFORE UPDATE OR DELETE ON evidence_retention_events
        FOR EACH ROW EXECUTE FUNCTION prevent_evidence_retention_event_mutation()
    """)
    op.execute("""
        CREATE FUNCTION purge_expired_evidence(
            p_batch_limit INTEGER,
            p_executor VARCHAR(128)
        )
        RETURNS TABLE (event_id UUID, tenant_id UUID, deleted_count INTEGER)
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = pg_catalog, public
        SET row_security = off
        AS $$
        DECLARE
            v_cutoff TIMESTAMPTZ := clock_timestamp();
        BEGIN
            IF p_batch_limit IS NULL OR p_batch_limit < 1 OR p_batch_limit > 10000 THEN
                RAISE EXCEPTION 'batch limit must be between 1 and 10000';
            END IF;
            IF p_executor IS NULL OR length(btrim(p_executor)) = 0 OR length(p_executor) > 128 THEN
                RAISE EXCEPTION 'executor must contain between 1 and 128 characters';
            END IF;

            RETURN QUERY
            WITH candidates AS (
                SELECT observation.id
                FROM public.evidence_observations AS observation
                WHERE observation.retention_expires_at <= v_cutoff
                ORDER BY observation.retention_expires_at, observation.id
                FOR UPDATE SKIP LOCKED
                LIMIT p_batch_limit
            ), deleted AS (
                DELETE FROM public.evidence_observations AS observation
                USING candidates
                WHERE observation.id = candidates.id
                  AND observation.retention_expires_at <= v_cutoff
                RETURNING observation.tenant_id, observation.observed_at
            ), summarized AS (
                SELECT deleted.tenant_id, count(*)::INTEGER AS deleted_count,
                       min(deleted.observed_at) AS oldest_observed_at,
                       max(deleted.observed_at) AS newest_observed_at
                FROM deleted
                GROUP BY deleted.tenant_id
            ), receipts AS (
                INSERT INTO public.evidence_retention_events (
                    tenant_id, deleted_count, retention_cutoff,
                    oldest_observed_at, newest_observed_at, executor
                )
                SELECT summarized.tenant_id, summarized.deleted_count, v_cutoff,
                       summarized.oldest_observed_at, summarized.newest_observed_at,
                       btrim(p_executor)
                FROM summarized
                RETURNING id, evidence_retention_events.tenant_id,
                          evidence_retention_events.deleted_count
            )
            SELECT receipts.id, receipts.tenant_id, receipts.deleted_count
            FROM receipts;
        END;
        $$
    """)
    op.execute("REVOKE ALL ON FUNCTION purge_expired_evidence(INTEGER, VARCHAR) FROM PUBLIC")


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS purge_expired_evidence(INTEGER, VARCHAR)")
    op.execute("DROP TABLE IF EXISTS evidence_retention_events")
    op.execute("DROP FUNCTION IF EXISTS prevent_evidence_retention_event_mutation")
    op.execute("DROP INDEX IF EXISTS ix_evidence_retention_expiry")
    op.execute("""
        ALTER TABLE evidence_observations
        DROP CONSTRAINT IF EXISTS evidence_retention_after_creation
    """)
