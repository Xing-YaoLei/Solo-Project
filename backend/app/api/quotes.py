import uuid
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.enums import ItemType, QuoteStatus, UserRole
from app.models.quote import Quote, QuoteItem
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.quote import (
    QuoteCreate,
    QuoteItemResponse,
    QuoteResponse,
    QuoteUpdate,
)

router = APIRouter(prefix="/quotes", tags=["报价管理"])


def _generate_quote_no() -> str:
    from datetime import datetime
    now = datetime.now()
    return f"QT{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


@router.get("", response_model=list[QuoteResponse])
async def list_quotes(
    work_order_id: Optional[UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Quote).options(selectinload(Quote.items))
    conditions = []

    if work_order_id:
        conditions.append(Quote.work_order_id == work_order_id)
    if status_filter:
        conditions.append(Quote.status == status_filter)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query.order_by(Quote.created_at.desc()))
    quotes = result.scalars().all()

    responses = []
    for q in quotes:
        resp = _build_quote_response(q)
        responses.append(resp)
    return responses


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    data: QuoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_result = await db.execute(select(WorkOrder).where(WorkOrder.id == data.work_order_id))
    if not order_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    total_amount = sum(item.quantity * item.unit_price for item in data.items)

    quote = Quote(
        id=uuid.uuid4(),
        quote_no=_generate_quote_no(),
        work_order_id=data.work_order_id,
        total_amount=total_amount,
        status=QuoteStatus.draft,
        notes=data.notes,
    )
    db.add(quote)
    await db.flush()

    for item_data in data.items:
        item = QuoteItem(
            id=uuid.uuid4(),
            quote_id=quote.id,
            item_type=item_data.item_type,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            amount=item_data.quantity * item_data.unit_price,
        )
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(Quote).options(selectinload(Quote.items)).where(Quote.id == quote.id)
    )
    return _build_quote_response(result.scalar_one())


@router.get("/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Quote).options(selectinload(Quote.items)).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报价单不存在")
    return _build_quote_response(quote)


@router.patch("/{quote_id}/status", response_model=QuoteResponse)
async def update_quote_status(
    quote_id: UUID,
    new_status: str = Query(..., alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager)),
):
    result = await db.execute(
        select(Quote).options(selectinload(Quote.items)).where(Quote.id == quote_id)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="报价单不存在")

    try:
        target_status = QuoteStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的状态值")

    if quote.status not in (QuoteStatus.submitted, QuoteStatus.draft, QuoteStatus.sent):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前状态不允许审批")

    if target_status not in (QuoteStatus.approved, QuoteStatus.rejected):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只能审批为 approved 或 rejected")

    quote.status = target_status
    await db.commit()

    result = await db.execute(
        select(Quote).options(selectinload(Quote.items)).where(Quote.id == quote_id)
    )
    return _build_quote_response(result.scalar_one())


def _build_quote_response(quote: Quote) -> QuoteResponse:
    resp = QuoteResponse.model_validate(quote)
    resp.items = [
        QuoteItemResponse(
            id=item.id,
            quote_id=item.quote_id,
            item_type=item.item_type.value if hasattr(item.item_type, "value") else str(item.item_type),
            description=item.description,
            quantity=item.quantity,
            unit_price=float(item.unit_price) if item.unit_price else 0.0,
            amount=float(item.amount) if item.amount else item.quantity * float(item.unit_price),
        )
        for item in quote.items
    ]
    return resp
