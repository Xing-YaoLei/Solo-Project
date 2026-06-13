from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models import Store, Product, User, RoleEnum
from app.schemas import (
    StoreCreate, StoreResponse,
    ProductCreate, ProductResponse,
)

router = APIRouter(prefix="/api", tags=["基础数据"])


@router.post("/stores", response_model=StoreResponse)
def create_store(
    store_in: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.WAREHOUSE, RoleEnum.PURCHASER])),
):
    db_store = db.query(Store).filter(Store.code == store_in.code).first()
    if db_store:
        raise HTTPException(status_code=400, detail="Store code already exists")
    db_store = Store(**store_in.model_dump())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.get("/stores", response_model=list[StoreResponse])
def list_stores(
    active_only: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Store)
    if active_only:
        q = q.filter(Store.is_active == True)
    return q.order_by(Store.code).all()


@router.get("/stores/{store_id}", response_model=StoreResponse)
def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.post("/products", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.PURCHASER])),
):
    db_product = db.query(Product).filter(Product.sku == product_in.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="Product SKU already exists")
    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    active_only: Optional[bool] = Query(True),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Product)
    if active_only:
        q = q.filter(Product.is_active == True)
    if keyword:
        q = q.filter((Product.name.ilike(f"%{keyword}%")) | (Product.sku.ilike(f"%{keyword}%")))
    return q.order_by(Product.sku).all()


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
