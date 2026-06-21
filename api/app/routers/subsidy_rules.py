import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SubsidyRule
from app.schemas import SubsidyRuleCreate, SubsidyRuleResponse, SubsidyRuleUpdate
from app.services.flow_log import FlowLogService

router = APIRouter(prefix="/api/subsidy-rules", tags=["subsidy-rules"])


@router.get("", response_model=dict)
async def list_subsidy_rules(
    city_code: Optional[str] = None,
    status: Optional[str] = None,
    route_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SubsidyRule)
    if city_code:
        stmt = stmt.where(SubsidyRule.city_code == city_code)
    if status:
        stmt = stmt.where(SubsidyRule.status == status)
    if route_type:
        stmt = stmt.where(SubsidyRule.route_type == route_type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(SubsidyRule.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [SubsidyRuleResponse.model_validate(r).model_dump() for r in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{rule_id}", response_model=SubsidyRuleResponse)
async def get_subsidy_rule(rule_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(SubsidyRule).where(SubsidyRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="SubsidyRule not found")
    return rule


@router.post("", response_model=SubsidyRuleResponse, status_code=201)
async def create_subsidy_rule(
    data: SubsidyRuleCreate,
    db: AsyncSession = Depends(get_db),
):
    rule = SubsidyRule(**data.model_dump(), status="draft")
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=SubsidyRuleResponse)
async def update_subsidy_rule(
    rule_id: uuid.UUID,
    data: SubsidyRuleUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SubsidyRule).where(SubsidyRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="SubsidyRule not found")
    if rule.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Only draft or rejected rules can be updated")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    await db.flush()
    await db.refresh(rule)
    return rule


@router.post("/{rule_id}/submit-approval", response_model=SubsidyRuleResponse)
async def submit_approval(rule_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(SubsidyRule).where(SubsidyRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="SubsidyRule not found")
    if rule.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft rules can be submitted for approval")
    rule.status = "pending_approval"
    await db.flush()
    await db.refresh(rule)
    return rule


@router.post("/{rule_id}/approve", response_model=SubsidyRuleResponse)
async def approve_subsidy_rule(
    rule_id: uuid.UUID,
    approver_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SubsidyRule).where(SubsidyRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="SubsidyRule not found")
    if rule.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Only pending_approval rules can be approved")
    rule.status = "approved"
    if approver_id:
        rule.approved_by = approver_id
    await db.flush()
    await db.refresh(rule)
    return rule


@router.post("/{rule_id}/reject", response_model=SubsidyRuleResponse)
async def reject_subsidy_rule(
    rule_id: uuid.UUID,
    reason: str = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SubsidyRule).where(SubsidyRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="SubsidyRule not found")
    if rule.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Only pending_approval rules can be rejected")
    rule.status = "rejected"
    await db.flush()
    await db.refresh(rule)
    return rule
