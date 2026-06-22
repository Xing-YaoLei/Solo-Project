from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    RectificationPlan,
    SamplingRecord,
    Vendor,
    User,
    UserRole,
    RiskLevel,
    RectificationStatus,
)
from app.schemas import (
    RectificationPlanCreate,
    RectificationPlanUpdate,
    RectificationStatusUpdate,
    RectificationPlanResponse,
    RectificationPlanListResponse,
    StatusChangeLogListResponse,
)
from app.services import StatusFlowService
from app.api.routers.auth import get_current_user, require_roles
from app.tasks.notification_tasks import notify_status_change_task

router = APIRouter(prefix="/api/rectification", tags=["整改计划"])


@router.post("", response_model=RectificationPlanResponse, status_code=status.HTTP_201_CREATED)
def create_rectification_plan(
    plan_in: RectificationPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    sampling = db.query(SamplingRecord).filter(SamplingRecord.id == plan_in.sampling_id).first()
    if not sampling:
        raise HTTPException(status_code=400, detail="抽样记录不存在")

    if plan_in.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == plan_in.vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=400, detail="供应商不存在")

    plan = RectificationPlan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("", response_model=RectificationPlanListResponse)
def list_rectification_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sampling_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    risk_level: Optional[RiskLevel] = None,
    status: Optional[RectificationStatus] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RectificationPlan)
    if sampling_id:
        query = query.filter(RectificationPlan.sampling_id == sampling_id)
    if vendor_id:
        query = query.filter(RectificationPlan.vendor_id == vendor_id)
    if risk_level:
        query = query.filter(RectificationPlan.risk_level == risk_level)
    if status:
        query = query.filter(RectificationPlan.status == status)
    if keyword:
        query = query.filter(
            RectificationPlan.title.contains(keyword) | RectificationPlan.description.contains(keyword)
        )
    total = query.count()
    items = query.order_by(RectificationPlan.created_at.desc()).offset(skip).limit(limit).all()
    return RectificationPlanListResponse(total=total, items=items)


@router.get("/{plan_id}", response_model=RectificationPlanResponse)
def get_rectification_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(RectificationPlan).filter(RectificationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="整改计划不存在")
    return plan


@router.put("/{plan_id}", response_model=RectificationPlanResponse)
def update_rectification_plan(
    plan_id: int,
    plan_in: RectificationPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    plan = db.query(RectificationPlan).filter(RectificationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="整改计划不存在")

    if plan_in.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == plan_in.vendor_id).first()
        if not vendor:
            raise HTTPException(status_code=400, detail="供应商不存在")

    update_data = plan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.post("/{plan_id}/risk-level")
def update_risk_level(
    plan_id: int,
    risk_level: RiskLevel,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    plan = db.query(RectificationPlan).filter(RectificationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="整改计划不存在")

    old_level = plan.risk_level
    plan.risk_level = risk_level
    db.commit()
    db.refresh(plan)

    notify_status_change_task.delay(
        entity_type="rectification_plan",
        entity_id=plan.id,
        old_status=f"风险等级:{old_level.value if old_level else None}",
        new_status=f"风险等级:{risk_level.value}",
        changed_by=current_user.id,
        changed_by_name=current_user.username,
        extra_data={"整改标题": plan.title}
    )

    return {"message": "风险等级已更新", "old_level": old_level.value if old_level else None, "new_level": risk_level.value}


@router.post("/{plan_id}/status", response_model=RectificationPlanResponse)
def update_rectification_status(
    plan_id: int,
    status_in: RectificationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER, UserRole.VENDOR))
):
    plan = db.query(RectificationPlan).filter(RectificationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="整改计划不存在")

    old_status = plan.status

    plan = StatusFlowService.update_rectification_status(
        db, plan, status_in.status, current_user.id, status_in.remark
    )
    db.commit()
    db.refresh(plan)

    notify_status_change_task.delay(
        entity_type="rectification_plan",
        entity_id=plan.id,
        old_status=old_status.value if old_status else None,
        new_status=plan.status.value,
        changed_by=current_user.id,
        changed_by_name=current_user.username,
        extra_data={"整改标题": plan.title, "负责人": plan.responsible_person or ""}
    )

    return plan


@router.get("/{plan_id}/status-logs", response_model=StatusChangeLogListResponse)
def get_rectification_status_logs(
    plan_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs, total = StatusFlowService.get_status_history(db, "rectification_plan", plan_id, skip, limit)
    return StatusChangeLogListResponse(total=total, items=logs)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rectification_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    plan = db.query(RectificationPlan).filter(RectificationPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="整改计划不存在")

    db.delete(plan)
    db.commit()
