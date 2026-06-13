from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.database import Base
import enum


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    RENEWAL = "renewal"
    REFUND = "refund"
    TRANSFER = "transfer"
    FROZEN = "frozen"
    UNFROZEN = "unfrozen"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    WECHAT = "wechat"
    ALIPAY = "alipay"
    CARD = "card"
    TRANSFER = "transfer"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIAL_REFUNDED = "partial_refunded"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(50), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), index=True)
    type = Column(Enum(TransactionType), nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, default=0.0)
    actual_amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.WECHAT)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.SUCCESS, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"))
    salesperson_id = Column(Integer)
    salesperson_name = Column(String(100))
    cashier_id = Column(Integer)
    cashier_name = Column(String(100))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    member = relationship("Member", backref="transactions")
    membership = relationship("Membership", backref="transactions")
