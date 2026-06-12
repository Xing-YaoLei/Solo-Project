from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class FaultRecordBase(BaseModel):
    fault_code: str
    equipment_id: int
    store_id: int
    fault_type: str
    severity: Optional[str] = "medium"
    fault_time: datetime
    description: Optional[str] = None
    is_cleaning_related: Optional[bool] = False
    status: Optional[str] = "pending"

class FaultRecordCreate(FaultRecordBase):
    pass

class FaultRecord(FaultRecordBase):
    id: int
    fault_category: Optional[str] = None
    detected_by: Optional[str] = None
    root_cause: Optional[str] = None
    impact_assessment: Optional[str] = None
    resolved_time: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution: Optional[str] = None
    downtime_minutes: Optional[int] = 0
    maintenance_cost: Optional[float] = 0.0
    related_data: Optional[Dict[str, Any]] = {}
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class RectificationTaskBase(BaseModel):
    task_code: str
    equipment_id: int
    store_id: int
    task_type: str
    priority: Optional[str] = "medium"
    title: str
    description: Optional[str] = None
    requirement: Optional[str] = None
    deadline: datetime
    assignee: Optional[str] = None
    status: Optional[str] = "pending"

class RectificationTaskCreate(RectificationTaskBase):
    pass

class RectificationTask(RectificationTaskBase):
    id: int
    fault_id: Optional[int] = None
    inspection_id: Optional[int] = None
    assignor: Optional[str] = None
    status_reason: Optional[str] = None
    progress: Optional[int] = 0
    start_time: Optional[datetime] = None
    complete_time: Optional[datetime] = None
    actual_result: Optional[str] = None
    attachments: Optional[List[Any]] = []
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class RecheckResultBase(BaseModel):
    recheck_code: str
    task_id: int
    recheck_time: datetime
    result: str
    description: Optional[str] = None

class RecheckResultCreate(RecheckResultBase):
    pass

class RecheckResult(RecheckResultBase):
    id: int
    rechecker: Optional[str] = None
    score: Optional[float] = None
    items: Optional[List[Any]] = []
    issues_found: Optional[List[Any]] = []
    evidence_photos: Optional[List[Any]] = []
    pass_threshold: Optional[float] = 80.0
    conclusion: Optional[str] = None
    next_action: Optional[str] = None
    next_recheck_time: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class FaultOverview(BaseModel):
    total_count: int
    pending_count: int
    processing_count: int
    resolved_count: int
    cleaning_related_count: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    by_status: Dict[str, int]
    trend: List[Dict[str, Any]]

class TaskFilterRequest(BaseModel):
    store_id: Optional[int] = None
    equipment_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    has_recheck: Optional[bool] = None
    recheck_result: Optional[str] = None
    deadline_from: Optional[datetime] = None
    deadline_to: Optional[datetime] = None
