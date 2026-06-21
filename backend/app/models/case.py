from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.user import User


class CaseStatus(StrEnum):
    ACTIVE = "active"
    PENDING = "pending"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    lawyer_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    client_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    case_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quoted_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    actual_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    status: Mapped[CaseStatus] = mapped_column(String(20), nullable=False, default=CaseStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    lawyer: Mapped[User] = relationship("User", foreign_keys=[lawyer_id])
    client: Mapped[User] = relationship("User", foreign_keys=[client_id])
    invoices: Mapped[list["Invoice"]] = relationship("Invoice", back_populates="case", cascade="all, delete-orphan")
    attachments: Mapped[list["ContractAttachment"]] = relationship("ContractAttachment", back_populates="case", cascade="all, delete-orphan")
    approval_nodes: Mapped[list["ApprovalNode"]] = relationship("ApprovalNode", back_populates="case", cascade="all, delete-orphan")
    payment_schedules: Mapped[list["PaymentSchedule"]] = relationship("PaymentSchedule", back_populates="case", cascade="all, delete-orphan")
