from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.models import ReviewNote
from app.schemas import ReviewNoteCreate, ReviewNoteUpdate, ReviewNoteResponse

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("/complaint/{complaint_id}", response_model=List[ReviewNoteResponse])
async def list_notes(
    complaint_id: int,
    session: AsyncSession = Depends(get_pg_session),
):
    result = await session.execute(
        select(ReviewNote).where(ReviewNote.complaint_id == complaint_id)
    )
    return list(result.scalars().all())


@router.post("", response_model=ReviewNoteResponse)
async def create_note(
    data: ReviewNoteCreate,
    session: AsyncSession = Depends(get_pg_session),
):
    note = ReviewNote(**data.model_dump())
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note


@router.put("/{note_id}", response_model=ReviewNoteResponse)
async def update_note(
    note_id: int,
    data: ReviewNoteUpdate,
    session: AsyncSession = Depends(get_pg_session),
):
    result = await session.execute(
        select(ReviewNote).where(ReviewNote.id == note_id)
    )
    note = result.scalars().first()
    if not note:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(note, key, value)
    await session.commit()
    await session.refresh(note)
    return note
