from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import and_, or_

from ..database import get_db
from ..enums import TicketStatus, TicketSource, ReviewTag
from ..models import (
    CommunityTicket, User, MemberProfile, AuditLog,
    ReviewRecord, TicketBenefitReference, BenefitRule, AccountTransaction
)
from ..schemas.schemas import (
    CommunityTicketCreate, CommunityTicketUpdate, CommunityTicketResponse,
    CommunityTicketListResponse, TicketStatusUpdate, TicketReviewCreate,
    AuditLogResponse
)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

STATUS_TRANSITIONS = {
    TicketStatus.DRAFT: [TicketStatus.PENDING_REVIEW, TicketStatus.CLOSED],
    TicketStatus.PENDING_REVIEW: [TicketStatus.REVIEWING, TicketStatus.CLOSED],
    TicketStatus.REVIEWING: [
        TicketStatus.SUPPLEMENT_NEEDED,
        TicketStatus.ESCALATED_REVIEW,
        TicketStatus.PROCESSING,
        TicketStatus.CLOSED,
    ],
    TicketStatus.SUPPLEMENT_NEEDED: [TicketStatus.PENDING_REVIEW, TicketStatus.CLOSED],
    TicketStatus.ESCALATED_REVIEW: [
        TicketStatus.PROCESSING,
        TicketStatus.SUPPLEMENT_NEEDED,
        TicketStatus.CLOSED,
    ],
    TicketStatus.PROCESSING: [TicketStatus.COMPLETED, TicketStatus.CLOSED],
    TicketStatus.COMPLETED: [TicketStatus.CLOSED],
    TicketStatus.CLOSED: [],
}


def get_current_user_id(x_user_id: Optional[int] = Header(None, alias="X-User-Id")) -> int:
    return x_user_id if x_user_id is not None else 1


def generate_ticket_no() -> str:
    now = datetime.now()
    date_part = now.strftime("%Y%m%d")
    seq = int(now.timestamp() * 1000) % 1000000
    return f"TK{date_part}{seq:06d}"


def get_ticket_with_relations(db: Session, ticket_id: int) -> CommunityTicket:
    stmt = (
        db.query(CommunityTicket)
        .options(
            joinedload(CommunityTicket.member),
            joinedload(CommunityTicket.creator),
            joinedload(CommunityTicket.responsible),
            subqueryload(CommunityTicket.audit_logs).joinedload(AuditLog.operator),
            subqueryload(CommunityTicket.review_records).joinedload(ReviewRecord.reviewer),
            subqueryload(CommunityTicket.transactions),
            subqueryload(CommunityTicket.benefit_references).joinedload(TicketBenefitReference.benefit),
        )
        .filter(CommunityTicket.id == ticket_id)
    )
    ticket = stmt.first()
    if not ticket:
        raise HTTPException(status_code=404, detail="单据不存在")
    return ticket


def create_audit_log(
    db: Session,
    ticket_id: int,
    operator_id: int,
    action: str,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    comment: Optional[str] = None,
    evidence_urls: Optional[List[str]] = None,
    reference_ids: Optional[List[int]] = None,
) -> AuditLog:
    log = AuditLog(
        ticket_id=ticket_id,
        operator_id=operator_id,
        action=action,
        old_status=old_status.value if isinstance(old_status, TicketStatus) else old_status,
        new_status=new_status.value if isinstance(new_status, TicketStatus) else new_status,
        comment=comment,
        evidence_urls=evidence_urls or [],
        reference_ids=reference_ids or [],
    )
    db.add(log)
    return log


@router.get("/", response_model=CommunityTicketListResponse)
def list_tickets(
    status: Optional[List[TicketStatus]] = Query(None),
    source: Optional[TicketSource] = None,
    category: Optional[str] = None,
    member_id: Optional[int] = None,
    responsible_id: Optional[int] = None,
    creator_id: Optional[int] = None,
    review_tag: Optional[ReviewTag] = None,
    keyword: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(CommunityTicket).options(
        joinedload(CommunityTicket.member),
        joinedload(CommunityTicket.creator),
        joinedload(CommunityTicket.responsible),
    )

    if status and len(status) > 0:
        query = query.filter(CommunityTicket.status.in_(status))

    if source:
        query = query.filter(CommunityTicket.source == source)

    if category:
        query = query.filter(CommunityTicket.category == category)

    if member_id:
        query = query.filter(CommunityTicket.member_id == member_id)

    if responsible_id:
        query = query.filter(CommunityTicket.responsible_id == responsible_id)

    if creator_id:
        query = query.filter(CommunityTicket.creator_id == creator_id)

    if review_tag:
        query = query.filter(CommunityTicket.review_tag == review_tag)

    if keyword:
        query = query.filter(CommunityTicket.title.ilike(f"%{keyword}%"))

    if date_from:
        query = query.filter(CommunityTicket.created_at >= date_from)

    if date_to:
        query = query.filter(CommunityTicket.created_at <= date_to)

    total = query.count()

    items = (
        query.order_by(CommunityTicket.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return CommunityTicketListResponse(total=total, items=items)


@router.post("/", response_model=CommunityTicketResponse)
def create_ticket(
    ticket_data: CommunityTicketCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    ticket_no = ticket_data.ticket_no if ticket_data.ticket_no else generate_ticket_no()

    ticket = CommunityTicket(
        ticket_no=ticket_no,
        title=ticket_data.title,
        member_id=ticket_data.member_id,
        source=ticket_data.source,
        status=TicketStatus.DRAFT,
        creator_id=current_user_id,
        responsible_id=ticket_data.responsible_id,
        category=ticket_data.category,
        priority=ticket_data.priority,
        description=ticket_data.description,
        evidence_urls=ticket_data.evidence_urls,
    )
    db.add(ticket)
    db.flush()

    if ticket_data.benefit_ids:
        for benefit_id in ticket_data.benefit_ids:
            ref = TicketBenefitReference(
                ticket_id=ticket.id,
                benefit_id=benefit_id,
            )
            db.add(ref)

    db.commit()
    db.refresh(ticket)

    return get_ticket_with_relations(db, ticket.id)


@router.get("/{ticket_id}", response_model=CommunityTicketResponse)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    return get_ticket_with_relations(db, ticket_id)


@router.put("/{ticket_id}", response_model=CommunityTicketResponse)
def update_ticket(
    ticket_id: int,
    update_data: CommunityTicketUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    ticket = db.query(CommunityTicket).filter(CommunityTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="单据不存在")

    if ticket.status != TicketStatus.DRAFT:
        raise HTTPException(status_code=400, detail="只有草稿状态的单据可以编辑")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(ticket, key, value)

    create_audit_log(
        db=db,
        ticket_id=ticket.id,
        operator_id=current_user_id,
        action="EDIT",
        comment="更新单据基本信息",
    )

    db.commit()
    db.refresh(ticket)

    return get_ticket_with_relations(db, ticket.id)


@router.post("/{ticket_id}/status", response_model=CommunityTicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_data: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    ticket = db.query(CommunityTicket).filter(CommunityTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="单据不存在")

    if ticket.status == TicketStatus.CLOSED:
        raise HTTPException(status_code=400, detail="已关闭的单据不能变更状态")

    if status_data.new_status not in STATUS_TRANSITIONS.get(ticket.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"不合法的状态流转: {ticket.status.value} -> {status_data.new_status.value}",
        )

    old_status = ticket.status
    ticket.status = status_data.new_status

    if status_data.new_status == TicketStatus.SUPPLEMENT_NEEDED and status_data.supplement_requirements:
        ticket.supplement_requirements = status_data.supplement_requirements

    if status_data.new_status == TicketStatus.CLOSED:
        ticket.closed_at = datetime.utcnow()
        ticket.close_remark = status_data.close_remark

    action_map = {
        (TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW): "SUBMIT",
        (TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING): "START_REVIEW",
        (TicketStatus.REVIEWING, TicketStatus.SUPPLEMENT_NEEDED): "REQUEST_SUPPLEMENT",
        (TicketStatus.REVIEWING, TicketStatus.ESCALATED_REVIEW): "ESCALATE",
        (TicketStatus.REVIEWING, TicketStatus.PROCESSING): "APPROVE",
        (TicketStatus.SUPPLEMENT_NEEDED, TicketStatus.PENDING_REVIEW): "RESUBMIT",
        (TicketStatus.ESCALATED_REVIEW, TicketStatus.PROCESSING): "SENIOR_APPROVE",
        (TicketStatus.ESCALATED_REVIEW, TicketStatus.SUPPLEMENT_NEEDED): "SENIOR_REQUEST_SUPPLEMENT",
        (TicketStatus.PROCESSING, TicketStatus.COMPLETED): "COMPLETE",
    }
    action = "CLOSE" if status_data.new_status == TicketStatus.CLOSED else action_map.get((old_status, status_data.new_status), "STATUS_CHANGE")

    create_audit_log(
        db=db,
        ticket_id=ticket.id,
        operator_id=current_user_id,
        action=action,
        old_status=old_status,
        new_status=status_data.new_status,
        comment=status_data.comment,
        evidence_urls=status_data.evidence_urls,
    )

    db.commit()
    db.refresh(ticket)

    return get_ticket_with_relations(db, ticket.id)


@router.post("/{ticket_id}/review", response_model=CommunityTicketResponse)
def create_review_record(
    ticket_id: int,
    review_data: TicketReviewCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    ticket = db.query(CommunityTicket).filter(CommunityTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="单据不存在")

    if ticket.status == TicketStatus.CLOSED:
        raise HTTPException(status_code=400, detail="已关闭的单据不能创建复盘记录")

    max_round = (
        db.query(ReviewRecord)
        .filter(ReviewRecord.ticket_id == ticket_id)
        .count()
    )

    review_record = ReviewRecord(
        ticket_id=ticket_id,
        reviewer_id=current_user_id,
        round=max_round + 1,
        is_escalated=review_data.is_escalated,
        review_tag=review_data.review_tag,
        score=review_data.score,
        summary=review_data.summary,
        evidence_urls=review_data.evidence_urls,
        cited_transaction_ids=review_data.cited_transaction_ids,
        cited_benefit_ids=review_data.cited_benefit_ids,
        follow_up_actions=review_data.follow_up_actions,
    )
    db.add(review_record)
    db.flush()

    ticket.review_tag = review_data.review_tag
    ticket.review_score = review_data.score
    ticket.review_remark = review_data.summary

    old_status = ticket.status
    status_changed = False
    if review_data.is_escalated and ticket.status != TicketStatus.ESCALATED_REVIEW:
        ticket.status = TicketStatus.ESCALATED_REVIEW
        status_changed = True

    create_audit_log(
        db=db,
        ticket_id=ticket.id,
        operator_id=current_user_id,
        action="REVIEW" if not status_changed else "REVIEW_ESCALATE",
        old_status=old_status if status_changed else None,
        new_status=TicketStatus.ESCALATED_REVIEW if status_changed else None,
        comment=review_data.summary,
        evidence_urls=review_data.evidence_urls,
        reference_ids=[review_record.id],
    )

    db.commit()
    db.refresh(ticket)

    return get_ticket_with_relations(db, ticket.id)


@router.get("/{ticket_id}/audit-trail", response_model=List[AuditLogResponse])
def get_audit_trail(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    ticket = db.query(CommunityTicket).filter(CommunityTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="单据不存在")

    logs = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.operator))
        .filter(AuditLog.ticket_id == ticket_id)
        .order_by(AuditLog.created_at.asc())
        .all()
    )

    return logs
