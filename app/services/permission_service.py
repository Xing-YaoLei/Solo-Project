from datetime import datetime
from typing import List, Dict, Any, Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.models import PermissionLog
from app.services.batch_service import create_batch, update_batch_progress, complete_batch
from app.models import BatchStatus


ACTION_MAPPING = {
    "login": "登录",
    "logout": "登出",
    "view": "查看",
    "edit": "编辑",
    "delete": "删除",
    "approve": "审批",
    "download": "下载",
    "upload": "上传",
    "export": "导出",
}


DEPARTMENT_MAPPING = {
    "FIN": "财务部",
    "HR": "人事部",
    "PUR": "采购部",
    "TECH": "技术部",
    "COMP": "合规部",
    "OPS": "运营部",
    "SALES": "销售部",
}


def normalize_action(action: str) -> str:
    if not action:
        return ""
    action_lower = str(action).lower().strip()
    return ACTION_MAPPING.get(action_lower, str(action))


def normalize_department(dept_code: str) -> str:
    if not dept_code:
        return ""
    return DEPARTMENT_MAPPING.get(str(dept_code).strip().upper(), str(dept_code))


def parse_permission_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    results = []
    for _, row in df.iterrows():
        action_time = row.get("action_time") or row.get("操作时间") or row.get("timestamp") or row.get("时间")
        if isinstance(action_time, str):
            try:
                action_time = pd.to_datetime(action_time).to_pydatetime()
            except Exception:
                action_time = None
        elif hasattr(action_time, "to_pydatetime"):
            action_time = action_time.to_pydatetime()

        raw_dept = row.get("department") or row.get("部门") or row.get("dept")
        raw_action = row.get("action") or row.get("操作") or row.get("行为")

        results.append({
            "user_identifier": str(row.get("user_identifier") or row.get("用户ID") or row.get("user_id") or ""),
            "user_name": str(row.get("user_name") or row.get("用户名") or row.get("user") or ""),
            "department": normalize_department(raw_dept),
            "action": normalize_action(raw_action),
            "resource": str(row.get("resource") or row.get("资源") or row.get("target") or ""),
            "permission_level": str(row.get("permission_level") or row.get("权限级别") or row.get("level") or ""),
            "ip_address": str(row.get("ip_address") or row.get("IP地址") or row.get("ip") or ""),
            "action_time": action_time,
            "status": str(row.get("status") or row.get("状态") or "success"),
        })
    return results


def import_permission_logs(
    db: Session,
    log_records: List[Dict[str, Any]],
    description: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> str:
    batch = create_batch(db, "permission_log", description, imported_by)
    batch_id = batch.id
    success = 0
    failed = 0

    for record in log_records:
        try:
            log = PermissionLog(
                batch_id=batch_id,
                user_identifier=record.get("user_identifier", ""),
                user_name=record.get("user_name", ""),
                department=record.get("department", ""),
                action=record.get("action", ""),
                resource=record.get("resource", ""),
                permission_level=record.get("permission_level", ""),
                ip_address=record.get("ip_address", ""),
                action_time=record.get("action_time"),
                status=record.get("status", "success"),
                raw_data=record,
            )
            db.add(log)
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
    status = BatchStatus.COMPLETED if failed == 0 else BatchStatus.FAILED
    complete_batch(db, batch_id, status=status)
    return batch.batch_number
