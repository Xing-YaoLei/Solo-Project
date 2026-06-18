from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, ForeignKey, Text,
    Boolean, Numeric, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum


class StationStatus(str, enum.Enum):
    IDLE = "idle"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class WorkOrderStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"
    REWORKED = "reworked"


class PartShortageStatus(str, enum.Enum):
    OPEN = "open"
    PROCESSING = "processing"
    CLOSED = "closed"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    MANAGER = "manager"
    PARTS = "parts"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.TECHNICIAN)
    hashed_password = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    work_orders = relationship("WorkOrder", foreign_keys="WorkOrder.technician_id", back_populates="technician")
    shortage_handlers = relationship("PartShortage", foreign_keys="PartShortage.handler_id", back_populates="handler")


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(20), unique=True, index=True, nullable=False)
    vin = Column(String(50), unique=True, index=True)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer)
    color = Column(String(30))
    mileage = Column(Numeric(12, 2))
    owner_name = Column(String(100))
    owner_phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    work_orders = relationship("WorkOrder", back_populates="vehicle")


class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(30))
    status = Column(SAEnum(StationStatus), default=StationStatus.IDLE)
    current_work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    current_work_order = relationship("WorkOrder", foreign_keys=[current_work_order_id], post_update=True)


class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(30), unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(WorkOrderStatus), default=WorkOrderStatus.PENDING)
    complaint = Column(Text)
    scheduled_start = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    is_rework = Column(Boolean, default=False)
    parent_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="work_orders")
    station = relationship("Station", foreign_keys=[station_id], backref="work_orders")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="work_orders")
    diagnostics = relationship("Diagnostic", back_populates="work_order", cascade="all, delete-orphan")
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")
    parent_order = relationship("WorkOrder", remote_side=[id])


class Diagnostic(Base):
    __tablename__ = "diagnostics"
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    symptom = Column(Text)
    fault_code = Column(String(100))
    analysis = Column(Text)
    conclusion = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    work_order = relationship("WorkOrder", back_populates="diagnostics")


class WorkOrderItem(Base):
    __tablename__ = "work_order_items"
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    item_type = Column(String(20))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    quantity = Column(Numeric(10, 2), default=1)
    unit_price = Column(Numeric(10, 2), default=0)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=True)
    status = Column(String(20), default="pending")
    work_order = relationship("WorkOrder", back_populates="items")
    part = relationship("Part")


class Part(Base):
    __tablename__ = "parts"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    brand = Column(String(100))
    specification = Column(String(200))
    unit = Column(String(20), default="个")
    safety_stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    stock = relationship("PartStock", uselist=False, back_populates="part", cascade="all, delete-orphan")
    stock_logs = relationship("StockChangeLog", back_populates="part", cascade="all, delete-orphan")


class PartStock(Base):
    __tablename__ = "part_stocks"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"), unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    location = Column(String(100))
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    part = relationship("Part", back_populates="stock")


class StockChangeLog(Base):
    __tablename__ = "stock_change_logs"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    before_quantity = Column(Integer, nullable=False)
    after_quantity = Column(Integer, nullable=False)
    change_reason = Column(String(200))
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    part = relationship("Part", back_populates="stock_logs")


class PartShortage(Base):
    __tablename__ = "part_shortages"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    required_quantity = Column(Integer, nullable=False)
    status = Column(SAEnum(PartShortageStatus), default=PartShortageStatus.OPEN)
    reason = Column(Text)
    action_taken = Column(Text)
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    part = relationship("Part")
    work_order = relationship("WorkOrder")
    handler = relationship("User", foreign_keys=[handler_id], back_populates="shortage_handlers")


class ReworkRecord(Base):
    __tablename__ = "rework_records"
    id = Column(Integer, primary_key=True, index=True)
    original_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    rework_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    reason = Column(Text)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReportDownloadLog(Base):
    __tablename__ = "report_download_logs"
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)
    filter_criteria = Column(JSON)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
