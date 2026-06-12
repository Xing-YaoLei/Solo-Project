from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.models import Device
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.Device])
def list_devices(
    status: Optional[schemas.DeviceStatus] = None,
    store_point_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Device)
    if status:
        query = query.filter(Device.status == status)
    if store_point_id:
        query = query.filter(Device.store_point_id == store_point_id)
    return query.offset(skip).limit(limit).all()


@router.get("/offline", response_model=List[schemas.Device])
def list_offline_devices(db: Session = Depends(get_db)):
    threshold = datetime.utcnow() - timedelta(minutes=settings.DEVICE_OFFLINE_THRESHOLD_MINUTES)
    return db.query(Device).filter(
        (Device.status == schemas.DeviceStatus.OFFLINE) |
        (Device.last_heartbeat.is_(None)) |
        (Device.last_heartbeat < threshold)
    ).all()


@router.get("/{device_id}", response_model=schemas.Device)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    return device


@router.post("", response_model=schemas.Device)
def create_device(device_in: schemas.DeviceCreate, db: Session = Depends(get_db)):
    existing = db.query(Device).filter(Device.device_code == device_in.device_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="设备编号已存在")
    device = Device(**device_in.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.put("/{device_id}", response_model=schemas.Device)
def update_device(device_id: int, device_in: schemas.DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    for key, value in device_in.model_dump(exclude_unset=True).items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/heartbeat")
def device_heartbeat(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    device.last_heartbeat = datetime.utcnow()
    device.status = schemas.DeviceStatus.ONLINE
    db.commit()
    return {"status": "ok"}


@router.post("/{device_id}/mark-offline")
def mark_device_offline(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    device.status = schemas.DeviceStatus.OFFLINE
    db.commit()
    return {"status": "ok", "device_status": device.status}
