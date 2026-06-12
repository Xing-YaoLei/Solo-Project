from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    PageResponse,
    ApiResponse,
)
from models.product import Product
from typing import Optional

router = APIRouter(prefix="/products", tags=["商品"])


@router.get("", response_model=ApiResponse[PageResponse[ProductResponse]])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if keyword:
        query = query.filter(
            (Product.sku.ilike(f"%{keyword}%"))
            | (Product.name.ilike(f"%{keyword}%"))
        )
    if category:
        query = query.filter(Product.category == category)
    total = query.count()
    items = query.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ApiResponse.success(
        PageResponse(total=total, page=page, page_size=page_size, list=items)
    )


@router.get("/{product_id}", response_model=ApiResponse[ProductResponse])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return ApiResponse.success(product)


@router.post("", response_model=ApiResponse[ProductResponse])
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**data.model_dump(exclude_unset=True))
    db.add(product)
    db.commit()
    return ApiResponse.success(product, message="创建成功")


@router.put("/{product_id}", response_model=ApiResponse[ProductResponse])
def update_product(
    product_id: int, data: ProductUpdate, db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    db.commit()
    return ApiResponse.success(product, message="更新成功")


@router.delete("/{product_id}", response_model=ApiResponse[bool])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    db.delete(product)
    db.commit()
    return ApiResponse.success(True, message="删除成功")
