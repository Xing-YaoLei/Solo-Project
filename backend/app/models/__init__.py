from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    WORKER = "worker"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.WORKER, nullable=False)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20))
    department = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_orders = relationship("WorkOrder", back_populates="assigned_worker", foreign_keys="WorkOrder.assigned_to")
    created_orders = relationship("WorkOrder", back_populates="creator", foreign_keys="WorkOrder.created_by")
    review_records = relationship("ReviewRecord", back_populates="reviewer")
    communications = relationship("Communication", back_populates="sender")


class WorkOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWING = "reviewing"
    REVIEW_FAILED = "review_failed"
    CLOSED = "closed"


class WorkOrderPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class WorkOrderCategory(str, enum.Enum):
    ELECTRICAL = "electrical"
    PLUMBING = "plumbing"
    HVAC = "hvac"
    CIVIL = "civil"
    CLEANING = "cleaning"
    SECURITY = "security"
    OTHER = "other"


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    category = Column(Enum(WorkOrderCategory), nullable=False)
    priority = Column(Enum(WorkOrderPriority), default=WorkOrderPriority.MEDIUM, nullable=False)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.PENDING, nullable=False)

    reporter_name = Column(String(100))
    reporter_phone = Column(String(20))

    created_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))

    deadline = Column(DateTime(timezone=True))
    processing_hours = Column(Float, default=0)

    is_first_time_resolved = Column(Boolean, default=True)
    review_failed_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))

    creator = relationship("User", back_populates="created_orders", foreign_keys=[created_by])
    assigned_worker = relationship("User", back_populates="assigned_orders", foreign_keys=[assigned_to])
    photos = relationship("WorkOrderPhoto", back_populates="work_order", cascade="all, delete-orphan")
    status_logs = relationship("StatusLog", back_populates="work_order", cascade="all, delete-orphan")
    review_records = relationship("ReviewRecord", back_populates="work_order", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="work_order", cascade="all, delete-orphan")
    dispatch_rules = relationship("DispatchRule", secondary="work_order_dispatch_rules", back_populates="work_orders")


class WorkOrderPhoto(Base):
    __tablename__ = "work_order_photos"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    url = Column(String(500), nullable=False)
    caption = Column(String(200))
    photo_type = Column(String(50))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="photos")


class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    from_status = Column(Enum(WorkOrderStatus))
    to_status = Column(Enum(WorkOrderStatus), nullable=False)
    remark = Column(Text)
    operated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="status_logs")


class ReviewRecord(Base):
    __tablename__ = "review_records"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_passed = Column(Boolean, nullable=False)
    comment = Column(Text)
    review_time = Column(DateTime(timezone=True), server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="review_records")
    reviewer = relationship("User", back_populates="review_records")


class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    msg_type = Column(String(20), default="text")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="communications")
    sender = relationship("User", back_populates="communications")


class DispatchRule(Base):
    __tablename__ = "dispatch_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(Enum(WorkOrderCategory))
    priority = Column(Enum(WorkOrderPriority))
    assigned_role = Column(String(50))
    default_assignee_id = Column(Integer, ForeignKey("users.id"))
    processing_hours = Column(Float, default=24)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_orders = relationship("WorkOrder", secondary="work_order_dispatch_rules", back_populates="dispatch_rules")


class WorkOrderDispatchRule(Base):
    __tablename__ = "work_order_dispatch_rules"

    work_order_id = Column(Integer, ForeignKey("work_orders.id"), primary_key=True)
    dispatch_rule_id = Column(Integer, ForeignKey("dispatch_rules.id"), primary_key=True)
