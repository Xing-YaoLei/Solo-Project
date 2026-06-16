from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.common import PaginatedResponse, AuditLogResponse
from app.utils.audit import AuditLogger

router = APIRouter(prefix="/api/audit-logs", tags=["审计日志"])


@router.get("", response_model=PaginatedResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(AuditLog)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    result_items = []
    for item in items:
        item_dict = {
            "id": item.id,
            "user_id": item.user_id,
            "user_full_name": item.user.full_name if item.user else None,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
            "action": item.action,
            "old_value": item.old_value,
            "new_value": item.new_value,
            "field_name": item.field_name,
            "created_at": item.created_at,
            "remark": item.remark
        }
        result_items.append(item_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result_items
    }


@router.get("/{entity_type}/{entity_id}", response_model=PaginatedResponse)
async def get_entity_audit_history(
    entity_type: str,
    entity_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    )

    if action:
        query = query.filter(AuditLog.action == action)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    result_items = []
    for item in items:
        item_dict = {
            "id": item.id,
            "user_id": item.user_id,
            "user_full_name": item.user.full_name if item.user else None,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
            "action": item.action,
            "old_value": item.old_value,
            "new_value": item.new_value,
            "field_name": item.field_name,
            "created_at": item.created_at,
            "remark": item.remark
        }
        result_items.append(item_dict)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": result_items
    }
