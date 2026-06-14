from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ..services import repository as repo

router = APIRouter(prefix="/api/thresholds", tags=["预警阈值"])


class ThresholdCreate(BaseModel):
    threshold_type: str
    threshold_name: str
    threshold_value: float
    threshold_unit: Optional[str] = "天"
    description: Optional[str] = None
    is_enabled: Optional[int] = 1
    created_by: Optional[str] = "system"
    remark: Optional[str] = None


class ThresholdUpdate(BaseModel):
    threshold_name: Optional[str] = None
    threshold_value: Optional[float] = None
    threshold_unit: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[int] = None
    updated_by: Optional[str] = "system"
    remark: Optional[str] = None


@router.get("")
def list_thresholds():
    return repo.list_thresholds()


@router.get("/type/{threshold_type}")
def get_threshold_by_type(threshold_type: str):
    item = repo.get_threshold_by_type(threshold_type)
    if not item:
        raise HTTPException(status_code=404, detail="阈值配置不存在")
    return item


@router.get("/{threshold_id}")
def get_threshold(threshold_id: int):
    item = repo.get_threshold(threshold_id)
    if not item:
        raise HTTPException(status_code=404, detail="阈值配置不存在")
    return item


@router.post("")
def create_threshold_endpoint(threshold: ThresholdCreate):
    existing = repo.get_threshold_by_type(threshold.threshold_type)
    if existing:
        raise HTTPException(status_code=400, detail="该类型阈值已存在")
    return repo.create_threshold(threshold.model_dump())


@router.put("/{threshold_id}")
def update_threshold_endpoint(threshold_id: int, threshold_update: ThresholdUpdate):
    result = repo.update_threshold(threshold_id, threshold_update.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="阈值配置不存在")
    return result


@router.get("/{threshold_id}/audit-logs")
def get_audit_logs(
    threshold_id: Optional[int] = None,
    threshold_type: Optional[str] = Query(None, description="阈值类型过滤"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    return repo.list_threshold_audit_logs(threshold_id, threshold_type, page, page_size)
