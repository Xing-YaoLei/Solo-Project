from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, ForeignKey,
    Boolean, Float, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

from app.database import Base


class UserRole(PyEnum):
    MANAGEMENT = "management"
    FRONTLINE = "frontline"
    ADMIN = "admin"


class RiskLevel(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SamplingStatus(PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EVIDENCE_MISSING = "evidence_missing"


class RectificationStatus(PyEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class BatchStatus(PyEnum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class User(UserMixin, Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    full_name = Column(String(120))
    role = Column(Enum(UserRole), default=UserRole.FRONTLINE, nullable=False)
    department = Column(String(120))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    assigned_samples = relationship(
        "SamplingRecord",
        foreign_keys="SamplingRecord.assigned_user_id",
        back_populates="assigned_user"
    )
    comments = relationship("Comment", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_management(self):
        return self.role in (UserRole.MANAGEMENT, UserRole.ADMIN)


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True)
    batch_number = Column(String(64), unique=True, nullable=False, index=True)
    source_type = Column(String(64), nullable=False)
    description = Column(Text)
    status = Column(Enum(BatchStatus), default=BatchStatus.RUNNING, nullable=False)
    total_records = Column(Integer, default=0)
    success_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    error_message = Column(Text)
    imported_by = Column(Integer, ForeignKey("users.id"))
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)

    emails = relationship("EmailMaterial", back_populates="batch")
    permission_logs = relationship("PermissionLog", back_populates="batch")
    workpapers = relationship("AuditWorkpaper", back_populates="batch")


class EmailMaterial(Base):
    __tablename__ = "email_materials"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    message_id = Column(String(256), index=True)
    subject = Column(String(512))
    sender = Column(String(256))
    recipients = Column(Text)
    sent_at = Column(DateTime, index=True)
    received_at = Column(DateTime)
    body = Column(Text)
    attachments_count = Column(Integer, default=0)
    attachment_names = Column(JSON)
    keywords = Column(JSON)
    department = Column(String(120))
    category = Column(String(120))
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("ImportBatch", back_populates="emails")
    sampling_records = relationship("SamplingRecord", back_populates="email")


class PermissionLog(Base):
    __tablename__ = "permission_logs"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    user_identifier = Column(String(128), index=True)
    user_name = Column(String(120))
    department = Column(String(120))
    action = Column(String(64), index=True)
    resource = Column(String(256))
    permission_level = Column(String(64))
    ip_address = Column(String(64))
    action_time = Column(DateTime, index=True)
    status = Column(String(32))
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("ImportBatch", back_populates="permission_logs")
    sampling_records = relationship("SamplingRecord", back_populates="permission_log")


class AuditWorkpaper(Base):
    __tablename__ = "audit_workpapers"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id"), nullable=False)
    workpaper_id = Column(String(128), index=True)
    title = Column(String(512))
    audit_period = Column(String(64))
    department = Column(String(120))
    auditor = Column(String(120))
    checklist_item = Column(String(256))
    finding = Column(Text)
    conclusion = Column(String(256))
    workpaper_date = Column(Date, index=True)
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("ImportBatch", back_populates="workpapers")
    sampling_records = relationship("SamplingRecord", back_populates="workpaper")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True)
    code = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(512), nullable=False)
    category = Column(String(120), index=True)
    sub_category = Column(String(120))
    description = Column(Text)
    regulation_reference = Column(String(512))
    default_risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sampling_records = relationship("SamplingRecord", back_populates="checklist")


class SamplingRecord(Base):
    __tablename__ = "sampling_records"

    id = Column(Integer, primary_key=True)
    sample_code = Column(String(64), unique=True, nullable=False, index=True)
    checklist_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    email_id = Column(Integer, ForeignKey("email_materials.id"))
    permission_log_id = Column(Integer, ForeignKey("permission_logs.id"))
    workpaper_id = Column(Integer, ForeignKey("audit_workpapers.id"))
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String(120), index=True)
    status = Column(Enum(SamplingStatus), default=SamplingStatus.PENDING, nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM, index=True)
    has_evidence = Column(Boolean, default=False)
    evidence_description = Column(Text)
    audit_note = Column(Text)
    sampled_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    audit_date = Column(Date, index=True)

    checklist = relationship("ChecklistItem", back_populates="sampling_records")
    email = relationship("EmailMaterial", back_populates="sampling_records")
    permission_log = relationship("PermissionLog", back_populates="sampling_records")
    workpaper = relationship("AuditWorkpaper", back_populates="sampling_records")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id], back_populates="assigned_samples")
    comments = relationship("Comment", back_populates="sampling_record")
    risk_histories = relationship("RiskHistory", back_populates="sampling_record")
    rectifications = relationship("RectificationPlan", back_populates="sampling_record")


class RectificationPlan(Base):
    __tablename__ = "rectification_plans"

    id = Column(Integer, primary_key=True)
    sampling_record_id = Column(Integer, ForeignKey("sampling_records.id"), nullable=False)
    title = Column(String(512), nullable=False)
    description = Column(Text)
    responsible_person = Column(String(120))
    department = Column(String(120), index=True)
    status = Column(Enum(RectificationStatus), default=RectificationStatus.NOT_STARTED, nullable=False, index=True)
    priority = Column(Integer, default=3)
    due_date = Column(Date, index=True)
    completed_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sampling_record = relationship("SamplingRecord", back_populates="rectifications")


class RiskHistory(Base):
    __tablename__ = "risk_histories"

    id = Column(Integer, primary_key=True)
    sampling_record_id = Column(Integer, ForeignKey("sampling_records.id"), nullable=False)
    previous_level = Column(Enum(RiskLevel))
    new_level = Column(Enum(RiskLevel), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sampling_record = relationship("SamplingRecord", back_populates="risk_histories")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    sampling_record_id = Column(Integer, ForeignKey("sampling_records.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    comment_type = Column(String(64), default="general")
    is_evidence_missing = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sampling_record = relationship("SamplingRecord", back_populates="comments")
    user = relationship("User", back_populates="comments")


Index("ix_sampling_dept_status", SamplingRecord.department, SamplingRecord.status)
Index("ix_sampling_user_status", SamplingRecord.assigned_user_id, SamplingRecord.status)


all_models = [
    User, ImportBatch, EmailMaterial, PermissionLog, AuditWorkpaper,
    ChecklistItem, SamplingRecord, RectificationPlan, RiskHistory, Comment
]
