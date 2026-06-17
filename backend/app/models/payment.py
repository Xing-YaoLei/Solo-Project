from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_customers.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    contract_id = Column(Integer, ForeignKey("e_contracts.id"))
    amount = Column(Numeric(precision=12, scale=2), nullable=False)
    payment_type = Column(String(20), nullable=False)
    payment_date = Column(Date)
    payment_method = Column(String(20))
    status = Column(String(20), default="pending", nullable=False)
    due_date = Column(Date)
    overdue_days = Column(Integer, default=0)
    late_fee = Column(Numeric(precision=12, scale=2), default=0)
    third_party_transaction_id = Column(String(100))
    remark = Column(Text)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("CRMCustomer", back_populates="payments")
    property = relationship("Property", back_populates="payments")
    contract = relationship("EContract", back_populates="payments")
    overdue_comments = relationship("RentOverdueComment", back_populates="payment", cascade="all, delete-orphan")
