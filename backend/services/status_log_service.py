from datetime import datetime
from sqlalchemy.orm import Session
from models.status_log import StatusLog
from typing import Optional
import json


class StatusLogService:
    @staticmethod
    def create_log(
        db: Session,
        related_type: str,
        related_id: int,
        old_status: Optional[str],
        new_status: str,
        change_reason: Optional[str] = None,
        operator: Optional[str] = None,
        extra_info: Optional[dict] = None,
    ) -> StatusLog:
        log = StatusLog(
            related_type=related_type,
            related_id=related_id,
            old_status=old_status,
            new_status=new_status,
            change_reason=change_reason,
            operator=operator,
            operation_time=datetime.now(),
            extra_info=json.dumps(extra_info, ensure_ascii=False) if extra_info else None,
        )
        db.add(log)
        db.flush()
        return log

    @staticmethod
    def get_logs_by_related(
        db: Session,
        related_type: str,
        related_id: int,
        skip: int = 0,
        limit: int = 100,
    ):
        return (
            db.query(StatusLog)
            .filter(StatusLog.related_type == related_type, StatusLog.related_id == related_id)
            .order_by(StatusLog.operation_time.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_logs_by_type(
        db: Session,
        related_type: str,
        skip: int = 0,
        limit: int = 100,
    ):
        return (
            db.query(StatusLog)
            .filter(StatusLog.related_type == related_type)
            .order_by(StatusLog.operation_time.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
