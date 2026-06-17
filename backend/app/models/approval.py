from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import BaseModel


class ApprovalNode(BaseModel):
    __tablename__ = "approval_nodes"

    node_name = Column(String(100), nullable=False)
    node_code = Column(String(50), unique=True, nullable=False)
    approver_role = Column(String(50))
    approver_id = Column(Integer, ForeignKey("users.id"))
    approval_type = Column(String(20), default="and")
    sort_order = Column(Integer, default=0)
    is_active = Column(Integer, default=1)
    description = Column(String(500))

    approver = relationship("User", foreign_keys=[approver_id])


class ApprovalRecord(BaseModel):
    __tablename__ = "approval_records"

    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    node_id = Column(Integer, ForeignKey("approval_nodes.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approval_status = Column(String(20), default="pending")
    approval_opinion = Column(Text)
    approved_at = Column(DateTime)
    sort_order = Column(Integer, default=0)

    bill = relationship("Bill", back_populates="approval_records")
    node = relationship("ApprovalNode")
    approver = relationship("User")
