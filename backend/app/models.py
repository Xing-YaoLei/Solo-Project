from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean,
    ForeignKey, JSON, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from sqlalchemy import Enum as SAEnum

from .database import Base


class QuotationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONVERTED = "converted"


class RepairOrderStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    REWORKED = "reworked"


class StockTaskStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(20), unique=True, index=True, nullable=False)
    vin = Column(String(50), unique=True, index=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    year = Column(Integer)
    color = Column(String(30))
    mileage = Column(Float, default=0)
    owner_name = Column(String(50))
    owner_phone = Column(String(20))
    repair_count = Column(Integer, default=0)
    total_amount = Column(Float, default=0)
    last_repair_date = Column(Date)
    warning_level = Column(String(20), default="normal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    repair_orders = relationship("RepairOrder", back_populates="vehicle")
    quotations = relationship("Quotation", back_populates="vehicle")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_no = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    vehicle_plate = Column(String(20), index=True)
    status = Column(SAEnum(QuotationStatus), default=QuotationStatus.DRAFT, index=True)
    total_amount = Column(Float, default=0)
    parts_amount = Column(Float, default=0)
    labor_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    insurance_covered = Column(Boolean, default=False)
    insurance_claim_no = Column(String(50))
    parts = Column(JSON, default=list)
    labor_items = Column(JSON, default=list)
    created_by = Column(String(50))
    salesperson = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    converted_at = Column(DateTime(timezone=True))

    vehicle = relationship("Vehicle", back_populates="quotations")
    repair_order = relationship("RepairOrder", back_populates="quotation", uselist=False)
    inspection_photos = relationship("InspectionPhoto", back_populates="quotation")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), unique=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    vehicle_plate = Column(String(20), index=True)
    status = Column(SAEnum(RepairOrderStatus), default=RepairOrderStatus.PENDING, index=True)
    is_rework = Column(Boolean, default=False, index=True)
    rework_reason = Column(Text)
    parent_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    total_amount = Column(Float, default=0)
    actual_amount = Column(Float, default=0)
    mechanic = Column(String(50))
    quality_inspector = Column(String(50))
    fault_description = Column(Text)
    repair_content = Column(Text)
    has_stockout = Column(Boolean, default=False)
    stockout_parts = Column(JSON, default=list)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    quality_check_time = Column(DateTime(timezone=True))
    delivery_time = Column(DateTime(timezone=True))
    cashier_no = Column(String(50))
    cashier_amount = Column(Float, default=0)
    cashier_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="repair_orders")
    quotation = relationship("Quotation", back_populates="repair_order")
    inspection_photos = relationship("InspectionPhoto", back_populates="repair_order")
    stock_tasks = relationship("StockTask", back_populates="repair_order")


class InspectionPhoto(Base):
    __tablename__ = "inspection_photos"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    photo_type = Column(String(30))
    photo_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    description = Column(String(200))
    uploader = Column(String(50))
    is_quality_issue = Column(Boolean, default=False)
    issue_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quotation = relationship("Quotation", back_populates="inspection_photos")
    repair_order = relationship("RepairOrder", back_populates="inspection_photos")


class StockTask(Base):
    __tablename__ = "stock_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_no = Column(String(50), unique=True, index=True, nullable=False)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    order_no = Column(String(50), index=True)
    part_code = Column(String(50), nullable=False)
    part_name = Column(String(100), nullable=False)
    required_qty = Column(Integer, default=1)
    status = Column(SAEnum(StockTaskStatus), default=StockTaskStatus.OPEN, index=True)
    priority = Column(String(20), default="normal")
    notes = Column(Text)
    resolution = Column(Text)
    resolved_by = Column(String(50))
    resolved_at = Column(DateTime(timezone=True))
    assigned_to = Column(String(50))
    created_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    repair_order = relationship("RepairOrder", back_populates="stock_tasks")


class WarningThreshold(Base):
    __tablename__ = "warning_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(500))
    category = Column(String(50), default="vehicle")
    min_value = Column(Float)
    max_value = Column(Float)
    current_value = Column(Float, nullable=False)
    unit = Column(String(20))
    enabled = Column(Boolean, default=True)
    updated_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WarningChangeLog(Base):
    __tablename__ = "warning_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    threshold_id = Column(Integer, ForeignKey("warning_thresholds.id"), nullable=False)
    threshold_name = Column(String(100))
    old_value = Column(Float)
    new_value = Column(Float)
    changed_by = Column(String(50), nullable=False)
    change_reason = Column(String(500))
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class InsuranceMaterial(Base):
    __tablename__ = "insurance_materials"

    id = Column(Integer, primary_key=True, index=True)
    claim_no = Column(String(50), unique=True, index=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    insurance_company = Column(String(100))
    policy_no = Column(String(50))
    claim_type = Column(String(50))
    coverage_amount = Column(Float, default=0)
    approved_amount = Column(Float, default=0)
    materials = Column(JSON, default=list)
    review_status = Column(String(30), default="pending")
    reviewer = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class CashierTransaction(Base):
    __tablename__ = "cashier_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String(50), unique=True, index=True, nullable=False)
    repair_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    order_no = Column(String(50), index=True)
    vehicle_plate = Column(String(20), index=True)
    total_amount = Column(Float, default=0)
    paid_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    payment_method = Column(String(30))
    insurance_paid = Column(Float, default=0)
    self_paid = Column(Float, default=0)
    cashier = Column(String(50))
    transaction_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    notes = Column(Text)
