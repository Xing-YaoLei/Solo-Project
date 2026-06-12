from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import StorePoint
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.StorePoint])
def list_points(
    status: Optional[schemas.PointStatus] = None,
    region: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(StorePoint)
    if status:
        query = query.filter(StorePoint.status == status)
    if region:
        query = query.filter(StorePoint.region.contains(region))
    return query.offset(skip).limit(limit).all()


@router.get("/{point_id}", response_model=schemas.StorePoint)
def get_point(point_id: int, db: Session = Depends(get_db)):
    point = db.query(StorePoint).filter(StorePoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="点位不存在")
    return point


@router.post("", response_model=schemas.StorePoint)
def create_point(point_in: schemas.StorePointCreate, db: Session = Depends(get_db)):
    existing = db.query(StorePoint).filter(StorePoint.store_code == point_in.store_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="点位编号已存在")
    point = StorePoint(**point_in.model_dump())
    db.add(point)
    db.commit()
    db.refresh(point)
    return point


@router.put("/{point_id}", response_model=schemas.StorePoint)
def update_point(point_id: int, point_in: schemas.StorePointUpdate, db: Session = Depends(get_db)):
    point = db.query(StorePoint).filter(StorePoint.id == point_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="点位不存在")
    for key, value in point_in.model_dump(exclude_unset=True).items():
        setattr(point, key, value)
    db.commit()
    db.refresh(point)
    return point
