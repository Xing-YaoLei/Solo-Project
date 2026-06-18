from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import User, Station, WorkOrder, WorkOrderStatus
from ..schemas import (
    StationCreate,
    StationUpdate,
    StationResponse,
    StationSchedule,
)
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/stations", tags=["工位管理"])


@router.get("", response_model=List[StationSchedule])
def list_stations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stations = (
        db.query(Station)
        .options(joinedload(Station.current_work_order))
        .all()
    )
    for s in stations:
        if s.current_work_order_id:
            wo = db.query(WorkOrder).filter(WorkOrder.id == s.current_work_order_id).first()
            s.current_work_order = wo
    return stations


@router.post("", response_model=StationResponse)
def create_station(
    station_in: StationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Station).filter(Station.name == station_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="工位名称已存在")
    station = Station(**station_in.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.get("/{station_id}", response_model=StationSchedule)
def get_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="工位不存在")
    if station.current_work_order_id:
        wo = db.query(WorkOrder).filter(WorkOrder.id == station.current_work_order_id).first()
        station.current_work_order = wo
    return station


@router.put("/{station_id}", response_model=StationResponse)
def update_station(
    station_id: int,
    station_in: StationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="工位不存在")
    for key, value in station_in.model_dump(exclude_unset=True).items():
        setattr(station, key, value)
    db.commit()
    db.refresh(station)
    return station


@router.delete("/{station_id}")
def delete_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="工位不存在")
    db.delete(station)
    db.commit()
    return {"message": "删除成功"}
