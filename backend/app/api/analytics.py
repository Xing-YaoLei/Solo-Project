from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .auth import get_current_active_user
from ..services import order_service
from ..services.export_service import export_orders_to_excel

router = APIRouter(prefix="/api/analytics", tags=["统计分析"])


@router.get("/first-time-resolution", response_model=schemas.FirstTimeResolutionStats)
def get_first_time_resolution_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    return order_service.get_first_time_resolution_stats(db, start_dt, end_dt)


@router.post("/export")
def export_orders(
    filters: dict,
    current_user: models.User = Depends(get_current_active_user),
):
    task = export_orders_to_excel.delay(filters, current_user.id)
    return {"task_id": task.id, "status": "pending"}


@router.get("/export/{task_id}")
def get_export_status(
    task_id: str,
    current_user: models.User = Depends(get_current_active_user),
):
    from ..celery_app import celery
    task = celery.AsyncResult(task_id)
    if task.state == "PENDING":
        return {"state": task.state, "status": "pending"}
    elif task.state == "SUCCESS":
        return {"state": task.state, "result": task.result}
    else:
        return {"state": task.state, "status": "failed", "error": str(task.info)}
