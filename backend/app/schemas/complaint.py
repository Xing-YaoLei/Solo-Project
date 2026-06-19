from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ComplaintBase(BaseModel):
    order_id: Optional[str] = None
    property_id: str
    property_name: Optional[str] = None
    region: str
    category: str
    severity: str
    status: str
    description: Optional[str] = None
    handler: Optional[str] = None
    target_time: int = 1440
    callback_result: Optional[str] = None
    callback_note: Optional[str] = None
    responsibility: Optional[str] = None
    responsibility_dept: Optional[str] = None


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    handler: Optional[str] = None
    description: Optional[str] = None
    escalated: Optional[bool] = None
    escalation_level: Optional[int] = None
    is_overdue: Optional[bool] = None
    callback_result: Optional[str] = None
    callback_note: Optional[str] = None
    responsibility: Optional[str] = None
    responsibility_dept: Optional[str] = None


class Complaint(ComplaintBase):
    id: str
    created_at: datetime
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    escalated: bool = False
    escalated_at: Optional[datetime] = None
    escalation_level: int = 0
    processing_time: int = 0
    is_overdue: bool = False

    class Config:
        from_attributes = True


class ComplaintListResponse(BaseModel):
    list: List[Complaint]
    total: int


class KPIData(BaseModel):
    totalComplaints: int
    pendingCount: int
    overdueCount: int
    avgProcessingTime: float
    escalationRate: float
    satisfactionRate: float
    period: str
    compareValue: dict


class TrendData(BaseModel):
    dates: List[str]
    current: List[int]
    compare: List[int]


class HeatmapData(BaseModel):
    regions: List[str]
    avgTime: List[float]
    overdueCount: List[int]


class EscalationSeriesData(BaseModel):
    dates: List[str]
    current: List[int]
    compare: List[int]
    levels: List[List[int]]
