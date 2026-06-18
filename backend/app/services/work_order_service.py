from datetime import date, datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.work_order import WorkOrder, WorkOrderStatus

VALID_TRANSITIONS: dict[WorkOrderStatus, list[WorkOrderStatus]] = {
    WorkOrderStatus.pending: [WorkOrderStatus.confirmed],
    WorkOrderStatus.confirmed: [WorkOrderStatus.in_progress],
    WorkOrderStatus.in_progress: [
        WorkOrderStatus.waiting_parts,
        WorkOrderStatus.in_inspection,
    ],
    WorkOrderStatus.waiting_parts: [WorkOrderStatus.in_progress],
    WorkOrderStatus.in_inspection: [WorkOrderStatus.completed],
    WorkOrderStatus.completed: [WorkOrderStatus.closed],
    WorkOrderStatus.rework: [],
}


def can_transition_status(
    current: WorkOrderStatus, target: WorkOrderStatus
) -> bool:
    if target == WorkOrderStatus.rework:
        return current not in (
            WorkOrderStatus.closed,
            WorkOrderStatus.rework,
        )
    allowed = VALID_TRANSITIONS.get(current, [])
    return target in allowed


async def generate_order_no(db: AsyncSession) -> str:
    today = date.today()
    date_str = today.strftime("%Y%m%d")
    prefix = f"WO-{date_str}-"

    result = await db.execute(
        select(func.max(WorkOrder.order_no)).where(WorkOrder.order_no.like(f"{prefix}%"))
    )
    max_no = result.scalar_one_or_none()

    if max_no is None:
        seq = 1
    else:
        seq = int(max_no.split("-")[-1]) + 1

    return f"{prefix}{seq:03d}"


async def create_work_order(db: AsyncSession, data: dict) -> WorkOrder:
    order_no = await generate_order_no(db)
    work_order = WorkOrder(order_no=order_no, **data)
    db.add(work_order)
    await db.commit()
    await db.refresh(work_order)
    return work_order


async def update_work_order(
    db: AsyncSession, order_id: int, data: dict, user: User
) -> WorkOrder:
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    work_order = result.scalar_one_or_none()
    if work_order is None:
        raise ValueError("工单不存在")

    if work_order.technician_id != user.id and user.role not in (
        "manager",
        "service_advisor",
    ):
        raise PermissionError("无权修改此工单")

    for key, value in data.items():
        setattr(work_order, key, value)

    await db.commit()
    await db.refresh(work_order)
    return work_order


async def change_status(
    db: AsyncSession,
    order_id: int,
    new_status: WorkOrderStatus,
    user: User,
) -> WorkOrder:
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    work_order = result.scalar_one_or_none()
    if work_order is None:
        raise ValueError("工单不存在")

    if not can_transition_status(work_order.status, new_status):
        raise ValueError(
            f"不允许从 {work_order.status.value} 转换到 {new_status.value}"
        )

    if work_order.technician_id != user.id and user.role not in (
        "manager",
        "service_advisor",
    ):
        raise PermissionError("无权修改此工单状态")

    work_order.status = new_status
    await db.commit()
    await db.refresh(work_order)
    return work_order


async def create_rework_order(
    db: AsyncSession, original_id: int, user: User
) -> WorkOrder:
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == original_id))
    original = result.scalar_one_or_none()
    if original is None:
        raise ValueError("原始工单不存在")

    order_no = await generate_order_no(db)
    rework = WorkOrder(
        order_no=order_no,
        vehicle_id=original.vehicle_id,
        customer_id=original.customer_id,
        technician_id=original.technician_id,
        status=WorkOrderStatus.rework,
        original_order_id=original_id,
        description=f"返工工单 - 源自 {original.order_no}",
    )
    db.add(rework)
    await db.commit()
    await db.refresh(rework)
    return rework


async def batch_update_status(
    db: AsyncSession,
    order_ids: list[int],
    new_status: WorkOrderStatus,
    user: User,
) -> list[WorkOrder]:
    updated: list[WorkOrder] = []
    for order_id in order_ids:
        try:
            work_order = await change_status(db, order_id, new_status, user)
            updated.append(work_order)
        except (ValueError, PermissionError):
            continue
    return updated
