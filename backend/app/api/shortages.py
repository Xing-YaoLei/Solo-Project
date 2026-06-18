import uuid
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.enums import ShortageStatus, UserRole
from app.models.shortage import ShortageRecord
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.shortage import ShortageRecordCreate, ShortageRecordResponse, ShortageRecordUpdate

router = APIRouter(prefix="/shortages", tags=["缺件管理"])


@router.get("", response_model=list[ShortageRecordResponse])
async def list_shortages(
    status_filter: Optional[str] = Query(None, alias="status"),
    work_order_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(ShortageRecord)
    conditions = []

    if status_filter:
        conditions.append(ShortageRecord.status == status_filter)
    if work_order_id:
        conditions.append(ShortageRecord.work_order_id == work_order_id)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query.order_by(ShortageRecord.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=ShortageRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_shortage(
    data: ShortageRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_result = await db.execute(select(WorkOrder).where(WorkOrder.id == data.work_order_id))
    if not order_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    record = ShortageRecord(
        id=uuid.uuid4(),
        status=ShortageStatus.pending,
        **data.model_dump(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{shortage_id}", response_model=ShortageRecordResponse)
async def get_shortage(
    shortage_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ShortageRecord).where(ShortageRecord.id == shortage_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="缺件记录不存在")
    return record


@router.patch("/{shortage_id}", response_model=ShortageRecordResponse)
async def update_shortage(
    shortage_id: UUID,
    data: ShortageRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.parts_staff, UserRole.manager)),
):
    result = await db.execute(select(ShortageRecord).where(ShortageRecord.id == shortage_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="缺件记录不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    await db.commit()
    await db.refresh(record)
    return record
