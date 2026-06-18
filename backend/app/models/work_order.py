from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import OrderStatus, Priority


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_no: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    vehicle_plate: Mapped[str] = mapped_column(String, nullable=False)
    vehicle_model: Mapped[str | None] = mapped_column(String, nullable=True)
    vin: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), default=OrderStatus.pending)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority), default=Priority.normal)
    assigned_consultant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_technician_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    estimated_completion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_completion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mileage_in: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mileage_out: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_complaint: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    repair_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    is_rework: Mapped[bool] = mapped_column(Boolean, default=False)
    original_order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    assigned_consultant: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_consultant_id], back_populates="consultant_orders"
    )
    assigned_technician: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_technician_id], back_populates="technician_orders"
    )
    original_order: Mapped["WorkOrder | None"] = relationship(
        "WorkOrder", remote_side=[id], foreign_keys=[original_order_id]
    )
    parts: Mapped[list["WorkOrderPart"]] = relationship("WorkOrderPart", back_populates="work_order")
    quotes: Mapped[list["Quote"]] = relationship("Quote", back_populates="work_order")
    inspections: Mapped[list["InspectionRecord"]] = relationship("InspectionRecord", back_populates="work_order")
    shortages: Mapped[list["ShortageRecord"]] = relationship("ShortageRecord", back_populates="work_order")
