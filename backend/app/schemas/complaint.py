from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Tuple
from datetime import datetime


class ComplaintBase(BaseModel):
    order_id: Optional[str] = None
    platform_order_no: Optional[str] = None
    property_id: str
    property_name: Optional[str] = None
    region: str
    category: str
    severity: Literal['low', 'medium', 'high', 'critical']
    status: Literal['pending', 'processing', 'escalated', 'resolved', 'closed']
    description: Optional[str] = None
    handler: Optional[str] = None
    target_time: int = 1440
    callback_result: Optional[Literal['satisfied', 'unsatisfied', 'pending']] = None
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
    action: Optional[str] = None
    note: Optional[str] = None


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


class ComplaintLog(BaseModel):
    id: str
    complaint_id: str
    action: str
    operator: str
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


class CallbackRecord(BaseModel):
    id: str
    complaint_id: str
    result: Literal['satisfied', 'unsatisfied', 'pending']
    note: Optional[str] = None
    operator: str
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintDetail(Complaint):
    logs: List[ComplaintLog] = []
    callbacks: List[CallbackRecord] = []


class ComplaintListResponse(BaseModel):
    data: List[Complaint]
    total: int
    page: int
    pageSize: int


class KPIData(BaseModel):
    totalComplaints: int
    totalComplaintsYoY: float
    newToday: int
    overdueCount: int
    overdueCountYoY: float
    escalatedCount: int
    escalatedCountYoY: float
    resolvedCount: int
    avgProcessingTime: float
    avgProcessingTimeYoY: float
    satisfactionRate: float
    satisfactionRateYoY: float


class TrendData(BaseModel):
    dates: List[str]
    counts: List[int]
    prevCounts: List[int]
    overdueCounts: List[int]
    escalatedCounts: List[int]


class HeatmapData(BaseModel):
    hours: List[str]
    days: List[str]
    heatmapData: List[Tuple[int, int, int]]


class OverdueWarning(BaseModel):
    id: str
    property_name: str
    category: str
    severity: Literal['low', 'medium', 'high', 'critical']
    status: str
    created_at: datetime
    processing_time: int
    target_time: int


class CallbackStats(BaseModel):
    result: str
    count: int
    percentage: float


class EscalationTimelineData(BaseModel):
    dates: List[str]
    level1: List[int]
    level2: List[int]
    level3: List[int]
    totals: List[int]


class PieDataItem(BaseModel):
    name: str
    value: int
