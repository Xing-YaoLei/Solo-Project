from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.exception import ExceptionHistory, ExceptionRecord, ExceptionStatus, ExceptionType
from ..models.quote import Quote, QuoteStatus
from ..models.user import User
from ..schemas.exception import (
    ExceptionCreate,
    ExceptionHistoryResponse,
    ExceptionResponse,
    ExceptionStatusUpdate,
    ExceptionUpdate,
)
from ..schemas.base import PaginatedResponse, SuccessResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ExceptionResponse])
async def list_exceptions(
    quote_id: Optional[str] = None,
    exception_type: Optional[ExceptionType] = None,
    status: Optional[ExceptionStatus] = None,
    handled_by: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ExceptionRecord)

    if quote_id:
        stmt = stmt.where(ExceptionRecord.quote_id == quote_id)
    if exception_type:
        stmt = stmt.where(ExceptionRecord.exception_type == exception_type)
    if status:
        stmt = stmt.where(ExceptionRecord.status == status)
    if handled_by:
        stmt = stmt.where(ExceptionRecord.handled_by == handled_by)
    if keyword:
        stmt = stmt.where(
            (ExceptionRecord.title.ilike(f"%{keyword}%"))
            | (ExceptionRecord.description.ilike(f"%{keyword}%"))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    stmt = stmt.order_by(ExceptionRecord.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(stmt)
    records = result.scalars().all()

    enriched = []
    for rec in records:
        resp = ExceptionResponse.model_validate(rec)
        if rec.handled_by:
            handler = await db.get(User, rec.handled_by)
            resp.handler_name = handler.full_name if handler else None
        quote = await db.get(Quote, rec.quote_id)
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


@router.post("", response_model=ExceptionResponse)
async def create_exception(
    req: ExceptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quote = await db.get(Quote, req.quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")

    record = ExceptionRecord(
        quote_id=req.quote_id,
        title=req.title,
        exception_type=req.exception_type,
        description=req.description,
        source_ref=req.source_ref,
        expected_amount=req.expected_amount,
        actual_amount=req.actual_amount,
        difference_amount=req.difference_amount,
        status=ExceptionStatus.OPEN,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(record)

    quote.status = QuoteStatus.EXCEPTION
    quote.updated_by = current_user.id
    quote.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    history = ExceptionHistory(
        exception_id=record.id,
        action="create",
        to_status=ExceptionStatus.OPEN.value,
        comment=f"创建异常记录: {req.title}",
        operator_id=current_user.id,
        source_record=req.source_ref,
    )
    db.add(history)
    await db.commit()

    resp = ExceptionResponse.model_validate(record)
    resp.quote_title = quote.title
    resp.client_name = quote.client_name
    return resp


@router.get("/{exception_id}", response_model=ExceptionResponse)
async def get_exception(
    exception_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(ExceptionRecord, exception_id)
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    resp = ExceptionResponse.model_validate(record)
    if record.handled_by:
        handler = await db.get(User, record.handled_by)
        resp.handler_name = handler.full_name if handler else None
    quote = await db.get(Quote, record.quote_id)
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.put("/{exception_id}", response_model=ExceptionResponse)
async def update_exception(
    exception_id: str,
    req: ExceptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(ExceptionRecord, exception_id)
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    old_status = record.status
    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    if req.status == ExceptionStatus.RESOLVED and not record.resolved_at:
        record.resolved_at = datetime.utcnow()

    record.updated_by = current_user.id
    record.updated_at = datetime.utcnow()

    if old_status != record.status:
        history = ExceptionHistory(
            exception_id=record.id,
            action="status_change",
            from_status=old_status.value,
            to_status=record.status.value,
            comment=req.resolution or f"状态从 {old_status.value} 变更为 {record.status.value}",
            operator_id=current_user.id,
        )
        db.add(history)

        if record.status in (ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED):
            quote = await db.get(Quote, record.quote_id)
            if quote:
                quote.status = QuoteStatus.CLOSED if record.status == ExceptionStatus.CLOSED else QuoteStatus.APPROVED
                quote.updated_by = current_user.id
                quote.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    resp = ExceptionResponse.model_validate(record)
    if record.handled_by:
        handler = await db.get(User, record.handled_by)
        resp.handler_name = handler.full_name if handler else None
    quote = await db.get(Quote, record.quote_id)
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.post("/{exception_id}/status", response_model=ExceptionResponse)
async def update_exception_status(
    exception_id: str,
    req: ExceptionStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(ExceptionRecord, exception_id)
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")

    old_status = record.status
    record.status = req.status
    record.handled_by = current_user.id
    record.updated_by = current_user.id
    record.updated_at = datetime.utcnow()

    if req.status in (ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED):
        record.resolved_at = datetime.utcnow()
        record.resolution = req.comment

    history = ExceptionHistory(
        exception_id=record.id,
        action="status_change",
        from_status=old_status.value,
        to_status=req.status.value,
        comment=req.comment,
        operator_id=current_user.id,
        source_record=req.source_record,
    )
    db.add(history)

    if req.status in (ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED):
        quote = await db.get(Quote, record.quote_id)
        if quote:
            quote.status = QuoteStatus.CLOSED if req.status == ExceptionStatus.CLOSED else QuoteStatus.APPROVED
            quote.updated_by = current_user.id
            quote.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(record)

    resp = ExceptionResponse.model_validate(record)
    resp.handler_name = current_user.full_name
    quote = await db.get(Quote, record.quote_id)
    if quote:
        resp.quote_title = quote.title
        resp.client_name = quote.client_name
    return resp


@router.get("/{exception_id}/history", response_model=list[ExceptionHistoryResponse])
async def get_exception_history(
    exception_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExceptionHistory)
        .where(ExceptionHistory.exception_id == exception_id)
        .order_by(ExceptionHistory.created_at.asc())
    )
    history_list = result.scalars().all()

    enriched = []
    for h in history_list:
        resp = ExceptionHistoryResponse.model_validate(h)
        if h.operator_id:
            op = await db.get(User, h.operator_id)
            resp.operator_name = op.full_name if op else None
        enriched.append(resp)
    return enriched


@router.delete("/{exception_id}", response_model=SuccessResponse)
async def delete_exception(
    exception_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(ExceptionRecord, exception_id)
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    await db.delete(record)
    await db.commit()
    return SuccessResponse(message="删除成功")
