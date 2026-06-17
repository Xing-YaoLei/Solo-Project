from fastapi import APIRouter
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["数据看板"])


@router.get("/funnel")
async def get_funnel():
    data = DashboardService.get_funnel_data()
    return {"code": 0, "message": "success", "data": data}


@router.get("/metrics")
async def get_metrics():
    data = DashboardService.get_core_metrics()
    return {"code": 0, "message": "success", "data": data}


@router.get("/recent-risks")
async def get_recent_risks(limit: int = 10):
    data = DashboardService.get_recent_risks(limit)
    return {"code": 0, "message": "success", "data": data}
