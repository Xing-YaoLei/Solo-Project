import random
from datetime import datetime, timedelta
from sqlalchemy import and_, func

from tasks.celery_app import celery_app
from models import WorkOrder, Part, InsuranceDocument, AnomalyRecord, Appointment


@celery_app.task(name="tasks.detect_anomalies")
def detect_anomalies():
    from models import SessionLocal

    db = SessionLocal()
    try:
        counts = {
            "parts_shortage": _detect_parts_shortage(db),
            "high_rework": _detect_high_rework_rate(db),
            "insurance_issues": _detect_insurance_issues(db),
            "data_errors": _detect_data_errors(db),
            "appointment_delays": _detect_appointment_delays(db),
        }
        return {"status": "success", "counts": counts}
    finally:
        db.close()


def _detect_parts_shortage(db):
    parts = db.query(Part).filter(Part.is_shortage == True).all()
    count = 0

    for part in parts:
        existing = db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == "parts_shortage",
                AnomalyRecord.related_table == "parts",
                AnomalyRecord.related_id == part.id,
                AnomalyRecord.status.in_(["open", "in_progress"]),
            )
        ).first()

        if not existing:
            severity = "critical" if part.stock_quantity == 0 else "high" if part.stock_quantity < part.safe_stock / 2 else "medium"
            anomaly = AnomalyRecord(
                anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
                anomaly_type="parts_shortage",
                severity=severity,
                status="open",
                source="detection",
                related_table="parts",
                related_id=part.id,
                related_no=part.part_code,
                title=f"配件缺货: {part.part_name}",
                description=f"配件 {part.part_name}({part.part_code}) 当前库存 {part.stock_quantity}{part.unit}，低于安全库存 {part.safe_stock}{part.unit}",
                detected_at=datetime.now(),
            )
            db.add(anomaly)
            count += 1

    db.commit()
    return count


def _detect_high_rework_rate(db):
    rework_orders = db.query(WorkOrder).filter(
        and_(
            WorkOrder.is_rework == True,
            WorkOrder.rework_count >= 2,
        )
    ).all()

    count = 0
    for order in rework_orders:
        existing = db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == "review_flag",
                AnomalyRecord.related_table == "work_orders",
                AnomalyRecord.related_id == order.id,
                AnomalyRecord.status.in_(["open", "in_progress"]),
            )
        ).first()

        if not existing:
            anomaly = AnomalyRecord(
                anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
                anomaly_type="review_flag",
                severity="high",
                status="open",
                source="detection",
                related_table="work_orders",
                related_id=order.id,
                related_no=order.order_no,
                title=f"高返修工单: {order.order_no}",
                description=f"工单 {order.order_no} 返修次数达 {order.rework_count} 次，建议进行质量复盘",
                detected_at=datetime.now(),
            )
            db.add(anomaly)
            count += 1

    db.commit()
    return count


def _detect_insurance_issues(db):
    rejected_docs = db.query(InsuranceDocument).filter(
        InsuranceDocument.status == "rejected"
    ).all()

    count = 0
    for doc in rejected_docs:
        existing = db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == "insurance_issue",
                AnomalyRecord.related_table == "insurance_documents",
                AnomalyRecord.related_id == doc.id,
                AnomalyRecord.status.in_(["open", "in_progress"]),
            )
        ).first()

        if not existing:
            anomaly = AnomalyRecord(
                anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
                anomaly_type="insurance_issue",
                severity="high",
                status="open",
                source="detection",
                related_table="insurance_documents",
                related_id=doc.id,
                related_no=doc.document_no,
                title=f"保险理赔被拒: {doc.document_no}",
                description=f"保险单据 {doc.document_no} 被 {doc.insurance_company} 拒赔，原因: {doc.remark or '未注明'}",
                detected_at=datetime.now(),
            )
            db.add(anomaly)
            count += 1

    db.commit()
    return count


def _detect_data_errors(db):
    count = 0

    orders_no_amount = db.query(WorkOrder).filter(
        and_(
            WorkOrder.status == "completed",
            WorkOrder.total_amount <= 0,
        )
    ).all()

    for order in orders_no_amount:
        existing = db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == "data_error",
                AnomalyRecord.related_table == "work_orders",
                AnomalyRecord.related_id == order.id,
                AnomalyRecord.status.in_(["open", "in_progress"]),
            )
        ).first()

        if not existing:
            anomaly = AnomalyRecord(
                anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
                anomaly_type="data_error",
                severity="medium",
                status="open",
                source="detection",
                related_table="work_orders",
                related_id=order.id,
                related_no=order.order_no,
                title=f"工单金额异常: {order.order_no}",
                description=f"已完工工单 {order.order_no} 金额为 0，可能存在数据录入错误",
                detected_at=datetime.now(),
            )
            db.add(anomaly)
            count += 1

    db.commit()
    return count


def _detect_appointment_delays(db):
    today = datetime.now().date()
    delayed_appointments = db.query(Appointment).filter(
        and_(
            Appointment.status == "pending",
            func.date(Appointment.appointment_time) <= today,
        )
    ).all()

    count = 0
    for apt in delayed_appointments:
        existing = db.query(AnomalyRecord).filter(
            and_(
                AnomalyRecord.anomaly_type == "data_error",
                AnomalyRecord.related_table == "appointments",
                AnomalyRecord.related_id == apt.id,
                AnomalyRecord.status.in_(["open", "in_progress"]),
            )
        ).first()

        if not existing:
            anomaly = AnomalyRecord(
                anomaly_no=f"ANOM-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100,999)}",
                anomaly_type="data_error",
                severity="low",
                status="open",
                source="detection",
                related_table="appointments",
                related_id=apt.id,
                related_no=apt.appointment_no,
                title=f"预约逾期未处理: {apt.appointment_no}",
                description=f"预约 {apt.appointment_no} 预约时间已过但状态仍为待处理",
                detected_at=datetime.now(),
            )
            db.add(anomaly)
            count += 1

    db.commit()
    return count
