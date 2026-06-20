from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.summary import (
    EfficiencyStats,
    SourceGroupStats,
    AssigneeGroupStats,
    ConclusionGroupStats,
    VerificationSummaryResponse,
)
from app.services.summary_service import SummaryService

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/efficiency", response_model=EfficiencyStats)
async def get_efficiency_stats(
    source: str | None = Query(None),
    assignee: str | None = Query(None),
    conclusion: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = SummaryService(db)
    return await service.get_efficiency_stats(source, assignee, conclusion, date_from, date_to)


@router.get("/by-source", response_model=list[SourceGroupStats])
async def get_by_source(
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = SummaryService(db)
    return await service.get_by_source(date_from, date_to)


@router.get("/by-assignee", response_model=list[AssigneeGroupStats])
async def get_by_assignee(
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = SummaryService(db)
    return await service.get_by_assignee(date_from, date_to)


@router.get("/by-conclusion", response_model=list[ConclusionGroupStats])
async def get_by_conclusion(
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = SummaryService(db)
    return await service.get_by_conclusion(date_from, date_to)
