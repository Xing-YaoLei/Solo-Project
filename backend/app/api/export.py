from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..db.session import get_db
from ..models.models import User, RoleEnum
from ..core.deps import require_roles
from ..services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["数据导出"])


@router.get("/checkin-records")
def export_checkin_records(
    schedule_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST))
):
    return ExportService.export_checkin_records_csv(db, schedule_id)


@router.get("/sponsor-list")
def export_sponsor_list(
    schedule_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST))
):
    return ExportService.export_sponsor_list_csv(db, schedule_id)


@router.get("/performance-summary")
def export_performance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.ADMIN))
):
    return ExportService.export_performance_summary_csv(db)
