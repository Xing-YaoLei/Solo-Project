from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models import CleaningRecord, StatusLog, Device
from app import schemas
import uuid

router = APIRouter()


def generate_record_no() -> str:
    return f"CL{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"


def add_status_log(db: Session, record_id: int, from_status: Optional[schemas.CleaningStatus],
                   to_status: schemas.CleaningStatus, operator_id: Optional[int] = None, remarks: Optional[str] = None):
    log = StatusLog(
        cleaning_record_id=record_id,
        from_status=from_status,
        to_status=to_status,
        operator_id=operator_id,
        remarks=remarks
    )
    db.add(log)


@router.get("", response_model=schemas.CleaningRecordList)
def list_records(
    status: Optional[schemas.CleaningStatus] = None,
    store_point_id: Optional[int] = None,
    device_id: Optional[int] = None,
    source_channel: Optional[schemas.SourceChannel] = None,
    is_device_offline: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(CleaningRecord)
    if status:
        query = query.filter(CleaningRecord.status == status)
    if store_point_id:
        query = query.filter(CleaningRecord.store_point_id == store_point_id)
    if device_id:
        query = query.filter(CleaningRecord.device_id == device_id)
    if source_channel:
        query = query.filter(CleaningRecord.source_channel == source_channel)
    if is_device_offline is not None:
        query = query.filter(CleaningRecord.is_device_offline == is_device_offline)

    total = query.count()
    items = query.order_by(CleaningRecord.created_at.desc()).offset(skip).limit(limit).all()
    return schemas.CleaningRecordList(total=total, items=items)


@router.get("/{record_id}", response_model=schemas.CleaningRecord)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    return record


@router.post("", response_model=schemas.CleaningRecord)
def create_record(record_in: schemas.CleaningRecordCreate, db: Session = Depends(get_db)):
    record_data = record_in.model_dump()
    record_data["record_no"] = generate_record_no()

    device = db.query(Device).filter(Device.id == record_in.device_id).first()
    if device and device.status == schemas.DeviceStatus.OFFLINE:
        record_data["is_device_offline"] = True

    record = CleaningRecord(**record_data)
    db.add(record)
    db.flush()

    add_status_log(db, record.id, None, schemas.CleaningStatus.DRAFT)

    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=schemas.CleaningRecord)
def update_record(record_id: int, record_in: schemas.CleaningRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if record.status == schemas.CleaningStatus.CLOSED:
        raise HTTPException(status_code=400, detail="已关闭的单据不可修改")

    update_data = record_in.model_dump(exclude_unset=True)
    new_status = update_data.pop("status", None)

    for key, value in update_data.items():
        setattr(record, key, value)

    if new_status and new_status != record.status:
        add_status_log(db, record.id, record.status, new_status, remarks="状态更新")
        record.status = new_status

    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/submit-review", response_model=schemas.CleaningRecord)
def submit_for_review(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if record.status not in [schemas.CleaningStatus.DRAFT, schemas.CleaningStatus.SUPPLEMENT_INFO]:
        raise HTTPException(status_code=400, detail=f"当前状态 {record.status} 不可提交复核")

    add_status_log(db, record.id, record.status, schemas.CleaningStatus.PENDING_REVIEW, remarks="提交复核")
    record.status = schemas.CleaningStatus.PENDING_REVIEW
    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/start-review", response_model=schemas.CleaningRecord)
def start_review(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if record.status != schemas.CleaningStatus.PENDING_REVIEW:
        raise HTTPException(status_code=400, detail=f"当前状态 {record.status} 不可开始复核")

    add_status_log(db, record.id, record.status, schemas.CleaningStatus.REVIEWING, remarks="开始复核")
    record.status = schemas.CleaningStatus.REVIEWING
    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/review", response_model=schemas.CleaningRecord)
def review_record(record_id: int, review_in: schemas.CleaningRecordReview, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if record.status != schemas.CleaningStatus.REVIEWING:
        raise HTTPException(status_code=400, detail=f"当前状态 {record.status} 不可复核")

    record.review_result = review_in.review_result
    record.review_remarks = review_in.review_remarks
    record.review_photos = review_in.review_photos
    record.review_date = datetime.utcnow()

    if review_in.need_supplement:
        add_status_log(db, record.id, record.status, schemas.CleaningStatus.SUPPLEMENT_INFO, remarks="需补资料")
        record.status = schemas.CleaningStatus.SUPPLEMENT_INFO
    else:
        record.inspection_result = review_in.review_result
        if record.cleaning_items:
            total = len(record.cleaning_items)
            completed = sum(1 for item in record.cleaning_items if item.get("completed", False))
            record.qualified_rate = round(completed / total * 100, 2) if total > 0 else 0.0
        add_status_log(db, record.id, record.status, schemas.CleaningStatus.COMPLETED, remarks="复核完成")
        record.status = schemas.CleaningStatus.COMPLETED

    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/close", response_model=schemas.CleaningRecord)
def close_record(record_id: int, close_in: schemas.CleaningRecordClose, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if record.status not in [schemas.CleaningStatus.COMPLETED, schemas.CleaningStatus.CLOSED]:
        raise HTTPException(status_code=400, detail=f"当前状态 {record.status} 不可关闭")

    add_status_log(db, record.id, record.status, schemas.CleaningStatus.CLOSED, remarks=close_in.close_remarks)
    record.status = schemas.CleaningStatus.CLOSED
    record.close_reason = close_in.close_reason
    record.close_remarks = close_in.close_remarks
    record.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/handle-offline")
def handle_device_offline(record_id: int, remarks: Optional[str] = None, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    if not record.is_device_offline:
        raise HTTPException(status_code=400, detail="该单据无设备离线异常")

    record.offline_handled = True
    record.offline_remarks = remarks
    db.commit()
    return {"status": "ok", "message": "离线异常已处理"}


@router.get("/{record_id}/status-logs", response_model=List[schemas.StatusLog])
def get_status_logs(record_id: int, db: Session = Depends(get_db)):
    record = db.query(CleaningRecord).filter(CleaningRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="清洁单据不存在")
    return record.status_logs
