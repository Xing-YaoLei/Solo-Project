from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    ExceptionOrderCreate,
    ExceptionOrderUpdate,
    ExceptionOrderResponse,
    ExceptionOrderProcess,
    PageResponse,
    ApiResponse,
)
from services import ExceptionOrderService
from typing import Optional

router = APIRouter(prefix="/exception-orders", tags=["异常单"])


@router.get("", response_model=ApiResponse[PageResponse[ExceptionOrderResponse]])
def list_exception_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    responsibility_party: Optional[str] = Query(None),
    group_batch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    total, items = ExceptionOrderService.list(
        db=db,
        keyword=keyword,
        status=status,
        type=type,
        responsibility_party=responsibility_party,
        group_batch_id=group_batch_id,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{exception_id}", response_model=ApiResponse[ExceptionOrderResponse])
def get_exception_order(exception_id: int, db: Session = Depends(get_db)):
    exception = ExceptionOrderService.get_by_id(db, exception_id)
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return ApiResponse.success(exception)


@router.post("", response_model=ApiResponse[ExceptionOrderResponse])
def create_exception_order(data: ExceptionOrderCreate, db: Session = Depends(get_db)):
    exception = ExceptionOrderService.create(db, data)
    db.commit()
    return ApiResponse.success(exception, message="创建成功")


@router.put("/{exception_id}", response_model=ApiResponse[ExceptionOrderResponse])
def update_exception_order(
    exception_id: int, data: ExceptionOrderUpdate, db: Session = Depends(get_db)
):
    exception = ExceptionOrderService.update(db, exception_id, data)
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")
    db.commit()
    return ApiResponse.success(exception, message="更新成功")


@router.post("/{exception_id}/process", response_model=ApiResponse[ExceptionOrderResponse])
def process_exception_order(
    exception_id: int, data: ExceptionOrderProcess, db: Session = Depends(get_db)
):
    exception = ExceptionOrderService.process_exception(db, exception_id, data)
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")
    db.commit()
    return ApiResponse.success(exception, message="处理成功")


@router.delete("/{exception_id}", response_model=ApiResponse[bool])
def delete_exception_order(exception_id: int, db: Session = Depends(get_db)):
    success = ExceptionOrderService.delete(db, exception_id)
    if not success:
        raise HTTPException(status_code=404, detail="异常单不存在")
    db.commit()
    return ApiResponse.success(True, message="删除成功")
