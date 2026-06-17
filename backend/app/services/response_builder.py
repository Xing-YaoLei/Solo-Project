from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import (
    WorkOrder as WorkOrderModel,
    WorkOrderPhoto as WorkOrderPhotoModel,
    StatusLog as StatusLogModel,
    ReviewRecord as ReviewRecordModel,
    Communication as CommunicationModel,
    User as UserModel,
)
from app.schemas import (
    WorkOrder,
    WorkOrderPhoto,
    StatusLog,
    ReviewRecord,
    Communication,
    WorkOrderDailyItem,
    DispatchRule,
)


def _get_user_name(db: Session, user_id: Optional[int]) -> Optional[str]:
    if not user_id:
        return None
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    return user.full_name if user else None


def to_photo_schema(photo: WorkOrderPhotoModel) -> WorkOrderPhoto:
    return WorkOrderPhoto(
        id=photo.id,
        work_order_id=photo.work_order_id,
        url=photo.url,
        caption=photo.caption,
        photo_type=photo.photo_type,
        uploaded_by=photo.uploaded_by,
        created_at=photo.created_at,
    )


def to_dispatch_rule_schema(rule) -> DispatchRule:
    return DispatchRule(
        id=rule.id,
        name=rule.name,
        category=rule.category,
        priority=rule.priority,
        assigned_role=rule.assigned_role,
        default_assignee_id=rule.default_assignee_id,
        processing_hours=rule.processing_hours,
        description=rule.description,
        is_active=rule.is_active,
        created_at=rule.created_at,
    )


def to_status_log_schema(log: StatusLogModel) -> StatusLog:
    return StatusLog(
        id=log.id,
        work_order_id=log.work_order_id,
        from_status=log.from_status,
        to_status=log.to_status,
        remark=log.remark,
        operated_by=log.operated_by,
        created_at=log.created_at,
    )


def to_review_schema(db: Session, record: ReviewRecordModel) -> ReviewRecord:
    return ReviewRecord(
        id=record.id,
        work_order_id=record.work_order_id,
        reviewer_id=record.reviewer_id,
        reviewer_name=_get_user_name(db, record.reviewer_id),
        is_passed=record.is_passed,
        comment=record.comment,
        review_time=record.review_time,
    )


def to_communication_schema(db: Session, comm: CommunicationModel) -> Communication:
    return Communication(
        id=comm.id,
        work_order_id=comm.work_order_id,
        sender_id=comm.sender_id,
        sender_name=_get_user_name(db, comm.sender_id),
        content=comm.content,
        msg_type=comm.msg_type,
        created_at=comm.created_at,
    )


def to_work_order_schema(db: Session, order: WorkOrderModel) -> WorkOrder:
    return WorkOrder(
        id=order.id,
        order_no=order.order_no,
        title=order.title,
        description=order.description,
        location=order.location,
        category=order.category,
        priority=order.priority,
        status=order.status,
        reporter_name=order.reporter_name,
        reporter_phone=order.reporter_phone,
        created_by=order.created_by,
        assigned_to=order.assigned_to,
        assigned_worker_name=_get_user_name(db, order.assigned_to),
        creator_name=_get_user_name(db, order.created_by),
        deadline=order.deadline,
        processing_hours=order.processing_hours or 0,
        is_first_time_resolved=order.is_first_time_resolved,
        review_failed_count=order.review_failed_count or 0,
        created_at=order.created_at,
        updated_at=order.updated_at,
        completed_at=order.completed_at,
        closed_at=order.closed_at,
        photos=[to_photo_schema(p) for p in order.photos],
        status_logs=[to_status_log_schema(l) for l in order.status_logs],
        review_records=[to_review_schema(db, r) for r in order.review_records],
        communications=[to_communication_schema(db, c) for c in order.communications],
        dispatch_rules=[to_dispatch_rule_schema(r) for r in order.dispatch_rules],
    )


def to_work_order_list(db: Session, orders: List[WorkOrderModel]) -> List[WorkOrder]:
    return [to_work_order_schema(db, o) for o in orders]


def to_daily_item(db: Session, order: WorkOrderModel, is_overdue: bool, review_failed: bool) -> WorkOrderDailyItem:
    return WorkOrderDailyItem(
        id=order.id,
        order_no=order.order_no,
        title=order.title,
        status=order.status,
        priority=order.priority,
        category=order.category,
        location=order.location,
        assigned_worker_name=_get_user_name(db, order.assigned_to),
        deadline=order.deadline,
        is_overdue=is_overdue,
        review_failed=review_failed,
        created_at=order.created_at,
    )


def to_daily_list(db: Session, items: list[tuple]) -> List[WorkOrderDailyItem]:
    return [to_daily_item(db, o, overdue, failed) for (o, overdue, failed) in items]


def to_communication_list(db: Session, comms: List[CommunicationModel]) -> List[Communication]:
    return [to_communication_schema(db, c) for c in comms]
