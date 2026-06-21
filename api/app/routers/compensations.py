import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CompensationRecord, CompensationType, TodoTicket
from app.schemas import (
    CompensationRecordCreate,
    CompensationRecordResponse,
    CompensationTypeCreate,
    CompensationTypeResponse,
    CompensationTypeUpdate,
    RejectRequest,
    TodoTicketCreate,
)
from app.services.flow_log import FlowLogService

router = APIRouter(prefix="/api/compensations", tags=["compensations"])


@router.get("/types", response_model=dict)
async def list_compensation_types(
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CompensationType)
    if is_active is not None:
        stmt = stmt.where(CompensationType.is_active == is_active)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(CompensationType.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [CompensationTypeResponse.model_validate(t).model_dump() for t in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/types", response_model=CompensationTypeResponse, status_code=201)
async def create_compensation_type(
    data: CompensationTypeCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(CompensationType).where(CompensationType.code == data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Compensation type code already exists")

    comp_type = CompensationType(**data.model_dump())
    db.add(comp_type)
    await db.flush()
    await db.refresh(comp_type)
    return comp_type


@router.put("/types/{type_id}", response_model=CompensationTypeResponse)
async def update_compensation_type(
    type_id: uuid.UUID,
    data: CompensationTypeUpdate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CompensationType).where(CompensationType.id == type_id)
    result = await db.execute(stmt)
    comp_type = result.scalar_one_or_none()
    if not comp_type:
        raise HTTPException(status_code=404, detail="CompensationType not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(comp_type, key, value)
    await db.flush()
    await db.refresh(comp_type)
    return comp_type


@router.get("/records", response_model=dict)
async def list_compensation_records(
    rider_id: Optional[uuid.UUID] = None,
    type_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CompensationRecord)
    if rider_id:
        stmt = stmt.where(CompensationRecord.rider_id == rider_id)
    if type_id:
        stmt = stmt.where(CompensationRecord.type_id == type_id)
    if status:
        stmt = stmt.where(CompensationRecord.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(CompensationRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [CompensationRecordResponse.model_validate(r).model_dump() for r in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/records", response_model=CompensationRecordResponse, status_code=201)
async def create_compensation_record(
    data: CompensationRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    comp_type = await db.get(CompensationType, data.type_id)
    if not comp_type:
        raise HTTPException(status_code=404, detail="Compensation type not found")

    record = CompensationRecord(**data.model_dump(), status="pending")
    db.add(record)
    await db.flush()
    await db.refresh(record)

    await FlowLogService.create_log(
        db=db,
        ticket_id=record.id,
        action="created",
        operator_id=data.rider_id,
        operator_role="rider",
        comment="Compensation record created",
        ticket_type="compensation",
    )

    if comp_type.category == "damage":
        todo_data = TodoTicketCreate(
            source_type="damage_report",
            source_id=record.id,
            title=f"物品损坏赔付处理 - {record.id}",
            description=data.reason,
            priority="high",
            created_by=data.rider_id,
        )
        todo_ticket = TodoTicket(
            **todo_data.model_dump(),
            status="pending",
        )
        db.add(todo_ticket)
        await db.flush()
        await db.refresh(todo_ticket)

        await FlowLogService.create_log(
            db=db,
            ticket_id=todo_ticket.id,
            action="created",
            operator_id=data.rider_id,
            operator_role="system",
            comment=f"Auto-generated from damage compensation record: {record.id}",
            ticket_type="todo",
        )

    return record


@router.post("/records/{record_id}/approve", response_model=CompensationRecordResponse)
async def approve_compensation_record(
    record_id: uuid.UUID,
    approver_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CompensationRecord).where(CompensationRecord.id == record_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="CompensationRecord not found")
    if record.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending records can be approved")
    record.status = "approved"
    if approver_id:
        record.approved_by = approver_id
    await db.flush()
    await db.refresh(record)

    await FlowLogService.create_log(
        db=db,
        ticket_id=record.id,
        action="approved",
        operator_id=approver_id,
        operator_role="finance",
        comment="Compensation record approved",
        ticket_type="compensation",
    )
    return record


@router.post("/records/{record_id}/reject", response_model=CompensationRecordResponse)
async def reject_compensation_record(
    record_id: uuid.UUID,
    data: RejectRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CompensationRecord).where(CompensationRecord.id == record_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="CompensationRecord not found")
    if record.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending records can be rejected")
    record.status = "rejected"
    if operator_id:
        record.approved_by = operator_id
    await db.flush()
    await db.refresh(record)

    await FlowLogService.create_log(
        db=db,
        ticket_id=record.id,
        action="rejected",
        operator_id=operator_id,
        operator_role="finance",
        comment=data.reason,
        ticket_type="compensation",
    )
    return record
