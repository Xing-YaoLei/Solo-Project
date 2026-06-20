from uuid import UUID
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.seat import Seat
from app.schemas.seat import SeatCreate, SeatUpdate, SeatResponse

router = APIRouter(prefix="/seats", tags=["seats"])


@router.get("/", response_model=list[SeatResponse])
async def list_seats(
    event_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Seat).order_by(Seat.section, Seat.row, Seat.number)
    if event_id:
        stmt = stmt.where(Seat.event_id == event_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=SeatResponse, status_code=201)
async def create_seat(data: SeatCreate, db: AsyncSession = Depends(get_db)):
    seat = Seat(**data.model_dump())
    db.add(seat)
    await db.commit()
    await db.refresh(seat)
    return seat


@router.get("/{seat_id}", response_model=SeatResponse)
async def get_seat(seat_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = result.scalar_one_or_none()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


@router.patch("/{seat_id}", response_model=SeatResponse)
async def update_seat(seat_id: UUID, data: SeatUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = result.scalar_one_or_none()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(seat, key, value)
    await db.commit()
    await db.refresh(seat)
    return seat


@router.delete("/{seat_id}", status_code=204)
async def delete_seat(seat_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seat).where(Seat.id == seat_id))
    seat = result.scalar_one_or_none()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    await db.delete(seat)
    await db.commit()


@router.get("/chart/{event_id}")
async def get_seating_chart(event_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Seat).where(Seat.event_id == event_id).order_by(Seat.section, Seat.row, Seat.number)
    )
    seats = result.scalars().all()

    chart: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for seat in seats:
        chart[seat.section][seat.row].append({
            "id": str(seat.id),
            "number": seat.number,
            "seat_label": seat.seat_label,
            "status": seat.status,
            "order_id": str(seat.order_id) if seat.order_id else None,
            "ticket_type_id": str(seat.ticket_type_id) if seat.ticket_type_id else None,
        })
    return {"event_id": str(event_id), "chart": chart}
