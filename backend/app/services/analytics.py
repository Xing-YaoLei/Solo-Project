from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import MaterialBatch, ShortageOrder


def get_dashboard_stats(db: Session):
    total_batches = db.query(MaterialBatch).count()

    in_stock_quantity = (
        db.query(func.coalesce(func.sum(MaterialBatch.quantity), 0.0))
        .filter(MaterialBatch.status == "in_stock")
        .scalar()
        or 0.0
    )

    pending_shortages = (
        db.query(ShortageOrder)
        .filter(ShortageOrder.status.in_(["pending", "processing"]))
        .count()
    )

    avg_turnover = (
        db.query(func.avg(MaterialBatch.actual_turnover_days))
        .filter(MaterialBatch.actual_turnover_days.isnot(None))
        .scalar()
        or 0.0
    )

    return {
        "total_batches": total_batches,
        "in_stock_quantity": float(in_stock_quantity),
        "pending_shortages": pending_shortages,
        "avg_turnover_days": float(round(avg_turnover, 2)),
    }
