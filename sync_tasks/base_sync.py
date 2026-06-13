import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from utils.database import get_session
from models import SyncBatch
from config import sync_config


def generate_batch_no(source_type: str) -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:8].upper()
    return f"{source_type.upper()}_{ts}_{suffix}"


@contextmanager
def batch_manager(source_type: str, data_start: Optional[date] = None,
                  data_end: Optional[date] = None, created_by: str = "system"):
    batch_no = generate_batch_no(source_type)
    session = get_session()
    batch = SyncBatch(
        batch_no=batch_no,
        source_type=source_type,
        status="running",
        start_time=datetime.now(),
        data_range_start=data_start,
        data_range_end=data_end,
        created_by=created_by,
    )
    session.add(batch)
    session.commit()

    ctx = {
        "batch_no": batch_no,
        "session": session,
        "total_count": 0,
        "success_count": 0,
        "fail_count": 0,
        "errors": [],
    }

    try:
        yield ctx
        batch.status = "success"
    except Exception as e:
        batch.status = "failed"
        batch.error_message = str(e)
        raise
    finally:
        batch.total_count = ctx["total_count"]
        batch.success_count = ctx["success_count"]
        batch.fail_count = ctx["fail_count"]
        if ctx["errors"]:
            batch.error_message = (batch.error_message or "") + "\n" + "; ".join(ctx["errors"][:10])
        batch.end_time = datetime.now()
        session.commit()
        session.close()


def upsert_records(session, model, records: List[Dict[str, Any]],
                   unique_keys: List[str], batch_no: str, ctx: Dict):
    from sqlalchemy.dialects.postgresql import insert

    if not records:
        return

    for record in records:
        record["batch_no"] = batch_no

    ctx["total_count"] += len(records)

    stmt = insert(model).values(records)
    update_dict = {k: stmt.excluded[k] for k in records[0].keys() if k not in unique_keys}

    try:
        result = session.execute(
            stmt.on_conflict_do_update(
                index_elements=unique_keys,
                set_=update_dict
            )
        )
        session.commit()
        ctx["success_count"] += len(records)
    except Exception as e:
        session.rollback()
        for record in records:
            try:
                filters = {k: record[k] for k in unique_keys if k in record}
                existing = session.query(model).filter_by(**filters).first()
                if existing:
                    for k, v in record.items():
                        setattr(existing, k, v)
                else:
                    obj = model(**record)
                    session.add(obj)
                ctx["success_count"] += 1
            except Exception as inner_e:
                ctx["fail_count"] += 1
                ctx["errors"].append(f"Record error: {str(inner_e)}")
        session.commit()


def get_batch_history(source_type: Optional[str] = None, limit: int = 100) -> List[Dict]:
    session = get_session()
    try:
        query = session.query(SyncBatch)
        if source_type:
            query = query.filter(SyncBatch.source_type == source_type)
        batches = query.order_by(SyncBatch.start_time.desc()).limit(limit).all()
        return [
            {
                "batch_no": b.batch_no,
                "source_type": b.source_type,
                "status": b.status,
                "total_count": b.total_count,
                "success_count": b.success_count,
                "fail_count": b.fail_count,
                "start_time": b.start_time,
                "end_time": b.end_time,
                "data_range_start": b.data_range_start,
                "data_range_end": b.data_range_end,
                "error_message": b.error_message,
            }
            for b in batches
        ]
    finally:
        session.close()


def get_batch_data_preview(batch_no: str, source_type: str, limit: int = 50) -> List[Dict]:
    from models import (
        CourseSchedule, Appointment, RescheduleRecord,
        AccessRecord, BodyTestRecord
    )
    model_map = {
        "schedule": CourseSchedule,
        "appointment": Appointment,
        "reschedule": RescheduleRecord,
        "access": AccessRecord,
        "bodytest": BodyTestRecord,
    }
    model = model_map.get(source_type)
    if not model:
        return []

    session = get_session()
    try:
        records = session.query(model).filter_by(batch_no=batch_no).limit(limit).all()
        result = []
        for r in records:
            d = {c.name: getattr(r, c.name) for c in r.__table__.columns}
            for k, v in d.items():
                if isinstance(v, (datetime, date)):
                    d[k] = v.isoformat()
            result.append(d)
        return result
    finally:
        session.close()
