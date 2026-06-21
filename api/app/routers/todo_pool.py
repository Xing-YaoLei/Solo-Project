import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TodoTicket
from app.schemas import (
    FlowLogResponse,
    RejectRequest,
    SupplementRequest,
    TodoTicketCreate,
    TodoTicketResponse,
    TransferRequest,
)
from app.services.flow_log import FlowLogService

router = APIRouter(prefix="/api/todo-pool", tags=["todo-pool"])


@router.get("", response_model=dict)
async def list_todo_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[uuid.UUID] = None,
    source_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket)
    if status:
        stmt = stmt.where(TodoTicket.status == status)
    if priority:
        stmt = stmt.where(TodoTicket.priority == priority)
    if assignee_id:
        stmt = stmt.where(TodoTicket.assignee_id == assignee_id)
    if source_type:
        stmt = stmt.where(TodoTicket.source_type == source_type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(TodoTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "items": [TodoTicketResponse.model_validate(t).model_dump() for t in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{ticket_id}", response_model=dict)
async def get_todo_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")

    logs = await FlowLogService.get_logs(db, ticket_id, ticket_type="todo")

    ticket_data = TodoTicketResponse.model_validate(ticket).model_dump()
    ticket_data["logs"] = [FlowLogResponse.model_validate(l).model_dump() for l in logs]
    return ticket_data


@router.post("", response_model=TodoTicketResponse, status_code=201)
async def create_todo_ticket(
    data: TodoTicketCreate,
    db: AsyncSession = Depends(get_db),
):
    ticket = TodoTicket(**data.model_dump(), status="pending")
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="created",
        operator_id=data.created_by,
        operator_role="system",
        comment=f"Todo ticket created: {data.source_type}",
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/claim", response_model=TodoTicketResponse)
async def claim_todo_ticket(
    ticket_id: uuid.UUID,
    claimer_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending tickets can be claimed")
    ticket.status = "claimed"
    ticket.assignee_id = claimer_id
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="claimed",
        operator_id=claimer_id,
        operator_role="operator",
        comment="Ticket claimed",
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/request-supplement", response_model=TodoTicketResponse)
async def request_supplement(
    ticket_id: uuid.UUID,
    data: SupplementRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status not in ("claimed", "in_progress"):
        raise HTTPException(status_code=400, detail="Cannot request supplement in current status")
    ticket.status = "supplement_requested"
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="supplement_requested",
        operator_id=operator_id,
        operator_role="operator",
        comment=data.description,
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/upload-supplement", response_model=TodoTicketResponse)
async def upload_supplement(
    ticket_id: uuid.UUID,
    description: str = None,
    uploader_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status != "supplement_requested":
        raise HTTPException(status_code=400, detail="Ticket is not waiting for supplement")
    ticket.status = "in_progress"
    if description:
        ticket.description = description
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="supplement_uploaded",
        operator_id=uploader_id,
        operator_role="rider",
        comment="Supplement uploaded for todo ticket",
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/reject", response_model=TodoTicketResponse)
async def reject_todo_ticket(
    ticket_id: uuid.UUID,
    data: RejectRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status not in ("claimed", "in_progress", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot reject ticket in current status")
    ticket.status = "rejected"
    ticket.resolved_at = datetime.now()
    ticket.resolved_by = operator_id
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="rejected",
        operator_id=operator_id,
        operator_role="operator",
        comment=data.reason,
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/transfer", response_model=TodoTicketResponse)
async def transfer_todo_ticket(
    ticket_id: uuid.UUID,
    data: TransferRequest,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status not in ("claimed", "in_progress", "pending", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot transfer ticket in current status")
    ticket.transfer_from = ticket.assignee_id
    ticket.assignee_id = data.transfer_to
    ticket.transfer_reason = data.reason
    ticket.status = "transferred"
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="transferred",
        operator_id=operator_id,
        operator_role="operator",
        comment=f"Transferred: {data.reason}",
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/resolve", response_model=TodoTicketResponse)
async def resolve_todo_ticket(
    ticket_id: uuid.UUID,
    resolver_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status not in ("claimed", "in_progress", "supplement_requested"):
        raise HTTPException(status_code=400, detail="Cannot resolve ticket in current status")
    ticket.status = "resolved"
    ticket.resolved_at = datetime.now()
    ticket.resolved_by = resolver_id or ticket.assignee_id
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="resolved",
        operator_id=resolver_id,
        operator_role="operator",
        comment="Ticket resolved",
        ticket_type="todo",
    )
    return ticket


@router.post("/{ticket_id}/close", response_model=TodoTicketResponse)
async def close_todo_ticket(
    ticket_id: uuid.UUID,
    operator_id: uuid.UUID = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TodoTicket).where(TodoTicket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="TodoTicket not found")
    if ticket.status != "resolved":
        raise HTTPException(status_code=400, detail="Only resolved tickets can be closed")
    ticket.status = "closed"
    ticket.closed_at = datetime.now()
    await db.flush()
    await db.refresh(ticket)

    await FlowLogService.create_log(
        db=db,
        ticket_id=ticket.id,
        action="closed",
        operator_id=operator_id,
        operator_role="admin",
        comment="Ticket closed",
        ticket_type="todo",
    )
    return ticket
