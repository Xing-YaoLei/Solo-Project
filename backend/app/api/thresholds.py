from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..db.database import get_db
from ..models.warning_threshold import WarningThreshold, ThresholdAuditLog
from ..schemas.threshold_note import (
    WarningThresholdCreate,
    WarningThresholdUpdate,
    WarningThresholdResponse,
    ThresholdAuditLogResponse,
)
import uuid

router = APIRouter(prefix="/api/thresholds", tags=["预警阈值"])


@router.get("", response_model=List[WarningThresholdResponse])
def list_thresholds(db: Session = Depends(get_db)):
    thresholds = db.query(WarningThreshold).order_by(WarningThreshold.id.asc()).all()
    return thresholds


@router.get("/{threshold_id}", response_model=WarningThresholdResponse)
def get_threshold(threshold_id: int, db: Session = Depends(get_db)):
    threshold = db.query(WarningThreshold).filter(WarningThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="阈值配置不存在")
    return threshold


@router.post("", response_model=WarningThresholdResponse)
def create_threshold(threshold: WarningThresholdCreate, db: Session = Depends(get_db)):
    existing = db.query(WarningThreshold).filter(
        WarningThreshold.threshold_type == threshold.threshold_type
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型阈值已存在")

    db_threshold = WarningThreshold(**threshold.model_dump())
    db.add(db_threshold)
    db.commit()
    db.refresh(db_threshold)

    audit = ThresholdAuditLog(
        threshold_id=db_threshold.id,
        threshold_type=db_threshold.threshold_type,
        new_value=db_threshold.threshold_value,
        new_name=db_threshold.threshold_name,
        operator_name=threshold.created_by or "system",
        operation_type="create",
        remark="创建阈值配置"
    )
    db.add(audit)
    db.commit()

    return db_threshold


@router.put("/{threshold_id}", response_model=WarningThresholdResponse)
def update_threshold(
    threshold_id: int,
    threshold_update: WarningThresholdUpdate,
    db: Session = Depends(get_db)
):
    db_threshold = db.query(WarningThreshold).filter(
        WarningThreshold.id == threshold_id
    ).first()
    if not db_threshold:
        raise HTTPException(status_code=404, detail="阈值配置不存在")

    old_value = db_threshold.threshold_value
    old_name = db_threshold.threshold_name

    update_data = threshold_update.model_dump(exclude_unset=True)
    remark = update_data.pop("remark", None)

    for key, value in update_data.items():
        setattr(db_threshold, key, value)

    db.commit()
    db.refresh(db_threshold)

    new_value = db_threshold.threshold_value
    new_name = db_threshold.threshold_name

    if old_value != new_value or old_name != new_name:
        audit = ThresholdAuditLog(
            threshold_id=db_threshold.id,
            threshold_type=db_threshold.threshold_type,
            old_value=old_value,
            new_value=new_value,
            old_name=old_name,
            new_name=new_name,
            operator_name=threshold_update.updated_by or "system",
            operation_type="update",
            remark=remark or "更新阈值配置"
        )
        db.add(audit)
        db.commit()

    return db_threshold


@router.get("/{threshold_id}/audit-logs", response_model=List[ThresholdAuditLogResponse])
def get_audit_logs(
    threshold_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    logs = db.query(ThresholdAuditLog).filter(
        ThresholdAuditLog.threshold_id == threshold_id
    ).order_by(ThresholdAuditLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return logs
