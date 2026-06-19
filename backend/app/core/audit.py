from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import inspect

from ..models import AuditLog, AuditActionEnum, User


def get_old_values(db_obj: Any, fields: list[str]) -> dict:
    result = {}
    for field in fields:
        value = getattr(db_obj, field, None)
        if value is not None:
            result[field] = str(value)
    return result


def log_audit(
    db: Session,
    user: Optional[User],
    action: AuditActionEnum,
    record_type: Optional[str] = None,
    record_id: Optional[int] = None,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    batch_ids: Optional[list[int]] = None,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    audit = AuditLog(
        user_id=user.id if user else None,
        action=action,
        record_type=record_type,
        record_id=record_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        batch_ids=batch_ids or [],
        remarks=remarks,
        ip_address=ip_address,
    )
    db.add(audit)
    db.flush()
    return audit


def log_create(
    db: Session,
    user: User,
    record_type: str,
    record_id: int,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    return log_audit(
        db=db,
        user=user,
        action=AuditActionEnum.CREATE,
        record_type=record_type,
        record_id=record_id,
        remarks=remarks or f"创建{record_type}记录",
        ip_address=ip_address,
    )


def log_update_fields(
    db: Session,
    user: User,
    record_type: str,
    record_id: int,
    old_data: dict,
    new_data: dict,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> list[AuditLog]:
    logs = []
    for key in new_data:
        if key in old_data and str(old_data.get(key)) != str(new_data[key]):
            log = log_audit(
                db=db,
                user=user,
                action=AuditActionEnum.UPDATE,
                record_type=record_type,
                record_id=record_id,
                field_name=key,
                old_value=str(old_data.get(key, "")),
                new_value=str(new_data[key]),
                remarks=remarks,
                ip_address=ip_address,
            )
            logs.append(log)
    return logs


def log_delete(
    db: Session,
    user: User,
    record_type: str,
    record_id: int,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    return log_audit(
        db=db,
        user=user,
        action=AuditActionEnum.DELETE,
        record_type=record_type,
        record_id=record_id,
        remarks=remarks or f"删除{record_type}记录",
        ip_address=ip_address,
    )


def log_status_change(
    db: Session,
    user: User,
    record_type: str,
    record_id: int,
    old_status: str,
    new_status: str,
    action: AuditActionEnum,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    return log_audit(
        db=db,
        user=user,
        action=action,
        record_type=record_type,
        record_id=record_id,
        field_name="status",
        old_value=old_status,
        new_value=new_status,
        remarks=remarks,
        ip_address=ip_address,
    )


def log_batch_update(
    db: Session,
    user: User,
    record_type: str,
    ids: list[int],
    updates: dict,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    return log_audit(
        db=db,
        user=user,
        action=AuditActionEnum.BATCH_UPDATE,
        record_type=record_type,
        batch_ids=ids,
        remarks=remarks or f"批量更新{len(ids)}条{record_type}记录: {','.join(updates.keys())}",
        ip_address=ip_address,
    )


def log_verify(
    db: Session,
    user: User,
    record_type: str,
    record_id: int,
    remarks: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    return log_audit(
        db=db,
        user=user,
        action=AuditActionEnum.VERIFY,
        record_type=record_type,
        record_id=record_id,
        remarks=remarks or f"复核{record_type}记录",
        ip_address=ip_address,
    )
