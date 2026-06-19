from pydantic import BaseModel
from typing import List, Optional


class ReportSeries(BaseModel):
    name: str
    data: List[float]


class ReportData(BaseModel):
    dimension: str
    categories: List[str]
    series: List[ReportSeries]


class DurationReportRaw(BaseModel):
    region: str
    total: int
    less_than_1h: int
    between_1_3h: int
    between_3_12h: int
    between_12_24h: int
    more_than_24h: int
    avg_time: float


class DurationReport(BaseModel):
    regions: List[str]
    lessThan1h: List[int]
    between1_3h: List[int]
    between3_12h: List[int]
    between12_24h: List[int]
    moreThan24h: List[int]
    avgTimes: List[float]
    rawData: List[DurationReportRaw]


class RegionReport(BaseModel):
    region: str
    total: int
    closed: int
    closedRate: float
    overdue: int
    overdueRate: float
    satisfactionRate: float
    avgProcessingTime: float


class DateReportRaw(BaseModel):
    month: str
    region: str
    total: int
    overdue: int
    escalated: int
    avg_time: float


class DateReport(BaseModel):
    months: List[str]
    series: List[ReportSeries]
    rawData: List[DateReportRaw]


class PeriodData(BaseModel):
    start: str
    end: str
    total: int
    closed: int
    closedRate: float
    overdue: int
    overdueRate: float
    escalated: int
    avgProcessingTime: float
    satisfactionRate: float


class ComparisonReport(BaseModel):
    period1: PeriodData
    period2: PeriodData


class PieDataItem(BaseModel):
    name: str
    value: int


class DuckDBRegionSummary(BaseModel):
    region: str
    total: int
    avg_time: float
    overdue_count: int
    escalated_count: int


class DuckDBResponsibilitySummary(BaseModel):
    responsibility_dept: str
    count: int
    percentage: float


class DuckDBAnalysis(BaseModel):
    regionSummary: List[DuckDBRegionSummary]
    responsibilitySummary: List[DuckDBResponsibilitySummary]
