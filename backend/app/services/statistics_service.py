from datetime import date, datetime
from typing import Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.part import OrderPart, Part
from app.models.work_order import WorkOrder, WorkOrderStatus


async def get_overview(db: AsyncSession) -> dict:
    total = await db.scalar(select(func.count(WorkOrder.id)))
    pending = await db.scalar(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.status == WorkOrderStatus.pending
        )
    )
    in_progress = await db.scalar(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.status == WorkOrderStatus.in_progress
        )
    )
    completed = await db.scalar(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.status == WorkOrderStatus.completed
        )
    )
    rework = await db.scalar(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.status == WorkOrderStatus.rework
        )
    )

    return {
        "total": total or 0,
        "pending": pending or 0,
        "in_progress": in_progress or 0,
        "completed": completed or 0,
        "rework": rework or 0,
    }


async def get_rework_rate(
    db: AsyncSession,
    period: str = "month",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[dict]:
    date_col = func.date_trunc(period, WorkOrder.created_at).label("period")

    query = select(
        date_col,
        func.count(WorkOrder.id).label("total"),
        func.sum(
            case(
                (WorkOrder.status == WorkOrderStatus.rework, 1),
                else_=0,
            )
        ).label("rework_count"),
    ).group_by(date_col)

    if start_date:
        query = query.where(WorkOrder.created_at >= start_date)
    if end_date:
        query = query.where(WorkOrder.created_at <= end_date)

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "period": str(row.period),
            "total": row.total,
            "rework_count": row.rework_count or 0,
            "rework_rate": round((row.rework_count or 0) / row.total, 4) if row.total else 0,
        }
        for row in rows
    ]


async def get_rework_trace(
    db: AsyncSession,
    rework_order_id: Optional[int] = None,
) -> list[dict]:
    query = select(WorkOrder).where(WorkOrder.status == WorkOrderStatus.rework)

    if rework_order_id is not None:
        query = query.where(WorkOrder.id == rework_order_id)

    result = await db.execute(query)
    rework_orders = result.scalars().all()

    traces: list[dict] = []
    for order in rework_orders:
        original = None
        if order.original_order_id:
            orig_result = await db.execute(
                select(WorkOrder).where(WorkOrder.id == order.original_order_id)
            )
            orig = orig_result.scalar_one_or_none()
            if orig:
                original = {
                    "id": orig.id,
                    "order_no": orig.order_no,
                    "status": orig.status.value,
                    "description": orig.description,
                }

        traces.append(
            {
                "id": order.id,
                "order_no": order.order_no,
                "description": order.description,
                "original_order": original,
            }
        )

    return traces


async def get_status_distribution(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(WorkOrder.status, func.count(WorkOrder.id).label("count"))
        .group_by(WorkOrder.status)
        .order_by(WorkOrder.status)
    )
    return [
        {"status": row.status.value, "count": row.count}
        for row in result.all()
    ]


async def get_technician_performance(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[dict]:
    query = select(
        WorkOrder.technician_id,
        func.count(WorkOrder.id).label("total_orders"),
        func.sum(
            case(
                (WorkOrder.status == WorkOrderStatus.completed, 1),
                else_=0,
            )
        ).label("completed_orders"),
        func.sum(
            case(
                (WorkOrder.status == WorkOrderStatus.rework, 1),
                else_=0,
            )
        ).label("rework_orders"),
    ).group_by(WorkOrder.technician_id)

    if start_date:
        query = query.where(WorkOrder.created_at >= start_date)
    if end_date:
        query = query.where(WorkOrder.created_at <= end_date)

    result = await db.execute(query)
    return [
        {
            "technician_id": row.technician_id,
            "total_orders": row.total_orders,
            "completed_orders": row.completed_orders or 0,
            "rework_orders": row.rework_orders or 0,
        }
        for row in result.all()
    ]


async def get_parts_usage(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[dict]:
    query = select(
        OrderPart.part_id,
        Part.name.label("part_name"),
        func.sum(OrderPart.quantity).label("total_quantity"),
        func.sum(OrderPart.quantity * OrderPart.unit_price).label("total_cost"),
    ).join(Part, OrderPart.part_id == Part.id).group_by(
        OrderPart.part_id, Part.name
    )

    if start_date:
        query = query.where(OrderPart.created_at >= start_date)
    if end_date:
        query = query.where(OrderPart.created_at <= end_date)

    result = await db.execute(query)
    return [
        {
            "part_id": row.part_id,
            "part_name": row.part_name,
            "total_quantity": row.total_quantity,
            "total_cost": float(row.total_cost or 0),
        }
        for row in result.all()
    ]
