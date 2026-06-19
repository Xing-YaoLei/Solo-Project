from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from app.db.database import get_db
from app.schemas.report import ReportData
from app.services.report_service import (
    get_close_duration_report,
    get_date_compare_report,
    get_region_compare_report,
    get_duckdb_analysis
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/close-duration", response_model=ReportData)
def read_close_duration_report(
    propertyIds: Optional[str] = None,
    db: Session = Depends(get_db)
):
    property_ids = propertyIds.split(",") if propertyIds else None
    return get_close_duration_report(db, property_ids)


@router.get("/date-compare", response_model=ReportData)
def read_date_compare_report(
    startDate1: Optional[str] = None,
    endDate1: Optional[str] = None,
    startDate2: Optional[str] = None,
    endDate2: Optional[str] = None,
    db: Session = Depends(get_db)
):
    now = datetime.now()
    if not startDate1:
        startDate1 = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    if not endDate1:
        endDate1 = now.strftime("%Y-%m-%d")
    if not startDate2:
        startDate2 = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    if not endDate2:
        endDate2 = (now - timedelta(days=8)).strftime("%Y-%m-%d")
    
    return get_date_compare_report(db, startDate1, endDate1, startDate2, endDate2)


@router.get("/region-compare", response_model=ReportData)
def read_region_compare_report(
    regions: Optional[str] = None,
    metrics: Optional[str] = None,
    db: Session = Depends(get_db)
):
    region_list = regions.split(",") if regions else None
    metric_list = metrics.split(",") if metrics else None
    return get_region_compare_report(db, region_list, metric_list)


@router.get("/duckdb-analysis")
def read_duckdb_analysis(db: Session = Depends(get_db)):
    return get_duckdb_analysis(db)
