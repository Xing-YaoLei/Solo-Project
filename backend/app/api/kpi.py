from typing import List

from fastapi import APIRouter, Query

from ..models.schemas import ApiResponse, KPIOverview, KPITrendPoint
from ..services import kpi_service

router = APIRouter(prefix="/api/kpi", tags=["KPI 总览"])


@router.get("/overview", response_model=ApiResponse[KPIOverview])
async def get_overview() -> ApiResponse[KPIOverview]:
    data = kpi_service.get_kpi_overview()
    return ApiResponse(data=data)


@router.get("/trend", response_model=ApiResponse[List[KPITrendPoint]])
async def get_trend(
    days: int = Query(default=30, ge=1, le=365, description="查询天数")
) -> ApiResponse[List[KPITrendPoint]]:
    data = kpi_service.get_kpi_trend(days=days)
    return ApiResponse(data=data)
