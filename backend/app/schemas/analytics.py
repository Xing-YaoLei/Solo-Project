from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class UtilityReadingDistribution(BaseModel):
    month: str
    district: str
    avg_water: float
    avg_electricity: float
    avg_gas: float
    count: int


class InspectionFunnel(BaseModel):
    stage: str
    count: int
    conversion_rate: Optional[float] = None


class PaymentRanking(BaseModel):
    period: str
    dimension: str
    key: str
    total_amount: int
    transaction_count: int


class ComplaintTagTrend(BaseModel):
    month: str
    tag: str
    count: int


class RepairDurationStats(BaseModel):
    worker_id: Optional[int] = None
    worker_name: Optional[str] = None
    repair_type: Optional[str] = None
    avg_duration: float
    median_duration: float
    total_orders: int
    caliber_version: str
