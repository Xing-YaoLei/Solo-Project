import enum

from sqlalchemy import Boolean, Column, Enum, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class UserRole(str, enum.Enum):
    LAWYER = "lawyer"
    ASSISTANT = "assistant"
    PARTNER = "partner"
    CLIENT = "client"


class User(BaseModel):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.LAWYER)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_quotes = relationship(
        "Quote",
        primaryjoin="User.id == Quote.created_by",
        back_populates="creator",
        foreign_keys="Quote.created_by",
    )
    assigned_quotes = relationship(
        "Quote",
        primaryjoin="User.id == Quote.assigned_to",
        back_populates="assignee",
        foreign_keys="Quote.assigned_to",
    )
    approvals = relationship(
        "ApprovalNode",
        primaryjoin="User.id == ApprovalNode.approver_id",
        back_populates="approver",
        foreign_keys="ApprovalNode.approver_id",
    )
    handled_exceptions = relationship(
        "ExceptionRecord",
        primaryjoin="User.id == ExceptionRecord.handled_by",
        back_populates="handler",
        foreign_keys="ExceptionRecord.handled_by",
    )
    payments = relationship(
        "Payment",
        primaryjoin="User.id == Payment.operator_id",
        back_populates="operator",
        foreign_keys="Payment.operator_id",
    )
    exception_history_operations = relationship(
        "ExceptionHistory",
        primaryjoin="User.id == ExceptionHistory.operator_id",
        back_populates="operator",
        foreign_keys="ExceptionHistory.operator_id",
    )
