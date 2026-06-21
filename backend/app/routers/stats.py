from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from .. import models
from ..utils.response import success_response

router = APIRouter()


@router.get("/compensate/overview")
def get_compensate_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Appeal).join(models.Order, models.Appeal.order_id == models.Order.id)

    if start_date:
        query = query.filter(models.Appeal.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Appeal.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if handler:
        query = query.filter(models.Appeal.handler == handler)
    if status:
        query = query.filter(models.Appeal.status == status)

    appeals = query.all()

    total_appeals = len(appeals)
    resolved_appeals = [a for a in appeals if a.status == "resolved"]
    total_compensate = sum(a.compensate_amount for a in resolved_appeals)

    late_count = sum(1 for a in appeals if a.appeal_type == "late")
    damage_count = sum(1 for a in appeals if a.appeal_type == "damage")
    lost_count = sum(1 for a in appeals if a.appeal_type == "lost")
    other_count = sum(1 for a in appeals if a.appeal_type not in ["late", "damage", "lost"])

    late_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "late")
    damage_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "damage")
    lost_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type == "lost")
    other_compensate = sum(a.compensate_amount for a in resolved_appeals if a.appeal_type not in ["late", "damage", "lost"])

    order_query = db.query(models.Order)
    if start_date:
        order_query = order_query.filter(models.Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        order_query = order_query.filter(models.Order.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    if area:
        order_query = order_query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if handler:
        order_query = order_query.join(
            models.OrderRejectRecord,
            models.OrderRejectRecord.order_id == models.Order.id
        ).filter(models.OrderRejectRecord.handler == handler)
    total_orders = order_query.count()

    appeal_rate = round(total_appeals / total_orders * 100, 2) if total_orders > 0 else 0

    return success_response({
        "total_orders": total_orders,
        "total_appeals": total_appeals,
        "appeal_rate": appeal_rate,
        "resolved_count": len(resolved_appeals),
        "total_compensate": round(total_compensate, 2),
        "type_distribution": {
            "late": {"count": late_count, "compensate": round(late_compensate, 2)},
            "damage": {"count": damage_count, "compensate": round(damage_compensate, 2)},
            "lost": {"count": lost_count, "compensate": round(lost_compensate, 2)},
            "other": {"count": other_count, "compensate": round(other_compensate, 2)},
        }
    })


@router.get("/compensate/by-area")
def get_compensate_by_area(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        models.Order.pickup_area,
        func.count(models.Appeal.id).label('appeal_count'),
        func.sum(models.Appeal.compensate_amount).label('compensate_amount')
    ).join(models.Order, models.Appeal.order_id == models.Order.id)

    if status:
        query = query.filter(models.Appeal.status == status)
    else:
        query = query.filter(models.Appeal.status == "resolved")

    if start_date:
        query = query.filter(models.Appeal.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Appeal.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if handler:
        query = query.filter(models.Appeal.handler == handler)

    results = query.group_by(models.Order.pickup_area).all()

    area_stats = []
    for area, appeal_count, compensate_amount in results:
        if area:
            area_stats.append({
                "area": area,
                "appeal_count": appeal_count,
                "compensate_amount": round(compensate_amount or 0, 2)
            })

    area_stats.sort(key=lambda x: x["compensate_amount"], reverse=True)

    return success_response(area_stats)


@router.get("/compensate/by-handler")
def get_compensate_by_handler(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        models.Appeal.handler,
        func.count(models.Appeal.id).label('handle_count'),
        func.sum(models.Appeal.compensate_amount).label('compensate_amount')
    ).join(models.Order, models.Appeal.order_id == models.Order.id)

    if status:
        query = query.filter(models.Appeal.status == status)
    else:
        query = query.filter(models.Appeal.status == "resolved")

    if start_date:
        query = query.filter(models.Appeal.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(models.Appeal.created_at <= datetime.fromisoformat(end_date) + timedelta(days=1))
    if area:
        query = query.filter(
            (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
        )
    if handler:
        query = query.filter(models.Appeal.handler == handler)

    results = query.group_by(models.Appeal.handler).all()

    handler_stats = []
    for handler, handle_count, compensate_amount in results:
        if handler:
            handler_stats.append({
                "handler": handler,
                "handle_count": handle_count,
                "compensate_amount": round(compensate_amount or 0, 2),
                "avg_compensate": round((compensate_amount or 0) / handle_count, 2) if handle_count > 0 else 0
            })

    handler_stats.sort(key=lambda x: x["compensate_amount"], reverse=True)

    return success_response(handler_stats)


@router.get("/compensate/trend")
def get_compensate_trend(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    days: Optional[int] = 7,
    area: Optional[str] = None,
    handler: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if start_date and end_date:
        trend_start = datetime.fromisoformat(start_date).replace(hour=0, minute=0, second=0, microsecond=0)
        trend_end = datetime.fromisoformat(end_date).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        trend_end = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        trend_start = trend_end - timedelta(days=days - 1)

    trend_data = []
    current = trend_start

    while current <= trend_end:
        day_start = current.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        query = db.query(models.Appeal).join(models.Order, models.Appeal.order_id == models.Order.id)\
            .filter(models.Appeal.created_at >= day_start)\
            .filter(models.Appeal.created_at < day_end)

        if status:
            query = query.filter(models.Appeal.status == status)
        else:
            query = query.filter(models.Appeal.status == "resolved")

        if area:
            query = query.filter(
                (models.Order.pickup_area == area) | (models.Order.delivery_area == area)
            )
        if handler:
            query = query.filter(models.Appeal.handler == handler)

        day_appeals = query.all()
        day_compensate = sum(a.compensate_amount for a in day_appeals)

        trend_data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "appeal_count": len(day_appeals),
            "compensate_amount": round(day_compensate, 2)
        })

        current += timedelta(days=1)

    return success_response(trend_data)


@router.get("/order/status-summary")
def get_order_status_summary(db: Session = Depends(get_db)):
    statuses = [
        models.OrderStatus.PENDING,
        models.OrderStatus.ACCEPTED,
        models.OrderStatus.PICKED,
        models.OrderStatus.DELIVERING,
        models.OrderStatus.DELIVERED,
        models.OrderStatus.COMPLETED,
        models.OrderStatus.REJECTED,
        models.OrderStatus.APPEALED,
        models.OrderStatus.CANCELLED,
        models.OrderStatus.SETTLED,
    ]
    
    result = {}
    for status in statuses:
        count = db.query(models.Order).filter(models.Order.status == status).count()
        result[status.value] = count
    
    return success_response(result)
