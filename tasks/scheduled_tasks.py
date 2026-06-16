from celery import shared_task
from datetime import date, timedelta
from sqlalchemy import func, and_
from database.db import SessionLocal
from database.models import (
    PaymentRecord, MedicalRecord, AttendanceRecord, TreatmentPlan,
    TreatmentRecord, InsuranceClaim, DailyMetrics, AnomalyMarker,
    Equipment, ReviewNote
)
from config.settings import settings
from etl.anomaly_detector import AnomalyDetector
from etl.metrics_calculator import MetricsCalculator
import logging

logger = logging.getLogger(__name__)


@shared_task
def calculate_daily_metrics(target_date=None):
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    db = SessionLocal()
    try:
        calculator = MetricsCalculator(db)
        metrics = calculator.calculate_all_metrics(target_date)

        existing = db.query(DailyMetrics).filter(DailyMetrics.metric_date == target_date).first()
        if existing:
            for key, value in metrics.items():
                setattr(existing, key, value)
        else:
            daily_metrics = DailyMetrics(metric_date=target_date, **metrics)
            db.add(daily_metrics)

        db.commit()
        logger.info(f"Daily metrics calculated for {target_date}")
        return metrics
    except Exception as e:
        db.rollback()
        logger.error(f"Error calculating daily metrics: {str(e)}")
        raise
    finally:
        db.close()


@shared_task
def detect_anomalies(target_date=None):
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    db = SessionLocal()
    try:
        detector = AnomalyDetector(db, settings.ANOMALY_THRESHOLDS)

        payment_anomalies = detector.detect_payment_delays(target_date)
        record_anomalies = detector.detect_medical_record_gaps(target_date)
        punchcard_anomalies = detector.detect_punch_card_caliber_changes(target_date)
        insurance_anomalies = detector.detect_insurance_rejection_trends(target_date)

        all_anomalies = payment_anomalies + record_anomalies + punchcard_anomalies + insurance_anomalies

        for anomaly in all_anomalies:
            existing = db.query(AnomalyMarker).filter(
                and_(
                    AnomalyMarker.anomaly_type == anomaly["anomaly_type"],
                    AnomalyMarker.marker_date == anomaly["marker_date"],
                )
            ).first()

            if not existing:
                marker = AnomalyMarker(**anomaly)
                db.add(marker)

        db.commit()
        logger.info(f"Anomaly detection completed for {target_date}, found {len(all_anomalies)} anomalies")
        return len(all_anomalies)
    except Exception as e:
        db.rollback()
        logger.error(f"Error in anomaly detection: {str(e)}")
        raise
    finally:
        db.close()


@shared_task
def update_equipment_utilization(target_date=None):
    if target_date is None:
        target_date = date.today() - timedelta(days=1)

    db = SessionLocal()
    try:
        treatments = db.query(TreatmentRecord).filter(
            TreatmentRecord.treatment_date == target_date
        ).all()

        equipment_usage = {}
        for t in treatments:
            if t.equipment_used:
                equipment_list = t.equipment_used.split(",")
                for eq in equipment_list:
                    eq = eq.strip()
                    if eq:
                        equipment_usage[eq] = equipment_usage.get(eq, 0) + t.duration

        for equipment in db.query(Equipment).all():
            usage_minutes = equipment_usage.get(equipment.name, 0)
            utilization = min(100.0, (usage_minutes / 480.0) * 100)
            equipment.utilization_rate = utilization

        db.commit()
        logger.info(f"Equipment utilization updated for {target_date}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating equipment utilization: {str(e)}")
        raise
    finally:
        db.close()


@shared_task
def analyze_insurance_trends(target_date=None):
    if target_date is None:
        target_date = date.today()

    db = SessionLocal()
    try:
        start_date = target_date - timedelta(days=30)

        recent_claims = db.query(InsuranceClaim).filter(
            InsuranceClaim.claim_date >= start_date
        ).all()

        if len(recent_claims) < 5:
            logger.info("Not enough data for trend analysis")
            return False

        weekly_rejection_rates = []
        for i in range(4):
            week_start = target_date - timedelta(days=(i + 1) * 7)
            week_end = target_date - timedelta(days=i * 7)
            week_claims = [
                c for c in recent_claims
                if week_start <= c.claim_date < week_end
            ]
            if week_claims:
                total_claimed = sum(c.claim_amount for c in week_claims)
                total_rejected = sum(c.rejected_amount for c in week_claims)
                rate = (total_rejected / total_claimed) * 100 if total_claimed > 0 else 0
                weekly_rejection_rates.append(rate)

        if len(weekly_rejection_rates) >= 2:
            avg_rate = sum(weekly_rejection_rates[:-1]) / (len(weekly_rejection_rates) - 1)
            current_rate = weekly_rejection_rates[-1]

            if current_rate > avg_rate * 1.5 and current_rate > 5:
                marker = AnomalyMarker(
                    anomaly_type="insurance_rejection",
                    marker_date=target_date,
                    severity="high" if current_rate > 15 else "medium",
                    description=f"医保拒付率异常升高: {current_rate:.1f}% (平均: {avg_rate:.1f}%)",
                )
                db.add(marker)
                db.commit()
                logger.info(f"Insurance rejection trend anomaly detected")
                return True

        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error in insurance trend analysis: {str(e)}")
        raise
    finally:
        db.close()


@shared_task
def run_full_refresh():
    target_date = date.today() - timedelta(days=1)
    calculate_daily_metrics.delay(target_date)
    detect_anomalies.delay(target_date)
    update_equipment_utilization.delay(target_date)
    analyze_insurance_trends.delay(target_date)
    logger.info("Full refresh tasks triggered")
    return "Full refresh completed"
