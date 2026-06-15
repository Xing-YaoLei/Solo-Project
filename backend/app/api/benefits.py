from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BenefitRule, MemberBenefitMapping, MemberProfile
from ..schemas.schemas import (
    BenefitRuleCreate,
    BenefitRuleUpdate,
    BenefitRuleResponse,
    BenefitRuleListResponse,
    MemberBenefitMappingCreate,
    MemberBenefitMappingResponse,
)

router = APIRouter(prefix="/api", tags=["benefits"])


@router.get("/benefits/", response_model=BenefitRuleListResponse)
def list_benefits(
    rule_name: Optional[str] = Query(None, description="按规则名称过滤(模糊匹配)"),
    benefit_type: Optional[str] = Query(None, description="按权益类型过滤"),
    is_active: Optional[bool] = Query(None, description="按是否启用过滤"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    query = db.query(BenefitRule)

    if rule_name:
        query = query.filter(BenefitRule.rule_name.ilike(f"%{rule_name}%"))
    if benefit_type:
        query = query.filter(BenefitRule.benefit_type == benefit_type)
    if is_active is not None:
        query = query.filter(BenefitRule.is_active == is_active)

    total = query.count()
    items = query.order_by(BenefitRule.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return BenefitRuleListResponse(total=total, items=items)


@router.post("/benefits/", response_model=BenefitRuleResponse)
def create_benefit(benefit_in: BenefitRuleCreate, db: Session = Depends(get_db)):
    existing = db.query(BenefitRule).filter(BenefitRule.rule_code == benefit_in.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"权益规则编码已存在: {benefit_in.rule_code}")

    benefit = BenefitRule(**benefit_in.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    return benefit


@router.get("/benefits/{benefit_id}", response_model=BenefitRuleResponse)
def get_benefit(benefit_id: int, db: Session = Depends(get_db)):
    benefit = db.query(BenefitRule).filter(BenefitRule.id == benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail=f"权益规则不存在: {benefit_id}")
    return benefit


@router.put("/benefits/{benefit_id}", response_model=BenefitRuleResponse)
def update_benefit(
    benefit_id: int,
    benefit_in: BenefitRuleUpdate,
    db: Session = Depends(get_db),
):
    benefit = db.query(BenefitRule).filter(BenefitRule.id == benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail=f"权益规则不存在: {benefit_id}")

    update_data = benefit_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(benefit, key, value)
    benefit.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(benefit)
    return benefit


@router.delete("/benefits/{benefit_id}")
def delete_benefit(benefit_id: int, db: Session = Depends(get_db)):
    benefit = db.query(BenefitRule).filter(BenefitRule.id == benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail=f"权益规则不存在: {benefit_id}")

    mapping_count = db.query(MemberBenefitMapping).filter(MemberBenefitMapping.benefit_id == benefit_id).count()
    if mapping_count > 0:
        raise HTTPException(status_code=400, detail="该权益规则已被会员使用，无法删除")

    db.delete(benefit)
    db.commit()
    return {"message": "删除成功"}


@router.post("/benefits/mapping/", response_model=MemberBenefitMappingResponse)
def create_benefit_mapping(
    mapping_in: MemberBenefitMappingCreate,
    db: Session = Depends(get_db),
):
    member = db.query(MemberProfile).filter(MemberProfile.id == mapping_in.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail=f"会员不存在: {mapping_in.member_id}")

    benefit = db.query(BenefitRule).filter(BenefitRule.id == mapping_in.benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail=f"权益规则不存在: {mapping_in.benefit_id}")

    mapping = MemberBenefitMapping(**mapping_in.model_dump())
    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    result = mapping.__dict__.copy()
    result["benefit"] = benefit
    return MemberBenefitMappingResponse.model_validate(result)


@router.get("/benefits/mappings/{member_id}", response_model=List[MemberBenefitMappingResponse])
def get_member_benefit_mappings(
    member_id: int,
    db: Session = Depends(get_db),
):
    member = db.query(MemberProfile).filter(MemberProfile.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail=f"会员不存在: {member_id}")

    mappings = (
        db.query(MemberBenefitMapping)
        .filter(MemberBenefitMapping.member_id == member_id)
        .order_by(MemberBenefitMapping.granted_date.desc())
        .all()
    )

    result = []
    for mapping in mappings:
        data = mapping.__dict__.copy()
        data["benefit"] = mapping.benefit
        result.append(MemberBenefitMappingResponse.model_validate(data))
    return result
