import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.enums import OrderStatus, Priority, UserRole
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderListResponse,
    WorkOrderResponse,
    WorkOrderUpdate,
)

router = APIRouter(prefix="/work-orders", tags=["工单管理"])

STATUS_TRANSITIONS = {
    OrderStatus.pending: [OrderStatus.confirmed],
    OrderStatus.confirmed: [OrderStatus.in_progress],
    OrderStatus.in_progress: [OrderStatus.waiting_parts, OrderStatus.in_inspection],
    OrderStatus.waiting_parts: [OrderStatus.in_progress],
    OrderStatus.in_inspection: [OrderStatus.completed, OrderStatus.in_progress],
    OrderStatus.completed: [OrderStatus.closed, OrderStatus.rework],
    OrderStatus.closed: [],
    OrderStatus.rework: [OrderStatus.in_progress],
}


def _generate_order_no() -> str:
    now = datetime.now()
    return f"WO{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


@router.get("", response_model=WorkOrderListResponse)
async def list_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    consultant_id: Optional[UUID] = Query(None),
    technician_id: Optional[UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(WorkOrder)
    count_query = select(func.count(WorkOrder.id))

    conditions = []
    if status_filter:
        conditions.append(WorkOrder.status == status_filter)
    if consultant_id:
        conditions.append(WorkOrder.assigned_consultant_id == consultant_id)
    if technician_id:
        conditions.append(WorkOrder.assigned_technician_id == technician_id)
    if date_from:
        conditions.append(WorkOrder.created_at >= date_from)
    if date_to:
        conditions.append(WorkOrder.created_at <= date_to)
    if search:
        conditions.append(
            or_(
                WorkOrder.order_no.ilike(f"%{search}%"),
                WorkOrder.customer_name.ilike(f"%{search}%"),
                WorkOrder.vehicle_plate.ilike(f"%{search}%"),
                WorkOrder.vin.ilike(f"%{search}%"),
            )
        )

    if conditions:
        filter_cond = and_(*conditions)
        query = query.where(filter_cond)
        count_query = count_query.where(filter_cond)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(WorkOrder.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return WorkOrderListResponse(
        items=[WorkOrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    data: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = WorkOrder(
        id=uuid.uuid4(),
        order_no=_generate_order_no(),
        **data.model_dump(),
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}", response_model=WorkOrderResponse)
async def get_work_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")
    return order


@router.put("/{order_id}", response_model=WorkOrderResponse)
async def update_work_order(
    order_id: UUID,
    data: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)

    await db.commit()
    await db.refresh(order)
    return order


@router.patch("/{order_id}/status", response_model=WorkOrderResponse)
async def change_work_order_status(
    order_id: UUID,
    new_status: str = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    try:
        target_status = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的状态值")

    current_status = OrderStatus(order.status)
    allowed = STATUS_TRANSITIONS.get(current_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不允许从 {current_status.value} 变更为 {target_status.value}",
        )

    order.status = target_status
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/rework", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_rework_order(
    order_id: UUID,
    reason: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="原工单不存在")

    rework = WorkOrder(
        id=uuid.uuid4(),
        order_no=_generate_order_no(),
        customer_name=original.customer_name,
        customer_phone=original.customer_phone,
        vehicle_plate=original.vehicle_plate,
        vehicle_model=original.vehicle_model,
        vin=original.vin,
        priority=Priority.urgent,
        assigned_consultant_id=original.assigned_consultant_id,
        assigned_technician_id=original.assigned_technician_id,
        status=OrderStatus.rework,
        is_rework=True,
        original_order_id=original.id,
        customer_complaint=reason,
    )
    original.status = OrderStatus.rework
    db.add(rework)
    await db.commit()
    await db.refresh(rework)
    return rework


@router.post("/batch", response_model=dict)
async def batch_update_status(
    order_ids: list[UUID] = Body(...),
    new_status: str = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager)),
):
    try:
        target_status = OrderStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的状态值")

    result = await db.execute(
        select(WorkOrder).where(WorkOrder.id.in_(order_ids))
    )
    orders = result.scalars().all()

    updated = 0
    for order in orders:
        current = OrderStatus(order.status)
        allowed = STATUS_TRANSITIONS.get(current, [])
        if target_status in allowed:
            order.status = target_status
            updated += 1

    await db.commit()
    return {"updated": updated, "total": len(order_ids)}
