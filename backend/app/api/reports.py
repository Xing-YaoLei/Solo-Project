from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services.duckdb_service import DuckDBService

router = APIRouter(prefix="/api/reports", tags=["reports"])

duckdb_service = DuckDBService()


@router.get("/funnel")
def get_cleaning_funnel(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
):
    data = duckdb_service.get_cleaning_funnel_data(start_date, end_date)
    return {"code": 0, "message": "success", "data": data}


@router.get("/equipment-status")
def get_equipment_status_distribution():
    data = duckdb_service.get_equipment_status_distribution()
    return {"code": 0, "message": "success", "data": data}


@router.get("/inspection-pass-rate")
def get_inspection_pass_rate(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
):
    data = duckdb_service.get_inspection_pass_rate(start_date, end_date)
    return {"code": 0, "message": "success", "data": data}


@router.get("/offline-equipments")
def get_offline_equipments(
    threshold_days: int = Query(7, description="离线阈值天数"),
):
    data = duckdb_service.get_offline_equipments(threshold_days)
    return {"code": 0, "message": "success", "data": data}


@router.get("/stores")
def get_store_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
):
    data = duckdb_service.get_store_list_with_stats(page, page_size, keyword, status_filter)
    return {"code": 0, "message": "success", "data": data}
