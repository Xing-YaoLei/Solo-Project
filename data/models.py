import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Date, DateTime, Boolean, Numeric, Text, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from utils.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Property(Base):
    __tablename__ = "properties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    property_code = Column(String(50), unique=True, nullable=False)
    property_name = Column(String(200), nullable=False)
    room_count = Column(Integer, nullable=False, default=1)
    city = Column(String(100))
    district = Column(String(100))
    address = Column(Text)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    ota_orders = relationship("OTAOrder", back_populates="property")
    room_statuses = relationship("RoomStatus", back_populates="property")
    payments = relationship("PaymentTransaction", back_populates="property")
    door_locks = relationship("DoorLockRecord", back_populates="property")
    cleaning_tasks = relationship("CleaningTask", back_populates="property")


class RoomStatus(Base):
    __tablename__ = "room_status"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    status_date = Column(Date, nullable=False)
    room_type = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False)
    occupancy_status = Column(String(20), nullable=False, default="vacant")
    source = Column(String(50))
    has_conflict = Column(Boolean, nullable=False, default=False)
    conflict_detail = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="room_statuses")


class OTAOrder(Base):
    __tablename__ = "ota_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    order_no = Column(String(100), unique=True, nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    channel = Column(String(50), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    guest_name = Column(String(100))
    guest_phone = Column(String(50))
    room_count = Column(Integer, nullable=False, default=1)
    room_type = Column(String(50))
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    paid_amount = Column(Numeric(12, 2), nullable=False, default=0)
    order_status = Column(String(30), nullable=False)
    raw_data = Column(JSON)
    is_anomaly = Column(Boolean, nullable=False, default=False)
    anomaly_detail = Column(JSON)
    synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="ota_orders")
    payments = relationship("PaymentTransaction", back_populates="order")
    cleaning_tasks = relationship("CleaningTask", back_populates="order")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    transaction_no = Column(String(100), unique=True, nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("ota_orders.id"))
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    channel = Column(String(50))
    payment_method = Column(String(50))
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_time = Column(DateTime(timezone=True), nullable=False)
    transaction_status = Column(String(30), nullable=False)
    payer = Column(String(200))
    raw_data = Column(JSON)
    is_anomaly = Column(Boolean, nullable=False, default=False)
    anomaly_detail = Column(JSON)
    synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="payments")
    order = relationship("OTAOrder", back_populates="payments")


class DoorLockRecord(Base):
    __tablename__ = "door_lock_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    record_no = Column(String(100), unique=True, nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    lock_device_id = Column(String(100))
    action_type = Column(String(30), nullable=False)
    action_time = Column(DateTime(timezone=True), nullable=False)
    operator = Column(String(100))
    operator_type = Column(String(50))
    room_no = Column(String(50))
    raw_data = Column(JSON)
    is_anomaly = Column(Boolean, nullable=False, default=False)
    anomaly_detail = Column(JSON)
    synced_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="door_locks")


class CleaningTask(Base):
    __tablename__ = "cleaning_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    task_no = Column(String(100), unique=True, nullable=False)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("ota_orders.id"))
    room_type = Column(String(50))
    scheduled_date = Column(Date, nullable=False)
    task_type = Column(String(50), nullable=False)
    task_status = Column(String(30), nullable=False)
    assigned_to = Column(String(100))
    completed_at = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="cleaning_tasks")
    order = relationship("OTAOrder", back_populates="cleaning_tasks")


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    sync_type = Column(String(50), nullable=False)
    status = Column(String(30), nullable=False)
    records_processed = Column(Integer, nullable=False, default=0)
    records_anomaly = Column(Integer, nullable=False, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class DataAnomaly(Base):
    __tablename__ = "data_anomalies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    source_table = Column(String(50), nullable=False)
    source_id = Column(UUID(as_uuid=True))
    anomaly_type = Column(String(50), nullable=False)
    anomaly_field = Column(String(100))
    original_value = Column(Text)
    expected_value = Column(Text)
    description = Column(Text)
    severity = Column(String(20), nullable=False, default="warning")
    is_resolved = Column(Boolean, nullable=False, default=False)
    resolved_note = Column(Text)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True))
