from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.risk import RiskEvent
from app.models.elder import Elder
from app.schemas.risk import RiskEventCreate, RiskEventUpdate, RiskEventResponse
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(prefix="/api/risk-events", tags=["风险事件"])


@router.get("", response_model=PaginatedResponse)
async def get_risk_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = None,
    event_level: Optional[str] = None,
    status: Optional[str] = None,
    elder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(RiskEvent)

    if elder_id:
        query = query.filter(RiskEvent.elder_id == elder_id)
    if event_type:
        query = query.filter(RiskEvent.event_type == event_type)
    if event_level:
        query = query.filter(RiskEvent.event_level == event_level)
    if status:
        query = query.filter(RiskEvent.status == status)

    total = query.count()
    items = query.order_by(RiskEvent.event_date.desc(), RiskEvent.event_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("", response_model=RiskEventResponse, status_code=status.HTTP_201_CREATED)
async def create_risk_event(
    risk_in: RiskEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == risk_in.elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    db_risk = RiskEvent(**risk_in.model_dump(), reported_by_id=current_user.id)
    db.add(db_risk)
    db.commit()
    db.refresh(db_risk)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("risk_event", db_risk.id, {
        "elder_id": risk_in.elder_id,
        "elder_name": elder.name,
        "event_type": db_risk.event_type,
        "event_level": db_risk.event_level,
        "event_date": str(db_risk.event_date),
        "status": db_risk.status
    })

    return db_risk


@router.get("/{id}", response_model=RiskEventResponse)
async def get_risk_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_risk = db.query(RiskEvent).filter(RiskEvent.id == id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险事件不存在")
    return db_risk


@router.put("/{id}", response_model=RiskEventResponse)
async def update_risk_event(
    id: int,
    risk_in: RiskEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_risk = db.query(RiskEvent).filter(RiskEvent.id == id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险事件不存在")

    old_data = {
        "event_type": db_risk.event_type,
        "event_level": db_risk.event_level,
        "event_date": str(db_risk.event_date),
        "status": db_risk.status
    }

    update_data = risk_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_risk, key, value)

    db.commit()
    db.refresh(db_risk)

    new_data = {
        "event_type": db_risk.event_type,
        "event_level": db_risk.event_level,
        "event_date": str(db_risk.event_date),
        "status": db_risk.status
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("risk_event", db_risk.id, old_data, new_data)

    return db_risk


@router.patch("/{id}/status", response_model=RiskEventResponse)
async def update_risk_event_status(
    id: int,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_risk = db.query(RiskEvent).filter(RiskEvent.id == id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险事件不存在")

    old_status = db_risk.status
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="状态字段不能为空")

    db_risk.status = new_status
    db.commit()
    db.refresh(db_risk)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_status_change("risk_event", db_risk.id, old_status, new_status,
                                    remark=status_data.get("remark"))

    return db_risk


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_risk_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_risk = db.query(RiskEvent).filter(RiskEvent.id == id).first()
    if not db_risk:
        raise HTTPException(status_code=404, detail="风险事件不存在")

    old_data = {
        "id": db_risk.id,
        "elder_id": db_risk.elder_id,
        "event_type": db_risk.event_type,
        "event_date": str(db_risk.event_date)
    }

    db.delete(db_risk)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("risk_event", id, old_data)

    return None
