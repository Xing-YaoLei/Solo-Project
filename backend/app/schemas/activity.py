from datetime import date, datetime, time
from pydantic import BaseModel
from typing import Optional, List


class ActivityBase(BaseModel):
    name: str
    activity_type: str
    description: Optional[str] = None
    location: Optional[str] = None
    activity_date: date
    start_time: time
    end_time: time
    max_participants: Optional[int] = None
    instructor: Optional[str] = None
    equipment_needed: Optional[str] = None
    risk_level: str = "low"
    status: str = "scheduled"


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    activity_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    activity_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_participants: Optional[int] = None
    instructor: Optional[str] = None
    equipment_needed: Optional[str] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None


class ActivityResponse(ActivityBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivitySignInBase(BaseModel):
    participation_status: str = "signed_in"
    health_before: Optional[str] = None
    health_after: Optional[str] = None
    performance_rating: Optional[int] = None
    remark: Optional[str] = None


class ActivitySignInCreate(ActivitySignInBase):
    activity_id: int
    elder_id: int


class ActivitySignInUpdate(BaseModel):
    sign_out_time: Optional[datetime] = None
    participation_status: Optional[str] = None
    health_before: Optional[str] = None
    health_after: Optional[str] = None
    performance_rating: Optional[int] = None
    remark: Optional[str] = None


class ActivitySignInResponse(ActivitySignInBase):
    id: int
    activity_id: int
    elder_id: int
    sign_in_time: Optional[datetime] = None
    sign_out_time: Optional[datetime] = None
    sign_in_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
