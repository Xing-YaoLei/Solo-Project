from fastapi import APIRouter, Query

from api.services.report_engine import (
    compute_kpi,
    compute_trend_analysis,
    compute_yoy_mom,
)
from api.schemas.common import ApiResponse, KPIData, TrendDataPoint

router = APIRouter()


@router.get("/kpi", response_model=ApiResponse[list[KPIData]])
async def get_kpi():
    kpis = compute_kpi()
    return ApiResponse(data=kpis)


@router.get("/trend", response_model=ApiResponse[list[TrendDataPoint]])
async def get_trend(
    startDate: str = Query(default="2024-06-01"),
    endDate: str = Query(default="2024-06-30"),
    category: str = Query(default=None),
):
    points = compute_trend_analysis(startDate, endDate, category)
    return ApiResponse(data=points)


@router.get("/yoy-mom", response_model=ApiResponse[dict])
async def get_yoy_mom(
    metrics: str = Query(default="total_sales"),
    compareType: str = Query(default="mom"),
):
    result = compute_yoy_mom(metrics, compareType)
    return ApiResponse(data=result)
