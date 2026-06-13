from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.database import get_db
from ..models.member import Member
from ..models.membership import Membership
from ..models.course import Course
from ..models.transaction import Transaction
from ..models.refund import Refund
from ..models.access_record import AccessRecord
from ..models.renewal_note import RenewalNote

router = APIRouter(prefix="/api/members", tags=["会员管理"])


@router.get("")
def list_members(
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    status: Optional[str] = Query(None, description="会员状态"),
    level: Optional[str] = Query(None, description="会员等级"),
    coach_id: Optional[int] = Query(None, description="教练ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Member)

    if keyword:
        query = query.filter(
            (Member.name.like(f"%{keyword}%")) |
            (Member.phone.like(f"%{keyword}%")) |
            (Member.member_no.like(f"%{keyword}%"))
        )
    if status:
        query = query.filter(Member.status == status)
    if level:
        query = query.filter(Member.level == level)
    if coach_id:
        query = query.filter(Member.coach_id == coach_id)

    total = query.count()
    members = query.order_by(Member.id.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": members}


@router.get("/{member_id}")
def get_member_detail(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    memberships = db.query(Membership).filter(
        Membership.member_id == member_id
    ).order_by(Membership.end_date.desc()).all()

    return {
        "member": member,
        "memberships": memberships
    }


@router.get("/{member_id}/courses")
def get_member_courses(
    member_id: int,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    query = db.query(Course).filter(Course.member_id == member_id)
    if status:
        query = query.filter(Course.status == status)

    total = query.count()
    courses = query.order_by(Course.course_date.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": courses}


@router.get("/{member_id}/transactions")
def get_member_transactions(
    member_id: int,
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    query = db.query(Transaction).filter(Transaction.member_id == member_id)
    if type:
        query = query.filter(Transaction.type == type)

    total = query.count()
    transactions = query.order_by(Transaction.transaction_date.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": transactions}


@router.get("/{member_id}/refunds")
def get_member_refunds(
    member_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    query = db.query(Refund).filter(Refund.member_id == member_id)
    total = query.count()
    refunds = query.order_by(Refund.apply_date.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": refunds}


@router.get("/{member_id}/access-records")
def get_member_access_records(
    member_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    query = db.query(AccessRecord).filter(AccessRecord.member_id == member_id)
    if start_date:
        query = query.filter(AccessRecord.access_date >= start_date)
    if end_date:
        query = query.filter(AccessRecord.access_date <= end_date)

    total = query.count()
    records = query.order_by(AccessRecord.access_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": records}


@router.get("/{member_id}/renewal-notes")
def get_member_renewal_notes(
    member_id: int,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    query = db.query(RenewalNote).filter(RenewalNote.member_id == member_id)
    if status:
        query = query.filter(RenewalNote.status == status)

    total = query.count()
    notes = query.order_by(RenewalNote.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return {"total": total, "page": page, "page_size": page_size, "items": notes}
