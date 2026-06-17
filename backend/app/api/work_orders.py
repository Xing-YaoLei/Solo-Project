from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..core.database import get_db
from ..models import User, UserRole, WorkOrderStatus, WorkOrderPriority, WorkOrderCategory
from ..schemas import (
    WorkOrder, WorkOrderCreate, WorkOrderUpdate, WorkOrderAssign,
    WorkOrderComplete, WorkOrderReview, WorkOrderList,
    WorkOrderDailyItem, DashboardStats, CommunicationCreate, Communication
)
from ..services import work_order_service
from ..services.response_builder import (
    to_work_order_schema,
    to_work_order_list,
    to_daily_item,
    to_communication_schema,
)
from .deps import get_current_user, get_current_active_admin

router = APIRouter(prefix="/work-orders", tags=["工单"])


@router.get("/daily", response_model=dict)
def get_daily_orders(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders, total = work_order_service.get_daily_work_orders(
        db, current_user=current_user, skip=skip, limit=limit
    )
    now = datetime.now()
    items = []
    for order in orders:
        is_overdue = False
        if order.deadline and order.status not in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CLOSED]:
            is_overdue = order.deadline < now
        review_failed = order.status == WorkOrderStatus.REVIEW_FAILED
        items.append(to_daily_item(db, order, is_overdue, review_failed))
    return {"items": items, "total": total, "page": skip // limit + 1, "page_size": limit}


@router.get("", response_model=WorkOrderList)
def list_work_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[WorkOrderStatus] = None,
    category: Optional[WorkOrderCategory] = None,
    priority: Optional[WorkOrderPriority] = None,
    assigned_to: Optional[int] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders, total = work_order_service.get_work_orders(
        db,
        skip=skip,
        limit=limit,
        status=status,
        category=category,
        priority=priority,
        assigned_to=assigned_to,
        user_role=current_user.role,
        current_user_id=current_user.id,
        keyword=keyword,
    )
    return WorkOrderList(
        items=to_work_order_list(db, orders),
        total=total,
        page=skip // limit + 1,
        page_size=limit,
    )


@router.get("/{order_id}", response_model=WorkOrder)
def get_work_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER:
        if order.created_by != current_user.id and order.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="无权查看此工单")

    return to_work_order_schema(db, order)


@router.post("", response_model=WorkOrder, status_code=201)
def create_work_order(
    order_in: WorkOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.create_work_order(db, order_in, current_user)
    return to_work_order_schema(db, order)


@router.put("/{order_id}", response_model=WorkOrder)
def update_work_order(
    order_id: int,
    order_in: WorkOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER:
        if order.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="无权修改此工单")

    updated = work_order_service.update_work_order(db, order_id, order_in, current_user)
    return to_work_order_schema(db, updated)


@router.post("/{order_id}/assign", response_model=WorkOrder)
def assign_work_order(
    order_id: int,
    assign_in: WorkOrderAssign,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    updated = work_order_service.assign_work_order(db, order_id, assign_in, current_user)
    return to_work_order_schema(db, updated)


@router.post("/{order_id}/start", response_model=WorkOrder)
def start_work_order(
    order_id: int,
    remark: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER and order.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="无权处理此工单")

    updated = work_order_service.start_work_order(db, order_id, current_user, remark)
    if not updated:
        raise HTTPException(status_code=400, detail="工单状态不允许开始处理")
    return to_work_order_schema(db, updated)


@router.post("/{order_id}/complete", response_model=WorkOrder)
def complete_work_order(
    order_id: int,
    complete_in: WorkOrderComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER and order.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="无权处理此工单")

    updated = work_order_service.complete_work_order(db, order_id, complete_in, current_user)
    if not updated:
        raise HTTPException(status_code=400, detail="工单状态不允许完成")
    return to_work_order_schema(db, updated)


@router.post("/{order_id}/review", response_model=WorkOrder)
def review_work_order(
    order_id: int,
    review_in: WorkOrderReview,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    updated = work_order_service.review_work_order(db, order_id, review_in, current_user)
    if not updated:
        raise HTTPException(status_code=400, detail="工单状态不允许复核")
    return to_work_order_schema(db, updated)


@router.get("/{order_id}/communications", response_model=List[Communication])
def list_communications(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER:
        if order.created_by != current_user.id and order.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="无权查看此工单")

    return [to_communication_schema(db, c) for c in order.communications]


@router.post("/{order_id}/communications", response_model=Communication)
def add_communication(
    order_id: int,
    comm_in: CommunicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = work_order_service.get_work_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")

    if current_user.role == UserRole.WORKER:
        if order.created_by != current_user.id and order.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="无权操作此工单")

    comm = work_order_service.add_communication(db, order_id, comm_in.content, current_user)
    return to_communication_schema(db, comm)
