import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"


class ApprovalNode(BaseModel):
    __tablename__ = "approval_nodes"

    quote_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("quotes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approver_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id"),
        nullable=False,
    )
    node_order: Mapped[int] = mapped_column(nullable=False)
    node_name: Mapped[str] = mapped_column(String(100), nullable=False)
    required_role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, index=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    quote = relationship("Quote", back_populates="approval_nodes")
    approver = relationship(
        "User",
        primaryjoin="ApprovalNode.approver_id == User.id",
        back_populates="approvals",
        foreign_keys="ApprovalNode.approver_id",
    )
