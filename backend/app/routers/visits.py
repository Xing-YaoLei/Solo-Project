from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.visit import VisitRecord
from app.models.elder import Elder
from app.schemas.visit import VisitRecordCreate, VisitRecordUpdate, VisitRecordResponse
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(tags=["探访记录"])


@router.get("/api/elders/{elder_id}/visits", response_model=PaginatedResponse)
async def get_visit_records(
    elder_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    visit_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    query = db.query(VisitRecord).filter(VisitRecord.elder_id == elder_id)

    if visit_type:
        query = query.filter(VisitRecord.visit_type == visit_type)
    if status:
        query = query.filter(VisitRecord.status == status)

    total = query.count()
    items = query.order_by(VisitRecord.visit_date.desc(), VisitRecord.visit_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("/api/elders/{elder_id}/visits", response_model=VisitRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_visit_record(
    elder_id: int,
    visit_in: VisitRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    db_visit = VisitRecord(**visit_in.model_dump(), visitor_id=current_user.id)
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("visit_record", db_visit.id, {
        "elder_id": elder_id,
        "visit_date": str(db_visit.visit_date),
        "visit_type": db_visit.visit_type,
        "visitor_name": db_visit.visitor_name,
        "status": db_visit.status
    })

    return db_visit


@router.get("/api/visits/{id}", response_model=VisitRecordResponse)
async def get_visit_record(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_visit = db.query(VisitRecord).filter(VisitRecord.id == id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="探访记录不存在")
    return db_visit


@router.put("/api/visits/{id}", response_model=VisitRecordResponse)
async def update_visit_record(
    id: int,
    visit_in: VisitRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_visit = db.query(VisitRecord).filter(VisitRecord.id == id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="探访记录不存在")

    old_data = {
        "visit_date": str(db_visit.visit_date),
        "visit_type": db_visit.visit_type,
        "visitor_name": db_visit.visitor_name,
        "status": db_visit.status
    }

    update_data = visit_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_visit, key, value)

    db.commit()
    db.refresh(db_visit)

    new_data = {
        "visit_date": str(db_visit.visit_date),
        "visit_type": db_visit.visit_type,
        "visitor_name": db_visit.visitor_name,
        "status": db_visit.status
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("visit_record", db_visit.id, old_data, new_data)

    return db_visit


@router.delete("/api/visits/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit_record(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_visit = db.query(VisitRecord).filter(VisitRecord.id == id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="探访记录不存在")

    old_data = {
        "id": db_visit.id,
        "elder_id": db_visit.elder_id,
        "visit_date": str(db_visit.visit_date),
        "visit_type": db_visit.visit_type
    }

    db.delete(db_visit)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("visit_record", id, old_data)

    return None
