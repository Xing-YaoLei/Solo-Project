from datetime import date, datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReportType(StrEnum):
    CASE_SUMMARY = "case_summary"
    REVENUE_ANALYSIS = "revenue_analysis"
    COLLECTION_FORECAST = "collection_forecast"
    APPROVAL_STATUS = "approval_status"
    LAWYER_PERFORMANCE = "lawyer_performance"


class ReportFormat(StrEnum):
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
    PDF = "pdf"


class ReportRequest(BaseModel):
    report_type: ReportType
    start_date: date | None = None
    end_date: date | None = None
    case_id: UUID | None = None
    lawyer_id: UUID | None = None
    parameters: dict = Field(default_factory=dict)


class ReportData(BaseModel):
    report_type: ReportType
    generated_at: datetime
    period_start: date | None = None
    period_end: date | None = None
    summary: dict
    details: list[dict]


class ReportResponse(BaseModel):
    report_id: UUID
    report_type: ReportType
    status: str
    generated_at: datetime
    download_url: str | None = None
    expires_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class RevenueByPeriod(BaseModel):
    period: str
    quoted_amount: float
    actual_amount: float
    invoiced_amount: float
    collected_amount: float


class CaseStatusSummary(BaseModel):
    status: str
    count: int
    total_amount: float


class LawyerPerformance(BaseModel):
    lawyer_id: UUID
    lawyer_name: str
    case_count: int
    total_revenue: float
    collection_rate: float
    avg_approval_days: float


class CollectionForecast(BaseModel):
    due_date: date
    expected_amount: float
    overdue_amount: float
    case_id: UUID
    case_name: str
