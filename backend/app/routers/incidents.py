from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.incident import IncidentOrder
from app.models.risk import RiskEvent
from app.models.elder import Elder
from app.schemas.incident import IncidentOrderCreate, IncidentOrderUpdate, IncidentOrderResponse
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(prefix="/api/incident-orders", tags=["异常单"])


def generate_order_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    prefix = f"INC-{today}-"
    
    last_order = db.query(IncidentOrder).filter(
        IncidentOrder.order_no.like(f"{prefix}%")
    ).order_by(IncidentOrder.order_no.desc()).first()
    
    if last_order:
        last_num = int(last_order.order_no.split("-")[-1])
        new_num = str(last_num + 1).zfill(4)
    else:
        new_num = "0001"
    
    return f"{prefix}{new_num}"


@router.get("", response_model=PaginatedResponse)
async def get_incident_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    elder_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(IncidentOrder)

    if elder_id:
        query = query.filter(IncidentOrder.elder_id == elder_id)
    if incident_type:
        query = query.filter(IncidentOrder.incident_type == incident_type)
    if severity:
        query = query.filter(IncidentOrder.severity == severity)
    if status:
        query = query.filter(IncidentOrder.status == status)

    total = query.count()
    items = query.order_by(IncidentOrder.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("", response_model=IncidentOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_incident_order(
    incident_in: IncidentOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == incident_in.elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    if incident_in.risk_event_id:
        risk_event = db.query(RiskEvent).filter(RiskEvent.id == incident_in.risk_event_id).first()
        if not risk_event:
            raise HTTPException(status_code=404, detail="风险事件不存在")
        existing = db.query(IncidentOrder).filter(
            IncidentOrder.risk_event_id == incident_in.risk_event_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="该风险事件已关联异常单")

    order_no = generate_order_no(db)
    db_incident = IncidentOrder(
        **incident_in.model_dump(),
        order_no=order_no,
        reported_by_id=current_user.id
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("incident_order", db_incident.id, {
        "order_no": order_no,
        "elder_id": incident_in.elder_id,
        "elder_name": elder.name,
        "incident_type": db_incident.incident_type,
        "severity": db_incident.severity,
        "status": db_incident.status
    })

    return db_incident


@router.get("/{id}", response_model=IncidentOrderResponse)
async def get_incident_order(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_incident = db.query(IncidentOrder).filter(IncidentOrder.id == id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return db_incident


@router.put("/{id}", response_model=IncidentOrderResponse)
async def update_incident_order(
    id: int,
    incident_in: IncidentOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_incident = db.query(IncidentOrder).filter(IncidentOrder.id == id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="异常单不存在")

    old_data = {
        "incident_type": db_incident.incident_type,
        "severity": db_incident.severity,
        "status": db_incident.status,
        "handling_result": db_incident.handling_result
    }

    update_data = incident_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_incident, key, value)

    db.commit()
    db.refresh(db_incident)

    new_data = {
        "incident_type": db_incident.incident_type,
        "severity": db_incident.severity,
        "status": db_incident.status,
        "handling_result": db_incident.handling_result
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("incident_order", db_incident.id, old_data, new_data)

    return db_incident


@router.patch("/{id}/status", response_model=IncidentOrderResponse)
async def update_incident_order_status(
    id: int,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_incident = db.query(IncidentOrder).filter(IncidentOrder.id == id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="异常单不存在")

    old_status = db_incident.status
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="状态字段不能为空")

    db_incident.status = new_status
    if new_status == "closed" and not db_incident.closure_date:
        db_incident.closure_date = date.today()

    db.commit()
    db.refresh(db_incident)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_status_change("incident_order", db_incident.id, old_status, new_status,
                                    remark=status_data.get("remark"))

    return db_incident


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident_order(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_incident = db.query(IncidentOrder).filter(IncidentOrder.id == id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="异常单不存在")

    old_data = {
        "id": db_incident.id,
        "order_no": db_incident.order_no,
        "elder_id": db_incident.elder_id,
        "incident_type": db_incident.incident_type
    }

    db.delete(db_incident)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("incident_order", id, old_data)

    return None


@router.post("/api/risk-events/{risk_event_id}/create-incident", response_model=IncidentOrderResponse,
             status_code=status.HTTP_201_CREATED)
async def create_incident_from_risk_event(
    risk_event_id: int,
    incident_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    risk_event = db.query(RiskEvent).filter(RiskEvent.id == risk_event_id).first()
    if not risk_event:
        raise HTTPException(status_code=404, detail="风险事件不存在")

    existing = db.query(IncidentOrder).filter(
        IncidentOrder.risk_event_id == risk_event_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该风险事件已生成异常单")

    elder = db.query(Elder).filter(Elder.id == risk_event.elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    is_fall = risk_event.event_type == "fall"
    severity = "serious" if is_fall else incident_data.get("severity", "serious")
    incident_type = "fall" if is_fall else incident_data.get("incident_type", risk_event.event_type)

    order_no = generate_order_no(db)
    db_incident = IncidentOrder(
        order_no=order_no,
        elder_id=risk_event.elder_id,
        risk_event_id=risk_event_id,
        incident_type=incident_type,
        severity=severity,
        incident_date=risk_event.event_date,
        incident_time=risk_event.event_time,
        location=risk_event.location,
        impact_scope=incident_data.get("impact_scope", ""),
        responsibility=incident_data.get("responsibility", ""),
        responsible_person=incident_data.get("responsible_person"),
        handling_result=incident_data.get("handling_result", ""),
        preventive_measures=incident_data.get("preventive_measures"),
        description=risk_event.description,
        immediate_actions=risk_event.immediate_measures,
        medical_treatment=incident_data.get("medical_treatment"),
        family_notified=incident_data.get("family_notified", "unknown"),
        family_response=incident_data.get("family_response"),
        handled_by=incident_data.get("handled_by"),
        reviewed_by=incident_data.get("reviewed_by"),
        status=incident_data.get("status", "pending"),
        remark=incident_data.get("remark"),
        reported_by_id=current_user.id
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("incident_order", db_incident.id, {
        "order_no": order_no,
        "elder_id": risk_event.elder_id,
        "elder_name": elder.name,
        "incident_type": incident_type,
        "severity": severity,
        "risk_event_id": risk_event_id,
        "from_risk_event": True,
        "status": db_incident.status
    })

    return db_incident
