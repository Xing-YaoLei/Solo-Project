from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.duckdb_conn import get_duckdb
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.dashboard import (
    OverviewMetrics, TrendResponse, ChapterDistribution,
    FunnelStage, TagRank, ProgressTrend
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["看板数据"])


@router.get("/overview", response_model=OverviewMetrics)
def get_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_overview_metrics(current_user.id, current_user.role)


@router.get("/trend", response_model=TrendResponse)
def get_trend(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_trend_data(days, current_user.id, current_user.role)


@router.get("/chapter-distribution", response_model=List[ChapterDistribution])
def get_chapter_distribution(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_chapter_distribution(current_user.id, current_user.role)


@router.get("/homework-funnel", response_model=List[FunnelStage])
def get_homework_funnel(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_homework_funnel(current_user.id, current_user.role)


@router.get("/tag-ranking", response_model=List[TagRank])
def get_tag_ranking(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_tag_ranking(current_user.id, current_user.role)


@router.get("/progress-trend", response_model=List[ProgressTrend])
def get_progress_trend(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    return service.get_progress_trend(current_user.id, current_user.role)
