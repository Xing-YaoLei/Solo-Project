import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    manager_name: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    stores: Mapped[list["Store"]] = relationship(back_populates="region", lazy="selectin")


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    region_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("regions.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(30))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    region: Mapped["Region"] = relationship(back_populates="stores", lazy="selectin")
    users: Mapped[list["User"]] = relationship(back_populates="store", lazy="selectin")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id"), nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("admin", "regional_manager", "store_manager", "pharmacist", name="user_role"),
        default="pharmacist",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    store: Mapped["Store"] = relationship(back_populates="users", lazy="selectin")


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    id_number: Mapped[str | None] = mapped_column(String(30))
    phone: Mapped[str | None] = mapped_column(String(30))
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime)
    gender: Mapped[str | None] = mapped_column(String(10))
    address: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    prescriptions: Mapped[list["Prescription"]] = relationship(back_populates="member", lazy="selectin")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    store_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("stores.id"), nullable=False)
    member_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("member_profiles.id"), nullable=False)
    rx_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pending", "in_review", "approved", "rejected", "exception", name="prescription_status"),
        default="pending",
    )
    priority: Mapped[str] = mapped_column(
        Enum("normal", "urgent", "critical", name="prescription_priority"),
        default="normal",
    )
    diagnosis: Mapped[str | None] = mapped_column(Text)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    reviewer_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    member: Mapped["MemberProfile"] = relationship(back_populates="prescriptions", lazy="selectin")
    reviewer: Mapped["User | None"] = relationship(lazy="selectin")
    batch_items: Mapped[list["BatchItem"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    replenishments: Mapped[list["Replenishment"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    insurance_records: Mapped[list["InsuranceRecord"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    photos: Mapped[list["PrescriptionPhoto"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    exceptions: Mapped[list["Exception"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")
    caliber_notes: Mapped[list["PrescriptionCaliberNote"]] = relationship(back_populates="prescription", lazy="selectin", cascade="all, delete-orphan")


class BatchItem(Base):
    __tablename__ = "batch_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    drug_name: Mapped[str] = mapped_column(String(200), nullable=False)
    drug_code: Mapped[str | None] = mapped_column(String(50))
    specification: Mapped[str | None] = mapped_column(String(100))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit: Mapped[str | None] = mapped_column(String(20))
    dosage: Mapped[str | None] = mapped_column(String(100))
    frequency: Mapped[str | None] = mapped_column(String(100))
    duration_days: Mapped[int | None] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="batch_items")


class Replenishment(Base):
    __tablename__ = "replenishments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    drug_name: Mapped[str] = mapped_column(String(200), nullable=False)
    drug_code: Mapped[str | None] = mapped_column(String(50))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("pending", "fulfilled", "cancelled", name="replenishment_status"),
        default="pending",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="replenishments")


class InsuranceRecord(Base):
    __tablename__ = "insurance_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    insurance_type: Mapped[str] = mapped_column(String(50), nullable=False)
    policy_number: Mapped[str | None] = mapped_column(String(100))
    coverage_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    covered_amount: Mapped[float] = mapped_column(Float, default=0.0)
    self_pay_amount: Mapped[float] = mapped_column(Float, default=0.0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="insurance_records")


class PrescriptionPhoto(Base):
    __tablename__ = "prescription_photos"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(200), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), default="image/jpeg")
    uploaded_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="photos")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str | None] = mapped_column(String(30))
    description: Mapped[str | None] = mapped_column(Text)
    performed_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="timeline_events")


class Exception(Base):
    __tablename__ = "exceptions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    exception_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", "critical", name="exception_severity"),
        default="medium",
    )
    impact_scope: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    assignee_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    resolution: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("open", "in_progress", "resolved", "closed", name="exception_status"),
        default="open",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="exceptions")
    assignee: Mapped["User | None"] = relationship(lazy="selectin")


class ExportRecord(Base):
    __tablename__ = "export_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    task_id: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    export_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "completed", "failed", name="export_status"),
        default="pending",
    )
    requested_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    error_message: Mapped[str | None] = mapped_column(Text)
    row_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)


class CaliberNote(Base):
    __tablename__ = "caliber_notes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    metric: Mapped[str] = mapped_column(String(100), nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    exclusions: Mapped[list] = mapped_column(JSONB, default=list)
    remarks: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class PrescriptionCaliberNote(Base):
    __tablename__ = "prescription_caliber_notes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    prescription_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("prescriptions.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    created_by: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    prescription: Mapped["Prescription"] = relationship(back_populates="caliber_notes")
