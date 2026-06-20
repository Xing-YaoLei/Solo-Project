from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..utils.response import success_response, paginated_response

router = APIRouter()


@router.get("", response_model=schemas.PaginatedResponse)
def list_riders(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    area: Optional[str] = None,
    status: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Rider)
    
    if keyword:
        query = query.filter(
            models.Rider.name.contains(keyword) |
            models.Rider.phone.contains(keyword)
        )
    if area:
        query = query.filter(models.Rider.area == area)
    if status:
        query = query.filter(models.Rider.status == status)
    if level:
        query = query.filter(models.Rider.level == level)
    
    total = query.count()
    items = query.order_by(models.Rider.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return paginated_response(items, total, page, page_size)


@router.get("/options/list", response_model=schemas.ResponseModel)
def get_rider_options(
    area: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Rider)
    if area:
        query = query.filter(models.Rider.area == area)
    
    riders = query.filter(models.Rider.status == "online")\
        .order_by(models.Rider.name)\
        .all()
    
    return success_response(riders)


@router.get("/{rider_id}", response_model=schemas.ResponseModel)
def get_rider(rider_id: int, db: Session = Depends(get_db)):
    rider = db.query(models.Rider).filter(models.Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="骑手不存在")
    return success_response(rider)


@router.post("", response_model=schemas.ResponseModel)
def create_rider(rider_in: dict, db: Session = Depends(get_db)):
    existing = db.query(models.Rider).filter(models.Rider.phone == rider_in.get("phone")).first()
    if existing:
        raise HTTPException(status_code=400, detail="手机号已存在")
    
    rider = models.Rider(**rider_in)
    db.add(rider)
    db.commit()
    db.refresh(rider)
    return success_response(rider)


@router.put("/{rider_id}", response_model=schemas.ResponseModel)
def update_rider(rider_id: int, rider_in: dict, db: Session = Depends(get_db)):
    rider = db.query(models.Rider).filter(models.Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="骑手不存在")
    
    for key, value in rider_in.items():
        if value is not None:
            setattr(rider, key, value)
    
    db.commit()
    db.refresh(rider)
    return success_response(rider)
