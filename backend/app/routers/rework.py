from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import RepairOrder, Vehicle, RepairOrderStatus
from ..schemas import ReworkStats

router = APIRouter()


@router.get("/stats", response_model=ReworkStats)
def get_rework_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    date_filter = and_(
        RepairOrder.created_at >= start_dt,
        RepairOrder.created_at < end_dt,
    )

    total_orders = db.query(func.count(RepairOrder.id)).filter(date_filter).scalar() or 0
    rework_orders = db.query(func.count(RepairOrder.id)).filter(
        date_filter,
        RepairOrder.is_rework == True,
    ).scalar() or 0
    rework_rate = round(rework_orders / total_orders * 100, 2) if total_orders > 0 else 0.0

    rework_amount = db.query(func.coalesce(func.sum(RepairOrder.actual_amount), 0)).filter(
        date_filter,
        RepairOrder.is_rework == True,
    ).scalar() or 0

    by_mechanic_result = db.query(
        RepairOrder.mechanic,
        func.count(RepairOrder.id).label("total"),
        func.sum(case(
            (RepairOrder.is_rework == True, 1),
            else_=0
        )).label("rework_count"),
    ).filter(
        date_filter,
        RepairOrder.mechanic.isnot(None),
    ).group_by(RepairOrder.mechanic).order_by(func.count(RepairOrder.id).desc()).all()

    by_mechanic = []
    for row in by_mechanic_result:
        total = row.total or 0
        rework = row.rework_count or 0
        rate_val = round(rework / total * 100, 2) if total > 0 else 0
        by_mechanic.append({
            "mechanic": row.mechanic,
            "total_orders": total,
            "rework_count": rework,
            "rework_rate": rate_val,
        })

    by_reason_result = db.query(
        RepairOrder.rework_reason,
        func.count(RepairOrder.id).label("count"),
    ).filter(
        date_filter,
        RepairOrder.is_rework == True,
        RepairOrder.rework_reason.isnot(None),
        RepairOrder.rework_reason != "",
    ).group_by(RepairOrder.rework_reason).order_by(func.count(RepairOrder.id).desc()).all()

    reasons_data = []
    for row in by_reason_result:
        cnt = row.count or 0
        pct = round(cnt / rework_orders * 100, 1) if rework_orders > 0 else 0.0
        reasons_data.append({
            "reason": row.rework_reason,
            "count": cnt,
            "percentage": pct,
        })

    no_reason_count = db.query(func.count(RepairOrder.id)).filter(
        date_filter,
        RepairOrder.is_rework == True,
        (RepairOrder.rework_reason.is_(None) | (RepairOrder.rework_reason == "")),
    ).scalar() or 0
    if no_reason_count > 0:
        reasons_data.append({
            "reason": "原因未记录",
            "count": no_reason_count,
            "percentage": round(no_reason_count / rework_orders * 100, 1) if rework_orders > 0 else 0.0,
        })

    by_month_data = []
    now = datetime.now()
    for i in range(5, -1, -1):
        year = now.year
        month = now.month - i
        if month <= 0:
            month += 12
            year -= 1
        month_start = datetime(year, month, 1)
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        month_end = next_month

        m_total = db.query(func.count(RepairOrder.id)).filter(
            RepairOrder.created_at >= month_start,
            RepairOrder.created_at < month_end,
        ).scalar() or 0
        m_rework = db.query(func.count(RepairOrder.id)).filter(
            RepairOrder.created_at >= month_start,
            RepairOrder.created_at < month_end,
            RepairOrder.is_rework == True,
        ).scalar() or 0
        m_rate = round(m_rework / m_total * 100, 2) if m_total > 0 else 0
        by_month_data.append({
            "month": f"{year}-{month:02d}",
            "total_orders": m_total,
            "rework_count": m_rework,
            "rework_rate": m_rate,
        })

    return ReworkStats(
        total_orders=total_orders,
        rework_orders=rework_orders,
        rework_rate=rework_rate,
        rework_amount=rework_amount,
        by_mechanic=by_mechanic,
        by_reason=reasons_data,
        by_month=by_month_data,
    )


@router.get("/orders")
def get_rework_orders(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    query = db.query(RepairOrder).filter(
        RepairOrder.created_at >= start_dt,
        RepairOrder.created_at < end_dt,
        RepairOrder.is_rework == True,
    ).order_by(RepairOrder.created_at.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "vehicle_plate": o.vehicle_plate,
                "mechanic": o.mechanic,
                "rework_reason": o.rework_reason,
                "actual_amount": o.actual_amount,
                "status": o.status,
                "parent_order_id": o.parent_order_id,
                "created_at": o.created_at,
            }
            for o in items
        ],
    }
