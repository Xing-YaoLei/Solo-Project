"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    op.create_table(
        'handler',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    )

    op.create_table(
        'complaint',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source_channel', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('priority', sa.String(length=10), nullable=False),
        sa.Column('complainant_name', sa.String(length=100), nullable=False),
        sa.Column('complainant_contact', sa.String(length=100), nullable=False),
        sa.Column('homestay_name', sa.String(length=200), nullable=False),
        sa.Column('room_number', sa.String(length=50), nullable=True),
        sa.Column('check_in_date', sa.Date(), nullable=False),
        sa.Column('check_out_date', sa.Date(), nullable=True),
        sa.Column('handler_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['handler_id'], ['handler.id'], ),
    )

    op.create_table(
        'visit_result',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('visit_method', sa.String(length=20), nullable=False),
        sa.Column('visitor_name', sa.String(length=100), nullable=False),
        sa.Column('satisfaction', sa.String(length=20), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('visit_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
    )

    op.create_table(
        'responsibility',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('responsible_type', sa.String(length=20), nullable=False),
        sa.Column('responsible_person', sa.String(length=100), nullable=False),
        sa.Column('judgment_basis', sa.Text(), nullable=True),
        sa.Column('determined_by', sa.String(length=100), nullable=False),
        sa.Column('determined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
    )

    op.create_table(
        'complaint_tag',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
    )

    op.create_table(
        'handling_record',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('handler_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
        sa.ForeignKeyConstraint(['handler_id'], ['handler.id'], ),
    )

    op.create_table(
        'review',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('review_tags', sa.String(length=200), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('improvement_measures', sa.Text(), nullable=True),
        sa.Column('reviewer_name', sa.String(length=100), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
    )

    op.create_table(
        'timeout_alert',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('complaint_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timeout_hours', sa.Integer(), nullable=False),
        sa.Column('is_resolved', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaint.id'], ),
    )


def downgrade() -> None:
    op.drop_table('timeout_alert')
    op.drop_table('review')
    op.drop_table('handling_record')
    op.drop_table('complaint_tag')
    op.drop_table('responsibility')
    op.drop_table('visit_result')
    op.drop_table('complaint')
    op.drop_table('handler')
