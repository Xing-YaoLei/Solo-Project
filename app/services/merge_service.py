import uuid
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from app.models import (
    EmailMaterial, PermissionLog, AuditWorkpaper,
    SamplingRecord, ChecklistItem, User, RiskLevel, SamplingStatus
)
from app.services.batch_service import create_batch, update_batch_progress, complete_batch
from app.models import BatchStatus


def generate_sample_code() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    suffix = uuid.uuid4().hex[:8].upper()
    return f"SMP-{timestamp}-{suffix}"


def get_or_create_checklist(
    db: Session,
    code: str,
    title: str,
    category: str = "其他",
    risk_level: RiskLevel = RiskLevel.MEDIUM,
) -> ChecklistItem:
    item = db.query(ChecklistItem).filter(ChecklistItem.code == code).first()
    if item:
        return item
    item = ChecklistItem(
        code=code,
        title=title,
        category=category,
        default_risk_level=risk_level,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def load_emails_for_merging(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
) -> pd.DataFrame:
    query = db.query(EmailMaterial)
    if start_date:
        query = query.filter(EmailMaterial.sent_at >= start_date)
    if end_date:
        query = query.filter(EmailMaterial.sent_at <= end_date)
    if department:
        query = query.filter(EmailMaterial.department == department)

    records = query.all()
    data = []
    for rec in records:
        data.append({
            "email_id": rec.id,
            "email_dept": rec.department,
            "email_category": rec.category,
            "email_keywords": rec.keywords or [],
            "email_sent_at": rec.sent_at,
            "email_sender": rec.sender,
        })
    return pd.DataFrame(data)


def load_permission_logs_for_merging(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
) -> pd.DataFrame:
    query = db.query(PermissionLog)
    if start_date:
        query = query.filter(PermissionLog.action_time >= start_date)
    if end_date:
        query = query.filter(PermissionLog.action_time <= end_date)
    if department:
        query = query.filter(PermissionLog.department == department)

    records = query.all()
    data = []
    for rec in records:
        data.append({
            "log_id": rec.id,
            "log_dept": rec.department,
            "log_user_name": rec.user_name,
            "log_user_id": rec.user_identifier,
            "log_action": rec.action,
            "log_resource": rec.resource,
            "log_action_time": rec.action_time,
        })
    return pd.DataFrame(data)


def load_workpapers_for_merging(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
) -> pd.DataFrame:
    query = db.query(AuditWorkpaper)
    if start_date:
        query = query.filter(AuditWorkpaper.workpaper_date >= start_date)
    if end_date:
        query = query.filter(AuditWorkpaper.workpaper_date <= end_date)
    if department:
        query = query.filter(AuditWorkpaper.department == department)

    records = query.all()
    data = []
    for rec in records:
        data.append({
            "wp_id": rec.id,
            "wp_dept": rec.department,
            "wp_auditor": rec.auditor,
            "wp_checklist": rec.checklist_item,
            "wp_finding": rec.finding,
            "wp_date": rec.workpaper_date,
        })
    return pd.DataFrame(data)


def merge_datasets(
    emails_df: pd.DataFrame,
    logs_df: pd.DataFrame,
    workpapers_df: pd.DataFrame,
) -> List[Dict[str, Any]]:
    merged_records = []

    for _, email_row in emails_df.iterrows():
        dept = email_row.get("email_dept")
        category = email_row.get("email_category") or "其他"
        keywords = email_row.get("email_keywords") or []
        sent_at = email_row.get("email_sent_at")

        matched_logs = []
        if dept and not logs_df.empty:
            dept_logs = logs_df[logs_df["log_dept"] == dept]
            if sent_at is not None and not dept_logs.empty:
                time_window = pd.Timedelta(hours=24)
                if "log_action_time" in dept_logs.columns:
                    log_times = pd.to_datetime(dept_logs["log_action_time"], errors="coerce")
                    time_diff = abs(log_times - pd.Timestamp(sent_at))
                    close_logs = dept_logs[time_diff <= time_window]
                    matched_logs = close_logs["log_id"].tolist()[:1]

        matched_wp = None
        if dept and not workpapers_df.empty:
            dept_wps = workpapers_df[workpapers_df["wp_dept"] == dept]
            if category and not dept_wps.empty and "wp_checklist" in dept_wps.columns:
                for kw in keywords:
                    kw_matches = dept_wps[dept_wps["wp_checklist"].astype(str).str.contains(kw, na=False)]
                    if not kw_matches.empty:
                        matched_wp = kw_matches.iloc[0]["wp_id"]
                        break
            if matched_wp is None and not dept_wps.empty:
                matched_wp = dept_wps.iloc[0]["wp_id"]

        merged_records.append({
            "email_id": email_row["email_id"],
            "permission_log_id": matched_logs[0] if matched_logs else None,
            "workpaper_id": matched_wp,
            "department": dept or "未分类",
            "category": category,
            "keywords": keywords,
            "audit_date": sent_at.date() if sent_at else None,
        })

    for _, log_row in logs_df.iterrows():
        if any(r.get("permission_log_id") == log_row["log_id"] for r in merged_records):
            continue
        dept = log_row.get("log_dept") or "未分类"
        action_time = log_row.get("log_action_time")
        matched_wp = None
        if dept and not workpapers_df.empty:
            dept_wps = workpapers_df[workpapers_df["wp_dept"] == dept]
            if not dept_wps.empty:
                matched_wp = dept_wps.iloc[0]["wp_id"]

        merged_records.append({
            "email_id": None,
            "permission_log_id": log_row["log_id"],
            "workpaper_id": matched_wp,
            "department": dept,
            "category": "权限审计",
            "keywords": [log_row.get("log_action", "")],
            "audit_date": action_time.date() if action_time else None,
        })

    return merged_records


def create_sampling_records(
    db: Session,
    merged_records: List[Dict[str, Any]],
    description: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> str:
    batch = create_batch(db, "sampling_merge", description, imported_by)
    batch_id = batch.id
    success = 0
    failed = 0

    checklist_map = {}

    for record in merged_records:
        try:
            category = record.get("category", "其他")
            if category not in checklist_map:
                code = f"CHK-{category.upper().replace('/', '_')[:8]}-001"
                checklist = get_or_create_checklist(db, code, f"{category}合规检查项", category)
                checklist_map[category] = checklist
            checklist = checklist_map[category]

            risk = RiskLevel.MEDIUM
            dept = record.get("department", "")
            if dept in ("财务部", "合规部"):
                risk = RiskLevel.HIGH

            has_evidence = record.get("email_id") is not None or record.get("workpaper_id") is not None

            sample = SamplingRecord(
                sample_code=generate_sample_code(),
                checklist_id=checklist.id,
                email_id=record.get("email_id"),
                permission_log_id=record.get("permission_log_id"),
                workpaper_id=record.get("workpaper_id"),
                department=dept,
                status=SamplingStatus.PENDING,
                risk_level=risk,
                has_evidence=has_evidence,
                audit_date=record.get("audit_date"),
            )
            db.add(sample)
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


def run_merge_pipeline(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    imported_by: Optional[int] = None,
) -> Tuple[str, int]:
    emails_df = load_emails_for_merging(db, start_date, end_date, department)
    logs_df = load_permission_logs_for_merging(db, start_date, end_date, department)
    workpapers_df = load_workpapers_for_merging(db, start_date, end_date, department)

    merged = merge_datasets(emails_df, logs_df, workpapers_df)
    batch_num = create_sampling_records(
        db, merged,
        description=f"合并生成抽样记录: 邮件{len(emails_df)}条+权限{len(logs_df)}条+底稿{len(workpapers_df)}条",
        imported_by=imported_by,
    )
    return batch_num, len(merged)
