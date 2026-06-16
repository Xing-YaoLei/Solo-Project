from datetime import date, datetime, time
from pydantic import BaseModel
from typing import Optional


class VisitRecordBase(BaseModel):
    visit_date: date
    visit_time: time
    visit_duration: Optional[int] = None
    visit_type: str = "routine"
    visitor_name: Optional[str] = None
    visitor_relation: Optional[str] = None
    physical_condition: Optional[str] = None
    mental_condition: Optional[str] = None
    conversation_content: Optional[str] = None
    needs_follow_up: Optional[str] = None
    elder_mood: Optional[str] = None
    remark: Optional[str] = None
    status: str = "completed"


class VisitRecordCreate(VisitRecordBase):
    elder_id: int


class VisitRecordUpdate(BaseModel):
    visit_date: Optional[date] = None
    visit_time: Optional[time] = None
    visit_duration: Optional[int] = None
    visit_type: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_relation: Optional[str] = None
    physical_condition: Optional[str] = None
    mental_condition: Optional[str] = None
    conversation_content: Optional[str] = None
    needs_follow_up: Optional[str] = None
    elder_mood: Optional[str] = None
    remark: Optional[str] = None
    status: Optional[str] = None


class VisitRecordResponse(VisitRecordBase):
    id: int
    elder_id: int
    visitor_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
