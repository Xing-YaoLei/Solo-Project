from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app import schemas, models

router = APIRouter(prefix="/thresholds", tags=["预警阈值配置"])


@router.get("/", response_model=List[schemas.ThresholdConfig])
def list_threshold_configs(db: Session = Depends(get_db)):
    configs = (
        db.query(models.ThresholdConfig)
        .options(
            Session.query(models.ThresholdConfig).column_descriptions[0]["type"]
        )
        .all()
    )

    results = []
    for cfg in configs:
        history = (
            db.query(models.ThresholdChangeLog)
            .filter(models.ThresholdChangeLog.config_id == cfg.id)
            .order_by(models.ThresholdChangeLog.changed_at.desc())
            .limit(10)
            .all()
        )
        results.append(
            schemas.ThresholdConfig(
                id=cfg.id,
                config_key=cfg.config_key,
                config_name=cfg.config_name,
                config_value=cfg.config_value,
                config_unit=cfg.config_unit,
                category=cfg.category,
                description=cfg.description,
                current_modified_by=cfg.current_modified_by,
                history=[
                    schemas.ThresholdChangeLogInfo(
                        id=h.id,
                        old_value=h.old_value,
                        new_value=h.new_value,
                        changed_by=h.changed_by,
                        change_reason=h.change_reason,
                        changed_at=h.changed_at,
                    )
                    for h in history
                ],
                created_at=cfg.created_at,
                updated_at=cfg.updated_at,
            )
        )
    return results


@router.post("/", response_model=schemas.ThresholdConfig)
def create_threshold_config(
    payload: schemas.ThresholdConfigCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.ThresholdConfig)
        .filter(models.ThresholdConfig.config_key == payload.config_key)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="配置键已存在")

    cfg = models.ThresholdConfig(**payload.model_dump())
    db.add(cfg)
    db.commit()
    db.refresh(cfg)

    return schemas.ThresholdConfig(
        id=cfg.id,
        config_key=cfg.config_key,
        config_name=cfg.config_name,
        config_value=cfg.config_value,
        config_unit=cfg.config_unit,
        category=cfg.category,
        description=cfg.description,
        current_modified_by=cfg.current_modified_by,
        history=[],
        created_at=cfg.created_at,
        updated_at=cfg.updated_at,
    )


@router.put("/{config_id}", response_model=schemas.ThresholdConfig)
def update_threshold_config(
    config_id: int,
    payload: schemas.ThresholdConfigUpdate,
    db: Session = Depends(get_db),
):
    cfg = (
        db.query(models.ThresholdConfig)
        .filter(models.ThresholdConfig.id == config_id)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="配置不存在")

    old_value = cfg.config_value
    if old_value == payload.config_value:
        history = (
            db.query(models.ThresholdChangeLog)
            .filter(models.ThresholdChangeLog.config_id == cfg.id)
            .order_by(models.ThresholdChangeLog.changed_at.desc())
            .limit(10)
            .all()
        )
        return schemas.ThresholdConfig(
            id=cfg.id,
            config_key=cfg.config_key,
            config_name=cfg.config_name,
            config_value=cfg.config_value,
            config_unit=cfg.config_unit,
            category=cfg.category,
            description=cfg.description,
            current_modified_by=cfg.current_modified_by,
            history=[
                schemas.ThresholdChangeLogInfo(
                    id=h.id,
                    old_value=h.old_value,
                    new_value=h.new_value,
                    changed_by=h.changed_by,
                    change_reason=h.change_reason,
                    changed_at=h.changed_at,
                )
                for h in history
            ],
            created_at=cfg.created_at,
            updated_at=cfg.updated_at,
        )

    cfg.config_value = payload.config_value
    cfg.current_modified_by = payload.modified_by

    log = models.ThresholdChangeLog(
        config_id=cfg.id,
        old_value=old_value,
        new_value=payload.config_value,
        changed_by=payload.modified_by,
        change_reason=payload.change_reason,
    )
    db.add(log)
    db.commit()
    db.refresh(cfg)
    db.refresh(log)

    history = (
        db.query(models.ThresholdChangeLog)
        .filter(models.ThresholdChangeLog.config_id == cfg.id)
        .order_by(models.ThresholdChangeLog.changed_at.desc())
        .limit(10)
        .all()
    )

    return schemas.ThresholdConfig(
        id=cfg.id,
        config_key=cfg.config_key,
        config_name=cfg.config_name,
        config_value=cfg.config_value,
        config_unit=cfg.config_unit,
        category=cfg.category,
        description=cfg.description,
        current_modified_by=cfg.current_modified_by,
        history=[
            schemas.ThresholdChangeLogInfo(
                id=h.id,
                old_value=h.old_value,
                new_value=h.new_value,
                changed_by=h.changed_by,
                change_reason=h.change_reason,
                changed_at=h.changed_at,
            )
            for h in history
        ],
        created_at=cfg.created_at,
        updated_at=cfg.updated_at,
    )


@router.delete("/{config_id}")
def delete_threshold_config(config_id: int, db: Session = Depends(get_db)):
    cfg = (
        db.query(models.ThresholdConfig)
        .filter(models.ThresholdConfig.id == config_id)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="配置不存在")

    db.query(models.ThresholdChangeLog).filter(
        models.ThresholdChangeLog.config_id == config_id
    ).delete()
    db.delete(cfg)
    db.commit()
    return {"message": "删除成功"}
