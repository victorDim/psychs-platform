"""Preserve snapshot provenance independently of source-body retention."""

from alembic import op

revision = "0012_evidence_snapshot_context"
down_revision = "0011_daily_source_captures"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # NULL denotes legacy or externally ingested evidence without this context.
    # No FK: snapshot bodies can expire before the evidence observation does.
    op.execute("""
        ALTER TABLE evidence_observations ADD COLUMN snapshot_context JSONB,
        ADD CONSTRAINT evidence_snapshot_context_bounded CHECK (
            snapshot_context IS NULL OR (
                jsonb_typeof(snapshot_context) = 'object'
                AND octet_length(snapshot_context::text) <= 131072
            )
        )
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE evidence_observations DROP COLUMN snapshot_context")
