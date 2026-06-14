import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
from typing import Optional, List, Dict

from sync_tasks.base_sync import batch_manager, upsert_records, get_date_range
from sync_tasks.data_sources import (
    mock_fetch_schedules,
    mock_fetch_appointments,
    mock_fetch_access_records,
    mock_fetch_bodytest_records,
    mock_fetch_reschedule_records,
)
from utils.db_adapter import (
    CourseSchedule, Appointment, AccessRecord,
    BodyTestRecord, RescheduleRecord, DB_TYPE,
)
from config import sync_config


SYNC_TASK_DEFS = [
    {
        "source_type": "schedule",
        "model": CourseSchedule,
        "fetch_fn": mock_fetch_schedules,
        "unique_keys": ["schedule_no"],
    },
    {
        "source_type": "appointment",
        "model": Appointment,
        "fetch_fn": mock_fetch_appointments,
        "unique_keys": ["appointment_no"],
    },
    {
        "source_type": "access",
        "model": AccessRecord,
        "fetch_fn": mock_fetch_access_records,
        "unique_keys": ["record_no"],
    },
    {
        "source_type": "bodytest",
        "model": BodyTestRecord,
        "fetch_fn": mock_fetch_bodytest_records,
        "unique_keys": ["test_no"],
    },
    {
        "source_type": "reschedule",
        "model": RescheduleRecord,
        "fetch_fn": mock_fetch_reschedule_records,
        "unique_keys": ["record_no"],
    },
]


def run_sync_task(source_type: str,
                  start_date: date = None,
                  end_date: date = None,
                  days: int = 60) -> Dict:
    start_date, end_date = get_date_range(start_date, end_date, days)

    task_def = next((t for t in SYNC_TASK_DEFS if t["source_type"] == source_type), None)
    if not task_def:
        return {"error": f"Unknown source_type: {source_type}"}

    with batch_manager(source_type, start_date, end_date) as ctx:
        batch_no = ctx["batch_no"]
        session = ctx["session"]

        all_records = task_def["fetch_fn"](start_date, end_date)

        batch_size = sync_config.BATCH_SIZE if DB_TYPE != "sqlite" else 30
        for i in range(0, len(all_records), batch_size):
            chunk = all_records[i:i + batch_size]
            upsert_records(
                session, task_def["model"], chunk,
                unique_keys=task_def["unique_keys"],
                batch_no=batch_no,
                ctx=ctx
            )

    return {
        "batch_no": batch_no,
        "source_type": source_type,
        "status": "success",
        "total": ctx["total_count"],
        "success": ctx["success_count"],
        "fail": ctx["fail_count"],
        "date_range": [start_date.isoformat(), end_date.isoformat()],
    }


def run_full_sync(start_date: date = None,
                  end_date: date = None,
                  days: int = 60) -> List[Dict]:
    start_date, end_date = get_date_range(start_date, end_date, days)

    order = ["schedule", "appointment", "reschedule", "access", "bodytest"]
    results = []
    for source_type in order:
        print(f"  同步 {source_type}...")
        result = run_sync_task(source_type, start_date, end_date, days=0)
        results.append(result)
        print(f"    {source_type}: {result.get('success', 0)}/{result.get('total', 0)} 成功, batch={result.get('batch_no', 'N/A')}")

    return results


if __name__ == "__main__":
    print("开始全量同步...")
    results = run_full_sync(days=60)
    print("\n同步完成:")
    for r in results:
        print(f"  {r['source_type']}: {r['success']}/{r['total']} 成功 (batch: {r['batch_no']})")
