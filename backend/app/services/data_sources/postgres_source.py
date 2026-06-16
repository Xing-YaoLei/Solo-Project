from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from .base import DataSourceConnector
from ...models.education import Student, Course, Chapter, Question, Grade, Enrollment
from ...core.database import SessionLocal


class PostgresDataSource(DataSourceConnector):
    def __init__(self):
        self.name = "postgresql"
        self.description = "PostgreSQL 主数据库（学生、课程、成绩数据）"
        self.last_sync = None

    def get_name(self) -> str:
        return self.name

    def _get_db(self) -> Session:
        return SessionLocal()

    def fetch_data(self, **kwargs) -> Dict[str, Any]:
        data_type = kwargs.get("data_type", "all")
        params = kwargs.get("params", {})

        db = self._get_db()
        try:
            result = {}

            if data_type in ["all", "students"]:
                result["students"] = self._get_students(db, params)

            if data_type in ["all", "courses"]:
                result["courses"] = self._get_courses(db, params)

            if data_type in ["all", "grades"]:
                result["grades"] = self._get_grades(db, params)

            if data_type in ["all", "chapters"]:
                result["chapters"] = self._get_chapter_stats(db, params)

            if data_type in ["all", "enrollments"]:
                result["enrollments"] = self._get_enrollment_stats(db, params)

            result["source"] = self.name
            result["fetched_at"] = datetime.utcnow().isoformat()

            return result
        finally:
            db.close()

    def _get_students(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(Student)

        if params.get("status"):
            query = query.filter(Student.status == params["status"])

        if params.get("major"):
            query = query.filter(Student.major == params["major"])

        if params.get("class_name"):
            query = query.filter(Student.class_name == params["class_name"])

        total = query.count()
        students = query.limit(params.get("limit", 100)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": s.id,
                    "student_no": s.student_no,
                    "name": s.name,
                    "gender": s.gender,
                    "major": s.major,
                    "class_name": s.class_name,
                    "enrollment_date": s.enrollment_date.isoformat() if s.enrollment_date else None,
                    "status": s.status
                }
                for s in students
            ]
        }

    def _get_courses(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(Course).filter(Course.is_active == True)

        if params.get("department"):
            query = query.filter(Course.department == params["department"])

        total = query.count()
        courses = query.all()

        return {
            "total": total,
            "data": [
                {
                    "id": c.id,
                    "course_code": c.course_code,
                    "course_name": c.course_name,
                    "credit": c.credit,
                    "total_hours": c.total_hours,
                    "instructor": c.instructor,
                    "department": c.department
                }
                for c in courses
            ]
        }

    def _get_grades(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(Grade)

        if params.get("student_id"):
            query = query.filter(Grade.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(Grade.course_id == params["course_id"])

        if params.get("chapter_id"):
            query = query.filter(Grade.chapter_id == params["chapter_id"])

        if params.get("start_date"):
            query = query.filter(Grade.submit_time >= params["start_date"])

        if params.get("end_date"):
            query = query.filter(Grade.submit_time <= params["end_date"])

        total = query.count()
        grades = query.order_by(Grade.submit_time.desc()).limit(params.get("limit", 500)).all()

        passed_count = sum(1 for g in grades if g.is_passed)
        avg_score = sum(g.score for g in grades) / len(grades) if grades else 0

        return {
            "total": total,
            "passed_count": passed_count,
            "passed_rate": passed_count / total * 100 if total > 0 else 0,
            "avg_score": round(avg_score, 2),
            "data": [
                {
                    "id": g.id,
                    "student_id": g.student_id,
                    "course_id": g.course_id,
                    "chapter_id": g.chapter_id,
                    "score": g.score,
                    "total_questions": g.total_questions,
                    "correct_count": g.correct_count,
                    "time_spent": g.time_spent,
                    "submit_time": g.submit_time.isoformat() if g.submit_time else None,
                    "is_passed": g.is_passed,
                    "attempt_count": g.attempt_count
                }
                for g in grades
            ]
        }

    def _get_chapter_stats(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(
            Chapter.chapter_name,
            Chapter.sort_order,
            Chapter.total_questions,
            func.count(Grade.id).label("submission_count"),
            func.avg(Grade.score).label("avg_score"),
            func.sum(func.case([(Grade.is_passed == True, 1)], else_=0)).label("passed_count"),
            func.count(Grade.id.distinct()).label("student_count")
        ).select_from(Chapter).outerjoin(Grade, Chapter.id == Grade.chapter_id)

        if params.get("course_id"):
            query = query.filter(Chapter.course_id == params["course_id"])

        query = query.group_by(Chapter.id).order_by(Chapter.sort_order)

        chapters = query.all()

        return {
            "total": len(chapters),
            "data": [
                {
                    "chapter_name": c.chapter_name,
                    "sort_order": c.sort_order,
                    "total_questions": c.total_questions,
                    "submission_count": c.submission_count or 0,
                    "student_count": c.student_count or 0,
                    "avg_score": round(float(c.avg_score or 0), 2),
                    "passed_count": c.passed_count or 0,
                    "completion_rate": (c.passed_count / c.student_count * 100) if c.student_count and c.student_count > 0 else 0
                }
                for c in chapters
            ]
        }

    def _get_enrollment_stats(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(Enrollment)

        if params.get("course_id"):
            query = query.filter(Enrollment.course_id == params["course_id"])

        if params.get("status"):
            query = query.filter(Enrollment.status == params["status"])

        total = query.count()
        enrollments = query.all()

        avg_progress = sum(e.progress for e in enrollments) / len(enrollments) if enrollments else 0

        return {
            "total": total,
            "avg_progress": round(avg_progress, 2),
            "data": [
                {
                    "id": e.id,
                    "student_id": e.student_id,
                    "course_id": e.course_id,
                    "progress": e.progress,
                    "status": e.status,
                    "completed_chapters": e.completed_chapters,
                    "total_chapters": e.total_chapters,
                    "enrollment_date": e.enrollment_date.isoformat() if e.enrollment_date else None,
                    "last_activity_at": e.last_activity_at.isoformat() if e.last_activity_at else None
                }
                for e in enrollments
            ]
        }

    def get_sync_status(self) -> Dict[str, Any]:
        try:
            db = self._get_db()
            try:
                return {
                    "name": self.name,
                    "description": self.description,
                    "status": "connected",
                    "last_sync": self.last_sync.isoformat() if self.last_sync else None,
                    "record_count": {
                        "students": db.query(Student).count(),
                        "courses": db.query(Course).count(),
                        "chapters": db.query(Chapter).count(),
                        "questions": db.query(Question).count(),
                        "grades": db.query(Grade).count(),
                        "enrollments": db.query(Enrollment).count()
                    }
                }
            finally:
                db.close()
        except Exception as e:
            return {
                "name": self.name,
                "description": self.description,
                "status": "disconnected",
                "last_sync": self.last_sync.isoformat() if self.last_sync else None,
                "error": str(e),
                "record_count": {
                    "students": 0,
                    "courses": 0,
                    "chapters": 0,
                    "questions": 0,
                    "grades": 0,
                    "enrollments": 0
                }
            }

    def sync_data(self, **kwargs) -> Dict[str, Any]:
        self.last_sync = datetime.utcnow()
        return {
            "source": self.name,
            "synced_at": self.last_sync.isoformat(),
            "status": "success",
            "message": "PostgreSQL 数据同步完成"
        }
