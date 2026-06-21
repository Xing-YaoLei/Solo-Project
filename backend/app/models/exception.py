import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class ExceptionType(str, enum.Enum):
    AMOUNT_MISMATCH = "amount_mismatch"
    APPROVAL_ABNORMAL = "approval_abnormal"
    PAYMENT_DELAY = "payment_delay"
    DOCUMENT_MISSING = "document_missing"
    CLIENT_DISPUTE = "client_dispute"
    OTHER = "other"


class ExceptionStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVING = "resolving"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ExceptionRecord(BaseModel):
    __tablename__ = "exception_records"

    quote_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("quotes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    exception_type: Mapped[ExceptionType] = mapped_column(Enum(ExceptionType), index=True)
    status: Mapped[ExceptionStatus] = mapped_column(Enum(ExceptionStatus), default=ExceptionStatus.OPEN, index=True)

    description: Mapped[str] = mapped_column(Text, nullable=False)
    source_ref: Mapped[str | None] = mapped_column(String(200), nullable=True)

    expected_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    actual_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    difference_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    handled_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id"),
        nullable=True,
    )
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    quote = relationship("Quote", back_populates="exceptions")
    handler = relationship("User", back_populates="handled_exceptions")
    history = relationship("ExceptionHistory", back_populates="exception", cascade="all, delete-orphan")


class ExceptionHistory(BaseModel):
    __tablename__ = "exception_history"

    exception_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("exception_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    operator_id: Mapped[str | None] = mapped_column(String, nullable=True)
    source_record: Mapped[str | None] = mapped_column(String(500), nullable=True)

    exception = relationship("ExceptionRecord", back_populates="history")
