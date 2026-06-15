from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..database import get_db
from ..enums import TicketStatus, TicketSource, ReviewTag, MemberLevel
from ..models import CommunityTicket, MemberProfile, PlagiarismCase, User
from ..schemas.schemas import (
    FullSummaryResponse, SummaryStats, SourceChannelStats,
    ResponsibleStats, ReviewTagStats, ExamStats
)

router = APIRouter(prefix="/api/summary", tags=["summary"])


def _get_ticket_status_counts(db: Session) -> Dict[str, int]:
    result = (
        db.query(CommunityTicket.status, func.count(CommunityTicket.id))
        .group_by(CommunityTicket.status)
        .all()
    )
    counts = {s.value: 0 for s in TicketStatus}
    for status, cnt in result:
        if status:
            counts[status.value] = cnt
    return counts


def _get_overview(db: Session) -> SummaryStats:
    ticket_counts = _get_ticket_status_counts(db)

    total_members = db.query(func.count(MemberProfile.id)).scalar() or 0

    total_examined = (
        db.query(func.count(MemberProfile.id))
        .filter(MemberProfile.exam_pass_status.isnot(None))
        .scalar() or 0
    )
    passed_count = (
        db.query(func.count(MemberProfile.id))
        .filter(MemberProfile.exam_pass_status == True)
        .scalar() or 0
    )
    exam_pass_rate = (passed_count / total_examined * 100) if total_examined > 0 else 0.0

    total_plagiarism = db.query(func.count(PlagiarismCase.id)).scalar() or 0
    open_plagiarism = (
        db.query(func.count(PlagiarismCase.id))
        .filter(PlagiarismCase.status.notin_(["dismissed", "resolved"]))
        .scalar() or 0
    )

    return SummaryStats(
        total_tickets=sum(ticket_counts.values()),
        draft_count=ticket_counts.get("draft", 0),
        pending_review_count=ticket_counts.get("pending_review", 0),
        supplement_needed_count=ticket_counts.get("supplement_needed", 0),
        escalated_review_count=ticket_counts.get("escalated_review", 0),
        processing_count=ticket_counts.get("processing", 0),
        completed_count=ticket_counts.get("completed", 0),
        closed_count=ticket_counts.get("closed", 0),
        total_members=total_members,
        exam_pass_rate=round(exam_pass_rate, 2),
        plagiarism_cases_count=total_plagiarism,
        open_plagiarism_count=open_plagiarism,
    )


def _get_by_source(db: Session, total_members: int) -> List[SourceChannelStats]:
    result = (
        db.query(
            MemberProfile.source_channel,
            func.count(MemberProfile.id),
        )
        .group_by(MemberProfile.source_channel)
        .all()
    )

    source_counts = {}
    for source, cnt in result:
        if source:
            source_counts[source] = cnt

    stats_list = []
    for source in TicketSource:
        count = source_counts.get(source, 0)
        percentage = (count / total_members * 100) if total_members > 0 else 0.0

        channel_total = (
            db.query(func.count(MemberProfile.id))
            .filter(
                MemberProfile.source_channel == source,
                MemberProfile.exam_pass_status.isnot(None)
            )
            .scalar() or 0
        )
        channel_passed = (
            db.query(func.count(MemberProfile.id))
            .filter(
                MemberProfile.source_channel == source,
                MemberProfile.exam_pass_status == True
            )
            .scalar() or 0
        )
        channel_pass_rate = (channel_passed / channel_total * 100) if channel_total > 0 else None

        stats_list.append(SourceChannelStats(
            source=source,
            count=count,
            percentage=round(percentage, 2),
            exam_pass_rate=round(channel_pass_rate, 2) if channel_pass_rate is not None else None,
        ))

    return stats_list


def _get_by_responsible(db: Session) -> List[ResponsibleStats]:
    result = (
        db.query(
            CommunityTicket.responsible_id,
            func.count(CommunityTicket.id),
        )
        .filter(CommunityTicket.responsible_id.isnot(None))
        .group_by(CommunityTicket.responsible_id)
        .all()
    )

    completed_statuses = [TicketStatus.COMPLETED, TicketStatus.CLOSED]

    stats_list = []
    for responsible_id, total in result:
        if not responsible_id:
            continue

        user = db.query(User).filter(User.id == responsible_id).first()
        if not user:
            continue

        completed = (
            db.query(func.count(CommunityTicket.id))
            .filter(
                CommunityTicket.responsible_id == responsible_id,
                CommunityTicket.status.in_(completed_statuses)
            )
            .scalar() or 0
        )
        completion_rate = (completed / total * 100) if total > 0 else 0.0

        stats_list.append(ResponsibleStats(
            responsible_id=responsible_id,
            responsible_name=user.full_name,
            total=total,
            completed=completed,
            completion_rate=round(completion_rate, 2),
        ))

    return stats_list


def _get_by_review_tag(db: Session) -> List[ReviewTagStats]:
    result = (
        db.query(
            CommunityTicket.review_tag,
            func.count(CommunityTicket.id),
        )
        .filter(CommunityTicket.review_tag.isnot(None))
        .group_by(CommunityTicket.review_tag)
        .all()
    )

    tag_counts = {}
    total = 0
    for tag, cnt in result:
        if tag:
            tag_counts[tag] = cnt
            total += cnt

    stats_list = []
    for tag in ReviewTag:
        count = tag_counts.get(tag, 0)
        percentage = (count / total * 100) if total > 0 else 0.0
        stats_list.append(ReviewTagStats(
            tag=tag,
            count=count,
            percentage=round(percentage, 2),
        ))

    return stats_list


def _get_exam_stats(db: Session) -> ExamStats:
    total_examined = (
        db.query(func.count(MemberProfile.id))
        .filter(MemberProfile.exam_pass_status.isnot(None))
        .scalar() or 0
    )
    passed_count = (
        db.query(func.count(MemberProfile.id))
        .filter(MemberProfile.exam_pass_status == True)
        .scalar() or 0
    )
    failed_count = total_examined - passed_count
    pass_rate = (passed_count / total_examined * 100) if total_examined > 0 else 0.0

    avg_score_row = (
        db.query(func.avg(MemberProfile.exam_score))
        .filter(MemberProfile.exam_score.isnot(None))
        .scalar()
    )
    average_score = round(float(avg_score_row), 2) if avg_score_row is not None else None

    by_level_result = (
        db.query(
            MemberProfile.level,
            func.count(MemberProfile.id),
            func.sum(func.case((MemberProfile.exam_pass_status == True, 1), else_=0)),
            func.avg(MemberProfile.exam_score),
        )
        .filter(MemberProfile.exam_pass_status.isnot(None))
        .group_by(MemberProfile.level)
        .all()
    )

    by_level = {}
    for level, level_total, level_passed, level_avg in by_level_result:
        if not level:
            continue
        level_pass_rate = (level_passed / level_total * 100) if level_total > 0 else 0.0
        by_level[level.value] = {
            "total": level_total,
            "passed": level_passed,
            "failed": level_total - level_passed,
            "pass_rate": round(level_pass_rate, 2),
            "average_score": round(float(level_avg), 2) if level_avg is not None else None,
        }

    return ExamStats(
        total_examined=total_examined,
        passed_count=passed_count,
        failed_count=failed_count,
        pass_rate=round(pass_rate, 2),
        average_score=average_score,
        by_level=by_level,
    )


@router.get("/overview", response_model=FullSummaryResponse)
def get_overview_summary(
    db: Session = Depends(get_db),
):
    overview = _get_overview(db)
    by_source = _get_by_source(db, overview.total_members)
    by_responsible = _get_by_responsible(db)
    by_review_tag = _get_by_review_tag(db)
    exam_stats = _get_exam_stats(db)

    return FullSummaryResponse(
        overview=overview,
        by_source=by_source,
        by_responsible=by_responsible,
        by_review_tag=by_review_tag,
        exam_stats=exam_stats,
    )


@router.get("/tickets-by-status")
def get_tickets_by_status(
    db: Session = Depends(get_db),
):
    counts = _get_ticket_status_counts(db)
    return {
        "total": sum(counts.values()),
        "by_status": counts,
    }


@router.get("/exam-pass-rate-by-period")
def get_exam_pass_rate_by_period(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(MemberProfile).filter(MemberProfile.exam_pass_status.isnot(None))

    if date_from:
        query = query.filter(MemberProfile.exam_date >= date_from)
    if date_to:
        query = query.filter(MemberProfile.exam_date <= date_to)

    total = query.count() or 0

    passed_query = query.filter(MemberProfile.exam_pass_status == True)
    passed = passed_query.count() or 0

    avg_score_row = (
        db.query(func.avg(MemberProfile.exam_score))
        .filter(MemberProfile.exam_score.isnot(None))
        .filter(MemberProfile.exam_date.isnot(None))
    )
    if date_from:
        avg_score_row = avg_score_row.filter(MemberProfile.exam_date >= date_from)
    if date_to:
        avg_score_row = avg_score_row.filter(MemberProfile.exam_date <= date_to)
    avg_score = avg_score_row.scalar()

    pass_rate = (passed / total * 100) if total > 0 else 0.0

    return {
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None,
        "total_examined": total,
        "passed_count": passed,
        "failed_count": total - passed,
        "pass_rate": round(pass_rate, 2),
        "average_score": round(float(avg_score), 2) if avg_score is not None else None,
    }


@router.get("/export-data")
def export_summary_data(
    db: Session = Depends(get_db),
):
    overview = _get_overview(db)
    by_source = _get_by_source(db, overview.total_members)
    by_responsible = _get_by_responsible(db)
    by_review_tag = _get_by_review_tag(db)
    exam_stats = _get_exam_stats(db)
    ticket_status_counts = _get_ticket_status_counts(db)

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "overview": overview.model_dump(),
        "tickets_by_status": ticket_status_counts,
        "by_source": [s.model_dump() for s in by_source],
        "by_responsible": [r.model_dump() for r in by_responsible],
        "by_review_tag": [t.model_dump() for t in by_review_tag],
        "exam_stats": exam_stats.model_dump(),
    }

    return export_data
