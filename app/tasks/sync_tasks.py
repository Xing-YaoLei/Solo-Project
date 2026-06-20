from datetime import datetime, timedelta
import random
import string

from celery import shared_task
from sqlalchemy import and_

from app.database import SessionLocal
from app.models import Payment, GateRecord, Registration, SyncLog, Activity
from app.utils.anomaly_detector import AnomalyDetector


def generate_random_id(prefix, length=8):
    chars = string.ascii_uppercase + string.digits
    return prefix + ''.join(random.choice(chars) for _ in range(length))


@shared_task(bind=True, name="sync_payments")
def sync_payments(self, source="manual", since_hours=24):
    db = SessionLocal()
    sync_log = SyncLog(
        sync_type="payment",
        source=source,
        status="running",
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)

    try:
        success_count = 0
        failed_count = 0
        anomaly_count = 0

        since_time = datetime.now() - timedelta(hours=since_hours)

        pending_registrations = db.query(Registration).filter(
            Registration.status == "paid"
        ).all()

        for reg in pending_registrations:
            try:
                existing_payment = db.query(Payment).filter(
                    Payment.registration_id == reg.id,
                    Payment.payment_status == "success"
                ).first()

                if not existing_payment:
                    payment = Payment(
                        registration_id=reg.id,
                        payment_no=generate_random_id("PAY"),
                        amount=reg.total_amount,
                        payment_method=random.choice(["wechat", "alipay", "bank"]),
                        payment_status="success",
                        payment_time=reg.register_time + timedelta(minutes=random.randint(1, 60)),
                        channel_order_no=generate_random_id("CHN", 12),
                        sync_source=source,
                        sync_time=datetime.now(),
                    )
                    db.add(payment)
                    success_count += 1
                else:
                    success_count += 1
            except Exception as e:
                failed_count += 1
                db.rollback()

        db.commit()

        detector = AnomalyDetector(db)
        anomalies = detector.detect_payment_anomalies(since_time)
        anomaly_count = len(anomalies)

        sync_log.status = "completed"
        sync_log.total_count = success_count + failed_count
        sync_log.success_count = success_count
        sync_log.failed_count = failed_count
        sync_log.anomaly_count = anomaly_count
        sync_log.end_time = datetime.now()
        db.commit()

        return {
            "status": "success",
            "total": success_count + failed_count,
            "success": success_count,
            "failed": failed_count,
            "anomalies": anomaly_count,
        }

    except Exception as e:
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        sync_log.end_time = datetime.now()
        db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="sync_gate_records")
def sync_gate_records(self, source="manual", since_hours=24):
    db = SessionLocal()
    sync_log = SyncLog(
        sync_type="gate",
        source=source,
        status="running",
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)

    try:
        success_count = 0
        failed_count = 0
        anomaly_count = 0

        since_time = datetime.now() - timedelta(hours=since_hours)

        paid_registrations = db.query(Registration).filter(
            Registration.status == "paid"
        ).all()

        for reg in paid_registrations:
            try:
                existing_gate = db.query(GateRecord).filter(
                    GateRecord.registration_id == reg.id
                ).first()

                if not existing_gate and random.random() < 0.7:
                    check_in_time = reg.activity.start_date if hasattr(reg.activity, 'start_date') and reg.activity.start_date else datetime.now()
                    if isinstance(check_in_time, datetime):
                        pass
                    else:
                        check_in_time = datetime.combine(check_in_time, datetime.min.time())
                    check_in_time += timedelta(hours=random.randint(18, 20), minutes=random.randint(0, 59))

                    gate_record = GateRecord(
                        registration_id=reg.id,
                        ticket_code=generate_random_id("TCK", 10),
                        gate_no=random.choice(["G01", "G02", "G03", "G04"]),
                        check_in_time=check_in_time,
                        check_in_type="entry",
                        operator=random.choice(["staff1", "staff2", "staff3"]),
                        is_valid=True,
                        sync_source=source,
                        sync_time=datetime.now(),
                    )
                    db.add(gate_record)
                    success_count += 1
                elif existing_gate:
                    success_count += 1
            except Exception as e:
                failed_count += 1
                db.rollback()

        db.commit()

        detector = AnomalyDetector(db)
        anomalies = detector.detect_gate_anomalies(since_time)
        anomaly_count = len(anomalies)

        sync_log.status = "completed"
        sync_log.total_count = success_count + failed_count
        sync_log.success_count = success_count
        sync_log.failed_count = failed_count
        sync_log.anomaly_count = anomaly_count
        sync_log.end_time = datetime.now()
        db.commit()

        return {
            "status": "success",
            "total": success_count + failed_count,
            "success": success_count,
            "failed": failed_count,
            "anomalies": anomaly_count,
        }

    except Exception as e:
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        sync_log.end_time = datetime.now()
        db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="sync_registrations")
def sync_registrations(self, source="manual", since_hours=24):
    db = SessionLocal()
    sync_log = SyncLog(
        sync_type="registration",
        source=source,
        status="running",
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)

    try:
        success_count = 0
        failed_count = 0
        anomaly_count = 0

        since_time = datetime.now() - timedelta(hours=since_hours)

        detector = AnomalyDetector(db)
        anomalies = detector.detect_registration_anomalies(since_time)
        anomaly_count = len(anomalies)

        all_registrations = db.query(Registration).all()
        success_count = len(all_registrations)

        sync_log.status = "completed"
        sync_log.total_count = success_count + failed_count
        sync_log.success_count = success_count
        sync_log.failed_count = failed_count
        sync_log.anomaly_count = anomaly_count
        sync_log.end_time = datetime.now()
        db.commit()

        return {
            "status": "success",
            "total": success_count + failed_count,
            "success": success_count,
            "failed": failed_count,
            "anomalies": anomaly_count,
        }

    except Exception as e:
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        sync_log.end_time = datetime.now()
        db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@shared_task(name="sync_all_data")
def sync_all_data(source="scheduled"):
    result1 = sync_registrations.delay(source=source)
    result2 = sync_payments.delay(source=source)
    result3 = sync_gate_records.delay(source=source)
    return {
        "registrations_task_id": result1.id,
        "payments_task_id": result2.id,
        "gate_records_task_id": result3.id,
    }
