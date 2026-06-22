from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AUDITOR = "auditor"
    HANDLER = "handler"
    REVIEWER = "reviewer"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REVIEWING = "reviewing"
    REVIEW_FAILED = "review_failed"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    full_name = Column(String(100))
    hashed_password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.HANDLER)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20))
    department = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_orders = relationship("Order", foreign_keys="Order.assignee_id", back_populates="assignee")
    created_orders = relationship("Order", foreign_keys="Order.creator_id", back_populates="creator")
    process_records = relationship("ProcessRecord", back_populates="handler")
    review_supplements = relationship("ReviewSupplement", back_populates="operator")


class DispatchRule(Base):
    __tablename__ = "dispatch_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    description = Column(Text)
    department = Column(String(100))
    default_assignee_id = Column(Integer, ForeignKey("users.id"))
    priority = Column(Integer, default=0)
    handling_time_limit = Column(Integer, default=24)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    default_assignee = relationship("User")
    orders = relationship("Order", back_populates="dispatch_rule")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True)
    title = Column(String(200))
    description = Column(Text)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    priority = Column(Integer, default=1)
    audit_type = Column(String(50))
    audit_item = Column(String(100))
    location = Column(String(200))
    site_photo_url = Column(String(500))
    dispatch_rule_id = Column(Integer, ForeignKey("dispatch_rules.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    deadline = Column(DateTime(timezone=True))
    first_resolved = Column(Boolean, default=False)
    processing_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_orders")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_orders")
    dispatch_rule = relationship("DispatchRule", back_populates="orders")
    process_records = relationship("ProcessRecord", back_populates="order", cascade="all, delete-orphan")
    affected_objects = relationship("AffectedObject", back_populates="order", cascade="all, delete-orphan")
    review_supplements = relationship("ReviewSupplement", back_populates="order", cascade="all, delete-orphan")


class ProcessRecord(Base):
    __tablename__ = "process_records"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50))
    old_status = Column(Enum(OrderStatus))
    new_status = Column(Enum(OrderStatus))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="process_records")
    handler = relationship("User", back_populates="process_records")
    attachments = relationship("Attachment", back_populates="process_record", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    process_record_id = Column(Integer, ForeignKey("process_records.id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    process_record = relationship("ProcessRecord", back_populates="attachments")


class AffectedObject(Base):
    __tablename__ = "affected_objects"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    object_type = Column(String(50))
    object_name = Column(String(200))
    object_id = Column(String(100))
    description = Column(Text)
    impact_level = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="affected_objects")


class ReviewSupplement(Base):
    __tablename__ = "review_supplements"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    operator_id = Column(Integer, ForeignKey("users.id"))
    supplement_type = Column(String(50))
    content = Column(Text)
    old_assignee_id = Column(Integer, ForeignKey("users.id"))
    new_assignee_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="review_supplements")
    operator = relationship("User", foreign_keys=[operator_id], back_populates="review_supplements")
    old_assignee = relationship("User", foreign_keys=[old_assignee_id])
    new_assignee = relationship("User", foreign_keys=[new_assignee_id])
