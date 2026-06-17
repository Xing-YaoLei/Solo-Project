from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from .base import BaseModel


class Bill(BaseModel):
    __tablename__ = "bills"

    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    bill_no = Column(String(50), unique=True, index=True, nullable=False)
    bill_type = Column(String(50), nullable=False)
    bill_name = Column(String(200), nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0)
    unpaid_amount = Column(Numeric(15, 2), default=0)
    status = Column(String(20), default="pending")
    due_date = Column(DateTime)
    paid_date = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime)
    remark = Column(Text)

    contract = relationship("Contract", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    approval_records = relationship("ApprovalRecord", back_populates="bill")
    reconciliation_diffs = relationship("ReconciliationDiff", back_populates="bill")
    timelines = relationship("StatusTimeline", back_populates="bill")
    exceptions = relationship("ExceptionOrder", back_populates="bill")


class BillItem(BaseModel):
    __tablename__ = "bill_items"

    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    item_name = Column(String(200), nullable=False)
    item_code = Column(String(50))
    specification = Column(String(500))
    unit = Column(String(20))
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    subtotal = Column(Numeric(15, 2), nullable=False)
    discount_rate = Column(Numeric(5, 2), default=0)
    actual_amount = Column(Numeric(15, 2), nullable=False)
    remark = Column(Text)
    sort_order = Column(Integer, default=0)

    bill = relationship("Bill", back_populates="items")
