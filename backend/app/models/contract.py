from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, JSON, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class EContract(Base):
    __tablename__ = "e_contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_customers.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    monthly_rent = Column(Numeric(precision=12, scale=2), nullable=False)
    deposit_amount = Column(Numeric(precision=12, scale=2), nullable=False)
    payment_cycle = Column(Integer, default=1)
    contract_status = Column(String(20), default="active", nullable=False)
    sign_date = Column(Date)
    template_version = Column(String(50))
    digital_signature = Column(Text)
    terms = Column(JSON)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("CRMCustomer", back_populates="contracts")
    property = relationship("Property", back_populates="contracts")
    inspections = relationship("InspectionRecord", back_populates="contract")
    payments = relationship("PaymentTransaction", back_populates="contract")
