"""Add authoritative sources and domain verification challenges.

Revision ID: 0002_authoritative_sources
Revises: 0001_v2_control_plane
"""

from alembic import op


revision = "0002_authoritative_sources"
down_revision = "0001_v2_control_plane"
branch_labels = None
depends_on = None


def _enable_tenant_rls(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    op.execute(f"""
        CREATE POLICY {table}_tenant_isolation ON {table}
        FOR ALL
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)


def upgrade() -> None:
    # Composite tenant/project references prevent cross-tenant associations even
    # for callers operating below the HTTP authorization layer.
    op.execute("ALTER TABLE projects ADD CONSTRAINT uq_projects_tenant_id UNIQUE (tenant_id, id)")
    op.execute("""
        CREATE TABLE authoritative_sources (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            project_id UUID NOT NULL,
            canonical_url TEXT NOT NULL,
            source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('website', 'documentation', 'press', 'regulatory', 'support', 'other')),
            owner_label VARCHAR(255) NOT NULL,
            snapshot_policy VARCHAR(32) NOT NULL DEFAULT 'on_collection' CHECK (snapshot_policy IN ('on_collection', 'daily', 'manual', 'disabled')),
            verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_source_project_url UNIQUE (tenant_id, project_id, canonical_url),
            CONSTRAINT fk_source_tenant_project FOREIGN KEY (tenant_id, project_id)
                REFERENCES projects(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("CREATE INDEX ix_sources_tenant_project ON authoritative_sources (tenant_id, project_id)")
    op.execute("""
        CREATE TABLE domain_verification_challenges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            project_id UUID NOT NULL,
            token_hash CHAR(64) NOT NULL,
            verification_method VARCHAR(32) NOT NULL DEFAULT 'dns_txt' CHECK (verification_method IN ('dns_txt')),
            status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'superseded', 'failed')),
            expires_at TIMESTAMPTZ NOT NULL,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            verified_at TIMESTAMPTZ,
            CONSTRAINT fk_domain_challenge_tenant_project FOREIGN KEY (tenant_id, project_id)
                REFERENCES projects(tenant_id, id) ON DELETE CASCADE
        )
    """)
    op.execute("CREATE INDEX ix_domain_challenges_tenant_project ON domain_verification_challenges (tenant_id, project_id, created_at DESC)")
    op.execute("CREATE UNIQUE INDEX uq_domain_challenge_pending ON domain_verification_challenges (tenant_id, project_id) WHERE status = 'pending'")
    _enable_tenant_rls("authoritative_sources")
    _enable_tenant_rls("domain_verification_challenges")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS domain_verification_challenges")
    op.execute("DROP TABLE IF EXISTS authoritative_sources")
    op.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS uq_projects_tenant_id")
