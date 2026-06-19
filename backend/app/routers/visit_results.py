import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.visit_result import VisitResult
from app.schemas.visit_result import VisitResultCreate, VisitResultResponse, VisitResultUpdate

router = APIRouter(prefix="/api/visit-results", tags=["visit-results"])


def _parse_datetime(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.strptime(value, "%Y-%m-%d")


@router.post("/", response_model=VisitResultResponse, status_code=201)
async def create_visit_result(
    data: VisitResultCreate,
    db: AsyncSession = Depends(get_db),
):
    visit_result = VisitResult(
        complaint_id=data.complaint_id,
        visit_method=data.visit_method,
        visitor_name=data.visitor_name,
        satisfaction=data.satisfaction,
        feedback=data.feedback,
        visit_at=_parse_datetime(data.visit_at),
    )
    db.add(visit_result)
    await db.commit()
    await db.refresh(visit_result)
    return visit_result


@router.get("/{complaint_id}", response_model=list[VisitResultResponse])
async def get_visit_results(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VisitResult).where(VisitResult.complaint_id == complaint_id)
    )
    return result.scalars().all()


@router.patch("/{visit_result_id}", response_model=VisitResultResponse)
async def update_visit_result(
    visit_result_id: uuid.UUID,
    data: VisitResultUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VisitResult).where(VisitResult.id == visit_result_id)
    )
    visit_result = result.scalar_one_or_none()
    if not visit_result:
        raise HTTPException(status_code=404, detail="Visit result not found")

    if data.visit_method is not None:
        visit_result.visit_method = data.visit_method
    if data.visitor_name is not None:
        visit_result.visitor_name = data.visitor_name
    if data.satisfaction is not None:
        visit_result.satisfaction = data.satisfaction
    if data.feedback is not None:
        visit_result.feedback = data.feedback
    if data.visit_at is not None:
        visit_result.visit_at = _parse_datetime(data.visit_at)

    await db.commit()
    await db.refresh(visit_result)
    return visit_result
