import logging
from ..core.celery_app import celery_app
from datetime import datetime

logger = logging.getLogger(__name__)


@celery_app.task(name="app.celery_tasks.tasks.check_low_stock_alert")
def check_low_stock_alert(
    part_id: int,
    current_quantity: int,
    safety_stock: int,
    handler_id: int = None,
    shortage_id: int = None,
):
    logger.warning(
        f"[LOW STOCK ALERT] Part ID: {part_id}, current: {current_quantity}, "
        f"safety level: {safety_stock}, handler_id: {handler_id}, shortage_id: {shortage_id}"
    )
    if handler_id:
        logger.info(
            f"[NOTIFICATION] Sending in-app / push notification to handler user #{handler_id} "
            f"for shortage record #{shortage_id or 'N/A'}"
        )
    return {
        "part_id": part_id,
        "current_quantity": current_quantity,
        "safety_stock": safety_stock,
        "handler_id": handler_id,
        "shortage_id": shortage_id,
        "alert_time": datetime.utcnow().isoformat(),
    }


@celery_app.task(name="app.celery_tasks.tasks.notify_shortage_handler")
def notify_shortage_handler(shortage_id: int, handler_id: int, part_name: str):
    logger.info(
        f"[SHORTAGE NOTIFICATION] Shortage ID: {shortage_id}, Handler ID: {handler_id}, "
        f"Part: {part_name}. Sending push/in-app notification."
    )
    return {
        "shortage_id": shortage_id,
        "handler_id": handler_id,
        "part_name": part_name,
        "notified_at": datetime.utcnow().isoformat(),
    }


@celery_app.task(name="app.celery_tasks.tasks.auto_close_expired_shortage")
def auto_close_expired_shortage():
    from ..core.database import SessionLocal
    from ..models import PartShortage, PartShortageStatus
    from datetime import timedelta

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=30)
        expired = (
            db.query(PartShortage)
            .filter(
                PartShortage.status != PartShortageStatus.CLOSED,
                PartShortage.reported_at < cutoff,
            )
            .all()
        )
        for s in expired:
            s.status = PartShortageStatus.CLOSED
            s.closed_at = datetime.utcnow()
            if not s.action_taken:
                s.action_taken = "Auto-closed after 30 days"
        db.commit()
        logger.info(f"Auto-closed {len(expired)} expired shortage records")
        return {"closed_count": len(expired)}
    finally:
        db.close()
