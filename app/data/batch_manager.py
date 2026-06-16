import uuid
from datetime import datetime
from contextlib import contextmanager
from app.models import get_session, ImportBatch, BatchStatus, ImportSource


def generate_batch_no(source: ImportSource) -> str:
    prefix = source.value.upper()[:3]
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{ts}-{suffix}"


@contextmanager
def create_batch(source: ImportSource, file_name: str = None, created_by: int = None, total_records: int = 0):
    session = get_session()
    batch = ImportBatch(
        batch_no=generate_batch_no(source),
        source=source,
        status=BatchStatus.RUNNING,
        file_name=file_name,
        total_records=total_records,
        started_at=datetime.utcnow(),
        created_by=created_by,
    )
    session.add(batch)
    session.commit()
    session.refresh(batch)

    try:
        yield batch, session
        batch.status = BatchStatus.COMPLETED
        batch.completed_at = datetime.utcnow()
    except Exception as e:
        session.rollback()
        batch.status = BatchStatus.FAILED
        batch.error_message = str(e)
        batch.completed_at = datetime.utcnow()
        session.commit()
        raise
    else:
        session.commit()
    finally:
        session.close()


def update_batch_stats(batch_id: int, success: int = 0, failed: int = 0):
    session = get_session()
    try:
        batch = session.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
        if batch:
            batch.success_records += success
            batch.failed_records += failed
            session.commit()
    finally:
        session.close()


def get_batch_history(limit: int = 100):
    session = get_session()
    try:
        batches = (
            session.query(ImportBatch)
            .order_by(ImportBatch.created_at.desc())
            .limit(limit)
            .all()
        )
        return batches
    finally:
        session.close()
