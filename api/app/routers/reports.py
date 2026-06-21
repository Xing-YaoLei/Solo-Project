import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AppealTicket, Order, TodoTicket, User
from app.schemas import DispatchDurationReport, PerformanceReport, ReportFilter

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/dispatch-duration", response_model=dict)
async def dispatch_duration_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    city_code: Optional[str] = None,
    route_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(
        Order.city_code,
        Order.route_type,
        func.avg(
            extract("epoch", Order.completed_at - Order.created_at) / 60
        ).label("avg_dispatch_minutes"),
        func.count(Order.id).label("total_orders"),
    ).where(Order.status == "completed")

    if start_date:
        stmt = stmt.where(Order.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Order.created_at <= end_date)
    if city_code:
        stmt = stmt.where(Order.city_code == city_code)
    if route_type:
        stmt = stmt.where(Order.route_type == route_type)

    stmt = stmt.group_by(Order.city_code, Order.route_type)
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        {
            "city_code": row.city_code,
            "route_type": row.route_type,
            "avg_dispatch_minutes": float(row.avg_dispatch_minutes) if row.avg_dispatch_minutes else 0,
            "total_orders": row.total_orders,
            "period_start": start_date or "all",
            "period_end": end_date or "all",
        }
        for row in rows
    ]
    return {"items": items, "total": len(items)}


@router.get("/subsidy-summary", response_model=dict)
async def subsidy_summary_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    city_code: Optional[str] = None,
    route_type: Optional[str] = None,
    rider_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(
        Order.city_code,
        Order.route_type,
        func.count(Order.id).label("total_orders"),
        func.sum(Order.subsidy_amount).label("total_subsidy"),
        func.avg(Order.subsidy_amount).label("avg_subsidy"),
    ).where(Order.status == "completed")

    if start_date:
        stmt = stmt.where(Order.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Order.created_at <= end_date)
    if city_code:
        stmt = stmt.where(Order.city_code == city_code)
    if route_type:
        stmt = stmt.where(Order.route_type == route_type)
    if rider_id:
        stmt = stmt.where(Order.rider_id == rider_id)

    stmt = stmt.group_by(Order.city_code, Order.route_type)
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        {
            "city_code": row.city_code,
            "route_type": row.route_type,
            "total_orders": row.total_orders,
            "total_subsidy": float(row.total_subsidy) if row.total_subsidy else 0,
            "avg_subsidy": float(row.avg_subsidy) if row.avg_subsidy else 0,
        }
        for row in rows
    ]
    return {"items": items, "total": len(items)}


@router.get("/performance", response_model=dict)
async def performance_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(
        AppealTicket.handler_id,
        func.count(AppealTicket.id).label("total_handled"),
        func.avg(
            extract("epoch", AppealTicket.resolved_at - AppealTicket.created_at) / 3600
        ).label("avg_resolution_hours"),
        func.count(AppealTicket.id).filter(AppealTicket.status == "approved").label("approved_count"),
    ).where(
        AppealTicket.handler_id.isnot(None),
        AppealTicket.resolved_at.isnot(None),
    )

    if start_date:
        stmt = stmt.where(AppealTicket.created_at >= start_date)
    if end_date:
        stmt = stmt.where(AppealTicket.created_at <= end_date)

    stmt = stmt.group_by(AppealTicket.handler_id)
    result = await db.execute(stmt)
    rows = result.all()

    items = []
    for row in rows:
        handler = None
        if row.handler_id:
            user_stmt = select(User).where(User.id == row.handler_id)
            user_result = await db.execute(user_stmt)
            user = user_result.scalar_one_or_none()
            handler = user.name if user else "Unknown"

        approval_rate = 0.0
        if row.total_handled and row.total_handled > 0:
            approval_rate = (row.approved_count or 0) / row.total_handled * 100

        items.append({
            "operator_id": str(row.handler_id) if row.handler_id else None,
            "operator_name": handler,
            "total_handled": row.total_handled,
            "avg_resolution_hours": float(row.avg_resolution_hours) if row.avg_resolution_hours else 0,
            "approval_rate": approval_rate,
            "period_start": start_date or "all",
            "period_end": end_date or "all",
        })

    return {"items": items, "total": len(items)}
