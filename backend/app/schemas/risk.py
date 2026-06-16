from datetime import date, datetime, time
from pydantic import BaseModel
from typing import Optional


class RiskEventBase(BaseModel):
    event_type: str
    event_level: str = "general"
    event_date: date
    event_time: time
    location: Optional[str] = None
    description: str
    causes: Optional[str] = None
    injuries: Optional[str] = None
    immediate_measures: Optional[str] = None
    witnesses: Optional[str] = None
    status: str = "reported"
    handling_result: Optional[str] = None
    follow_up_plan: Optional[str] = None
    remark: Optional[str] = None


class RiskEventCreate(RiskEventBase):
    elder_id: int


class RiskEventUpdate(BaseModel):
    event_type: Optional[str] = None
    event_level: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    description: Optional[str] = None
    causes: Optional[str] = None
    injuries: Optional[str] = None
    immediate_measures: Optional[str] = None
    witnesses: Optional[str] = None
    status: Optional[str] = None
    handling_result: Optional[str] = None
    follow_up_plan: Optional[str] = None
    remark: Optional[str] = None


class RiskEventResponse(RiskEventBase):
    id: int
    elder_id: int
    reported_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
