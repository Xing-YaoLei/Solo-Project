from sqlalchemy.orm import Session
from typing import Optional
from ..models import PartStock, StockChangeLog, Part, PartShortage, PartShortageStatus
from ..schemas import StockAdjustRequest
from ..core.celery_app import celery_app
from datetime import datetime


def adjust_stock(
    db: Session,
    part_id: int,
    request: StockAdjustRequest,
    operator_id: Optional[int] = None
):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        return None, "Part not found"

    stock = db.query(PartStock).filter(PartStock.part_id == part_id).first()
    if not stock:
        stock = PartStock(part_id=part_id, quantity=0)
        db.add(stock)
        db.flush()

    before_quantity = stock.quantity
    after_quantity = request.quantity

    log = StockChangeLog(
        part_id=part_id,
        work_order_id=request.work_order_id,
        before_quantity=before_quantity,
        after_quantity=after_quantity,
        change_reason=request.change_reason,
        operator_id=operator_id,
    )
    db.add(log)
    stock.quantity = after_quantity
    db.commit()
    db.refresh(stock)
    db.refresh(log)

    if after_quantity <= part.safety_stock:
        try:
            celery_app.send_task(
                "app.celery_tasks.tasks.check_low_stock_alert",
                args=[part_id, after_quantity, part.safety_stock],
            )
        except Exception:
            pass

        existing_shortage = (
            db.query(PartShortage)
            .filter(
                PartShortage.part_id == part_id,
                PartShortage.status != PartShortageStatus.CLOSED,
            )
            .first()
        )
        if not existing_shortage:
            shortage = PartShortage(
                part_id=part_id,
                required_quantity=part.safety_stock - after_quantity + 1,
                reason=f"Stock fell below safety level (current: {after_quantity}, safety: {part.safety_stock})",
            )
            db.add(shortage)
            db.commit()

    return stock, log, None


def get_stock_logs(db: Session, part_id: Optional[int] = None, limit: int = 100):
    query = db.query(StockChangeLog)
    if part_id:
        query = query.filter(StockChangeLog.part_id == part_id)
    return query.order_by(StockChangeLog.created_at.desc()).limit(limit).all()
