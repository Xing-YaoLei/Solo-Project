from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric, Boolean, JSON
from sqlalchemy.orm import relationship

from app.database.connection import Base


class RepairCaliberVersion(Base):
    __tablename__ = "repair_caliber_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(20), unique=True, index=True, nullable=False)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date)
    description = Column(Text, nullable=False)
    calculation_rule = Column(Text, nullable=False)
    exclude_holidays = Column(Boolean, default=False)
    exclude_weekends = Column(Boolean, default=False)
    start_event = Column(String(50), nullable=False)
    end_event = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    repair_orders = relationship("RepairOrder", back_populates="caliber_version_ref")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    repair_no = Column(String(50), unique=True, index=True, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("crm_customers.id"))
    worker_id = Column(Integer, ForeignKey("users.id"))
    repair_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    report_time = Column(DateTime, nullable=False)
    assign_time = Column(DateTime)
    start_time = Column(DateTime)
    complete_time = Column(DateTime)
    status = Column(String(20), default="pending", nullable=False)
    actual_cost = Column(Numeric(precision=12, scale=2))
    duration_hours = Column(Numeric(precision=10, scale=2))
    caliber_version = Column(String(20), ForeignKey("repair_caliber_versions.version"))
    photo_urls = Column(JSON)
    remark = Column(Text)
    batch_id = Column(Integer, ForeignKey("import_batches.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    property = relationship("Property", back_populates="repairs")
    reporter = relationship("CRMCustomer", back_populates="repairs", foreign_keys=[reporter_id])
    worker = relationship("User", foreign_keys=[worker_id])
    caliber_version_ref = relationship("RepairCaliberVersion", back_populates="repair_orders")
