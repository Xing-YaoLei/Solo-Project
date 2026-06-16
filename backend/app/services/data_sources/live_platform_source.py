from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from .base import DataSourceConnector
from ...models.live_platform import LiveCourse, LiveViewRecord, LiveInteraction, LiveStatistics
from ...core.database import SessionLocal


class LivePlatformDataSource(DataSourceConnector):
    def __init__(self):
        self.name = "live_platform"
        self.description = "直播平台数据（观看记录、互动数据）"
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

            if data_type in ["all", "live_courses"]:
                result["live_courses"] = self._get_live_courses(db, params)

            if data_type in ["all", "view_records"]:
                result["view_records"] = self._get_view_records(db, params)

            if data_type in ["all", "interactions"]:
                result["interactions"] = self._get_interactions(db, params)

            if data_type in ["all", "statistics"]:
                result["statistics"] = self._get_statistics(db, params)

            if data_type in ["all", "student_live_stats"]:
                result["student_live_stats"] = self._get_student_live_stats(db, params)

            result["source"] = self.name
            result["fetched_at"] = datetime.utcnow().isoformat()

            return result
        finally:
            db.close()

    def _get_live_courses(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LiveCourse)

        if params.get("course_id"):
            query = query.filter(LiveCourse.course_id == params["course_id"])

        if params.get("status"):
            query = query.filter(LiveCourse.status == params["status"])

        if params.get("start_date"):
            query = query.filter(LiveCourse.start_time >= params["start_date"])

        if params.get("end_date"):
            query = query.filter(LiveCourse.end_time <= params["end_date"])

        total = query.count()
        courses = query.order_by(LiveCourse.start_time.desc()).limit(params.get("limit", 100)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": c.id,
                    "live_id": c.live_id,
                    "course_id": c.course_id,
                    "title": c.title,
                    "instructor": c.instructor,
                    "start_time": c.start_time.isoformat() if c.start_time else None,
                    "end_time": c.end_time.isoformat() if c.end_time else None,
                    "status": c.status,
                    "max_viewers": c.max_viewers
                }
                for c in courses
            ]
        }

    def _get_view_records(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LiveViewRecord)

        if params.get("live_id"):
            query = query.filter(LiveViewRecord.live_id == params["live_id"])

        if params.get("student_id"):
            query = query.filter(LiveViewRecord.student_id == params["student_id"])

        if params.get("is_complete") is not None:
            query = query.filter(LiveViewRecord.is_complete == params["is_complete"])

        if params.get("start_date"):
            query = query.filter(LiveViewRecord.join_time >= params["start_date"])

        total = query.count()
        records = query.order_by(LiveViewRecord.join_time.desc()).limit(params.get("limit", 500)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": r.id,
                    "live_id": r.live_id,
                    "student_id": r.student_id,
                    "student_name": r.student_name,
                    "join_time": r.join_time.isoformat() if r.join_time else None,
                    "leave_time": r.leave_time.isoformat() if r.leave_time else None,
                    "watch_duration": r.watch_duration,
                    "is_complete": r.is_complete,
                    "device": r.device
                }
                for r in records
            ]
        }

    def _get_interactions(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LiveInteraction)

        if params.get("live_id"):
            query = query.filter(LiveInteraction.live_id == params["live_id"])

        if params.get("student_id"):
            query = query.filter(LiveInteraction.student_id == params["student_id"])

        if params.get("interaction_type"):
            query = query.filter(LiveInteraction.interaction_type == params["interaction_type"])

        if params.get("start_date"):
            query = query.filter(LiveInteraction.timestamp >= params["start_date"])

        total = query.count()
        interactions = query.order_by(LiveInteraction.timestamp.desc()).limit(params.get("limit", 500)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": i.id,
                    "live_id": i.live_id,
                    "student_id": i.student_id,
                    "student_name": i.student_name,
                    "interaction_type": i.interaction_type,
                    "content": i.content,
                    "timestamp": i.timestamp.isoformat() if i.timestamp else None,
                    "is_answered": i.is_answered
                }
                for i in interactions
            ]
        }

    def _get_statistics(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LiveStatistics)

        if params.get("course_id"):
            query = query.filter(LiveStatistics.course_id == params["course_id"])

        if params.get("live_id"):
            query = query.filter(LiveStatistics.live_id == params["live_id"])

        total = query.count()
        stats = query.all()

        return {
            "total": total,
            "data": [
                {
                    "id": s.id,
                    "live_id": s.live_id,
                    "course_id": s.course_id,
                    "total_viewers": s.total_viewers,
                    "peak_viewers": s.peak_viewers,
                    "avg_watch_duration": s.avg_watch_duration,
                    "total_chat_messages": s.total_chat_messages,
                    "total_questions": s.total_questions,
                    "total_likes": s.total_likes
                }
                for s in stats
            ]
        }

    def _get_student_live_stats(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(
            LiveViewRecord.student_id,
            LiveViewRecord.student_name,
            func.count(LiveViewRecord.id).label("live_count"),
            func.sum(LiveViewRecord.watch_duration).label("total_watch_time"),
            func.avg(LiveViewRecord.watch_duration).label("avg_watch_time"),
            func.sum(func.case([(LiveViewRecord.is_complete == True, 1)], else_=0)).label("complete_count")
        )

        if params.get("start_date"):
            query = query.filter(LiveViewRecord.join_time >= params["start_date"])

        query = query.group_by(LiveViewRecord.student_id, LiveViewRecord.student_name)

        if params.get("limit"):
            query = query.limit(params["limit"])

        results = query.all()

        return {
            "total": len(results),
            "data": [
                {
                    "student_id": r.student_id,
                    "student_name": r.student_name,
                    "live_count": r.live_count,
                    "total_watch_time": r.total_watch_time or 0,
                    "avg_watch_time": round(float(r.avg_watch_time or 0), 2),
                    "complete_count": r.complete_count or 0,
                    "completion_rate": (r.complete_count / r.live_count * 100) if r.live_count > 0 else 0
                }
                for r in results
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
                        "live_courses": db.query(LiveCourse).count(),
                        "view_records": db.query(LiveViewRecord).count(),
                        "interactions": db.query(LiveInteraction).count(),
                        "statistics": db.query(LiveStatistics).count()
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
                    "live_courses": 0,
                    "view_records": 0,
                    "interactions": 0,
                    "statistics": 0
                }
            }

    def sync_data(self, **kwargs) -> Dict[str, Any]:
        self.last_sync = datetime.utcnow()
        return {
            "source": self.name,
            "synced_at": self.last_sync.isoformat(),
            "status": "success",
            "message": "直播平台数据同步完成"
        }
