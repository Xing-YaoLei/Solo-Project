from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.shortage_order import ShortageOrder, ShortageOrderStatus, ShortagePriority
from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.models.shortage_action_log import ShortageActionLog, ShortageAction
from app.schemas.shortage_order import (
    ShortageOrderCreate,
    ShortageOrderUpdate,
    ShortageOrderQueryParams,
    ShortageActionRequest,
    ShortageActionType,
    ShortageOrderResponse,
)
from app.schemas.common import (
    PaginatedResponse,
    SuccessResponse,
)
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter(prefix="/shortage", tags=["短缺工单"])


@router.get("", response_model=PaginatedResponse[ShortageOrderResponse], summary="获取短缺工单列表")
def get_shortage_orders(
    params: ShortageOrderQueryParams = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(ShortageOrder)

    if params.status:
        query = query.filter(ShortageOrder.status == params.status)
    if params.priority:
        query = query.filter(ShortageOrder.priority == params.priority)
    if params.responsible_person:
        query = query.filter(ShortageOrder.responsible_person == params.responsible_person)
    if params.start_date:
        query = query.filter(ShortageOrder.created_at >= params.start_date)
    if params.end_date:
        query = query.filter(ShortageOrder.created_at <= params.end_date)
    if params.keyword:
        query = query.filter(
            ShortageOrder.material_name.contains(params.keyword) |
            ShortageOrder.responsible_person.contains(params.keyword)
        )

    query = query.order_by(ShortageOrder.priority.desc(), ShortageOrder.created_at.desc())

    total = query.count()
    items = query.offset(params.offset).limit(params.limit).all()

    total_pages = (total + params.page_size - 1) // params.page_size

    return PaginatedResponse[ShortageOrderResponse](
        items=[ShortageOrderResponse.model_validate(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
    )


@router.get("/{order_id}", response_model=ShortageOrderResponse, summary="获取短缺工单详情")
def get_shortage_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="短缺工单不存在",
        )
    return ShortageOrderResponse.model_validate(order)


@router.post("", response_model=ShortageOrderResponse, summary="创建短缺工单")
def create_shortage_order(
    request: ShortageOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == request.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="物料批次不存在",
        )

    db_order = ShortageOrder(**request.model_dump())
    db.add(db_order)

    batch.status = MaterialBatchStatus.SHORTAGE

    action_log = ShortageActionLog(
        shortage_order_id=0,
        action=ShortageAction.CREATE,
        operator_id=current_user.id,
        operator=current_user.full_name or current_user.username,
        remark=f"创建短缺工单，短缺数量: {request.shortage_quantity}",
    )
    db.add(action_log)

    db.commit()
    db.refresh(db_order)

    action_log.shortage_order_id = db_order.id
    db.commit()

    return ShortageOrderResponse.model_validate(db_order)


@router.put("/{order_id}", response_model=ShortageOrderResponse, summary="更新短缺工单")
def update_shortage_order(
    order_id: int,
    request: ShortageOrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="短缺工单不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return ShortageOrderResponse.model_validate(order)


@router.post("/{order_id}/action", response_model=SuccessResponse, summary="处理短缺工单")
def process_shortage_order(
    order_id: int,
    request: ShortageActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="短缺工单不存在",
        )

    batch = db.query(MaterialBatch).filter(MaterialBatch.id == order.batch_id).first()

    action_log = ShortageActionLog(
        shortage_order_id=order_id,
        action=ShortageAction(request.action),
        operator_id=current_user.id,
        operator=current_user.full_name or current_user.username,
        remark=request.remark or "",
    )

    if request.action == ShortageActionType.SUPPLEMENT:
        order.status = ShortageOrderStatus.SUPPLEMENTED
        if batch:
            batch.status = MaterialBatchStatus.IN_STOCK
        supp_quantity = request.supplement_quantity or order.shortage_quantity
        action_log.supplement_quantity = supp_quantity
        if batch and request.supplement_quantity:
            batch.quantity += request.supplement_quantity
        action_log.remark += f"，补货数量: {supp_quantity}"

    elif request.action == ShortageActionType.RETRY:
        order.status = ShortageOrderStatus.RETRIED
        if batch:
            batch.status = MaterialBatchStatus.IN_USE

    elif request.action == ShortageActionType.CLOSE:
        order.status = ShortageOrderStatus.CLOSED
        if batch:
            batch.status = MaterialBatchStatus.COMPLETED

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的操作类型",
        )

    db.add(action_log)
    db.commit()

    return SuccessResponse(message=f"工单{request.action}操作成功")


@router.delete("/{order_id}", response_model=SuccessResponse, summary="删除短缺工单")
def delete_shortage_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    order = db.query(ShortageOrder).filter(ShortageOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="短缺工单不存在",
        )

    db.delete(order)
    db.commit()
    return SuccessResponse(message="删除成功")
