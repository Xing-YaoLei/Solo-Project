from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: dict = {}


class FunnelData(BaseModel):
    stage: str
    value: int
    rate: float


class CoreMetrics(BaseModel):
    bedOccupancy: int
    careComplianceRate: float
    riskEventCount: int
    activityParticipationRate: float
    bedOccupancyChange: float
    careComplianceChange: float
    riskEventChange: float
    activityChange: float


class ActivityTrendItem(BaseModel):
    date: str
    participationRate: float
    participantCount: int


class ActivityTimeDistribution(BaseModel):
    timeSlot: str
    count: int


class RiskEvent(BaseModel):
    id: str
    type: str
    level: str
    residentName: str
    bedNo: str
    occurTime: str
    description: str
    remark: Optional[str] = None
    remarkTime: Optional[str] = None
    remarkUser: Optional[str] = None


class RiskTypeDistribution(BaseModel):
    type: str
    count: int
    ratio: float


class RiskEventListResponse(BaseModel):
    list: List[RiskEvent]
    total: int


class ResidentProfile(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    careLevel: str
    bedNo: str
    admissionDate: str
    primaryDisease: str


class BedUtilization(BaseModel):
    area: str
    totalBeds: int
    occupiedBeds: int
    utilizationRate: float


class ResidentListResponse(BaseModel):
    list: List[ResidentProfile]
    total: int


class ThresholdConfig(BaseModel):
    id: str
    metricKey: str
    metricName: str
    warningThreshold: float
    criticalThreshold: float
    unit: str
    updatedAt: str
    updatedBy: str


class ThresholdUpdateRequest(BaseModel):
    warningThreshold: float
    criticalThreshold: float


class ReviewTimelineItem(BaseModel):
    time: str
    type: str
    description: str


class CareComplianceData(BaseModel):
    beforeEvent: dict
    afterEvent: dict
    periodDays: int


class ReviewRemark(BaseModel):
    id: str
    content: str
    user: str
    time: str
    type: str


class FallReview(BaseModel):
    eventId: str
    eventInfo: RiskEvent
    timeline: List[ReviewTimelineItem]
    careCompliance: CareComplianceData
    remarks: List[ReviewRemark]


class RiskRemarkRequest(BaseModel):
    remark: str
