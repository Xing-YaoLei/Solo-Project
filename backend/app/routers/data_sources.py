from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from ..services.data_sources import DataSourceRegistry


router = APIRouter(prefix="/api/data-sources", tags=["data-sources"])


class DataFetchRequest(BaseModel):
    data_type: str = Field(default="all", description="数据类型：all, students, courses, grades, chapters, enrollments, live_courses, view_records, interactions, statistics, employment_records, job_fairs, companies, learning_paths, activity_logs, milestones, assessments, recommendations, student_trace")
    params: Dict[str, Any] = Field(default_factory=dict, description="查询参数")


class SyncRequest(BaseModel):
    source_name: str
    options: Dict[str, Any] = Field(default_factory=dict)


@router.get("/status")
async def get_data_sources_status():
    """获取所有数据源的状态"""
    return {
        "sources": DataSourceRegistry.get_all_status()
    }


@router.get("/status/{source_name}")
async def get_data_source_status(source_name: str):
    """获取指定数据源的状态"""
    source = DataSourceRegistry.get_source(source_name)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_name} 不存在")
    return source.get_sync_status()


@router.post("/{source_name}/fetch")
async def fetch_from_source(
    source_name: str,
    request: DataFetchRequest
):
    """从指定数据源获取数据"""
    source = DataSourceRegistry.get_source(source_name)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_name} 不存在")

    try:
        result = source.fetch_data(
            data_type=request.data_type,
            params=request.params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.post("/{source_name}/sync")
async def sync_source_data(
    source_name: str,
    request: SyncRequest
):
    """同步指定数据源的数据"""
    source = DataSourceRegistry.get_source(source_name)
    if not source:
        raise HTTPException(status_code=404, detail=f"数据源 {source_name} 不存在")

    try:
        result = source.sync_data(**request.options)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据同步失败: {str(e)}")


@router.post("/sync-all")
async def sync_all_sources():
    """同步所有数据源的数据"""
    results = []
    errors = []

    for source_name in DataSourceRegistry.get_all_sources():
        source = DataSourceRegistry.get_source(source_name)
        try:
            result = source.sync_data()
            results.append(result)
        except Exception as e:
            errors.append({
                "source": source_name,
                "error": str(e)
            })

    return {
        "success": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


@router.get("/postgres/students")
async def get_postgres_students(
    status: Optional[str] = None,
    major: Optional[str] = None,
    class_name: Optional[str] = None,
    limit: int = 100
):
    """从 PostgreSQL 获取学生数据"""
    source = DataSourceRegistry.get_source("postgresql")
    if not source:
        raise HTTPException(status_code=404, detail="PostgreSQL 数据源不存在")

    try:
        result = source.fetch_data(
            data_type="students",
            params={
                "status": status,
                "major": major,
                "class_name": class_name,
                "limit": limit
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/postgres/grades")
async def get_postgres_grades(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 500
):
    """从 PostgreSQL 获取成绩数据"""
    source = DataSourceRegistry.get_source("postgresql")
    if not source:
        raise HTTPException(status_code=404, detail="PostgreSQL 数据源不存在")

    try:
        params = {
            "student_id": student_id,
            "course_id": course_id,
            "chapter_id": chapter_id,
            "limit": limit
        }
        if start_date:
            params["start_date"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            params["end_date"] = datetime.combine(end_date, datetime.max.time())

        result = source.fetch_data(
            data_type="grades",
            params=params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/postgres/chapter-stats")
async def get_postgres_chapter_stats(
    course_id: Optional[int] = None
):
    """从 PostgreSQL 获取章节统计数据"""
    source = DataSourceRegistry.get_source("postgresql")
    if not source:
        raise HTTPException(status_code=404, detail="PostgreSQL 数据源不存在")

    try:
        result = source.fetch_data(
            data_type="chapters",
            params={"course_id": course_id}
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/live-platform/student-stats")
async def get_live_platform_student_stats(
    start_date: Optional[date] = None,
    limit: int = 100
):
    """从直播平台获取学生直播学习统计"""
    source = DataSourceRegistry.get_source("live_platform")
    if not source:
        raise HTTPException(status_code=404, detail="直播平台数据源不存在")

    try:
        params = {"limit": limit}
        if start_date:
            params["start_date"] = datetime.combine(start_date, datetime.min.time())

        result = source.fetch_data(
            data_type="student_live_stats",
            params=params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/live-platform/statistics")
async def get_live_platform_statistics(
    course_id: Optional[int] = None,
    live_id: Optional[str] = None
):
    """从直播平台获取直播统计数据"""
    source = DataSourceRegistry.get_source("live_platform")
    if not source:
        raise HTTPException(status_code=404, detail="直播平台数据源不存在")

    try:
        result = source.fetch_data(
            data_type="statistics",
            params={
                "course_id": course_id,
                "live_id": live_id
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/employment/salary-analysis")
async def get_employment_salary_analysis(
    year: Optional[int] = None,
    major: Optional[str] = None
):
    """从就业表获取薪资分析数据"""
    source = DataSourceRegistry.get_source("employment")
    if not source:
        raise HTTPException(status_code=404, detail="就业表数据源不存在")

    try:
        result = source.fetch_data(
            data_type="salary_analysis",
            params={
                "year": year,
                "major": major
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/employment/statistics")
async def get_employment_statistics(
    year: Optional[int] = None,
    major: Optional[str] = None
):
    """从就业表获取就业统计数据"""
    source = DataSourceRegistry.get_source("employment")
    if not source:
        raise HTTPException(status_code=404, detail="就业表数据源不存在")

    try:
        result = source.fetch_data(
            data_type="statistics",
            params={
                "year": year,
                "major": major
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/lms/student-trace/{student_id}")
async def get_lms_student_trace(
    student_id: str,
    limit: int = 200
):
    """从 LMS 获取学生学习追溯数据"""
    source = DataSourceRegistry.get_source("lms")
    if not source:
        raise HTTPException(status_code=404, detail="LMS 数据源不存在")

    try:
        result = source.fetch_data(
            data_type="student_trace",
            params={
                "student_id": student_id,
                "limit": limit
            }
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")


@router.get("/lms/activity-logs")
async def get_lms_activity_logs(
    student_id: Optional[str] = None,
    course_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 1000
):
    """从 LMS 获取学习活动日志"""
    source = DataSourceRegistry.get_source("lms")
    if not source:
        raise HTTPException(status_code=404, detail="LMS 数据源不存在")

    try:
        params = {
            "student_id": student_id,
            "course_id": course_id,
            "activity_type": activity_type,
            "limit": limit
        }
        if start_date:
            params["start_date"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            params["end_date"] = datetime.combine(end_date, datetime.max.time())

        result = source.fetch_data(
            data_type="activity_logs",
            params=params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据获取失败: {str(e)}")
