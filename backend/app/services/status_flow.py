from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models import StatusChangeLog, SamplingRecord, RectificationPlan, ExceptionOrder
from app.models import SamplingStatus, RectificationStatus, ExceptionStatus


class StatusFlowService:
    @staticmethod
    def create_status_log(
        db: Session,
        entity_type: str,
        entity_id: int,
        old_status: Optional[str],
        new_status: str,
        changed_by: int,
        remark: Optional[str] = None
    ) -> StatusChangeLog:
        log = StatusChangeLog(
            entity_type=entity_type,
            entity_id=entity_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            remark=remark
        )
        db.add(log)
        db.flush()
        return log

    @staticmethod
    def update_sampling_status(
        db: Session,
        record: SamplingRecord,
        new_status: SamplingStatus,
        changed_by: int,
        remark: Optional[str] = None
    ) -> SamplingRecord:
        old_status = record.status.value if record.status else None
        if old_status != new_status.value:
            StatusFlowService.create_status_log(
                db=db,
                entity_type="sampling_record",
                entity_id=record.id,
                old_status=old_status,
                new_status=new_status.value,
                changed_by=changed_by,
                remark=remark
            )
            record.status = new_status
        return record

    @staticmethod
    def update_rectification_status(
        db: Session,
        plan: RectificationPlan,
        new_status: RectificationStatus,
        changed_by: int,
        remark: Optional[str] = None
    ) -> RectificationPlan:
        old_status = plan.status.value if plan.status else None
        if old_status != new_status.value:
            StatusFlowService.create_status_log(
                db=db,
                entity_type="rectification_plan",
                entity_id=plan.id,
                old_status=old_status,
                new_status=new_status.value,
                changed_by=changed_by,
                remark=remark
            )
            plan.status = new_status
        return plan

    @staticmethod
    def update_exception_status(
        db: Session,
        order: ExceptionOrder,
        new_status: ExceptionStatus,
        changed_by: int,
        remark: Optional[str] = None
    ) -> ExceptionOrder:
        old_status = order.status.value if order.status else None
        if old_status != new_status.value:
            StatusFlowService.create_status_log(
                db=db,
                entity_type="exception_order",
                entity_id=order.id,
                old_status=old_status,
                new_status=new_status.value,
                changed_by=changed_by,
                remark=remark
            )
            order.status = new_status
        return order

    @staticmethod
    def get_status_history(
        db: Session,
        entity_type: str,
        entity_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[list[StatusChangeLog], int]:
        query = db.query(StatusChangeLog).filter(
            StatusChangeLog.entity_type == entity_type,
            StatusChangeLog.entity_id == entity_id
        )
        total = query.count()
        logs = query.order_by(StatusChangeLog.changed_at.desc()).offset(skip).limit(limit).all()
        return logs, total
