from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..database import get_db
from ..enums import PlagiarismStatus, PlagiarismSeverity
from ..models import PlagiarismCase, MemberProfile
from ..schemas.schemas import (
    PlagiarismCaseCreate, PlagiarismCaseUpdate, PlagiarismCaseResponse,
    PlagiarismCaseListResponse, PlagiarismStatusUpdate, PlagiarismStatistics
)

router = APIRouter(prefix="/api/plagiarism", tags=["plagiarism"])


STATUS_TRANSITIONS = {
    PlagiarismStatus.REPORTED: [PlagiarismStatus.INVESTIGATING],
    PlagiarismStatus.INVESTIGATING: [PlagiarismStatus.CONFIRMED, PlagiarismStatus.DISMISSED],
    PlagiarismStatus.CONFIRMED: [PlagiarismStatus.APPEALED, PlagiarismStatus.RESOLVED],
    PlagiarismStatus.APPEALED: [PlagiarismStatus.RESOLVED],
    PlagiarismStatus.DISMISSED: [],
    PlagiarismStatus.RESOLVED: [],
}

TERMINAL_STATUSES = [PlagiarismStatus.DISMISSED, PlagiarismStatus.RESOLVED]


def generate_case_no(db: Session) -> str:
    now = datetime.now()
    date_part = now.strftime("%Y%m%d")
    prefix = f"PLAG{date_part}"

    last_case = (
        db.query(PlagiarismCase)
        .filter(PlagiarismCase.case_no.like(f"{prefix}%"))
        .order_by(PlagiarismCase.case_no.desc())
        .first()
    )

    if last_case and last_case.case_no:
        seq_str = last_case.case_no[-6:]
        try:
            seq = int(seq_str) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1

    return f"{prefix}{seq:06d}"


def get_case_with_relations(db: Session, case_id: int) -> PlagiarismCase:
    stmt = (
        db.query(PlagiarismCase)
        .options(
            joinedload(PlagiarismCase.member),
        )
        .filter(PlagiarismCase.id == case_id)
    )
    case = stmt.first()
    if not case:
        raise HTTPException(status_code=404, detail="抄袭案例不存在")
    return case


@router.get("/", response_model=PlagiarismCaseListResponse)
def list_plagiarism_cases(
    status: Optional[List[PlagiarismStatus]] = Query(None),
    severity: Optional[PlagiarismSeverity] = None,
    member_id: Optional[int] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(PlagiarismCase).options(
        joinedload(PlagiarismCase.member),
    )

    if status and len(status) > 0:
        query = query.filter(PlagiarismCase.status.in_(status))

    if severity:
        query = query.filter(PlagiarismCase.severity == severity)

    if member_id:
        query = query.filter(PlagiarismCase.member_id == member_id)

    if keyword:
        query = query.filter(
            (PlagiarismCase.assignment_name.ilike(f"%{keyword}%"))
            | (PlagiarismCase.course_name.ilike(f"%{keyword}%"))
        )

    total = query.count()

    items = (
        query.order_by(PlagiarismCase.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PlagiarismCaseListResponse(total=total, items=items)


@router.post("/", response_model=PlagiarismCaseResponse)
def create_plagiarism_case(
    case_data: PlagiarismCaseCreate,
    db: Session = Depends(get_db),
):
    case_no = generate_case_no(db)

    case = PlagiarismCase(
        case_no=case_no,
        member_id=case_data.member_id,
        ticket_id=case_data.ticket_id,
        status=PlagiarismStatus.REPORTED,
        severity=case_data.severity,
        assignment_name=case_data.assignment_name,
        course_name=case_data.course_name,
        similarity_score=case_data.similarity_score,
        original_author=case_data.original_author,
        description=case_data.description,
        evidence_urls=case_data.evidence_urls,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    return get_case_with_relations(db, case.id)


@router.get("/statistics", response_model=PlagiarismStatistics)
def get_plagiarism_statistics(
    db: Session = Depends(get_db),
):
    by_status_result = (
        db.query(PlagiarismCase.status, func.count(PlagiarismCase.id))
        .group_by(PlagiarismCase.status)
        .all()
    )

    by_severity_result = (
        db.query(PlagiarismCase.severity, func.count(PlagiarismCase.id))
        .group_by(PlagiarismCase.severity)
        .all()
    )

    by_status = {}
    for status, count in by_status_result:
        if status:
            by_status[status.value] = count

    for s in PlagiarismStatus:
        if s.value not in by_status:
            by_status[s.value] = 0

    by_severity = {}
    for severity, count in by_severity_result:
        if severity:
            by_severity[severity.value] = count

    for s in PlagiarismSeverity:
        if s.value not in by_severity:
            by_severity[s.value] = 0

    return PlagiarismStatistics(by_status=by_status, by_severity=by_severity)


@router.get("/{case_id}", response_model=PlagiarismCaseResponse)
def get_plagiarism_case_detail(
    case_id: int,
    db: Session = Depends(get_db),
):
    return get_case_with_relations(db, case_id)


@router.put("/{case_id}", response_model=PlagiarismCaseResponse)
def update_plagiarism_case(
    case_id: int,
    update_data: PlagiarismCaseUpdate,
    db: Session = Depends(get_db),
):
    case = db.query(PlagiarismCase).filter(PlagiarismCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="抄袭案例不存在")

    if case.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=400, detail="终态案例不能编辑")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(case, key, value)

    db.commit()
    db.refresh(case)

    return get_case_with_relations(db, case.id)


@router.post("/{case_id}/status", response_model=PlagiarismCaseResponse)
def update_plagiarism_status(
    case_id: int,
    status_data: PlagiarismStatusUpdate,
    db: Session = Depends(get_db),
):
    case = db.query(PlagiarismCase).filter(PlagiarismCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="抄袭案例不存在")

    if case.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=400, detail="终态案例不能变更状态")

    if status_data.status not in STATUS_TRANSITIONS.get(case.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"不合法的状态流转: {case.status.value} -> {status_data.status.value}",
        )

    case.status = status_data.status

    if status_data.handler_id is not None:
        case.handler_id = status_data.handler_id

    if status_data.status == PlagiarismStatus.RESOLVED:
        case.resolved_at = datetime.utcnow()
        if status_data.comment:
            case.resolution = status_data.comment

    db.commit()
    db.refresh(case)

    return get_case_with_relations(db, case.id)
