from typing import List, Optional

from fastapi import APIRouter, Query, Path, HTTPException

from ..models.schemas import ApiResponse, PipelineStatus, PageResponse, SyncLog
from ..services import pipeline_service

router = APIRouter(prefix="/api/pipeline", tags=["同步链路监控"])


@router.get("/status", response_model=ApiResponse[List[PipelineStatus]])
async def get_status() -> ApiResponse[List[PipelineStatus]]:
    data = pipeline_service.get_pipeline_status()
    return ApiResponse(data=data)


@router.get("/logs", response_model=ApiResponse[PageResponse[SyncLog]])
async def get_logs(
    task_code: Optional[str] = Query(default=None, description="任务编码"),
    level: Optional[str] = Query(default=None, description="日志级别: INFO/WARN/ERROR"),
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=200, description="每页数量"),
) -> ApiResponse[PageResponse[SyncLog]]:
    data = pipeline_service.get_sync_logs(
        task_code=task_code, level=level, page=page, page_size=page_size
    )
    return ApiResponse(data=data)


@router.post("/sync/{task}", response_model=ApiResponse[List[SyncLog]])
async def trigger_sync(
    task: str = Path(..., description="任务编码: REG_SYNC/PAY_SYNC/GATE_SYNC")
) -> ApiResponse[List[SyncLog]]:
    valid_tasks = ["REG_SYNC", "PAY_SYNC", "GATE_SYNC"]
    if task not in valid_tasks:
        raise HTTPException(status_code=400, detail=f"Invalid task_code, must be one of {valid_tasks}")
    try:
        data = pipeline_service.run_pipeline(task_code=task)
        return ApiResponse(data=data, message=f"任务 {task} 同步完成")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"同步任务执行失败: {str(e)}")
