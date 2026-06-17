from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List
import random
import string

from app.models import User, UserRole, WorkOrder, WorkOrderStatus, WorkOrderPriority
from app.models import WorkOrderPhoto, StatusLog, ReviewRecord, Communication, DispatchRule
from app.schemas import WorkOrderCreate, WorkOrderUpdate, WorkOrderAssign
from app.schemas import WorkOrderComplete, WorkOrderReview, WorkOrderDailyItem
from app.schemas import FirstTimeResolveStats


def generate_order_no() -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    random_str = ''.join(random.choices(string.digits, k=6))
    return f"WO{date_str}{random_str}"


def get_work_order(db: Session, order_id: int) -> Optional[WorkOrder]:
    return db.query(WorkOrder).filter(WorkOrder.id == order_id).first()


def get_work_order_by_no(db: Session, order_no: str) -> Optional[WorkOrder]:
    return db.query(WorkOrder).filter(WorkOrder.order_no == order_no).first()


def get_work_orders(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[WorkOrderStatus] = None,
    category: Optional[str] = None,
    priority: Optional[WorkOrderPriority] = None,
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
    keyword: Optional[str] = None,
    user_role: Optional[UserRole] = None,
    current_user_id: Optional[int] = None,
) -> tuple[List[WorkOrder], int]:
    query = db.query(WorkOrder)

    if user_role == UserRole.WORKER and current_user_id:
        query = query.filter(
            or_(
                WorkOrder.assigned_to == current_user_id,
                WorkOrder.created_by == current_user_id
            )
        )

    if status:
        query = query.filter(WorkOrder.status == status)
    if category:
        query = query.filter(WorkOrder.category == category)
    if priority:
        query = query.filter(WorkOrder.priority == priority)
    if assigned_to:
        query = query.filter(WorkOrder.assigned_to == assigned_to)
    if created_by:
        query = query.filter(WorkOrder.created_by == created_by)
    if keyword:
        query = query.filter(
            or_(
                WorkOrder.title.contains(keyword),
                WorkOrder.order_no.contains(keyword),
                WorkOrder.description.contains(keyword)
            )
        )

    total = query.count()
    orders = query.order_by(
        WorkOrder.priority.desc(),
        WorkOrder.created_at.desc()
    ).offset(skip).limit(limit).all()

    return orders, total


def get_daily_work_orders(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[WorkOrderDailyItem], int]:
    query = db.query(WorkOrder)

    if current_user.role == UserRole.WORKER:
        query = query.filter(
            or_(
                WorkOrder.assigned_to == current_user.id,
                WorkOrder.created_by == current_user.id
            )
        )

    query = query.filter(
        WorkOrder.status.in_([
            WorkOrderStatus.PENDING,
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.IN_PROGRESS,
            WorkOrderStatus.REVIEWING,
            WorkOrderStatus.REVIEW_FAILED,
        ])
    )

    total = query.count()
    orders = query.order_by(
        WorkOrder.priority.desc(),
        WorkOrder.created_at.asc()
    ).offset(skip).limit(limit).all()

    now = datetime.now()
    daily_items = []
    for order in orders:
        is_overdue = False
        if order.deadline and order.status not in [WorkOrderStatus.COMPLETED, WorkOrderStatus.CLOSED]:
            is_overdue = order.deadline < now

        review_failed = order.status == WorkOrderStatus.REVIEW_FAILED

        worker_name = None
        if order.assigned_worker:
            worker_name = order.assigned_worker.full_name

        daily_items.append(WorkOrderDailyItem(
            id=order.id,
            order_no=order.order_no,
            title=order.title,
            status=order.status,
            priority=order.priority,
            category=order.category,
            location=order.location,
            assigned_worker_name=worker_name,
            deadline=order.deadline,
            is_overdue=is_overdue,
            review_failed=review_failed,
            created_at=order.created_at,
        ))

    return daily_items, total


def create_work_order(db: Session, order_in: WorkOrderCreate, creator: User) -> WorkOrder:
    order_no = generate_order_no()
    while get_work_order_by_no(db, order_no):
        order_no = generate_order_no()

    db_order = WorkOrder(
        order_no=order_no,
        title=order_in.title,
        description=order_in.description,
        location=order_in.location,
        category=order_in.category,
        priority=order_in.priority,
        reporter_name=order_in.reporter_name,
        reporter_phone=order_in.reporter_phone,
        created_by=creator.id,
    )

    applicable_rules = db.query(DispatchRule).filter(
        DispatchRule.is_active == True,
        DispatchRule.category == order_in.category,
    ).all()

    matched_rules = []
    for rule in applicable_rules:
        if rule.priority is None or rule.priority == order_in.priority:
            matched_rules.append(rule)

    if not matched_rules and applicable_rules:
        matched_rules = [applicable_rules[0]]

    if matched_rules:
        rule = matched_rules[0]
        db_order.deadline = datetime.now() + timedelta(hours=rule.processing_hours)
        db_order.dispatch_rules = matched_rules
        db_order.processing_hours = rule.processing_hours

        if rule.default_assignee_id:
            db_order.assigned_to = rule.default_assignee_id
            db_order.status = WorkOrderStatus.ASSIGNED

    db.add(db_order)
    db.flush()

    if order_in.photos:
        for photo_in in order_in.photos:
            db_photo = WorkOrderPhoto(
                work_order_id=db_order.id,
                url=photo_in.url,
                caption=photo_in.caption,
                photo_type=photo_in.photo_type or "scene",
                uploaded_by=creator.id,
            )
            db.add(db_photo)

    log = StatusLog(
        work_order_id=db_order.id,
        from_status=None,
        to_status=db_order.status,
        remark="工单创建",
        operated_by=creator.id,
    )
    db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def update_work_order(db: Session, order_id: int, order_in: WorkOrderUpdate, operator: User) -> Optional[WorkOrder]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    old_status = db_order.status

    update_data = order_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)

    if order_in.status and order_in.status != old_status:
        log = StatusLog(
            work_order_id=db_order.id,
            from_status=old_status,
            to_status=order_in.status,
            operated_by=operator.id,
        )
        db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def assign_work_order(db: Session, order_id: int, assign_in: WorkOrderAssign, operator: User) -> Optional[WorkOrder]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    old_status = db_order.status
    db_order.assigned_to = assign_in.assigned_to
    db_order.status = WorkOrderStatus.ASSIGNED

    log = StatusLog(
        work_order_id=db_order.id,
        from_status=old_status,
        to_status=WorkOrderStatus.ASSIGNED,
        remark=assign_in.remark or "派工",
        operated_by=operator.id,
    )
    db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def start_work_order(db: Session, order_id: int, operator: User, remark: Optional[str] = None) -> Optional[WorkOrder]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    if db_order.status not in [WorkOrderStatus.ASSIGNED, WorkOrderStatus.REVIEW_FAILED]:
        return None

    old_status = db_order.status
    db_order.status = WorkOrderStatus.IN_PROGRESS

    log = StatusLog(
        work_order_id=db_order.id,
        from_status=old_status,
        to_status=WorkOrderStatus.IN_PROGRESS,
        remark=remark or "开始处理",
        operated_by=operator.id,
    )
    db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def complete_work_order(db: Session, order_id: int, complete_in: WorkOrderComplete, operator: User) -> Optional[WorkOrder]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    if db_order.status != WorkOrderStatus.IN_PROGRESS:
        return None

    old_status = db_order.status
    db_order.status = WorkOrderStatus.REVIEWING
    db_order.completed_at = datetime.now()

    if db_order.review_failed_count > 0:
        db_order.is_first_time_resolved = False

    if complete_in.photos:
        for photo_in in complete_in.photos:
            db_photo = WorkOrderPhoto(
                work_order_id=db_order.id,
                url=photo_in.url,
                caption=photo_in.caption,
                photo_type="completion",
                uploaded_by=operator.id,
            )
            db.add(db_photo)

    log = StatusLog(
        work_order_id=db_order.id,
        from_status=old_status,
        to_status=WorkOrderStatus.REVIEWING,
        remark=complete_in.remark or "处理完成，等待复核",
        operated_by=operator.id,
    )
    db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def review_work_order(db: Session, order_id: int, review_in: WorkOrderReview, reviewer: User) -> Optional[WorkOrder]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    if db_order.status != WorkOrderStatus.REVIEWING:
        return None

    old_status = db_order.status

    review_record = ReviewRecord(
        work_order_id=db_order.id,
        reviewer_id=reviewer.id,
        is_passed=review_in.is_passed,
        comment=review_in.comment,
    )
    db.add(review_record)

    if review_in.is_passed:
        db_order.status = WorkOrderStatus.CLOSED
        db_order.closed_at = datetime.now()
        new_status = WorkOrderStatus.CLOSED
    else:
        db_order.status = WorkOrderStatus.REVIEW_FAILED
        db_order.review_failed_count += 1
        db_order.is_first_time_resolved = False
        new_status = WorkOrderStatus.REVIEW_FAILED

    log = StatusLog(
        work_order_id=db_order.id,
        from_status=old_status,
        to_status=new_status,
        remark=review_in.comment or ("复核通过" if review_in.is_passed else "复核不通过"),
        operated_by=reviewer.id,
    )
    db.add(log)

    db.commit()
    db.refresh(db_order)
    return db_order


def add_communication(db: Session, order_id: int, content: str, sender: User) -> Optional[Communication]:
    db_order = get_work_order(db, order_id)
    if not db_order:
        return None

    comm = Communication(
        work_order_id=order_id,
        sender_id=sender.id,
        content=content,
        msg_type="text",
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm


def get_first_time_resolve_trend(db: Session, days: int = 30) -> List[FirstTimeResolveStats]:
    from collections import defaultdict
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)

    closed_orders = db.query(WorkOrder).filter(
        WorkOrder.status == WorkOrderStatus.CLOSED,
        WorkOrder.closed_at.isnot(None),
    ).all()

    daily_stats = defaultdict(lambda: {"total": 0, "first_time_resolved": 0})

    for order in closed_orders:
        if not order.closed_at:
            continue
        order_date = order.closed_at.date() if hasattr(order.closed_at, 'date') else datetime.fromisoformat(str(order.closed_at)).date()
        if start_date <= order_date <= end_date:
            date_key = order_date.isoformat()
            daily_stats[date_key]["total"] += 1
            if order.is_first_time_resolved:
                daily_stats[date_key]["first_time_resolved"] += 1

    stats = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        date_str = d.isoformat()
        day_data = daily_stats.get(date_str, {"total": 0, "first_time_resolved": 0})
        total = day_data["total"]
        first_time = day_data["first_time_resolved"]
        rate = round((first_time / total * 100), 2) if total > 0 else 0.0
        stats.append(FirstTimeResolveStats(
            date=date_str,
            total=total,
            first_time_resolved=first_time,
            rate=rate
        ))

    return stats


def get_dashboard_stats(db: Session) -> dict:
    total = db.query(WorkOrder).count()
    pending = db.query(WorkOrder).filter(WorkOrder.status == WorkOrderStatus.PENDING).count()
    in_progress = db.query(WorkOrder).filter(WorkOrder.status.in_([
        WorkOrderStatus.ASSIGNED,
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.REVIEWING,
    ])).count()
    completed = db.query(WorkOrder).filter(WorkOrder.status == WorkOrderStatus.CLOSED).count()
    review_failed = db.query(WorkOrder).filter(WorkOrder.status == WorkOrderStatus.REVIEW_FAILED).count()

    closed_orders = db.query(WorkOrder).filter(WorkOrder.status == WorkOrderStatus.CLOSED).all()
    total_closed = len(closed_orders)
    first_resolved = sum(1 for o in closed_orders if o.is_first_time_resolved)
    first_resolve_rate = (first_resolved / total_closed * 100) if total_closed > 0 else 0

    trend = get_first_time_resolve_trend(db)

    return {
        "total_orders": total,
        "pending_orders": pending,
        "in_progress_orders": in_progress,
        "completed_orders": completed,
        "review_failed_orders": review_failed,
        "first_time_resolve_rate": round(first_resolve_rate, 2),
        "first_time_resolve_trend": trend,
    }
