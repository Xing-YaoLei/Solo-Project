from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, asc, desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models import MaterialBatch, InventoryRecord, SafetyStockConfig, User
from app.schemas.material_batch import (
    MaterialBatchCreate,
    MaterialBatchUpdate,
    MaterialBatchResponse,
    PaginatedResponse,
)
from app.schemas.inventory_record import InventoryRecordCreate, InventoryRecordResponse
from app.schemas.safety_stock import SafetyStockCreate, SafetyStockUpdate, SafetyStockResponse

router = APIRouter(prefix="/inventory", tags=["库存管理"])


@router.get("/batches", response_model=PaginatedResponse[MaterialBatchResponse])
def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    statuses: List[str] = Query(default_factory=list),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    regions: List[str] = Query(default_factory=list),
    responsible_persons: List[str] = Query(default_factory=list),
    categories: List[str] = Query(default_factory=list),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(MaterialBatch)

    if statuses:
        query = query.filter(MaterialBatch.status.in_(statuses))
    if regions:
        query = query.filter(MaterialBatch.region.in_(regions))
    if responsible_persons:
        query = query.filter(MaterialBatch.responsible_person.in_(responsible_persons))
    if categories:
        query = query.filter(MaterialBatch.category.in_(categories))
    if date_start:
        query = query.filter(MaterialBatch.in_date >= date_start)
    if date_end:
        query = query.filter(MaterialBatch.in_date <= date_end)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            or_(
                MaterialBatch.batch_no.like(like),
                MaterialBatch.material_name.like(like),
                MaterialBatch.supplier_name.like(like),
            )
        )

    sort_column = getattr(MaterialBatch, sort_by, MaterialBatch.created_at)
    order_func = desc if sort_order == "desc" else asc
    query = query.order_by(order_func(sort_column))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedResponse(data=items, total=total, page=page, page_size=page_size)


@router.post("/batches", response_model=MaterialBatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    data: MaterialBatchCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    existing = db.query(MaterialBatch).filter(MaterialBatch.batch_no == data.batch_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="批次号已存在")
    batch = MaterialBatch(**data.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/batches/{batch_id}", response_model=MaterialBatchResponse)
def get_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.put("/batches/{batch_id}", response_model=MaterialBatchResponse)
def update_batch(
    batch_id: str,
    data: MaterialBatchUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "batch_no" in update_data and update_data["batch_no"] != batch.batch_no:
        existing = db.query(MaterialBatch).filter(MaterialBatch.batch_no == update_data["batch_no"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="批次号已存在")
    for key, value in update_data.items():
        setattr(batch, key, value)
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(
    batch_id: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    db.delete(batch)
    db.commit()
    return None


@router.get("/records", response_model=List[InventoryRecordResponse])
def list_records(
    batch_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(InventoryRecord)
    if batch_id:
        query = query.filter(InventoryRecord.batch_id == batch_id)
    return query.order_by(desc(InventoryRecord.created_at)).all()


@router.post("/records", response_model=InventoryRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    data: InventoryRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch = db.query(MaterialBatch).filter(MaterialBatch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    record_data = data.model_dump()
    if not record_data.get("operator_id"):
        record_data["operator_id"] = current_user.id
    if not record_data.get("operator"):
        record_data["operator"] = current_user.full_name
    if not record_data.get("region"):
        record_data["region"] = batch.region
    record = InventoryRecord(**record_data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/safety", response_model=List[SafetyStockResponse])
def list_safety_stocks(
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(SafetyStockConfig)
    if region:
        query = query.filter(SafetyStockConfig.region == region)
    return query.order_by(SafetyStockConfig.material_name).all()


@router.post("/safety", response_model=SafetyStockResponse, status_code=status.HTTP_201_CREATED)
def create_safety_stock(
    data: SafetyStockCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    existing = db.query(SafetyStockConfig).filter(
        and_(
            SafetyStockConfig.material_name == data.material_name,
            SafetyStockConfig.region == data.region,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该材料在此区域已有安全库存配置")
    stock = SafetyStockConfig(**data.model_dump())
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock


@router.put("/safety/{stock_id}", response_model=SafetyStockResponse)
def update_safety_stock(
    stock_id: str,
    data: SafetyStockUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    stock = db.query(SafetyStockConfig).filter(SafetyStockConfig.id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="安全库存配置不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stock, key, value)
    db.commit()
    db.refresh(stock)
    return stock
