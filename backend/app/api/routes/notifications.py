from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Notification, Course, User, NotificationStatus, UserRole
)
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.Notification])
def list_notifications(
    status: Optional[NotificationStatus] = None,
    course_id: Optional[int] = None,
    member_id: Optional[int] = None,
    to_user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification)
    if current_user.role == UserRole.MEMBER:
        query = query.filter(Notification.to_user_id == current_user.id)
    elif current_user.role == UserRole.TRAINER:
        query = query.filter(
            (Notification.to_user_id == current_user.id) |
            (Notification.from_user_id == current_user.id)
        )
    if status:
        query = query.filter(Notification.status == status)
    if course_id:
        query = query.filter(Notification.course_id == course_id)
    if member_id:
        query = query.filter(Notification.member_id == member_id)
    if to_user_id:
        query = query.filter(Notification.to_user_id == to_user_id)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{notification_id}", response_model=schemas.Notification)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    return notification


@router.post("", response_model=schemas.Notification)
def create_notification(
    notification_in: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == notification_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    notification = Notification(**notification_in.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{notification_id}", response_model=schemas.Notification)
def update_notification(
    notification_id: int,
    notification_in: schemas.NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")

    update_data = notification_in.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == NotificationStatus.RESOLVED and notification.status != NotificationStatus.RESOLVED:
            update_data["resolved_at"] = datetime.utcnow()
        if new_status == NotificationStatus.CLOSED and notification.status != NotificationStatus.CLOSED:
            update_data["closed_at"] = datetime.utcnow()
            if "closed_by_id" not in update_data:
                update_data["closed_by_id"] = current_user.id

    for field, value in update_data.items():
        setattr(notification, field, value)

    db.commit()
    db.refresh(notification)
    return notification


@router.post("/{notification_id}/handle", response_model=schemas.Notification)
def handle_notification(
    notification_id: int,
    delay_reason: str,
    action_taken: str,
    close_notification: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")

    notification.delay_reason = delay_reason
    notification.action_taken = action_taken
    notification.status = NotificationStatus.PROCESSING
    notification.resolved_at = datetime.utcnow()

    if close_notification:
        notification.status = NotificationStatus.CLOSED
        notification.closed_at = datetime.utcnow()
        notification.closed_by_id = current_user.id

    db.commit()
    db.refresh(notification)
    return notification


@router.post("/{notification_id}/close", response_model=schemas.Notification)
def close_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    notification.status = NotificationStatus.CLOSED
    notification.closed_at = datetime.utcnow()
    notification.closed_by_id = current_user.id
    db.commit()
    db.refresh(notification)
    return notification
