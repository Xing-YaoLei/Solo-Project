from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
import asyncio
import uuid
import random
from datetime import datetime, timedelta

from app.api.v1.schemas.common import ApiResponse, PaginatedData
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/sync", tags=["数据同步"])


@router.get("/status", response_model=ApiResponse[dict])
async def get_sync_status(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    status = mock.get_sync_status()
    delay_info = mock.generate_sync_delay_info()
    return ApiResponse.ok(
        data={
            "sources": status,
            "delayInfo": delay_info,
            "delay_info": delay_info,
            "lastUpdated": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
        }
    )


@router.get("/delay-info", response_model=ApiResponse[List[dict]])
async def get_sync_delay_info(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    data = mock.generate_sync_delay_info()
    return ApiResponse.ok(data=data)


@router.post("/trigger/{source}", response_model=ApiResponse[dict])
async def trigger_sync(
    source: str,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    valid_sources = ["vehicle_source", "finance", "inspector", "all"]
    if source not in valid_sources:
        raise HTTPException(status_code=400, detail=f"无效的数据源，可选: {valid_sources}")
    await asyncio.sleep(0.5)
    sources = [source] if source != "all" else ["vehicle_source", "finance", "inspector"]
    job_id = f"sync-job-{uuid.uuid4().hex[:12]}"
    return ApiResponse.ok(
        data={
            "jobId": job_id,
            "job_id": job_id,
            "sources": sources,
            "status": "running",
            "triggeredAt": datetime.now().isoformat(),
            "triggered_at": datetime.now().isoformat(),
            "estimatedDuration": "2-5 分钟",
            "estimated_duration": "2-5 分钟",
        },
        message="同步任务已启动",
    )


@router.post("/trigger", response_model=ApiResponse[dict])
async def trigger_sync_all(
    source: str | None = Query(None, description="指定数据源，不填则全部"),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    await asyncio.sleep(0.5)
    sources = [source] if source else ["vehicle_source", "finance", "inspector"]
    job_id = f"sync-job-{uuid.uuid4().hex[:12]}"
    return ApiResponse.ok(
        data={
            "jobId": job_id,
            "job_id": job_id,
            "sources": sources,
            "status": "running",
            "triggeredAt": datetime.now().isoformat(),
            "triggered_at": datetime.now().isoformat(),
        },
        message="同步任务已启动",
    )


@router.get("", response_model=ApiResponse[PaginatedData[dict]])
async def list_sync_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    source: str | None = None,
    status: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    source_names = {"vehicle_source": "车源库", "finance": "金融系统", "inspector": "检测仪数据"}
    source_list = list(source_names.keys())
    logs = []
    for i in range(50):
        s = random.choice(source_list)
        stat = random.choices(["success", "success", "success", "failed", "running"], weights=[5, 5, 5, 1, 1])[0]
        total = random.randint(500, 3000)
        failed = 0 if stat == "running" else random.randint(0, 30)
        success = total - failed if stat != "running" else random.randint(0, total)
        started = datetime.now() - timedelta(hours=random.randint(0, 72), minutes=random.randint(0, 59))
        finished = (started + timedelta(minutes=random.randint(1, 20))) if stat != "running" else None
        logs.append({
            "id": f"log-{uuid.uuid4().hex[:12]}",
            "batchNo": f"BATCH-{started.strftime('%Y%m%d')}-{str(i+1).zfill(4)}",
            "batch_no": f"BATCH-{started.strftime('%Y%m%d')}-{str(i+1).zfill(4)}",
            "source": s,
            "sourceName": source_names[s],
            "source_name": source_names[s],
            "totalRecords": total,
            "total_records": total,
            "successCount": success,
            "success_count": success,
            "failedCount": failed,
            "failed_count": failed,
            "startedAt": started.isoformat(),
            "started_at": started.isoformat(),
            "finishedAt": finished.isoformat() if finished else None,
            "finished_at": finished.isoformat() if finished else None,
            "status": stat,
        })
    import random as _random
    _random.shuffle(logs)
    if source:
        logs = [l for l in logs if l["source"] == source]
    if status:
        logs = [l for l in logs if l["status"] == status]
    logs.sort(key=lambda x: x["startedAt"], reverse=True)
    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size
    items = logs[start:end]
    return ApiResponse.ok(
        data=PaginatedData(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    )
