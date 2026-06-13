from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models import (
    TemperatureAlert, TemperatureAlertStatus, AlertHistory,
    TemperatureRecord, ReplenishmentOrder, User, RoleEnum, Store,
)
from app.schemas import (
    TemperatureAlertResponse, TemperatureAlertUpdate, TemperatureAlertAck,
    AlertHistoryResponse,
)

router = APIRouter(prefix="/api/alerts", tags=["温度异常"])


def _add_history(
    db: Session,
    alert_id: int,
    from_status: Optional[TemperatureAlertStatus],
    to_status: TemperatureAlertStatus,
    action: str,
    note: Optional[str],
    operator_id: Optional[int],
):
    history = AlertHistory(
        alert_id=alert_id,
        from_status=from_status,
        to_status=to_status,
        action=action,
        note=note,
        operator_id=operator_id,
    )
    db.add(history)


@router.get("", response_model=dict)
def list_alerts(
    status: Optional[TemperatureAlertStatus] = Query(None),
    severity: Optional[str] = Query(None),
    order_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TemperatureAlert).join(ReplenishmentOrder).join(Store)
    if status:
        q = q.filter(TemperatureAlert.status == status)
    if severity:
        q = q.filter(TemperatureAlert.severity == severity)
    if order_id:
        q = q.filter(TemperatureAlert.order_id == order_id)
    total = q.count()
    alerts = (
        q.order_by(TemperatureAlert.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"total": total, "page": page, "page_size": page_size, "items": alerts}


@router.get("/{alert_id}", response_model=TemperatureAlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge", response_model=TemperatureAlertResponse)
def acknowledge_alert(
    alert_id: int,
    ack_in: TemperatureAlertAck,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status not in [TemperatureAlertStatus.OPEN, TemperatureAlertStatus.ACKNOWLEDGED]:
        raise HTTPException(status_code=400, detail=f"Cannot acknowledge alert in status: {alert.status.value}")
    old_status = alert.status
    alert.status = TemperatureAlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    _add_history(
        db, alert.id, old_status, TemperatureAlertStatus.ACKNOWLEDGED,
        "acknowledge", ack_in.note, current_user.id,
    )
    db.commit()
    return alert


@router.post("/{alert_id}/start-processing", response_model=TemperatureAlertResponse)
def start_processing_alert(
    alert_id: int,
    ack_in: TemperatureAlertAck,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.QC, RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status not in [TemperatureAlertStatus.OPEN, TemperatureAlertStatus.ACKNOWLEDGED]:
        raise HTTPException(status_code=400, detail=f"Cannot start processing alert in status: {alert.status.value}")
    old_status = alert.status
    alert.status = TemperatureAlertStatus.PROCESSING
    alert.handled_by = current_user.id
    alert.handled_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    _add_history(
        db, alert.id, old_status, TemperatureAlertStatus.PROCESSING,
        "start_processing", ack_in.note, current_user.id,
    )
    db.commit()
    return alert


@router.post("/{alert_id}/resolve", response_model=TemperatureAlertResponse)
def resolve_alert(
    alert_id: int,
    update_in: TemperatureAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.QC, RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status not in [TemperatureAlertStatus.PROCESSING, TemperatureAlertStatus.ACKNOWLEDGED]:
        raise HTTPException(status_code=400, detail=f"Cannot resolve alert in status: {alert.status.value}")
    old_status = alert.status
    alert.status = TemperatureAlertStatus.RESOLVED
    if update_in.resolution:
        alert.resolution = update_in.resolution
    db.commit()
    db.refresh(alert)
    _add_history(
        db, alert.id, old_status, TemperatureAlertStatus.RESOLVED,
        "resolve", update_in.resolution, current_user.id,
    )
    db.commit()
    return alert


@router.post("/{alert_id}/close", response_model=TemperatureAlertResponse)
def close_alert(
    alert_id: int,
    update_in: TemperatureAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.QC, RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status != TemperatureAlertStatus.RESOLVED:
        raise HTTPException(status_code=400, detail=f"Only resolved alerts can be closed, current: {alert.status.value}")
    old_status = alert.status
    alert.status = TemperatureAlertStatus.CLOSED
    alert.closed_at = datetime.utcnow()
    if update_in.resolution:
        alert.resolution = update_in.resolution
    db.commit()
    db.refresh(alert)
    _add_history(
        db, alert.id, old_status, TemperatureAlertStatus.CLOSED,
        "close", update_in.resolution, current_user.id,
    )
    db.commit()
    return alert


@router.patch("/{alert_id}", response_model=TemperatureAlertResponse)
def update_alert(
    alert_id: int,
    update_in: TemperatureAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if update_in.description:
        alert.description = update_in.description
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/{alert_id}/history", response_model=list[AlertHistoryResponse])
def get_alert_history(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(TemperatureAlert).filter(TemperatureAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return (
        db.query(AlertHistory)
        .filter(AlertHistory.alert_id == alert_id)
        .order_by(AlertHistory.created_at.asc())
        .all()
    )
