from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, JSON, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class CRMCustomer(Base):
    __tablename__ = "crm_customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    id_card = Column(String(18))
    wechat_id = Column(String(100))
    email = Column(String(255))
    first_rent_date = Column(Date)
    last_rent_date = Column(Date)
    total_rent_months = Column(Integer, default=0)
    status = Column(String(20), default="active")
    tags = Column(JSON)
    remark = Column(Text)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = relationship("PaymentTransaction", back_populates="customer")
    contracts = relationship("EContract", back_populates="customer")
    inspections = relationship("InspectionRecord", back_populates="customer")
    repairs = relationship("RepairOrder", foreign_keys="RepairOrder.reporter_id", back_populates="reporter")
    complaints = relationship("Complaint", back_populates="customer")
    overdue_comments = relationship("RentOverdueComment", back_populates="customer")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    property_no = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(500), nullable=False)
    district = Column(String(100), nullable=False)
    area = Column(Numeric(precision=10, scale=2))
    room_type = Column(String(50))
    monthly_rent = Column(Numeric(precision=12, scale=2), nullable=False)
    deposit_amount = Column(Numeric(precision=12, scale=2))
    floor = Column(Integer)
    total_floor = Column(Integer)
    orientation = Column(String(20))
    decoration = Column(String(50))
    facilities = Column(JSON)
    status = Column(String(20), default="vacant")
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payments = relationship("PaymentTransaction", back_populates="property")
    contracts = relationship("EContract", back_populates="property")
    inspections = relationship("InspectionRecord", back_populates="property")
    repairs = relationship("RepairOrder", back_populates="property")
    complaints = relationship("Complaint", back_populates="property")
