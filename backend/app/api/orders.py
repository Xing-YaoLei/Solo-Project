from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .auth import get_current_active_user
from ..services import order_service

router = APIRouter(prefix="/api/orders", tags=["工单"])


@router.get("", response_model=schemas.OrderListResponse)
def list_orders(
    status: Optional[schemas.OrderStatus] = None,
    assignee_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    priority: Optional[int] = None,
    audit_type: Optional[str] = None,
    keyword: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    from datetime import datetime
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    total, orders = order_service.get_orders(
        db,
        status=status,
        assignee_id=assignee_id,
        creator_id=creator_id,
        priority=priority,
        audit_type=audit_type,
        keyword=keyword,
        start_date=start_dt,
        end_date=end_dt,
        page=page,
        page_size=page_size,
    )
    return {"total": total, "items": orders, "page": page, "page_size": page_size}


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    order = order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order


@router.post("", response_model=schemas.Order)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    return order_service.create_order(db, order_in, current_user.id)


@router.put("/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: int,
    order_in: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    order = order_service.update_order(db, order_id, order_in)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order


@router.post("/{order_id}/process", response_model=schemas.Order)
def process_order(
    order_id: int,
    process_in: schemas.ProcessRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    order = order_service.update_order_status(
        db,
        order_id,
        new_status=process_in.new_status,
        handler_id=current_user.id,
        action=process_in.action,
        remark=process_in.remark,
        attachments=process_in.attachments,
    )
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order


@router.post("/{order_id}/review-failed", response_model=schemas.Order)
def review_failed(
    order_id: int,
    data: schemas.ReviewFailedProcess,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    order = order_service.handle_review_failed(
        db,
        order_id,
        handler_id=current_user.id,
        affected_objects_data=data.affected_objects,
        supplement=data.supplement,
        new_assignee_id=data.new_assignee_id,
    )
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order


@router.post("/{order_id}/supplement", response_model=schemas.ReviewSupplement)
def add_supplement(
    order_id: int,
    supplement_in: schemas.ReviewSupplementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    supplement = order_service.add_review_supplement(
        db, order_id, current_user.id, supplement_in
    )
    if not supplement:
        raise HTTPException(status_code=404, detail="工单不存在")
    return supplement


@router.get("/{order_id}/records", response_model=List[schemas.ProcessRecord])
def get_order_records(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    order = order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="工单不存在")
    return order.process_records
