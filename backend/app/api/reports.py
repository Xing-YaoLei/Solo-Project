from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.schemas.report import (
    DurationReport, RegionReport, DateReport,
    ComparisonReport, PieDataItem, DuckDBAnalysis
)
from app.schemas.complaint import PieDataItem as ComplaintPieDataItem
from app.services.report_service import (
    get_close_duration_report, get_region_report,
    get_date_report, get_comparison_report, get_duckdb_analysis
)
from app.services.complaint_service import get_responsibility_stats, get_category_stats

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/by-duration", response_model=DurationReport)
def read_by_duration(
    region: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_close_duration_report(db, region, startDate, endDate)


@router.get("/by-region", response_model=list[RegionReport])
def read_by_region(
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_region_report(db, startDate, endDate)


@router.get("/by-date", response_model=DateReport)
def read_by_date(
    days: int = Query(90, ge=1, le=365),
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_date_report(db, days, region)


@router.get("/comparison", response_model=ComparisonReport)
def read_comparison(
    region: Optional[str] = None,
    period1Start: Optional[str] = None,
    period1End: Optional[str] = None,
    period2Start: Optional[str] = None,
    period2End: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_comparison_report(
        db, region,
        period1Start, period1End,
        period2Start, period2End
    )


@router.get("/responsibility", response_model=list[ComplaintPieDataItem])
def read_responsibility(
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_responsibility_stats(db, region)


@router.get("/category", response_model=list[ComplaintPieDataItem])
def read_category(
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_category_stats(db, region)


@router.get("/duckdb-analysis", response_model=DuckDBAnalysis)
def read_duckdb_analysis(db: Session = Depends(get_db)):
    return get_duckdb_analysis(db)
