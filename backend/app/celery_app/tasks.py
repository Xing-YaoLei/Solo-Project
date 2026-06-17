from datetime import datetime, timedelta
from celery import shared_task
from sqlalchemy.orm import Session

from ..core.database import SessionLocal
from ..models import WorkOrder, WorkOrderStatus, User
from ..services import work_order_service


@shared_task(name="check_overdue_orders")
def check_overdue_orders():
    db = SessionLocal()
    try:
        now = datetime.now()
        overdue_orders = db.query(WorkOrder).filter(
            WorkOrder.deadline < now,
            WorkOrder.status.in_([
                WorkOrderStatus.PENDING,
                WorkOrderStatus.ASSIGNED,
                WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.REVIEW_FAILED,
            ])
        ).all()

        result = []
        for order in overdue_orders:
            worker_name = order.assigned_worker.full_name if order.assigned_worker else "未指派"
            result.append({
                "order_id": order.id,
                "order_no": order.order_no,
                "title": order.title,
                "deadline": order.deadline.isoformat(),
                "assigned_worker": worker_name,
            })

        return {
            "overdue_count": len(overdue_orders),
            "orders": result,
        }
    finally:
        db.close()


@shared_task(name="send_notification")
def send_notification(user_id: int, title: str, content: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            print(f"[通知] 发送给 {user.full_name} ({user.username}): {title} - {content}")
        return {"success": True, "user_id": user_id}
    finally:
        db.close()


@shared_task(name="daily_summary")
def daily_summary():
    db = SessionLocal()
    try:
        stats = work_order_service.get_dashboard_stats(db)
        print(f"[每日汇总] 总工单: {stats['total_orders']}, 待处理: {stats['pending_orders']}")
        print(f"[每日汇总] 处理中: {stats['in_progress_orders']}, 已完成: {stats['completed_orders']}")
        print(f"[每日汇总] 首次解决率: {stats['first_time_resolve_rate']}%")
        return stats
    finally:
        db.close()


@shared_task(name="process_new_work_order")
def process_new_work_order(order_id: int):
    db = SessionLocal()
    try:
        order = work_order_service.get_work_order(db, order_id)
        if order and order.assigned_to:
            send_notification.delay(
                order.assigned_to,
                "新工单指派",
                f"您有新的工单待处理: {order.title}",
            )
        return {"success": True, "order_id": order_id}
    finally:
        db.close()


@shared_task(name="remind_review")
def remind_review():
    db = SessionLocal()
    try:
        review_orders = db.query(WorkOrder).filter(
            WorkOrder.status == WorkOrderStatus.REVIEWING,
        ).all()

        count = len(review_orders)
        if count > 0:
            print(f"[提醒] 有 {count} 个工单等待复核")
        return {"review_pending_count": count}
    finally:
        db.close()
