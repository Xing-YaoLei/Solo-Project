import enum

from sqlalchemy import Boolean, Column, Enum, String
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

    created_quotes = relationship("Quote", foreign_keys="Quote.created_by", back_populates="creator")
    assigned_quotes = relationship("Quote", foreign_keys="Quote.assigned_to", back_populates="assignee")
    approvals = relationship("ApprovalNode", foreign_keys="ApprovalNode.approver_id", back_populates="approver")
    payments = relationship("Payment", back_populates="operator")
    handled_exceptions = relationship("ExceptionRecord", foreign_keys="ExceptionRecord.handled_by", back_populates="handler")
