from datetime import datetime
from typing import List, Dict, Any, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models import AuditWorkpaper, ImportBatch, BatchStatus
from app.services.batch_service import create_batch, update_batch_progress, complete_batch


def parse_workpaper_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    results = []
    for _, row in df.iterrows():
        wp_date = row.get("workpaper_date") or row.get("底稿日期") or row.get("date") or row.get("日期")
        if isinstance(wp_date, str):
            try:
                wp_date = pd.to_datetime(wp_date).date()
            except Exception:
                wp_date = None
        elif hasattr(wp_date, "date"):
            try:
                wp_date = wp_date.date()
            except Exception:
                wp_date = None

        results.append({
            "workpaper_id": str(row.get("workpaper_id") or row.get("底稿编号") or row.get("wp_id") or ""),
            "title": str(row.get("title") or row.get("标题") or row.get("name") or ""),
            "audit_period": str(row.get("audit_period") or row.get("审计期间") or row.get("period") or ""),
            "department": str(row.get("department") or row.get("部门") or row.get("dept") or ""),
            "auditor": str(row.get("auditor") or row.get("审计人员") or ""),
            "checklist_item": str(row.get("checklist_item") or row.get("检查项") or row.get("checklist") or ""),
            "finding": str(row.get("finding") or row.get("发现问题") or row.get("问题") or ""),
            "conclusion": str(row.get("conclusion") or row.get("结论") or ""),
            "workpaper_date": wp_date,
        })
    return results


def import_workpapers(
    db: Session,
    workpaper_records: List[Dict[str, Any]],
    description: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> str:
    batch = create_batch(db, "workpaper", description, imported_by)
    batch_id = batch.id
    total = len(workpaper_records)
    success = 0
    failed = 0

    for record in workpaper_records:
        try:
            wp = AuditWorkpaper(
                batch_id=batch_id,
                workpaper_id=record.get("workpaper_id", ""),
                title=record.get("title", ""),
                audit_period=record.get("audit_period", ""),
                department=record.get("department", ""),
                auditor=record.get("auditor", ""),
                checklist_item=record.get("checklist_item", ""),
                finding=record.get("finding", ""),
                conclusion=record.get("conclusion", ""),
                workpaper_date=record.get("workpaper_date"),
                raw_data=record,
            )
            db.add(wp)
            success += 1
            if success % 100 == 0:
                db.commit()
                update_batch_progress(db, batch_id, success=success, failed=failed)
        except Exception:
            failed += 1

    try:
        db.commit()
    except Exception:
        db.rollback()

    update_batch_progress(db, batch_id, success=success, failed=failed)
    batch_obj = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if batch_obj:
        batch_obj.total_records = total
        db.commit()
    status = BatchStatus.COMPLETED if failed == 0 else BatchStatus.FAILED
    complete_batch(db, batch_id, status=status)
    return batch.batch_number
