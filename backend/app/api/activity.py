from fastapi import APIRouter, Query
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["活动签到"])


@router.get("/trend")
async def get_trend(days: int = Query(30, ge=1, le=365)):
    data = ActivityService.get_trend(days)
    return {"code": 0, "message": "success", "data": data}


@router.get("/time-distribution")
async def get_time_distribution():
    data = ActivityService.get_time_distribution()
    return {"code": 0, "message": "success", "data": data}


@router.get("/bed-area-comparison")
async def get_bed_area_comparison():
    data = ActivityService.get_bed_area_comparison()
    return {"code": 0, "message": "success", "data": data}
