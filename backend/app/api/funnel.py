from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services.funnel_service import get_funnel_data, get_funnel_timeout_intervals

router = APIRouter(prefix="/api/funnel", tags=["funnel"])


@router.get("")
async def read_funnel(
    date_start: Optional[datetime] = Query(None),
    date_end: Optional[datetime] = Query(None),
    session: AsyncSession = Depends(get_pg_session),
):
    data = await get_funnel_data(session, date_start, date_end)
    timeout_intervals = get_funnel_timeout_intervals()
    return {
        "funnel": data["funnel"],
        "total": data["total"],
        "avg_closure_work_hours": data["avg_closure_work_hours"],
        "closure_rule": data["closure_rule"],
        "timeout_intervals": timeout_intervals,
    }


@router.get("/timeout-intervals")
async def read_timeout_intervals():
    intervals = get_funnel_timeout_intervals()
    return {"intervals": intervals}
