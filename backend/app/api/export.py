from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services.export_service import export_funnel_report

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("")
async def export_report(
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    date_start: Optional[datetime] = Query(None),
    date_end: Optional[datetime] = Query(None),
    session: AsyncSession = Depends(get_pg_session),
):
    return await export_funnel_report(session, fmt=format, date_start=date_start, date_end=date_end)
