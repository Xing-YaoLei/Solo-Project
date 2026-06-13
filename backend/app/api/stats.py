from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models import (
    ReplenishmentOrder, ReplenishmentStatus, TemperatureAlert,
    TemperatureAlertStatus, Discrepancy, Store, User, RoleEnum,
)
from app.schemas import (
    StatsTemperatureRate, StatsTemperatureDrillDown,
)

router = APIRouter(prefix="/api/stats", tags=["统计分析"])


@router.get("/temperature-rate", response_model=list[StatsTemperatureRate])
def get_temperature_qualified_rate(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    store_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not date_from:
        date_from = (datetime.utcnow() - timedelta(days=14)).date()
    if not date_to:
        date_to = datetime.utcnow().date()
    result = []
    cur = date_from
    while cur <= date_to:
        q = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.planned_date == cur)
        if store_id:
            q = q.filter(ReplenishmentOrder.store_id == store_id)
        total_orders = q.count()
        alert_subq = (
            db.query(TemperatureAlert.order_id)
            .filter(TemperatureAlert.alert_type == "temperature_breach")
            .distinct()
            .subquery()
        )
        qualified_orders = (
            q.filter(~ReplenishmentOrder.id.in_(db.query(alert_subq)))
            .count()
        )
        rate = qualified_orders / total_orders if total_orders > 0 else 1.0
        result.append(StatsTemperatureRate(
            date=cur,
            total_orders=total_orders,
            qualified_orders=qualified_orders,
            rate=rate,
        ))
        cur += timedelta(days=1)
    return result


@router.get("/temperature-drilldown", response_model=list[StatsTemperatureDrillDown])
def drill_down_temperature_alerts(
    target_date: Optional[date] = Query(None),
    store_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not target_date:
        target_date = datetime.utcnow().date()
    q = (
        db.query(
            ReplenishmentOrder.id,
            ReplenishmentOrder.order_no,
            Store.name.label("store_name"),
            func.max(TemperatureAlert.actual_temp).label("max_temp"),
            func.min(TemperatureAlert.actual_temp).label("min_temp"),
            func.count(TemperatureAlert.id).label("alert_count"),
            ReplenishmentOrder.status,
        )
        .outerjoin(TemperatureAlert, TemperatureAlert.order_id == ReplenishmentOrder.id)
        .join(Store, Store.id == ReplenishmentOrder.store_id)
        .filter(ReplenishmentOrder.planned_date == target_date)
    )
    if store_id:
        q = q.filter(ReplenishmentOrder.store_id == store_id)
    q = q.group_by(
        ReplenishmentOrder.id,
        ReplenishmentOrder.order_no,
        Store.name,
        ReplenishmentOrder.status,
    ).having(func.count(TemperatureAlert.id) > 0).order_by(func.count(TemperatureAlert.id).desc())
    rows = q.all()
    return [
        StatsTemperatureDrillDown(
            order_id=r.id,
            order_no=r.order_no,
            store_name=r.store_name,
            max_temp=r.max_temp,
            min_temp=r.min_temp,
            alert_count=r.alert_count,
            status=r.status,
        )
        for r in rows
    ]


@router.get("/overview")
def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.utcnow().date()
    total_today = (
        db.query(ReplenishmentOrder).filter(ReplenishmentOrder.planned_date == today).count()
    )
    in_transit = (
        db.query(ReplenishmentOrder)
        .filter(ReplenishmentOrder.status == ReplenishmentStatus.IN_TRANSIT)
        .count()
    )
    pending_qc = (
        db.query(ReplenishmentOrder)
        .filter(ReplenishmentOrder.status.in_([
            ReplenishmentStatus.ARRIVED, ReplenishmentStatus.QC_PENDING,
        ])).count()
    )
    open_alerts = (
        db.query(TemperatureAlert)
        .filter(TemperatureAlert.status.in_([
            TemperatureAlertStatus.OPEN,
            TemperatureAlertStatus.ACKNOWLEDGED,
            TemperatureAlertStatus.PROCESSING,
        ])).count()
    )
    unresolved_discrepancies = (
        db.query(Discrepancy).filter(Discrepancy.resolved == False).count()
    )
    status_counts = dict(
        db.query(ReplenishmentOrder.status, func.count(ReplenishmentOrder.id))
        .filter(ReplenishmentOrder.planned_date >= today - timedelta(days=7))
        .group_by(ReplenishmentOrder.status)
        .all()
    )
    return {
        "today": {
            "date": today.isoformat(),
            "total_orders": total_today,
            "in_transit": in_transit,
            "pending_qc": pending_qc,
        },
        "alerts": {
            "open_count": open_alerts,
        },
        "discrepancies": {
            "unresolved_count": unresolved_discrepancies,
        },
        "status_distribution_7d": {
            k.value if hasattr(k, "value") else str(k): v
            for k, v in status_counts.items()
        },
    }


@router.get("/by-store")
def get_stats_by_store(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not date_from:
        date_from = (datetime.utcnow() - timedelta(days=30)).date()
    if not date_to:
        date_to = datetime.utcnow().date()
    q = (
        db.query(
            Store.id,
            Store.code,
            Store.name,
            func.count(ReplenishmentOrder.id).label("total_orders"),
            func.count(TemperatureAlert.id).label("alert_count"),
        )
        .select_from(Store)
        .outerjoin(ReplenishmentOrder, and_(
            ReplenishmentOrder.store_id == Store.id,
            ReplenishmentOrder.planned_date >= date_from,
            ReplenishmentOrder.planned_date <= date_to,
        ))
        .outerjoin(TemperatureAlert, TemperatureAlert.order_id == ReplenishmentOrder.id)
        .group_by(Store.id, Store.code, Store.name)
        .order_by(func.count(ReplenishmentOrder.id).desc())
    )
    rows = q.all()
    return [
        {
            "store_id": r.id,
            "store_code": r.code,
            "store_name": r.name,
            "total_orders": r.total_orders,
            "alert_count": r.alert_count,
            "temperature_rate": (r.total_orders - (1 if r.alert_count > 0 else 0)) / r.total_orders if r.total_orders > 0 else 1.0,
        }
        for r in rows
    ]
