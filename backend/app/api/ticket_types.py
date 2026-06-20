from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ticket_type import TicketType
from app.schemas.ticket_type import TicketTypeCreate, TicketTypeUpdate, TicketTypeResponse

router = APIRouter(prefix="/ticket-types", tags=["ticket-types"])


@router.get("/", response_model=list[TicketTypeResponse])
async def list_ticket_types(
    event_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TicketType).order_by(TicketType.created_at.desc())
    if event_id:
        stmt = stmt.where(TicketType.event_id == event_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=TicketTypeResponse, status_code=201)
async def create_ticket_type(data: TicketTypeCreate, db: AsyncSession = Depends(get_db)):
    ticket_type = TicketType(**data.model_dump())
    db.add(ticket_type)
    await db.commit()
    await db.refresh(ticket_type)
    return ticket_type


@router.get("/{ticket_type_id}", response_model=TicketTypeResponse)
async def get_ticket_type(ticket_type_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TicketType).where(TicketType.id == ticket_type_id))
    ticket_type = result.scalar_one_or_none()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    return ticket_type


@router.patch("/{ticket_type_id}", response_model=TicketTypeResponse)
async def update_ticket_type(
    ticket_type_id: UUID, data: TicketTypeUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(TicketType).where(TicketType.id == ticket_type_id))
    ticket_type = result.scalar_one_or_none()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(ticket_type, key, value)
    await db.commit()
    await db.refresh(ticket_type)
    return ticket_type


@router.delete("/{ticket_type_id}", status_code=204)
async def delete_ticket_type(ticket_type_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TicketType).where(TicketType.id == ticket_type_id))
    ticket_type = result.scalar_one_or_none()
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    await db.delete(ticket_type)
    await db.commit()
