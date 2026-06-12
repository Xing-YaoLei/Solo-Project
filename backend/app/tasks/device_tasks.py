from datetime import datetime, timedelta
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from app.models import Device, CleaningRecord
from app import schemas


@celery_app.task
def check_device_offline_status():
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(minutes=settings.DEVICE_OFFLINE_THRESHOLD_MINUTES)
        offline_devices = db.query(Device).filter(
            Device.status != schemas.DeviceStatus.OFFLINE,
            (Device.last_heartbeat.is_(None)) | (Device.last_heartbeat < threshold)
        ).all()

        for device in offline_devices:
            device.status = schemas.DeviceStatus.OFFLINE

            pending_records = db.query(CleaningRecord).filter(
                CleaningRecord.device_id == device.id,
                CleaningRecord.status.in_([
                    schemas.CleaningStatus.DRAFT,
                    schemas.CleaningStatus.PENDING_REVIEW,
                    schemas.CleaningStatus.REVIEWING,
                ])
            ).all()

            for record in pending_records:
                record.is_device_offline = True

        db.commit()
        return {"updated_devices": len(offline_devices)}
    finally:
        db.close()


@celery_app.task
def send_notification(task_type: str, record_id: int, message: str):
    return {"task": task_type, "record_id": record_id, "message": message, "sent_at": datetime.utcnow().isoformat()}
