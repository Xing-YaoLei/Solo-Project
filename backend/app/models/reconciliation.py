from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from .base import BaseModel


class ReconciliationDiff(BaseModel):
    __tablename__ = "reconciliation_diffs"

    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    diff_no = Column(String(50), unique=True, index=True, nullable=False)
    diff_type = Column(String(50), nullable=False)
    expected_amount = Column(Numeric(15, 2), nullable=False)
    actual_amount = Column(Numeric(15, 2), nullable=False)
    diff_amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="pending")
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime)
    handler_conclusion = Column(Text)
    remark = Column(Text)

    contract = relationship("Contract", back_populates="reconciliation_diffs")
    bill = relationship("Bill", back_populates="reconciliation_diffs")
    timelines = relationship("StatusTimeline", back_populates="reconciliation_diff")
    exceptions = relationship("ExceptionOrder", back_populates="reconciliation_diff")
