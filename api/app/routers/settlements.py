import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Order, SettlementBatch, SettlementDetail
from app.schemas import SettlementBatchResponse, SettlementDetailResponse

router = APIRouter(prefix="/api/settlements", tags=["settlements"])


@router.get("/batches", response_model=dict)
async def list_batches(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SettlementBatch)
    if status:
        stmt = stmt.where(SettlementBatch.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(SettlementBatch.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [SettlementBatchResponse.model_validate(b).model_dump() for b in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/batches/{batch_id}", response_model=dict)
async def get_batch(batch_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SettlementBatch)
        .options(selectinload(SettlementBatch.details))
        .where(SettlementBatch.id == batch_id)
    )
    result = await db.execute(stmt)
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="SettlementBatch not found")

    batch_data = SettlementBatchResponse.model_validate(batch).model_dump()
    batch_data["details"] = [SettlementDetailResponse.model_validate(d).model_dump() for d in batch.details]
    return batch_data


@router.post("/batches", response_model=SettlementBatchResponse, status_code=201)
async def create_batch(
    period_start: date,
    period_end: date,
    created_by: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    batch_no = f"SB-{period_start.strftime('%Y%m%d')}-{period_end.strftime('%Y%m%d')}"

    stmt = select(Order).where(
        Order.status == "completed",
        Order.completed_at >= period_start,
        Order.completed_at <= period_end,
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()

    batch = SettlementBatch(
        batch_no=batch_no,
        period_start=period_start,
        period_end=period_end,
        status="draft",
        total_amount=Decimal("0"),
        total_count=len(orders),
        created_by=created_by,
    )
    db.add(batch)
    await db.flush()

    total_amount = Decimal("0")
    for order in orders:
        detail = SettlementDetail(
            batch_id=batch.id,
            order_id=order.id,
            rider_id=order.rider_id,
            subsidy_amount=order.subsidy_amount,
            compensation_amount=Decimal("0"),
            total_amount=order.subsidy_amount,
            status="pending",
        )
        db.add(detail)
        total_amount += order.subsidy_amount

    batch.total_amount = total_amount
    await db.flush()
    await db.refresh(batch)
    return batch


@router.post("/batches/{batch_id}/review", response_model=SettlementBatchResponse)
async def review_batch(
    batch_id: uuid.UUID,
    reviewer_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SettlementBatch).where(SettlementBatch.id == batch_id)
    result = await db.execute(stmt)
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="SettlementBatch not found")
    if batch.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft batches can be reviewed")
    batch.status = "pending_review"
    if reviewer_id:
        batch.reviewed_by = reviewer_id
    await db.flush()
    await db.refresh(batch)
    return batch


@router.post("/batches/{batch_id}/approve", response_model=SettlementBatchResponse)
async def approve_batch(
    batch_id: uuid.UUID,
    approver_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SettlementBatch).where(SettlementBatch.id == batch_id)
    result = await db.execute(stmt)
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="SettlementBatch not found")
    if batch.status != "pending_review":
        raise HTTPException(status_code=400, detail="Only pending_review batches can be approved")
    batch.status = "approved"
    if approver_id:
        batch.approved_by = approver_id
    await db.flush()
    await db.refresh(batch)
    return batch


@router.get("/details", response_model=dict)
async def list_details(
    batch_id: Optional[uuid.UUID] = None,
    rider_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(SettlementDetail)
    if batch_id:
        stmt = stmt.where(SettlementDetail.batch_id == batch_id)
    if rider_id:
        stmt = stmt.where(SettlementDetail.rider_id == rider_id)
    if status:
        stmt = stmt.where(SettlementDetail.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(SettlementDetail.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [SettlementDetailResponse.model_validate(d).model_dump() for d in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/details/{detail_id}", response_model=SettlementDetailResponse)
async def get_detail(detail_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(SettlementDetail).where(SettlementDetail.id == detail_id)
    result = await db.execute(stmt)
    detail = result.scalar_one_or_none()
    if not detail:
        raise HTTPException(status_code=404, detail="SettlementDetail not found")
    return detail
