"""Track bounded domain verification attempts.

Revision ID: 0003_domain_verify_attempts
Revises: 0002_authoritative_sources
"""

from alembic import op


revision = "0003_domain_verify_attempts"
down_revision = "0002_authoritative_sources"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE domain_verification_challenges ADD COLUMN last_checked_at TIMESTAMPTZ")
    op.execute("ALTER TABLE domain_verification_challenges ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE domain_verification_challenges ADD CONSTRAINT ck_domain_challenge_attempt_count CHECK (attempt_count >= 0)")


def downgrade() -> None:
    op.execute("ALTER TABLE domain_verification_challenges DROP CONSTRAINT IF EXISTS ck_domain_challenge_attempt_count")
    op.execute("ALTER TABLE domain_verification_challenges DROP COLUMN IF EXISTS attempt_count")
    op.execute("ALTER TABLE domain_verification_challenges DROP COLUMN IF EXISTS last_checked_at")
