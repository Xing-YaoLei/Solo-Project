from datetime import datetime, timedelta, date, time
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models import (
    UserRole, CleaningStatus, AttendanceStatus,
    RescheduleReason, RiskLevel
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[UserRole] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    role: UserRole = UserRole.CLEANER
    is_active: bool = True
    avatar_url: Optional[str] = None
    skills: Optional[List[str]] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    skills: Optional[List[str]] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserInDB(User):
    hashed_password: str


class ApartmentBase(BaseModel):
    apartment_code: str
    building: str
    unit: str
    room_number: Optional[str] = None
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    apartment_type: Optional[str] = None
    resident_name: Optional[str] = None
    resident_phone: Optional[str] = None
    door_lock_info: Optional[str] = None
    special_instructions: Optional[str] = None
    is_active: bool = True


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    building: Optional[str] = None
    unit: Optional[str] = None
    room_number: Optional[str] = None
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    apartment_type: Optional[str] = None
    resident_name: Optional[str] = None
    resident_phone: Optional[str] = None
    door_lock_info: Optional[str] = None
    special_instructions: Optional[str] = None
    is_active: Optional[bool] = None


class Apartment(ApartmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TimeSlotBase(BaseModel):
    slot_name: str
    start_time: time
    end_time: time
    is_peak: bool = False
    capacity: int = 3
    is_active: bool = True


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    slot_name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_peak: Optional[bool] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None


class TimeSlot(TimeSlotBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CleaningScheduleBase(BaseModel):
    apartment_id: int
    cleaner_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    scheduled_date: date
    time_slot_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 120
    cleaning_type: str = "routine"
    priority: int = 0
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    estimated_cost: Optional[float] = None


class CleaningScheduleCreate(CleaningScheduleBase):
    pass


class CleaningScheduleUpdate(BaseModel):
    cleaner_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    scheduled_date: Optional[date] = None
    time_slot_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[CleaningStatus] = None
    attendance_status: Optional[AttendanceStatus] = None
    cleaning_type: Optional[str] = None
    priority: Optional[int] = None
    customer_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    quality_score: Optional[int] = None
    feedback: Optional[str] = None


class CleaningScheduleInDB(CleaningScheduleBase):
    id: int
    schedule_code: str
    status: CleaningStatus
    attendance_status: AttendanceStatus
    has_conflict: bool = False
    risk_level: Optional[RiskLevel] = None
    conflict_details: Optional[Dict[str, Any]] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class CleaningSchedule(CleaningScheduleInDB):
    apartment: Optional[Apartment] = None
    cleaner: Optional[User] = None
    supervisor: Optional[User] = None
    time_slot: Optional[TimeSlot] = None


class ConflictCheckRequest(BaseModel):
    cleaner_id: Optional[int] = None
    apartment_id: int
    start_time: datetime
    end_time: datetime
    schedule_id: Optional[int] = None


class ConflictInfo(BaseModel):
    conflict_type: str
    risk_level: RiskLevel
    description: str
    conflicting_schedule_id: Optional[int] = None
    details: Dict[str, Any] = {}


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflicts: List[ConflictInfo] = []
    capacity_warnings: List[str] = []


class RescheduleRecordBase(BaseModel):
    cleaning_schedule_id: int
    old_start_time: datetime
    old_end_time: datetime
    new_start_time: datetime
    new_end_time: datetime
    old_cleaner_id: Optional[int] = None
    new_cleaner_id: Optional[int] = None
    reason: RescheduleReason
    reason_detail: Optional[str] = None
    requested_by: Optional[int] = None


class RescheduleRecordCreate(RescheduleRecordBase):
    pass


class RescheduleRecord(RescheduleRecordBase):
    id: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordBase(BaseModel):
    cleaning_schedule_id: int
    status: AttendanceStatus
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    recorded_by: Optional[int] = None


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecord(AttendanceRecordBase):
    id: int
    timestamp: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConflictRecordBase(BaseModel):
    cleaning_schedule_id: int
    conflicting_schedule_id: Optional[int] = None
    conflict_type: str
    risk_level: RiskLevel
    description: str


class ConflictRecordCreate(ConflictRecordBase):
    pass


class ConflictRecordUpdate(BaseModel):
    is_resolved: Optional[bool] = None
    resolved_by: Optional[int] = None
    resolution_notes: Optional[str] = None


class ConflictRecord(ConflictRecordBase):
    id: int
    is_resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class CommunicationRecordBase(BaseModel):
    cleaning_schedule_id: int
    message_type: str = "note"
    content: str
    attachments: Optional[List[str]] = None
    is_internal: bool = True
    recipient: Optional[str] = None


class CommunicationRecordCreate(CommunicationRecordBase):
    pass


class CommunicationRecord(CommunicationRecordBase):
    id: int
    sender_id: int
    sender: Optional[User] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReviewOpinionBase(BaseModel):
    cleaning_schedule_id: int
    review_type: str
    opinion: str
    decision: Optional[str] = None
    is_approved: Optional[bool] = None


class ReviewOpinionCreate(ReviewOpinionBase):
    pass


class ReviewOpinion(ReviewOpinionBase):
    id: int
    reviewer_id: int
    reviewer: Optional[User] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class CapacityRuleBase(BaseModel):
    rule_name: str
    rule_type: str
    apply_day_of_week: Optional[List[int]] = None
    apply_date_start: Optional[date] = None
    apply_date_end: Optional[date] = None
    time_slot_id: Optional[int] = None
    max_cleanings: int
    max_cleanings_per_staff: Optional[int] = None
    min_gap_minutes: Optional[int] = None
    priority: int = 0
    is_active: bool = True
    description: Optional[str] = None


class CapacityRuleCreate(CapacityRuleBase):
    pass


class CapacityRule(CapacityRuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class AttendanceTrendPoint(BaseModel):
    date: date
    total_schedules: int
    arrived: int
    on_time: int
    late: int
    no_show: int
    attendance_rate: float
    on_time_rate: float


class DailyStats(BaseModel):
    date: date
    total: int = 0
    pending: int = 0
    confirmed: int = 0
    in_progress: int = 0
    completed: int = 0
    cancelled: int = 0
    no_show: int = 0


class StaffPerformance(BaseModel):
    staff_id: int
    staff_name: str
    total_schedules: int = 0
    completed: int = 0
    attendance_rate: float = 0.0
    on_time_rate: float = 0.0
    avg_quality_score: Optional[float] = None


class DashboardStats(BaseModel):
    today_schedules: int = 0
    today_completed: int = 0
    today_in_progress: int = 0
    today_pending: int = 0
    conflicts_count: int = 0
    week_attendance_rate: float = 0.0
    month_attendance_rate: float = 0.0
    attendance_trend: List[AttendanceTrendPoint] = []
    staff_performance: List[StaffPerformance] = []


class TodoItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    priority: int = 0
    due_time: Optional[datetime] = None
    schedule_id: Optional[int] = None
    created_at: datetime
