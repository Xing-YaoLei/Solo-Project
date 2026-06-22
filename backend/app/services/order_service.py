from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from sqlalchemy.types import Integer
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from ..models.models import Order, OrderStatus, ProcessRecord, User, DispatchRule, AffectedObject, ReviewSupplement
from ..schemas import schemas
from . import notification_service


def generate_order_no() -> str:
    now = datetime.now()
    prefix = now.strftime("CA%Y%m%d")
    return f"{prefix}{datetime.now().microsecond:06d}"


def get_orders(
    db: Session,
    status: Optional[OrderStatus] = None,
    assignee_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    priority: Optional[int] = None,
    audit_type: Optional[str] = None,
    keyword: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[int, List[Order]]:
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)
    if assignee_id:
        query = query.filter(Order.assignee_id == assignee_id)
    if creator_id:
        query = query.filter(Order.creator_id == creator_id)
    if priority:
        query = query.filter(Order.priority == priority)
    if audit_type:
        query = query.filter(Order.audit_type == audit_type)
    if keyword:
        query = query.filter(
            or_(
                Order.title.contains(keyword),
                Order.description.contains(keyword),
                Order.order_no.contains(keyword),
            )
        )
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return total, orders


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_order_by_no(db: Session, order_no: str) -> Optional[Order]:
    return db.query(Order).filter(Order.order_no == order_no).first()


def create_order(db: Session, order_in: schemas.OrderCreate, creator_id: int) -> Order:
    order_data = order_in.model_dump()

    if not order_data.get("assignee_id") and order_data.get("dispatch_rule_id"):
        dispatch_rule = db.query(DispatchRule).filter(DispatchRule.id == order_data["dispatch_rule_id"]).first()
        if dispatch_rule and dispatch_rule.default_assignee_id:
            order_data["assignee_id"] = dispatch_rule.default_assignee_id

    if not order_data.get("deadline") and order_data.get("dispatch_rule_id"):
        dispatch_rule = db.query(DispatchRule).filter(DispatchRule.id == order_data["dispatch_rule_id"]).first()
        if dispatch_rule:
            order_data["deadline"] = datetime.now() + timedelta(hours=dispatch_rule.handling_time_limit)

    order = Order(
        **order_data,
        order_no=generate_order_no(),
        creator_id=creator_id,
        status=OrderStatus.PENDING,
    )

    if order.assignee_id:
        order.status = OrderStatus.ASSIGNED

    db.add(order)
    db.commit()
    db.refresh(order)

    if order.assignee_id:
        assignee = db.query(User).filter(User.id == order.assignee_id).first()
        if assignee:
            notification_service.send_order_assigned_notification.delay(order.id, assignee.id)

    return order


def update_order(db: Session, order_id: int, order_in: schemas.OrderUpdate) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None

    for key, value in order_in.model_dump(exclude_unset=True).items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order


def update_order_status(
    db: Session,
    order_id: int,
    new_status: OrderStatus,
    handler_id: int,
    action: str,
    remark: Optional[str] = None,
) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None

    old_status = order.status
    order.status = new_status
    order.processing_count += 1

    if new_status == OrderStatus.COMPLETED and order.processing_count == 1:
        order.first_resolved = True

    process_record = ProcessRecord(
        order_id=order_id,
        handler_id=handler_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        remark=remark,
    )
    db.add(process_record)

    db.commit()
    db.refresh(order)

    if new_status == OrderStatus.ASSIGNED and order.assignee_id:
        notification_service.send_order_assigned_notification.delay(order.id, order.assignee_id)
    elif new_status == OrderStatus.REVIEWING:
        auditors = db.query(User).filter(User.role == "auditor").all()
        for auditor in auditors:
            notification_service.send_order_for_review.delay(order.id, auditor.id)
    elif new_status == OrderStatus.CLOSED:
        notification_service.send_order_closed_notification.delay(order.id, order.creator_id)

    return order


def handle_review_failed(
    db: Session,
    order_id: int,
    handler_id: int,
    affected_objects_data: List[schemas.AffectedObjectCreate],
    supplement: Optional[str] = None,
    new_assignee_id: Optional[int] = None,
) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None

    old_status = order.status
    order.status = OrderStatus.REVIEW_FAILED
    order.processing_count += 1

    process_record = ProcessRecord(
        order_id=order_id,
        handler_id=handler_id,
        action="复核不通过",
        old_status=old_status,
        new_status=OrderStatus.REVIEW_FAILED,
        remark=supplement,
    )
    db.add(process_record)

    for obj_data in affected_objects_data:
        affected_obj = AffectedObject(
            order_id=order_id,
            **obj_data.model_dump(),
        )
        db.add(affected_obj)

    supplement_data = {
        "supplement_type": "review_failed",
        "content": supplement,
    }
    if new_assignee_id:
        supplement_data["old_assignee_id"] = order.assignee_id
        supplement_data["new_assignee_id"] = new_assignee_id
        order.assignee_id = new_assignee_id

    review_supplement = ReviewSupplement(
        order_id=order_id,
        operator_id=handler_id,
        **supplement_data,
    )
    db.add(review_supplement)

    db.commit()
    db.refresh(order)

    if order.assignee_id:
        notification_service.send_order_review_failed.delay(order.id, order.assignee_id)

    return order


def add_review_supplement(
    db: Session,
    order_id: int,
    operator_id: int,
    supplement_in: schemas.ReviewSupplementCreate,
) -> Optional[ReviewSupplement]:
    order = get_order(db, order_id)
    if not order:
        return None

    supplement_data = supplement_in.model_dump(exclude={"affected_objects"})

    if supplement_in.new_assignee_id:
        supplement_data["old_assignee_id"] = order.assignee_id
        order.assignee_id = supplement_in.new_assignee_id

    review_supplement = ReviewSupplement(
        order_id=order_id,
        operator_id=operator_id,
        **supplement_data,
    )
    db.add(review_supplement)

    if supplement_in.affected_objects:
        for obj_data in supplement_in.affected_objects:
            affected_obj = AffectedObject(
                order_id=order_id,
                **obj_data.model_dump(),
            )
            db.add(affected_obj)

    db.commit()
    db.refresh(review_supplement)
    return review_supplement


def get_first_time_resolution_stats(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> schemas.FirstTimeResolutionStats:
    query = db.query(Order).filter(Order.status == OrderStatus.CLOSED)

    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)

    total_orders = query.count()
    first_time_resolved = query.filter(Order.first_resolved == True).count()

    rate = (first_time_resolved / total_orders * 100) if total_orders > 0 else 0

    by_auditor = (
        db.query(
            User.username,
            User.full_name,
            func.count(Order.id).label("total"),
            func.sum(func.cast(Order.first_resolved, Integer)).label("first_time"),
        )
        .join(Order, Order.creator_id == User.id)
        .filter(Order.status == OrderStatus.CLOSED)
        .group_by(User.id)
        .all()
    )

    by_department = (
        db.query(
            User.department,
            func.count(Order.id).label("total"),
            func.sum(func.cast(Order.first_resolved, Integer)).label("first_time"),
        )
        .join(Order, Order.assignee_id == User.id)
        .filter(Order.status == OrderStatus.CLOSED)
        .filter(User.department.isnot(None))
        .group_by(User.department)
        .all()
    )

    by_month = (
        db.query(
            func.to_char(Order.created_at, "YYYY-MM").label("month"),
            func.count(Order.id).label("total"),
            func.sum(func.cast(Order.first_resolved, Integer)).label("first_time"),
        )
        .filter(Order.status == OrderStatus.CLOSED)
        .group_by("month")
        .order_by("month")
        .limit(12)
        .all()
    )

    return schemas.FirstTimeResolutionStats(
        total_orders=total_orders,
        first_time_resolved=first_time_resolved,
        first_time_resolution_rate=round(rate, 2),
        by_auditor=[
            {
                "username": row.username,
                "full_name": row.full_name,
                "total": row.total,
                "first_time": row.first_time or 0,
                "rate": round((row.first_time or 0) / row.total * 100, 2) if row.total > 0 else 0,
            }
            for row in by_auditor
        ],
        by_department=[
            {
                "department": row.department,
                "total": row.total,
                "first_time": row.first_time or 0,
                "rate": round((row.first_time or 0) / row.total * 100, 2) if row.total > 0 else 0,
            }
            for row in by_department
        ],
        by_month=[
            {
                "month": row.month,
                "total": row.total,
                "first_time": row.first_time or 0,
                "rate": round((row.first_time or 0) / row.total * 100, 2) if row.total > 0 else 0,
            }
            for row in by_month
        ],
    )
