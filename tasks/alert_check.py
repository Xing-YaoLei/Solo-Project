from datetime import date, timedelta
from decimal import Decimal

from celery import shared_task
from sqlalchemy import func

from db.connection import Session
from db.models import CleanedInventory, MaterialDailyUsage, BatchInfo, AlertThreshold, AlertRecord
from alert.review import generate_review_materials
from config import DEFAULT_TURNOVER_ALERT_DAYS, DEFAULT_EXPIRY_ALERT_DAYS, DEFAULT_STOCKOUT_ALERT_RATIO


def _get_threshold(session, store_code, material_code, threshold_type):
    threshold = (
        session.query(AlertThreshold)
        .filter(
            AlertThreshold.store_code == store_code,
            AlertThreshold.material_code == material_code,
            AlertThreshold.threshold_type == threshold_type,
            AlertThreshold.is_active == True,
        )
        .order_by(AlertThreshold.updated_at.desc())
        .first()
    )
    if threshold:
        return float(threshold.threshold_value)
    defaults = {
        "turnover": DEFAULT_TURNOVER_ALERT_DAYS,
        "expiry": DEFAULT_EXPIRY_ALERT_DAYS,
        "stockout": DEFAULT_STOCKOUT_ALERT_RATIO,
    }
    return defaults.get(threshold_type, 0)


@shared_task(name="tasks.alert_check.check_all_alerts")
def check_all_alerts():
    session = Session()
    try:
        alert_records = []

        inv_rows = session.query(CleanedInventory).all()
        latest_snapshot = {}
        for inv in inv_rows:
            key = (inv.store_code, inv.material_code)
            if key not in latest_snapshot or inv.snapshot_date > latest_snapshot[key].snapshot_date:
                latest_snapshot[key] = inv

        turnover_map = {}
        usage_rows = session.query(MaterialDailyUsage).all()
        for u in usage_rows:
            key = (u.store_code, u.material_code)
            if u.turnover_days is not None:
                turnover_map[key] = float(u.turnover_days)

        for key, inv in latest_snapshot.items():
            store_code, material_code = key
            turnover_days = turnover_map.get(key, None)

            if turnover_days is not None:
                threshold_val = _get_threshold(session, store_code, material_code, "turnover")
                if turnover_days <= threshold_val:
                    record = AlertRecord(
                        material_code=material_code,
                        material_name=inv.material_name,
                        store_code=store_code,
                        alert_type="turnover",
                        alert_level="warning",
                        current_value=Decimal(str(round(turnover_days, 2))),
                        threshold_value=Decimal(str(round(threshold_val, 2))),
                        message=f"周转天数 {turnover_days:.1f} 低于阈值 {threshold_val:.1f}",
                    )
                    session.add(record)
                    alert_records.append(record)

            batch_rows = (
                session.query(BatchInfo)
                .filter(
                    BatchInfo.store_code == store_code,
                    BatchInfo.material_code == material_code,
                    BatchInfo.status == "active",
                )
                .all()
            )
            for batch in batch_rows:
                if batch.expiry_date:
                    days_to_expiry = (batch.expiry_date - date.today()).days
                    expiry_threshold = _get_threshold(session, store_code, material_code, "expiry")
                    if days_to_expiry <= expiry_threshold:
                        record = AlertRecord(
                            material_code=material_code,
                            material_name=inv.material_name,
                            store_code=store_code,
                            alert_type="expiry",
                            alert_level="critical" if days_to_expiry <= 7 else "warning",
                            current_value=Decimal(str(days_to_expiry)),
                            threshold_value=Decimal(str(round(expiry_threshold, 2))),
                            message=f"批次 {batch.batch_no} 距过期仅剩 {days_to_expiry} 天",
                        )
                        session.add(record)
                        alert_records.append(record)

            stock_qty = float(inv.stock_qty) if inv.stock_qty else 0.0
            safety_stock = float(inv.safety_stock) if inv.safety_stock else 0.0
            if safety_stock > 0 and stock_qty <= safety_stock:
                stockout_threshold = _get_threshold(session, store_code, material_code, "stockout")
                if safety_stock > 0 and (stock_qty / safety_stock) <= stockout_threshold:
                    record = AlertRecord(
                        material_code=material_code,
                        material_name=inv.material_name,
                        store_code=store_code,
                        alert_type="stockout",
                        alert_level="critical",
                        current_value=Decimal(str(round(stock_qty, 3))),
                        threshold_value=Decimal(str(round(safety_stock, 3))),
                        message=f"库存 {stock_qty:.3f} 低于安全库存 {safety_stock:.3f}",
                    )
                    session.add(record)
                    alert_records.append(record)

        session.flush()

        if alert_records:
            generate_review_materials(session, alert_records)

        session.commit()
        return {"alert_count": len(alert_records)}
    except Exception:
        session.rollback()
        raise
    finally:
        Session.remove()
