from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    PickupCodeCreate,
    PickupCodeUpdate,
    PickupCodeResponse,
    PickupCodeStatusUpdate,
    PageResponse,
    ApiResponse,
)
from services.status_log_service import StatusLogService
from models.pickup_code import PickupCode
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/pickup-codes", tags=["自提码"])


@router.get("", response_model=ApiResponse[PageResponse[PickupCodeResponse]])
def list_pickup_codes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    group_batch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(PickupCode)
    if keyword:
        query = query.filter(
            (PickupCode.code.ilike(f"%{keyword}%"))
            | (PickupCode.customer_phone.ilike(f"%{keyword}%"))
            | (PickupCode.order_no.ilike(f"%{keyword}%"))
        )
    if status:
        query = query.filter(PickupCode.status == status)
    if group_batch_id:
        query = query.filter(PickupCode.group_batch_id == group_batch_id)
    total = query.count()
    items = query.order_by(PickupCode.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{code_id}", response_model=ApiResponse[PickupCodeResponse])
def get_pickup_code(code_id: int, db: Session = Depends(get_db)):
    code = db.query(PickupCode).filter(PickupCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="自提码不存在")
    return ApiResponse.success(code)


@router.post("", response_model=ApiResponse[PickupCodeResponse])
def create_pickup_code(data: PickupCodeCreate, db: Session = Depends(get_db)):
    code = PickupCode(**data.model_dump(exclude_unset=True))
    db.add(code)
    db.flush()
    StatusLogService.create_log(
        db=db,
        related_type="pickup_code",
        related_id=code.id,
        old_status=None,
        new_status=code.status,
        change_reason="创建自提码",
        operator=data.pickup_operator,
    )
    db.commit()
    return ApiResponse.success(code, message="创建成功")


@router.put("/{code_id}", response_model=ApiResponse[PickupCodeResponse])
def update_pickup_code(
    code_id: int, data: PickupCodeUpdate, db: Session = Depends(get_db)
):
    code = db.query(PickupCode).filter(PickupCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="自提码不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(code, key, value)
    db.commit()
    return ApiResponse.success(code, message="更新成功")


@router.patch("/{code_id}/status", response_model=ApiResponse[PickupCodeResponse])
def update_pickup_code_status(
    code_id: int, data: PickupCodeStatusUpdate, db: Session = Depends(get_db)
):
    code = db.query(PickupCode).filter(PickupCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="自提码不存在")
    old_status = code.status
    if old_status != data.status:
        code.status = data.status
        if data.status == "used":
            code.pickup_time = datetime.now()
            code.pickup_operator = data.operator
        StatusLogService.create_log(
            db=db,
            related_type="pickup_code",
            related_id=code.id,
            old_status=old_status,
            new_status=data.status,
            change_reason=data.change_reason,
            operator=data.operator,
        )
    db.commit()
    return ApiResponse.success(code, message="状态更新成功")


@router.delete("/{code_id}", response_model=ApiResponse[bool])
def delete_pickup_code(code_id: int, db: Session = Depends(get_db)):
    code = db.query(PickupCode).filter(PickupCode.id == code_id).first()
    if not code:
        raise HTTPException(status_code=404, detail="自提码不存在")
    db.delete(code)
    db.commit()
    return ApiResponse.success(True, message="删除成功")
