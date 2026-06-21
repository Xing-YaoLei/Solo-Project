import enum

from sqlalchemy import Column, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class FeeType(str, enum.Enum):
    CONSULTING = "consulting"
    LITIGATION = "litigation"
    NON_LITIGATION = "non_litigation"
    RETAINER = "retainer"
    TRAVEL = "travel"
    DOCUMENT = "document"
    NOTARY = "notary"
    OTHER = "other"


class InvoiceItem(BaseModel):
    __tablename__ = "invoice_items"

    quote_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("quotes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    fee_type: Mapped[FeeType] = mapped_column(Enum(FeeType), default=FeeType.OTHER)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    quantity: Mapped[float] = mapped_column(Numeric(10, 2), default=1.00)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    discount_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=100.00)

    amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    actual_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)

    sort_order: Mapped[int] = mapped_column(default=0)

    quote = relationship("Quote", back_populates="invoice_items")
