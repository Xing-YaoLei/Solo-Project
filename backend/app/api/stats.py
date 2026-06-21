from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document, DocumentStatus, AuditRecord
from app.api.deps import require_roles

router = APIRouter(prefix="/stats", tags=["统计报表"])


@router.get("/conversion-trend")
def get_conversion_trend(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager")),
):
    """内容转化趋势：管理层查看各阶段转化漏斗（按日统计）"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    daily_stats = []
    for i in range(days + 1):
        day = (start_date + timedelta(days=i)).date()
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        created = db.query(func.count(Document.id)).filter(
            Document.created_at >= day_start,
            Document.created_at <= day_end,
        ).scalar() or 0

        interacting = db.query(func.count(Document.id)).filter(
            Document.created_at <= day_end,
        ).filter(
            Document.status.in_([
                DocumentStatus.INTERACTING,
                DocumentStatus.RISK_CHECKED,
                DocumentStatus.VERSION_VERIFIED,
                DocumentStatus.PENDING_REVIEW,
                DocumentStatus.APPROVED,
                DocumentStatus.REJECTED,
                DocumentStatus.ARCHIVED,
            ])
        ).filter(
            Document.updated_at >= day_start,
            Document.updated_at <= day_end,
        ).scalar() or 0

        risk_checked = db.query(func.count(Document.id)).filter(
            Document.created_at <= day_end,
        ).filter(
            Document.status.in_([
                DocumentStatus.RISK_CHECKED,
                DocumentStatus.VERSION_VERIFIED,
                DocumentStatus.PENDING_REVIEW,
                DocumentStatus.APPROVED,
                DocumentStatus.REJECTED,
                DocumentStatus.ARCHIVED,
            ])
        ).filter(
            Document.updated_at >= day_start,
            Document.updated_at <= day_end,
        ).scalar() or 0

        pending = db.query(func.count(Document.id)).filter(
            Document.created_at <= day_end,
        ).filter(
            Document.status.in_([
                DocumentStatus.PENDING_REVIEW,
                DocumentStatus.APPROVED,
                DocumentStatus.REJECTED,
                DocumentStatus.ARCHIVED,
            ])
        ).filter(
            Document.updated_at >= day_start,
            Document.updated_at <= day_end,
        ).scalar() or 0

        approved = db.query(func.count(AuditRecord.id)).filter(
            AuditRecord.action == "approve",
            AuditRecord.created_at >= day_start,
            AuditRecord.created_at <= day_end,
        ).scalar() or 0

        rejected = db.query(func.count(AuditRecord.id)).filter(
            AuditRecord.action == "reject",
            AuditRecord.created_at >= day_start,
            AuditRecord.created_at <= day_end,
        ).scalar() or 0

        daily_stats.append({
            "date": day.isoformat(),
            "created": created,
            "interacting": interacting,
            "risk_checked": risk_checked,
            "pending_review": pending,
            "approved": approved,
            "rejected": rejected,
        })

    funnel = {
        "total_created": db.query(func.count(Document.id)).filter(
            Document.created_at >= start_date
        ).scalar() or 0,
        "total_interacting": db.query(func.count(Document.id)).filter(
            Document.status.in_([
                DocumentStatus.INTERACTING,
                DocumentStatus.RISK_CHECKED,
                DocumentStatus.VERSION_VERIFIED,
                DocumentStatus.PENDING_REVIEW,
                DocumentStatus.APPROVED,
                DocumentStatus.REJECTED,
                DocumentStatus.ARCHIVED,
            ])
        ).scalar() or 0,
        "total_risk_checked": db.query(func.count(Document.id)).filter(
            Document.risk_level.isnot(None)
        ).scalar() or 0,
        "total_version_verified": db.query(func.count(Document.id)).filter(
            Document.is_version_verified == True
        ).scalar() or 0,
        "total_pending": db.query(func.count(Document.id)).filter(
            Document.status == DocumentStatus.PENDING_REVIEW
        ).scalar() or 0,
        "total_approved": db.query(func.count(Document.id)).filter(
            Document.status.in_([DocumentStatus.APPROVED, DocumentStatus.ARCHIVED])
        ).scalar() or 0,
        "total_rejected": db.query(func.count(Document.id)).filter(
            Document.status == DocumentStatus.REJECTED
        ).scalar() or 0,
    }

    return {
        "period": f"{start_date.date().isoformat()} - {end_date.date().isoformat()}",
        "daily": daily_stats,
        "funnel": funnel,
    }


@router.get("/by-type")
def get_stats_by_type(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager")),
):
    """按文书类型统计"""
    results = db.query(
        Document.document_type,
        func.count(Document.id).label("total"),
    ).group_by(Document.document_type).all()

    approved_by_type = db.query(
        Document.document_type,
        func.count(Document.id).label("approved"),
    ).filter(
        Document.status.in_([DocumentStatus.APPROVED, DocumentStatus.ARCHIVED])
    ).group_by(Document.document_type).all()

    approved_map = {r[0]: r[1] for r in approved_by_type}

    return [
        {
            "document_type": r[0].value if hasattr(r[0], "value") else r[0],
            "total": r[1],
            "approved": approved_map.get(r[0], 0),
            "rate": round(approved_map.get(r[0], 0) / r[1] * 100, 2) if r[1] > 0 else 0,
        }
        for r in results
    ]


@router.get("/by-assignee")
def get_stats_by_assignee(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager")),
):
    """按处理人统计工作量"""
    results = db.query(
        User.id,
        User.full_name,
        User.role,
        func.count(Document.id).label("total"),
    ).outerjoin(Document, Document.assignee_id == User.id).group_by(User.id).all()

    approved_by_user = dict(
        db.query(
            Document.assignee_id,
            func.count(Document.id),
        ).filter(
            Document.status.in_([DocumentStatus.APPROVED, DocumentStatus.ARCHIVED])
        ).group_by(Document.assignee_id).all()
    )

    rejected_by_user = dict(
        db.query(
            Document.assignee_id,
            func.count(Document.id),
        ).filter(
            Document.status == DocumentStatus.REJECTED
        ).group_by(Document.assignee_id).all()
    )

    pending_by_user = dict(
        db.query(
            Document.assignee_id,
            func.count(Document.id),
        ).filter(
            Document.status == DocumentStatus.PENDING_REVIEW
        ).group_by(Document.assignee_id).all()
    )

    return [
        {
            "user_id": r[0],
            "full_name": r[1],
            "role": r[2].value if hasattr(r[2], "value") else r[2],
            "total": r[3],
            "approved": approved_by_user.get(r[0], 0),
            "rejected": rejected_by_user.get(r[0], 0),
            "pending": pending_by_user.get(r[0], 0),
        }
        for r in results
    ]


@router.get("/risk-distribution")
def get_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "manager", "auditor")),
):
    """风险等级分布"""
    results = db.query(
        Document.risk_level,
        func.count(Document.id),
    ).filter(Document.risk_level.isnot(None)).group_by(Document.risk_level).all()

    return [
        {"risk_level": r[0], "count": r[1]}
        for r in results
    ]
