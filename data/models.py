from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Boolean,
    Numeric, ForeignKey, ARRAY, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from data.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)
    vin = Column(String(50), unique=True, nullable=False)
    license_plate = Column(String(20))
    brand = Column(String(50))
    model = Column(String(50))
    model_year = Column(Integer)
    color = Column(String(30))
    mileage = Column(Integer)
    owner_name = Column(String(100))
    owner_phone = Column(String(20))
    first_registration_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    repair_orders = relationship("RepairOrder", back_populates="vehicle")
    diagnosis_results = relationship("DiagnosisResult", back_populates="vehicle")
    rework_records = relationship("ReworkRecord", back_populates="vehicle")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id = Column(Integer, primary_key=True)
    order_no = Column(String(50), unique=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    appointment_date = Column(Date, nullable=False)
    actual_arrival_date = Column(Date)
    order_type = Column(String(30))
    order_status = Column(String(30), default="pending")
    service_advisor = Column(String(100))
    technician = Column(String(100))
    total_cost = Column(Numeric(12, 2), default=0)
    parts_cost = Column(Numeric(12, 2), default=0)
    labor_cost = Column(Numeric(12, 2), default=0)
    is_rework = Column(Boolean, default=False)
    original_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    source_system = Column(String(50))
    source_id = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="repair_orders")
    order_items = relationship("OrderItem", back_populates="repair_order")
    diagnosis_results = relationship("DiagnosisResult", back_populates="repair_order")
    insurance_materials = relationship("InsuranceMaterial", back_populates="repair_order")
    parts_usages = relationship("PartsUsage", back_populates="repair_order")


class DiagnosisResult(Base):
    __tablename__ = "diagnosis_results"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    diagnosis_date = Column(Date, nullable=False)
    fault_code = Column(String(50))
    fault_description = Column(Text)
    fault_category = Column(String(50))
    fault_severity = Column(String(20))
    diagnostic_method = Column(String(50))
    technician = Column(String(100))
    diagnosis_result = Column(Text)
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    repair_order = relationship("RepairOrder", back_populates="diagnosis_results")
    vehicle = relationship("Vehicle", back_populates="diagnosis_results")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    item_type = Column(String(30), nullable=False)
    item_code = Column(String(50))
    item_name = Column(String(200), nullable=False)
    quantity = Column(Numeric(10, 2), default=1)
    unit_price = Column(Numeric(10, 2), default=0)
    subtotal = Column(Numeric(12, 2), default=0)
    is_warranty = Column(Boolean, default=False)
    technician = Column(String(100))
    work_hours = Column(Numeric(6, 2))
    source_item_id = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    repair_order = relationship("RepairOrder", back_populates="order_items")


class InsuranceMaterial(Base):
    __tablename__ = "insurance_materials"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    insurance_company = Column(String(100))
    policy_no = Column(String(50))
    claim_no = Column(String(50))
    damage_type = Column(String(50))
    accident_date = Column(Date)
    damage_description = Column(Text)
    estimated_amount = Column(Numeric(12, 2))
    approved_amount = Column(Numeric(12, 2))
    claim_status = Column(String(30))
    source_system = Column(String(50))
    source_id = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    repair_order = relationship("RepairOrder", back_populates="insurance_materials")


class PartsInventory(Base):
    __tablename__ = "parts_inventory"

    id = Column(Integer, primary_key=True)
    part_code = Column(String(50), unique=True, nullable=False)
    part_name = Column(String(200), nullable=False)
    part_category = Column(String(50))
    brand = Column(String(50))
    unit = Column(String(20))
    unit_price = Column(Numeric(10, 2))
    stock_quantity = Column(Integer, default=0)
    safe_stock_level = Column(Integer, default=10)
    supplier = Column(String(100))
    source_system = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PartsUsage(Base):
    __tablename__ = "parts_usage"

    id = Column(Integer, primary_key=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"))
    order_id = Column(Integer, ForeignKey("repair_orders.id"))
    part_code = Column(String(50))
    part_name = Column(String(200))
    quantity = Column(Numeric(10, 2))
    unit_price = Column(Numeric(10, 2))
    is_shortage = Column(Boolean, default=False)
    shortage_quantity = Column(Numeric(10, 2), default=0)
    restock_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())

    repair_order = relationship("RepairOrder", back_populates="parts_usages")


class ReworkRecord(Base):
    __tablename__ = "rework_records"

    id = Column(Integer, primary_key=True)
    original_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    rework_order_id = Column(Integer, ForeignKey("repair_orders.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    rework_reason = Column(Text)
    rework_type = Column(String(50))
    rework_date = Column(Date)
    is_parts_related = Column(Boolean, default=False)
    related_part_codes = Column(ARRAY(String))
    caliber_version = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="rework_records")


class ReworkRateCaliberVersion(Base):
    __tablename__ = "rework_rate_caliber_versions"

    id = Column(Integer, primary_key=True)
    version_code = Column(String(20), unique=True, nullable=False)
    version_name = Column(String(100), nullable=False)
    description = Column(Text)
    definition_formula = Column(Text)
    is_active = Column(Boolean, default=False)
    effective_date = Column(Date)
    created_by = Column(String(100))
    change_reason = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class ThresholdConfig(Base):
    __tablename__ = "threshold_config"

    id = Column(Integer, primary_key=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_name = Column(String(200), nullable=False)
    config_value = Column(String(500))
    config_type = Column(String(20), default="number")
    category = Column(String(50))
    description = Column(Text)
    updated_by = Column(String(100))
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ETLLog(Base):
    __tablename__ = "etl_run_log"

    id = Column(Integer, primary_key=True)
    task_name = Column(String(100), nullable=False)
    source_system = Column(String(50))
    run_date = Column(Date, nullable=False)
    records_input = Column(Integer, default=0)
    records_output = Column(Integer, default=0)
    records_deduplicated = Column(Integer, default=0)
    records_invalid = Column(Integer, default=0)
    status = Column(String(20), default="running")
    error_message = Column(Text)
    started_at = Column(DateTime, server_default=func.now())
    finished_at = Column(DateTime)


class ReviewMaterial(Base):
    __tablename__ = "review_materials"

    id = Column(Integer, primary_key=True)
    review_date = Column(Date, nullable=False)
    review_type = Column(String(50))
    title = Column(String(200), nullable=False)
    summary = Column(Text)
    key_metrics = Column(JSON)
    related_part_codes = Column(ARRAY(String))
    related_order_ids = Column(ARRAY(Integer))
    caliber_version = Column(String(20))
    status = Column(String(20), default="draft")
    created_by = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
