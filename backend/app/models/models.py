from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    consultant = "consultant"
    technician = "technician"
    parts_staff = "parts_staff"
    manager = "manager"


class Priority(str, enum.Enum):
    normal = "normal"
    urgent = "urgent"
    critical = "critical"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    waiting_parts = "waiting_parts"
    in_inspection = "in_inspection"
    completed = "completed"
    closed = "closed"
    rework = "rework"


class InspectionType(str, enum.Enum):
    pre_work = "pre_work"
    in_process = "in_process"
    post_work = "post_work"
    delivery = "delivery"


class InspectionResult(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    conditional = "conditional"


class ShortageStatus(str, enum.Enum):
    pending = "pending"
    ordered = "ordered"
    arrived = "arrived"
    substituted = "substituted"
    cancelled = "cancelled"


class QuoteStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class ItemType(str, enum.Enum):
    labor = "labor"
    part = "part"
    other = "other"


class PartIssueStatus(str, enum.Enum):
    pending = "pending"
    issued = "issued"
    returned = "returned"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(Enum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_phone: Mapped[str | None] = mapped_column(String(20))
    vehicle_plate: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_model: Mapped[str | None] = mapped_column(String(100))
    vin: Mapped[str | None] = mapped_column(String(50))
    priority: Mapped[str] = mapped_column(Enum(Priority), default=Priority.normal)
    status: Mapped[str] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending)
    assigned_consultant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_technician_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    estimated_completion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mileage_in: Mapped[int | None] = mapped_column(Integer)
    customer_complaint: Mapped[str | None] = mapped_column(Text)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    is_rework: Mapped[bool] = mapped_column(Boolean, default=False)
    original_order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assigned_consultant = relationship("User", foreign_keys=[assigned_consultant_id])
    assigned_technician = relationship("User", foreign_keys=[assigned_technician_id])
    parts = relationship("WorkOrderPart", back_populates="work_order")
    quotes = relationship("Quote", back_populates="work_order")
    inspections = relationship("InspectionRecord", back_populates="work_order")
    shortages = relationship("ShortageRecord", back_populates="work_order")


class Part(Base):
    __tablename__ = "parts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    unit: Mapped[str] = mapped_column(String(20), default="个")
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str | None] = mapped_column(String(100))


class WorkOrderPart(Base):
    __tablename__ = "work_order_parts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    part_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("parts.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(Enum(PartIssueStatus), default=PartIssueStatus.pending)
    issued_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    work_order = relationship("WorkOrder", back_populates="parts")
    part = relationship("Part")


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    work_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(Enum(QuoteStatus), default=QuoteStatus.draft)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    work_order = relationship("WorkOrder", back_populates="quotes")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quotes.id"), nullable=False)
    item_type: Mapped[str] = mapped_column(Enum(ItemType), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    quote = relationship("Quote", back_populates="items")


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    type: Mapped[str] = mapped_column(Enum(InspectionType), nullable=False)
    result: Mapped[str] = mapped_column(Enum(InspectionResult), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    inspector_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order = relationship("WorkOrder", back_populates="inspections")
    inspector = relationship("User")
    photos = relationship("InspectionPhoto", back_populates="inspection", cascade="all, delete-orphan")


class InspectionPhoto(Base):
    __tablename__ = "inspection_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("inspection_records.id"), nullable=False)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("InspectionRecord", back_populates="photos")


class ShortageRecord(Base):
    __tablename__ = "shortage_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    part_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("parts.id"))
    part_name: Mapped[str] = mapped_column(String(200), nullable=False)
    requested_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(Enum(ShortageStatus), default=ShortageStatus.pending)
    expected_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    substitute_part_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("parts.id"))
    resolution_notes: Mapped[str | None] = mapped_column(Text)
    handled_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    work_order = relationship("WorkOrder", back_populates="shortages")
    part = relationship("Part", foreign_keys=[part_id])
    substitute_part = relationship("Part", foreign_keys=[substitute_part_id])
    handler = relationship("User", foreign_keys=[handled_by])
