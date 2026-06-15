from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import date
from ..core.database import get_db
from ..services.funnel_service import get_funnel_service, FunnelService

router = APIRouter(prefix="/api/funnel", tags=["教材发放漏斗"])


@router.get("/overview")
def get_funnel_overview(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    date_from: Optional[date] = Query(None, description="开始日期"),
    date_to: Optional[date] = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """获取漏斗总览数据"""
    service = get_funnel_service(db)
    return service.get_funnel_overview(course_id, region_id, date_from, date_to)


@router.get("/chapters/{course_id}")
def get_chapter_funnel(
    course_id: int,
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """按课程章节统计漏斗数据"""
    service = get_funnel_service(db)
    return service.get_chapter_funnel(course_id, region_id)


@router.get("/regions")
def get_funnel_by_region(
    course_id: Optional[int] = Query(None, description="课程ID"),
    level: str = Query("city", description="区域级别"),
    db: Session = Depends(get_db)
):
    """按区域统计漏斗数据（Mapbox地图数据）"""
    service = get_funnel_service(db)
    return service.get_funnel_by_region(course_id, level)


@router.get("/trend")
def get_funnel_trend(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    days: int = Query(30, description="天数"),
    db: Session = Depends(get_db)
):
    """获取漏斗趋势数据"""
    service = get_funnel_service(db)
    return service.get_funnel_trend(course_id, region_id, days)


@router.get("/delayed")
def get_delayed_distributions(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """获取延迟发放列表"""
    service = get_funnel_service(db)
    return service.get_delayed_distributions(course_id, region_id)
