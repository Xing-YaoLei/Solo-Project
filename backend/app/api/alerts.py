from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from ..core.database import get_db
from ..services.alert_service import get_alert_service, AlertService

router = APIRouter(prefix="/api/alerts", tags=["预警阈值"])


class ThresholdCreate(BaseModel):
    name: str
    type: str
    threshold_value: float
    operator: str = "lt"
    level: str = "warning"
    scope: str = "all"
    course_id: Optional[int] = None
    region_id: Optional[int] = None
    created_by: str = "system"


class ThresholdUpdate(BaseModel):
    name: Optional[str] = None
    threshold_value: Optional[float] = None
    operator: Optional[str] = None
    level: Optional[str] = None
    is_active: Optional[bool] = None


class NoteTaskResolve(BaseModel):
    conclusion: str


@router.get("/thresholds")
def get_thresholds(
    type: Optional[str] = Query(None, description="阈值类型"),
    is_active: bool = Query(True, description="是否启用"),
    db: Session = Depends(get_db)
):
    """获取预警阈值列表"""
    service = get_alert_service(db)
    thresholds = service.get_thresholds(type, is_active)
    return [
        {
            "id": t.id,
            "name": t.name,
            "type": t.type,
            "threshold_value": t.threshold_value,
            "operator": t.operator,
            "level": t.level,
            "scope": t.scope,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in thresholds
    ]


@router.post("/thresholds")
def create_threshold(
    data: ThresholdCreate,
    db: Session = Depends(get_db)
):
    """创建预警阈值（业务人员可维护）"""
    service = get_alert_service(db)
    threshold = service.create_threshold(data.dict())
    return {
        "id": threshold.id,
        "name": threshold.name,
        "type": threshold.type,
        "threshold_value": threshold.threshold_value,
        "level": threshold.level
    }


@router.put("/thresholds/{threshold_id}")
def update_threshold(
    threshold_id: int,
    data: ThresholdUpdate,
    db: Session = Depends(get_db)
):
    """更新预警阈值"""
    service = get_alert_service(db)
    threshold = service.update_threshold(threshold_id, data.dict(exclude_unset=True))
    if not threshold:
        raise HTTPException(status_code=404, detail="阈值不存在")
    return {"message": "更新成功"}


@router.delete("/thresholds/{threshold_id}")
def delete_threshold(
    threshold_id: int,
    db: Session = Depends(get_db)
):
    """删除预警阈值"""
    service = get_alert_service(db)
    success = service.delete_threshold(threshold_id)
    if not success:
        raise HTTPException(status_code=404, detail="阈值不存在")
    return {"message": "删除成功"}


@router.get("/check")
def check_alerts(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """检测预警"""
    service = get_alert_service(db)
    return service.check_alerts(course_id, region_id)


@router.get("/note-tasks")
def get_note_tasks(
    status: Optional[str] = Query(None, description="任务状态"),
    student_id: Optional[int] = Query(None, description="学生ID"),
    db: Session = Depends(get_db)
):
    """获取备注任务列表"""
    service = get_alert_service(db)
    tasks = service.get_note_tasks(status, student_id)
    return [
        {
            "id": t.id,
            "task_no": t.task_no,
            "type": t.type,
            "title": t.title,
            "content": t.content,
            "conclusion": t.conclusion,
            "status": t.status,
            "priority": t.priority,
            "chart_ref": t.chart_ref,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None
        }
        for t in tasks
    ]


@router.post("/note-tasks/{task_id}/resolve")
def resolve_note_task(
    task_id: int,
    data: NoteTaskResolve,
    db: Session = Depends(get_db)
):
    """处理备注任务 - 添加结论（处理结论留在图表旁边）"""
    service = get_alert_service(db)
    task = service.resolve_note_task(task_id, data.conclusion)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return {"message": "处理成功", "conclusion": task.conclusion}
