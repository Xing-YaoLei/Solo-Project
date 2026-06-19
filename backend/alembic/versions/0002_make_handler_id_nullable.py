"""make handling_record.handler_id nullable

Revision ID: 0002_make_handler_id_nullable
Revises: 0001_initial
Create Date: 2026-06-19 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002_make_handler_id_nullable'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = 'handling_record'
              AND column_name = 'handler_id'
              AND is_nullable = 'NO'
        """)
    )
    needs_alter = result.scalar() > 0
    if needs_alter:
        op.alter_column(
            'handling_record',
            'handler_id',
            existing_type=postgresql.UUID(as_uuid=True),
            nullable=True,
        )


def downgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("""
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = 'handling_record'
              AND column_name = 'handler_id'
              AND is_nullable = 'YES'
        """)
    )
    needs_alter = result.scalar() > 0
    if needs_alter:
        op.alter_column(
            'handling_record',
            'handler_id',
            existing_type=postgresql.UUID(as_uuid=True),
            nullable=False,
        )
