from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict, Optional, Any
from datetime import date, timedelta
from ..models import AcademicRecord, Homework, Student, Course, CourseChapter


class GradeService:
    """成绩反馈服务 - 成绩分析、作业完成情况"""

    def __init__(self, db: Session):
        self.db = db

    def get_grade_overview(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """获取成绩总览"""
        query = self.db.query(AcademicRecord).join(Student)
        if course_id:
            query = query.filter(AcademicRecord.course_id == course_id)
        if region_id:
            query = query.filter(Student.region_id == region_id)

        total = query.count()

        avg_score = self.db.query(func.avg(AcademicRecord.score))
        if course_id:
            avg_score = avg_score.filter(AcademicRecord.course_id == course_id)
        avg_score = avg_score.scalar() or 0

        grade_distribution = self._get_grade_distribution(course_id, region_id)

        excellent_rate = grade_distribution.get('优秀', 0) + grade_distribution.get('良好', 0)

        return {
            "total_students": total,
            "avg_score": round(avg_score, 2),
            "excellent_rate": round(excellent_rate, 2),
            "grade_distribution": grade_distribution
        }

    def _get_grade_distribution(
        self,
        course_id: Optional[int],
        region_id: Optional[int]
    ) -> Dict[str, float]:
        """获取成绩等级分布"""
        query = self.db.query(
            AcademicRecord.grade_level,
            func.count(AcademicRecord.id)
        ).join(Student)

        if course_id:
            query = query.filter(AcademicRecord.course_id == course_id)
        if region_id:
            query = query.filter(Student.region_id == region_id)

        query = query.group_by(AcademicRecord.grade_level)
        results = query.all()

        total = sum(count for _, count in results) or 1
        distribution = {}
        for level, count in results:
            if level:
                distribution[level] = round(count / total * 100, 2)

        return distribution

    def get_homework_stats(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """获取作业统计"""
        query = self.db.query(Homework).join(Student)
        if course_id:
            query = query.filter(Homework.course_id == course_id)
        if region_id:
            query = query.filter(Student.region_id == region_id)

        total = query.count() or 1
        submitted = query.filter(Homework.is_submitted == True).count()
        late = query.filter(Homework.is_late == True).count()

        avg_score = self.db.query(func.avg(Homework.score))
        if course_id:
            avg_score = avg_score.filter(Homework.course_id == course_id)
        avg_score = avg_score.scalar() or 0

        return {
            "total_assignments": total,
            "submitted_count": submitted,
            "submit_rate": round(submitted / total * 100, 2),
            "late_count": late,
            "late_rate": round(late / total * 100, 2),
            "avg_score": round(avg_score, 2)
        }

    def get_chapter_grades(
        self,
        course_id: int,
        region_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """按章节获取成绩分布"""
        chapters = self.db.query(CourseChapter).filter(
            CourseChapter.course_id == course_id
        ).order_by(CourseChapter.chapter_no).all()

        result = []
        for chapter in chapters:
            query = self.db.query(AcademicRecord).filter(
                AcademicRecord.chapter_id == chapter.id
            ).join(Student)

            if region_id:
                query = query.filter(Student.region_id == region_id)

            total = query.count() or 1
            avg_score = query.with_entities(func.avg(AcademicRecord.score)).scalar() or 0

            result.append({
                "chapter_id": chapter.id,
                "chapter_no": chapter.chapter_no,
                "chapter_title": chapter.title,
                "student_count": total,
                "avg_score": round(avg_score, 2)
            })

        return result

    def get_score_trend(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """获取成绩趋势"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)

        query = self.db.query(
            AcademicRecord.record_date,
            func.avg(AcademicRecord.score)
        ).join(Student)

        if course_id:
            query = query.filter(AcademicRecord.course_id == course_id)
        if region_id:
            query = query.filter(Student.region_id == region_id)

        query = query.filter(
            AcademicRecord.record_date >= start_date,
            AcademicRecord.record_date <= end_date
        ).group_by(AcademicRecord.record_date).order_by(AcademicRecord.record_date)

        results = query.all()

        date_map = {d.isoformat(): round(s, 2) if s else 0 for d, s in results}

        trend = []
        current = start_date
        while current <= end_date:
            trend.append({
                "date": current.isoformat(),
                "avg_score": date_map.get(current.isoformat(), None)
            })
            current += timedelta(days=1)

        return trend


def get_grade_service(db: Session) -> GradeService:
    return GradeService(db)
