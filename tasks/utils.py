from datetime import datetime
from functools import wraps

from models import SessionLocal, SyncLog


def sync_task_decorator(task_name, source_system):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            db = SessionLocal()
            sync_log = SyncLog(
                task_name=task_name,
                source_system=source_system,
                sync_type=kwargs.get("sync_type", "incremental"),
                status="running",
                started_at=datetime.now(),
            )
            db.add(sync_log)
            db.commit()
            db.refresh(sync_log)

            try:
                result = func(db=db, *args, **kwargs)
                sync_log.status = "success"
                sync_log.records_count = result.get("records_count", 0)
                sync_log.error_count = result.get("error_count", 0)
            except Exception as e:
                sync_log.status = "failed"
                sync_log.error_count = 1
                sync_log.error_message = str(e)
                raise
            finally:
                sync_log.finished_at = datetime.now()
                if sync_log.started_at and sync_log.finished_at:
                    sync_log.duration_seconds = int(
                        (sync_log.finished_at - sync_log.started_at).total_seconds()
                    )
                db.commit()
                db.close()

            return result

        return wrapper

    return decorator
