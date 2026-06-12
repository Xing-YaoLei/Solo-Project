from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import ThresholdConfig, ThresholdConfigUpdate
from app.services.threshold_service import ThresholdService

router = APIRouter(prefix="/api/thresholds", tags=["thresholds"])


@router.get("", response_model=List[ThresholdConfig])
def list_thresholds(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return ThresholdService.get_all(db, category)


@router.get("/{config_key}", response_model=ThresholdConfig)
def get_threshold(config_key: str, db: Session = Depends(get_db)):
    config = ThresholdService.get_by_key(db, config_key)
    if not config:
        raise HTTPException(status_code=404, detail="Threshold config not found")
    return config


@router.put("/{config_key}", response_model=ThresholdConfig)
def update_threshold(
    config_key: str,
    config_update: ThresholdConfigUpdate,
    db: Session = Depends(get_db),
):
    config = ThresholdService.update(db, config_key, config_update)
    if not config:
        raise HTTPException(status_code=404, detail="Threshold config not found")
    return config
