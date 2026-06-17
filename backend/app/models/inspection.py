from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.database.connection import Base


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True)
    inspection_no = Column(String, unique=True, index=True)
    contract_id = Column(Integer, ForeignKey("e_contracts.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    customer_id = Column(Integer, ForeignKey("crm_customers.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    apply_date = Column(DateTime, nullable=False)
    scheduled_date = Column(DateTime)
    inspection_date = Column(DateTime)
    status = Column(String, default="pending")
    water_reading_start = Column(Integer)
    water_reading_end = Column(Integer)
    electricity_reading_start = Column(Integer)
    electricity_reading_end = Column(Integer)
    gas_reading_start = Column(Integer)
    gas_reading_end = Column(Integer)
    has_damage = Column(Boolean, default=False)
    damage_description = Column(Text)
    deduction_amount = Column(Integer, default=0)
    refund_amount = Column(Integer, default=0)
    signature_customer = Column(Text)
    signature_inspector = Column(Text)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contract = relationship("EContract", back_populates="inspections")
    property = relationship("Property", back_populates="inspections")
    customer = relationship("CRMCustomer", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])
    items = relationship("InspectionItem", back_populates="inspection", cascade="all, delete-orphan")


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspection_records.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(200), nullable=False)
    item_category = Column(String(100))
    is_pass = Column(Boolean)
    normal_condition = Column(Text)
    actual_condition = Column(Text)
    deduction_amount = Column(Numeric(precision=12, scale=2), default=0)
    photo_urls = Column(JSON)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    inspection = relationship("InspectionRecord", back_populates="items")
