from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import (
    User, WorkOrder, WorkOrderStatus, Vehicle, Station, Diagnostic, WorkOrderItem
)
from ..schemas import (
    WorkOrderCreate,
    WorkOrderUpdate,
    WorkOrderResponse,
    WorkOrderDetailResponse,
    DiagnosticCreate,
    DiagnosticUpdate,
    DiagnosticResponse,
    WorkOrderItemCreate,
    WorkOrderItemUpdate,
    WorkOrderItemResponse,
)

router = APIRouter(tags=["工单管理"])


def generate_order_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    count = (
        db.query(WorkOrder)
        .filter(WorkOrder.order_no.like(f"WO{today}%"))
        .count()
    )
    return f"WO{today}{count + 1:04d}"


@router.get("/work-orders", response_model=List[WorkOrderResponse])
def list_work_orders(
    status: Optional[WorkOrderStatus] = None,
    station_id: Optional[int] = None,
    technician_id: Optional[int] = None,
    vehicle_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(WorkOrder)
    if status:
        query = query.filter(WorkOrder.status == status)
    if station_id:
        query = query.filter(WorkOrder.station_id == station_id)
    if technician_id:
        query = query.filter(WorkOrder.technician_id == technician_id)
    if vehicle_id:
        query = query.filter(WorkOrder.vehicle_id == vehicle_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/work-orders", response_model=WorkOrderResponse)
def create_work_order(
    wo_in: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == wo_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="车辆不存在")

    order_no = generate_order_no(db)
    wo = WorkOrder(**wo_in.model_dump(), order_no=order_no)

    if wo_in.station_id:
        station = db.query(Station).filter(Station.id == wo_in.station_id).first()
        if station:
            from ..models import StationStatus
            station.status = StationStatus.OCCUPIED
            station.current_work_order_id = None

    db.add(wo)
    db.commit()
    db.refresh(wo)

    if wo_in.station_id:
        station = db.query(Station).filter(Station.id == wo_in.station_id).first()
        if station:
            from ..models import StationStatus
            station.status = StationStatus.OCCUPIED
            station.current_work_order_id = wo.id
        db.commit()

    return wo


@router.get("/work-orders/{order_id}", response_model=WorkOrderDetailResponse)
def get_work_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.vehicle),
            joinedload(WorkOrder.station),
            joinedload(WorkOrder.technician),
            joinedload(WorkOrder.diagnostics),
            joinedload(WorkOrder.items),
        )
        .filter(WorkOrder.id == order_id)
        .first()
    )
    if not wo:
        raise HTTPException(status_code=404, detail="工单不存在")
    return wo


@router.put("/work-orders/{order_id}", response_model=WorkOrderResponse)
def update_work_order(
    order_id: int,
    wo_in: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="工单不存在")

    old_station_id = wo.station_id
    old_status = wo.status

    for key, value in wo_in.model_dump(exclude_unset=True).items():
        setattr(wo, key, value)

    if wo_in.station_id is not None and wo_in.station_id != old_station_id:
        if old_station_id:
            old_station = db.query(Station).filter(Station.id == old_station_id).first()
            if old_station:
                from ..models import StationStatus
                old_station.status = StationStatus.IDLE
                old_station.current_work_order_id = None
        if wo_in.station_id:
            new_station = db.query(Station).filter(Station.id == wo_in.station_id).first()
            if new_station:
                from ..models import StationStatus
                new_station.status = StationStatus.OCCUPIED
                new_station.current_work_order_id = wo.id

    if wo_in.status and wo_in.status in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CLOSED]:
        if old_status not in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CLOSED]:
            wo.actual_end = datetime.utcnow()
            if wo.station_id:
                station = db.query(Station).filter(Station.id == wo.station_id).first()
                if station:
                    from ..models import StationStatus
                    station.status = StationStatus.IDLE
                    station.current_work_order_id = None
    if wo_in.status and wo_in.status == WorkOrderStatus.IN_PROGRESS and not wo.actual_start:
        wo.actual_start = datetime.utcnow()

    db.commit()
    db.refresh(wo)
    return wo


@router.delete("/work-orders/{order_id}")
def delete_work_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="工单不存在")
    if wo.station_id:
        station = db.query(Station).filter(Station.id == wo.station_id).first()
        if station and station.current_work_order_id == wo.id:
            from ..models import StationStatus
            station.status = StationStatus.IDLE
            station.current_work_order_id = None
    db.delete(wo)
    db.commit()
    return {"message": "删除成功"}


@router.post("/work-orders/{order_id}/diagnostics", response_model=DiagnosticResponse)
def create_diagnostic(
    order_id: int,
    diag_in: DiagnosticCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="工单不存在")
    diag = Diagnostic(**diag_in.model_dump())
    db.add(diag)
    db.commit()
    db.refresh(diag)
    return diag


@router.get("/work-orders/{order_id}/diagnostics", response_model=List[DiagnosticResponse])
def list_diagnostics(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Diagnostic)
        .filter(Diagnostic.work_order_id == order_id)
        .order_by(Diagnostic.created_at.desc())
        .all()
    )


@router.put("/diagnostics/{diag_id}", response_model=DiagnosticResponse)
def update_diagnostic(
    diag_id: int,
    diag_in: DiagnosticUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    diag = db.query(Diagnostic).filter(Diagnostic.id == diag_id).first()
    if not diag:
        raise HTTPException(status_code=404, detail="诊断记录不存在")
    for key, value in diag_in.model_dump(exclude_unset=True).items():
        setattr(diag, key, value)
    db.commit()
    db.refresh(diag)
    return diag


@router.post("/work-orders/{order_id}/items", response_model=WorkOrderItemResponse)
def create_work_order_item(
    order_id: int,
    item_in: WorkOrderItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="工单不存在")
    item = WorkOrderItem(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/work-orders/{order_id}/items", response_model=List[WorkOrderItemResponse])
def list_work_order_items(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WorkOrderItem)
        .filter(WorkOrderItem.work_order_id == order_id)
        .all()
    )


@router.put("/work-order-items/{item_id}", response_model=WorkOrderItemResponse)
def update_work_order_item(
    item_id: int,
    item_in: WorkOrderItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WorkOrderItem).filter(WorkOrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="工单项目不存在")
    for key, value in item_in.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/work-order-items/{item_id}")
def delete_work_order_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WorkOrderItem).filter(WorkOrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="工单项目不存在")
    db.delete(item)
    db.commit()
    return {"message": "删除成功"}
