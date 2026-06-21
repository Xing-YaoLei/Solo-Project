import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user, require_roles
from ..models.payment import Payment, PaymentStatus
from ..models.quote import Quote, QuoteStatus
from ..models.user import User, UserRole
from ..schemas.payment import (
    PaymentConfirm,
    PaymentCreate,
    PaymentResponse,
    PaymentUpdate,
)
from ..schemas.base import PaginatedResponse, SuccessResponse

router = APIRouter()


def generate_payment_no() -> str:
    today = datetime.now().strftime("%Y%m%d")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"PAY{today}{suffix}"


@router.get("", response_model=PaginatedResponse[PaymentResponse])
async def list_payments(
    quote_id: Optional[str] = None,
    status: Optional[PaymentStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Payment)

    if quote_id:
        stmt = stmt.where(Payment.quote_id == quote_id)
    if status:
        stmt = stmt.where(Payment.status == status)
    if start_date:
        stmt = stmt.where(Payment.payment_date >= start_date)
    if end_date:
        stmt = stmt.where(Payment.payment_date <= end_date)
    if keyword:
        stmt = stmt.where(
            (Payment.payment_no.ilike(f"%{keyword}%"))
            | (Payment.payer_name.ilike(f"%{keyword}%"))
            | (Payment.transaction_id.ilike(f"%{keyword}%"))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(Payment.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    payments = result.scalars().all()

    enriched = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        if p.operator_id:
            op = await db.get(User, p.operator_id)
            resp.operator_name = op.full_name if op else None
        quote = await db.get(Quote, p.quote_id)
        if quote:
            resp.quote_title = quote.title
            resp.client_name = quote.client_name
        enriched.append(resp)

    return PaginatedResponse(
        items=enriched,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=PaymentResponse)
async def create_payment(
    req: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote = await db.get(Quote, req.quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    payment = Payment(
        quote_id=req.quote_id,
        payment_no=generate_payment_no(),
        amount=req.amount,
        currency=req.currency,
        method=req.method,
        status=PaymentStatus.PENDING,
        payment_date=req.payment_date,
        transaction_id=req.transaction_id,
        bank_name=req.bank_name,
        bank_account=req.bank_account,
        payer_name=req.payer_name,
        remarks=req.remarks,
        operator_id=current_user.id,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(payment)

    quote.status = QuoteStatus.IN_PAYMENT
    quote.updated_by = current_user.id
    quote.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(payment)

    resp = PaymentResponse.model_validate(payment)
    resp.operator_name = current_user.full_name
    resp.quote_title = quote.title
    resp.client_name = quote.client_name
    return resp


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="支付流水不存在")

    resp = PaymentResponse.model_validate(payment)
    if payment.operator_id:
        op = await db.get(User, payment.operator_id)
        resp.operator_name = op.full_name if op else None
    quote = await db.get(Quote, payment.quote_id)
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    req: PaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="支付流水不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    payment.updated_by = current_user.id
    payment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(payment)

    resp = PaymentResponse.model_validate(payment)
    if payment.operator_id:
        op = await db.get(User, payment.operator_id)
        resp.operator_name = op.full_name if op else None
    quote = await db.get(Quote, payment.quote_id)
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.post("/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_id: str,
    req: PaymentConfirm,
    current_user: User = Depends(require_roles(UserRole.PARTNER, UserRole.ASSISTANT)),
    db: AsyncSession = Depends(get_db),
):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="支付流水不存在")

    payment.status = PaymentStatus.CONFIRMED
    payment.confirmed_at = datetime.utcnow()
    payment.updated_by = current_user.id
    payment.updated_at = datetime.utcnow()

    quote = await db.get(Quote, payment.quote_id)
    if quote:
        quote.paid_amount = float(quote.paid_amount) + float(payment.amount)
        if quote.paid_amount >= float(quote.discounted_amount) - 0.01:
            quote.status = QuoteStatus.PAID
            quote.actual_payment_date = datetime.utcnow().date()
        else:
            quote.status = QuoteStatus.PARTIALLY_PAID
        quote.updated_by = current_user.id
        quote.updated_at = datetime.utcnow()

        if float(quote.paid_amount) != float(quote.discounted_amount) and abs(
            float(quote.paid_amount) - float(quote.discounted_amount)
        ) > 0.01:
            quote.status = QuoteStatus.EXCEPTION

    await db.commit()
    await db.refresh(payment)

    resp = PaymentResponse.model_validate(payment)
    resp.operator_name = current_user.full_name
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.delete("/{payment_id}", response_model=SuccessResponse)
async def delete_payment(
    payment_id: str,
    current_user: User = Depends(require_roles(UserRole.PARTNER, UserRole.ASSISTANT)),
    db: AsyncSession = Depends(get_db),
):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="支付流水不存在")
    await db.delete(payment)
    await db.commit()
    return SuccessResponse(message="删除成功")
