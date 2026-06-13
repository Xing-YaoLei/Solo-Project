import os
import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, RoleChecker
from app.models import (
    ReplenishmentOrder, ReplenishmentStatus, ReplenishmentItem,
    BatchCode, QCRecord, QCImage, Discrepancy, DiscrepancyType,
    TemperatureRecord, TemperatureAlert, TemperatureAlertStatus,
    Attachment, ActionLog, User, RoleEnum, Store, Product,
    AlertHistory,
)
from app.schemas import (
    ReplenishmentOrderCreate, ReplenishmentOrderUpdate,
    ReplenishmentOrderResponse, ReplenishmentOrderListResponse,
    ReplenishmentOrderTransition, BatchOperationRequest,
    BatchCodeCreate, BatchCodeUpdate, BatchCodeResponse,
    QCRecordCreate, QCRecordUpdate, QCRecordResponse,
    DiscrepancyCreate, DiscrepancyResolve, DiscrepancyResponse,
    TemperatureRecordCreate, TemperatureRecordResponse,
    AttachmentResponse, ActionLogResponse,
)

router = APIRouter(prefix="/api/orders", tags=["补货单"])

STATUS_TRANSITIONS = {
    ReplenishmentStatus.DRAFT: [ReplenishmentStatus.PENDING_LOAD, ReplenishmentStatus.CANCELLED],
    ReplenishmentStatus.PENDING_LOAD: [ReplenishmentStatus.LOADED, ReplenishmentStatus.CANCELLED],
    ReplenishmentStatus.LOADED: [ReplenishmentStatus.IN_TRANSIT],
    ReplenishmentStatus.IN_TRANSIT: [ReplenishmentStatus.ARRIVED],
    ReplenishmentStatus.ARRIVED: [ReplenishmentStatus.QC_PENDING],
    ReplenishmentStatus.QC_PENDING: [ReplenishmentStatus.QC_DONE, ReplenishmentStatus.DISCREPANCY],
    ReplenishmentStatus.DISCREPANCY: [ReplenishmentStatus.QC_DONE],
    ReplenishmentStatus.QC_DONE: [ReplenishmentStatus.COMPLETED],
}


def _generate_order_no() -> str:
    today = datetime.now().strftime("%Y%m%d")
    return f"RP{today}{uuid.uuid4().hex[:6].upper()}"


def _validate_transition(current: ReplenishmentStatus, target: ReplenishmentStatus) -> bool:
    if current == target:
        return True
    allowed = STATUS_TRANSITIONS.get(current, [])
    return target in allowed


def _log_action(db: Session, order_id: int, user_id: int, action: str, detail: dict = None):
    log = ActionLog(
        order_id=order_id,
        user_id=user_id,
        action=action,
        detail=detail or {},
    )
    db.add(log)


@router.post("", response_model=ReplenishmentOrderResponse)
def create_order(
    order_in: ReplenishmentOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    order_no = _generate_order_no()
    db_order = ReplenishmentOrder(
        order_no=order_no,
        store_id=order_in.store_id,
        planned_date=order_in.planned_date,
        truck_no=order_in.truck_no,
        driver_name=order_in.driver_name,
        driver_phone=order_in.driver_phone,
        loading_list_no=order_in.loading_list_no,
        remark=order_in.remark,
        status=ReplenishmentStatus.DRAFT,
        created_by=current_user.id,
    )
    for item_in in order_in.items:
        db_item = ReplenishmentItem(**item_in.model_dump())
        db_order.items.append(db_item)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    _log_action(db, db_order.id, current_user.id, "create_order", {"order_no": order_no})
    db.commit()
    return db_order


@router.get("", response_model=dict)
def list_orders(
    status: Optional[ReplenishmentStatus] = Query(None),
    store_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ReplenishmentOrder).join(Store)
    if status:
        q = q.filter(ReplenishmentOrder.status == status)
    if store_id:
        q = q.filter(ReplenishmentOrder.store_id == store_id)
    if date_from:
        q = q.filter(ReplenishmentOrder.planned_date >= date_from)
    if date_to:
        q = q.filter(ReplenishmentOrder.planned_date <= date_to)
    if keyword:
        q = q.filter(or_(
            ReplenishmentOrder.order_no.ilike(f"%{keyword}%"),
            Store.name.ilike(f"%{keyword}%"),
            ReplenishmentOrder.truck_no.ilike(f"%{keyword}%"),
            ReplenishmentOrder.loading_list_no.ilike(f"%{keyword}%"),
        ))
    total = q.count()
    orders = (
        q.order_by(ReplenishmentOrder.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    result = []
    for o in orders:
        has_alerts = any(a.status != TemperatureAlertStatus.CLOSED for a in o.alerts)
        has_discrepancies = any(not d.resolved for d in o.discrepancies)
        result.append(ReplenishmentOrderListResponse(
            id=o.id,
            order_no=o.order_no,
            store_id=o.store_id,
            store_name=o.store.name if o.store else None,
            status=o.status,
            planned_date=o.planned_date,
            truck_no=o.truck_no,
            driver_name=o.driver_name,
            loading_list_no=o.loading_list_no,
            created_at=o.created_at,
            updated_at=o.updated_at,
            has_alerts=has_alerts,
            has_discrepancies=has_discrepancies,
        ))
    return {"total": total, "page": page, "page_size": page_size, "items": result}


@router.get("/{order_id}", response_model=ReplenishmentOrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=ReplenishmentOrderResponse)
def update_order(
    order_id: int,
    order_in: ReplenishmentOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.WAREHOUSE, RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in [ReplenishmentStatus.DRAFT, ReplenishmentStatus.PENDING_LOAD]:
        raise HTTPException(status_code=400, detail="Only draft or pending_load orders can be edited")
    update_data = order_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    _log_action(db, order.id, current_user.id, "update_order", update_data)
    db.commit()
    return order


@router.post("/{order_id}/transition", response_model=ReplenishmentOrderResponse)
def transition_order_status(
    order_id: int,
    trans_in: ReplenishmentOrderTransition,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    target = trans_in.target_status
    if not _validate_transition(order.status, target):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status.value} to {target.value}",
        )
    old_status = order.status
    order.status = target
    now = datetime.utcnow()
    if target == ReplenishmentStatus.LOADED:
        order.loading_time = now
    elif target == ReplenishmentStatus.IN_TRANSIT:
        order.departure_time = now
    elif target == ReplenishmentStatus.ARRIVED:
        order.arrival_time = now
    elif target in [ReplenishmentStatus.COMPLETED, ReplenishmentStatus.QC_DONE]:
        order.reviewed_by = current_user.id
        order.reviewed_at = now
    db.commit()
    db.refresh(order)
    _log_action(
        db, order.id, current_user.id, "status_transition",
        {"from": old_status.value, "to": target.value, "remark": trans_in.remark},
    )
    db.commit()
    return order


@router.post("/batch-operation", response_model=dict)
def batch_operate_orders(
    req: BatchOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success, failed = [], []
    for oid in req.order_ids:
        order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == oid).first()
        if not order:
            failed.append({"id": oid, "reason": "Order not found"})
            continue
        if req.target_status:
            if not _validate_transition(order.status, req.target_status):
                failed.append({"id": oid, "reason": f"Invalid transition: {order.status.value} -> {req.target_status.value}"})
                continue
            old_status = order.status
            order.status = req.target_status
            _log_action(
                db, order.id, current_user.id, "batch_status_transition",
                {"from": old_status.value, "to": req.target_status.value, "remark": req.remark},
            )
            success.append(oid)
        else:
            success.append(oid)
    db.commit()
    return {"success_count": len(success), "failed_count": len(failed), "success_ids": success, "failed": failed}


@router.post("/{order_id}/batches", response_model=BatchCodeResponse)
def add_batch_code(
    order_id: int,
    batch_in: BatchCodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.WAREHOUSE, RoleEnum.DRIVER, RoleEnum.ADMIN])),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_batch = BatchCode(order_id=order_id, **batch_in.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    _log_action(db, order_id, current_user.id, "add_batch", {"batch_no": batch_in.batch_no})
    db.commit()
    return db_batch


@router.get("/{order_id}/batches", response_model=list[BatchCodeResponse])
def list_batch_codes(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.batches


@router.patch("/{order_id}/batches/{batch_id}", response_model=BatchCodeResponse)
def verify_batch_code(
    order_id: int,
    batch_id: int,
    batch_in: BatchCodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.WAREHOUSE, RoleEnum.QC, RoleEnum.ADMIN])),
):
    batch = db.query(BatchCode).filter(BatchCode.id == batch_id, BatchCode.order_id == order_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    update_data = batch_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)
    if batch_in.verified:
        batch.verified_by = current_user.id
        batch.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(batch)
    return batch


@router.post("/{order_id}/qc", response_model=QCRecordResponse)
def create_qc_record(
    order_id: int,
    qc_in: QCRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.QC, RoleEnum.ADMIN])),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_qc = QCRecord(
        order_id=order_id,
        product_id=qc_in.product_id,
        batch_code_id=qc_in.batch_code_id,
        checked_by=current_user.id,
        temperature=qc_in.temperature,
        appearance_ok=qc_in.appearance_ok,
        packaging_ok=qc_in.packaging_ok,
        temperature_ok=qc_in.temperature_ok,
        passed=qc_in.passed,
        remark=qc_in.remark,
    )
    for img in qc_in.images:
        db_qc.images.append(QCImage(**img.model_dump()))
    db.add(db_qc)
    db.commit()
    db.refresh(db_qc)
    if order.status == ReplenishmentStatus.QC_PENDING:
        if not qc_in.passed:
            order.status = ReplenishmentStatus.DISCREPANCY
    _log_action(db, order_id, current_user.id, "qc_record", {"passed": qc_in.passed, "product_id": qc_in.product_id})
    db.commit()
    return db_qc


@router.get("/{order_id}/qc", response_model=list[QCRecordResponse])
def list_qc_records(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.qc_records


@router.post("/{order_id}/discrepancies", response_model=DiscrepancyResponse)
def create_discrepancy(
    order_id: int,
    disc_in: DiscrepancyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_disc = Discrepancy(
        order_id=order_id,
        reported_by=current_user.id,
        **disc_in.model_dump(),
    )
    db.add(db_disc)
    if order.status not in [ReplenishmentStatus.DISCREPANCY, ReplenishmentStatus.COMPLETED]:
        order.status = ReplenishmentStatus.DISCREPANCY
    db.commit()
    db.refresh(db_disc)
    _log_action(
        db, order_id, current_user.id, "report_discrepancy",
        {"type": disc_in.type.value, "product_id": disc_in.product_id},
    )
    db.commit()
    return db_disc


@router.post("/{order_id}/discrepancies/{disc_id}/resolve", response_model=DiscrepancyResponse)
def resolve_discrepancy(
    order_id: int,
    disc_id: int,
    resolve_in: DiscrepancyResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([RoleEnum.PURCHASER, RoleEnum.ADMIN])),
):
    disc = db.query(Discrepancy).filter(Discrepancy.id == disc_id, Discrepancy.order_id == order_id).first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy not found")
    disc.resolved = True
    disc.resolved_by = current_user.id
    disc.resolved_at = datetime.utcnow()
    disc.resolution_note = resolve_in.resolution_note
    db.commit()
    db.refresh(disc)
    order = disc.order
    unresolved = db.query(Discrepancy).filter(
        Discrepancy.order_id == order_id, Discrepancy.resolved == False
    ).count()
    if order.status == ReplenishmentStatus.DISCREPANCY and unresolved == 0:
        order.status = ReplenishmentStatus.QC_DONE
        db.commit()
    _log_action(db, order_id, current_user.id, "resolve_discrepancy", {"disc_id": disc_id})
    db.commit()
    return disc


@router.get("/{order_id}/discrepancies", response_model=list[DiscrepancyResponse])
def list_discrepancies(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.discrepancies


@router.post("/{order_id}/temperature", response_model=TemperatureRecordResponse)
def add_temperature_record(
    order_id: int,
    temp_in: TemperatureRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    is_out = False
    min_t = temp_in.min_temp
    max_t = temp_in.max_temp
    if min_t is not None and max_t is not None:
        is_out = temp_in.temperature < min_t or temp_in.temperature > max_t
    db_temp = TemperatureRecord(
        order_id=order_id,
        temperature=temp_in.temperature,
        min_temp=min_t,
        max_temp=max_t,
        is_out_of_range=is_out,
        location=temp_in.location,
        device_id=temp_in.device_id,
        recorded_at=temp_in.recorded_at or datetime.utcnow(),
    )
    db.add(db_temp)
    db.commit()
    db.refresh(db_temp)
    if is_out:
        alert = TemperatureAlert(
            order_id=order_id,
            trigger_record_id=db_temp.id,
            status=TemperatureAlertStatus.OPEN,
            alert_type="temperature_breach",
            severity="warning" if abs(temp_in.temperature - (min_t or 0)) < 3 else "critical",
            min_temp=min_t,
            max_temp=max_t,
            actual_temp=temp_in.temperature,
            source_type="manual",
            description=f"温度越界记录: {temp_in.temperature}°C, 允许范围: {min_t}~{max_t}°C",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        ah = AlertHistory(
            alert_id=alert.id,
            to_status=TemperatureAlertStatus.OPEN,
            action="created",
            note="自动创建，温度越界",
            operator_id=current_user.id,
        )
        db.add(ah)
        db.commit()
    return db_temp


@router.get("/{order_id}/temperature", response_model=list[TemperatureRecordResponse])
def list_temperature_records(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.temperature_records


@router.post("/{order_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    order_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    db_attach = Attachment(
        order_id=order_id,
        file_path=file_path,
        file_name=file.filename or safe_name,
        file_type=file.content_type,
        file_size=len(content),
        category=category,
        uploaded_by=current_user.id,
    )
    db.add(db_attach)
    db.commit()
    db.refresh(db_attach)
    _log_action(
        db, order_id, current_user.id, "upload_attachment",
        {"file_name": file.filename, "category": category},
    )
    db.commit()
    return db_attach


@router.get("/{order_id}/attachments", response_model=list[AttachmentResponse])
def list_attachments(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.attachments


@router.get("/{order_id}/logs", response_model=list[ActionLogResponse])
def list_action_logs(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ReplenishmentOrder).filter(ReplenishmentOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return db.query(ActionLog).filter(ActionLog.order_id == order_id).order_by(ActionLog.created_at.desc()).all()
