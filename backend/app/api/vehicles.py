from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import User, Vehicle
from ..schemas import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
)

router = APIRouter(prefix="/vehicles", tags=["车辆档案"])


@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vehicle)
    if q:
        query = query.filter(
            (Vehicle.plate_number.ilike(f"%{q}%"))
            | (Vehicle.vin.ilike(f"%{q}%"))
            | (Vehicle.brand.ilike(f"%{q}%"))
            | (Vehicle.model.ilike(f"%{q}%"))
        )
    return query.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=VehicleResponse)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Vehicle).filter(Vehicle.plate_number == vehicle_in.plate_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="车牌号已存在")
    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")
    for key, value in vehicle_in.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")
    db.delete(vehicle)
    db.commit()
    return {"message": "删除成功"}
