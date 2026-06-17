"""initial migration

Revision ID: 0001
Revises: 
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

userrole_enum = postgresql.ENUM('ADMIN', 'MANAGER', 'WORKER', name='userrole')
creditrating_enum = postgresql.ENUM('A', 'B', 'C', name='creditrating')
supplierstatus_enum = postgresql.ENUM('ACTIVE', 'INACTIVE', name='supplierstatus')
materialbatchstatus_enum = postgresql.ENUM('PENDING', 'IN_STOCK', 'IN_USE', 'SHORTAGE', 'COMPLETED', name='materialbatchstatus')
inventoryrecordtype_enum = postgresql.ENUM('IN', 'OUT', 'TRANSFER', 'ADJUST', name='inventoryrecordtype')
shortagepriority_enum = postgresql.ENUM('HIGH', 'MEDIUM', 'LOW', name='shortagepriority')
shortageorderstatus_enum = postgresql.ENUM('PENDING', 'PROCESSING', 'SUPPLEMENTED', 'RETRIED', 'CLOSED', name='shortageorderstatus')
shortageaction_enum = postgresql.ENUM('CREATE', 'ASSIGN', 'SUPPLEMENT', 'RETRY', 'CLOSE', name='shortageaction')


def upgrade() -> None:
    userrole_enum.create(op.get_bind(), checkfirst=True)
    creditrating_enum.create(op.get_bind(), checkfirst=True)
    supplierstatus_enum.create(op.get_bind(), checkfirst=True)
    materialbatchstatus_enum.create(op.get_bind(), checkfirst=True)
    inventoryrecordtype_enum.create(op.get_bind(), checkfirst=True)
    shortagepriority_enum.create(op.get_bind(), checkfirst=True)
    shortageorderstatus_enum.create(op.get_bind(), checkfirst=True)
    shortageaction_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('role', userrole_enum, nullable=False, default='WORKER'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_role', 'users', ['role'])
    op.create_index('ix_users_is_active', 'users', ['is_active'])

    op.create_table(
        'suppliers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact_person', sa.String(length=50), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('credit_rating', creditrating_enum, nullable=False, default='B'),
        sa.Column('on_time_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('quality_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('status', supplierstatus_enum, nullable=False, default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_suppliers_id', 'suppliers', ['id'])
    op.create_index('ix_suppliers_name', 'suppliers', ['name'])
    op.create_index('ix_suppliers_credit_rating', 'suppliers', ['credit_rating'])
    op.create_index('ix_suppliers_status', 'suppliers', ['status'])

    op.create_table(
        'material_batches',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('batch_no', sa.String(length=50), nullable=False),
        sa.Column('material_name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('specification', sa.String(length=200), nullable=True),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=True),
        sa.Column('supplier_name', sa.String(length=200), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('responsible_person', sa.String(length=100), nullable=True),
        sa.Column('status', materialbatchstatus_enum, nullable=False, default='PENDING'),
        sa.Column('in_date', sa.Date(), nullable=True),
        sa.Column('expected_turnover_days', sa.Integer(), nullable=True),
        sa.Column('actual_turnover_days', sa.Integer(), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_no')
    )
    op.create_index('ix_material_batches_id', 'material_batches', ['id'])
    op.create_index('ix_material_batches_batch_no', 'material_batches', ['batch_no'], unique=True)
    op.create_index('ix_material_batches_material_name', 'material_batches', ['material_name'])
    op.create_index('ix_material_batches_category', 'material_batches', ['category'])
    op.create_index('ix_material_batches_region', 'material_batches', ['region'])
    op.create_index('ix_material_batches_status', 'material_batches', ['status'])
    op.create_index('ix_material_batches_category_region', 'material_batches', ['category', 'region'])
    op.create_index('ix_material_batches_status_region', 'material_batches', ['status', 'region'])
    op.create_index('ix_material_batches_supplier_id', 'material_batches', ['supplier_id'])

    op.create_table(
        'inventory_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('type', inventoryrecordtype_enum, nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('operator', sa.String(length=100), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['material_batches.id'], ),
        sa.ForeignKeyConstraint(['operator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_inventory_records_id', 'inventory_records', ['id'])
    op.create_index('ix_inventory_records_type', 'inventory_records', ['type'])
    op.create_index('ix_inventory_records_region', 'inventory_records', ['region'])
    op.create_index('ix_inventory_records_created_at', 'inventory_records', ['created_at'])
    op.create_index('ix_inventory_records_batch_id_type', 'inventory_records', ['batch_id', 'type'])
    op.create_index('ix_inventory_records_type_region', 'inventory_records', ['type', 'region'])

    op.create_table(
        'usage_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_category', sa.String(length=100), nullable=False),
        sa.Column('max_daily_usage', sa.Float(), nullable=False),
        sa.Column('requires_approval', sa.Boolean(), nullable=False, default=False),
        sa.Column('approval_level', sa.Integer(), nullable=False, default=1),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_category')
    )
    op.create_index('ix_usage_rules_id', 'usage_rules', ['id'])
    op.create_index('ix_usage_rules_material_category', 'usage_rules', ['material_category'], unique=True)
    op.create_index('ix_usage_rules_requires_approval', 'usage_rules', ['requires_approval'])

    op.create_table(
        'inventory_thresholds',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_category', sa.String(length=100), nullable=False),
        sa.Column('allowed_error_rate', sa.Float(), nullable=False, default=0.05),
        sa.Column('overstock_warning_threshold', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_category')
    )
    op.create_index('ix_inventory_thresholds_id', 'inventory_thresholds', ['id'])
    op.create_index('ix_inventory_thresholds_material_category', 'inventory_thresholds', ['material_category'], unique=True)

    op.create_table(
        'safety_stock_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('material_name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('region', sa.String(length=100), nullable=False),
        sa.Column('min_stock', sa.Float(), nullable=False),
        sa.Column('warning_stock', sa.Float(), nullable=False),
        sa.Column('max_stock', sa.Float(), nullable=False),
        sa.Column('current_stock', sa.Float(), nullable=False, default=0.0),
        sa.Column('daily_consumption_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_name', 'region', name='ix_safety_stock_configs_material_region')
    )
    op.create_index('ix_safety_stock_configs_id', 'safety_stock_configs', ['id'])
    op.create_index('ix_safety_stock_configs_material_name', 'safety_stock_configs', ['material_name'])
    op.create_index('ix_safety_stock_configs_category', 'safety_stock_configs', ['category'])
    op.create_index('ix_safety_stock_configs_region', 'safety_stock_configs', ['region'])
    op.create_index('ix_safety_stock_configs_category_region', 'safety_stock_configs', ['category', 'region'])

    op.create_table(
        'shortage_orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('material_name', sa.String(length=200), nullable=False),
        sa.Column('shortage_quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('responsible_person', sa.String(length=100), nullable=True),
        sa.Column('priority', shortagepriority_enum, nullable=False, default='MEDIUM'),
        sa.Column('status', shortageorderstatus_enum, nullable=False, default='PENDING'),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['material_batches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_shortage_orders_id', 'shortage_orders', ['id'])
    op.create_index('ix_shortage_orders_material_name', 'shortage_orders', ['material_name'])
    op.create_index('ix_shortage_orders_responsible_person', 'shortage_orders', ['responsible_person'])
    op.create_index('ix_shortage_orders_priority', 'shortage_orders', ['priority'])
    op.create_index('ix_shortage_orders_status', 'shortage_orders', ['status'])
    op.create_index('ix_shortage_orders_deadline', 'shortage_orders', ['deadline'])
    op.create_index('ix_shortage_orders_status_priority', 'shortage_orders', ['status', 'priority'])

    op.create_table(
        'shortage_action_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shortage_order_id', sa.Integer(), nullable=False),
        sa.Column('action', shortageaction_enum, nullable=False),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('operator', sa.String(length=100), nullable=True),
        sa.Column('remark', sa.Text(), nullable=True),
        sa.Column('supplement_quantity', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['operator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['shortage_order_id'], ['shortage_orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_shortage_action_logs_id', 'shortage_action_logs', ['id'])
    op.create_index('ix_shortage_action_logs_action', 'shortage_action_logs', ['action'])
    op.create_index('ix_shortage_action_logs_created_at', 'shortage_action_logs', ['created_at'])
    op.create_index('ix_shortage_action_logs_order_id_action', 'shortage_action_logs', ['shortage_order_id', 'action'])


def downgrade() -> None:
    op.drop_index('ix_shortage_action_logs_order_id_action', table_name='shortage_action_logs')
    op.drop_index('ix_shortage_action_logs_created_at', table_name='shortage_action_logs')
    op.drop_index('ix_shortage_action_logs_action', table_name='shortage_action_logs')
    op.drop_index('ix_shortage_action_logs_id', table_name='shortage_action_logs')
    op.drop_table('shortage_action_logs')

    op.drop_index('ix_shortage_orders_status_priority', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_deadline', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_status', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_priority', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_responsible_person', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_material_name', table_name='shortage_orders')
    op.drop_index('ix_shortage_orders_id', table_name='shortage_orders')
    op.drop_table('shortage_orders')

    op.drop_index('ix_safety_stock_configs_category_region', table_name='safety_stock_configs')
    op.drop_index('ix_safety_stock_configs_region', table_name='safety_stock_configs')
    op.drop_index('ix_safety_stock_configs_category', table_name='safety_stock_configs')
    op.drop_index('ix_safety_stock_configs_material_name', table_name='safety_stock_configs')
    op.drop_index('ix_safety_stock_configs_id', table_name='safety_stock_configs')
    op.drop_table('safety_stock_configs')

    op.drop_index('ix_inventory_thresholds_material_category', table_name='inventory_thresholds')
    op.drop_index('ix_inventory_thresholds_id', table_name='inventory_thresholds')
    op.drop_table('inventory_thresholds')

    op.drop_index('ix_usage_rules_requires_approval', table_name='usage_rules')
    op.drop_index('ix_usage_rules_material_category', table_name='usage_rules')
    op.drop_index('ix_usage_rules_id', table_name='usage_rules')
    op.drop_table('usage_rules')

    op.drop_index('ix_inventory_records_type_region', table_name='inventory_records')
    op.drop_index('ix_inventory_records_batch_id_type', table_name='inventory_records')
    op.drop_index('ix_inventory_records_created_at', table_name='inventory_records')
    op.drop_index('ix_inventory_records_region', table_name='inventory_records')
    op.drop_index('ix_inventory_records_type', table_name='inventory_records')
    op.drop_index('ix_inventory_records_id', table_name='inventory_records')
    op.drop_table('inventory_records')

    op.drop_index('ix_material_batches_supplier_id', table_name='material_batches')
    op.drop_index('ix_material_batches_status_region', table_name='material_batches')
    op.drop_index('ix_material_batches_category_region', table_name='material_batches')
    op.drop_index('ix_material_batches_status', table_name='material_batches')
    op.drop_index('ix_material_batches_region', table_name='material_batches')
    op.drop_index('ix_material_batches_category', table_name='material_batches')
    op.drop_index('ix_material_batches_material_name', table_name='material_batches')
    op.drop_index('ix_material_batches_batch_no', table_name='material_batches')
    op.drop_index('ix_material_batches_id', table_name='material_batches')
    op.drop_table('material_batches')

    op.drop_index('ix_suppliers_status', table_name='suppliers')
    op.drop_index('ix_suppliers_credit_rating', table_name='suppliers')
    op.drop_index('ix_suppliers_name', table_name='suppliers')
    op.drop_index('ix_suppliers_id', table_name='suppliers')
    op.drop_table('suppliers')

    op.drop_index('ix_users_is_active', table_name='users')
    op.drop_index('ix_users_role', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_table('users')

    shortageaction_enum.drop(op.get_bind(), checkfirst=True)
    shortageorderstatus_enum.drop(op.get_bind(), checkfirst=True)
    shortagepriority_enum.drop(op.get_bind(), checkfirst=True)
    inventoryrecordtype_enum.drop(op.get_bind(), checkfirst=True)
    materialbatchstatus_enum.drop(op.get_bind(), checkfirst=True)
    supplierstatus_enum.drop(op.get_bind(), checkfirst=True)
    creditrating_enum.drop(op.get_bind(), checkfirst=True)
    userrole_enum.drop(op.get_bind(), checkfirst=True)
