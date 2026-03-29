"""add approval columns

Revision ID: 20260329_add_approval_columns
Revises: 
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260329_add_approval_columns"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("approval_rules")}

    if "approval_type" not in existing:
        op.add_column(
            "approval_rules",
            sa.Column("approval_type", sa.String(), nullable=False, server_default="SEQUENTIAL"),
        )
    if "percentage_value" not in existing:
        op.add_column(
            "approval_rules",
            sa.Column("percentage_value", sa.Float(), nullable=True),
        )
    if "specific_approver_id" not in existing:
        op.add_column(
            "approval_rules",
            sa.Column("specific_approver_id", sa.String(length=36), nullable=True),
        )
    if "min_approval_percentage" not in existing:
        op.add_column(
            "approval_rules",
            sa.Column(
                "min_approval_percentage",
                sa.Float(),
                nullable=False,
                server_default=sa.text("100.0"),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("approval_rules")}

    if "min_approval_percentage" in existing:
        op.drop_column("approval_rules", "min_approval_percentage")
    if "specific_approver_id" in existing:
        op.drop_column("approval_rules", "specific_approver_id")
    if "percentage_value" in existing:
        op.drop_column("approval_rules", "percentage_value")
    if "approval_type" in existing:
        op.drop_column("approval_rules", "approval_type")
