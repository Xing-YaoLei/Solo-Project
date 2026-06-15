from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..services.grade_service import get_grade_service, GradeService

router = APIRouter(prefix="/api/grades", tags=["成绩反馈"])


@router.get("/overview")
def get_grade_overview(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """获取成绩总览 - 图表区：成绩反馈独立展示"""
    service = get_grade_service(db)
    return service.get_grade_overview(course_id, region_id)


@router.get("/homework")
def get_homework_stats(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """获取作业统计"""
    service = get_grade_service(db)
    return service.get_homework_stats(course_id, region_id)


@router.get("/chapters/{course_id}")
def get_chapter_grades(
    course_id: int,
    region_id: Optional[int] = Query(None, description="区域ID"),
    db: Session = Depends(get_db)
):
    """按章节获取成绩分布 - 图表区：课程章节独立展示"""
    service = get_grade_service(db)
    return service.get_chapter_grades(course_id, region_id)


@router.get("/trend")
def get_score_trend(
    course_id: Optional[int] = Query(None, description="课程ID"),
    region_id: Optional[int] = Query(None, description="区域ID"),
    days: int = Query(30, description="天数"),
    db: Session = Depends(get_db)
):
    """获取成绩趋势"""
    service = get_grade_service(db)
    return service.get_score_trend(course_id, region_id, days)
