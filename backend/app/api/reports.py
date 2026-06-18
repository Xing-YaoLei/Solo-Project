from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from io import BytesIO
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models import User
from ..schemas import (
    ReportDownloadLogResponse,
)
from ..services.report_service import (
    calculate_rework_rate,
    generate_rework_excel_report,
    log_report_download,
    get_report_history,
)

router = APIRouter(prefix="/reports", tags=["报表管理"])


@router.get("/rework-rate")
def get_rework_rate_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    technician_id: Optional[int] = None,
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    if not year:
        year = now.year
    if not month:
        month = now.month
    return calculate_rework_rate(db, year, month, technician_id, station_id)


@router.get("/rework-rate/download")
def download_rework_rate_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    technician_id: Optional[int] = None,
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    if not year:
        year = now.year
    if not month:
        month = now.month

    filter_criteria = {
        "year": year,
        "month": month,
        "technician_id": technician_id,
        "station_id": station_id,
    }
    file_name = f"返修率报表_{year}{month:02d}.xlsx"

    excel_data = generate_rework_excel_report(
        db, year, month, filter_criteria, current_user.id
    )
    log_report_download(db, "rework_rate", filter_criteria, current_user.id, file_name)

    headers = {
        "Content-Disposition": f'attachment; filename="{file_name}"',
        "X-Report-Type": "rework_rate",
        "X-Generated-By": current_user.full_name,
        "X-Filter-Criteria": str(filter_criteria),
    }
    return StreamingResponse(
        BytesIO(excel_data.getvalue()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/download-history", response_model=List[ReportDownloadLogResponse])
def get_report_download_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_report_history(db, limit)
