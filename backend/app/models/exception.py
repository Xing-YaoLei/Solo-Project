from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from .base import BaseModel


class ExceptionOrder(BaseModel):
    __tablename__ = "exception_orders"

    contract_id = Column(Integer, ForeignKey("contracts.id"))
    bill_id = Column(Integer, ForeignKey("bills.id"))
    reconciliation_diff_id = Column(Integer, ForeignKey("reconciliation_diffs.id"))
    exception_no = Column(String(50), unique=True, index=True, nullable=False)
    exception_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    expected_amount = Column(Numeric(15, 2))
    actual_amount = Column(Numeric(15, 2))
    diff_amount = Column(Numeric(15, 2))
    status = Column(String(20), default="pending")
    priority = Column(String(20), default="normal")
    handler_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    final_conclusion = Column(Text)
    closed_at = Column(DateTime)
    remark = Column(Text)

    contract = relationship("Contract", back_populates="exceptions")
    bill = relationship("Bill", back_populates="exceptions")
    reconciliation_diff = relationship("ReconciliationDiff", back_populates="exceptions")
    handler = relationship("User", foreign_keys=[handler_id], backref="handled_exceptions")
    supervisor = relationship("User", foreign_keys=[supervisor_id], backref="supervised_exceptions")
    affected_objects = relationship("ExceptionAffectedObject", back_populates="exception_order", cascade="all, delete-orphan")
    timelines = relationship("StatusTimeline", back_populates="exception_order")


class ExceptionAffectedObject(BaseModel):
    __tablename__ = "exception_affected_objects"

    exception_order_id = Column(Integer, ForeignKey("exception_orders.id"), nullable=False)
    object_type = Column(String(50), nullable=False)
    object_id = Column(Integer, nullable=False)
    object_name = Column(String(200), nullable=False)
    object_no = Column(String(50))
    impact_level = Column(String(20), default="medium")
    impact_description = Column(Text)

    exception_order = relationship("ExceptionOrder", back_populates="affected_objects")
