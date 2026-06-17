from fastapi import APIRouter, Query
from app.services.threshold_service import ThresholdService
from app.schemas import ThresholdUpdateRequest

router = APIRouter(prefix="/thresholds", tags=["预警阈值"])


@router.get("")
async def get_thresholds():
    data = ThresholdService.get_all()
    return {"code": 0, "message": "success", "data": data}


@router.put("/{threshold_id}")
async def update_threshold(threshold_id: str, request: ThresholdUpdateRequest):
    data = ThresholdService.update_threshold(
        threshold_id, 
        request.warningThreshold, 
        request.criticalThreshold
    )
    if data is None:
        return {"code": 404, "message": "阈值配置不存在", "data": None}
    return {"code": 0, "message": "success", "data": data}


@router.get("/change-logs")
async def get_change_logs(
    threshold_id: str = None,
    limit: int = Query(20, ge=1, le=100)
):
    data = ThresholdService.get_change_logs(threshold_id, limit)
    return {"code": 0, "message": "success", "data": data}
