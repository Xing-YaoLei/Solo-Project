from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from typing import Dict, List, Optional, Any
from datetime import date, timedelta
from ..models import (
    MaterialDistribution, Student, Textbook, Course, CourseChapter,
    Enrollment, AcademicRecord, Homework, Region, AlertThreshold, NoteTask
)
from ..core.redis_client import get_redis
import json


class FunnelService:
    """教材发放漏斗服务 - 计算完成率、进度、分布等核心指标"""

    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis()

    def get_funnel_overview(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> Dict[str, Any]:
        """获取漏斗总览数据"""
        cache_key = f"funnel:overview:{course_id}:{region_id}:{date_from}:{date_to}"
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        total_enrolled = self._get_total_enrolled(course_id, region_id, date_from, date_to)
        pending = self._get_distribution_count('pending', course_id, region_id, date_from, date_to)
        distributed = self._get_distribution_count('distributed', course_id, region_id, date_from, date_to)
        received = self._get_distribution_count('received', course_id, region_id, date_to, date_to)
        returned = self._get_distribution_count('returned', course_id, region_id, date_from, date_to)

        completion_rate = round((received / total_enrolled * 100), 2) if total_enrolled > 0 else 0.0
        distribution_rate = round((distributed / total_enrolled * 100), 2) if total_enrolled > 0 else 0.0

        result = {
            "total_enrolled": total_enrolled,
            "pending": pending,
            "distributed": distributed,
            "received": received,
            "returned": returned,
            "distribution_rate": distribution_rate,
            "completion_rate": completion_rate,
            "funnel_steps": [
                {"step": "报名人数", "count": total_enrolled, "rate": 100.0},
                {"step": "待发放", "count": pending, "rate": round(pending / total_enrolled * 100, 2) if total_enrolled > 0 else 0},
                {"step": "已发放", "count": distributed, "rate": distribution_rate},
                {"step": "已签收", "count": received, "rate": completion_rate},
            ]
        }

        self.redis.setex(cache_key, 300, json.dumps(result))
        return result

    def get_chapter_funnel(
        self,
        course_id: int,
        region_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """按课程章节统计漏斗数据"""
        chapters = self.db.query(CourseChapter).filter(
            CourseChapter.course_id == course_id,
            CourseChapter.has_textbook == True
        ).order_by(CourseChapter.chapter_no).all()

        result = []
        total_enrolled = self._get_total_enrolled(course_id, region_id)

        for chapter in chapters:
            distributed = self.db.query(MaterialDistribution).filter(
                MaterialDistribution.course_id == course_id,
                MaterialDistribution.chapter_id == chapter.id,
                MaterialDistribution.status.in_(['distributed', 'received'])
            ).count()

            received = self.db.query(MaterialDistribution).filter(
                MaterialDistribution.course_id == course_id,
                MaterialDistribution.chapter_id == chapter.id,
                MaterialDistribution.status == 'received'
            ).count()

            result.append({
                "chapter_id": chapter.id,
                "chapter_no": chapter.chapter_no,
                "chapter_title": chapter.title,
                "total_enrolled": total_enrolled,
                "distributed": distributed,
                "received": received,
                "distribution_rate": round(distributed / total_enrolled * 100, 2) if total_enrolled > 0 else 0,
                "completion_rate": round(received / total_enrolled * 100, 2) if total_enrolled > 0 else 0
            })

        return result

    def get_funnel_by_region(
        self,
        course_id: Optional[int] = None,
        level: str = "city"
    ) -> List[Dict[str, Any]]:
        """按区域统计漏斗数据（Mapbox 地图数据）"""
        regions = self.db.query(Region).filter(Region.level == level).all()

        result = []
        for region in regions:
            total = self._get_total_enrolled(course_id, region.id)
            received = self._get_distribution_count('received', course_id, region.id)
            completion_rate = round(received / total * 100, 2) if total > 0 else 0

            result.append({
                "region_id": region.id,
                "region_name": region.name,
                "region_code": region.code,
                "total_enrolled": total,
                "received": received,
                "completion_rate": completion_rate,
            })

        return result

    def get_funnel_trend(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """获取漏斗趋势数据（按天）"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        result = []
        current = start_date
        while current <= end_date:
            total = self._get_total_enrolled(course_id, region_id, date_to=current)
            received = self._get_distribution_count('received', course_id, region_id, date_to=current)
            completion_rate = round(received / total * 100, 2) if total > 0 else 0

            result.append({
                "date": current.isoformat(),
                "total_enrolled": total,
                "received": received,
                "completion_rate": completion_rate
            })
            current += timedelta(days=1)

        return result

    def get_delayed_distributions(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取延迟发放列表"""
        query = self.db.query(MaterialDistribution).filter(
            MaterialDistribution.is_delayed == True
        )

        if course_id:
            query = query.filter(MaterialDistribution.course_id == course_id)

        query = query.order_by(MaterialDistribution.distribute_date.desc()).limit(100)
        distributions = query.all()

        result = []
        for d in distributions:
            result.append({
                "id": d.id,
                "distribution_no": d.distribution_no,
                "student_name": d.student.name if d.student else "",
                "textbook_title": d.textbook.title if d.textbook else "",
                "status": d.status,
                "distribute_date": d.distribute_date.isoformat() if d.distribute_date else None,
                "delay_reason": d.delay_reason,
                "channel": d.channel
            })

        return result

    def _get_total_enrolled(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> int:
        """获取报名总人数"""
        query = self.db.query(func.count(Enrollment.id.distinct())).filter(
            Enrollment.status == 'active'
        )

        if course_id:
            query = query.filter(Enrollment.course_id == course_id)

        if region_id:
            query = query.join(Student).filter(Student.region_id == region_id)

        if date_from:
            query = query.filter(Enrollment.enrollment_date >= date_from)

        if date_to:
            query = query.filter(Enrollment.enrollment_date <= date_to)

        return query.scalar() or 0

    def _get_distribution_count(
        self,
        status: str,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> int:
        """获取指定状态的发放数量"""
        query = self.db.query(func.count(MaterialDistribution.id.distinct())).filter(
            MaterialDistribution.status == status
        )

        if course_id:
            query = query.filter(MaterialDistribution.course_id == course_id)

        if region_id:
            query = query.join(Student).filter(Student.region_id == region_id)

        if status == 'distributed':
            date_field = MaterialDistribution.distribute_date
        elif status == 'received':
            date_field = MaterialDistribution.receive_date
        else:
            date_field = None

        if date_field and date_from:
            query = query.filter(date_field >= date_from)

        if date_field and date_to:
            query = query.filter(date_field <= date_to)

        return query.scalar() or 0

    def invalidate_cache(self, pattern: str = "funnel:*"):
        """清除漏斗缓存"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)


def get_funnel_service(db: Session) -> FunnelService:
    return FunnelService(db)
