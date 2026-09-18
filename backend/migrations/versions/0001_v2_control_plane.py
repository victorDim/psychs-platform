"""Create the tenant-isolated v2 control plane.

Revision ID: 0001_v2_control_plane
Revises: None
"""

from alembic import op


revision = "0001_v2_control_plane"
down_revision = None
branch_labels = None
depends_on = None


TENANT_TABLES = ("memberships", "projects", "idempotency_records", "audit_events")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("""
        CREATE TABLE tenants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(80) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            external_subject VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(320),
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE TABLE memberships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(32) NOT NULL CHECK (role IN ('viewer', 'analyst', 'brand_manager', 'approver', 'security_admin', 'billing_admin', 'platform_admin')),
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_membership_tenant_user UNIQUE (tenant_id, user_id)
        )
    """)
    op.execute("""
        CREATE TABLE projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            slug VARCHAR(100) NOT NULL,
            name VARCHAR(255) NOT NULL,
            canonical_domain VARCHAR(255) NOT NULL,
            description TEXT,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_project_tenant_slug UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_projects_tenant_created ON projects (tenant_id, created_at DESC)")
    op.execute("""
        CREATE TABLE idempotency_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            endpoint VARCHAR(255) NOT NULL,
            idempotency_key VARCHAR(255) NOT NULL,
            request_hash CHAR(64) NOT NULL,
            resource_id UUID NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_idempotency_request UNIQUE (tenant_id, endpoint, idempotency_key)
        )
    """)
    op.execute("""
        CREATE TABLE audit_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
            actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            request_id VARCHAR(64) NOT NULL,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id UUID,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_audit_events_tenant_created ON audit_events (tenant_id, created_at DESC)")

    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY {table}_tenant_isolation ON {table}
            FOR ALL
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
            WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        """)

    op.execute("ALTER TABLE tenants ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE tenants FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenants_tenant_isolation ON tenants
        FOR SELECT
        USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    """)
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY users_membership_isolation ON users
        FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.user_id = users.id
              AND memberships.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
              AND memberships.active = true
        ))
    """)

    # Audit rows are append-only for the application role. UPDATE/DELETE remain
    # available only to the migration owner for exceptional recovery procedures.
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'audit_events are append-only';
        END;
        $$
    """)
    op.execute("""
        CREATE TRIGGER audit_events_append_only
        BEFORE UPDATE OR DELETE ON audit_events
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation()
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_event_mutation")
    op.execute("DROP TABLE IF EXISTS audit_events")
    op.execute("DROP TABLE IF EXISTS idempotency_records")
    op.execute("DROP TABLE IF EXISTS projects")
    op.execute("DROP TABLE IF EXISTS memberships")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TABLE IF EXISTS tenants")
