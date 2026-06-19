from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from ..models import UserRole, ReservationStatus, TimelineEventType, ConflictStatus


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.OPERATOR


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TimeSlotBase(BaseModel):
    date: datetime
    start_time: str
    end_time: str
    capacity: int
    remaining_capacity: Optional[int] = None
    is_active: Optional[bool] = True
    description: Optional[str] = None


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class TimeSlotResponse(TimeSlotBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CapacityRuleBase(BaseModel):
    time_slot_id: int
    rule_type: str
    rule_value: dict
    priority: int = 0
    is_active: bool = True
    description: Optional[str] = None


class CapacityRuleCreate(CapacityRuleBase):
    pass


class CapacityRuleUpdate(BaseModel):
    rule_value: Optional[dict] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class CapacityRuleResponse(CapacityRuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReservationBase(BaseModel):
    visitor_name: str
    visitor_phone: str
    visitor_count: int = 1
    ticket_type: Optional[str] = None
    source: Optional[str] = None
    remark: Optional[str] = None


class ReservationCreate(ReservationBase):
    time_slot_id: int


class ReservationUpdate(BaseModel):
    visitor_name: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_count: Optional[int] = None
    ticket_type: Optional[str] = None
    status: Optional[ReservationStatus] = None
    remark: Optional[str] = None


class ReservationResponse(ReservationBase):
    id: int
    reservation_no: str
    time_slot_id: int
    time_slot: Optional[TimeSlotResponse] = None
    status: ReservationStatus
    check_in_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReservationListResponse(BaseModel):
    items: List[ReservationResponse]
    total: int
    page: int
    page_size: int


class RescheduleRecordBase(BaseModel):
    original_reservation_id: int
    new_time_slot_id: int
    reason: Optional[str] = None


class RescheduleCreate(RescheduleRecordBase):
    pass


class RescheduleResponse(BaseModel):
    id: int
    original_reservation_id: int
    new_reservation_id: Optional[int] = None
    original_time_slot_id: int
    new_time_slot_id: Optional[int] = None
    reason: Optional[str] = None
    operator_id: Optional[int] = None
    reschedule_time: datetime
    status: str

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class TimelineRecordBase(BaseModel):
    event_type: TimelineEventType
    description: Optional[str] = None
    metadata: Optional[dict] = Field(default=None, alias="event_metadata")

    class Config:
        populate_by_name = True


class TimelineRecordCreate(TimelineRecordBase):
    reservation_id: int


class TimelineRecordResponse(TimelineRecordBase):
    id: int
    reservation_id: int
    operator_id: Optional[int] = None
    operator: Optional[UserResponse] = None
    attachments: List[AttachmentResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ConflictAffectedObjectResponse(BaseModel):
    id: int
    conflict_id: int
    reservation_id: int
    reservation: Optional[ReservationResponse] = None
    impact_type: Optional[str] = None
    impact_description: Optional[str] = None

    class Config:
        from_attributes = True


class ConflictRecordBase(BaseModel):
    time_slot_id: int
    conflict_type: str
    description: Optional[str] = None
    severity: str = "medium"


class ConflictRecordCreate(ConflictRecordBase):
    affected_reservations: List[int] = []


class ConflictRecordUpdate(BaseModel):
    status: Optional[ConflictStatus] = None
    assigned_to: Optional[int] = None
    resolution: Optional[str] = None


class ConflictRecordResponse(ConflictRecordBase):
    id: int
    conflict_no: str
    status: ConflictStatus
    assigned_to: Optional[int] = None
    assignee: Optional[UserResponse] = None
    resolution: Optional[str] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    affected_objects: List[ConflictAffectedObjectResponse] = []

    class Config:
        from_attributes = True


class ConflictListResponse(BaseModel):
    items: List[ConflictRecordResponse]
    total: int
    page: int
    page_size: int


class AttendanceStats(BaseModel):
    date: str
    total_reservations: int
    total_visitors: int
    checked_in: int
    check_in_rate: float
    cancelled: int
    pending: int


class ExportRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[List[ReservationStatus]] = None
    export_format: str = "excel"


class BatchOperationRequest(BaseModel):
    reservation_ids: List[int]
    operation: str
    params: Optional[dict] = None
