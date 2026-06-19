from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Vehicle, RepairOrder, WarningThreshold
from .. import schemas

router = APIRouter()


@router.get("/")
def list_vehicles(
    plate_number: Optional[str] = None,
    brand: Optional[str] = None,
    warning_level: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)

    if plate_number:
        query = query.filter(Vehicle.plate_number.contains(plate_number))
    if brand:
        query = query.filter(Vehicle.brand.contains(brand))
    if warning_level:
        query = query.filter(Vehicle.warning_level == warning_level)

    total = query.count()
    vehicles = query.order_by(Vehicle.updated_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": v.id,
                "plate_number": v.plate_number,
                "vin": v.vin,
                "brand": v.brand,
                "model": v.model,
                "year": v.year,
                "color": v.color,
                "mileage": v.mileage,
                "owner_name": v.owner_name,
                "owner_phone": v.owner_phone,
                "repair_count": v.repair_count,
                "total_amount": v.total_amount,
                "last_repair_date": v.last_repair_date,
                "warning_level": v.warning_level,
            }
            for v in vehicles
        ],
    }


@router.get("/{vehicle_id}")
def get_vehicle_detail(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆档案不存在")

    repair_orders = db.query(RepairOrder).filter(
        RepairOrder.vehicle_id == vehicle_id
    ).order_by(RepairOrder.created_at.desc()).limit(20).all()

    thresholds = db.query(WarningThreshold).filter(
        WarningThreshold.enabled == True,
        WarningThreshold.category == "vehicle",
    ).all()

    warning_items = []
    for t in thresholds:
        triggered = False
        current_val = 0
        if t.code == "repair_count_threshold" and vehicle.repair_count >= t.current_value:
            triggered = True
            current_val = vehicle.repair_count
        elif t.code == "mileage_threshold" and vehicle.mileage >= t.current_value:
            triggered = True
            current_val = vehicle.mileage
        elif t.code == "total_amount_threshold" and vehicle.total_amount >= t.current_value:
            triggered = True
            current_val = vehicle.total_amount

        if triggered:
            warning_items.append({
                "threshold_id": t.id,
                "name": t.name,
                "code": t.code,
                "threshold": t.current_value,
                "unit": t.unit,
                "current_value": current_val,
            })

    if warning_items:
        vehicle.warning_level = "danger"
    elif vehicle.repair_count >= 3:
        vehicle.warning_level = "warning"
    else:
        vehicle.warning_level = "normal"
    db.commit()

    return {
        "id": vehicle.id,
        "plate_number": vehicle.plate_number,
        "vin": vehicle.vin,
        "brand": vehicle.brand,
        "model": vehicle.model,
        "year": vehicle.year,
        "color": vehicle.color,
        "mileage": vehicle.mileage,
        "owner_name": vehicle.owner_name,
        "owner_phone": vehicle.owner_phone,
        "repair_count": vehicle.repair_count,
        "total_amount": vehicle.total_amount,
        "last_repair_date": vehicle.last_repair_date,
        "warning_level": vehicle.warning_level,
        "warning_items": warning_items,
        "repair_orders": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "status": o.status,
                "is_rework": o.is_rework,
                "total_amount": o.total_amount,
                "actual_amount": o.actual_amount,
                "mechanic": o.mechanic,
                "created_at": o.created_at,
                "fault_description": o.fault_description,
            }
            for o in repair_orders
        ],
    }


@router.post("/", response_model=schemas.Vehicle)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("/warnings/summary")
def get_vehicle_warnings_summary(db: Session = Depends(get_db)):
    danger_count = db.query(Vehicle).filter(Vehicle.warning_level == "danger").count()
    warning_count = db.query(Vehicle).filter(Vehicle.warning_level == "warning").count()
    normal_count = db.query(Vehicle).filter(Vehicle.warning_level == "normal").count()
    total = db.query(Vehicle).count()

    return {
        "total": total,
        "danger": danger_count,
        "warning": warning_count,
        "normal": normal_count,
        "danger_ratio": round(danger_count / total * 100, 2) if total > 0 else 0,
        "warning_ratio": round(warning_count / total * 100, 2) if total > 0 else 0,
    }
