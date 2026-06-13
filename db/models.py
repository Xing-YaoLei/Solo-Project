from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String(32), nullable=False, index=True)
    customer_id = Column(String(32), nullable=False, index=True)
    customer_name = Column(String(64), nullable=False)
    service_item = Column(String(128), nullable=False)
    staff_id = Column(String(32), nullable=False)
    staff_name = Column(String(64), nullable=False)
    appointment_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(32), nullable=False, default="booked")
    attendance_status = Column(String(32), nullable=True)
    reschedule_count = Column(Integer, default=0)
    reschedule_reason = Column(String(256), nullable=True)
    original_time = Column(DateTime, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("store_id", "customer_id", "appointment_time", name="uq_appointment"),
        {"comment": "预约记录表"},
    )

    cashier_records = relationship("CashierRecord", back_populates="appointment")
    review_record = relationship("ReviewRecord", back_populates="appointment", uselist=False)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String(32), nullable=False, index=True)
    service_item = Column(String(128), nullable=False)
    sku = Column(String(64), nullable=False)
    stock_qty = Column(Integer, default=0)
    reserved_qty = Column(Integer, default=0)
    unit = Column(String(16), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("store_id", "sku", name="uq_inventory_sku"),
        {"comment": "库存表"},
    )


class CashierRecord(Base):
    __tablename__ = "cashier_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String(32), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)
    customer_id = Column(String(32), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(32), nullable=True)
    transaction_type = Column(String(32), nullable=False)
    transaction_time = Column(DateTime, nullable=False, index=True)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        {"comment": "收银流水表（明细追溯来源）"},
    )

    appointment = relationship("Appointment", back_populates="cashier_records")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String(32), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)
    customer_id = Column(String(32), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    review_content = Column(Text, nullable=True)
    review_tags = Column(String(256), nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        {"comment": "点评记录表"},
    )

    appointment = relationship("Appointment", back_populates="review_record")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default="viewer")
    store_id = Column(String(32), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        {"comment": "用户表，role: admin/store_manager/staff/viewer"},
    )


class DataRefreshLog(Base):
    __tablename__ = "data_refresh_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_name = Column(String(128), nullable=False)
    status = Column(String(32), nullable=False, default="running")
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    row_count = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    __table_args__ = (
        {"comment": "数据刷新日志表"},
    )
