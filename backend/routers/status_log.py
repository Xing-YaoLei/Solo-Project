from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import StatusLogResponse, ApiResponse
from services import StatusLogService

router = APIRouter(prefix="/status-logs", tags=["状态日志"])


@router.get("", response_model=ApiResponse[list[StatusLogResponse]])
def list_status_logs(
    related_type: str = Query(..., description="关联类型: group_batch/arrival_list/pickup_code/after_sale/exception_order"),
    related_id: int = Query(..., description="关联ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    logs = StatusLogService.get_logs_by_related(
        db=db,
        related_type=related_type,
        related_id=related_id,
        skip=skip,
        limit=limit,
    )
    return ApiResponse.success(logs)


@router.get("/by-type/{related_type}", response_model=ApiResponse[list[StatusLogResponse]])
def list_status_logs_by_type(
    related_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    logs = StatusLogService.get_logs_by_type(
        db=db,
        related_type=related_type,
        skip=skip,
        limit=limit,
    )
    return ApiResponse.success(logs)
