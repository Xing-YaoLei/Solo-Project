import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date

from sync_tasks.celery_app import app
from sync_tasks.base_sync import batch_manager, upsert_records, get_date_range
from sync_tasks.data_sources import mock_fetch_reschedule_records
from models import RescheduleRecord
from config import sync_config


@app.task(bind=True, name="sync_tasks.tasks.sync_reschedule_records", autoretry_for=(Exception,),
          retry_kwargs={"max_retries": 3, "countdown": 5})
def sync_reschedule_records(self, start_date_str: str = None, end_date_str: str = None):
    start_date, end_date = get_date_range(
        date.fromisoformat(start_date_str) if start_date_str else None,
        date.fromisoformat(end_date_str) if end_date_str else None,
        days=60
    )

    with batch_manager("reschedule", start_date, end_date) as ctx:
        batch_no = ctx["batch_no"]
        session = ctx["session"]

        all_records = mock_fetch_reschedule_records(start_date, end_date)

        batch_size = sync_config.BATCH_SIZE
        for i in range(0, len(all_records), batch_size):
            chunk = all_records[i:i + batch_size]
            upsert_records(
                session, RescheduleRecord, chunk,
                unique_keys=["record_no"],
                batch_no=batch_no,
                ctx=ctx
            )

    return {
        "batch_no": batch_no,
        "total": ctx["total_count"],
        "success": ctx["success_count"],
        "fail": ctx["fail_count"],
        "date_range": [start_date.isoformat(), end_date.isoformat()],
    }
