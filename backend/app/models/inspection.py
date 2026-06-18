from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import InspectionType, InspectionResult


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("work_orders.id"), nullable=False)
    inspector_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[InspectionType] = mapped_column(SAEnum(InspectionType), nullable=False)
    result: Mapped[InspectionResult] = mapped_column(SAEnum(InspectionResult), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="inspections")
    inspector: Mapped["User"] = relationship("User", foreign_keys=[inspector_id])
    photos: Mapped[list["InspectionPhoto"]] = relationship("InspectionPhoto", back_populates="inspection")


class InspectionPhoto(Base):
    __tablename__ = "inspection_photos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspection_records.id"), nullable=False)
    photo_url: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())

    inspection: Mapped["InspectionRecord"] = relationship("InspectionRecord", back_populates="photos")
