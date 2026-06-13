from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.celery import celery_app
from app.core.database import SessionLocal
from app.models import (
    TemperatureRecord, TemperatureAlert, TemperatureAlertStatus,
    AlertHistory, ReplenishmentOrder, ReplenishmentStatus,
)


@celery_app.task(name="tasks.check_temperature_breaches")
def check_temperature_breaches():
    db = SessionLocal()
    try:
        five_min_ago = datetime.utcnow() - timedelta(minutes=5)
        records = (
            db.query(TemperatureRecord)
            .filter(TemperatureRecord.is_out_of_range == True)
            .filter(TemperatureRecord.recorded_at >= five_min_ago)
            .all()
        )
        for rec in records:
            existing = (
                db.query(TemperatureAlert)
                .filter(TemperatureAlert.trigger_record_id == rec.id)
                .first()
            )
            if existing:
                continue
            alert = TemperatureAlert(
                order_id=rec.order_id,
                trigger_record_id=rec.id,
                status=TemperatureAlertStatus.OPEN,
                alert_type="temperature_breach",
                severity="warning",
                min_temp=rec.min_temp,
                max_temp=rec.max_temp,
                actual_temp=rec.temperature,
                source_type="auto",
                source_ref=f"celery_task_{datetime.utcnow().isoformat()}",
                description=f"自动检测温度越界: {rec.temperature}°C, 范围 {rec.min_temp}~{rec.max_temp}°C",
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            ah = AlertHistory(
                alert_id=alert.id,
                to_status=TemperatureAlertStatus.OPEN,
                action="auto_created",
                note="Celery 任务自动创建",
            )
            db.add(ah)
            db.commit()
        return {"processed": len(records)}
    finally:
        db.close()


@celery_app.task(name="tasks.summarize_daily_temperature")
def summarize_daily_temperature(date_str: str = None):
    db = SessionLocal()
    try:
        if date_str is None:
            date_str = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        orders = (
            db.query(ReplenishmentOrder)
            .filter(ReplenishmentOrder.planned_date == target_date)
            .all()
        )
        total = len(orders)
        with_alert = 0
        for o in orders:
            alerts = db.query(TemperatureAlert).filter(
                TemperatureAlert.order_id == o.id,
                TemperatureAlert.alert_type == "temperature_breach",
            ).count()
            if alerts > 0:
                with_alert += 1
        qualified = total - with_alert
        rate = qualified / total if total > 0 else 0.0
        return {
            "date": date_str,
            "total_orders": total,
            "qualified_orders": qualified,
            "alert_orders": with_alert,
            "qualified_rate": rate,
        }
    finally:
        db.close()
