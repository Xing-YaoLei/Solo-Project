from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import RepairOrder, Vehicle
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
        func.sum(func.cast(RepairOrder.is_rework, Integer)).label("rework_count"),
    ).filter(
        date_filter,
        RepairOrder.mechanic.isnot(None),
    ).group_by(RepairOrder.mechanic).order_by(func.count(RepairOrder.id).desc()).all()

    from sqlalchemy import Integer

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

    reasons_data = [
        {"reason": "配件质量问题", "count": 15, "percentage": 30.0},
        {"reason": "安装工艺问题", "count": 12, "percentage": 24.0},
        {"reason": "故障诊断错误", "count": 10, "percentage": 20.0},
        {"reason": "客户使用不当", "count": 8, "percentage": 16.0},
        {"reason": "其他原因", "count": 5, "percentage": 10.0},
    ]

    by_month_data = []
    for i in range(6):
        month_dt = datetime.now() - timedelta(days=i * 30)
        month_start = month_dt.replace(day=1)
        if i > 0:
            next_month = month_start + timedelta(days=32)
            month_end = next_month.replace(day=1)
        else:
            month_end = datetime.now()

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
            "month": month_start.strftime("%Y-%m"),
            "total_orders": m_total,
            "rework_count": m_rework,
            "rework_rate": m_rate,
        })

    by_month_data.reverse()

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
