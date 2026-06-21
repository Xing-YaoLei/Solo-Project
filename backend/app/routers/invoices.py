from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.invoice import InvoiceItem
from ..models.quote import Quote
from ..models.user import User
from ..schemas.quote import (
    InvoiceItemCreate,
    InvoiceItemResponse,
    InvoiceItemUpdate,
)
from ..schemas.base import PaginatedResponse, SuccessResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[InvoiceItemResponse])
async def list_invoice_items(
    quote_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(InvoiceItem)
    if quote_id:
        stmt = stmt.where(InvoiceItem.quote_id == quote_id)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(InvoiceItem.sort_order, InvoiceItem.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    items = result.scalars().all()

    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=InvoiceItemResponse)
async def create_invoice_item(
    quote_id: str,
    req: InvoiceItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    item = InvoiceItem(
        quote_id=quote_id,
        item_name=req.item_name,
        fee_type=req.fee_type,
        description=req.description,
        quantity=req.quantity,
        unit_price=req.unit_price,
        discount_rate=req.discount_rate,
        amount=req.amount,
        actual_amount=req.actual_amount,
        sort_order=req.sort_order,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/batch", response_model=SuccessResponse)
async def batch_create_invoice_items(
    quote_id: str,
    items: List[InvoiceItemCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote = await db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    for idx, req in enumerate(items):
        item = InvoiceItem(
            quote_id=quote_id,
            item_name=req.item_name,
            fee_type=req.fee_type,
            description=req.description,
            quantity=req.quantity,
            unit_price=req.unit_price,
            discount_rate=req.discount_rate,
            amount=req.amount,
            actual_amount=req.actual_amount,
            sort_order=idx,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(item)

    await db.commit()
    return SuccessResponse(message=f"批量添加成功，共 {len(items)} 条")


@router.put("/{item_id}", response_model=InvoiceItemResponse)
async def update_invoice_item(
    item_id: str,
    req: InvoiceItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(InvoiceItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="明细不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    item.updated_by = current_user.id
    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", response_model=SuccessResponse)
async def delete_invoice_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(InvoiceItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="明细不存在")
    await db.delete(item)
    await db.commit()
    return SuccessResponse(message="删除成功")


@router.post("/batch/delete", response_model=SuccessResponse)
async def batch_delete_invoice_items(
    item_ids: List[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(InvoiceItem).where(InvoiceItem.id.in_(item_ids)))
    items = result.scalars().all()
    for item in items:
        await db.delete(item)
    await db.commit()
    return SuccessResponse(message=f"批量删除成功，共 {len(items)} 条")
