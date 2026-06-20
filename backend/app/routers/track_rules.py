from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


@router.get("", response_model=schemas.PaginatedResponse)
def list_track_rules(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.TrackRule)
    
    if keyword:
        query = query.filter(models.TrackRule.name.contains(keyword))
    if area:
        query = query.filter(models.TrackRule.area == area)
    if is_active is not None:
        query = query.filter(models.TrackRule.is_active == is_active)
    
    total = query.count()
    items = query.order_by(models.TrackRule.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return paginated_response(items, total, page, page_size)


@router.get("/{rule_id}", response_model=schemas.ResponseModel)
def get_track_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.TrackRule).filter(models.TrackRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return success_response(rule)


@router.post("", response_model=schemas.ResponseModel)
def create_track_rule(rule_in: schemas.TrackRuleCreate, db: Session = Depends(get_db)):
    rule = models.TrackRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return success_response(rule)


@router.put("/{rule_id}", response_model=schemas.ResponseModel)
def update_track_rule(
    rule_id: int,
    rule_in: schemas.TrackRuleUpdate,
    db: Session = Depends(get_db)
):
    rule = db.query(models.TrackRule).filter(models.TrackRule.id == rule_id).first()
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
def delete_track_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.TrackRule).filter(models.TrackRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    rule.is_active = False
    rule.updated_at = datetime.utcnow()
    db.commit()
    return success_response({"message": "删除成功"})
