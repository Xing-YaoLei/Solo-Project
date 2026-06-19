from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.schemas.complaint import EscalationSeriesData
from app.services.complaint_service import get_escalation_series

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("/series", response_model=EscalationSeriesData)
def read_escalation_series(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    compare: str = Query("none", description="对比方式: none, yoy(同比), mom(环比)"),
    db: Session = Depends(get_db)
):
    if not startDate:
        startDate = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not endDate:
        endDate = datetime.now().strftime("%Y-%m-%d")
    return get_escalation_series(db, startDate, endDate, compare)
