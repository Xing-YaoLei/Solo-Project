import os
import csv
from datetime import datetime
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session

from .celery_app import celery_app
from ..database import SessionLocal
from ..models import HeatPoint, GuideContent, Seat, MerchantContract, RecordStatusEnum, User, RoleEnum
from ..core.audit import log_batch_update, log_create
from ..config import settings


@celery_app.task(bind=True, name="tasks.batch_update_heat_points")
def batch_update_heat_points_task(self, ids: list[int], updates: dict, user_id: int, remarks: Optional[str] = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        query = db.query(HeatPoint).filter(HeatPoint.id.in_(ids))
        total = query.count()
        query.update(updates, synchronize_session=False)
        log_batch_update(db, user, "heat_point", ids, updates, remarks)
        db.commit()
        return {"status": "success", "updated": total, "ids": ids}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.batch_update_seats")
def batch_update_seats_task(self, ids: list[int], updates: dict, user_id: int, remarks: Optional[str] = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        query = db.query(Seat).filter(Seat.id.in_(ids))
        total = query.count()
        query.update(updates, synchronize_session=False)
        log_batch_update(db, user, "seat", ids, updates, remarks)
        db.commit()
        return {"status": "success", "updated": total, "ids": ids}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.batch_update_contracts")
def batch_update_contracts_task(self, ids: list[int], updates: dict, user_id: int, remarks: Optional[str] = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        query = db.query(MerchantContract).filter(MerchantContract.id.in_(ids))
        total = query.count()
        query.update(updates, synchronize_session=False)
        log_batch_update(db, user, "merchant_contract", ids, updates, remarks)
        db.commit()
        return {"status": "success", "updated": total, "ids": ids}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.batch_update_content")
def batch_update_content_task(self, ids: list[int], updates: dict, user_id: int, remarks: Optional[str] = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        query = db.query(GuideContent).filter(GuideContent.id.in_(ids))
        total = query.count()
        query.update(updates, synchronize_session=False)
        log_batch_update(db, user, "guide_content", ids, updates, remarks)
        db.commit()
        return {"status": "success", "updated": total, "ids": ids}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(bind=True, name="tasks.import_heat_points_from_csv")
def import_heat_points_from_csv_task(self, file_path: str, route_id: int, user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        imported = 0
        errors = []

        df = pd.read_csv(file_path)
        for idx, row in df.iterrows():
            try:
                hp = HeatPoint(
                    route_id=route_id,
                    name=str(row.get("name", f"点位{idx+1}")),
                    code=str(row.get("code", "")) if pd.notna(row.get("code")) else None,
                    latitude=float(row.get("latitude", 0)),
                    longitude=float(row.get("longitude", 0)),
                    radius_meters=float(row.get("radius_meters", 50)),
                    description=str(row.get("description", "")) if pd.notna(row.get("description")) else None,
                    sort_order=int(row.get("sort_order", idx)),
                    status=RecordStatusEnum.PENDING,
                    created_by=user_id,
                )
                db.add(hp)
                db.flush()
                log_create(db, user, "heat_point", hp.id, f"CSV导入第{idx+1}行")
                imported += 1
            except Exception as row_e:
                errors.append(f"第{idx+1}行: {str(row_e)}")

        db.commit()
        return {"status": "success", "imported": imported, "errors": errors}
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()
        if os.path.exists(file_path):
            os.remove(file_path)


@celery_app.task(bind=True, name="tasks.export_audit_logs")
def export_audit_logs_task(self, record_type: Optional[str] = None, record_id: Optional[int] = None,
                           start_date: Optional[str] = None, end_date: Optional[str] = None):
    db = SessionLocal()
    try:
        from ..models import AuditLog
        query = db.query(AuditLog)
        if record_type:
            query = query.filter(AuditLog.record_type == record_type)
        if record_id:
            query = query.filter(AuditLog.record_id == record_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(AuditLog.created_at <= datetime.fromisoformat(end_date))

        logs = query.order_by(AuditLog.created_at.desc()).all()

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"audit_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)

        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "操作人ID", "动作", "记录类型", "记录ID", "字段", "旧值", "新值", "备注", "时间"])
            for log in logs:
                writer.writerow([
                    log.id,
                    log.user_id,
                    log.action.value,
                    log.record_type,
                    log.record_id,
                    log.field_name,
                    log.old_value,
                    log.new_value,
                    log.remarks,
                    log.created_at.isoformat(),
                ])

        return {"status": "success", "file": filepath, "count": len(logs)}
    except Exception as e:
        raise
    finally:
        db.close()
