from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import StockTask
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
        query = query.filter(StockTask.status == status)
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
                "status": t.status,
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
    open_count = db.query(StockTask).filter(StockTask.status == "open").count()
    in_progress_count = db.query(StockTask).filter(StockTask.status == "in_progress").count()
    resolved_count = db.query(StockTask).filter(StockTask.status == "resolved").count()
    total = db.query(StockTask).count()

    urgent = db.query(StockTask).filter(StockTask.priority == "urgent").count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "resolved": resolved_count,
        "urgent": urgent,
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
