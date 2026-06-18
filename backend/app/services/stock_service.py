from sqlalchemy.orm import Session
from typing import Optional, Tuple, Any
from ..models import PartStock, StockChangeLog, Part, PartShortage, PartShortageStatus, User, UserRole
from ..schemas import StockAdjustRequest
from ..core.celery_app import celery_app
from datetime import datetime


def adjust_stock(
    db: Session,
    part_id: int,
    request: StockAdjustRequest,
    operator_id: Optional[int] = None,
) -> Tuple[Optional[PartStock], Optional[StockChangeLog], Optional[str]]:
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        return None, None, "Part not found"

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

    shortage_created = None

    if after_quantity <= part.safety_stock:
        existing_shortage = (
            db.query(PartShortage)
            .filter(
                PartShortage.part_id == part_id,
                PartShortage.status != PartShortageStatus.CLOSED,
            )
            .first()
        )
        if not existing_shortage:
            parts_user = (
                db.query(User)
                .filter(User.role == UserRole.PARTS)
                .order_by(User.created_at.asc())
                .first()
            )
            shortage = PartShortage(
                part_id=part_id,
                work_order_id=request.work_order_id,
                required_quantity=max(part.safety_stock - after_quantity + 1, 1),
                status=PartShortageStatus.OPEN,
                reason=(
                    f"库存低于安全线（当前: {after_quantity}, 安全库存: {part.safety_stock}）"
                    f"{f'，关联工单: #{request.work_order_id}' if request.work_order_id else ''}"
                ),
                handler_id=parts_user.id if parts_user else None,
            )
            db.add(shortage)
            db.flush()
            shortage_created = shortage

            try:
                celery_app.send_task(
                    "app.celery_tasks.tasks.check_low_stock_alert",
                    args=[part_id, after_quantity, part.safety_stock, parts_user.id if parts_user else None, shortage.id],
                )
            except Exception:
                pass

    db.commit()
    db.refresh(stock)
    db.refresh(log)
    if shortage_created:
        db.refresh(shortage_created)

    return stock, log, None


def get_stock_logs(db: Session, part_id: Optional[int] = None, limit: int = 100):
    query = db.query(StockChangeLog)
    if part_id:
        query = query.filter(StockChangeLog.part_id == part_id)
    return query.order_by(StockChangeLog.created_at.desc()).limit(limit).all()


def get_open_shortage_count(db: Session, user_id: Optional[int] = None) -> int:
    query = db.query(PartShortage).filter(PartShortage.status != PartShortageStatus.CLOSED)
    if user_id:
        query = query.filter(PartShortage.handler_id == user_id)
    return query.count()
