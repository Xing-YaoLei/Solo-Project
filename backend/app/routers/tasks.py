# -*- coding: utf-8 -*-
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.schemas.faults import TaskFilterRequest, RectificationTask, RecheckResult
from app.services.duckdb_service import get_analytics
from app.services.mock_data import generate_mock_data

router = APIRouter()

_mock_data = None


def _get_mock_data():
    global _mock_data
    if _mock_data is None:
        _mock_data = generate_mock_data()
    return _mock_data


class RecheckCreateRequest(BaseModel):
    recheck_time: datetime
    result: str
    description: Optional[str] = None
    rechecker: Optional[str] = None
    score: Optional[float] = None
    items: Optional[List[Any]] = None
    issues_found: Optional[List[Any]] = None
    pass_threshold: Optional[float] = 80.0
    conclusion: Optional[str] = None
    next_action: Optional[str] = None
    next_recheck_time: Optional[datetime] = None


class PaginatedResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int


def _task_with_rechecks(task: Dict[str, Any], rechecks: List[Dict[str, Any]]) -> Dict[str, Any]:
    task_rechecks = [r for r in rechecks if r["task_id"] == task["id"]]
    result = dict(task)
    result["rechecks"] = task_rechecks
    if task_rechecks:
        latest = sorted(task_rechecks, key=lambda x: x["recheck_time"], reverse=True)[0]
        result["latest_recheck"] = latest
        result["has_recheck"] = True
        result["recheck_result"] = latest["result"]
    else:
        result["latest_recheck"] = None
        result["has_recheck"] = False
        result["recheck_result"] = None
    return result


@router.post("/filter", response_model=Dict[str, Any])
async def filter_tasks(req: TaskFilterRequest):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    filtered = []
    for task in tasks:
        if req.store_id is not None and task["store_id"] != req.store_id:
            continue
        if req.equipment_id is not None and task["equipment_id"] != req.equipment_id:
            continue
        if req.status is not None and task["status"] != req.status:
            continue
        if req.priority is not None and task["priority"] != req.priority:
            continue
        if req.task_type is not None and task["task_type"] != req.task_type:
            continue

        task_rechecks = [r for r in rechecks if r["task_id"] == task["id"]]
        has_recheck = len(task_rechecks) > 0
        latest_result = None
        if task_rechecks:
            latest = sorted(task_rechecks, key=lambda x: x["recheck_time"], reverse=True)[0]
            latest_result = latest["result"]

        if req.has_recheck is not None and has_recheck != req.has_recheck:
            continue
        if req.recheck_result is not None and latest_result != req.recheck_result:
            continue

        deadline = task["deadline"]
        if req.deadline_from is not None and deadline < req.deadline_from:
            continue
        if req.deadline_to is not None and deadline > req.deadline_to:
            continue

        filtered.append(_task_with_rechecks(task, rechecks))

    return {
        "items": filtered,
        "total": len(filtered),
        "filters_applied": req.dict(exclude_none=True)
    }


@router.get("/", response_model=PaginatedResponse)
async def get_tasks(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    store_id: Optional[int] = Query(None, description="门店ID"),
    equipment_id: Optional[int] = Query(None, description="设备ID"),
    status: Optional[str] = Query(None, description="任务状态"),
    priority: Optional[str] = Query(None, description="优先级"),
    task_type: Optional[str] = Query(None, description="任务类型"),
):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    filtered = []
    for task in tasks:
        if store_id is not None and task["store_id"] != store_id:
            continue
        if equipment_id is not None and task["equipment_id"] != equipment_id:
            continue
        if status is not None and task["status"] != status:
            continue
        if priority is not None and task["priority"] != priority:
            continue
        if task_type is not None and task["task_type"] != task_type:
            continue
        filtered.append(task)

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = [_task_with_rechecks(t, rechecks) for t in filtered[start:end]]

    return PaginatedResponse(
        items=page_items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{task_id}", response_model=Dict[str, Any])
async def get_task_detail(task_id: int):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    task = next((t for t in tasks if t["id"] == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    return _task_with_rechecks(task, rechecks)


@router.get("/{task_id}/rechecks", response_model=List[Dict[str, Any]])
async def get_task_rechecks(task_id: int):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    task = next((t for t in tasks if t["id"] == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    task_rechecks = [r for r in rechecks if r["task_id"] == task_id]
    task_rechecks.sort(key=lambda x: x["recheck_time"], reverse=True)
    return task_rechecks


@router.post("/{task_id}/recheck", response_model=Dict[str, Any])
async def create_recheck(task_id: int, req: RecheckCreateRequest):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    task = next((t for t in tasks if t["id"] == task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")

    new_id = max([r["id"] for r in rechecks], default=0) + 1
    new_recheck = {
        "id": new_id,
        "recheck_code": f"RC{new_id:07d}",
        "task_id": task_id,
        "recheck_time": req.recheck_time,
        "rechecker": req.rechecker or "系统管理员",
        "result": req.result,
        "score": req.score if req.score is not None else (90.0 if req.result == "pass" else 65.0),
        "items": req.items or [
            {"name": "外观清洁", "score": 92.0, "result": "pass"},
            {"name": "内部清洁", "score": 88.0, "result": req.result},
            {"name": "功能测试", "score": 95.0, "result": "pass"},
        ],
        "issues_found": req.issues_found or [],
        "description": req.description or f"复查结果：{'合格' if req.result == 'pass' else '不合格'}",
        "pass_threshold": req.pass_threshold,
        "conclusion": req.conclusion or ("整改到位" if req.result == "pass" else "需再次整改"),
        "next_action": req.next_action,
        "next_recheck_time": req.next_recheck_time,
        "created_at": datetime.utcnow(),
    }
    rechecks.append(new_recheck)
    return new_recheck


@router.get("/stats/workflow", response_model=Dict[str, Any])
async def get_workflow_stats():
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]

    total = len(tasks)
    pending = sum(1 for t in tasks if t["status"] == "pending")
    in_progress = sum(1 for t in tasks if t["status"] == "in_progress")
    completed = sum(1 for t in tasks if t["status"] == "completed")
    failed = sum(1 for t in tasks if t["status"] == "failed")
    closed = sum(1 for t in tasks if t["status"] == "closed")

    recheck_pass = sum(1 for r in rechecks if r["result"] == "pass")
    recheck_total = len(rechecks)
    recheck_pass_rate = round(recheck_pass / recheck_total * 100, 2) if recheck_total > 0 else 0.0

    total_with_recheck = len(set(r["task_id"] for r in rechecks))
    recheck_coverage = round(total_with_recheck / total * 100, 2) if total > 0 else 0.0

    avg_progress = round(sum(t.get("progress", 0) for t in tasks) / total, 1) if total > 0 else 0

    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "failed": failed,
        "closed": closed,
        "recheck_total": recheck_total,
        "recheck_pass": recheck_pass,
        "recheck_fail": recheck_total - recheck_pass,
        "recheck_pass_rate": recheck_pass_rate,
        "recheck_coverage": recheck_coverage,
        "avg_progress": avg_progress,
        "by_status": {
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "failed": failed,
            "closed": closed,
        },
        "status_labels": {
            "pending": "待处理",
            "in_progress": "处理中",
            "completed": "已完成",
            "failed": "整改失败",
            "closed": "已关闭",
        }
    }


@router.get("/stats/by-priority", response_model=Dict[str, Any])
async def get_priority_stats():
    data = _get_mock_data()
    tasks = data["rectification_tasks"]

    by_priority = {}
    priority_labels = {"low": "低", "medium": "中", "high": "高"}
    status_labels = {
        "pending": "待处理",
        "in_progress": "处理中",
        "completed": "已完成",
        "failed": "整改失败",
        "closed": "已关闭",
    }

    for task in tasks:
        p = task["priority"]
        s = task["status"]
        if p not in by_priority:
            by_priority[p] = {
                "label": priority_labels.get(p, p),
                "total": 0,
                "by_status": {k: 0 for k in status_labels.keys()},
            }
        by_priority[p]["total"] += 1
        if s in by_priority[p]["by_status"]:
            by_priority[p]["by_status"][s] += 1

    total = len(tasks)
    distribution = {}
    for p, info in by_priority.items():
        distribution[p] = {
            "label": info["label"],
            "count": info["total"],
            "percentage": round(info["total"] / total * 100, 2) if total > 0 else 0,
            "by_status": info["by_status"],
        }

    return {
        "total": total,
        "distribution": distribution,
        "priority_labels": priority_labels,
        "status_labels": status_labels,
    }


@router.get("/linked/{fault_id}", response_model=Dict[str, Any])
async def get_linked_by_fault(fault_id: int):
    data = _get_mock_data()
    tasks = data["rectification_tasks"]
    rechecks = data["recheck_results"]
    faults = data["fault_records"]

    fault = next((f for f in faults if f["id"] == fault_id), None)
    if fault is None:
        raise HTTPException(status_code=404, detail=f"故障记录 {fault_id} 不存在")

    linked_tasks = [t for t in tasks if t.get("fault_id") == fault_id]
    linked_task_ids = [t["id"] for t in linked_tasks]
    linked_rechecks = [r for r in rechecks if r["task_id"] in linked_task_ids]

    linked_tasks_with_rechecks = [_task_with_rechecks(t, rechecks) for t in linked_tasks]

    return {
        "fault": fault,
        "tasks": linked_tasks_with_rechecks,
        "rechecks": linked_rechecks,
        "task_count": len(linked_tasks),
        "recheck_count": len(linked_rechecks),
    }
