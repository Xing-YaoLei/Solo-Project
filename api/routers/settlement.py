from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.services.settlement_service import (
    get_settlement_trend,
    get_settlement_trend_olap,
    get_settlement_summary,
)
from api.schemas import SettlementTrendPoint, SettlementSummary

router = APIRouter(prefix="/api/settlement", tags=["settlement"])


@router.get("/trend", response_model=List[SettlementTrendPoint])
async def settlement_trend(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    granularity: str = Query("monthly", pattern="^(monthly|quarterly)$"),
    use_olap: bool = Query(False),
    department: Optional[str] = Query(None),
    rejection_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if use_olap:
        return await get_settlement_trend_olap(
            db, start_date, end_date, granularity,
            department=department, rejection_status=rejection_status,
        )
    return await get_settlement_trend(
        db, start_date, end_date, granularity,
        department=department, rejection_status=rejection_status,
    )


@router.get("/summary", response_model=SettlementSummary)
async def settlement_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    department: Optional[str] = Query(None),
    rejection_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_settlement_summary(
        db, start_date, end_date,
        department=department, rejection_status=rejection_status,
    )
