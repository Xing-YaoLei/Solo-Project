from typing import List

from fastapi import APIRouter, Query

from ..models.schemas import ApiResponse, TicketRankItem
from ..services import ticket_service

router = APIRouter(prefix="/api/ticket", tags=["票种排行"])


@router.get("/rank", response_model=ApiResponse[List[TicketRankItem]])
async def get_rank(
    metric: str = Query(default="absolute", description="排序指标: absolute绝对值/ratio占比"),
    top: int = Query(default=10, ge=1, le=100, description="返回前N名"),
) -> ApiResponse[List[TicketRankItem]]:
    data = ticket_service.get_ticket_rank(metric=metric, top=top)
    return ApiResponse(data=data)
