from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


@router.get("", response_model=schemas.PaginatedResponse)
def list_subsidy_rules(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    rule_type: Optional[str] = None,
    area: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.SubsidyRule)
    
    if keyword:
        query = query.filter(models.SubsidyRule.name.contains(keyword))
    if rule_type:
        query = query.filter(models.SubsidyRule.rule_type == rule_type)
    if area:
        query = query.filter(models.SubsidyRule.area == area)
    if is_active is not None:
        query = query.filter(models.SubsidyRule.is_active == is_active)
    
    total = query.count()
    items = query.order_by(models.SubsidyRule.priority.desc(), models.SubsidyRule.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return paginated_response(items, total, page, page_size)


@router.get("/{rule_id}", response_model=schemas.ResponseModel)
def get_subsidy_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.SubsidyRule).filter(models.SubsidyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return success_response(rule)


@router.post("", response_model=schemas.ResponseModel)
def create_subsidy_rule(rule_in: schemas.SubsidyRuleCreate, db: Session = Depends(get_db)):
    rule = models.SubsidyRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return success_response(rule)


@router.put("/{rule_id}", response_model=schemas.ResponseModel)
def update_subsidy_rule(
    rule_id: int,
    rule_in: schemas.SubsidyRuleUpdate,
    db: Session = Depends(get_db)
):
    rule = db.query(models.SubsidyRule).filter(models.SubsidyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return success_response(rule)


@router.delete("/{rule_id}", response_model=schemas.ResponseModel)
def delete_subsidy_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.SubsidyRule).filter(models.SubsidyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    rule.is_active = False
    rule.updated_at = datetime.utcnow()
    db.commit()
    return success_response({"message": "删除成功"})


@router.get("/types/list", response_model=schemas.ResponseModel)
def get_subsidy_types():
    types = [
        {"value": "distance", "label": "距离补贴"},
        {"value": "weather", "label": "天气补贴"},
        {"value": "peak", "label": "高峰补贴"},
        {"value": "weight", "label": "重量补贴"},
        {"value": "night", "label": "夜间补贴"},
    ]
    return success_response(types)
