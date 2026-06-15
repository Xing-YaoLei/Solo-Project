from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database import get_db
from app.models import Notification, User, UserRole, AuditLog, AuditAction
from app.schemas import NotificationResponse, NotificationProcess
from app.security import get_current_user

router = APIRouter()


def _enrich_notification(n: Notification) -> dict:
    n_dict = n.__dict__
    if n.recipient:
        n_dict["recipient_name"] = n.recipient.full_name
    return n_dict


@router.get("", response_model=dict)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    is_read: Optional[bool] = None,
    is_processed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).options(selectinload(Notification.recipient)).where(Notification.recipient_id == current_user.id)
    count_query = select(func.count(Notification.id)).where(Notification.recipient_id == current_user.id)

    if type:
        query = query.where(Notification.type == type)
        count_query = count_query.where(Notification.type == type)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        count_query = count_query.where(Notification.is_read == is_read)
    if is_processed is not None:
        query = query.where(Notification.is_processed == is_processed)
        count_query = count_query.where(Notification.is_processed == is_processed)

    total = (await db.execute(count_query)).scalar_one()
    query = query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    notifications = result.scalars().all()

    return {
        "data": [_enrich_notification(n) for n in notifications],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
    )).scalar_one()
    return {"unread_count": count}


@router.get("/{notif_id}", response_model=NotificationResponse)
async def get_notification(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notification).options(selectinload(Notification.recipient)).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="通知不存在")
    if notif.recipient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="无权查看此通知")
    notif.is_read = True
    await db.commit()
    return _enrich_notification(notif)


@router.post("/{notif_id}/process", response_model=NotificationResponse)
async def process_notification(
    notif_id: int,
    data: NotificationProcess,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Notification).options(selectinload(Notification.recipient)).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="通知不存在")
    if notif.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权处理此通知")

    notif.is_read = True
    notif.is_processed = True
    notif.action_taken = data.action_taken
    if data.close:
        notif.closed_at = datetime.utcnow()

    audit_log = AuditLog(
        action=AuditAction.NOTIFY,
        entity_type="notification",
        entity_id=notif.id,
        review_id=notif.review_id,
        operator_id=current_user.id,
        reason=notif.reason,
        action_taken=data.action_taken,
        closed_at=notif.closed_at,
    )
    db.add(audit_log)
    await db.commit()
    await db.refresh(notif)
    return _enrich_notification(notif)


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()
    return {"message": f"已标记 {len(notifications)} 条通知为已读"}
