from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.elder import Elder
from app.schemas.elder import ElderCreate, ElderUpdate, ElderResponse, ElderStatusUpdate
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(prefix="/api/elders", tags=["老人档案"])


@router.get("", response_model=PaginatedResponse)
async def get_elders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    health_status: Optional[str] = None,
    care_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Elder)

    if keyword:
        query = query.filter(Elder.name.contains(keyword) | Elder.id_card.contains(keyword) | Elder.phone.contains(keyword))
    if status:
        query = query.filter(Elder.status == status)
    if health_status:
        query = query.filter(Elder.health_status == health_status)
    if care_level:
        query = query.filter(Elder.care_level == care_level)

    total = query.count()
    items = query.order_by(Elder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.get("/{id}", response_model=ElderResponse)
async def get_elder(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")
    return elder


@router.post("", response_model=ElderResponse, status_code=status.HTTP_201_CREATED)
async def create_elder(
    elder_in: ElderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    existing = db.query(Elder).filter(Elder.id_card == elder_in.id_card).first()
    if existing:
        raise HTTPException(status_code=400, detail="身份证号已存在")

    db_elder = Elder(**elder_in.model_dump(), created_by=current_user.id)
    db.add(db_elder)
    db.commit()
    db.refresh(db_elder)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("elder", db_elder.id, {
        "name": db_elder.name,
        "id_card": db_elder.id_card,
        "status": db_elder.status
    })

    return db_elder


@router.put("/{id}", response_model=ElderResponse)
async def update_elder(
    id: int,
    elder_in: ElderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_elder = db.query(Elder).filter(Elder.id == id).first()
    if not db_elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    old_data = {
        "name": db_elder.name,
        "gender": db_elder.gender,
        "birth_date": str(db_elder.birth_date) if db_elder.birth_date else None,
        "phone": db_elder.phone,
        "health_status": db_elder.health_status,
        "care_level": db_elder.care_level,
        "status": db_elder.status
    }

    update_data = elder_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_elder, key, value)

    db.commit()
    db.refresh(db_elder)

    new_data = {
        "name": db_elder.name,
        "gender": db_elder.gender,
        "birth_date": str(db_elder.birth_date) if db_elder.birth_date else None,
        "phone": db_elder.phone,
        "health_status": db_elder.health_status,
        "care_level": db_elder.care_level,
        "status": db_elder.status
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("elder", db_elder.id, old_data, new_data)

    return db_elder


@router.patch("/{id}/status", response_model=ElderResponse)
async def update_elder_status(
    id: int,
    status_in: ElderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_elder = db.query(Elder).filter(Elder.id == id).first()
    if not db_elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    old_status = db_elder.status
    db_elder.status = status_in.status

    db.commit()
    db.refresh(db_elder)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_status_change("elder", db_elder.id, old_status, status_in.status, remark=status_in.remark)

    return db_elder


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_elder(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_elder = db.query(Elder).filter(Elder.id == id).first()
    if not db_elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    old_data = {
        "id": db_elder.id,
        "name": db_elder.name,
        "id_card": db_elder.id_card
    }

    db.delete(db_elder)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("elder", id, old_data)

    return None
