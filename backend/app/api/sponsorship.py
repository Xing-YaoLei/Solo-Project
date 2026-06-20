from typing import Optional

from fastapi import APIRouter, Query, Path, HTTPException

from ..models.schemas import ApiResponse, PageResponse, SponsorshipItem, SponsorshipDetail
from ..services import sponsorship_service

router = APIRouter(prefix="/api/sponsorship", tags=["赞助权益监测"])


@router.get("/list", response_model=ApiResponse[PageResponse[SponsorshipItem]])
async def get_list(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=200, description="每页数量"),
    status: Optional[str] = Query(default=None, description="状态: 未开始/进行中/已完成"),
) -> ApiResponse[PageResponse[SponsorshipItem]]:
    data = sponsorship_service.get_sponsorship_list(
        page=page, page_size=page_size, status=status
    )
    return ApiResponse(data=data)


@router.get("/{id}/detail", response_model=ApiResponse[SponsorshipDetail])
async def get_detail(
    id: str = Path(..., description="权益ID")
) -> ApiResponse[SponsorshipDetail]:
    data = sponsorship_service.get_sponsorship_detail(benefit_id=id)
    if not data:
        raise HTTPException(status_code=404, detail="赞助权益详情不存在")
    return ApiResponse(data=data)
