import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models import ImportBatch, BatchStatus
from app.database import SessionLocal


def generate_batch_number(source_type: str) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"{source_type.upper()}-{timestamp}-{suffix}"


def create_batch(
    db: Session,
    source_type: str,
    description: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> ImportBatch:
    batch = ImportBatch(
        batch_number=generate_batch_number(source_type),
        source_type=source_type,
        description=description,
        status=BatchStatus.RUNNING,
        imported_by=imported_by,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def update_batch_progress(
    db: Session,
    batch_id: int,
    success: int = 0,
    failed: int = 0,
    error_message: Optional[str] = None,
) -> None:
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        return
    batch.success_records += success
    batch.failed_records += failed
    batch.total_records = batch.success_records + batch.failed_records
    if error_message:
        batch.error_message = error_message
    db.commit()


def complete_batch(
    db: Session,
    batch_id: int,
    status: BatchStatus = BatchStatus.COMPLETED,
    error_message: Optional[str] = None,
) -> None:
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        return
    batch.status = status
    batch.completed_at = datetime.utcnow()
    if error_message:
        batch.error_message = error_message
    db.commit()


def get_latest_batches(db: Session, limit: int = 10):
    return (
        db.query(ImportBatch)
        .order_by(ImportBatch.started_at.desc())
        .limit(limit)
        .all()
    )
