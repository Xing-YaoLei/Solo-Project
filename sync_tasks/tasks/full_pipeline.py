import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery import group
from sync_tasks.celery_app import app

from sync_tasks.tasks.sync_schedules import sync_schedules
from sync_tasks.tasks.sync_appointments import sync_appointments
from sync_tasks.tasks.sync_access import sync_access_records
from sync_tasks.tasks.sync_bodytest import sync_bodytest_records
from sync_tasks.tasks.sync_reschedule import sync_reschedule_records


@app.task(name="sync_tasks.tasks.full_sync_pipeline")
def full_sync_pipeline(start_date_str: str = None, end_date_str: str = None):
    job = group(
        sync_schedules.s(start_date_str, end_date_str),
        sync_appointments.s(start_date_str, end_date_str),
        sync_access_records.s(start_date_str, end_date_str),
        sync_bodytest_records.s(start_date_str, end_date_str),
        sync_reschedule_records.s(start_date_str, end_date_str),
    )
    result = job.apply_async()
    return {"task_group_id": result.id, "tasks": [
        "sync_schedules", "sync_appointments", "sync_access_records",
        "sync_bodytest_records", "sync_reschedule_records"
    ]}


SYNC_TASK_REGISTRY = {
    "schedule": sync_schedules,
    "appointment": sync_appointments,
    "access": sync_access_records,
    "bodytest": sync_bodytest_records,
    "reschedule": sync_reschedule_records,
    "full": full_sync_pipeline,
}
