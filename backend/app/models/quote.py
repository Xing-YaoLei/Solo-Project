import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class QuoteStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVING = "approving"
    APPROVED = "approved"
    REJECTED = "rejected"
    SENT = "sent"
    CONFIRMED = "confirmed"
    IN_PAYMENT = "in_payment"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CLOSED = "closed"
    EXCEPTION = "exception"


class Quote(BaseModel):
    __tablename__ = "quotes"

    quote_no: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    client_name: Mapped[str] = mapped_column(String(200), nullable=False)
    client_contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    client_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    case_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    case_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    discounted_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    paid_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    currency: Mapped[str] = mapped_column(String(10), default="CNY")

    status: Mapped[QuoteStatus] = mapped_column(Enum(QuoteStatus), default=QuoteStatus.DRAFT, index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")

    assigned_to: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id"),
        nullable=True,
    )

    expected_payment_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    actual_payment_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    payment_deadline: Mapped[datetime | None] = mapped_column(Date, nullable=True)

    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    creator = relationship(
        "User",
        primaryjoin="Quote.created_by == User.id",
        back_populates="created_quotes",
        foreign_keys="Quote.created_by",
    )
    assignee = relationship(
        "User",
        primaryjoin="Quote.assigned_to == User.id",
        back_populates="assigned_quotes",
        foreign_keys="Quote.assigned_to",
    )
    invoice_items = relationship("InvoiceItem", back_populates="quote", cascade="all, delete-orphan")
    approval_nodes = relationship("ApprovalNode", back_populates="quote", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="quote", cascade="all, delete-orphan")
    exceptions = relationship("ExceptionRecord", back_populates="quote", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="quote", cascade="all, delete-orphan")
