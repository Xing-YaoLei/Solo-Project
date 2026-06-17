from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import BaseModel


class StatusTimeline(BaseModel):
    __tablename__ = "status_timelines"

    contract_id = Column(Integer, ForeignKey("contracts.id"))
    bill_id = Column(Integer, ForeignKey("bills.id"))
    reconciliation_diff_id = Column(Integer, ForeignKey("reconciliation_diffs.id"))
    exception_order_id = Column(Integer, ForeignKey("exception_orders.id"))
    status = Column(String(20), nullable=False)
    previous_status = Column(String(20))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operation_type = Column(String(50), nullable=False)
    remark = Column(Text)

    contract = relationship("Contract", back_populates="timelines")
    bill = relationship("Bill", back_populates="timelines")
    reconciliation_diff = relationship("ReconciliationDiff", back_populates="timelines")
    exception_order = relationship("ExceptionOrder", back_populates="timelines")
    operator = relationship("User")
