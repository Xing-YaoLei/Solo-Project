from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean, Text, ForeignKey, Numeric
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class RawReceipt(Base):
    __tablename__ = "raw_receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    receipt_no = Column(String(64), nullable=False)
    store_code = Column(String(32), nullable=False)
    member_id = Column(String(64))
    transaction_time = Column(DateTime, nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    quantity = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(16))
    amount = Column(Numeric(12, 2))
    raw_source = Column(String(32))
    ingested_at = Column(DateTime, default=datetime.utcnow)
    is_cleaned = Column(Boolean, default=False)


class RawInventory(Base):
    __tablename__ = "raw_inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_code = Column(String(32), nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    batch_no = Column(String(64))
    stock_qty = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(16))
    safety_stock = Column(Numeric(12, 3))
    warehouse_code = Column(String(32))
    snapshot_date = Column(Date, nullable=False)
    raw_source = Column(String(32))
    ingested_at = Column(DateTime, default=datetime.utcnow)
    is_cleaned = Column(Boolean, default=False)


class RawPos(Base):
    __tablename__ = "raw_pos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pos_trans_id = Column(String(64), nullable=False)
    store_code = Column(String(32), nullable=False)
    transaction_time = Column(DateTime, nullable=False)
    product_code = Column(String(64), nullable=False)
    product_name = Column(String(128))
    quantity = Column(Numeric(12, 3), nullable=False)
    amount = Column(Numeric(12, 2))
    raw_source = Column(String(32))
    ingested_at = Column(DateTime, default=datetime.utcnow)
    is_cleaned = Column(Boolean, default=False)


class CleanedInventory(Base):
    __tablename__ = "cleaned_inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_code = Column(String(32), nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    batch_no = Column(String(64))
    stock_qty = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(16))
    safety_stock = Column(Numeric(12, 3))
    warehouse_code = Column(String(32))
    snapshot_date = Column(Date, nullable=False)
    cleaned_at = Column(DateTime, default=datetime.utcnow)


class InventoryLedger(Base):
    __tablename__ = "inventory_ledger"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_code = Column(String(32), nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    transaction_type = Column(String(32), nullable=False)
    quantity = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(16))
    batch_no = Column(String(64))
    supplier_code = Column(String(32))
    transaction_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class BatchInfo(Base):
    __tablename__ = "batch_info"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(64), nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    store_code = Column(String(32), nullable=False)
    supplier_code = Column(String(32))
    production_date = Column(Date)
    expiry_date = Column(Date, nullable=False)
    received_date = Column(Date)
    initial_qty = Column(Numeric(12, 3))
    current_qty = Column(Numeric(12, 3))
    unit = Column(String(16))
    status = Column(String(16), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class Supplier(Base):
    __tablename__ = "supplier"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_code = Column(String(32), nullable=False, unique=True)
    supplier_name = Column(String(128), nullable=False)
    contact_person = Column(String(64))
    contact_phone = Column(String(32))
    lead_time_days = Column(Integer, default=3)
    rating = Column(Numeric(3, 2))
    material_category = Column(String(64))
    created_at = Column(DateTime, default=datetime.utcnow)


class MaterialDailyUsage(Base):
    __tablename__ = "material_daily_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_code = Column(String(32), nullable=False)
    material_code = Column(String(64), nullable=False)
    usage_date = Column(Date, nullable=False)
    usage_qty = Column(Numeric(12, 3), nullable=False)
    unit = Column(String(16))
    turnover_days = Column(Numeric(8, 2))
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertThreshold(Base):
    __tablename__ = "alert_threshold"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_code = Column(String(64), nullable=False)
    store_code = Column(String(32), nullable=False)
    threshold_type = Column(String(32), nullable=False)
    threshold_value = Column(Numeric(12, 3), nullable=False)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(64))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AlertRecord(Base):
    __tablename__ = "alert_record"

    id = Column(Integer, primary_key=True, autoincrement=True)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    store_code = Column(String(32), nullable=False)
    alert_type = Column(String(32), nullable=False)
    alert_level = Column(String(16), default="warning")
    current_value = Column(Numeric(12, 3))
    threshold_value = Column(Numeric(12, 3))
    message = Column(Text)
    is_resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)


class ReviewMaterial(Base):
    __tablename__ = "review_material"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(256), nullable=False)
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    store_code = Column(String(32), nullable=False)
    shortage_qty = Column(Numeric(12, 3))
    turnover_days = Column(Numeric(8, 2))
    avg_daily_usage = Column(Numeric(12, 3))
    supplier_code = Column(String(32))
    batch_info_summary = Column(Text)
    root_cause = Column(Text)
    action_plan = Column(Text)
    review_date = Column(Date, nullable=False)
    status = Column(String(16), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    alert_record_id = Column(Integer, ForeignKey("alert_record.id"))
    alert_record = relationship("AlertRecord")


class ProductBom(Base):
    __tablename__ = "product_bom"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_code = Column(String(64), nullable=False)
    product_name = Column(String(128))
    material_code = Column(String(64), nullable=False)
    material_name = Column(String(128))
    usage_qty = Column(Numeric(12, 5), nullable=False)
    unit = Column(String(16))
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        dict(postgresql_unique_constraints=[{"name": "uq_prod_mat", "columns": ["product_code", "material_code"]}])
    )
