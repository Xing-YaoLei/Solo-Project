from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class FunnelStage(BaseModel):
    stage: str
    name: str
    value: int
    conversion_rate: float


class RenewalRateTrend(BaseModel):
    date: str
    renewed_count: int
    total_count: int
    renewal_rate: float


class RefundReasonItem(BaseModel):
    reason: str
    name: str
    count: int
    percentage: float
    total_amount: float
    total_sessions: int


class CoachRankingItem(BaseModel):
    coach_id: Optional[int]
    coach_name: Optional[str]
    total_members: int
    renewed_members: int
    renewal_rate: float
    renewal_amount: float


class ExpiringMember(BaseModel):
    member_id: int
    member_no: str
    name: str
    phone: Optional[str]
    level: Optional[str]
    coach_name: Optional[str]
    membership_no: str
    membership_name: str
    remaining_sessions: int
    end_date: str
    days_remaining: int


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int


class ExpiringMembersResponse(PaginatedResponse):
    items: List[ExpiringMember]


class VerificationRecord(BaseModel):
    record_id: int
    record_no: str
    member_id: int
    membership_id: int
    course_id: Optional[int]
    verification_type: str
    verification_type_name: str
    consume_sessions: int
    verify_time: Optional[str]
    verify_date: Optional[str]
    operator_name: Optional[str]
    device_location: Optional[str]


class VerificationRecordsResponse(PaginatedResponse):
    items: List[VerificationRecord]
