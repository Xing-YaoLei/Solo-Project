from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.case import Case
from app.models.user import User


class ApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class ApprovalNode(Base):
    __tablename__ = "approval_nodes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"))
    node_name: Mapped[str] = mapped_column(String(100), nullable=False)
    approver_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    submit_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expected_complete_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_complete_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[ApprovalStatus] = mapped_column(String(20), nullable=False, default=ApprovalStatus.PENDING)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="approval_nodes")
    approver: Mapped[User] = relationship("User")
