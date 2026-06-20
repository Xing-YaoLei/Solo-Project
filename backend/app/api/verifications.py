from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.verification import VerificationTicket, VerificationAction
from app.schemas.verification import (
    VerificationTicketCreate,
    VerificationTicketUpdate,
    VerificationTicketResponse,
    VerificationTicketDetailResponse,
    VerificationTransitionRequest,
    VerificationActionResponse,
)
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/verifications", tags=["verifications"])


@router.get("/", response_model=list[VerificationTicketResponse])
async def list_verifications(
    event_id: UUID | None = Query(None),
    status: str | None = Query(None),
    assignee: str | None = Query(None),
    source: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(VerificationTicket).options(
        selectinload(VerificationTicket.actions)
    ).order_by(VerificationTicket.created_at.desc())
    if event_id:
        stmt = stmt.where(VerificationTicket.event_id == event_id)
    if status:
        stmt = stmt.where(VerificationTicket.status == status)
    if assignee:
        stmt = stmt.where(VerificationTicket.assignee == assignee)
    if source:
        stmt = stmt.where(VerificationTicket.source == source)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=VerificationTicketResponse, status_code=201)
async def create_verification(
    data: VerificationTicketCreate, db: AsyncSession = Depends(get_db)
):
    ticket = VerificationTicket(**data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get("/{verification_id}", response_model=VerificationTicketDetailResponse)
async def get_verification(
    verification_id: UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(VerificationTicket)
        .options(
            selectinload(VerificationTicket.actions),
            selectinload(VerificationTicket.order),
            selectinload(VerificationTicket.ticket_type),
            selectinload(VerificationTicket.seat),
        )
        .where(VerificationTicket.id == verification_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Verification ticket not found")
    return ticket


@router.post("/{verification_id}/transition", response_model=VerificationTicketResponse)
async def transition_verification(
    verification_id: UUID,
    data: VerificationTransitionRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VerificationTicket)
        .options(selectinload(VerificationTicket.actions))
        .where(VerificationTicket.id == verification_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Verification ticket not found")

    service = VerificationService(db)
    ticket = await service.transition(ticket, data)
    return ticket


@router.get("/{verification_id}/actions", response_model=list[VerificationActionResponse])
async def get_verification_actions(
    verification_id: UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(VerificationAction)
        .where(VerificationAction.verification_id == verification_id)
        .order_by(VerificationAction.created_at)
    )
    return result.scalars().all()


@router.patch("/{verification_id}", response_model=VerificationTicketResponse)
async def update_verification(
    verification_id: UUID,
    data: VerificationTicketUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VerificationTicket)
        .options(selectinload(VerificationTicket.actions))
        .where(VerificationTicket.id == verification_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Verification ticket not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    await db.commit()
    await db.refresh(ticket)
    return ticket
