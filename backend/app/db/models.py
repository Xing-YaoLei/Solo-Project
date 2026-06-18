from __future__ import annotations

import enum
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
import uuid

from sqlalchemy import (
    String,
    Integer,
    SmallInteger,
    BigInteger,
    Boolean,
    Text,
    Date,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Index,
    func,
    TIMESTAMP,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

try:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, ENUM as PGENUM
    TIMESTAMPTZ = TIMESTAMP(timezone=True)
except Exception:
    PG_UUID = None
    JSONB = Text
    class _FakeEnum:
        def __init__(self, *a, **kw): pass
        def __class_getitem__(cls, item): return String(64)
    PGENUM = _FakeEnum
    TIMESTAMPTZ = TIMESTAMP(timezone=True)

try:
    from sqlalchemy.dialects.postgresql import UUID
except Exception:
    pass

try:
    UUID(as_uuid=True)
except Exception:
    def UUID(as_uuid=True, *args, **kwargs):
        return String(36)

try:
    from geoalchemy2 import Geography
except Exception:
    def Geography(*args, **kwargs):
        return String(256)

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TurnoverStage(str, enum.Enum):
    INBOUND = "inbound"
    PREPARATION = "preparation"
    TEST_DRIVE = "test_drive"
    QUOTING = "quoting"
    DEAL = "deal"
    TRANSFER = "transfer"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DocumentType(str, enum.Enum):
    DRIVING_LICENSE = "driving_license"
    REGISTRATION_CERT = "registration_cert"
    PURCHASE_TAX = "purchase_tax"
    INSURANCE_POLICY = "insurance_policy"
    INVOICE = "invoice"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    PRESENT = "present"
    MISSING = "missing"
    PENDING = "pending"
    EXPIRED = "expired"


class SyncSource(str, enum.Enum):
    VEHICLE_SOURCE = "vehicle_source"
    FINANCE = "finance"
    INSPECTOR = "inspector"


class Store(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    __tablename__ = "stores"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    region: Mapped[str] = mapped_column(String(64), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=True,
    )

    vehicles: Mapped[List["Vehicle"]] = relationship(
        "Vehicle",
        back_populates="store",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_stores_location", "location", postgresql_using="gist"),
        Index("idx_stores_region", "region"),
    )


class Vehicle(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    __tablename__ = "vehicles"

    vin: Mapped[str] = mapped_column(String(17), nullable=False, unique=True)
    plate_number: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    brand: Mapped[str] = mapped_column(String(64), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    inbound_date: Mapped[date] = mapped_column(Date, nullable=False)
    stage: Mapped[TurnoverStage] = mapped_column(
        PGENUM(TurnoverStage, name="turnover_stage", create_type=False),
        nullable=False,
        default=TurnoverStage.INBOUND,
    )
    stock_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    document_completion: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        default=0,
    )
    risk_level: Mapped[RiskLevel] = mapped_column(
        PGENUM(RiskLevel, name="risk_level", create_type=False),
        nullable=False,
        default=RiskLevel.LOW,
    )

    store: Mapped["Store"] = relationship("Store", back_populates="vehicles")
    documents: Mapped[List["DocumentItem"]] = relationship(
        "DocumentItem",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    preparation_records: Mapped[List["PreparationRecord"]] = relationship(
        "PreparationRecord",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    test_drive_records: Mapped[List["TestDriveRecord"]] = relationship(
        "TestDriveRecord",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    quote_records: Mapped[List["QuoteRecord"]] = relationship(
        "QuoteRecord",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        CheckConstraint(
            "document_completion BETWEEN 0 AND 100",
            name="check_document_completion_range",
        ),
        Index("idx_vehicles_store", "store_id"),
        Index("idx_vehicles_stage", "stage"),
        Index("idx_vehicles_risk", "risk_level"),
        Index("idx_vehicles_stock", "stock_days"),
        Index("idx_vehicles_inbound", "inbound_date"),
        Index("idx_vehicles_composite", "store_id", "stage", "risk_level"),
    )


class DocumentItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_items"

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    doc_type: Mapped[DocumentType] = mapped_column(
        PGENUM(DocumentType, name="document_type", create_type=False),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        PGENUM(DocumentStatus, name="document_status", create_type=False),
        nullable=False,
        default=DocumentStatus.MISSING,
    )
    uploaded_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    expire_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verified_by: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="documents")

    __table_args__ = (
        UniqueConstraint("vehicle_id", "doc_type", name="uq_vehicle_doc_type"),
        Index("idx_doc_vehicle", "vehicle_id"),
        Index("idx_doc_status", "status"),
        Index("idx_doc_expire", "expire_at", postgresql_where=(expire_at is not None)),
    )


class Alert(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "alerts"

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    rule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    doc_type: Mapped[Optional[DocumentType]] = mapped_column(
        PGENUM(DocumentType, name="document_type", create_type=False),
        nullable=True,
    )
    level: Mapped[RiskLevel] = mapped_column(
        PGENUM(RiskLevel, name="risk_level", create_type=False),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ,
        nullable=False,
        server_default=func.now(),
    )
    acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="alerts")

    __table_args__ = (
        Index("idx_alerts_vehicle", "vehicle_id"),
        Index("idx_alerts_store", "store_id"),
        Index("idx_alerts_level", "level"),
        Index("idx_alerts_triggered", "triggered_at"),
        Index("idx_alerts_open", "resolved", "acknowledged", postgresql_where=(~resolved)),
        Index("idx_alerts_composite", "store_id", "level", "resolved"),
    )


class WarningRule(Base, TimestampMixin, UUIDPrimaryKeyMixin):
    __tablename__ = "warning_rules"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dsl_expression: Mapped[str] = mapped_column(Text, nullable=False)
    default_level: Mapped[RiskLevel] = mapped_column(
        PGENUM(RiskLevel, name="risk_level", create_type=False),
        nullable=False,
        default=RiskLevel.MEDIUM,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    params: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")


class PreparationRecord(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "preparation_records"

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="todo")
    started_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMPTZ,
        nullable=False,
        server_default=func.now(),
    )

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="preparation_records")

    __table_args__ = (
        Index("idx_prep_vehicle", "vehicle_id"),
        Index("idx_prep_store", "store_id"),
        Index("idx_prep_status", "status"),
        Index("idx_prep_completed", "completed_at"),
    )


class TestDriveRecord(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "test_drive_records"

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_name: Mapped[str] = mapped_column(String(64), nullable=False)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    mileage_before: Mapped[int] = mapped_column(Integer, nullable=False)
    mileage_after: Mapped[int] = mapped_column(Integer, nullable=False)
    salesman: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    drive_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="test_drive_records")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="check_rating_range"),
        Index("idx_td_vehicle", "vehicle_id"),
        Index("idx_td_store", "store_id"),
        Index("idx_td_date", "drive_at"),
        Index("idx_td_rating", "rating"),
    )


class QuoteRecord(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "quote_records"

    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
    )
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="门店")
    customer_contact: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_deal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    deal_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    quoted_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="quote_records")

    __table_args__ = (
        Index("idx_quote_vehicle", "vehicle_id"),
        Index("idx_quote_store", "store_id"),
        Index("idx_quote_date", "quoted_at"),
        Index("idx_quote_deal", "is_deal"),
        Index("idx_quote_composite", "store_id", "quoted_at", "is_deal"),
    )


class SyncLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sync_logs"

    source: Mapped[SyncSource] = mapped_column(
        PGENUM(SyncSource, name="sync_source", create_type=False),
        nullable=False,
    )
    batch_no: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    total_records: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    success_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    started_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMPTZ, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="running")

    __table_args__ = (
        Index("idx_sync_source", "source"),
        Index("idx_sync_status", "status"),
        Index("idx_sync_started", "started_at"),
    )
