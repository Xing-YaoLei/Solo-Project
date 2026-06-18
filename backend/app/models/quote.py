from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import QuoteStatus, ItemType


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    quote_no: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    work_order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("work_orders.id"), nullable=False)
    status: Mapped[QuoteStatus] = mapped_column(SAEnum(QuoteStatus), default=QuoteStatus.draft)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="quotes")
    approver: Mapped["User | None"] = relationship("User", foreign_keys=[approved_by])
    items: Mapped[list["QuoteItem"]] = relationship("QuoteItem", back_populates="quote")


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    quote_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quotes.id"), nullable=False)
    item_type: Mapped[ItemType] = mapped_column(SAEnum(ItemType), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    quote: Mapped["Quote"] = relationship("Quote", back_populates="items")
