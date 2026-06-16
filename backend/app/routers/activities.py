from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.activity import Activity, ActivitySignIn
from app.models.elder import Elder
from app.schemas.activity import (
    ActivityCreate, ActivityUpdate, ActivityResponse,
    ActivitySignInCreate, ActivitySignInUpdate, ActivitySignInResponse
)
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(tags=["活动与签到"])


@router.get("/api/activities", response_model=PaginatedResponse)
async def get_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Activity)

    if keyword:
        query = query.filter(Activity.name.contains(keyword) | Activity.location.contains(keyword))
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    if status:
        query = query.filter(Activity.status == status)

    total = query.count()
    items = query.order_by(Activity.activity_date.desc(), Activity.start_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("/api/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = Activity(**activity_in.model_dump(), created_by=current_user.id)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("activity", db_activity.id, {
        "name": db_activity.name,
        "activity_type": db_activity.activity_type,
        "activity_date": str(db_activity.activity_date),
        "status": db_activity.status
    })

    return db_activity


@router.get("/api/activities/{id}", response_model=ActivityResponse)
async def get_activity(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = db.query(Activity).filter(Activity.id == id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    return db_activity


@router.put("/api/activities/{id}", response_model=ActivityResponse)
async def update_activity(
    id: int,
    activity_in: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = db.query(Activity).filter(Activity.id == id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    old_data = {
        "name": db_activity.name,
        "activity_type": db_activity.activity_type,
        "activity_date": str(db_activity.activity_date),
        "status": db_activity.status
    }

    update_data = activity_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_activity, key, value)

    db.commit()
    db.refresh(db_activity)

    new_data = {
        "name": db_activity.name,
        "activity_type": db_activity.activity_type,
        "activity_date": str(db_activity.activity_date),
        "status": db_activity.status
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("activity", db_activity.id, old_data, new_data)

    return db_activity


@router.delete("/api/activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = db.query(Activity).filter(Activity.id == id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    old_data = {
        "id": db_activity.id,
        "name": db_activity.name,
        "activity_date": str(db_activity.activity_date)
    }

    db.delete(db_activity)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("activity", id, old_data)

    return None


@router.post("/api/activities/{activity_id}/sign-in", response_model=ActivitySignInResponse, status_code=status.HTTP_201_CREATED)
async def sign_in_activity(
    activity_id: int,
    sign_in_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    elder_id = sign_in_data.get("elder_id")
    if not elder_id:
        raise HTTPException(status_code=400, detail="elder_id不能为空")

    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    existing = db.query(ActivitySignIn).filter(
        ActivitySignIn.activity_id == activity_id,
        ActivitySignIn.elder_id == elder_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该老人已签到")

    sign_in = ActivitySignIn(
        activity_id=activity_id,
        elder_id=elder_id,
        sign_in_time=datetime.utcnow(),
        sign_in_by_id=current_user.id,
        participation_status=sign_in_data.get("participation_status", "signed_in"),
        health_before=sign_in_data.get("health_before"),
        remark=sign_in_data.get("remark")
    )
    db.add(sign_in)
    db.commit()
    db.refresh(sign_in)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("activity_sign_in", sign_in.id, {
        "activity_id": activity_id,
        "elder_id": elder_id,
        "elder_name": elder.name,
        "sign_in_time": str(sign_in.sign_in_time),
        "participation_status": sign_in.participation_status
    })

    return sign_in


@router.get("/api/activities/{activity_id}/sign-ins", response_model=PaginatedResponse)
async def get_activity_sign_ins(
    activity_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    participation_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not db_activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    query = db.query(ActivitySignIn).filter(ActivitySignIn.activity_id == activity_id)

    if participation_status:
        query = query.filter(ActivitySignIn.participation_status == participation_status)

    total = query.count()
    items = query.order_by(ActivitySignIn.sign_in_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.patch("/api/activity-sign-ins/{id}", response_model=ActivitySignInResponse)
async def update_activity_sign_in(
    id: int,
    sign_in_in: ActivitySignInUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_sign_in = db.query(ActivitySignIn).filter(ActivitySignIn.id == id).first()
    if not db_sign_in:
        raise HTTPException(status_code=404, detail="签到记录不存在")

    old_data = {
        "participation_status": db_sign_in.participation_status,
        "performance_rating": db_sign_in.performance_rating
    }

    update_data = sign_in_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sign_in, key, value)

    db.commit()
    db.refresh(db_sign_in)

    new_data = {
        "participation_status": db_sign_in.participation_status,
        "performance_rating": db_sign_in.performance_rating
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("activity_sign_in", db_sign_in.id, old_data, new_data)

    return db_sign_in
