from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User
from app.schemas import (
    DispatchRule, DispatchRuleCreate, DispatchRuleUpdate, DashboardStats
)
from app.services import dispatch_service, work_order_service
from app.api.deps import get_current_active_admin

router = APIRouter(tags=["管理"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    stats = work_order_service.get_dashboard_stats(db)
    return stats


@router.get("/dispatch-rules", response_model=dict)
def list_dispatch_rules(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    rules, total = dispatch_service.get_dispatch_rules(db, skip=skip, limit=limit)
    return {"items": rules, "total": total, "page": skip // limit + 1, "page_size": limit}


@router.post("/dispatch-rules", response_model=DispatchRule, status_code=201)
def create_dispatch_rule(
    rule_in: DispatchRuleCreate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    rule = dispatch_service.create_dispatch_rule(db, rule_in)
    return rule


@router.put("/dispatch-rules/{rule_id}", response_model=DispatchRule)
def update_dispatch_rule(
    rule_id: int,
    rule_in: DispatchRuleUpdate,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    rule = dispatch_service.update_dispatch_rule(db, rule_id, rule_in)
    if not rule:
        raise HTTPException(status_code=404, detail="派工规则不存在")
    return rule


@router.delete("/dispatch-rules/{rule_id}")
def delete_dispatch_rule(
    rule_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    success = dispatch_service.delete_dispatch_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="派工规则不存在")
    return {"success": True}
