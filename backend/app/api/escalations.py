from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.schemas.complaint import EscalationTimelineData, ComplaintListResponse
from app.services.complaint_service import get_escalation_timeline, get_complaints

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("/timeline", response_model=EscalationTimelineData)
def read_escalation_timeline(
    days: int = Query(30, ge=1, le=365),
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_escalation_timeline(db, days, region)


@router.get("/list", response_model=ComplaintListResponse)
def read_escalation_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    region: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    complaints, total = get_complaints(
        db, skip=skip, limit=pageSize,
        region=region
    )
    escalated = [c for c in complaints if c.escalated]
    return ComplaintListResponse(
        data=escalated,
        total=total,
        page=page,
        pageSize=pageSize
    )
