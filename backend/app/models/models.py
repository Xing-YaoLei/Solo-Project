import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Date
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AUDITOR = "auditor"
    MANAGER = "manager"
    VENDOR = "vendor"


class SamplingStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    FOLLOW_UP = "follow_up"


class EvidenceStatus(str, enum.Enum):
    COMPLETE = "complete"
    MISSING = "missing"
    PARTIAL = "partial"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RectificationStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    CLOSED = "closed"


class MaterialStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExceptionType(str, enum.Enum):
    EVIDENCE_MISSING = "evidence_missing"
    NON_COMPLIANCE = "non_compliance"
    OTHER = "other"


class ExceptionStatus(str, enum.Enum):
    OPEN = "open"
    PROCESSING = "processing"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.AUDITOR)
    created_at = Column(DateTime, default=datetime.utcnow)

    checklists = relationship("AuditChecklist", back_populates="creator")
    status_logs = relationship("StatusChangeLog", back_populates="changer")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact = Column(String(100))
    email = Column(String(100))
    phone = Column(String(50))
    address = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    rectifications = relationship("RectificationPlan", back_populates="vendor")
    materials = relationship("SupplierMaterial", back_populates="vendor")


class AuditChecklist(Base):
    __tablename__ = "audit_checklists"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    criteria = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="checklists")
    sampling_records = relationship("SamplingRecord", back_populates="checklist")


class SamplingRecord(Base):
    __tablename__ = "sampling_records"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("audit_checklists.id"), nullable=False, index=True)
    sample_name = Column(String(300), nullable=False)
    sample_code = Column(String(100), unique=True, nullable=False, index=True)
    source = Column(String(200))
    sampling_date = Column(Date, nullable=False)
    sampled_by = Column(String(100))
    status = Column(Enum(SamplingStatus), nullable=False, default=SamplingStatus.PENDING)
    sample_data = Column(JSON, default=dict)
    evidence_status = Column(Enum(EvidenceStatus), nullable=False, default=EvidenceStatus.COMPLETE)
    created_at = Column(DateTime, default=datetime.utcnow)

    checklist = relationship("AuditChecklist", back_populates="sampling_records")
    rectifications = relationship("RectificationPlan", back_populates="sampling")
    exceptions = relationship("ExceptionOrder", back_populates="sampling")


class RectificationPlan(Base):
    __tablename__ = "rectification_plans"

    id = Column(Integer, primary_key=True, index=True)
    sampling_id = Column(Integer, ForeignKey("sampling_records.id"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    risk_level = Column(Enum(RiskLevel), nullable=False, default=RiskLevel.MEDIUM)
    deadline = Column(Date)
    responsible_person = Column(String(100))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), index=True)
    status = Column(Enum(RectificationStatus), nullable=False, default=RectificationStatus.NOT_STARTED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sampling = relationship("SamplingRecord", back_populates="rectifications")
    vendor = relationship("Vendor", back_populates="rectifications")


class SupplierMaterial(Base):
    __tablename__ = "supplier_materials"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    material_type = Column(String(100), nullable=False)
    material_name = Column(String(300), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String(100))
    file_path = Column(String(500), nullable=False)
    status = Column(Enum(MaterialStatus), nullable=False, default=MaterialStatus.PENDING)

    vendor = relationship("Vendor", back_populates="materials")


class ExceptionOrder(Base):
    __tablename__ = "exception_orders"

    id = Column(Integer, primary_key=True, index=True)
    sampling_id = Column(Integer, ForeignKey("sampling_records.id"), nullable=False, index=True)
    exception_type = Column(Enum(ExceptionType), nullable=False, default=ExceptionType.OTHER)
    impact_scope = Column(Text)
    responsible_person = Column(String(100))
    root_cause = Column(Text)
    handling_result = Column(Text)
    status = Column(Enum(ExceptionStatus), nullable=False, default=ExceptionStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sampling = relationship("SamplingRecord", back_populates="exceptions")


class StatusChangeLog(Base):
    __tablename__ = "status_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    old_status = Column(String(50))
    new_status = Column(String(50), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    remark = Column(Text)

    changer = relationship("User", back_populates="status_logs")
