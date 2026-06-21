from datetime import date, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.case import Case


class InvoiceStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InvoiceSource(StrEnum):
    MANUAL = "manual"
    EMAIL = "email"
    IMPORT = "import"
    API = "api"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    invoice_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"))
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(String(20), nullable=False, default=InvoiceStatus.PENDING)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[InvoiceSource] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    case: Mapped[Case] = relationship("Case", back_populates="invoices")
    items: Mapped[list["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    invoice_id: Mapped[UUID] = mapped_column(ForeignKey("invoices.id", ondelete="CASCADE"))
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    fee_type: Mapped[str] = mapped_column(String(50), nullable=False)

    invoice: Mapped[Invoice] = relationship("Invoice", back_populates="items")
