from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db, model_to_dict
from app.models import AdvisorQuota, AdvisorQuotaChange, User, UserRole, Notification, NotificationType, AuditLog, AuditAction
from app.schemas import AdvisorQuotaCreate, AdvisorQuotaUpdate, AdvisorQuotaResponse, AdvisorQuotaChangeResponse
from app.security import get_current_user, require_roles

router = APIRouter()


def _enrich_quota(q: AdvisorQuota) -> dict:
    q_dict = model_to_dict(q)
    if q.advisor:
        q_dict["advisor_name"] = q.advisor.full_name
    q_dict["remaining_quota"] = q.max_quota - q.current_assigned
    return q_dict


async def _record_quota_change(db: AsyncSession, quota: AdvisorQuota, old_max: int, new_max: int, changed_by_id: int, reason: str = None):
    change = AdvisorQuotaChange(
        quota_id=quota.id,
        old_value=old_max,
        new_value=new_max,
        changed_by_id=changed_by_id,
        reason=reason,
    )
    db.add(change)

    if quota.advisor_id:
        from app.api.reviews import _create_notification
        await _create_notification(
            db, quota.advisor_id, None, NotificationType.ADVISOR_QUOTA_CHANGED,
            "导师名额变更通知",
            f"您的导师名额已从 {old_max} 变更为 {new_max}。\n原因: {reason or '未说明'}",
            reason=reason or "名额调整",
        )

    from app.api.reviews import _add_audit_log
    await _add_audit_log(
        db, AuditAction.UPDATE, "advisor_quota", quota.id, None, changed_by_id,
        old_values={"max_quota": old_max}, new_values={"max_quota": new_max},
        reason=reason, action_taken=f"名额变更 {old_max} -> {new_max}"
    )


@router.get("", response_model=dict)
async def list_quotas(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    semester: Optional[str] = None,
    advisor_id: Optional[int] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AdvisorQuota).options(selectinload(AdvisorQuota.advisor))
    count_query = select(func.count(AdvisorQuota.id))

    if semester:
        query = query.where(AdvisorQuota.semester == semester)
        count_query = count_query.where(AdvisorQuota.semester == semester)
    if advisor_id:
        query = query.where(AdvisorQuota.advisor_id == advisor_id)
        count_query = count_query.where(AdvisorQuota.advisor_id == advisor_id)
    if department:
        query = query.where(AdvisorQuota.department == department)
        count_query = count_query.where(AdvisorQuota.department == department)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(AdvisorQuota.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    quotas = result.scalars().all()

    return {
        "data": [_enrich_quota(q) for q in quotas],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/{quota_id}", response_model=AdvisorQuotaResponse)
async def get_quota(
    quota_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdvisorQuota).options(selectinload(AdvisorQuota.advisor)).where(AdvisorQuota.id == quota_id))
    quota = result.scalar_one_or_none()
    if not quota:
        raise HTTPException(status_code=404, detail="导师名额不存在")
    return _enrich_quota(quota)


@router.get("/{quota_id}/history", response_model=list[AdvisorQuotaChangeResponse])
async def get_quota_history(
    quota_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdvisorQuotaChange).options(selectinload(AdvisorQuotaChange.changed_by)).where(AdvisorQuotaChange.quota_id == quota_id).order_by(AdvisorQuotaChange.changed_at.desc())
    )
    changes = result.scalars().all()
    resp = []
    for c in changes:
        c_dict = model_to_dict(c)
        if c.changed_by:
            c_dict["changed_by_name"] = c.changed_by.full_name
        resp.append(c_dict)
    return resp


@router.post("", response_model=AdvisorQuotaResponse)
async def create_quota(
    data: AdvisorQuotaCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS)),
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(
        select(AdvisorQuota).where(
            AdvisorQuota.advisor_id == data.advisor_id,
            AdvisorQuota.semester == data.semester,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="该导师本学期名额已存在")
    quota = AdvisorQuota(**data.model_dump())
    db.add(quota)
    await db.commit()
    await db.refresh(quota)
    return _enrich_quota(quota)


@router.put("/{quota_id}", response_model=AdvisorQuotaResponse)
async def update_quota(
    quota_id: int,
    data: AdvisorQuotaUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.STUDENT_AFFAIRS)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdvisorQuota).options(selectinload(AdvisorQuota.advisor)).where(AdvisorQuota.id == quota_id))
    quota = result.scalar_one_or_none()
    if not quota:
        raise HTTPException(status_code=404, detail="导师名额不存在")

    old_max = quota.max_quota
    update_data = data.model_dump(exclude_unset=True)
    reason = update_data.pop("reason", None)

    for key, value in update_data.items():
        setattr(quota, key, value)

    new_max = update_data.get("max_quota", old_max)
    if new_max != old_max:
        await _record_quota_change(db, quota, old_max, new_max, current_user.id, reason)

    await db.commit()
    await db.refresh(quota)
    return _enrich_quota(quota)


@router.delete("/{quota_id}")
async def delete_quota(
    quota_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdvisorQuota).where(AdvisorQuota.id == quota_id))
    quota = result.scalar_one_or_none()
    if not quota:
        raise HTTPException(status_code=404, detail="导师名额不存在")
    await db.delete(quota)
    await db.commit()
    return {"message": "删除成功"}
