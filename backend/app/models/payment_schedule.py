from datetime import date
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.case import Case


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class PaymentCycleType(StrEnum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    HALF_YEARLY = "half_yearly"
    YEARLY = "yearly"
    MILESTONE = "milestone"


class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"))
    phase: Mapped[int] = mapped_column(Integer, nullable=False)
    phase_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[PaymentStatus] = mapped_column(String(20), nullable=False, default=PaymentStatus.PENDING)
    payment_cycle_type: Mapped[PaymentCycleType] = mapped_column(String(50), nullable=False)

    case: Mapped[Case] = relationship("Case", back_populates="payment_schedules")
