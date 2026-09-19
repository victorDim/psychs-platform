"""Persist verified project-domain trust state.

Revision ID: 0009_domain_trust
Revises: 0008_evidence_collection
"""

from alembic import op


revision = "0009_domain_trust"
down_revision = "0008_evidence_collection"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE projects
        ADD COLUMN domain_verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',
        ADD COLUMN domain_verified_at TIMESTAMPTZ,
        ADD CONSTRAINT projects_domain_verification_status_check
            CHECK (domain_verification_status IN ('unverified', 'verified')),
        ADD CONSTRAINT projects_domain_verified_at_check
            CHECK (
                (domain_verification_status = 'verified' AND domain_verified_at IS NOT NULL)
                OR
                (domain_verification_status = 'unverified' AND domain_verified_at IS NULL)
            )
    """)
    op.execute("""
        UPDATE projects AS project
        SET domain_verification_status = 'verified',
            domain_verified_at = verified.latest_verified_at
        FROM (
            SELECT tenant_id, project_id, max(verified_at) AS latest_verified_at
            FROM domain_verification_challenges
            WHERE status = 'verified' AND verified_at IS NOT NULL
            GROUP BY tenant_id, project_id
        ) AS verified
        WHERE project.tenant_id = verified.tenant_id
          AND project.id = verified.project_id
    """)
    op.execute("""
        WITH source_hosts AS (
            SELECT source.id,
                   lower(regexp_replace(
                       split_part(split_part(source.canonical_url, '://', 2), '/', 1),
                       ':[0-9]+$', ''
                   )) AS hostname,
                   lower(project.canonical_domain) AS domain
            FROM authoritative_sources AS source
            JOIN projects AS project
              ON project.tenant_id = source.tenant_id AND project.id = source.project_id
            WHERE project.domain_verification_status = 'verified'
              AND source.verification_status != 'verified'
        )
        UPDATE authoritative_sources AS source
        SET verification_status = 'verified', updated_at = now()
        FROM source_hosts
        WHERE source.id = source_hosts.id
          AND (
              source_hosts.hostname = source_hosts.domain
              OR right(source_hosts.hostname, length(source_hosts.domain) + 1)
                 = '.' || source_hosts.domain
          )
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE projects
        DROP CONSTRAINT IF EXISTS projects_domain_verified_at_check,
        DROP CONSTRAINT IF EXISTS projects_domain_verification_status_check,
        DROP COLUMN IF EXISTS domain_verified_at,
        DROP COLUMN IF EXISTS domain_verification_status
    """)
