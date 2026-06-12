"""initial schema

Revision ID: 0001
Revises: 
Create Date: 2025-06-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE pointstatus AS ENUM ('active', 'inactive', 'maintenance');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE devicestatus AS ENUM ('online', 'offline', 'maintenance', 'unknown');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE cleaningstatus AS ENUM ('draft', 'pending_review', 'supplement_info', 'reviewing', 'completed', 'closed');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE sourcechannel AS ENUM ('routine_inspection', 'device_alert', 'manual_report', 'store_request');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
        CREATE TYPE closereason AS ENUM ('qualified', 'device_replaced', 'point_closed', 'other');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    op.create_table(
        'store_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('store_code', sa.String(length=50), nullable=False),
        sa.Column('region', sa.String(length=50), nullable=True),
        sa.Column('status', sa.Enum('active', 'inactive', 'maintenance', name='pointstatus'), nullable=True),
        sa.Column('contact_person', sa.String(length=50), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_store_points_id'), 'store_points', ['id'], unique=False)
    op.create_index(op.f('ix_store_points_store_code'), 'store_points', ['store_code'], unique=True)

    op.create_table(
        'persons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('department', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_persons_employee_id'), 'persons', ['employee_id'], unique=True)
    op.create_index(op.f('ix_persons_id'), 'persons', ['id'], unique=False)

    op.create_table(
        'devices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_code', sa.String(length=50), nullable=False),
        sa.Column('device_name', sa.String(length=100), nullable=False),
        sa.Column('device_type', sa.String(length=50), nullable=True),
        sa.Column('store_point_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('online', 'offline', 'maintenance', 'unknown', name='devicestatus'), nullable=True),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('installation_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_maintenance_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('specifications', sa.JSON(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['store_point_id'], ['store_points.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_devices_device_code'), 'devices', ['device_code'], unique=True)
    op.create_index(op.f('ix_devices_id'), 'devices', ['id'], unique=False)

    op.create_table(
        'cleaning_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('record_no', sa.String(length=50), nullable=False),
        sa.Column('store_point_id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('source_channel', sa.Enum('routine_inspection', 'device_alert', 'manual_report', 'store_request', name='sourcechannel'), nullable=True),
        sa.Column('status', sa.Enum('draft', 'pending_review', 'supplement_info', 'reviewing', 'completed', 'closed', name='cleaningstatus'), nullable=True),
        sa.Column('cleaning_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cleaning_person_id', sa.Integer(), nullable=True),
        sa.Column('cleaning_items', sa.JSON(), nullable=True),
        sa.Column('cleaning_photos', sa.JSON(), nullable=True),
        sa.Column('cleaning_remarks', sa.Text(), nullable=True),
        sa.Column('reviewer_id', sa.Integer(), nullable=True),
        sa.Column('review_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_result', sa.String(length=20), nullable=True),
        sa.Column('review_remarks', sa.Text(), nullable=True),
        sa.Column('review_photos', sa.JSON(), nullable=True),
        sa.Column('inspection_result', sa.String(length=20), nullable=True),
        sa.Column('qualified_rate', sa.Float(), nullable=True),
        sa.Column('close_reason', sa.Enum('qualified', 'device_replaced', 'point_closed', 'other', name='closereason'), nullable=True),
        sa.Column('close_remarks', sa.Text(), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_by_id', sa.Integer(), nullable=True),
        sa.Column('is_device_offline', sa.Boolean(), nullable=True),
        sa.Column('offline_handled', sa.Boolean(), nullable=True),
        sa.Column('offline_remarks', sa.Text(), nullable=True),
        sa.Column('supplement_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cleaning_person_id'], ['persons.id'], ),
        sa.ForeignKeyConstraint(['closed_by_id'], ['persons.id'], ),
        sa.ForeignKeyConstraint(['reviewer_id'], ['persons.id'], ),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
        sa.ForeignKeyConstraint(['store_point_id'], ['store_points.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_cleaning_records_id'), 'cleaning_records', ['id'], unique=False)
    op.create_index(op.f('ix_cleaning_records_record_no'), 'cleaning_records', ['record_no'], unique=True)

    op.create_table(
        'status_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cleaning_record_id', sa.Integer(), nullable=False),
        sa.Column('from_status', sa.Enum('draft', 'pending_review', 'supplement_info', 'reviewing', 'completed', 'closed', name='cleaningstatus'), nullable=True),
        sa.Column('to_status', sa.Enum('draft', 'pending_review', 'supplement_info', 'reviewing', 'completed', 'closed', name='cleaningstatus'), nullable=False),
        sa.Column('operator_id', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['cleaning_record_id'], ['cleaning_records.id'], ),
        sa.ForeignKeyConstraint(['operator_id'], ['persons.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_status_logs_id'), 'status_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_status_logs_id'), table_name='status_logs')
    op.drop_table('status_logs')
    op.drop_index(op.f('ix_cleaning_records_record_no'), table_name='cleaning_records')
    op.drop_index(op.f('ix_cleaning_records_id'), table_name='cleaning_records')
    op.drop_table('cleaning_records')
    op.drop_index(op.f('ix_devices_id'), table_name='devices')
    op.drop_index(op.f('ix_devices_device_code'), table_name='devices')
    op.drop_table('devices')
    op.drop_index(op.f('ix_persons_id'), table_name='persons')
    op.drop_index(op.f('ix_persons_employee_id'), table_name='persons')
    op.drop_table('persons')
    op.drop_index(op.f('ix_store_points_store_code'), table_name='store_points')
    op.drop_index(op.f('ix_store_points_id'), table_name='store_points')
    op.drop_table('store_points')

    op.execute('DROP TYPE IF EXISTS closereason;')
    op.execute('DROP TYPE IF EXISTS sourcechannel;')
    op.execute('DROP TYPE IF EXISTS cleaningstatus;')
    op.execute('DROP TYPE IF EXISTS devicestatus;')
    op.execute('DROP TYPE IF EXISTS pointstatus;')
