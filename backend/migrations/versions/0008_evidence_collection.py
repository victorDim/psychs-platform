"""Add fail-closed durable evidence collection jobs.

Revision ID: 0008_evidence_collection
Revises: 0007_evidence_retention
"""

from alembic import op


revision = "0008_evidence_collection"
down_revision = "0007_evidence_retention"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE jobs DROP CONSTRAINT jobs_job_type_check")
    op.execute("""
        ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
        CHECK (job_type IN ('domain_verification', 'evidence_collection'))
    """)
    op.execute("ALTER TABLE evidence_observations ADD COLUMN collection_job_id UUID")
    op.execute("""
        ALTER TABLE evidence_observations
        ADD CONSTRAINT fk_evidence_collection_job
        FOREIGN KEY (tenant_id, collection_job_id)
        REFERENCES jobs(tenant_id, id) ON DELETE RESTRICT
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_evidence_collection_job
        ON evidence_observations (tenant_id, collection_job_id)
        WHERE collection_job_id IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_evidence_collection_job")
    op.execute("ALTER TABLE evidence_observations DROP CONSTRAINT IF EXISTS fk_evidence_collection_job")
    op.execute("ALTER TABLE evidence_observations DROP COLUMN IF EXISTS collection_job_id")
    op.execute("ALTER TABLE jobs DROP CONSTRAINT jobs_job_type_check")
    op.execute("""
        ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
        CHECK (job_type IN ('domain_verification'))
    """)
