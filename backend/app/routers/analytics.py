from fastapi import APIRouter, Query
from typing import Optional
from ..services.analytics_service import (
    get_tag_trend,
    get_progress_composition,
    get_grade_feedback,
    get_anomaly_alerts,
    get_chapter_rank
)
from ..schemas.analytics import (
    TagTrendResponse,
    ProgressCompositionResponse,
    GradeFeedbackResponse,
    AnomalyAlertResponse,
    ChapterRankResponse
)

router = APIRouter(prefix="/analytics", tags=["数据分析"])


@router.get("/tag-trend", response_model=TagTrendResponse)
async def tag_trend(days: int = Query(30, ge=7, le=90)):
    """题目标签趋势数据"""
    return get_tag_trend(days=days)


@router.get("/progress-composition", response_model=ProgressCompositionResponse)
async def progress_composition():
    """学习进度构成数据"""
    return get_progress_composition()


@router.get("/grade-feedback", response_model=GradeFeedbackResponse)
async def grade_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    course: Optional[str] = None
):
    """成绩反馈明细数据"""
    return get_grade_feedback(page=page, page_size=page_size, course=course)


@router.get("/anomaly-alerts", response_model=AnomalyAlertResponse)
async def anomaly_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None
):
    """提醒规则异常标注数据"""
    return get_anomaly_alerts(page=page, page_size=page_size, severity=severity)


@router.get("/chapter-rank", response_model=ChapterRankResponse)
async def chapter_rank(
    sort_by: str = Query("completion_rate", pattern="^(completion_rate|total_students)$"),
    view_mode: str = Query("rate", pattern="^(rate|absolute)$")
):
    """课程章节排行数据，支持绝对值/占比切换"""
    return get_chapter_rank(sort_by=sort_by, view_mode=view_mode)
