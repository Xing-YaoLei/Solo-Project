from fastapi import APIRouter, Query
from app.services.risk_service import RiskService
from app.schemas import RiskRemarkRequest

router = APIRouter(prefix="/risk", tags=["风险事件"])


@router.get("/events")
async def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    event_type: str = None,
    level: str = None
):
    data = RiskService.get_events(page, page_size, event_type, level)
    return {"code": 0, "message": "success", "data": data}


@router.get("/type-distribution")
async def get_type_distribution(days: int = Query(30, ge=1, le=365)):
    data = RiskService.get_type_distribution(days)
    return {"code": 0, "message": "success", "data": data}


@router.get("/daily-trend")
async def get_daily_trend(days: int = Query(30, ge=1, le=365)):
    data = RiskService.get_daily_trend(days)
    return {"code": 0, "message": "success", "data": data}


@router.put("/events/{event_id}/remark")
async def add_remark(event_id: str, request: RiskRemarkRequest):
    data = RiskService.add_remark(event_id, request.remark)
    if data is None:
        return {"code": 404, "message": "事件不存在", "data": None}
    return {"code": 0, "message": "success", "data": data}
