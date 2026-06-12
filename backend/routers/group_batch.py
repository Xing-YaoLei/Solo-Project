from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    GroupBatchCreate,
    GroupBatchUpdate,
    GroupBatchResponse,
    GroupBatchStatusUpdate,
    PageResponse,
    ApiResponse,
)
from services import GroupBatchService
from typing import Optional

router = APIRouter(prefix="/group-batches", tags=["团购批次"])


@router.get("", response_model=ApiResponse[PageResponse[GroupBatchResponse]])
def list_group_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    total, items = GroupBatchService.list(
        db=db,
        keyword=keyword,
        status=status,
        skip=(page - 1) * page_size,
        limit=page_size,
    )
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{batch_id}", response_model=ApiResponse[GroupBatchResponse])
def get_group_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = GroupBatchService.get_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="团购批次不存在")
    return ApiResponse.success(batch)


@router.post("", response_model=ApiResponse[GroupBatchResponse])
def create_group_batch(data: GroupBatchCreate, db: Session = Depends(get_db)):
    batch = GroupBatchService.create(db, data)
    db.commit()
    return ApiResponse.success(batch, message="创建成功")


@router.put("/{batch_id}", response_model=ApiResponse[GroupBatchResponse])
def update_group_batch(
    batch_id: int, data: GroupBatchUpdate, db: Session = Depends(get_db)
):
    batch = GroupBatchService.update(db, batch_id, data)
    if not batch:
        raise HTTPException(status_code=404, detail="团购批次不存在")
    db.commit()
    return ApiResponse.success(batch, message="更新成功")


@router.patch("/{batch_id}/status", response_model=ApiResponse[GroupBatchResponse])
def update_group_batch_status(
    batch_id: int, data: GroupBatchStatusUpdate, db: Session = Depends(get_db)
):
    batch = GroupBatchService.update_status(db, batch_id, data)
    if not batch:
        raise HTTPException(status_code=404, detail="团购批次不存在")
    db.commit()
    return ApiResponse.success(batch, message="状态更新成功")


@router.delete("/{batch_id}", response_model=ApiResponse[bool])
def delete_group_batch(batch_id: int, db: Session = Depends(get_db)):
    success = GroupBatchService.delete(db, batch_id)
    if not success:
        raise HTTPException(status_code=404, detail="团购批次不存在")
    db.commit()
    return ApiResponse.success(True, message="删除成功")
