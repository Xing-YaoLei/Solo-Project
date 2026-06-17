from fastapi import APIRouter, Query
from app.services.review_service import ReviewService

router = APIRouter(prefix="/review", tags=["复盘材料"])


@router.get("/fall/{event_id}")
async def get_fall_review(event_id: str):
    data = ReviewService.get_fall_review(event_id)
    if data is None:
        return {"code": 404, "message": "复盘材料不存在", "data": None}
    return {"code": 0, "message": "success", "data": data}


@router.get("/fall-events")
async def get_fall_events(limit: int = Query(20, ge=1, le=100)):
    data = ReviewService.get_fall_events(limit)
    return {"code": 0, "message": "success", "data": data}
