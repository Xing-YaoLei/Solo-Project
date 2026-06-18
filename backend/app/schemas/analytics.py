from typing import List
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total_batches: int
    in_stock_quantity: float
    pending_shortages: int
    avg_turnover_days: float


class TrendPoint(BaseModel):
    date: str
    value: float


class TurnoverAnalysisRow(BaseModel):
    dimension: str
    name: str
    avg_days: float
    batches_count: int
    shortage_count: int


class RegionDistribution(BaseModel):
    name: str
    value: int
