import logging
from datetime import datetime, timedelta
from app.utils.celery_app import celery_app
from app.utils.database import SessionLocal
from app.models.schema import (
    DataSyncStatus, AccessRecord, CareTerminalRecord,
    BillingRecord, ElderProfile
)
from app.services.data_processor import detect_caliber_conflicts

logger = logging.getLogger(__name__)


def _update_sync_status(system_name, status, count=0, error=None, delay_seconds=0):
    db = SessionLocal()
    try:
        sync = db.query(DataSyncStatus).filter(
            DataSyncStatus.system_name == system_name
        ).first()
        if sync:
            sync.last_sync_time = datetime.now()
            sync.sync_status = status
            sync.sync_count = count
            sync.error_message = error
            sync.current_delay_seconds = delay_seconds
        else:
            sync = DataSyncStatus(
                system_name=system_name,
                last_sync_time=datetime.now(),
                sync_status=status,
                sync_count=count,
                error_message=error,
                current_delay_seconds=delay_seconds,
            )
            db.add(sync)
        db.commit()
    except Exception as e:
        logger.error(f"更新同步状态失败: {e}")
        db.rollback()
    finally:
        db.close()


@celery_app.task(bind=True, name="app.tasks.sync_tasks.sync_access_records", max_retries=3)
def sync_access_records(self, hours_back=24):
    try:
        db = SessionLocal()
        sync_count = 0
        delayed_count = 0
        threshold = 3600

        cutoff = datetime.now() - timedelta(hours=hours_back)
        records = db.query(AccessRecord).filter(
            AccessRecord.access_time >= cutoff
        ).all()

        for rec in records:
            if rec.created_at and rec.access_time:
                delay = (rec.created_at - rec.access_time).total_seconds()
                rec.sync_delay_seconds = max(0, int(delay))
                rec.is_delayed = delay > threshold
                if delay > threshold:
                    delayed_count += 1
                sync_count += 1

        db.commit()
        _update_sync_status(
            "门禁系统", "已同步", sync_count,
            delay_seconds=delayed_count
        )
        logger.info(f"门禁记录同步完成: 处理{sync_count}条, 延迟{delayed_count}条")
        return {"status": "success", "processed": sync_count, "delayed": delayed_count}
    except Exception as exc:
        logger.error(f"门禁记录同步失败: {exc}")
        _update_sync_status("门禁系统", "同步失败", error=str(exc))
        raise self.retry(exc=exc, countdown=60)
    finally:
        if "db" in locals():
            db.close()


@celery_app.task(bind=True, name="app.tasks.sync_tasks.sync_care_terminal_records", max_retries=3)
def sync_care_terminal_records(self, days_back=7):
    try:
        db = SessionLocal()
        sync_count = 0
        missing_count = 0

        cutoff = datetime.now().date() - timedelta(days=days_back)
        elders = db.query(ElderProfile).filter(
            ElderProfile.current_status == "在住"
        ).all()
        elder_codes = [e.elder_code for e in elders]

        records = db.query(CareTerminalRecord).filter(
            CareTerminalRecord.record_date >= cutoff,
            CareTerminalRecord.elder_code.in_(elder_codes)
        ).all()

        expected_care_items = ["晨间护理", "午间护理", "晚间护理", "用药记录", "生命体征"]
        from collections import defaultdict
        elder_daily_records = defaultdict(lambda: defaultdict(set))

        for rec in records:
            elder_daily_records[rec.elder_code][rec.record_date].add(rec.care_item)
            sync_count += 1

        for elder_code in elder_codes:
            for i in range(days_back):
                check_date = datetime.now().date() - timedelta(days=i)
                recorded = elder_daily_records.get(elder_code, {}).get(check_date, set())
                missing = set(expected_care_items) - recorded
                for item in missing:
                    missing_rec = CareTerminalRecord(
                        elder_code=elder_code,
                        record_date=check_date,
                        care_item=item,
                        care_status="缺失",
                        is_missing=True,
                        missing_reason=f"护理终端缺失记录: {item}",
                    )
                    db.add(missing_rec)
                    missing_count += 1

        db.commit()
        _update_sync_status(
            "护理终端", "已同步", sync_count,
            delay_seconds=missing_count
        )
        logger.info(f"护理终端同步完成: 处理{sync_count}条, 缺失{missing_count}条")
        return {"status": "success", "processed": sync_count, "missing": missing_count}
    except Exception as exc:
        logger.error(f"护理终端同步失败: {exc}")
        _update_sync_status("护理终端", "同步失败", error=str(exc))
        raise self.retry(exc=exc, countdown=120)
    finally:
        if "db" in locals():
            db.close()


@celery_app.task(bind=True, name="app.tasks.sync_tasks.sync_billing_records", max_retries=3)
def sync_billing_records(self, days_back=30):
    try:
        db = SessionLocal()
        sync_count = 0
        caliber_changed_count = 0

        cutoff = datetime.now().date() - timedelta(days=days_back)
        records = db.query(BillingRecord).filter(
            BillingRecord.billing_date >= cutoff
        ).order_by(
            BillingRecord.elder_code,
            BillingRecord.billing_date
        ).all()

        last_caliber = {}
        for rec in records:
            key = rec.elder_code
            if key in last_caliber:
                if last_caliber[key] != rec.billing_caliber_version:
                    rec.caliber_changed = True
                    rec.change_note = f"口径从{last_caliber[key]}变更为{rec.billing_caliber_version}"
                    caliber_changed_count += 1
            last_caliber[key] = rec.billing_caliber_version
            sync_count += 1

        db.commit()

        if caliber_changed_count > 0:
            detect_caliber_conflicts(days_back)

        _update_sync_status(
            "收费系统", "已同步", sync_count,
            delay_seconds=caliber_changed_count
        )
        logger.info(f"收费系统同步完成: 处理{sync_count}条, 口径变更{caliber_changed_count}条")
        return {"status": "success", "processed": sync_count, "caliber_changed": caliber_changed_count}
    except Exception as exc:
        logger.error(f"收费系统同步失败: {exc}")
        _update_sync_status("收费系统", "同步失败", error=str(exc))
        raise self.retry(exc=exc, countdown=180)
    finally:
        if "db" in locals():
            db.close()


@celery_app.task(name="app.tasks.sync_tasks.sync_all_systems")
def sync_all_systems():
    result_access = sync_access_records.delay()
    result_care = sync_care_terminal_records.delay()
    result_billing = sync_billing_records.delay()
    return {
        "access_task_id": result_access.id,
        "care_task_id": result_care.id,
        "billing_task_id": result_billing.id,
    }
