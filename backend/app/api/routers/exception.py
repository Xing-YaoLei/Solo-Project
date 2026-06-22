from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    ExceptionOrder,
    SamplingRecord,
    User,
    UserRole,
    ExceptionType,
    ExceptionStatus,
)
from app.schemas import (
    ExceptionOrderCreate,
    ExceptionOrderUpdate,
    ExceptionStatusUpdate,
    ExceptionOrderResponse,
    ExceptionOrderListResponse,
    StatusChangeLogListResponse,
)
from app.services import StatusFlowService
from app.api.routers.auth import get_current_user, require_roles
from app.tasks.notification_tasks import notify_status_change_task, notify_exception_created_task

router = APIRouter(prefix="/api/exceptions", tags=["异常单"])


@router.post("", response_model=ExceptionOrderResponse, status_code=status.HTTP_201_CREATED)
def create_exception_order(
    exception_in: ExceptionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    sampling = db.query(SamplingRecord).filter(SamplingRecord.id == exception_in.sampling_id).first()
    if not sampling:
        raise HTTPException(status_code=400, detail="抽样记录不存在")

    exception = ExceptionOrder(**exception_in.model_dump())
    db.add(exception)
    db.commit()
    db.refresh(exception)

    notify_exception_created_task.delay(
        exception_id=exception.id,
        exception_type=exception.exception_type.value,
        sampling_id=exception.sampling_id,
        responsible_person=exception.responsible_person,
        root_cause=exception.root_cause
    )

    return exception


@router.get("", response_model=ExceptionOrderListResponse)
def list_exception_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sampling_id: Optional[int] = None,
    exception_type: Optional[ExceptionType] = None,
    status: Optional[ExceptionStatus] = None,
    responsible_person: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ExceptionOrder)
    if sampling_id:
        query = query.filter(ExceptionOrder.sampling_id == sampling_id)
    if exception_type:
        query = query.filter(ExceptionOrder.exception_type == exception_type)
    if status:
        query = query.filter(ExceptionOrder.status == status)
    if responsible_person:
        query = query.filter(ExceptionOrder.responsible_person == responsible_person)

    total = query.count()
    items = query.order_by(ExceptionOrder.created_at.desc()).offset(skip).limit(limit).all()
    return ExceptionOrderListResponse(total=total, items=items)


@router.get("/{exception_id}", response_model=ExceptionOrderResponse)
def get_exception_order(
    exception_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return exception


@router.put("/{exception_id}", response_model=ExceptionOrderResponse)
def update_exception_order(
    exception_id: int,
    exception_in: ExceptionOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    update_data = exception_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exception, field, value)

    db.commit()
    db.refresh(exception)
    return exception


@router.post("/{exception_id}/handle")
def handle_exception(
    exception_id: int,
    handling_result: str,
    root_cause: Optional[str] = None,
    responsible_person: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    if handling_result:
        exception.handling_result = handling_result
    if root_cause:
        exception.root_cause = root_cause
    if responsible_person:
        exception.responsible_person = responsible_person

    old_status = exception.status
    exception = StatusFlowService.update_exception_status(
        db, exception, ExceptionStatus.PROCESSING, current_user.id, "处理中"
    )

    db.commit()
    db.refresh(exception)

    notify_status_change_task.delay(
        entity_type="exception_order",
        entity_id=exception.id,
        old_status=old_status.value if old_status else None,
        new_status=exception.status.value,
        changed_by=current_user.id,
        changed_by_name=current_user.username,
        extra_data={"处理结果": handling_result}
    )

    return {"message": "异常单处理信息已更新", "exception_id": exception.id}


@router.post("/{exception_id}/status", response_model=ExceptionOrderResponse)
def update_exception_status(
    exception_id: int,
    status_in: ExceptionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.MANAGER))
):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    old_status = exception.status

    exception = StatusFlowService.update_exception_status(
        db, exception, status_in.status, current_user.id, status_in.remark
    )
    db.commit()
    db.refresh(exception)

    type_map = {
        "evidence_missing": "证据缺失",
        "non_compliance": "不合规",
        "other": "其他"
    }
    notify_status_change_task.delay(
        entity_type="exception_order",
        entity_id=exception.id,
        old_status=old_status.value if old_status else None,
        new_status=exception.status.value,
        changed_by=current_user.id,
        changed_by_name=current_user.username,
        extra_data={
            "异常类型": type_map.get(exception.exception_type.value, exception.exception_type.value),
            "负责人": exception.responsible_person or ""
        }
    )

    return exception


@router.get("/{exception_id}/status-logs", response_model=StatusChangeLogListResponse)
def get_exception_status_logs(
    exception_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs, total = StatusFlowService.get_status_history(db, "exception_order", exception_id, skip, limit)
    return StatusChangeLogListResponse(total=total, items=logs)


@router.delete("/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exception_order(
    exception_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    db.delete(exception)
    db.commit()
