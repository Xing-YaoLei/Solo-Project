import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON, Date, Time
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class RoleEnum(str, enum.Enum):
    WAREHOUSE = "warehouse"
    DRIVER = "driver"
    QC = "qc"
    PURCHASER = "purchaser"
    ADMIN = "admin"


class ReplenishmentStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_LOAD = "pending_load"
    LOADED = "loaded"
    IN_TRANSIT = "in_transit"
    ARRIVED = "arrived"
    QC_PENDING = "qc_pending"
    QC_DONE = "qc_done"
    DISCREPANCY = "discrepancy"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TemperatureAlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class DiscrepancyType(str, enum.Enum):
    QUANTITY_SHORT = "quantity_short"
    QUANTITY_OVER = "quantity_over"
    QUALITY_ISSUE = "quality_issue"
    WRONG_ITEM = "wrong_item"
    TEMPERATURE_ISSUE = "temperature_issue"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_replenishments = relationship(
        "ReplenishmentOrder", back_populates="creator", foreign_keys="ReplenishmentOrder.created_by"
    )
    handled_alerts = relationship(
        "TemperatureAlert", back_populates="handler", foreign_keys="TemperatureAlert.handled_by"
    )
    action_logs = relationship("ActionLog", back_populates="user")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    replenishments = relationship("ReplenishmentOrder", back_populates="store")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    unit = Column(String(20), default="箱")
    min_temp = Column(Float, default=0.0)
    max_temp = Column(Float, default=8.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("ReplenishmentItem", back_populates="product")


class ReplenishmentOrder(Base):
    __tablename__ = "replenishment_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    status = Column(Enum(ReplenishmentStatus), default=ReplenishmentStatus.DRAFT, nullable=False)
    planned_date = Column(Date, nullable=False)
    truck_no = Column(String(50))
    driver_name = Column(String(100))
    driver_phone = Column(String(20))
    loading_list_no = Column(String(50))
    loading_time = Column(DateTime)
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    remark = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="replenishments")
    creator = relationship("User", back_populates="created_replenishments", foreign_keys=[created_by])
    items = relationship("ReplenishmentItem", back_populates="order", cascade="all, delete-orphan")
    batches = relationship("BatchCode", back_populates="order", cascade="all, delete-orphan")
    qc_records = relationship("QCRecord", back_populates="order", cascade="all, delete-orphan")
    discrepancies = relationship("Discrepancy", back_populates="order", cascade="all, delete-orphan")
    temperature_records = relationship("TemperatureRecord", back_populates="order", cascade="all, delete-orphan")
    alerts = relationship("TemperatureAlert", back_populates="order")
    attachments = relationship("Attachment", back_populates="order")
    logs = relationship("ActionLog", back_populates="order")


class ReplenishmentItem(Base):
    __tablename__ = "replenishment_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    planned_qty = Column(Float, nullable=False)
    loaded_qty = Column(Float, default=0.0)
    received_qty = Column(Float, default=0.0)
    unit_price = Column(Float)
    remark = Column(Text)

    order = relationship("ReplenishmentOrder", back_populates="items")
    product = relationship("Product", back_populates="items")


class BatchCode(Base):
    __tablename__ = "batch_codes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_no = Column(String(100), nullable=False)
    qty = Column(Float, nullable=False)
    production_date = Column(Date)
    expiry_date = Column(Date)
    verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("ReplenishmentOrder", back_populates="batches")
    product = relationship("Product")


class QCRecord(Base):
    __tablename__ = "qc_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_code_id = Column(Integer, ForeignKey("batch_codes.id"))
    checked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    appearance_ok = Column(Boolean, default=True)
    packaging_ok = Column(Boolean, default=True)
    temperature_ok = Column(Boolean, default=True)
    passed = Column(Boolean, default=True)
    remark = Column(Text)

    order = relationship("ReplenishmentOrder", back_populates="qc_records")
    product = relationship("Product")
    batch = relationship("BatchCode")
    images = relationship("QCImage", back_populates="qc_record", cascade="all, delete-orphan")


class QCImage(Base):
    __tablename__ = "qc_images"

    id = Column(Integer, primary_key=True, index=True)
    qc_record_id = Column(Integer, ForeignKey("qc_records.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255))
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    qc_record = relationship("QCRecord", back_populates="images")


class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    type = Column(Enum(DiscrepancyType), nullable=False)
    expected_qty = Column(Float)
    actual_qty = Column(Float)
    diff_qty = Column(Float)
    description = Column(Text)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_note = Column(Text)

    order = relationship("ReplenishmentOrder", back_populates="discrepancies")
    product = relationship("Product")


class TemperatureRecord(Base):
    __tablename__ = "temperature_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    temperature = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    min_temp = Column(Float)
    max_temp = Column(Float)
    is_out_of_range = Column(Boolean, default=False)
    location = Column(String(100))
    device_id = Column(String(100))

    order = relationship("ReplenishmentOrder", back_populates="temperature_records")


class TemperatureAlert(Base):
    __tablename__ = "temperature_alerts"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    trigger_record_id = Column(Integer, ForeignKey("temperature_records.id"))
    status = Column(Enum(TemperatureAlertStatus), default=TemperatureAlertStatus.OPEN, nullable=False)
    alert_type = Column(String(50), default="temperature_breach")
    severity = Column(String(20), default="warning")
    min_temp = Column(Float)
    max_temp = Column(Float)
    actual_temp = Column(Float)
    duration_minutes = Column(Integer, default=0)
    source_type = Column(String(50), default="auto")
    source_ref = Column(String(255))
    description = Column(Text)
    acknowledged_at = Column(DateTime)
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime)
    resolution = Column(Text)
    closed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("ReplenishmentOrder", back_populates="alerts")
    trigger_record = relationship("TemperatureRecord")
    handler = relationship("User", back_populates="handled_alerts", foreign_keys=[handled_by])
    history = relationship("AlertHistory", back_populates="alert", cascade="all, delete-orphan")


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("temperature_alerts.id"), nullable=False)
    from_status = Column(Enum(TemperatureAlertStatus))
    to_status = Column(Enum(TemperatureAlertStatus), nullable=False)
    action = Column(String(100), nullable=False)
    note = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("TemperatureAlert", back_populates="history")
    operator = relationship("User")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    category = Column(String(50))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("ReplenishmentOrder", back_populates="attachments")
    uploader = relationship("User")


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("replenishment_orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    detail = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("ReplenishmentOrder", back_populates="logs")
    user = relationship("User", back_populates="action_logs")
