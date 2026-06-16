from datetime import date, datetime, time
from pydantic import BaseModel
from typing import Optional


class IncidentOrderBase(BaseModel):
    incident_type: str
    severity: str = "serious"
    incident_date: date
    incident_time: time
    location: Optional[str] = None
    impact_scope: str
    responsibility: str
    responsible_person: Optional[str] = None
    handling_result: str
    preventive_measures: Optional[str] = None
    description: str
    immediate_actions: Optional[str] = None
    medical_treatment: Optional[str] = None
    family_notified: str = "unknown"
    family_response: Optional[str] = None
    handled_by: Optional[str] = None
    reviewed_by: Optional[str] = None
    status: str = "pending"
    closure_date: Optional[date] = None
    remark: Optional[str] = None


class IncidentOrderCreate(IncidentOrderBase):
    elder_id: int
    risk_event_id: Optional[int] = None


class IncidentOrderUpdate(BaseModel):
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    incident_date: Optional[date] = None
    incident_time: Optional[time] = None
    location: Optional[str] = None
    impact_scope: Optional[str] = None
    responsibility: Optional[str] = None
    responsible_person: Optional[str] = None
    handling_result: Optional[str] = None
    preventive_measures: Optional[str] = None
    description: Optional[str] = None
    immediate_actions: Optional[str] = None
    medical_treatment: Optional[str] = None
    family_notified: Optional[str] = None
    family_response: Optional[str] = None
    handled_by: Optional[str] = None
    reviewed_by: Optional[str] = None
    status: Optional[str] = None
    closure_date: Optional[date] = None
    remark: Optional[str] = None


class IncidentOrderResponse(IncidentOrderBase):
    id: int
    order_no: str
    elder_id: int
    risk_event_id: Optional[int] = None
    reported_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
