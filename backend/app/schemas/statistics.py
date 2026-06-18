from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReworkRateStats(BaseModel):
    period: str
    total_orders: int
    rework_orders: int
    rework_rate: float


class OrderStatusDistribution(BaseModel):
    status: str
    count: int


class TechnicianPerformance(BaseModel):
    technician_id: UUID
    technician_name: str
    completed_orders: int
    avg_completion_hours: float
    rework_count: int


class PartsUsageStats(BaseModel):
    part_id: UUID
    part_name: str
    part_no: str
    total_used: int
    total_amount: float


class StatisticsOverview(BaseModel):
    total_orders: int
    active_orders: int
    completed_this_month: int
    rework_rate: float
    avg_completion_hours: float
    pending_shortages: int


class ReworkTraceItem(BaseModel):
    original_order_id: UUID
    original_order_no: str
    rework_order_id: UUID
    rework_order_no: str
    reason: str
    created_at: datetime
