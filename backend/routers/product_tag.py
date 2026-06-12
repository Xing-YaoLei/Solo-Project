from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    ProductTagCreate,
    ProductTagUpdate,
    ProductTagResponse,
    ApiResponse,
)
from models.product_tag import ProductTag
from typing import Optional

router = APIRouter(prefix="/product-tags", tags=["商品标签"])


@router.get("", response_model=ApiResponse[list[ProductTagResponse]])
def list_product_tags(
    arrival_list_id: Optional[int] = Query(None),
    tag_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(ProductTag)
    if arrival_list_id:
        query = query.filter(ProductTag.arrival_list_id == arrival_list_id)
    if tag_type:
        query = query.filter(ProductTag.tag_type == tag_type)
    items = query.order_by(ProductTag.created_at.desc()).all()
    return ApiResponse.success(items)


@router.get("/{tag_id}", response_model=ApiResponse[ProductTagResponse])
def get_product_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(ProductTag).filter(ProductTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="商品标签不存在")
    return ApiResponse.success(tag)


@router.post("", response_model=ApiResponse[ProductTagResponse])
def create_product_tag(data: ProductTagCreate, db: Session = Depends(get_db)):
    tag = ProductTag(**data.model_dump(exclude_unset=True))
    db.add(tag)
    db.commit()
    return ApiResponse.success(tag, message="创建成功")


@router.put("/{tag_id}", response_model=ApiResponse[ProductTagResponse])
def update_product_tag(
    tag_id: int, data: ProductTagUpdate, db: Session = Depends(get_db)
):
    tag = db.query(ProductTag).filter(ProductTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="商品标签不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)
    db.commit()
    return ApiResponse.success(tag, message="更新成功")


@router.delete("/{tag_id}", response_model=ApiResponse[bool])
def delete_product_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(ProductTag).filter(ProductTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="商品标签不存在")
    db.delete(tag)
    db.commit()
    return ApiResponse.success(True, message="删除成功")
