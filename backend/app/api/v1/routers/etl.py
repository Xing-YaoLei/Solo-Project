from fastapi import APIRouter, Depends, Query
from typing import List, Optional
import uuid
from datetime import datetime

from app.api.v1.schemas.common import ApiResponse
from app.api.deps import get_mock_data
from app.services.mock_service import MockService

router = APIRouter(prefix="/etl", tags=["ETL 管道"])


@router.get("/stats", response_model=ApiResponse[dict])
async def get_etl_stats(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_etl_stats()
    return ApiResponse.ok(data=stats)


@router.get("/pipeline/status", response_model=ApiResponse[dict])
async def get_pipeline_status(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_etl_stats()
    return ApiResponse.ok(data=stats)


@router.post("/dedupe/vin", response_model=ApiResponse[dict])
async def run_dedupe_by_vin(
    dry_run: bool = Query(False),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_etl_stats()
    total = stats["extract"]["records"]
    deduped = stats["transform"]["deduped"]
    return ApiResponse.ok(
        data={
            "runId": f"dedupe-{uuid.uuid4().hex[:12]}",
            "run_id": f"dedupe-{uuid.uuid4().hex[:12]}",
            "total": total,
            "duplicates": deduped,
            "removed": 0 if dry_run else deduped,
            "dryRun": dry_run,
            "dry_run": dry_run,
            "completedAt": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
        },
        message=f"VIN去重任务完成{f'(dry run)' if dry_run else ''}",
    )


@router.post("/normalize/brands", response_model=ApiResponse[dict])
async def run_normalize_brands(
    dry_run: bool = Query(False),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_etl_stats()
    normalized = stats["transform"]["normalized"]
    mapping = {
        "BYD": "比亚迪",
        "BMW": "宝马",
        "BENZ": "奔驰",
        "TESLA": "特斯拉",
        "TOYOTA": "丰田",
        "HONDA": "本田",
        "VW": "大众",
        "AUDI": "奥迪",
    }
    return ApiResponse.ok(
        data={
            "runId": f"normalize-{uuid.uuid4().hex[:12]}",
            "run_id": f"normalize-{uuid.uuid4().hex[:12]}",
            "processed": stats["extract"]["records"],
            "normalized": normalized,
            "mapping": mapping,
            "dryRun": dry_run,
            "dry_run": dry_run,
            "completedAt": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
        },
        message=f"品牌归一化任务完成{f'(dry run)' if dry_run else ''}",
    )


@router.post("/fill/mileage", response_model=ApiResponse[dict])
async def run_fill_missing_mileage(
    dry_run: bool = Query(False),
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    stats = mock.get_etl_stats()
    filled = stats["transform"]["filled"]
    return ApiResponse.ok(
        data={
            "runId": f"fill-mileage-{uuid.uuid4().hex[:12]}",
            "run_id": f"fill-mileage-{uuid.uuid4().hex[:12]}",
            "totalMissing": filled + 50,
            "total_missing": filled + 50,
            "filled": filled,
            "method": "brand_year_median",
            "dryRun": dry_run,
            "dry_run": dry_run,
            "completedAt": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
        },
        message=f"里程缺失值填充完成{f'(dry run)' if dry_run else ''}",
    )


@router.post("/pipeline/run", response_model=ApiResponse[dict])
async def run_full_pipeline(
    source: str | None = None,
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    run_id = f"etl-full-{uuid.uuid4().hex[:12]}"
    return ApiResponse.ok(
        data={
            "runId": run_id,
            "run_id": run_id,
            "source": source or "all",
            "status": "running",
            "startedAt": datetime.now().isoformat(),
            "started_at": datetime.now().isoformat(),
            "estimatedDuration": "5-10 分钟",
            "estimated_duration": "5-10 分钟",
        },
        message="ETL 管道已启动",
    )


@router.get("/rules/mapping", response_model=ApiResponse[List[dict]])
async def get_etl_mapping_rules(
    mock: MockService = Depends(get_mock_data),
) -> ApiResponse:
    rules = [
        {"id": "M001", "type": "brand_normalization", "description": "品牌名称归一化", "enabled": True},
        {"id": "M002", "type": "document_type_mapping", "description": "材料类型映射", "enabled": True},
        {"id": "M003", "type": "vin_validation", "description": "VIN 格式校验", "enabled": True},
        {"id": "M004", "type": "mileage_imputation", "description": "里程缺失值填充", "enabled": True},
        {"id": "M005", "type": "date_parsing", "description": "日期格式统一解析", "enabled": True},
        {"id": "M006", "type": "currency_normalization", "description": "金额币种归一化", "enabled": False},
    ]
    return ApiResponse.ok(data=rules)
