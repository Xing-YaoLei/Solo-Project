from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    DateTime,
    Date,
    Boolean,
    Text,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class SyncBatch(Base):
    __tablename__ = "sync_batch"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(64), unique=True, nullable=False)
    source = Column(String(32), nullable=False)
    status = Column(String(16), nullable=False, default="pending")
    record_count = Column(Integer, default=0)
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (Index("ix_sync_batch_source_status", "source", "status"),)


class GroupBuyBatch(Base):
    __tablename__ = "group_buy_batch"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(64), unique=True, nullable=False)
    batch_date = Column(Date, nullable=False)
    region_code = Column(String(32), nullable=False)
    region_name = Column(String(64))
    community_name = Column(String(128))
    leader_name = Column(String(64))
    status = Column(String(32), nullable=False, default="created")
    total_orders = Column(Integer, default=0)
    total_amount = Column(Numeric(12, 2), default=0)
    expected_arrival_time = Column(DateTime)
    actual_arrival_time = Column(DateTime)
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (Index("ix_gbb_date_region", "batch_date", "region_code"),)


class WarehouseOutbound(Base):
    __tablename__ = "warehouse_outbound"

    id = Column(Integer, primary_key=True, autoincrement=True)
    outbound_no = Column(String(64), unique=True, nullable=False)
    batch_no = Column(String(64), ForeignKey("group_buy_batch.batch_no"), nullable=False)
    sku_code = Column(String(64), nullable=False)
    sku_name = Column(String(128))
    qty_planned = Column(Integer, default=0)
    qty_actual = Column(Integer, default=0)
    warehouse_code = Column(String(32))
    warehouse_name = Column(String(64))
    outbound_time = Column(DateTime)
    status = Column(String(32), default="pending")
    sync_batch_id = Column(String(64), ForeignKey("sync_batch.batch_id"))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_wo_batch_no", "batch_no"),
        Index("ix_wo_sync_batch", "sync_batch_id"),
    )


class DriverTrack(Base):
    __tablename__ = "driver_track"

    id = Column(Integer, primary_key=True, autoincrement=True)
    track_id = Column(String(64), unique=True, nullable=False)
    batch_no = Column(String(64), ForeignKey("group_buy_batch.batch_no"), nullable=False)
    driver_name = Column(String(64))
    vehicle_no = Column(String(32))
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    route_stop_seq = Column(Integer)
    stop_community = Column(String(128))
    stop_longitude = Column(Numeric(10, 6))
    stop_latitude = Column(Numeric(10, 6))
    stop_arrival_time = Column(DateTime)
    stop_departure_time = Column(DateTime)
    is_on_time = Column(Boolean, default=True)
    sync_batch_id = Column(String(64), ForeignKey("sync_batch.batch_id"))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_dt_batch_no", "batch_no"),
        Index("ix_dt_sync_batch", "sync_batch_id"),
    )


class MiniappOrder(Base):
    __tablename__ = "miniapp_order"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_no = Column(String(64), unique=True, nullable=False)
    batch_no = Column(String(64), ForeignKey("group_buy_batch.batch_no"), nullable=False)
    user_id = Column(String(64), nullable=False)
    sku_code = Column(String(64), nullable=False)
    sku_name = Column(String(128))
    qty = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2))
    total_amount = Column(Numeric(12, 2))
    order_time = Column(DateTime)
    pay_time = Column(DateTime)
    order_status = Column(String(32))
    region_code = Column(String(32))
    sync_batch_id = Column(String(64), ForeignKey("sync_batch.batch_id"))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_mo_batch_no", "batch_no"),
        Index("ix_mo_sync_batch", "sync_batch_id"),
    )


class ProductTag(Base):
    __tablename__ = "product_tag"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku_code = Column(String(64), nullable=False)
    tag_name = Column(String(64), nullable=False)
    tag_value = Column(String(128))
    effective_date = Column(Date)
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        UniqueConstraint("sku_code", "tag_name", "effective_date", name="uq_product_tag"),
        Index("ix_pt_sku_tag", "sku_code", "tag_name"),
    )


class Settlement(Base):
    __tablename__ = "settlement"

    id = Column(Integer, primary_key=True, autoincrement=True)
    settlement_no = Column(String(64), unique=True, nullable=False)
    batch_no = Column(String(64), ForeignKey("group_buy_batch.batch_no"), nullable=False)
    sku_code = Column(String(64), nullable=False)
    sku_name = Column(String(128))
    settled_qty = Column(Integer, default=0)
    settled_amount = Column(Numeric(12, 2), default=0)
    settlement_date = Column(Date, nullable=False)
    region_code = Column(String(32))
    supplier_code = Column(String(32))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_stl_batch_no", "batch_no"),
        Index("ix_stl_date_region", "settlement_date", "region_code"),
    )


class ArrivalChecklist(Base):
    __tablename__ = "arrival_checklist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    checklist_no = Column(String(64), unique=True, nullable=False)
    batch_no = Column(String(64), ForeignKey("group_buy_batch.batch_no"), nullable=False)
    sku_code = Column(String(64), nullable=False)
    sku_name = Column(String(128))
    qty_expected = Column(Integer, default=0)
    qty_received = Column(Integer, default=0)
    qty_shortage = Column(Integer, default=0)
    shortage_reason = Column(String(256))
    handler = Column(String(64))
    is_resolved = Column(Boolean, default=False)
    check_time = Column(DateTime)
    region_code = Column(String(32))
    community_name = Column(String(128))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_acl_batch_no", "batch_no"),
        Index("ix_acl_shortage", "qty_shortage"),
    )


class FunnelMetric(Base):
    __tablename__ = "funnel_metric"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_date = Column(Date, nullable=False)
    region_code = Column(String(32), nullable=False)
    region_name = Column(String(64))
    batch_no = Column(String(64))
    total_orders = Column(Integer, default=0)
    outbound_orders = Column(Integer, default=0)
    delivered_orders = Column(Integer, default=0)
    received_orders = Column(Integer, default=0)
    settled_orders = Column(Integer, default=0)
    fulfillment_on_time_rate = Column(Numeric(5, 4))
    shortage_rate = Column(Numeric(5, 4))
    created_at = Column(DateTime, server_default="now()")

    __table_args__ = (
        Index("ix_fm_date_region", "batch_date", "region_code"),
    )
