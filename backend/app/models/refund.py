from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class RefundReason(str, enum.Enum):
    INJURY = "injury"
    MOVE_AWAY = "move_away"
    DISSATISFIED = "dissatisfied"
    COACH_CHANGE = "coach_change"
    PRICE_REASON = "price_reason"
    TIME_CONFLICT = "time_conflict"
    HEALTH_REASON = "health_reason"
    OTHER = "other"


class RefundStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    refund_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), index=True)
    reason = Column(Enum(RefundReason), nullable=False, index=True)
    reason_detail = Column(Text)
    refund_amount = Column(Float, nullable=False, default=0.0)
    refund_sessions = Column(Integer, default=0)
    penalty_amount = Column(Float, default=0.0)
    actual_refund_amount = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(RefundStatus), default=RefundStatus.PENDING, index=True)
    apply_date = Column(DateTime, index=True)
    approve_date = Column(DateTime)
    completed_date = Column(DateTime)
    applicant_id = Column(Integer)
    applicant_name = Column(String(100))
    approver_id = Column(Integer)
    approver_name = Column(String(100))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    member = relationship("Member", backref="refunds")
    membership = relationship("Membership", backref="refunds")
    transaction = relationship("Transaction", backref="refunds")
