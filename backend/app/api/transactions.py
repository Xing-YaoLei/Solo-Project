from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AccountTransaction, MemberProfile, CommunityTicket, MemberBenefitMapping, BenefitRule
from ..schemas.schemas import (
    AccountTransactionCreate,
    AccountTransactionResponse,
    AccountTransactionListResponse,
)
from ..enums import TransactionType

router = APIRouter(prefix="/api", tags=["transactions"])


@router.get("/transactions/", response_model=AccountTransactionListResponse)
def list_transactions(
    member_id: Optional[int] = Query(None, description="按会员ID过滤"),
    type: Optional[TransactionType] = Query(None, description="按流水类型过滤"),
    ticket_id: Optional[int] = Query(None, description="按单据ID过滤"),
    date_from: Optional[datetime] = Query(None, description="开始日期(含)"),
    date_to: Optional[datetime] = Query(None, description="结束日期(含)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
):
    query = db.query(AccountTransaction)

    if member_id:
        query = query.filter(AccountTransaction.member_id == member_id)
    if type:
        query = query.filter(AccountTransaction.type == type)
    if ticket_id:
        query = query.filter(AccountTransaction.ticket_id == ticket_id)
    if date_from:
        query = query.filter(AccountTransaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(AccountTransaction.transaction_date <= date_to)

    total = query.count()
    items = query.order_by(AccountTransaction.transaction_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return AccountTransactionListResponse(total=total, items=items)


@router.post("/transactions/", response_model=AccountTransactionResponse)
def create_transaction(transaction_in: AccountTransactionCreate, db: Session = Depends(get_db)):
    existing = db.query(AccountTransaction).filter(AccountTransaction.transaction_no == transaction_in.transaction_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"流水编号已存在: {transaction_in.transaction_no}")

    member = db.query(MemberProfile).filter(MemberProfile.id == transaction_in.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail=f"会员不存在: {transaction_in.member_id}")

    if transaction_in.ticket_id:
        ticket = db.query(CommunityTicket).filter(CommunityTicket.id == transaction_in.ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail=f"单据不存在: {transaction_in.ticket_id}")

    transaction = AccountTransaction(**transaction_in.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/transactions/{transaction_id}", response_model=AccountTransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(AccountTransaction).filter(AccountTransaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail=f"流水记录不存在: {transaction_id}")
    return transaction


@router.get("/transactions/by-member/{member_id}", response_model=List[AccountTransactionResponse])
def get_transactions_by_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(MemberProfile).filter(MemberProfile.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail=f"会员不存在: {member_id}")

    transactions = (
        db.query(AccountTransaction)
        .filter(AccountTransaction.member_id == member_id)
        .order_by(AccountTransaction.transaction_date.desc())
        .all()
    )
    return transactions


@router.get("/transactions/by-ticket/{ticket_id}", response_model=List[AccountTransactionResponse])
def get_transactions_by_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(CommunityTicket).filter(CommunityTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"单据不存在: {ticket_id}")

    transactions = (
        db.query(AccountTransaction)
        .filter(AccountTransaction.ticket_id == ticket_id)
        .order_by(AccountTransaction.transaction_date.desc())
        .all()
    )
    return transactions
