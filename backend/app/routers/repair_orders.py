from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from ..database import get_db
from ..models import RepairOrder, InspectionPhoto, Quotation, StockTask, Vehicle
from .. import schemas

router = APIRouter()


@router.get("/")
def list_repair_orders(
    status: Optional[str] = None,
    vehicle_plate: Optional[str] = None,
    is_rework: Optional[bool] = None,
    has_stockout: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(RepairOrder)

    if status:
        query = query.filter(RepairOrder.status == status)
    if vehicle_plate:
        query = query.filter(RepairOrder.vehicle_plate.contains(vehicle_plate))
    if is_rework is not None:
        query = query.filter(RepairOrder.is_rework == is_rework)
    if has_stockout is not None:
        query = query.filter(RepairOrder.has_stockout == has_stockout)

    total = query.count()
    orders = query.order_by(RepairOrder.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": o.id,
                "order_no": o.order_no,
                "vehicle_plate": o.vehicle_plate,
                "status": o.status,
                "is_rework": o.is_rework,
                "has_stockout": o.has_stockout,
                "mechanic": o.mechanic,
                "total_amount": o.total_amount,
                "actual_amount": o.actual_amount,
                "created_at": o.created_at,
                "delivery_time": o.delivery_time,
            }
            for o in orders
        ],
    }


@router.get("/{order_id}")
def get_repair_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="维修工单不存在")

    quotation = None
    if order.quotation_id:
        q = db.query(Quotation).filter(Quotation.id == order.quotation_id).first()
        if q:
            quotation = {
                "id": q.id,
                "quotation_no": q.quotation_no,
                "total_amount": q.total_amount,
                "parts_amount": q.parts_amount,
                "labor_amount": q.labor_amount,
                "parts": q.parts,
                "labor_items": q.labor_items,
                "insurance_covered": q.insurance_covered,
                "insurance_claim_no": q.insurance_claim_no,
                "created_at": q.created_at,
            }

    photos = db.query(InspectionPhoto).filter(
        InspectionPhoto.repair_order_id == order_id
    ).all()

    stock_tasks = db.query(StockTask).filter(
        StockTask.repair_order_id == order_id
    ).all()

    vehicle = None
    if order.vehicle_id:
        v = db.query(Vehicle).filter(Vehicle.id == order.vehicle_id).first()
        if v:
            vehicle = {
                "id": v.id,
                "plate_number": v.plate_number,
                "brand": v.brand,
                "model": v.model,
                "year": v.year,
                "mileage": v.mileage,
                "owner_name": v.owner_name,
                "warning_level": v.warning_level,
                "repair_count": v.repair_count,
            }

    return {
        "id": order.id,
        "order_no": order.order_no,
        "quotation": quotation,
        "vehicle": vehicle,
        "vehicle_plate": order.vehicle_plate,
        "status": order.status,
        "is_rework": order.is_rework,
        "rework_reason": order.rework_reason,
        "parent_order_id": order.parent_order_id,
        "total_amount": order.total_amount,
        "actual_amount": order.actual_amount,
        "mechanic": order.mechanic,
        "quality_inspector": order.quality_inspector,
        "fault_description": order.fault_description,
        "repair_content": order.repair_content,
        "has_stockout": order.has_stockout,
        "stockout_parts": order.stockout_parts,
        "start_time": order.start_time,
        "end_time": order.end_time,
        "quality_check_time": order.quality_check_time,
        "delivery_time": order.delivery_time,
        "cashier_no": order.cashier_no,
        "cashier_amount": order.cashier_amount,
        "cashier_time": order.cashier_time,
        "created_at": order.created_at,
        "inspection_photos": [
            {
                "id": p.id,
                "photo_type": p.photo_type,
                "photo_url": p.photo_url,
                "thumbnail_url": p.thumbnail_url,
                "description": p.description,
                "uploader": p.uploader,
                "is_quality_issue": p.is_quality_issue,
                "issue_notes": p.issue_notes,
                "created_at": p.created_at,
            }
            for p in photos
        ],
        "stock_tasks": [
            {
                "id": t.id,
                "task_no": t.task_no,
                "part_code": t.part_code,
                "part_name": t.part_name,
                "required_qty": t.required_qty,
                "status": t.status,
                "priority": t.priority,
                "notes": t.notes,
                "resolution": t.resolution,
                "assigned_to": t.assigned_to,
                "resolved_by": t.resolved_by,
                "resolved_at": t.resolved_at,
                "created_at": t.created_at,
            }
            for t in stock_tasks
        ],
    }


@router.post("/", response_model=schemas.RepairOrder)
def create_repair_order(
    order: schemas.RepairOrderCreate,
    db: Session = Depends(get_db),
):
    db_order = RepairOrder(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    if db_order.has_stockout and db_order.stockout_parts:
        for idx, part in enumerate(db_order.stockout_parts):
            if isinstance(part, dict):
                task = StockTask(
                    task_no=f"STK{db_order.id}{idx:03d}",
                    repair_order_id=db_order.id,
                    order_no=db_order.order_no,
                    part_code=part.get("code", ""),
                    part_name=part.get("name", ""),
                    required_qty=part.get("qty", 1),
                    created_by="system",
                    notes=part.get("notes", ""),
                )
                db.add(task)
        db.commit()

    return db_order


@router.get("/{order_id}/photos", response_model=List[schemas.InspectionPhoto])
def get_order_photos(order_id: int, db: Session = Depends(get_db)):
    photos = db.query(InspectionPhoto).filter(
        InspectionPhoto.repair_order_id == order_id
    ).all()
    return photos


@router.post("/{order_id}/photos", response_model=schemas.InspectionPhoto)
def add_order_photo(
    order_id: int,
    photo: schemas.InspectionPhotoCreate,
    db: Session = Depends(get_db),
):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="维修工单不存在")

    db_photo = InspectionPhoto(**photo.model_dump(), repair_order_id=order_id)
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo
