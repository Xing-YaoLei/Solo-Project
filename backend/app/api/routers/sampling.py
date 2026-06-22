from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    SamplingRecord,
    AuditChecklist,
    User,
    UserRole,
    SamplingStatus,
    EvidenceStatus,
    StatusChangeLog,
)
from app.schemas import (
    SamplingRecordCreate,
    SamplingRecordUpdate,
    SamplingStatusUpdate,
    SamplingRecordResponse,
    SamplingRecordListResponse,
    StatusChangeLogListResponse,
)
from app.services import StatusFlowService, ExceptionService
from app.api.routers.auth import get_current_user, require_roles
from app.tasks.notification_tasks import notify_status_change_task, notify_exception_created_task

router = APIRouter(prefix="/api/sampling", tags=["抽样记录"])


@router.post("", response_model=SamplingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_sampling_record(
    record_in: SamplingRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR))
):
    checklist = db.query(AuditChecklist).filter(AuditChecklist.id == record_in.checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=400, detail="检查清单不存在")

    existing = db.query(SamplingRecord).filter(SamplingRecord.sample_code == record_in.sample_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="样本编码已存在")

    record = SamplingRecord(**record_in.model_dump())
    db.add(record)
    db.flush()

    exception = ExceptionService.check_and_create_exception_for_missing_evidence(
        db, record, current_user.id
    )

    db.commit()
    db.refresh(record)

    if exception:
        notify_exception_created_task.delay(
            exception_id=exception.id,
            exception_type=exception.exception_type.value,
            sampling_id=exception.sampling_id,
            responsible_person=exception.responsible_person,
            root_cause=exception.root_cause
        )

    return record


@router.get("", response_model=SamplingRecordListResponse)
def list_sampling_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    checklist_id: Optional[int] = None,
    status: Optional[SamplingStatus] = None,
    evidence_status: Optional[EvidenceStatus] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SamplingRecord)
    if checklist_id:
        query = query.filter(SamplingRecord.checklist_id == checklist_id)
    if status:
        query = query.filter(SamplingRecord.status == status)
    if evidence_status:
        query = query.filter(SamplingRecord.evidence_status == evidence_status)
    if keyword:
        query = query.filter(
            SamplingRecord.sample_name.contains(keyword) | SamplingRecord.sample_code.contains(keyword)
        )
    total = query.count()
    items = query.order_by(SamplingRecord.created_at.desc()).offset(skip).limit(limit).all()
    return SamplingRecordListResponse(total=total, items=items)


@router.get("/{record_id}", response_model=SamplingRecordResponse)
def get_sampling_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(SamplingRecord).filter(SamplingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="抽样记录不存在")
    return record


@router.put("/{record_id}", response_model=SamplingRecordResponse)
def update_sampling_record(
    record_id: int,
    record_in: SamplingRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR))
):
    record = db.query(SamplingRecord).filter(SamplingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="抽样记录不存在")

    old_evidence_status = record.evidence_status

    update_data = record_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.flush()

    if "evidence_status" in update_data and update_data["evidence_status"] != old_evidence_status:
        exception = ExceptionService.on_evidence_status_change(
            db, record, old_evidence_status, current_user.id
        )
        if exception:
            notify_exception_created_task.delay(
                exception_id=exception.id,
                exception_type=exception.exception_type.value,
                sampling_id=exception.sampling_id,
                responsible_person=exception.responsible_person,
                root_cause=exception.root_cause
            )

    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/status", response_model=SamplingRecordResponse)
def update_sampling_status(
    record_id: int,
    status_in: SamplingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    record = db.query(SamplingRecord).filter(SamplingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="抽样记录不存在")

    old_status = record.status

    record = StatusFlowService.update_sampling_status(
        db, record, status_in.status, current_user.id, status_in.remark
    )

    if status_in.status == SamplingStatus.REVIEWED and old_status != SamplingStatus.REVIEWED:
        exceptions = ExceptionService.on_sampling_status_reviewed(db, record, current_user.id)
        for exc in exceptions:
            notify_exception_created_task.delay(
                exception_id=exc.id,
                exception_type=exc.exception_type.value,
                sampling_id=exc.sampling_id,
                responsible_person=exc.responsible_person,
                root_cause=exc.root_cause
            )

    db.commit()
    db.refresh(record)

    notify_status_change_task.delay(
        entity_type="sampling_record",
        entity_id=record.id,
        old_status=old_status.value if old_status else None,
        new_status=record.status.value,
        changed_by=current_user.id,
        changed_by_name=current_user.username,
        extra_data={"样本名称": record.sample_name, "样本编码": record.sample_code}
    )

    return record


@router.get("/{record_id}/status-logs", response_model=StatusChangeLogListResponse)
def get_sampling_status_logs(
    record_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs, total = StatusFlowService.get_status_history(db, "sampling_record", record_id, skip, limit)
    return StatusChangeLogListResponse(total=total, items=logs)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sampling_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    record = db.query(SamplingRecord).filter(SamplingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="抽样记录不存在")

    db.delete(record)
    db.commit()
