from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.database.connection import Base


class RentOverdueComment(Base):
    __tablename__ = "rent_overdue_comments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payment_transactions.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_customers.id"))
    comment = Column(Text, nullable=False)
    commented_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    payment = relationship("PaymentTransaction", back_populates="overdue_comments")
    customer = relationship("CRMCustomer", back_populates="overdue_comments")
    commentator = relationship("User", foreign_keys=[commented_by])


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_no = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("crm_customers.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    complaint_type = Column(String(50), nullable=False)
    tags = Column(JSON)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    report_date = Column(Date, nullable=False)
    status = Column(String(20), default="open", nullable=False)
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime)
    resolution = Column(Text)
    satisfaction_score = Column(Integer)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("CRMCustomer", back_populates="complaints")
    property = relationship("Property", back_populates="complaints")
    handler = relationship("User", foreign_keys=[handled_by])
