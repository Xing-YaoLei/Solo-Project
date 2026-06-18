from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import User, Part, PartStock
from ..schemas import (
    PartCreate,
    PartUpdate,
    PartResponse,
    PartWithStockResponse,
    PartStockUpdate,
    PartStockResponse,
    StockChangeLogResponse,
    StockAdjustRequest,
)
from ..services.stock_service import adjust_stock, get_stock_logs

router = APIRouter(tags=["配件库存"])


@router.get("/parts", response_model=List[PartWithStockResponse])
def list_parts(
    q: Optional[str] = None,
    low_stock_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Part).options(joinedload(Part.stock))
    if q:
        query = query.filter(
            (Part.sku.ilike(f"%{q}%"))
            | (Part.name.ilike(f"%{q}%"))
            | (Part.brand.ilike(f"%{q}%"))
        )
    parts = query.order_by(Part.created_at.desc()).offset(skip).limit(limit).all()
    if low_stock_only:
        parts = [p for p in parts if p.stock and p.stock.quantity <= p.safety_stock]
    return parts


@router.post("/parts", response_model=PartResponse)
def create_part(
    part_in: PartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Part).filter(Part.sku == part_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU已存在")
    part = Part(**part_in.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    stock = PartStock(part_id=part.id, quantity=0)
    db.add(stock)
    db.commit()
    return part


@router.get("/parts/{part_id}", response_model=PartWithStockResponse)
def get_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = (
        db.query(Part)
        .options(joinedload(Part.stock))
        .filter(Part.id == part_id)
        .first()
    )
    if not part:
        raise HTTPException(status_code=404, detail="配件不存在")
    return part


@router.put("/parts/{part_id}", response_model=PartResponse)
def update_part(
    part_id: int,
    part_in: PartUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="配件不存在")
    for key, value in part_in.model_dump(exclude_unset=True).items():
        setattr(part, key, value)
    db.commit()
    db.refresh(part)
    return part


@router.delete("/parts/{part_id}")
def delete_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="配件不存在")
    db.delete(part)
    db.commit()
    return {"message": "删除成功"}


@router.post("/parts/{part_id}/adjust-stock")
def adjust_part_stock(
    part_id: int,
    request: StockAdjustRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stock, log, err = adjust_stock(db, part_id, request, current_user.id)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return {
        "stock": PartStockResponse.model_validate(stock),
        "log": StockChangeLogResponse.model_validate(log),
    }


@router.get("/stock-logs", response_model=List[StockChangeLogResponse])
def list_stock_logs(
    part_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = get_stock_logs(db, part_id, limit)
    for log in logs:
        log.part = db.query(Part).filter(Part.id == log.part_id).first()
    return logs
