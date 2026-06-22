from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import pandas as pd
import os
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .auth import get_current_active_user
from ..services import order_service
from ..services.export_service import export_orders_to_excel
from ..config import settings
from ..models.models import Order

router = APIRouter(prefix="/api/analytics", tags=["统计分析"])

_export_results: Dict[str, Dict[str, Any]] = {}


def _sync_export_orders(filters: dict, user_id: int, task_id: str):
    db: Session = next(get_db())
    try:
        query = db.query(Order)

        if filters.get("status"):
            query = query.filter(Order.status == filters["status"])
        if filters.get("assignee_id"):
            query = query.filter(Order.assignee_id == filters["assignee_id"])
        if filters.get("start_date"):
            query = query.filter(Order.created_at >= filters["start_date"])
        if filters.get("end_date"):
            query = query.filter(Order.created_at <= filters["end_date"])

        orders = query.all()

        data = []
        for order in orders:
            assignee = order.assignee.full_name if order.assignee else ""
            creator = order.creator.full_name if order.creator else ""
            dispatch_rule = order.dispatch_rule.name if order.dispatch_rule else ""

            data.append({
                "工单号": order.order_no,
                "标题": order.title,
                "描述": order.description or "",
                "状态": order.status,
                "优先级": order.priority,
                "审计类型": order.audit_type or "",
                "审计项": order.audit_item or "",
                "位置": order.location or "",
                "派工规则": dispatch_rule,
                "处理人": assignee,
                "创建人": creator,
                "截止时间": order.deadline.strftime("%Y-%m-%d %H:%M:%S") if order.deadline else "",
                "首次解决": "是" if order.first_resolved else "否",
                "处理次数": order.processing_count,
                "创建时间": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            })

        df = pd.DataFrame(data)

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"orders_export_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        df.to_excel(filepath, index=False, engine="openpyxl")

        download_url = f"/uploads/{filename}"

        result = {
            "status": "completed",
            "filepath": filepath,
            "filename": filename,
            "url": download_url,
            "count": len(orders),
        }

        _export_results[task_id] = result
        return result
    finally:
        db.close()


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
    import uuid
    task_id = str(uuid.uuid4())
    
    _export_results[task_id] = {"status": "pending"}
    
    import threading
    thread = threading.Thread(target=_sync_export_orders, args=(filters, current_user.id, task_id))
    thread.start()
    
    return {"task_id": task_id, "status": "pending"}


@router.get("/export/{task_id}")
def get_export_status(
    task_id: str,
    current_user: models.User = Depends(get_current_active_user),
):
    if task_id in _export_results:
        result = _export_results[task_id]
        if result.get("status") == "completed":
            return {"state": "SUCCESS", "result": result}
        else:
            return {"state": "PENDING", "status": "pending"}
    
    try:
        from ..celery_app import celery
        task = celery.AsyncResult(task_id)
        if task.state == "PENDING":
            return {"state": task.state, "status": "pending"}
        elif task.state == "SUCCESS":
            return {"state": task.state, "result": task.result}
        else:
            return {"state": task.state, "status": "failed", "error": str(task.info)}
    except Exception:
        return {"state": "FAILURE", "status": "failed", "error": "任务不存在"}
