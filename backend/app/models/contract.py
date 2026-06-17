from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel


class Contract(BaseModel):
    __tablename__ = "contracts"

    contract_no = Column(String(50), unique=True, index=True, nullable=False)
    project_name = Column(String(200), nullable=False)
    client_name = Column(String(100), nullable=False)
    client_phone = Column(String(20))
    address = Column(String(500))
    house_type = Column(String(50))
    area = Column(Numeric(10, 2))
    contract_amount = Column(Numeric(15, 2), nullable=False)
    sign_date = Column(DateTime)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(String(20), default="draft")
    manager_id = Column(Integer, ForeignKey("users.id"))
    sales_id = Column(Integer, ForeignKey("users.id"))
    designer_id = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)

    manager = relationship("User", foreign_keys=[manager_id], backref="managed_contracts")
    sales = relationship("User", foreign_keys=[sales_id], backref="sales_contracts")
    designer = relationship("User", foreign_keys=[designer_id], backref="designed_contracts")
    attachments = relationship("ContractAttachment", back_populates="contract", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="contract")
    reconciliation_diffs = relationship("ReconciliationDiff", back_populates="contract")
    exceptions = relationship("ExceptionOrder", back_populates="contract")
    timelines = relationship("StatusTimeline", back_populates="contract")


class ContractAttachment(BaseModel):
    __tablename__ = "contract_attachments"

    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(50))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    category = Column(String(50))
    is_contract = Column(Boolean, default=False)

    contract = relationship("Contract", back_populates="attachments")
