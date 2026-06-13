from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class WarningThresholdBase(BaseModel):
    threshold_type: str
    threshold_name: str
    threshold_value: float
    threshold_unit: str = "天"
    description: Optional[str] = None
    is_enabled: int = 1


class WarningThresholdCreate(WarningThresholdBase):
    created_by: Optional[str] = None


class WarningThresholdUpdate(BaseModel):
    threshold_name: Optional[str] = None
    threshold_value: Optional[float] = None
    threshold_unit: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[int] = None
    updated_by: Optional[str] = None
    remark: Optional[str] = None


class WarningThresholdResponse(WarningThresholdBase):
    id: int
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ThresholdAuditLogResponse(BaseModel):
    id: int
    threshold_id: int
    threshold_type: str
    old_value: Optional[float] = None
    new_value: Optional[float] = None
    old_name: Optional[str] = None
    new_name: Optional[str] = None
    operator_name: str
    operation_type: str
    remark: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RenewalNoteBase(BaseModel):
    member_id: int
    membership_id: Optional[int] = None
    source: str = "manual"
    title: str
    content: str
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[date] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    related_funnel_stage: Optional[str] = None
    related_metric: Optional[str] = None
    remark: Optional[str] = None


class RenewalNoteCreate(RenewalNoteBase):
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None


class RenewalNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    conclusion: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    remark: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_by_name: Optional[str] = None


class RenewalNoteResponse(RenewalNoteBase):
    id: int
    note_no: str
    conclusion: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_by_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
