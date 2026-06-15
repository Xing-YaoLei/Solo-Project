from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models import AuditLog, AuditAction, User
from app.schemas import AuditLogResponse
from app.security import get_current_user, require_roles

router = APIRouter()


def _enrich_audit(a: AuditLog) -> dict:
    a_dict = a.__dict__
    if a.operator:
        a_dict["operator_name"] = a.operator.full_name
    return a_dict


@router.get("", response_model=dict)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    review_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    current_user=Depends(require_roles("admin", "auditor", "student_affairs")),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)
    count_query = select(func.count(AuditLog.id))

    if action:
        try:
            a_enum = AuditAction(action)
            query = query.where(AuditLog.action == a_enum)
            count_query = count_query.where(AuditLog.action == a_enum)
        except ValueError:
            pass
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
        count_query = count_query.where(AuditLog.entity_type == entity_type)
    if review_id:
        query = query.where(AuditLog.review_id == review_id)
        count_query = count_query.where(AuditLog.review_id == review_id)
    if operator_id:
        query = query.where(AuditLog.operator_id == operator_id)
        count_query = count_query.where(AuditLog.operator_id == operator_id)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()

    return {
        "data": [_enrich_audit(a) for a in logs],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/review/{review_id}", response_model=list[AuditLogResponse])
async def get_review_audit(
    review_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).where(AuditLog.review_id == review_id).order_by(AuditLog.created_at.asc())
    )
    logs = result.scalars().all()
    return [_enrich_audit(a) for a in logs]
