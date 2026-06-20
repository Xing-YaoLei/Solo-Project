from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SummaryQueryParams(BaseModel):
    source: str | None = None
    assignee: str | None = None
    conclusion: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


class EfficiencyStats(BaseModel):
    total: int
    verified: int
    avg_time_hours: float
    efficiency_rate: float


class SourceGroupStats(BaseModel):
    source: str
    count: int
    closed_count: int
    disputed_count: int


class AssigneeGroupStats(BaseModel):
    assignee: str
    count: int
    closed_count: int
    avg_time_hours: float


class ConclusionGroupStats(BaseModel):
    conclusion: str
    count: int


class VerificationSummaryResponse(BaseModel):
    efficiency: EfficiencyStats
    by_source: list[SourceGroupStats]
    by_assignee: list[AssigneeGroupStats]
    by_conclusion: list[ConclusionGroupStats]
