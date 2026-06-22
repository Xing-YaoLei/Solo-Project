from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SyncStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class SyncNodeType(str, Enum):
    EXTRACT = "extract"
    TRANSFORM = "transform"
    VALIDATE = "validate"
    LOAD = "load"
    ARCHIVE = "archive"


class IssueSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IssueStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REOCCURRED = "reoccurred"
    CLOSED = "closed"


class EvidenceType(str, Enum):
    AUDIT_WORKPAPER = "audit_workpaper"
    PERMISSION_LOG = "permission_log"
    MAIL_MATERIAL = "mail_material"
    OTHER = "other"


class Region(BaseModel):
    region_id: str
    region_name: str
    province: Optional[str] = None
    city: Optional[str] = None


class SyncNode(BaseModel):
    sync_id: str
    node_type: SyncNodeType
    node_name: str
    source_system: str
    target_system: str
    status: SyncStatus
    record_count: int = 0
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    operator: str
    batch_no: str


class AuditWorkpaper(BaseModel):
    workpaper_id: str
    workpaper_no: str
    title: str
    content: str
    region_id: str
    audit_date: datetime
    auditor: str
    department: str
    sync_id: str
    created_at: datetime
    updated_at: datetime


class PermissionLog(BaseModel):
    log_id: str
    user_id: str
    user_name: str
    department: str
    permission_code: str
    permission_name: str
    action: str
    resource_path: str
    ip_address: str
    is_violation: bool = False
    violation_reason: Optional[str] = None
    region_id: str
    operation_time: datetime
    sync_id: str
    created_at: datetime


class MailMaterial(BaseModel):
    mail_id: str
    subject: str
    sender: str
    recipient: str
    cc_recipients: Optional[str] = None
    content: str
    has_attachment: bool = False
    attachment_count: int = 0
    region_id: str
    sent_time: datetime
    sync_id: str
    created_at: datetime


class EvidenceArchive(BaseModel):
    archive_id: str
    evidence_type: EvidenceType
    source_id: str
    source_table: str
    title: str
    description: Optional[str] = None
    region_id: str
    archive_date: datetime
    archived_by: str
    retention_period: int
    is_sensitive: bool = False
    minio_bucket: Optional[str] = None
    minio_object_key: Optional[str] = None
    file_hash: Optional[str] = None
    sync_id: str
    created_at: datetime


class IssueRecord(BaseModel):
    issue_id: str
    issue_no: str
    title: str
    description: str
    severity: IssueSeverity
    status: IssueStatus
    region_id: str
    related_archive_id: Optional[str] = None
    found_date: datetime
    resolved_date: Optional[datetime] = None
    handler: str
    is_reoccurrence: bool = False
    original_issue_id: Optional[str] = None
    recurrence_count: int = 0
    created_at: datetime
    updated_at: datetime


class ChecklistItem(BaseModel):
    checklist_id: str
    item_no: str
    item_content: str
    category: str
    is_checked: bool = False
    checked_by: Optional[str] = None
    checked_at: Optional[datetime] = None
    remark: Optional[str] = None
    related_archive_id: Optional[str] = None
    region_id: str
    created_at: datetime


class SamplingRecord(BaseModel):
    sampling_id: str
    sampling_no: str
    sampling_method: str
    population_size: int
    sample_size: int
    confidence_level: float
    margin_of_error: float
    sampling_criteria: str
    region_id: str
    sampled_by: str
    sampled_at: datetime
    related_archive_ids: Optional[str] = None
    original_record_refs: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime


class NotificationTemplate(BaseModel):
    template_id: str
    template_name: str
    template_type: str
    subject: str
    content: str
    version: str
    region_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime


class EvidenceAttachment(BaseModel):
    attachment_id: str
    archive_id: str
    file_name: str
    file_type: str
    file_size: int
    minio_bucket: str
    minio_object_key: str
    file_hash: str
    uploaded_by: str
    uploaded_at: datetime
