import uuid
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.enums import PartStatus, UserRole
from app.models.part import Part, WorkOrderPart
from app.models.user import User
from app.models.work_order import WorkOrder
from app.schemas.part import (
    PartCreate,
    PartResponse,
    PartUpdate,
    WorkOrderPartCreate,
    WorkOrderPartResponse,
)

router = APIRouter(tags=["配件管理"])


@router.get("/parts", response_model=list[PartResponse])
async def list_parts(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Part)
    conditions = []

    if search:
        conditions.append(
            or_(
                Part.name.ilike(f"%{search}%"),
                Part.part_no.ilike(f"%{search}%"),
            )
        )
    if category:
        conditions.append(Part.category == category)
    if low_stock_only:
        conditions.append(Part.stock_quantity <= Part.min_stock)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query.order_by(Part.name))
    parts = result.scalars().all()
    return parts


@router.post("/parts", response_model=PartResponse, status_code=status.HTTP_201_CREATED)
async def create_part(
    data: PartCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.parts_staff)),
):
    result = await db.execute(select(Part).where(Part.part_no == data.part_no))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="配件编号已存在")

    part = Part(id=uuid.uuid4(), **data.model_dump())
    db.add(part)
    await db.commit()
    await db.refresh(part)
    return part


@router.get("/parts/{part_id}", response_model=PartResponse)
async def get_part(
    part_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配件不存在")
    return part


@router.put("/parts/{part_id}", response_model=PartResponse)
async def update_part(
    part_id: UUID,
    data: PartUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.parts_staff)),
):
    result = await db.execute(select(Part).where(Part.id == part_id))
    part = result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配件不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(part, key, value)

    await db.commit()
    await db.refresh(part)
    return part


@router.get("/parts/low-stock", response_model=list[PartResponse])
async def get_low_stock_parts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Part).where(Part.stock_quantity <= Part.min_stock)
    )
    return result.scalars().all()


@router.get("/work-orders/{order_id}/parts", response_model=list[WorkOrderPartResponse])
async def list_order_parts(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    if not order_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    result = await db.execute(
        select(WorkOrderPart, Part.name)
        .join(Part, WorkOrderPart.part_id == Part.id, isouter=True)
        .where(WorkOrderPart.work_order_id == order_id)
    )
    rows = result.all()

    responses: list[WorkOrderPartResponse] = []
    for wop, part_name in rows:
        resp = WorkOrderPartResponse.model_validate(wop)
        if part_name:
            resp.part_name = part_name
        responses.append(resp)
    return responses


@router.post("/work-orders/{order_id}/parts", response_model=WorkOrderPartResponse, status_code=status.HTTP_201_CREATED)
async def add_part_to_order(
    order_id: UUID,
    data: WorkOrderPartCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    if not order_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    part_result = await db.execute(select(Part).where(Part.id == data.part_id))
    part = part_result.scalar_one_or_none()
    if not part:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="配件不存在")

    if part.stock_quantity < data.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="库存不足")

    wop = WorkOrderPart(
        id=uuid.uuid4(),
        work_order_id=order_id,
        part_id=data.part_id,
        quantity=data.quantity,
        unit_price=data.unit_price,
        status=PartStatus.pending,
    )
    db.add(wop)
    await db.commit()
    await db.refresh(wop)

    resp = WorkOrderPartResponse.model_validate(wop)
    resp.part_name = part.name
    return resp


@router.patch("/work-orders/{order_id}/parts/{part_record_id}/issue", response_model=WorkOrderPartResponse)
async def issue_part(
    order_id: UUID,
    part_record_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.parts_staff, UserRole.manager)),
):
    result = await db.execute(
        select(WorkOrderPart).where(
            and_(
                WorkOrderPart.id == part_record_id,
                WorkOrderPart.work_order_id == order_id,
            )
        )
    )
    wop = result.scalar_one_or_none()
    if not wop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单配件记录不存在")

    if wop.status == PartStatus.issued:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="配件已出库")

    part_result = await db.execute(select(Part).where(Part.id == wop.part_id))
    part = part_result.scalar_one_or_none()
    if part and part.stock_quantity < wop.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="库存不足")

    if part:
        part.stock_quantity -= wop.quantity

    wop.status = PartStatus.issued
    wop.issued_by = current_user.id
    wop.issued_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(wop)

    resp = WorkOrderPartResponse.model_validate(wop)
    if part:
        resp.part_name = part.name
    return resp
