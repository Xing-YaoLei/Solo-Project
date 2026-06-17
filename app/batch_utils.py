import uuid
from datetime import datetime
from app.database import get_session
from app.models import ImportBatch


def generate_batch_no(batch_type):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    suffix = uuid.uuid4().hex[:6].upper()
    return f'{batch_type.upper()}_{timestamp}_{suffix}'


def create_batch(batch_type, source_file=None, imported_by=None):
    batch_no = generate_batch_no(batch_type)
    with get_session() as session:
        batch = ImportBatch(
            batch_no=batch_no,
            batch_type=batch_type,
            source_file=source_file,
            status='processing',
            imported_by=imported_by,
            started_at=datetime.utcnow()
        )
        session.add(batch)
        session.commit()
        session.refresh(batch)
        return batch_no


def update_batch(batch_no, **kwargs):
    with get_session() as session:
        batch = session.query(ImportBatch).filter(
            ImportBatch.batch_no == batch_no
        ).first()
        if batch:
            for key, value in kwargs.items():
                setattr(batch, key, value)
            session.commit()


def complete_batch(batch_no, success=0, failed=0, total=0, error_message=None):
    with get_session() as session:
        batch = session.query(ImportBatch).filter(
            ImportBatch.batch_no == batch_no
        ).first()
        if batch:
            batch.success_records = success
            batch.failed_records = failed
            batch.total_records = total
            batch.status = 'failed' if error_message else 'completed'
            batch.error_message = error_message
            batch.completed_at = datetime.utcnow()
            session.commit()
