from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    region = Column(String(100), nullable=False)
    address = Column(String(500))
    contact = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="property")
    ota_orders = relationship("OTAOrder", back_populates="property")
    payments = relationship("PaymentTransaction", back_populates="property")
    door_records = relationship("DoorRecord", back_populates="property")


class OTAOrder(Base):
    __tablename__ = "ota_orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    platform_order_no = Column(String(100), nullable=False, unique=True)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    guest_name = Column(String(100))
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    amount = Column(Numeric(10, 2))
    source = Column(String(50))
    synced_at = Column(DateTime)
    sync_batch_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="ota_orders")
    complaints = relationship("Complaint", back_populates="order")
    payments = relationship("PaymentTransaction", back_populates="order")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_no = Column(String(100), nullable=False, unique=True)
    order_id = Column(String, ForeignKey("ota_orders.id"))
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50))
    status = Column(String(30))
    transacted_at = Column(DateTime)
    synced_at = Column(DateTime)
    sync_batch_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="payments")
    order = relationship("OTAOrder", back_populates="payments")


class DoorRecord(Base):
    __tablename__ = "door_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    room_no = Column(String(30))
    card_no = Column(String(50))
    action_type = Column(String(30))
    action_time = Column(DateTime)
    synced_at = Column(DateTime)
    sync_batch_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    property = relationship("Property", back_populates="door_records")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("ota_orders.id"))
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    region = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(30), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime)
    resolved_at = Column(DateTime)
    closed_at = Column(DateTime)
    handler = Column(String(100))
    escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime)
    escalation_level = Column(Integer, default=0)
    processing_time = Column(Integer, default=0)
    target_time = Column(Integer, default=1440)
    is_overdue = Column(Boolean, default=False)
    callback_result = Column(String(20))
    callback_note = Column(Text)
    responsibility = Column(String(100))
    responsibility_dept = Column(String(100))

    property = relationship("Property", back_populates="complaints")
    order = relationship("OTAOrder", back_populates="complaints")
    logs = relationship("ComplaintLog", back_populates="complaint")
    callbacks = relationship("CallbackRecord", back_populates="complaint")


class ComplaintLog(Base):
    __tablename__ = "complaint_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    action = Column(String(50), nullable=False)
    operator = Column(String(100))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="logs")


class CallbackRecord(Base):
    __tablename__ = "callback_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    result = Column(String(20), nullable=False)
    note = Column(Text)
    operator = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="callbacks")


class SyncNode(Base):
    __tablename__ = "sync_nodes"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    source_type = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    seq_order = Column(Integer, nullable=False)
    last_sync_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("SyncLog", back_populates="node")


class SyncBatch(Base):
    __tablename__ = "sync_batches"

    id = Column(String, primary_key=True, default=generate_uuid)
    source_type = Column(String(30), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    status = Column(String(20), nullable=False, default="running")
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)

    logs = relationship("SyncLog", back_populates="batch")


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    node_id = Column(String, ForeignKey("sync_nodes.id"), nullable=False)
    batch_id = Column(String, ForeignKey("sync_batches.id"), nullable=False)
    status = Column(String(20), nullable=False)
    record_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    error_detail = Column(Text)
    raw_data_sample = Column(JSON)

    node = relationship("SyncNode", back_populates="logs")
    batch = relationship("SyncBatch", back_populates="logs")
