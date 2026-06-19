from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.schemas.complaint import (
    Complaint, ComplaintCreate, ComplaintUpdate,
    ComplaintListResponse, KPIData, TrendData,
    HeatmapData, OverdueWarning, CallbackStats,
    ComplaintDetail, PieDataItem
)
from app.services.complaint_service import (
    get_complaint, get_complaints, get_overdue_warnings,
    get_kpi_data, get_trend_data, get_heatmap_data,
    get_callback_stats, get_responsibility_stats,
    get_category_stats, create_complaint, update_complaint
)

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/kpi", response_model=KPIData)
def read_kpi(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_kpi_data(db, startDate, endDate, region)


@router.get("/trend", response_model=TrendData)
def read_trend(
    period: str = Query("30d", description="周期: 7d, 30d, 90d"),
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_trend_data(db, period, region)


@router.get("/heatmap", response_model=HeatmapData)
def read_heatmap(
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_heatmap_data(db, region)


@router.get("/overdue-warning", response_model=list[OverdueWarning])
def read_overdue_warning(
    region: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return get_overdue_warnings(db, region, limit)


@router.get("/callback/stats", response_model=list[CallbackStats])
def read_callback_stats(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_callback_stats(db, startDate, endDate, region)


@router.get("", response_model=ComplaintListResponse)
def read_complaints(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    complaints, total = get_complaints(
        db, skip=skip, limit=pageSize,
        status=status, severity=severity,
        category=category, region=region,
        keyword=search
    )
    return ComplaintListResponse(
        data=complaints,
        total=total,
        page=page,
        pageSize=pageSize
    )


@router.get("/{complaint_id}", response_model=ComplaintDetail)
def read_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = get_complaint(db, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="客诉记录不存在")
    return complaint


@router.post("", response_model=Complaint)
def create_complaint_endpoint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    return create_complaint(db, complaint)


@router.put("/{complaint_id}")
def update_complaint_endpoint(
    complaint_id: str,
    complaint: ComplaintUpdate,
    db: Session = Depends(get_db)
):
    db_complaint = update_complaint(db, complaint_id, complaint)
    if db_complaint is None:
        raise HTTPException(status_code=404, detail="客诉记录不存在")
    return {"success": True}
