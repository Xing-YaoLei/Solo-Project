import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, USE_POSTGRES

UUIDType = UUID(as_uuid=True) if USE_POSTGRES else String(36)


class Store(Base):
    __tablename__ = "stores"

    store_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    store_name: Mapped[str] = mapped_column(String(100), nullable=False)
    lng: Mapped[float | None] = mapped_column(Numeric(9, 3), nullable=True)
    lat: Mapped[float | None] = mapped_column(Numeric(8, 6), nullable=True)
    city: Mapped[str | None] = mapped_column(String(50), nullable=True)
    region: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="store")
    turnover_targets = relationship("TurnoverTarget", back_populates="store")


class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vin: Mapped[str] = mapped_column(String(17), unique=True, nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(50), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mileage: Mapped[float | None] = mapped_column(Numeric(10, 1), nullable=True)
    store_id: Mapped[str | None] = mapped_column(UUIDType, ForeignKey("stores.store_id"), nullable=True)
    entry_date = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_stock")
    source_db_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    detector_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    crm_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())

    store = relationship("Store", back_populates="vehicles")
    inspection_reports = relationship("InspectionReport", back_populates="vehicle")
    preparation_tasks = relationship("PreparationTask", back_populates="vehicle")
    test_drive_records = relationship("TestDriveRecord", back_populates="vehicle")
    data_diffs = relationship("DataDiff", back_populates="vehicle")
    material_items = relationship("MaterialItem", back_populates="vehicle")


class InspectionReport(Base):
    __tablename__ = "inspection_reports"

    report_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("vehicles.vehicle_id"), nullable=False)
    inspector: Mapped[str | None] = mapped_column(String(50), nullable=True)
    inspect_date = mapped_column(Date, nullable=True)
    detector_version: Mapped[str | None] = mapped_column(String(20), nullable=True)

    vehicle = relationship("Vehicle", back_populates="inspection_reports")
    items = relationship("InspectionItem", back_populates="report")


class InspectionItem(Base):
    __tablename__ = "inspection_items"

    item_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("inspection_reports.report_id"), nullable=False)
    item_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    report = relationship("InspectionReport", back_populates="items")


class PreparationTask(Base):
    __tablename__ = "preparation_tasks"

    task_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("vehicles.vehicle_id"), nullable=False)
    task_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    related_inspection_item: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    vehicle = relationship("Vehicle", back_populates="preparation_tasks")


class TestDriveRecord(Base):
    __tablename__ = "test_drive_records"

    record_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("vehicles.vehicle_id"), nullable=False)
    drive_date = mapped_column(Date, nullable=True)
    driver: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mileage_km: Mapped[float | None] = mapped_column(Numeric(6, 1), nullable=True)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="test_drive_records")


class DataDiff(Base):
    __tablename__ = "data_diffs"

    diff_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("vehicles.vehicle_id"), nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    crm_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    detected_at = mapped_column(DateTime, server_default=func.now())
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    vehicle = relationship("Vehicle", back_populates="data_diffs")


class TurnoverTarget(Base):
    __tablename__ = "turnover_targets"

    target_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("stores.store_id"), nullable=False)
    period: Mapped[str | None] = mapped_column(String(20), nullable=True)
    target_days: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)

    store = relationship("Store", back_populates="turnover_targets")


class MaterialItem(Base):
    __tablename__ = "material_items"

    material_id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("vehicles.vehicle_id"), nullable=False)
    material_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    submitted_date = mapped_column(Date, nullable=True)

    vehicle = relationship("Vehicle", back_populates="material_items")
