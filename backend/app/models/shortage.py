from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ShortageStatus


class ShortageRecord(Base):
    __tablename__ = "shortage_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    work_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("work_orders.id"), nullable=False)
    part_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("parts.id"), nullable=True)
    part_name: Mapped[str] = mapped_column(String, nullable=False)
    requested_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[ShortageStatus] = mapped_column(SAEnum(ShortageStatus), default=ShortageStatus.pending)
    expected_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    substitute_part_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("parts.id"), nullable=True)
    handled_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="shortages")
    part: Mapped["Part | None"] = relationship("Part", foreign_keys=[part_id])
    substitute_part: Mapped["Part | None"] = relationship("Part", foreign_keys=[substitute_part_id])
    handler: Mapped["User | None"] = relationship("User", foreign_keys=[handled_by])
