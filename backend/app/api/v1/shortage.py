from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.api.deps import get_db, get_current_user
from app.models import ShortageOrder, ShortageActionLog, User
from app.schemas.shortage_order import (
    ShortageOrderCreate,
    ShortageOrderUpdate,
    ShortageOrderResponse,
    ShortageHandleRequest,
)
from app.schemas.material_batch import PaginatedResponse

router = APIRouter(prefix="/shortage", tags=["短缺工单"])


@router.get("", response_model=PaginatedResponse[ShortageOrderResponse])
def list_shortage_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(ShortageOrder).options(joinedload(ShortageOrder.action_logs))

    if status:
        query = query.filter(ShortageOrder.status == status)
    if priority:
        query = query.filter(ShortageOrder.priority == priority)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            or_(
                ShortageOrder.material_name.like(like),
                ShortageOrder.responsible_person.like(like),
            )
        )

    query = query.order_by(desc(ShortageOrder.created_at))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(data=items, total=total, page=page, page_size=page_size)


@router.get("/all", response_model=List[ShortageOrderResponse])
def list_all_shortage_orders(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(ShortageOrder).options(joinedload(ShortageOrder.action_logs))
    if status:
        query = query.filter(ShortageOrder.status == status)
    return query.order_by(desc(ShortageOrder.created_at)).all()


@router.get("/{order_id}", response_model=ShortageOrderResponse)
def get_shortage_order(
    order_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    order = (
        db.query(ShortageOrder)
        .options(joinedload(ShortageOrder.action_logs))
        .filter(ShortageOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="短缺工单不存在")
    return order


@router.post("", response_model=ShortageOrderResponse, status_code=status.HTTP_201_CREATED)
def create_shortage_order(
    data: ShortageOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = ShortageOrder(**data.model_dump())
    db.add(order)
    db.flush()

    log = ShortageActionLog(
        shortage_order_id=order.id,
        action="create",
        operator_id=current_user.id,
        operator=current_user.full_name,
        remark="创建短缺工单",
    )
    db.add(log)

    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}", response_model=ShortageOrderResponse)
def update_shortage_order(
    order_id: str,
    data: ShortageOrderUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="短缺工单不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/handle", response_model=ShortageOrderResponse)
def handle_shortage_order(
    order_id: str,
    data: ShortageHandleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="短缺工单不存在")

    action = data.action
    new_status = None

    if action == "supplement":
        new_status = "supplemented"
    elif action == "retry":
        new_status = "processing"
    elif action == "close":
        new_status = "closed"
    else:
        raise HTTPException(status_code=400, detail=f"不支持的操作: {action}")

    order.status = new_status

    log = ShortageActionLog(
        shortage_order_id=order.id,
        action=action,
        operator_id=current_user.id,
        operator=current_user.full_name,
        remark=data.remark,
        supplement_quantity=data.supplement_quantity,
    )
    db.add(log)
    db.commit()
    db.refresh(order)
    return order
