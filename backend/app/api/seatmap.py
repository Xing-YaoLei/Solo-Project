from typing import List, Optional

from fastapi import APIRouter, Query

from ..models.schemas import ApiResponse, SeatHeatmapItem, CheckinTrendPoint
from ..services import seatmap_service

router = APIRouter(prefix="/api/seatmap", tags=["座位图分析"])


@router.get("/heatmap", response_model=ApiResponse[List[SeatHeatmapItem]])
async def get_heatmap(
    period: str = Query(default="current", description="周期: current/previous"),
    compare: Optional[str] = Query(default=None, description="对比: yoy同比/mom环比/both双比"),
) -> ApiResponse[List[SeatHeatmapItem]]:
    data = seatmap_service.get_seat_heatmap(period=period, compare=compare)
    return ApiResponse(data=data)


@router.get("/checkin-trend", response_model=ApiResponse[List[CheckinTrendPoint]])
async def get_checkin_trend(
    period: int = Query(default=30, ge=1, le=365, description="查询天数")
) -> ApiResponse[List[CheckinTrendPoint]]:
    data = seatmap_service.get_checkin_trend(period=period)
    return ApiResponse(data=data)
