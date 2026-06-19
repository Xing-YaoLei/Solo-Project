from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional, List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import StockTask, StockTaskStatus
from .. import schemas

router = APIRouter()


@router.get("/")
def list_stock_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(StockTask)

    if status:
        query = query.filter(StockTask.status == StockTaskStatus(status))
    if priority:
        query = query.filter(StockTask.priority == priority)
    if assigned_to:
        query = query.filter(StockTask.assigned_to.contains(assigned_to))

    total = query.count()
    tasks = query.order_by(StockTask.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": t.id,
                "task_no": t.task_no,
                "repair_order_id": t.repair_order_id,
                "order_no": t.order_no,
                "part_code": t.part_code,
                "part_name": t.part_name,
                "required_qty": t.required_qty,
                "status": t.status.value if hasattr(t.status, 'value') else t.status,
                "priority": t.priority,
                "notes": t.notes,
                "resolution": t.resolution,
                "assigned_to": t.assigned_to,
                "resolved_by": t.resolved_by,
                "resolved_at": t.resolved_at,
                "created_by": t.created_by,
                "created_at": t.created_at,
            }
            for t in tasks
        ],
    }


@router.get("/summary")
def get_stock_tasks_summary(db: Session = Depends(get_db)):
    result = db.query(
        func.count(StockTask.id).label("total"),
        func.sum(case((StockTask.status == StockTaskStatus.OPEN, 1), else_=0)).label("open"),
        func.sum(case((StockTask.status == StockTaskStatus.IN_PROGRESS, 1), else_=0)).label("in_progress"),
        func.sum(case((StockTask.status == StockTaskStatus.RESOLVED, 1), else_=0)).label("resolved"),
        func.sum(case((StockTask.status == StockTaskStatus.CLOSED, 1), else_=0)).label("closed"),
        func.sum(case((StockTask.priority == "urgent", 1), else_=0)).label("urgent"),
        func.sum(case((StockTask.priority == "high", 1), else_=0)).label("high_priority"),
    ).first()

    total = result.total or 0
    open_count = result.open or 0
    in_progress_count = result.in_progress or 0
    resolved_count = result.resolved or 0
    closed_count = result.closed or 0
    urgent = result.urgent or 0
    high_priority = result.high_priority or 0

    avg_resolution_days = 0
    resolved_tasks = db.query(StockTask).filter(
        StockTask.status.in_([StockTaskStatus.RESOLVED, StockTaskStatus.CLOSED]),
        StockTask.resolved_at.isnot(None),
    ).limit(20).all()
    if resolved_tasks:
        total_days = 0
        for t in resolved_tasks:
            if t.resolved_at and t.created_at:
                delta = t.resolved_at - t.created_at
                total_days += delta.total_seconds() / 86400
        avg_resolution_days = round(total_days / len(resolved_tasks), 1)

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "resolved": resolved_count,
        "closed": closed_count,
        "urgent": urgent,
        "high_priority": high_priority,
        "pending_count": open_count + in_progress_count,
        "resolution_rate": round((resolved_count + closed_count) / total * 100, 1) if total > 0 else 0,
        "avg_resolution_days": avg_resolution_days,
    }


@router.get("/{task_id}", response_model=schemas.StockTask)
def get_stock_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(StockTask).filter(StockTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="缺货任务不存在")
    return task


@router.post("/", response_model=schemas.StockTask)
def create_stock_task(task: schemas.StockTaskCreate, db: Session = Depends(get_db)):
    db_task = StockTask(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}", response_model=schemas.StockTask)
def update_stock_task(
    task_id: int,
    task_update: schemas.StockTaskUpdate,
    db: Session = Depends(get_db),
):
    task = db.query(StockTask).filter(StockTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="缺货任务不存在")

    update_data = task_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] in ["resolved", "closed"]:
        if task.status not in ["resolved", "closed"]:
            task.resolved_at = datetime.now()
            if "resolution" in update_data:
                task.resolved_by = update_data.get("assigned_to", task.assigned_to) or "system"

    for key, value in update_data.items():
        if hasattr(task, key):
            setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task
