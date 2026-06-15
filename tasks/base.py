from celery_app import celery
from models import get_db, SyncLog, AnomalyRecord
from datetime import datetime, timedelta
import uuid
import json
import traceback
import logging

logger = logging.getLogger(__name__)


def gen_id(prefix):
    return f"{prefix}{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"


class BaseSyncTask(celery.Task):
    source_system = ""
    sync_type = "全量同步"

    def on_success(self, retval, task_id, args, kwargs):
        pass

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"[{self.source_system}] 任务失败 task_id={task_id}: {exc}")
        logger.error(traceback.format_exc())

    def __call__(self, *args, **kwargs):
        self.sync_id = gen_id("SYNC")
        self.start_time = datetime.now()
        self.total_records = 0
        self.success_count = 0
        self.failed_count = 0
        self.anomaly_count = 0
        return self.run(*args, **kwargs)

    def create_sync_log(self, status="进行中", error_message=None):
        with get_db() as db:
            log = SyncLog(
                sync_id=self.sync_id,
                source_system=self.source_system,
                sync_type=self.sync_type,
                start_time=self.start_time,
                end_time=datetime.now(),
                duration_seconds=int((datetime.now() - self.start_time).total_seconds()),
                total_records=self.total_records,
                success_count=self.success_count,
                failed_count=self.failed_count,
                anomaly_count=self.anomaly_count,
                status=status,
                error_message=error_message,
            )
            db.add(log)
            db.commit()

    def record_anomaly(self, anomaly_type, description, severity="中", table_name=None,
                       record_id=None, field_name=None, expected_value=None, actual_value=None,
                       raw_data=None, remark=None):
        with get_db() as db:
            anomaly = AnomalyRecord(
                anomaly_id=gen_id("ANOM"),
                source_system=self.source_system,
                anomaly_type=anomaly_type,
                severity=severity,
                table_name=table_name,
                record_id=record_id,
                field_name=field_name,
                expected_value=str(expected_value) if expected_value else None,
                actual_value=str(actual_value) if actual_value else None,
                description=description,
                raw_data=json.dumps(raw_data, ensure_ascii=False) if raw_data else None,
                remark=remark,
            )
            db.add(anomaly)
            db.commit()
            self.anomaly_count += 1
