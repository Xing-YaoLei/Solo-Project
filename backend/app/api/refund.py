from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Query, Path, HTTPException, Body
from pydantic import BaseModel

from ..models.schemas import ApiResponse, RefundDistributionPoint, RefundSample
from ..services import refund_service

router = APIRouter(prefix="/api/refund", tags=["退票争议中心"])


class MarkProcessedRequest(BaseModel):
    note: Optional[str] = None


@router.get("/distribution", response_model=ApiResponse[List[RefundDistributionPoint]])
async def get_distribution(
    start_date: Optional[date] = Query(default=None, description="开始日期"),
    end_date: Optional[date] = Query(default=None, description="结束日期"),
) -> ApiResponse[List[RefundDistributionPoint]]:
    data = refund_service.get_refund_distribution(
        start_date=start_date, end_date=end_date
    )
    return ApiResponse(data=data)


@router.get("/{id}/sample", response_model=ApiResponse[RefundSample])
async def get_sample(
    id: str = Path(..., description="退票ID")
) -> ApiResponse[RefundSample]:
    data = refund_service.get_refund_sample(refund_id=id)
    if not data:
        raise HTTPException(status_code=404, detail="退票样本详情不存在")
    return ApiResponse(data=data)


@router.post("/{id}/mark-processed", response_model=ApiResponse[RefundSample])
async def mark_processed(
    id: str = Path(..., description="退票ID"),
    body: MarkProcessedRequest = Body(default_factory=MarkProcessedRequest),
) -> ApiResponse[RefundSample]:
    data = refund_service.mark_refund_processed(refund_id=id, note=body.note)
    if not data:
        raise HTTPException(status_code=404, detail="退票记录不存在")
    return ApiResponse(data=data)
