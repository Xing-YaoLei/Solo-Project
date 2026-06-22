import json
from datetime import date
from typing import Optional

import pandas as pd

from app.celery_app import celery_app
from app.database import SessionLocal
from app.services.email_service import import_emails, parse_email_dataframe
from app.services.permission_service import import_permission_logs, parse_permission_dataframe
from app.services.workpaper_service import import_workpapers, parse_workpaper_dataframe
from app.services.merge_service import run_merge_pipeline


@celery_app.task(bind=True, name="tasks.import_email_task")
def import_email_task(self, records_json: str, description: Optional[str] = None, imported_by: Optional[int] = None):
    db = SessionLocal()
    try:
        records = json.loads(records_json)
        batch_num = import_emails(db, records, description, imported_by)
        return {"status": "success", "batch_number": batch_num}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.import_permission_task")
def import_permission_task(self, records_json: str, description: Optional[str] = None, imported_by: Optional[int] = None):
    db = SessionLocal()
    try:
        records = json.loads(records_json)
        batch_num = import_permission_logs(db, records, description, imported_by)
        return {"status": "success", "batch_number": batch_num}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.import_workpaper_task")
def import_workpaper_task(self, records_json: str, description: Optional[str] = None, imported_by: Optional[int] = None):
    db = SessionLocal()
    try:
        records = json.loads(records_json)
        batch_num = import_workpapers(db, records, description, imported_by)
        return {"status": "success", "batch_number": batch_num}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.merge_pipeline_task")
def merge_pipeline_task(self, start_date_str: Optional[str] = None, end_date_str: Optional[str] = None,
                        department: Optional[str] = None, imported_by: Optional[int] = None):
    db = SessionLocal()
    try:
        start_date = date.fromisoformat(start_date_str) if start_date_str else None
        end_date = date.fromisoformat(end_date_str) if end_date_str else None
        batch_num, count = run_merge_pipeline(db, start_date, end_date, department, imported_by)
        return {"status": "success", "batch_number": batch_num, "records_created": count}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.full_processing_pipeline")
def full_processing_pipeline(self, email_df_json: str, perm_df_json: str, wp_df_json: str,
                             description: Optional[str] = None, imported_by: Optional[int] = None):
    db = SessionLocal()
    try:
        email_records = parse_email_dataframe(pd.read_json(email_df_json)) if email_df_json else []
        perm_records = parse_permission_dataframe(pd.read_json(perm_df_json)) if perm_df_json else []
        wp_records = parse_workpaper_dataframe(pd.read_json(wp_df_json)) if wp_df_json else []

        results = {}
        if email_records:
            results["email_batch"] = import_emails(db, email_records, description, imported_by)
        if perm_records:
            results["permission_batch"] = import_permission_logs(db, perm_records, description, imported_by)
        if wp_records:
            results["workpaper_batch"] = import_workpapers(db, wp_records, description, imported_by)

        merge_batch, count = run_merge_pipeline(db, imported_by=imported_by)
        results["merge_batch"] = merge_batch
        results["sampling_count"] = count

        return {"status": "success", "batches": results}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
