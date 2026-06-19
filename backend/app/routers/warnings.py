from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import WarningThreshold, WarningChangeLog
from .. import schemas

router = APIRouter()


@router.get("/thresholds")
def list_thresholds(
    category: Optional[str] = None,
    enabled_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(WarningThreshold)
    if category:
        query = query.filter(WarningThreshold.category == category)
    if enabled_only:
        query = query.filter(WarningThreshold.enabled == True)

    thresholds = query.order_by(WarningThreshold.category, WarningThreshold.name).all()

    return {
        "items": [
            {
                "id": t.id,
                "name": t.name,
                "code": t.code,
                "description": t.description,
                "category": t.category,
                "min_value": t.min_value,
                "max_value": t.max_value,
                "current_value": t.current_value,
                "unit": t.unit,
                "enabled": t.enabled,
                "updated_by": t.updated_by,
                "updated_at": t.updated_at,
            }
            for t in thresholds
        ]
    }


@router.post("/thresholds", response_model=schemas.WarningThreshold)
def create_threshold(
    threshold: schemas.WarningThresholdCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(WarningThreshold).filter(
        (WarningThreshold.code == threshold.code) | (WarningThreshold.name == threshold.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="阈值名称或编码已存在")

    db_threshold = WarningThreshold(**threshold.model_dump())
    db.add(db_threshold)
    db.commit()
    db.refresh(db_threshold)
    return db_threshold


@router.patch("/thresholds/{threshold_id}", response_model=schemas.WarningThreshold)
def update_threshold(
    threshold_id: int,
    update: schemas.WarningThresholdUpdate,
    db: Session = Depends(get_db),
):
    threshold = db.query(WarningThreshold).filter(WarningThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="阈值配置不存在")

    old_value = threshold.current_value
    new_value = update.current_value

    if threshold.min_value is not None and new_value < threshold.min_value:
        raise HTTPException(status_code=400, detail=f"阈值不能小于最小值 {threshold.min_value}")
    if threshold.max_value is not None and new_value > threshold.max_value:
        raise HTTPException(status_code=400, detail=f"阈值不能大于最大值 {threshold.max_value}")

    threshold.current_value = new_value
    threshold.updated_by = update.updated_by

    log = WarningChangeLog(
        threshold_id=threshold.id,
        threshold_name=threshold.name,
        old_value=old_value,
        new_value=new_value,
        changed_by=update.updated_by,
        change_reason=update.change_reason,
    )
    db.add(log)
    db.commit()
    db.refresh(threshold)

    return threshold


@router.get("/thresholds/{threshold_id}/logs")
def get_threshold_change_logs(
    threshold_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    logs = db.query(WarningChangeLog).filter(
        WarningChangeLog.threshold_id == threshold_id
    ).order_by(WarningChangeLog.changed_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": [
            {
                "id": l.id,
                "threshold_id": l.threshold_id,
                "threshold_name": l.threshold_name,
                "old_value": l.old_value,
                "new_value": l.new_value,
                "changed_by": l.changed_by,
                "change_reason": l.change_reason,
                "changed_at": l.changed_at,
            }
            for l in logs
        ]
    }


@router.get("/logs")
def get_all_change_logs(
    changed_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(WarningChangeLog)
    if changed_by:
        query = query.filter(WarningChangeLog.changed_by.contains(changed_by))

    total = query.count()
    logs = query.order_by(WarningChangeLog.changed_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": l.id,
                "threshold_id": l.threshold_id,
                "threshold_name": l.threshold_name,
                "old_value": l.old_value,
                "new_value": l.new_value,
                "changed_by": l.changed_by,
                "change_reason": l.change_reason,
                "changed_at": l.changed_at,
            }
            for l in logs
        ]
    }
