import json
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


class AuditLogger:
    def __init__(self, db: Session, user_id: Optional[int] = None):
        self.db = db
        self.user_id = user_id

    def log_create(self, entity_type: str, entity_id: int, new_value: Any, remark: str = None):
        self._log(entity_type, entity_id, "create", None, new_value, None, remark)

    def log_update(self, entity_type: str, entity_id: int, old_value: Any, new_value: Any,
                   field_name: str = None, remark: str = None):
        self._log(entity_type, entity_id, "update", old_value, new_value, field_name, remark)

    def log_delete(self, entity_type: str, entity_id: int, old_value: Any, remark: str = None):
        self._log(entity_type, entity_id, "delete", old_value, None, None, remark)

    def log_status_change(self, entity_type: str, entity_id: int, old_status: str, new_status: str,
                          remark: str = None):
        self._log(entity_type, entity_id, "status_change", old_status, new_status, "status", remark)

    def _log(self, entity_type: str, entity_id: int, action: str,
             old_value: Any, new_value: Any, field_name: str = None, remark: str = None):
        audit_log = AuditLog(
            user_id=self.user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=json.dumps(old_value, ensure_ascii=False) if old_value is not None else None,
            new_value=json.dumps(new_value, ensure_ascii=False) if new_value is not None else None,
            field_name=field_name,
            remark=remark
        )
        self.db.add(audit_log)
        self.db.commit()
