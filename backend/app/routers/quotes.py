import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..database import get_db
from ..dependencies.auth import get_current_user, require_roles
from ..models.quote import Quote, QuoteStatus
from ..models.user import User, UserRole
from ..models.invoice import InvoiceItem
from ..schemas.quote import (
    BatchStatusUpdate,
    QuoteCreate,
    QuoteDetailResponse,
    QuoteResponse,
    QuoteStatusUpdate,
    QuoteUpdate,
)
from ..schemas.base import PaginatedResponse, SuccessResponse

router = APIRouter()


def generate_quote_no() -> str:
    today = datetime.now().strftime("%Y%m%d")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"QF{today}{suffix}"


@router.post("", response_model=QuoteDetailResponse)
async def create_quote(
    req: QuoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote = Quote(
        quote_no=generate_quote_no(),
        title=req.title,
        client_name=req.client_name,
        client_contact=req.client_contact,
        client_phone=req.client_phone,
        case_description=req.case_description,
        case_type=req.case_type,
        total_amount=req.total_amount,
        discounted_amount=req.discounted_amount,
        currency=req.currency,
        priority=req.priority,
        assigned_to=req.assigned_to,
        expected_payment_date=req.expected_payment_date,
        payment_deadline=req.payment_deadline,
        remarks=req.remarks,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(quote)
    await db.flush()

    for idx, item in enumerate(req.invoice_items):
        invoice_item = InvoiceItem(
            quote_id=quote.id,
            item_name=item.item_name,
            fee_type=item.fee_type,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount_rate=item.discount_rate,
            amount=item.amount,
            actual_amount=item.actual_amount,
            sort_order=idx,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(invoice_item)

    await db.commit()
    await db.refresh(quote)
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == quote.id)
    )
    quote = result.scalar_one()
    return _enrich_quote_detail(quote)


@router.get("", response_model=PaginatedResponse[QuoteResponse])
async def list_quotes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[QuoteStatus] = None,
    keyword: Optional[str] = None,
    assigned_to: Optional[str] = None,
    client_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Quote)

    if current_user.role == UserRole.CLIENT:
        stmt = stmt.where(Quote.client_name.ilike(f"%{current_user.full_name}%"))
    elif current_user.role in (UserRole.LAWYER, UserRole.ASSISTANT):
        stmt = stmt.where(
            (Quote.created_by == current_user.id) | (Quote.assigned_to == current_user.id)
        )

    if status:
        stmt = stmt.where(Quote.status == status)
    if assigned_to:
        stmt = stmt.where(Quote.assigned_to == assigned_to)
    if client_name:
        stmt = stmt.where(Quote.client_name.ilike(f"%{client_name}%"))
    if keyword:
        stmt = stmt.where(
            (Quote.quote_no.ilike(f"%{keyword}%"))
            | (Quote.title.ilike(f"%{keyword}%"))
            | (Quote.client_name.ilike(f"%{keyword}%"))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(Quote.created_at.desc()).offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    quotes = result.scalars().all()

    enriched = [await _enrich_quote(q, db) for q in quotes]

    return PaginatedResponse(
        items=enriched,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{quote_id}", response_model=QuoteDetailResponse)
async def get_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    return _enrich_quote_detail(quote)


@router.put("/{quote_id}", response_model=QuoteDetailResponse)
async def update_quote(
    quote_id: str,
    req: QuoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    update_data = req.model_dump(exclude_unset=True, exclude={"invoice_items"})
    for field, value in update_data.items():
        setattr(quote, field, value)
    quote.updated_by = current_user.id
    quote.updated_at = datetime.utcnow()

    if req.invoice_items is not None:
        existing_items = {item.id: item for item in quote.invoice_items}
        seen_ids = set()

        for idx, item_data in enumerate(req.invoice_items):
            item_dict = item_data.model_dump(exclude_unset=True)
            destroy = item_dict.pop("_destroy", False)
            item_id = item_dict.pop("id", None)

            if item_id and item_id in existing_items:
                item = existing_items[item_id]
                if destroy:
                    await db.delete(item)
                else:
                    for field, value in item_dict.items():
                        if value is not None:
                            setattr(item, field, value)
                    item.sort_order = idx
                    item.updated_by = current_user.id
                    item.updated_at = datetime.utcnow()
                seen_ids.add(item_id)
            elif not destroy and item_id is None:
                new_item = InvoiceItem(
                    quote_id=quote.id,
                    item_name=item_dict.get("item_name", ""),
                    fee_type=item_dict.get("fee_type", "other"),
                    description=item_dict.get("description"),
                    quantity=item_dict.get("quantity", 1.0),
                    unit_price=item_dict.get("unit_price", 0.0),
                    discount_rate=item_dict.get("discount_rate", 100.0),
                    amount=item_dict.get("amount", 0.0),
                    actual_amount=item_dict.get("actual_amount", 0.0),
                    sort_order=idx,
                    created_by=current_user.id,
                    updated_by=current_user.id,
                )
                db.add(new_item)

        for old_id, old_item in existing_items.items():
            if old_id not in seen_ids:
                await db.delete(old_item)

    await db.commit()
    await db.refresh(quote)

    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one()
    return _enrich_quote_detail(quote)


@router.patch("/{quote_id}/status", response_model=QuoteDetailResponse)
async def update_quote_status(
    quote_id: str,
    req: QuoteStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    quote.status = req.status
    quote.updated_by = current_user.id
    quote.updated_at = datetime.utcnow()

    if req.status == QuoteStatus.PAID and quote.actual_payment_date is None:
        quote.actual_payment_date = datetime.utcnow().date()

    await db.commit()
    await db.refresh(quote)
    return _enrich_quote_detail(quote)


@router.post("/batch/status", response_model=SuccessResponse)
async def batch_update_status(
    req: BatchStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Quote).where(Quote.id.in_(req.quote_ids)))
    quotes = result.scalars().all()

    for quote in quotes:
        quote.status = req.status
        quote.updated_by = current_user.id
        quote.updated_at = datetime.utcnow()
        if req.status == QuoteStatus.PAID and quote.actual_payment_date is None:
            quote.actual_payment_date = datetime.utcnow().date()

    await db.commit()
    return SuccessResponse(message=f"批量更新成功，共 {len(quotes)} 条")


@router.delete("/{quote_id}", response_model=SuccessResponse)
async def delete_quote(
    quote_id: str,
    current_user: User = Depends(require_roles(UserRole.PARTNER, UserRole.ASSISTANT)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    await db.delete(quote)
    await db.commit()
    return SuccessResponse(message="删除成功")


async def _enrich_quote(quote: Quote, db: AsyncSession) -> QuoteResponse:
    creator_name = None
    assignee_name = None
    if quote.created_by:
        creator = await db.get(User, quote.created_by)
        if creator:
            creator_name = creator.full_name
    if quote.assigned_to:
        assignee = await db.get(User, quote.assigned_to)
        if assignee:
            assignee_name = assignee.full_name

    data = QuoteResponse.model_validate(quote)
    data.creator_name = creator_name
    data.assignee_name = assignee_name
    return data


def _enrich_quote_detail(quote: Quote) -> QuoteDetailResponse:
    return QuoteDetailResponse(
        id=quote.id,
        created_at=quote.created_at,
        updated_at=quote.updated_at,
        created_by=quote.created_by,
        updated_by=quote.updated_by,
        quote_no=quote.quote_no,
        title=quote.title,
        client_name=quote.client_name,
        client_contact=quote.client_contact,
        client_phone=quote.client_phone,
        case_description=quote.case_description,
        case_type=quote.case_type,
        total_amount=float(quote.total_amount),
        discounted_amount=float(quote.discounted_amount),
        paid_amount=float(quote.paid_amount),
        currency=quote.currency,
        status=quote.status,
        priority=quote.priority,
        assigned_to=quote.assigned_to,
        expected_payment_date=quote.expected_payment_date,
        actual_payment_date=quote.actual_payment_date,
        payment_deadline=quote.payment_deadline,
        remarks=quote.remarks,
        invoice_items=quote.invoice_items,
    )
