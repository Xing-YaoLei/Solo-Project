import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import User, UserRole
from app.schemas import (
    ExportRequest,
    ExportTaskResponse,
    SamplingCoverageResponse,
)
from app.services import ExportService
from app.api.routers.auth import get_current_user, require_roles
from app.tasks.export_tasks import (
    export_sampling_records_task,
    export_rectification_plans_task,
    export_exception_orders_task,
    export_generic_task,
)

router = APIRouter(prefix="/api/export", tags=["数据导出"])


@router.get("/sampling-coverage", response_model=SamplingCoverageResponse)
def get_sampling_coverage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ExportService.calculate_sampling_coverage(db)


@router.post("/sampling/sync")
def sync_export_sampling(
    request: Optional[Dict[str, Any]] = None,
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    checklist_id: Optional[int] = None,
    status: Optional[str] = None,
    evidence_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    req_filters = request.get("filters") if request else None
    if req_filters:
        for k, v in req_filters.items():
            if k in ["checklistId", "checklist_id"]:
                filters["checklist_id"] = v
            elif k in ["status"]:
                filters["status"] = v
            elif k in ["evidenceStatus", "evidence_status"]:
                filters["evidence_status"] = v
            elif k in ["startDate", "start_date"]:
                filters["start_date"] = v
            elif k in ["endDate", "end_date"]:
                filters["end_date"] = v
            elif k in ["riskLevel", "risk_level"]:
                filters["risk_level"] = v
            elif k in ["vendorId", "vendor_id"]:
                filters["vendor_id"] = v
            elif k in ["samplingId", "sampling_id"]:
                filters["sampling_id"] = v
            elif k in ["exceptionType", "exception_type"]:
                filters["exception_type"] = v

    if not filters:
        if checklist_id:
            filters["checklist_id"] = checklist_id
        if status:
            filters["status"] = status
        if evidence_status:
            filters["evidence_status"] = evidence_status
        if start_date:
            filters["start_date"] = start_date
        if end_date:
            filters["end_date"] = end_date

    actual_format = (request.get("format") if request else None) or export_format

    filepath, filename = ExportService.export_sampling_records(
        db=db,
        export_format=actual_format,
        filters=filters if filters else None
    )

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件生成失败")

    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if export_format == "excel"
        else "text/csv"
    )

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type
    )


@router.post("/rectification/sync")
def sync_export_rectification(
    request: Optional[Dict[str, Any]] = None,
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    sampling_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    req_filters = request.get("filters") if request else None
    if req_filters:
        for k, v in req_filters.items():
            if k in ["samplingId", "sampling_id"]:
                filters["sampling_id"] = v
            elif k in ["riskLevel", "risk_level"]:
                filters["risk_level"] = v
            elif k in ["status"]:
                filters["status"] = v
            elif k in ["vendorId", "vendor_id"]:
                filters["vendor_id"] = v
            elif k in ["startDate", "start_date"]:
                filters["start_date"] = v
            elif k in ["endDate", "end_date"]:
                filters["end_date"] = v

    if not filters:
        if sampling_id:
            filters["sampling_id"] = sampling_id
        if risk_level:
            filters["risk_level"] = risk_level
        if status:
            filters["status"] = status
        if vendor_id:
            filters["vendor_id"] = vendor_id

    actual_format = (request.get("format") if request else None) or export_format

    filepath, filename = ExportService.export_rectification_plans(
        db=db,
        export_format=actual_format,
        filters=filters if filters else None
    )

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件生成失败")

    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if export_format == "excel"
        else "text/csv"
    )

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type
    )


@router.post("/exception/sync")
def sync_export_exception(
    request: Optional[Dict[str, Any]] = None,
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    sampling_id: Optional[int] = None,
    exception_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    req_filters = request.get("filters") if request else None
    if req_filters:
        for k, v in req_filters.items():
            if k in ["samplingId", "sampling_id"]:
                filters["sampling_id"] = v
            elif k in ["exceptionType", "exception_type"]:
                filters["exception_type"] = v
            elif k in ["status"]:
                filters["status"] = v
            elif k in ["startDate", "start_date"]:
                filters["start_date"] = v
            elif k in ["endDate", "end_date"]:
                filters["end_date"] = v

    if not filters:
        if sampling_id:
            filters["sampling_id"] = sampling_id
        if exception_type:
            filters["exception_type"] = exception_type
        if status:
            filters["status"] = status

    actual_format = (request.get("format") if request else None) or export_format

    filepath, filename = ExportService.export_exception_orders(
        db=db,
        export_format=actual_format,
        filters=filters if filters else None
    )

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件生成失败")

    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if export_format == "excel"
        else "text/csv"
    )

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type
    )


@router.post("/async", response_model=ExportTaskResponse)
def async_export(
    request: ExportRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    valid_types = ["sampling", "rectification", "exception"]
    if request.entity_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"entity_type 必须是以下之一: {valid_types}"
        )

    task = export_generic_task.delay(
        entity_type=request.entity_type,
        export_format=request.format,
        filters=request.filters
    )

    return ExportTaskResponse(
        task_id=task.id,
        status="PENDING",
        entity_type=request.entity_type,
        format=request.format
    )


@router.post("/sampling/async", response_model=ExportTaskResponse)
def async_export_sampling(
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    checklist_id: Optional[int] = None,
    status: Optional[str] = None,
    evidence_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    if checklist_id:
        filters["checklist_id"] = checklist_id
    if status:
        filters["status"] = status
    if evidence_status:
        filters["evidence_status"] = evidence_status
    if start_date:
        filters["start_date"] = start_date
    if end_date:
        filters["end_date"] = end_date

    task = export_sampling_records_task.delay(
        export_format=export_format,
        filters=filters if filters else None
    )

    return ExportTaskResponse(
        task_id=task.id,
        status="PENDING",
        entity_type="sampling",
        format=export_format
    )


@router.post("/rectification/async", response_model=ExportTaskResponse)
def async_export_rectification(
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    sampling_id: Optional[int] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    if sampling_id:
        filters["sampling_id"] = sampling_id
    if risk_level:
        filters["risk_level"] = risk_level
    if status:
        filters["status"] = status
    if vendor_id:
        filters["vendor_id"] = vendor_id

    task = export_rectification_plans_task.delay(
        export_format=export_format,
        filters=filters if filters else None
    )

    return ExportTaskResponse(
        task_id=task.id,
        status="PENDING",
        entity_type="rectification",
        format=export_format
    )


@router.post("/exception/async", response_model=ExportTaskResponse)
def async_export_exception(
    export_format: str = Query("excel", pattern="^(excel|csv)$"),
    sampling_id: Optional[int] = None,
    exception_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    filters = {}
    if sampling_id:
        filters["sampling_id"] = sampling_id
    if exception_type:
        filters["exception_type"] = exception_type
    if status:
        filters["status"] = status

    task = export_exception_orders_task.delay(
        export_format=export_format,
        filters=filters if filters else None
    )

    return ExportTaskResponse(
        task_id=task.id,
        status="PENDING",
        entity_type="exception",
        format=export_format
    )


@router.get("/task/{task_id}")
def get_export_task_status(task_id: str):
    try:
        from app.core.celery_app import celery_app
        task_result = celery_app.AsyncResult(task_id)
        result = {
            "task_id": task_id,
            "status": task_result.status,
        }
        if task_result.state == "SUCCESS":
            result["result"] = task_result.result
        elif task_result.state == "FAILURE":
            result["error"] = str(task_result.info)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询任务状态失败: {str(e)}")


@router.get("/download/{filename}")
def download_exported_file(filename: str):
    filepath = os.path.join(settings.EXPORT_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件不存在")

    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if filename.endswith(".xlsx")
        else "text/csv"
    )

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type=media_type
    )
