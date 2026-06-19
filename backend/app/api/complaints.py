from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.schemas.complaint import (
    Complaint, ComplaintCreate, ComplaintUpdate,
    ComplaintListResponse, KPIData, TrendData,
    HeatmapData, EscalationSeriesData
)
from app.services.complaint_service import (
    get_complaint, get_complaints, get_overdue_complaints,
    get_kpi_data, get_trend_data, get_heatmap_data,
    get_escalation_series, create_complaint, update_complaint
)

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/kpi", response_model=KPIData)
def read_kpi(
    period: str = Query("week", description="统计周期: day, week, month"),
    db: Session = Depends(get_db)
):
    return get_kpi_data(db, period)


@router.get("/trend", response_model=TrendData)
def read_trend(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    compare: str = Query("none", description="对比方式: none, yoy(同比), mom(环比)"),
    db: Session = Depends(get_db)
):
    if not startDate:
        startDate = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not endDate:
        endDate = datetime.now().strftime("%Y-%m-%d")
    return get_trend_data(db, startDate, endDate, compare)


@router.get("/heatmap", response_model=HeatmapData)
def read_heatmap(
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_heatmap_data(db, date)


@router.get("/overdue", response_model=list[Complaint])
def read_overdue(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return get_overdue_complaints(db, limit)


@router.get("", response_model=ComplaintListResponse)
def read_complaints(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    region: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    complaints, total = get_complaints(
        db, skip=skip, limit=pageSize,
        status=status, region=region,
        start_date=startDate, end_date=endDate,
        keyword=keyword
    )
    return {"list": complaints, "total": total}


@router.get("/{complaint_id}", response_model=Complaint)
def read_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = get_complaint(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="客诉记录不存在")
    return complaint


@router.post("", response_model=Complaint)
def create_complaint_endpoint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    return create_complaint(db, complaint)


@router.put("/{complaint_id}", response_model=Complaint)
def update_complaint_endpoint(
    complaint_id: str,
    complaint: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    db_complaint = update_complaint(db, complaint_id, complaint)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="客诉记录不存在")
    return db_complaint
