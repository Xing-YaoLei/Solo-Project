from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models import UsageRule, InventoryThreshold
from app.schemas.usage_rule import UsageRuleCreate, UsageRuleUpdate, UsageRuleResponse
from app.schemas.inventory_threshold import (
    InventoryThresholdCreate,
    InventoryThresholdUpdate,
    InventoryThresholdResponse,
)

router = APIRouter(prefix="/rules", tags=["规则配置"])


@router.get("/usage", response_model=List[UsageRuleResponse])
def list_usage_rules(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return db.query(UsageRule).order_by(UsageRule.material_category).all()


@router.post("/usage", response_model=UsageRuleResponse, status_code=status.HTTP_201_CREATED)
def create_usage_rule(
    data: UsageRuleCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    existing = db.query(UsageRule).filter(UsageRule.material_category == data.material_category).first()
    if existing:
        raise HTTPException(status_code=400, detail="该材料类别已有使用规则")
    rule = UsageRule(**data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/usage/{rule_id}", response_model=UsageRuleResponse)
def update_usage_rule(
    rule_id: str,
    data: UsageRuleUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    rule = db.query(UsageRule).filter(UsageRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="使用规则不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "material_category" in update_data and update_data["material_category"] != rule.material_category:
        existing = db.query(UsageRule).filter(UsageRule.material_category == update_data["material_category"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="该材料类别已有使用规则")
    for key, value in update_data.items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/thresholds", response_model=List[InventoryThresholdResponse])
def list_thresholds(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return db.query(InventoryThreshold).order_by(InventoryThreshold.material_category).all()


@router.post("/thresholds", response_model=InventoryThresholdResponse, status_code=status.HTTP_201_CREATED)
def create_threshold(
    data: InventoryThresholdCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    existing = db.query(InventoryThreshold).filter(
        InventoryThreshold.material_category == data.material_category
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该材料类别已有阈值配置")
    threshold = InventoryThreshold(**data.model_dump())
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


@router.put("/thresholds/{threshold_id}", response_model=InventoryThresholdResponse)
def update_threshold(
    threshold_id: str,
    data: InventoryThresholdUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    threshold = db.query(InventoryThreshold).filter(InventoryThreshold.id == threshold_id).first()
    if not threshold:
        raise HTTPException(status_code=404, detail="阈值配置不存在")
    update_data = data.model_dump(exclude_unset=True)
    if (
        "material_category" in update_data
        and update_data["material_category"] != threshold.material_category
    ):
        existing = db.query(InventoryThreshold).filter(
            InventoryThreshold.material_category == update_data["material_category"]
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="该材料类别已有阈值配置")
    for key, value in update_data.items():
        setattr(threshold, key, value)
    db.commit()
    db.refresh(threshold)
    return threshold
