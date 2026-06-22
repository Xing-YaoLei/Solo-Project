from datetime import date, datetime
from typing import Optional, List, Dict, Any

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_

from app.models import (
    SamplingRecord, ChecklistItem, RectificationPlan, RiskHistory,
    Comment, User, EmailMaterial, PermissionLog, AuditWorkpaper,
    ImportBatch, RiskLevel, SamplingStatus, RectificationStatus
)


def apply_user_scope(query, user: User):
    if user.is_management:
        return query
    return query.filter(SamplingRecord.assigned_user_id == user.id)


def apply_date_range(query, start_date: Optional[date] = None, end_date: Optional[date] = None):
    if start_date:
        query = query.filter(SamplingRecord.audit_date >= start_date)
    if end_date:
        query = query.filter(SamplingRecord.audit_date <= end_date)
    return query


def get_checklist_distribution(db: Session, user: User,
                              start_date: Optional[date] = None,
                              end_date: Optional[date] = None,
                              department: Optional[str] = None) -> pd.DataFrame:
    query = (
        db.query(
            ChecklistItem.category,
            ChecklistItem.title,
            func.count(SamplingRecord.id).label("total")
        )
        .outerjoin(SamplingRecord, SamplingRecord.checklist_id == ChecklistItem.id)
    )
    query = apply_user_scope(query, user)
    query = apply_date_range(query, start_date, end_date)
    if department:
        query = query.filter(SamplingRecord.department == department)
    query = query.group_by(ChecklistItem.category, ChecklistItem.title)
    results = query.all()
    return pd.DataFrame(results, columns=["category", "checklist_title", "count"])


def get_sampling_funnel(db: Session, user: User,
                          start_date: Optional[date] = None,
                          end_date: Optional[date] = None,
                          department: Optional[str] = None) -> Dict[str, int]:
    subq = db.query(SamplingRecord)
    subq = apply_user_scope(subq, user)
    subq = apply_date_range(subq, start_date, end_date)
    if department:
        subq = subq.filter(SamplingRecord.department == department)
    total = subq.count()

    has_evidence = subq.filter(SamplingRecord.has_evidence == True).count()
    in_progress = subq.filter(SamplingRecord.status == SamplingStatus.IN_PROGRESS).count()
    completed = subq.filter(SamplingRecord.status == SamplingStatus.COMPLETED).count()
    evidence_missing = subq.filter(SamplingRecord.status == SamplingStatus.EVIDENCE_MISSING).count()

    return {
        "抽样总数": total,
        "已关联证据": has_evidence,
        "处理中": in_progress,
        "已完成": completed,
        "证据缺失": evidence_missing,
    }


def get_rectification_ranking(db: Session, user: User,
                            start_date: Optional[date] = None,
                            end_date: Optional[date] = None,
                            department: Optional[str] = None,
                            top_n: int = 10) -> pd.DataFrame:
    query = db.query(
        RectificationPlan.department,
        RectificationPlan.responsible_person,
        RectificationPlan.title,
        RectificationPlan.priority,
        RectificationPlan.due_date,
        RectificationPlan.status,
    )
    query = query.join(SamplingRecord, RectificationPlan.sampling_record_id == SamplingRecord.id)
    query = apply_user_scope(query, user)
    if start_date:
        query = query.filter(RectificationPlan.created_at >= start_date)
    if end_date:
        query = query.filter(RectificationPlan.created_at <= end_date)
    if department:
        query = query.filter(RectificationPlan.department == department)
    query = query.order_by(RectificationPlan.priority.asc(), RectificationPlan.due_date.asc())
    results = query.limit(top_n).all()
    return pd.DataFrame(results, columns=[
        "department", "responsible_person", "title", "priority", "due_date", "status"
    ])


def get_risk_level_changes(db: Session, user: User,
                            start_date: Optional[date] = None,
                            end_date: Optional[date] = None,
                            department: Optional[str] = None) -> pd.DataFrame:
    subq = db.query(SamplingRecord)
    subq = apply_user_scope(subq, user)
    subq = apply_date_range(subq, start_date, end_date)
    if department:
        subq = subq.filter(SamplingRecord.department == department)
    valid_ids = [r.id for r in subq.all()]

    query = db.query(
        RiskHistory.changed_at, RiskHistory.previous_level, RiskHistory.new_level)
    query = query.filter(RiskHistory.sampling_record_id.in_(valid_ids))
    if start_date:
        query = query.filter(RiskHistory.changed_at >= start_date)
    if end_date:
        query = query.filter(RiskHistory.changed_at <= end_date)
    query = query.order_by(RiskHistory.changed_at.asc())
    results = query.all()
    return pd.DataFrame(results, columns=["changed_at", "previous_level", "new_level"])


def get_risk_summary(db: Session, user: User,
                      start_date: Optional[date] = None,
                      end_date: Optional[date] = None,
                      department: Optional[str] = None) -> Dict[str, int]:
    query = db.query(
        SamplingRecord.risk_level,
        func.count(SamplingRecord.id).label("count"))
    query = apply_user_scope(query, user)
    query = apply_date_range(query, start_date, end_date)
    if department:
        query = query.filter(SamplingRecord.department == department)
    query = query.group_by(SamplingRecord.risk_level)
    results = query.all()
    summary = {level.value: 0 for level in RiskLevel}
    for level, count in results:
        summary[level.value] = count
    return summary


def get_department_summary(db: Session, user: User,
                            start_date: Optional[date] = None,
                            end_date: Optional[date] = None) -> pd.DataFrame:
    query = db.query(
        SamplingRecord.department,
        func.count(SamplingRecord.id).label("total"),
        func.sum(case((SamplingRecord.status == SamplingStatus.COMPLETED, 1), else_=0)).label("completed"),
        func.sum(case((SamplingRecord.status == SamplingStatus.EVIDENCE_MISSING, 1), else_=0)).label("evidence_missing"),
    )
    query = apply_user_scope(query, user)
    query = apply_date_range(query, start_date, end_date)
    query = query.group_by(SamplingRecord.department)
    results = query.all()
    return pd.DataFrame(results, columns=["department", "total", "completed", "evidence_missing"])


def get_sampling_records_df(db: Session, user: User,
                         start_date: Optional[date] = None,
                         end_date: Optional[date] = None,
                         department: Optional[str] = None,
                         status: Optional[SamplingStatus] = None,
                         risk_level: Optional[RiskLevel] = None) -> pd.DataFrame:
    query = db.query(SamplingRecord)
    query = apply_user_scope(query, user)
    query = apply_date_range(query, start_date, end_date)
    if department:
        query = query.filter(SamplingRecord.department == department)
    if status:
        query = query.filter(SamplingRecord.status == status)
    if risk_level:
        query = query.filter(SamplingRecord.risk_level == risk_level)
    records = query.all()
    data = []
    for r in records:
        data.append({
            "id": r.id,
            "sample_code": r.sample_code,
            "department": r.department,
            "status": r.status.value if r.status else "",
            "risk_level": r.risk_level.value if r.risk_level else "",
            "has_evidence": r.has_evidence,
            "audit_date": r.audit_date,
            "assigned_user_id": r.assigned_user_id,
        })
    return pd.DataFrame(data)


def get_comments_for_sample(db: Session, sample_id: int) -> List[Dict[str, Any]]:
    comments = db.query(Comment).filter(Comment.sampling_record_id == sample_id).order_by(Comment.created_at.desc()).all()
    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "content": c.content,
            "user_name": c.user.full_name if c.user else "",
            "comment_type": c.comment_type,
            "is_evidence_missing": c.is_evidence_missing,
            "created_at": c.created_at,
        })
    return result


def get_batch_history(db: Session, limit: int = 20) -> pd.DataFrame:
    batches = db.query(ImportBatch).order_by(ImportBatch.started_at.desc()).limit(limit).all()
    data = []
    for b in batches:
        data.append({
            "batch_number": b.batch_number,
            "source_type": b.source_type,
            "status": b.status.value if b.status else "",
            "total_records": b.total_records,
            "success_records": b.success_records,
            "failed_records": b.failed_records,
            "started_at": b.started_at,
            "completed_at": b.completed_at,
        })
    return pd.DataFrame(data)
