from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierQueryParams,
    SupplierResponse,
)
from app.schemas.common import (
    PaginatedResponse,
    SuccessResponse,
)
from app.api.deps import get_current_user, get_current_active_admin

router = APIRouter(prefix="/suppliers", tags=["供应商管理"])


@router.get("", response_model=PaginatedResponse[SupplierResponse], summary="获取供应商列表")
def get_suppliers(
    params: SupplierQueryParams = Depends(),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Supplier)

    if params.keyword:
        query = query.filter(Supplier.name.contains(params.keyword))
    if params.status:
        query = query.filter(Supplier.status == params.status)
    if params.credit_rating:
        query = query.filter(Supplier.credit_rating == params.credit_rating)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse[SupplierResponse](
        items=[SupplierResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{supplier_id}", response_model=SupplierResponse, summary="获取供应商详情")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="供应商不存在",
        )
    return SupplierResponse.model_validate(supplier)


@router.post("", response_model=SupplierResponse, summary="创建供应商")
def create_supplier(
    request: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    db_supplier = Supplier(**request.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return SupplierResponse.model_validate(db_supplier)


@router.put("/{supplier_id}", response_model=SupplierResponse, summary="更新供应商")
def update_supplier(
    supplier_id: int,
    request: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="供应商不存在",
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)
    return SupplierResponse.model_validate(supplier)


@router.delete("/{supplier_id}", response_model=SuccessResponse, summary="删除供应商")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="供应商不存在",
        )

    db.delete(supplier)
    db.commit()
    return SuccessResponse(message="删除成功")
