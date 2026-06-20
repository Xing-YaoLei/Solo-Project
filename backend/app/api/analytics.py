from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.session import get_db
from ..models.models import User, RoleEnum
from ..schemas.schemas import (
    PerformanceScheduleResponse, SeatTrendResponse, SignCodeCompositionResponse,
    SponsorResponse, CheckinRecordResponse, DashboardOverview,
    DataRefreshStatus, MetricDefinitionResponse
)
from ..core.deps import get_current_user, require_roles
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["数据分析"])


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.VIEWER))
):
    return AnalyticsService.get_dashboard_overview(db)


@router.get("/refresh-status", response_model=List[DataRefreshStatus])
def get_refresh_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsService.get_refresh_status(db)


@router.get("/schedules", response_model=List[PerformanceScheduleResponse])
def list_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.models import PerformanceSchedule
    return db.query(PerformanceSchedule).order_by(PerformanceSchedule.performance_date.desc()).all()


@router.get("/seat-trend/{schedule_id}", response_model=SeatTrendResponse)
def get_seat_trend(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.VIEWER))
):
    try:
        return AnalyticsService.get_seat_trend(db, schedule_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sign-code-composition/{schedule_id}", response_model=SignCodeCompositionResponse)
def get_sign_code_composition(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.VIEWER))
):
    return AnalyticsService.get_sign_code_composition(db, schedule_id)


@router.get("/sponsors/{schedule_id}", response_model=List[SponsorResponse])
def get_sponsor_list(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST, RoleEnum.VIEWER))
):
    return AnalyticsService.get_sponsor_list(db, schedule_id)


@router.get("/anomaly-checkins", response_model=List[CheckinRecordResponse])
def get_anomaly_checkins(
    schedule_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.OPERATION_MANAGER, RoleEnum.ANALYST))
):
    return AnalyticsService.get_anomaly_checkins(db, schedule_id)


@router.get("/metrics", response_model=List[MetricDefinitionResponse])
def get_metric_definitions(
    metric_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsService.get_metric_definitions(db, metric_code)
