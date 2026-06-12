from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_role

router = APIRouter()


@router.post("", response_model=schemas.StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    store_in: schemas.StoreCreate,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    db_store = db.query(models.Store).filter(
        (models.Store.code == store_in.code) | (models.Store.name == store_in.name)
    ).first()
    if db_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store code or name already exists"
        )
    store = models.Store(**store_in.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("", response_model=List[schemas.StoreWithStats])
def list_stores(
    skip: int = 0,
    limit: int = 100,
    city: str = None,
    is_active: bool = True,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Store).filter(models.Store.is_active == is_active)
    if city:
        query = query.filter(models.Store.city == city)
    
    if current_user.role == models.UserRole.STAFF and current_user.store_id:
        query = query.filter(models.Store.id == current_user.store_id)
    
    stores = query.offset(skip).limit(limit).all()
    result = []
    for store in stores:
        store_data = schemas.StoreWithStats.model_validate(store)
        if store.manager_id:
            manager = db.query(models.User).filter(models.User.id == store.manager_id).first()
            if manager:
                store_data.manager_name = manager.full_name
        
        from sqlalchemy import func
        from datetime import datetime, timedelta
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1)
        
        month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
            models.LossReport.store_id == store.id,
            models.LossReport.loss_date >= month_start,
            models.LossReport.status != models.LossStatus.REJECTED
        ).scalar() or 0
        
        store_data.current_month_loss = float(month_loss)
        if store.monthly_sales_target > 0:
            store_data.current_month_loss_rate = round(month_loss / store.monthly_sales_target * 100, 2)
        
        result.append(store_data)
    return result


@router.get("/{store_id}", response_model=schemas.StoreWithStats)
def get_store(
    store_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    if current_user.role == models.UserRole.STAFF and current_user.store_id != store.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    store_data = schemas.StoreWithStats.model_validate(store)
    if store.manager_id:
        manager = db.query(models.User).filter(models.User.id == store.manager_id).first()
        if manager:
            store_data.manager_name = manager.full_name
    
    from sqlalchemy import func
    from datetime import datetime
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    
    month_loss = db.query(func.sum(models.LossReport.cost_amount)).filter(
        models.LossReport.store_id == store.id,
        models.LossReport.loss_date >= month_start,
        models.LossReport.status != models.LossStatus.REJECTED
    ).scalar() or 0
    
    store_data.current_month_loss = float(month_loss)
    if store.monthly_sales_target > 0:
        store_data.current_month_loss_rate = round(month_loss / store.monthly_sales_target * 100, 2)
    
    return store_data


@router.put("/{store_id}", response_model=schemas.StoreResponse)
def update_store(
    store_id: int,
    store_in: schemas.StoreCreate,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    existing = db.query(models.Store).filter(
        ((models.Store.code == store_in.code) | (models.Store.name == store_in.name)) &
        (models.Store.id != store_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store code or name already exists"
        )
    
    for key, value in store_in.model_dump().items():
        setattr(store, key, value)
    
    db.commit()
    db.refresh(store)
    return store


@router.delete("/{store_id}")
def delete_store(
    store_id: int,
    current_user: models.User = Depends(require_role(["manager"])),
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    store.is_active = False
    db.commit()
    return {"message": "Store deactivated successfully"}
