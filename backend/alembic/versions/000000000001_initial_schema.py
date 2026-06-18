"""initial schema

Revision ID: 000000000001
Revises: 
Create Date: 2026-06-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "000000000001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role_enum = postgresql.ENUM("admin", "technician", "manager", "parts", name="userrole", create_type=False)
    station_status_enum = postgresql.ENUM("idle", "occupied", "maintenance", name="stationstatus", create_type=False)
    work_order_status_enum = postgresql.ENUM(
        "pending", "in_progress", "completed", "closed", "reworked", name="workorderstatus", create_type=False
    )
    part_shortage_status_enum = postgresql.ENUM("open", "processing", "closed", name="partshortagestatus", create_type=False)

    user_role_enum.create(op.get_bind(), checkfirst=True)
    station_status_enum.create(op.get_bind(), checkfirst=True)
    work_order_status_enum.create(op.get_bind(), checkfirst=True)
    part_shortage_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("username", sa.String(length=50), unique=True, nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("role", user_role_enum, nullable=True, server_default="technician"),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("plate_number", sa.String(length=20), unique=True, nullable=False),
        sa.Column("vin", sa.String(length=50), unique=True, nullable=True),
        sa.Column("brand", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=50), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(length=30), nullable=True),
        sa.Column("mileage", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("owner_name", sa.String(length=100), nullable=True),
        sa.Column("owner_phone", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_vehicles_id"), "vehicles", ["id"], unique=False)
    op.create_index(op.f("ix_vehicles_plate_number"), "vehicles", ["plate_number"], unique=True)
    op.create_index(op.f("ix_vehicles_vin"), "vehicles", ["vin"], unique=True)

    op.create_table(
        "parts",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("sku", sa.String(length=50), unique=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=True),
        sa.Column("specification", sa.String(length=200), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=True, server_default="个"),
        sa.Column("safety_stock", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_parts_id"), "parts", ["id"], unique=False)
    op.create_index(op.f("ix_parts_sku"), "parts", ["sku"], unique=True)

    op.create_table(
        "work_orders",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("order_no", sa.String(length=30), unique=True, nullable=False),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("station_id", sa.Integer(), nullable=True),
        sa.Column("technician_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "status", work_order_status_enum, nullable=True, server_default="pending"
        ),
        sa.Column("complaint", sa.Text(), nullable=True),
        sa.Column("scheduled_start", sa.DateTime(), nullable=True),
        sa.Column("scheduled_end", sa.DateTime(), nullable=True),
        sa.Column("actual_start", sa.DateTime(), nullable=True),
        sa.Column("actual_end", sa.DateTime(), nullable=True),
        sa.Column("is_rework", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("parent_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_work_orders_id"), "work_orders", ["id"], unique=False)
    op.create_index(op.f("ix_work_orders_order_no"), "work_orders", ["order_no"], unique=True)

    op.create_table(
        "stations",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=50), unique=True, nullable=False),
        sa.Column("type", sa.String(length=30), nullable=True),
        sa.Column("status", station_status_enum, nullable=True, server_default="idle"),
        sa.Column(
            "current_work_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=True
        ),
    )
    op.create_index(op.f("ix_stations_id"), "stations", ["id"], unique=False)
    op.create_foreign_key("fk_stations_work_order", "stations", "work_orders", ["current_work_order_id"], ["id"])

    op.create_table(
        "diagnostics",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("technician_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("symptom", sa.Text(), nullable=True),
        sa.Column("fault_code", sa.String(length=100), nullable=True),
        sa.Column("analysis", sa.Text(), nullable=True),
        sa.Column("conclusion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_diagnostics_id"), "diagnostics", ["id"], unique=False)

    op.create_table(
        "work_order_items",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("work_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("item_type", sa.String(length=20), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=True, server_default="1"),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=True, server_default="0"),
        sa.Column("part_id", sa.Integer(), sa.ForeignKey("parts.id"), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True, server_default="pending"),
    )
    op.create_index(op.f("ix_work_order_items_id"), "work_order_items", ["id"], unique=False)

    op.create_table(
        "part_stocks",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("part_id", sa.Integer(), sa.ForeignKey("parts.id"), unique=True, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("last_updated", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_part_stocks_id"), "part_stocks", ["id"], unique=False)

    op.create_table(
        "stock_change_logs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("part_id", sa.Integer(), sa.ForeignKey("parts.id"), nullable=False),
        sa.Column("work_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=True),
        sa.Column("before_quantity", sa.Integer(), nullable=False),
        sa.Column("after_quantity", sa.Integer(), nullable=False),
        sa.Column("change_reason", sa.String(length=200), nullable=True),
        sa.Column("operator_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_stock_change_logs_id"), "stock_change_logs", ["id"], unique=False)

    op.create_table(
        "part_shortages",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("part_id", sa.Integer(), sa.ForeignKey("parts.id"), nullable=False),
        sa.Column("work_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=True),
        sa.Column("required_quantity", sa.Integer(), nullable=False),
        sa.Column("status", part_shortage_status_enum, nullable=True, server_default="open"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("action_taken", sa.Text(), nullable=True),
        sa.Column("handler_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reported_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
    )
    op.create_index(op.f("ix_part_shortages_id"), "part_shortages", ["id"], unique=False)

    op.create_table(
        "rework_records",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("original_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("rework_order_id", sa.Integer(), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("reported_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_rework_records_id"), "rework_records", ["id"], unique=False)

    op.create_table(
        "report_download_logs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("filter_criteria", sa.JSON(), nullable=True),
        sa.Column("generated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_report_download_logs_id"), "report_download_logs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_report_download_logs_id"), table_name="report_download_logs")
    op.drop_table("report_download_logs")

    op.drop_index(op.f("ix_rework_records_id"), table_name="rework_records")
    op.drop_table("rework_records")

    op.drop_index(op.f("ix_part_shortages_id"), table_name="part_shortages")
    op.drop_table("part_shortages")

    op.drop_index(op.f("ix_stock_change_logs_id"), table_name="stock_change_logs")
    op.drop_table("stock_change_logs")

    op.drop_index(op.f("ix_part_stocks_id"), table_name="part_stocks")
    op.drop_table("part_stocks")

    op.drop_index(op.f("ix_work_order_items_id"), table_name="work_order_items")
    op.drop_table("work_order_items")

    op.drop_index(op.f("ix_diagnostics_id"), table_name="diagnostics")
    op.drop_table("diagnostics")

    op.drop_index(op.f("ix_stations_id"), table_name="stations")
    op.drop_table("stations")

    op.drop_index(op.f("ix_work_orders_order_no"), table_name="work_orders")
    op.drop_index(op.f("ix_work_orders_id"), table_name="work_orders")
    op.drop_table("work_orders")

    op.drop_index(op.f("ix_parts_sku"), table_name="parts")
    op.drop_index(op.f("ix_parts_id"), table_name="parts")
    op.drop_table("parts")

    op.drop_index(op.f("ix_vehicles_vin"), table_name="vehicles")
    op.drop_index(op.f("ix_vehicles_plate_number"), table_name="vehicles")
    op.drop_index(op.f("ix_vehicles_id"), table_name="vehicles")
    op.drop_table("vehicles")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS stationstatus")
    op.execute("DROP TYPE IF EXISTS workorderstatus")
    op.execute("DROP TYPE IF EXISTS partshortagestatus")
