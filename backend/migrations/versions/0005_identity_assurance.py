"""Add principal types and immutable active access-token revocations.

Revision ID: 0005_identity_assurance
Revises: 0004_durable_jobs
"""

from alembic import op


revision = "0005_identity_assurance"
down_revision = "0004_durable_jobs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users ADD COLUMN principal_type VARCHAR(16) NOT NULL DEFAULT 'human'
            CHECK (principal_type IN ('human', 'service'))
    """)
    op.execute("""
        CREATE TABLE revoked_access_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            token_hash CHAR(64) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            reason VARCHAR(500) NOT NULL,
            revoked_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_revoked_token_tenant_hash UNIQUE (tenant_id, token_hash),
            CONSTRAINT ck_revoked_token_expiry CHECK (expires_at > created_at)
        )
    """)
    op.execute("CREATE INDEX ix_revoked_tokens_expiry ON revoked_access_tokens (tenant_id, expires_at)")
    op.execute("ALTER TABLE revoked_access_tokens ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE revoked_access_tokens FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY revoked_access_tokens_tenant_isolation ON revoked_access_tokens
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION protect_revoked_access_token()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_OP = 'UPDATE' OR OLD.expires_at > clock_timestamp() - interval '30 seconds' THEN
                RAISE EXCEPTION 'active revoked access tokens are immutable';
            END IF;
            RETURN OLD;
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER revoked_access_tokens_immutability
        BEFORE UPDATE OR DELETE ON revoked_access_tokens
        FOR EACH ROW EXECUTE FUNCTION protect_revoked_access_token()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS revoked_access_tokens")
    op.execute("DROP FUNCTION IF EXISTS protect_revoked_access_token")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS principal_type")
