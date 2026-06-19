import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.responsibility import Responsibility
from app.schemas.responsibility import (
    ResponsibilityCreate,
    ResponsibilityResponse,
    ResponsibilityUpdate,
)

router = APIRouter(prefix="/api/responsibilities", tags=["responsibilities"])


@router.post("/", response_model=ResponsibilityResponse, status_code=201)
async def create_responsibility(
    data: ResponsibilityCreate,
    db: AsyncSession = Depends(get_db),
):
    responsibility = Responsibility(
        complaint_id=data.complaint_id,
        responsible_type=data.responsible_type,
        responsible_person=data.responsible_person,
        judgment_basis=data.judgment_basis,
        determined_by=data.determined_by,
        determined_at=data.determined_at,
    )
    db.add(responsibility)
    await db.commit()
    await db.refresh(responsibility)
    return responsibility


@router.get("/{complaint_id}", response_model=list[ResponsibilityResponse])
async def get_responsibilities(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Responsibility).where(Responsibility.complaint_id == complaint_id)
    )
    return result.scalars().all()


@router.patch("/{responsibility_id}", response_model=ResponsibilityResponse)
async def update_responsibility(
    responsibility_id: uuid.UUID,
    data: ResponsibilityUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Responsibility).where(Responsibility.id == responsibility_id)
    )
    responsibility = result.scalar_one_or_none()
    if not responsibility:
        raise HTTPException(status_code=404, detail="Responsibility not found")

    if data.judgment_basis is not None:
        responsibility.judgment_basis = data.judgment_basis
    if data.responsible_type is not None:
        responsibility.responsible_type = data.responsible_type
    if data.responsible_person is not None:
        responsibility.responsible_person = data.responsible_person

    await db.commit()
    await db.refresh(responsibility)
    return responsibility
