"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""

from datetime import date, datetime
from decimal import Decimal

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"")

    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("role", sa.String(20), nullable=False, server_default="'rider'"),
        sa.Column("city_code", sa.String(10), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("role IN ('admin', 'operator', 'finance', 'rider')", name="ck_users_role"),
    )

    op.create_table(
        "orders",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("order_no", sa.String(50), nullable=False, unique=True),
        sa.Column("rider_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pickup_address", sa.Text, nullable=False),
        sa.Column("delivery_address", sa.Text, nullable=False),
        sa.Column("pickup_lat", sa.Numeric(10, 7), nullable=False),
        sa.Column("pickup_lng", sa.Numeric(10, 7), nullable=False),
        sa.Column("delivery_lat", sa.Numeric(10, 7), nullable=False),
        sa.Column("delivery_lng", sa.Numeric(10, 7), nullable=False),
        sa.Column("distance", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("route_type", sa.String(20), nullable=False, server_default="'normal'"),
        sa.Column("city_code", sa.String(10), nullable=False),
        sa.Column("order_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("subsidy_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("status", sa.String(20), nullable=False, server_default="'completed'"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("route_type IN ('normal', 'cross_city', 'remote', 'bad_weather')", name="ck_orders_route_type"),
        sa.CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'cancelled')", name="ck_orders_status"),
        sa.CheckConstraint("distance >= 0", name="ck_orders_distance"),
        sa.CheckConstraint("order_amount >= 0", name="ck_orders_order_amount"),
        sa.CheckConstraint("subsidy_amount >= 0", name="ck_orders_subsidy_amount"),
    )

    op.create_table(
        "subsidy_rules",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("city_code", sa.String(10), nullable=False),
        sa.Column("route_type", sa.String(20), nullable=False, server_default="'normal'"),
        sa.Column("min_distance", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("max_distance", sa.Numeric(10, 2), nullable=False),
        sa.Column("subsidy_per_km", sa.Numeric(10, 2), nullable=False),
        sa.Column("max_subsidy", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="'draft'"),
        sa.Column("effective_start", sa.Date, nullable=False),
        sa.Column("effective_end", sa.Date, nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("route_type IN ('normal', 'cross_city', 'remote', 'bad_weather')", name="ck_subsidy_rules_route_type"),
        sa.CheckConstraint("status IN ('draft', 'pending_approval', 'approved', 'rejected', 'disabled')", name="ck_subsidy_rules_status"),
        sa.CheckConstraint("min_distance >= 0", name="ck_subsidy_rules_min_distance"),
        sa.CheckConstraint("max_distance > min_distance", name="ck_subsidy_rules_max_distance"),
        sa.CheckConstraint("subsidy_per_km > 0", name="ck_subsidy_rules_subsidy_per_km"),
        sa.CheckConstraint("max_subsidy > 0", name="ck_subsidy_rules_max_subsidy"),
        sa.CheckConstraint("effective_end > effective_start", name="ck_subsidy_rules_effective_range"),
    )
    op.create_index("ix_subsidy_rules_city_route", "subsidy_rules", ["city_code", "route_type"])

    op.create_table(
        "appeal_tickets",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rider_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("appeal_type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="'pending'"),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("handler_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transfer_from", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transfer_reason", sa.Text, nullable=True),
        sa.Column("escalation_reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("appeal_type IN ('subsidy_missing', 'amount_wrong', 'route_wrong', 'other')", name="ck_appeal_tickets_appeal_type"),
        sa.CheckConstraint("status IN ('pending', 'in_review', 'supplement_requested', 'approved', 'rejected', 'transferred', 'escalated')", name="ck_appeal_tickets_status"),
    )
    op.create_index("ix_appeal_tickets_status", "appeal_tickets", ["status"])
    op.create_index("ix_appeal_tickets_rider", "appeal_tickets", ["rider_id"])

    op.create_table(
        "appeal_photos",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("appeal_id", UUID(as_uuid=True), sa.ForeignKey("appeal_tickets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("photo_url", sa.Text, nullable=False),
        sa.Column("photo_type", sa.String(20), nullable=False, server_default="'evidence'"),
        sa.Column("uploaded_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("photo_type IN ('evidence', 'supplement')", name="ck_appeal_photos_photo_type"),
    )
    op.create_index("ix_appeal_photos_appeal", "appeal_photos", ["appeal_id"])

    op.create_table(
        "flow_logs",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("ticket_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ticket_type", sa.String(20), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("operator_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("operator_role", sa.String(20), nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("ticket_type IN ('appeal', 'todo', 'compensation')", name="ck_flow_logs_ticket_type"),
    )
    op.create_index("ix_flow_logs_ticket", "flow_logs", ["ticket_id", "ticket_type"])

    op.create_table(
        "settlement_batches",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("batch_no", sa.String(50), nullable=False, unique=True),
        sa.Column("period_start", sa.Date, nullable=False),
        sa.Column("period_end", sa.Date, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="'draft'"),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('draft', 'pending_review', 'approved', 'settled')", name="ck_settlement_batches_status"),
        sa.CheckConstraint("period_end >= period_start", name="ck_settlement_batches_period"),
        sa.CheckConstraint("total_amount >= 0", name="ck_settlement_batches_total_amount"),
        sa.CheckConstraint("total_count >= 0", name="ck_settlement_batches_total_count"),
    )

    op.create_table(
        "settlement_details",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("batch_id", UUID(as_uuid=True), sa.ForeignKey("settlement_batches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rider_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subsidy_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("compensation_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("status", sa.String(20), nullable=False, server_default="'pending'"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('pending', 'settled', 'failed')", name="ck_settlement_details_status"),
        sa.CheckConstraint("subsidy_amount >= 0", name="ck_settlement_details_subsidy"),
        sa.CheckConstraint("compensation_amount >= 0", name="ck_settlement_details_compensation"),
        sa.CheckConstraint("total_amount >= 0", name="ck_settlement_details_total"),
    )
    op.create_index("ix_settlement_details_batch", "settlement_details", ["batch_id"])
    op.create_index("ix_settlement_details_rider", "settlement_details", ["rider_id"])

    op.create_table(
        "compensation_types",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("default_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("default_amount >= 0", name="ck_compensation_types_default_amount"),
    )

    op.create_table(
        "compensation_records",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rider_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type_id", UUID(as_uuid=True), sa.ForeignKey("compensation_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="'pending'"),
        sa.Column("approved_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_compensation_records_status"),
        sa.CheckConstraint("amount > 0", name="ck_compensation_records_amount"),
    )
    op.create_index("ix_compensation_records_rider", "compensation_records", ["rider_id"])
    op.create_index("ix_compensation_records_status", "compensation_records", ["status"])

    op.create_table(
        "verification_photos",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("order_id", UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("photo_url", sa.Text, nullable=False),
        sa.Column("photo_type", sa.String(20), nullable=False),
        sa.Column("uploaded_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("photo_type IN ('pickup', 'delivery', 'damage')", name="ck_verification_photos_photo_type"),
    )
    op.create_index("ix_verification_photos_order", "verification_photos", ["order_id"])

    op.create_table(
        "todo_tickets",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("source_id", UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="'pending'"),
        sa.Column("priority", sa.String(10), nullable=False, server_default="'medium'"),
        sa.Column("assignee_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transfer_from", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transfer_reason", sa.Text, nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolved_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("source_type IN ('damage_report', 'appeal', 'compensation', 'other')", name="ck_todo_tickets_source_type"),
        sa.CheckConstraint("status IN ('pending', 'claimed', 'in_progress', 'supplement_requested', 'resolved', 'rejected', 'transferred', 'closed')", name="ck_todo_tickets_status"),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name="ck_todo_tickets_priority"),
    )
    op.create_index("ix_todo_tickets_status", "todo_tickets", ["status"])
    op.create_index("ix_todo_tickets_assignee", "todo_tickets", ["assignee_id"])
    op.create_index("ix_todo_tickets_source", "todo_tickets", ["source_type", "source_id"])

    op.execute(
        """
        INSERT INTO users (id, name, phone, role, city_code, is_active) VALUES
        ('a0000000-0000-0000-0000-000000000001', '张管理', '13800000001', 'admin', '4401', true),
        ('a0000000-0000-0000-0000-000000000002', '李运营', '13800000002', 'operator', '4401', true),
        ('a0000000-0000-0000-0000-000000000003', '王财务', '13800000003', 'finance', '4401', true),
        ('a0000000-0000-0000-0000-000000000004', '赵骑手', '13800000004', 'rider', '4401', true),
        ('a0000000-0000-0000-0000-000000000005', '刘骑手', '13800000005', 'rider', '4403', true)
        """
    )

    op.execute(
        """
        INSERT INTO compensation_types (id, name, code, description, default_amount, is_active) VALUES
        ('b0000000-0000-0000-0000-000000000001', '超时补偿', 'timeout', '配送超时补偿', 10.00, true),
        ('b0000000-0000-0000-0000-000000000002', '货物损坏', 'damage', '货物损坏赔偿', 50.00, true),
        ('b0000000-0000-0000-0000-000000000003', '路线异常', 'route_abnormal', '路线异常额外补贴', 15.00, true),
        ('b0000000-0000-0000-0000-000000000004', '天气补贴', 'weather', '恶劣天气额外补贴', 20.00, true)
        """
    )

    op.execute(
        """
        INSERT INTO subsidy_rules (id, name, city_code, route_type, min_distance, max_distance, subsidy_per_km, max_subsidy, status, effective_start, effective_end, created_by)
        VALUES
        ('c0000000-0000-0000-0000-000000000001', '广州市普通路线补贴', '4401', 'normal', 3.00, 10.00, 1.50, 15.00, 'approved', '2025-01-01', '2025-12-31', 'a0000000-0000-0000-0000-000000000001'),
        ('c0000000-0000-0000-0000-000000000002', '广州市跨城路线补贴', '4401', 'cross_city', 10.00, 50.00, 2.50, 80.00, 'approved', '2025-01-01', '2025-12-31', 'a0000000-0000-0000-0000-000000000001'),
        ('c0000000-0000-0000-0000-000000000003', '深圳市偏远路线补贴', '4403', 'remote', 5.00, 30.00, 2.00, 40.00, 'approved', '2025-01-01', '2025-12-31', 'a0000000-0000-0000-0000-000000000001'),
        ('c0000000-0000-0000-0000-000000000004', '恶劣天气补贴', '4401', 'bad_weather', 0.00, 100.00, 3.00, 200.00, 'draft', '2025-06-01', '2025-09-30', 'a0000000-0000-0000-0000-000000000002')
        """
    )

    op.execute(
        """
        INSERT INTO orders (id, order_no, rider_id, pickup_address, delivery_address, pickup_lat, pickup_lng, delivery_lat, delivery_lng, distance, route_type, city_code, order_amount, subsidy_amount, status, completed_at)
        VALUES
        ('d0000000-0000-0000-0000-000000000001', 'ORD-20250101-001', 'a0000000-0000-0000-0000-000000000004', '广州市天河区体育西路', '广州市白云区机场路', 23.1365000, 113.3250000, 23.1833000, 113.2667000, 8.50, 'normal', '4401', 25.00, 12.75, 'completed', '2025-01-15 10:30:00+08'),
        ('d0000000-0000-0000-0000-000000000002', 'ORD-20250101-002', 'a0000000-0000-0000-0000-000000000004', '广州市天河区珠江新城', '佛山市禅城区祖庙路', 23.1200000, 113.3200000, 23.0200000, 113.1200000, 25.00, 'cross_city', '4401', 45.00, 62.50, 'completed', '2025-01-15 14:00:00+08'),
        ('d0000000-0000-0000-0000-000000000003', 'ORD-20250102-001', 'a0000000-0000-0000-0000-000000000005', '深圳市南山区科技园', '深圳市大鹏新区', 22.5400000, 113.9500000, 22.5900000, 114.4700000, 18.00, 'remote', '4403', 35.00, 36.00, 'completed', '2025-01-16 09:00:00+08'),
        ('d0000000-0000-0000-0000-000000000004', 'ORD-20250103-001', 'a0000000-0000-0000-0000-000000000004', '广州市番禺区市桥', '广州市南沙区', 22.9400000, 113.3600000, 22.7900000, 113.5300000, 30.00, 'normal', '4401', 40.00, 15.00, 'completed', '2025-01-17 16:30:00+08')
        """
    )


def downgrade() -> None:
    op.drop_table("todo_tickets")
    op.drop_table("verification_photos")
    op.drop_table("compensation_records")
    op.drop_table("compensation_types")
    op.drop_table("settlement_details")
    op.drop_table("settlement_batches")
    op.drop_table("flow_logs")
    op.drop_table("appeal_photos")
    op.drop_table("appeal_tickets")
    op.drop_table("subsidy_rules")
    op.drop_table("orders")
    op.drop_table("users")
