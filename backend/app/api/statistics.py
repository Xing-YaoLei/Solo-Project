from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_role
from app.models.enums import OrderStatus, ShortageStatus, UserRole
from app.models.part import Part
from app.models.shortage import ShortageRecord
from app.models.user import User
from app.models.work_order import WorkOrder
from app.models.part import WorkOrderPart
from app.schemas.statistics import (
    OrderStatusDistribution,
    PartsUsageStats,
    ReworkRateStats,
    ReworkTraceItem,
    StatisticsOverview,
    TechnicianPerformance,
)

router = APIRouter(prefix="/statistics", tags=["统计分析"])

_manager_only = Depends(require_role(UserRole.manager))


@router.get("/overview", response_model=StatisticsOverview)
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_result = await db.execute(select(func.count(WorkOrder.id)))
    total_orders = total_result.scalar() or 0

    active_statuses = [
        OrderStatus.confirmed,
        OrderStatus.in_progress,
        OrderStatus.waiting_parts,
        OrderStatus.in_inspection,
    ]
    active_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.status.in_(active_statuses))
    )
    active_orders = active_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(WorkOrder.id)).where(
            and_(
                WorkOrder.status == OrderStatus.completed,
                WorkOrder.created_at >= month_start,
            )
        )
    )
    completed_this_month = completed_result.scalar() or 0

    rework_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.is_rework.is_(True))
    )
    rework_orders = rework_result.scalar() or 0
    rework_rate = round(rework_orders / total_orders, 4) if total_orders > 0 else 0.0

    completed_orders_result = await db.execute(
        select(WorkOrder).where(WorkOrder.status.in_([OrderStatus.completed, OrderStatus.closed]))
    )
    completed_orders = completed_orders_result.scalars().all()
    total_hours = 0.0
    for o in completed_orders:
        if o.updated_at and o.created_at:
            delta = o.updated_at - o.created_at
            total_hours += delta.total_seconds() / 3600
    avg_completion_hours = round(total_hours / len(completed_orders), 2) if completed_orders else 0.0

    pending_result = await db.execute(
        select(func.count(ShortageRecord.id)).where(ShortageRecord.status == ShortageStatus.pending)
    )
    pending_shortages = pending_result.scalar() or 0

    return StatisticsOverview(
        total_orders=total_orders,
        active_orders=active_orders,
        completed_this_month=completed_this_month,
        rework_rate=rework_rate,
        avg_completion_hours=avg_completion_hours,
        pending_shortages=pending_shortages,
    )


@router.get("/rework-rate", response_model=list[ReworkRateStats])
async def get_rework_rate(
    period: str = Query("month", pattern="^(week|month|quarter)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    now = datetime.now(timezone.utc)
    results = []

    if period == "week":
        for i in range(11, -1, -1):
            start = now - timedelta(weeks=i + 1)
            end = now - timedelta(weeks=i)
            await _append_period_stats(db, start, end, f"{start.strftime('%m/%d')}-{end.strftime('%m/%d')}", results)
    elif period == "month":
        for i in range(11, -1, -1):
            month_date = now - timedelta(days=30 * i)
            start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 1)
            label = start.strftime("%Y-%m")
            await _append_period_stats(db, start, end, label, results)
    elif period == "quarter":
        for i in range(3, -1, -1):
            q_month = now.month - (i * 3)
            q_year = now.year
            while q_month <= 0:
                q_month += 12
                q_year -= 1
            start = datetime(q_year, q_month, 1, tzinfo=timezone.utc)
            q_end_month = q_month + 3
            q_end_year = q_year
            if q_end_month > 12:
                q_end_month -= 12
                q_end_year += 1
            end = datetime(q_end_year, q_end_month, 1, tzinfo=timezone.utc)
            label = f"{q_year}Q{(q_month - 1) // 3 + 1}"
            await _append_period_stats(db, start, end, label, results)

    return results


async def _append_period_stats(db, start, end, label, results):
    total_result = await db.execute(
        select(func.count(WorkOrder.id)).where(
            and_(WorkOrder.created_at >= start, WorkOrder.created_at < end)
        )
    )
    total = total_result.scalar() or 0

    rework_result = await db.execute(
        select(func.count(WorkOrder.id)).where(
            and_(
                WorkOrder.is_rework.is_(True),
                WorkOrder.created_at >= start,
                WorkOrder.created_at < end,
            )
        )
    )
    rework_orders = rework_result.scalar() or 0
    rework_rate = round(rework_orders / total, 4) if total > 0 else 0.0

    results.append(ReworkRateStats(
        period=label,
        total_orders=total,
        rework_orders=rework_orders,
        rework_rate=rework_rate,
    ))


@router.get("/rework-trace", response_model=list[ReworkTraceItem])
async def get_rework_trace(
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    rework_result = await db.execute(
        select(WorkOrder).where(WorkOrder.is_rework.is_(True))
    )
    rework_orders = rework_result.scalars().all()

    items = []
    for ro in rework_orders:
        if ro.original_order_id:
            original_result = await db.execute(
                select(WorkOrder).where(WorkOrder.id == ro.original_order_id)
            )
            original = original_result.scalar_one_or_none()
            if original:
                items.append(ReworkTraceItem(
                    original_order_id=original.id,
                    original_order_no=original.order_no,
                    rework_order_id=ro.id,
                    rework_order_no=ro.order_no,
                    reason=ro.customer_complaint or "",
                    created_at=ro.created_at,
                ))
    return items


@router.get("/status-distribution", response_model=list[OrderStatusDistribution])
async def get_status_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    result = await db.execute(
        select(WorkOrder.status, func.count(WorkOrder.id))
        .group_by(WorkOrder.status)
    )
    return [
        OrderStatusDistribution(status=str(status_val), count=count)
        for status_val, count in result.all()
    ]


@router.get("/technician-performance", response_model=list[TechnicianPerformance])
async def get_technician_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    techs_result = await db.execute(
        select(User).where(User.role == UserRole.technician, User.is_active.is_(True))
    )
    technicians = techs_result.scalars().all()

    results = []
    for tech in technicians:
        completed_result = await db.execute(
            select(WorkOrder).where(
                and_(
                    WorkOrder.assigned_technician_id == tech.id,
                    WorkOrder.status.in_([OrderStatus.completed, OrderStatus.closed]),
                )
            )
        )
        completed = completed_result.scalars().all()
        completed_orders = len(completed)

        total_hours = 0.0
        for o in completed:
            if o.updated_at and o.created_at:
                total_hours += (o.updated_at - o.created_at).total_seconds() / 3600
        avg_hours = round(total_hours / completed_orders, 2) if completed_orders > 0 else 0.0

        rework_count_result = await db.execute(
            select(func.count(WorkOrder.id)).where(
                and_(
                    WorkOrder.assigned_technician_id == tech.id,
                    WorkOrder.is_rework.is_(True),
                )
            )
        )
        rework_count = rework_count_result.scalar() or 0

        results.append(TechnicianPerformance(
            technician_id=tech.id,
            technician_name=tech.display_name,
            completed_orders=completed_orders,
            avg_completion_hours=avg_hours,
            rework_count=rework_count,
        ))

    return results


@router.get("/parts-usage", response_model=list[PartsUsageStats])
async def get_parts_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = _manager_only,
):
    result = await db.execute(
        select(
            WorkOrderPart.part_id,
            Part.name.label("part_name"),
            Part.part_no,
            func.sum(WorkOrderPart.quantity).label("total_used"),
            func.sum(WorkOrderPart.quantity * WorkOrderPart.unit_price).label("total_amount"),
        )
        .join(Part, WorkOrderPart.part_id == Part.id)
        .group_by(WorkOrderPart.part_id, Part.name, Part.part_no)
    )

    return [
        PartsUsageStats(
            part_id=row.part_id,
            part_name=row.part_name,
            part_no=row.part_no,
            total_used=row.total_used,
            total_amount=round(float(row.total_amount), 2),
        )
        for row in result.all()
    ]
