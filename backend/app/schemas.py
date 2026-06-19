from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models import ComplaintStatus, FlagType, ViewType


class ComplaintCreate(BaseModel):
    guest_name: str
    room_no: str
    check_in_date: datetime
    check_out_date: datetime
    complaint_type: str
    complaint_content: str
    status: ComplaintStatus = ComplaintStatus.pending
    assigned_to: Optional[str] = None
    revisit_result: Optional[str] = None
    responsibility: Optional[str] = None
    problem_tag: Optional[str] = None


class ComplaintUpdate(BaseModel):
    guest_name: Optional[str] = None
    room_no: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    complaint_type: Optional[str] = None
    complaint_content: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    revisit_result: Optional[str] = None
    responsibility: Optional[str] = None
    problem_tag: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    guest_name: str
    room_no: str
    check_in_date: datetime
    check_out_date: datetime
    complaint_type: str
    complaint_content: str
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    revisit_result: Optional[str] = None
    responsibility: Optional[str] = None
    problem_tag: Optional[str] = None

    model_config = {"from_attributes": True}


class AnomalyFlagCreate(BaseModel):
    complaint_id: int
    flag_type: FlagType
    description: str
    severity: str


class AnomalyFlagUpdate(BaseModel):
    flag_type: Optional[FlagType] = None
    description: Optional[str] = None
    severity: Optional[str] = None


class AnomalyFlagResponse(BaseModel):
    id: int
    complaint_id: int
    flag_type: FlagType
    description: str
    detected_at: datetime
    severity: str

    model_config = {"from_attributes": True}


class ReviewNoteCreate(BaseModel):
    complaint_id: int
    anomaly_flag_id: Optional[int] = None
    content: str
    author: str


class ReviewNoteUpdate(BaseModel):
    content: Optional[str] = None
    author: Optional[str] = None


class ReviewNoteResponse(BaseModel):
    id: int
    complaint_id: int
    anomaly_flag_id: Optional[int] = None
    content: str
    author: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FunnelStageCreate(BaseModel):
    stage_name: str
    stage_order: int
    complaint_count: int = 0
    avg_duration_hours: int = 0
    date_recorded: datetime


class FunnelStageUpdate(BaseModel):
    stage_name: Optional[str] = None
    stage_order: Optional[int] = None
    complaint_count: Optional[int] = None
    avg_duration_hours: Optional[int] = None
    date_recorded: Optional[datetime] = None


class FunnelStageResponse(BaseModel):
    id: int
    stage_name: str
    stage_order: int
    complaint_count: int
    avg_duration_hours: int
    date_recorded: datetime

    model_config = {"from_attributes": True}


class SavedViewCreate(BaseModel):
    view_name: str
    view_type: ViewType
    filters_json: str
    created_by: str


class SavedViewUpdate(BaseModel):
    view_name: Optional[str] = None
    view_type: Optional[ViewType] = None
    filters_json: Optional[str] = None


class SavedViewResponse(BaseModel):
    id: int
    view_name: str
    view_type: ViewType
    filters_json: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
