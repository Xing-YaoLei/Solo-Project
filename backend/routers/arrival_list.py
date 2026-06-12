from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    ArrivalListCreate,
    ArrivalListUpdate,
    ArrivalListResponse,
    ArrivalConfirm,
    PageResponse,
    ApiResponse,
)
from services import ArrivalListService
from typing import Optional

router = APIRouter(prefix="/arrival-lists", tags=["到货清单"])


@router.get("", response_model=ApiResponse[PageResponse[ArrivalListResponse]])
def list_arrival_lists(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    group_batch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    total, items = ArrivalListService.list(
        db=db,
        keyword=keyword,
        status=status,
        group_batch_id=group_batch_id,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{arrival_id}", response_model=ApiResponse[ArrivalListResponse])
def get_arrival_list(arrival_id: int, db: Session = Depends(get_db)):
    arrival = ArrivalListService.get_by_id(db, arrival_id)
    if not arrival:
        raise HTTPException(status_code=404, detail="到货清单不存在")
    return ApiResponse.success(arrival)


@router.post("", response_model=ApiResponse[ArrivalListResponse])
def create_arrival_list(data: ArrivalListCreate, db: Session = Depends(get_db)):
    arrival = ArrivalListService.create(db, data)
    db.commit()
    return ApiResponse.success(arrival, message="创建成功")


@router.put("/{arrival_id}", response_model=ApiResponse[ArrivalListResponse])
def update_arrival_list(
    arrival_id: int, data: ArrivalListUpdate, db: Session = Depends(get_db)
):
    arrival = ArrivalListService.update(db, arrival_id, data)
    if not arrival:
        raise HTTPException(status_code=404, detail="到货清单不存在")
    db.commit()
    return ApiResponse.success(arrival, message="更新成功")


@router.post("/{arrival_id}/confirm", response_model=ApiResponse[ArrivalListResponse])
def confirm_arrival(
    arrival_id: int, data: ArrivalConfirm, db: Session = Depends(get_db)
):
    arrival = ArrivalListService.confirm_arrival(db, arrival_id, data)
    if not arrival:
        raise HTTPException(status_code=404, detail="到货清单不存在")
    db.commit()
    return ApiResponse.success(arrival, message="到货确认成功")


@router.delete("/{arrival_id}", response_model=ApiResponse[bool])
def delete_arrival_list(arrival_id: int, db: Session = Depends(get_db)):
    success = ArrivalListService.delete(db, arrival_id)
    if not success:
        raise HTTPException(status_code=404, detail="到货清单不存在")
    db.commit()
    return ApiResponse.success(True, message="删除成功")
