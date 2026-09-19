"""Add a tenant-isolated immutable ledger for observed AI evidence.

Revision ID: 0006_observed_evidence
Revises: 0005_identity_assurance
"""

from alembic import op


revision = "0006_observed_evidence"
down_revision = "0005_identity_assurance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE memberships DROP CONSTRAINT memberships_role_check")
    op.execute("""
        ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
        CHECK (role IN (
            'viewer', 'analyst', 'brand_manager', 'approver', 'security_admin',
            'billing_admin', 'platform_admin', 'collector'
        ))
    """)
    op.execute("""
        CREATE TABLE evidence_observations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            project_id UUID NOT NULL,
            evidence_class VARCHAR(16) NOT NULL DEFAULT 'observed'
                CHECK (evidence_class = 'observed'),
            provider VARCHAR(64) NOT NULL,
            model_identifier VARCHAR(128) NOT NULL,
            provider_request_id VARCHAR(255),
            prompt_text TEXT NOT NULL,
            response_text TEXT NOT NULL,
            citations JSONB NOT NULL DEFAULT '[]'::jsonb
                CHECK (jsonb_typeof(citations) = 'array'),
            observed_at TIMESTAMPTZ NOT NULL,
            content_hash CHAR(64) NOT NULL,
            idempotency_key VARCHAR(255) NOT NULL,
            request_hash CHAR(64) NOT NULL,
            collected_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            retention_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_evidence_tenant_id UNIQUE (tenant_id, id),
            CONSTRAINT uq_evidence_idempotency UNIQUE (tenant_id, project_id, idempotency_key),
            CONSTRAINT fk_evidence_tenant_project FOREIGN KEY (tenant_id, project_id)
                REFERENCES projects(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("""
        CREATE INDEX ix_evidence_tenant_project_observed
        ON evidence_observations (tenant_id, project_id, observed_at DESC)
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_evidence_provider_request
        ON evidence_observations (tenant_id, project_id, provider, provider_request_id)
        WHERE provider_request_id IS NOT NULL
    """)
    op.execute("ALTER TABLE evidence_observations ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE evidence_observations FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY evidence_observations_tenant_isolation ON evidence_observations
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION protect_evidence_observation()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_OP = 'UPDATE' OR OLD.retention_expires_at > clock_timestamp() THEN
                RAISE EXCEPTION 'retained evidence observations are immutable';
            END IF;
            RETURN OLD;
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER evidence_observations_immutable
        BEFORE UPDATE OR DELETE ON evidence_observations
        FOR EACH ROW EXECUTE FUNCTION protect_evidence_observation()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS evidence_observations")
    op.execute("DROP FUNCTION IF EXISTS protect_evidence_observation")
    op.execute("ALTER TABLE memberships DROP CONSTRAINT memberships_role_check")
    op.execute("""
        ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
        CHECK (role IN (
            'viewer', 'analyst', 'brand_manager', 'approver', 'security_admin',
            'billing_admin', 'platform_admin'
        ))
    """)
