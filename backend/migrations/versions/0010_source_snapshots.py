"""Add immutable, retained snapshots of verified authoritative sources.

Revision ID: 0010_source_snapshots
Revises: 0009_domain_trust
"""

from alembic import op


revision = "0010_source_snapshots"
down_revision = "0009_domain_trust"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE jobs DROP CONSTRAINT jobs_job_type_check")
    op.execute("""
        ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
        CHECK (job_type IN ('domain_verification', 'evidence_collection', 'source_snapshot'))
    """)
    op.execute("""
        ALTER TABLE authoritative_sources
        ADD CONSTRAINT uq_sources_tenant_id UNIQUE (tenant_id, id)
    """)
    op.execute("""
        CREATE TABLE source_snapshots (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            project_id UUID NOT NULL,
            source_id UUID NOT NULL,
            collection_job_id UUID NOT NULL,
            requested_url TEXT NOT NULL CHECK (length(requested_url) BETWEEN 8 AND 2048),
            final_url TEXT NOT NULL CHECK (length(final_url) BETWEEN 8 AND 2048),
            http_status SMALLINT NOT NULL CHECK (http_status BETWEEN 200 AND 299),
            content_type VARCHAR(128) NOT NULL,
            charset VARCHAR(64) NOT NULL,
            byte_length INTEGER NOT NULL CHECK (byte_length BETWEEN 0 AND 5242880),
            content_sha256 CHAR(64) NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
            body_text TEXT NOT NULL CHECK (octet_length(body_text) <= 5242880),
            fetched_at TIMESTAMPTZ NOT NULL,
            retention_expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT source_snapshot_retention_after_creation
                CHECK (retention_expires_at > created_at),
            CONSTRAINT fk_snapshot_tenant_project FOREIGN KEY (tenant_id, project_id)
                REFERENCES projects(tenant_id, id) ON DELETE CASCADE,
            CONSTRAINT fk_snapshot_tenant_source FOREIGN KEY (tenant_id, source_id)
                REFERENCES authoritative_sources(tenant_id, id) ON DELETE RESTRICT,
            CONSTRAINT fk_snapshot_collection_job FOREIGN KEY (tenant_id, collection_job_id)
                REFERENCES jobs(tenant_id, id) ON DELETE RESTRICT,
            CONSTRAINT uq_source_snapshot_job UNIQUE (tenant_id, collection_job_id)
        )
    """)
    op.execute("""
        CREATE INDEX ix_source_snapshots_tenant_source_fetched
        ON source_snapshots (tenant_id, project_id, source_id, fetched_at DESC)
    """)
    op.execute("""
        CREATE INDEX ix_source_snapshots_retention_expiry
        ON source_snapshots (retention_expires_at, id)
    """)
    op.execute("ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE source_snapshots FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY source_snapshots_tenant_isolation ON source_snapshots
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("""
        CREATE FUNCTION protect_source_snapshot()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_OP = 'UPDATE' OR OLD.retention_expires_at > clock_timestamp() THEN
                RAISE EXCEPTION 'retained source snapshots are immutable';
            END IF;
            RETURN OLD;
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER source_snapshots_immutable
        BEFORE UPDATE OR DELETE ON source_snapshots
        FOR EACH ROW EXECUTE FUNCTION protect_source_snapshot()
    """)
    op.execute("""
        CREATE TABLE source_snapshot_retention_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
            deleted_count INTEGER NOT NULL CHECK (deleted_count > 0),
            retention_cutoff TIMESTAMPTZ NOT NULL,
            oldest_fetched_at TIMESTAMPTZ NOT NULL,
            newest_fetched_at TIMESTAMPTZ NOT NULL,
            executor VARCHAR(128) NOT NULL CHECK (length(btrim(executor)) > 0),
            executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE INDEX ix_source_snapshot_retention_events_tenant_executed
        ON source_snapshot_retention_events (tenant_id, executed_at DESC)
    """)
    op.execute("ALTER TABLE source_snapshot_retention_events ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE source_snapshot_retention_events FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY source_snapshot_retention_events_tenant_read
        ON source_snapshot_retention_events FOR SELECT
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("""
        CREATE FUNCTION prevent_source_snapshot_retention_event_mutation()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'source snapshot retention events are append-only';
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER source_snapshot_retention_events_immutable
        BEFORE UPDATE OR DELETE ON source_snapshot_retention_events
        FOR EACH ROW EXECUTE FUNCTION prevent_source_snapshot_retention_event_mutation()
    """)
    op.execute("""
        CREATE FUNCTION purge_expired_source_snapshots(
            p_batch_limit INTEGER,
            p_executor VARCHAR(128)
        )
        RETURNS TABLE (event_id UUID, tenant_id UUID, deleted_count INTEGER)
        LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = pg_catalog, public
        SET row_security = off
        AS $$
        DECLARE v_cutoff TIMESTAMPTZ := clock_timestamp();
        BEGIN
            IF p_batch_limit IS NULL OR p_batch_limit < 1 OR p_batch_limit > 10000 THEN
                RAISE EXCEPTION 'batch limit must be between 1 and 10000';
            END IF;
            IF p_executor IS NULL OR length(btrim(p_executor)) = 0 OR length(p_executor) > 128 THEN
                RAISE EXCEPTION 'executor must contain between 1 and 128 characters';
            END IF;
            RETURN QUERY
            WITH candidates AS (
                SELECT snapshot.id FROM public.source_snapshots AS snapshot
                WHERE snapshot.retention_expires_at <= v_cutoff
                ORDER BY snapshot.retention_expires_at, snapshot.id
                FOR UPDATE SKIP LOCKED LIMIT p_batch_limit
            ), deleted AS (
                DELETE FROM public.source_snapshots AS snapshot USING candidates
                WHERE snapshot.id = candidates.id AND snapshot.retention_expires_at <= v_cutoff
                RETURNING snapshot.tenant_id, snapshot.fetched_at
            ), summarized AS (
                SELECT deleted.tenant_id, count(*)::INTEGER AS deleted_count,
                       min(deleted.fetched_at) AS oldest_fetched_at,
                       max(deleted.fetched_at) AS newest_fetched_at
                FROM deleted GROUP BY deleted.tenant_id
            ), receipts AS (
                INSERT INTO public.source_snapshot_retention_events (
                    tenant_id, deleted_count, retention_cutoff,
                    oldest_fetched_at, newest_fetched_at, executor
                )
                SELECT summarized.tenant_id, summarized.deleted_count, v_cutoff,
                       summarized.oldest_fetched_at, summarized.newest_fetched_at,
                       btrim(p_executor) FROM summarized
                RETURNING id, source_snapshot_retention_events.tenant_id,
                          source_snapshot_retention_events.deleted_count
            )
            SELECT receipts.id, receipts.tenant_id, receipts.deleted_count FROM receipts;
        END;
        $$
    """)
    op.execute("REVOKE ALL ON FUNCTION purge_expired_source_snapshots(INTEGER, VARCHAR) FROM PUBLIC")


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS purge_expired_source_snapshots(INTEGER, VARCHAR)")
    op.execute("DROP TABLE IF EXISTS source_snapshot_retention_events")
    op.execute("DROP FUNCTION IF EXISTS prevent_source_snapshot_retention_event_mutation")
    op.execute("DROP TABLE IF EXISTS source_snapshots")
    op.execute("DROP FUNCTION IF EXISTS protect_source_snapshot")
    op.execute("ALTER TABLE authoritative_sources DROP CONSTRAINT IF EXISTS uq_sources_tenant_id")
    op.execute("ALTER TABLE jobs DROP CONSTRAINT jobs_job_type_check")
    op.execute("""
        ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
        CHECK (job_type IN ('domain_verification', 'evidence_collection'))
    """)
