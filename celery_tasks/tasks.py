import logging
from datetime import datetime, timedelta
from celery import chain
from sqlalchemy import and_, func, or_
from database.connection import get_session
from database.models import (
    Appointment, Patient, TreatmentPlan, FollowUpTask,
    ImagingRecord, BillingRecord, SyncLog, Doctor
)
from config.settings import Config
from celery_tasks.app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="celery_tasks.tasks.sync_his_data", bind=True, max_retries=3)
def sync_his_data(self, full_sync=False):
    session = get_session()
    sync_log = SyncLog(
        sync_type="HIS_SYNC",
        source_system="HIS",
        status="running"
    )
    session.add(sync_log)
    session.commit()
    session.refresh(sync_log)

    try:
        start_time = datetime.utcnow()
        cutoff_date = None if full_sync else (datetime.utcnow() - timedelta(days=7)).date()

        query = session.query(Appointment).filter(Appointment.is_cleaning == True)
        if cutoff_date:
            query = query.filter(Appointment.appointment_date >= cutoff_date)
        appointments = query.all()

        updated_count = 0
        for appt in appointments:
            if appt.his_updated_at and appt.synced_at:
                delay = (appt.synced_at - appt.his_updated_at).total_seconds() / 60
                appt.sync_delay_minutes = max(appt.sync_delay_minutes or 0, delay)
                if delay > Config.HIS_DELAY_THRESHOLD_MINUTES:
                    appt.anomaly_flag = "HIS_DELAY"
            appt.synced_at = start_time
            updated_count += 1

        session.commit()

        sync_log.completed_at = datetime.utcnow()
        sync_log.records_count = updated_count
        sync_log.status = "success"
        sync_log.delay_minutes = (datetime.utcnow() - start_time).total_seconds() / 60
        session.commit()

        logger.info(f"HIS sync completed: {updated_count} records, took {sync_log.delay_minutes:.2f} min")
        return {"status": "success", "records_synced": updated_count}

    except Exception as e:
        session.rollback()
        sync_log.completed_at = datetime.utcnow()
        sync_log.status = "failed"
        sync_log.error_message = str(e)
        session.commit()
        logger.error(f"HIS sync failed: {str(e)}")
        self.retry(exc=e, countdown=60)
    finally:
        session.close()


@celery_app.task(name="celery_tasks.tasks.check_his_delay")
def check_his_delay():
    session = get_session()
    try:
        threshold = Config.HIS_DELAY_THRESHOLD_MINUTES
        now = datetime.utcnow()

        delayed_appointments = session.query(Appointment).filter(
            and_(
                Appointment.is_cleaning == True,
                Appointment.his_created_at.isnot(None),
                Appointment.synced_at.isnot(None),
                (func.extract('epoch', Appointment.synced_at - Appointment.his_created_at) / 60) > threshold
            )
        ).all()

        flagged_count = 0
        for appt in delayed_appointments:
            delay = (appt.synced_at - appt.his_created_at).total_seconds() / 60
            appt.sync_delay_minutes = delay
            appt.anomaly_flag = "HIS_DELAY" if not appt.anomaly_flag else appt.anomaly_flag + "|HIS_DELAY"
            appt.updated_at = now
            flagged_count += 1

        session.commit()
        logger.info(f"HIS delay check: {flagged_count} appointments flagged")
        return {"status": "success", "delayed_count": flagged_count}

    except Exception as e:
        session.rollback()
        logger.error(f"HIS delay check failed: {str(e)}")
        raise
    finally:
        session.close()


@celery_app.task(name="celery_tasks.tasks.check_imaging_missing")
def check_imaging_missing():
    session = get_session()
    try:
        now = datetime.utcnow()
        seven_days_ago = (now - timedelta(days=7)).date()

        completed_cleanings = session.query(Appointment).filter(
            and_(
                Appointment.is_cleaning == True,
                Appointment.status.in_(["completed", "done"]),
                Appointment.appointment_date >= seven_days_ago
            )
        ).all()

        missing_count = 0
        for appt in completed_cleanings:
            imaging_count = session.query(func.count(ImagingRecord.id)).filter(
                and_(
                    ImagingRecord.appointment_id == appt.id,
                    ImagingRecord.is_missing == False,
                    ImagingRecord.upload_status.in_(["uploaded", "verified"])
                )
            ).scalar()

            if imaging_count == 0:
                existing_missing = session.query(ImagingRecord).filter(
                    and_(
                        ImagingRecord.appointment_id == appt.id,
                        ImagingRecord.is_missing == True
                    )
                ).first()

                if not existing_missing:
                    missing_record = ImagingRecord(
                        image_no=f"MISS-{appt.appointment_no}",
                        appointment_id=appt.id,
                        patient_id=appt.patient_id,
                        image_type="CLEANING_XRAY",
                        image_date=appt.appointment_date,
                        is_missing=True,
                        missing_note="洁牙后影像未上传",
                        upload_status="missing"
                    )
                    session.add(missing_record)

                appt.anomaly_flag = "IMAGING_MISSING" if not appt.anomaly_flag else appt.anomaly_flag + "|IMAGING_MISSING"
                appt.updated_at = now
                missing_count += 1

        session.commit()
        logger.info(f"Imaging missing check: {missing_count} appointments flagged")
        return {"status": "success", "missing_count": missing_count}

    except Exception as e:
        session.rollback()
        logger.error(f"Imaging missing check failed: {str(e)}")
        raise
    finally:
        session.close()


@celery_app.task(name="celery_tasks.tasks.check_no_show_impact")
def check_no_show_impact():
    session = get_session()
    try:
        today = datetime.utcnow().date()
        window_start = today - timedelta(days=30)

        no_shows = session.query(Appointment).filter(
            and_(
                Appointment.is_cleaning == True,
                Appointment.status.in_(["no_show", "cancelled", "missed"]),
                Appointment.appointment_date >= window_start
            )
        ).all()

        total_by_day = {}
        no_show_by_day = {}
        for appt in no_shows:
            day = appt.appointment_date
            no_show_by_day[day] = no_show_by_day.get(day, 0) + 1

        all_cleanings = session.query(Appointment).filter(
            and_(
                Appointment.is_cleaning == True,
                Appointment.appointment_date >= window_start
            )
        ).all()

        for appt in all_cleanings:
            day = appt.appointment_date
            total_by_day[day] = total_by_day.get(day, 0) + 1

        affected_periods = []
        for day in sorted(total_by_day.keys()):
            total = total_by_day[day]
            no_show_count = no_show_by_day.get(day, 0)
            if total > 0:
                rate = no_show_count / total
                if rate >= Config.NO_SHOW_IMPACT_THRESHOLD:
                    affected_periods.append({
                        "date": day.isoformat(),
                        "no_show_rate": rate,
                        "no_show_count": no_show_count,
                        "total_count": total
                    })

        logger.info(f"No-show impact check: {len(affected_periods)} days with high impact")
        return {
            "status": "success",
            "affected_periods": affected_periods,
            "window_days": 30
        }

    except Exception as e:
        logger.error(f"No-show impact check failed: {str(e)}")
        raise
    finally:
        session.close()


@celery_app.task(name="celery_tasks.tasks.check_billing_caliber_change")
def check_billing_caliber_change():
    session = get_session()
    try:
        now = datetime.utcnow()
        changed_count = 0

        billing_records = session.query(BillingRecord).filter(
            BillingRecord.data_version != "v1"
        ).all()

        for record in billing_records:
            record.caliber_changed = True
            record.caliber_change_note = f"数据版本变更至 {record.data_version}"
            record.updated_at = now

            if record.appointment_id:
                appt = session.query(Appointment).filter(Appointment.id == record.appointment_id).first()
                if appt:
                    appt.anomaly_flag = "BILLING_CALIBER" if not appt.anomaly_flag else appt.anomaly_flag + "|BILLING_CALIBER"
            changed_count += 1

        session.commit()
        logger.info(f"Billing caliber check: {changed_count} records flagged")
        return {"status": "success", "caliber_changes": changed_count}

    except Exception as e:
        session.rollback()
        logger.error(f"Billing caliber check failed: {str(e)}")
        raise
    finally:
        session.close()


@celery_app.task(name="celery_tasks.tasks.run_full_monitoring_cycle")
def run_full_monitoring_cycle():
    workflow = chain(
        sync_his_data.s(),
        check_his_delay.s(),
        check_imaging_missing.s(),
        check_no_show_impact.s(),
        check_billing_caliber_change.s()
    )
    result = workflow.apply_async()
    return {"task_id": result.id, "status": "started"}
