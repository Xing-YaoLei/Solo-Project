from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Query

from ..models.schemas import (
    ApiResponse,
    VerificationEfficiency,
    VerificationDatePoint,
    VerificationAreaItem,
    VerificationDefinition,
)
from ..services import verification_service

router = APIRouter(prefix="/api/verification", tags=["核销报表"])


@router.get("/efficiency", response_model=ApiResponse[List[VerificationEfficiency]])
async def get_efficiency(
    group: str = Query(default="gate", description="聚合分组: gate通道/area区域/time时段")
) -> ApiResponse[List[VerificationEfficiency]]:
    data = verification_service.get_verification_efficiency(group=group)
    return ApiResponse(data=data)


@router.get("/date-trend", response_model=ApiResponse[List[VerificationDatePoint]])
async def get_date_trend(
    start_date: Optional[date] = Query(default=None, description="开始日期"),
    end_date: Optional[date] = Query(default=None, description="结束日期"),
) -> ApiResponse[List[VerificationDatePoint]]:
    data = verification_service.get_verification_date_trend(
        start_date=start_date, end_date=end_date
    )
    return ApiResponse(data=data)


@router.get("/area-compare", response_model=ApiResponse[List[VerificationAreaItem]])
async def get_area_compare() -> ApiResponse[List[VerificationAreaItem]]:
    data = verification_service.get_verification_area_compare()
    return ApiResponse(data=data)


@router.get("/definition", response_model=ApiResponse[VerificationDefinition])
async def get_definition() -> ApiResponse[VerificationDefinition]:
    data = verification_service.get_verification_definition()
    return ApiResponse(data=data)
