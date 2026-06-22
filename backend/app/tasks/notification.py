from ..celery_app import celery


@celery.task
def send_order_assigned_notification(order_id: int, assignee_id: int):
    print(f"[通知] 工单 {order_id} 已分配给用户 {assignee_id}")
    return {"status": "sent", "order_id": order_id, "user_id": assignee_id}


@celery.task
def send_order_for_review(order_id: int, auditor_id: int):
    print(f"[通知] 工单 {order_id} 已提交复核，通知审核员 {auditor_id}")
    return {"status": "sent", "order_id": order_id, "auditor_id": auditor_id}


@celery.task
def send_order_closed_notification(order_id: int, creator_id: int):
    print(f"[通知] 工单 {order_id} 已闭环，通知创建人 {creator_id}")
    return {"status": "sent", "order_id": order_id, "creator_id": creator_id}


@celery.task
def send_order_review_failed(order_id: int, assignee_id: int):
    print(f"[通知] 工单 {order_id} 复核不通过，通知处理人 {assignee_id}")
    return {"status": "sent", "order_id": order_id, "assignee_id": assignee_id}


@celery.task
def check_overdue_orders():
    from sqlalchemy.orm import Session
    from datetime import datetime
    from ..database import SessionLocal
    from ..models.models import Order, OrderStatus

    db: Session = SessionLocal()
    try:
        now = datetime.now()
        overdue_orders = (
            db.query(Order)
            .filter(
                Order.deadline < now,
                Order.status.notin_([OrderStatus.CLOSED, OrderStatus.COMPLETED, OrderStatus.REVIEWING]),
            )
            .all()
        )

        for order in overdue_orders:
            if order.assignee_id:
                print(f"[超时提醒] 工单 {order.order_no} 已超时，提醒处理人 {order.assignee_id}")

        return {"overdue_count": len(overdue_orders)}
    finally:
        db.close()
