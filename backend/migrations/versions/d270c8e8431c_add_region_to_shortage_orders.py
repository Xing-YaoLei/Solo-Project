"""add_region_to_shortage_orders

Revision ID: d270c8e8431c
Revises: 0001
Create Date: 2026-06-18 08:45:24.435559

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd270c8e8431c'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('shortage_orders', sa.Column('region', sa.String(length=100), nullable=True))
    op.create_index('ix_shortage_orders_region', 'shortage_orders', ['region'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_shortage_orders_region', table_name='shortage_orders')
    op.drop_column('shortage_orders', 'region')
