from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, cast, Date, extract, func, Integer, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user, require_roles
from ..models.exception import ExceptionRecord, ExceptionStatus, ExceptionType
from ..models.payment import Payment, PaymentStatus
from ..models.quote import Quote, QuoteStatus
from ..models.user import User, UserRole
from ..schemas.quote import QuoteResponse

router = APIRouter()


@router.get("/overview")
async def get_overview(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote_base = select(Quote)
    payment_base = select(Payment).where(Payment.status == PaymentStatus.CONFIRMED)

    if start_date:
        quote_base = quote_base.where(Quote.created_at >= start_date)
        payment_base = payment_base.where(Payment.payment_date >= start_date)
    if end_date:
        quote_base = quote_base.where(Quote.created_at <= end_date)
        payment_base = payment_base.where(Payment.payment_date <= end_date)

    total_quotes = (await db.execute(select(func.count()).select_from(quote_base.subquery()))).scalar_one()
    total_amount_q = select(func.coalesce(func.sum(Quote.discounted_amount), 0)).select_from(quote_base.subquery())
    total_amount = (await db.execute(total_amount_q)).scalar_one() or 0

    paid_q = select(func.coalesce(func.sum(Payment.amount), 0)).select_from(payment_base.subquery())
    total_paid = (await db.execute(paid_q)).scalar_one() or 0

    pending_q = select(func.count()).select_from(
        quote_base.where(Quote.status.in_([
            QuoteStatus.PENDING_REVIEW, QuoteStatus.APPROVING, QuoteStatus.SENT
        ])).subquery()
    )
    pending_count = (await db.execute(pending_q)).scalar_one()

    exception_q = select(func.count()).select_from(
        select(ExceptionRecord).where(ExceptionRecord.status.in_([
            ExceptionStatus.OPEN, ExceptionStatus.INVESTIGATING, ExceptionStatus.RESOLVING
        ])).subquery()
    )
    exception_count = (await db.execute(exception_q)).scalar_one()

    return {
        "total_quotes": total_quotes,
        "total_amount": float(total_amount),
        "total_paid": float(total_paid),
        "pending_count": pending_count,
        "exception_count": exception_count,
        "unpaid_amount": float(total_amount) - float(total_paid),
    }


@router.get("/quote-status-distribution")
async def get_quote_status_distribution(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quote.status, func.count(Quote.id)).group_by(Quote.status)
    if start_date:
        stmt = stmt.where(Quote.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Quote.created_at <= end_date)

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {"status": status.value, "count": count, "label": _status_label(status)}
        for status, count in rows
    ]


@router.get("/payment-collection-cycle")
async def get_payment_collection_cycle(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quote).where(
        Quote.actual_payment_date.isnot(None),
        Quote.created_at.isnot(None),
    )
    if start_date:
        stmt = stmt.where(Quote.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Quote.created_at <= end_date)

    result = await db.execute(stmt)
    quotes = result.scalars().all()

    cycles = []
    for q in quotes:
        if q.created_at and q.actual_payment_date:
            delta = (q.actual_payment_date - q.created_at.date()).days
            cycles.append({
                "quote_id": q.id,
                "quote_no": q.quote_no,
                "title": q.title,
                "client_name": q.client_name,
                "amount": float(q.discounted_amount),
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "actual_payment_date": q.actual_payment_date.isoformat() if q.actual_payment_date else None,
                "cycle_days": delta,
            })

    avg_cycle = sum(c["cycle_days"] for c in cycles) / len(cycles) if cycles else 0

    return {
        "avg_cycle_days": round(avg_cycle, 1),
        "total_records": len(cycles),
        "records": cycles,
    }


@router.get("/monthly-revenue")
async def get_monthly_revenue(
    months: int = Query(12, ge=1, le=36),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            extract("year", Payment.payment_date).label("year"),
            extract("month", Payment.payment_date).label("month"),
            func.coalesce(func.sum(Payment.amount), 0).label("amount"),
            func.count(Payment.id).label("count"),
        )
        .where(
            Payment.status == PaymentStatus.CONFIRMED,
            Payment.payment_date.isnot(None),
        )
        .group_by("year", "month")
        .order_by("year", "month")
    )
    result = await db.execute(stmt)
    rows = result.all()

    data = {}
    for year, month, amount, count in rows:
        key = f"{int(year):04d}-{int(month):02d}"
        data[key] = {"amount": float(amount), "count": count}

    today = datetime.now()
    result_list = []
    for i in range(months - 1, -1, -1):
        d = today - timedelta(days=i * 30)
        key = f"{d.year:04d}-{d.month:02d}"
        entry = data.get(key, {"amount": 0.0, "count": 0})
        result_list.append({
            "month": key,
            "amount": entry["amount"],
            "count": entry["count"],
        })

    return result_list


@router.get("/exception-types")
async def get_exception_types(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ExceptionRecord.exception_type, func.count()).group_by(ExceptionRecord.exception_type)
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {"type": t.value, "count": c, "label": _exception_type_label(t)}
        for t, c in rows
    ]


@router.get("/quotes-by-cycle")
async def get_quotes_by_cycle_range(
    min_days: int = 0,
    max_days: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quote).where(
        Quote.actual_payment_date.isnot(None),
    )
    result = await db.execute(stmt)
    quotes = result.scalars().all()

    filtered = []
    for q in quotes:
        if q.created_at and q.actual_payment_date:
            delta = (q.actual_payment_date - q.created_at.date()).days
            if delta >= min_days and (max_days is None or delta <= max_days):
                filtered.append(QuoteResponse.model_validate(q))

    return filtered


def _status_label(status: QuoteStatus) -> str:
    mapping = {
        QuoteStatus.DRAFT: "草稿",
        QuoteStatus.PENDING_REVIEW: "待审核",
        QuoteStatus.APPROVING: "审批中",
        QuoteStatus.APPROVED: "已批准",
        QuoteStatus.REJECTED: "已驳回",
        QuoteStatus.SENT: "已发送",
        QuoteStatus.CONFIRMED: "已确认",
        QuoteStatus.IN_PAYMENT: "付款中",
        QuoteStatus.PARTIALLY_PAID: "部分付款",
        QuoteStatus.PAID: "已付款",
        QuoteStatus.CLOSED: "已关闭",
        QuoteStatus.EXCEPTION: "异常",
    }
    return mapping.get(status, status.value)


def _exception_type_label(t: ExceptionType) -> str:
    mapping = {
        ExceptionType.AMOUNT_MISMATCH: "金额不一致",
        ExceptionType.APPROVAL_ABNORMAL: "审批异常",
        ExceptionType.PAYMENT_DELAY: "付款延迟",
        ExceptionType.DOCUMENT_MISSING: "单据缺失",
        ExceptionType.CLIENT_DISPUTE: "客户争议",
        ExceptionType.OTHER: "其他",
    }
    return mapping.get(t, t.value)
