from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from .base import DataSourceConnector
from ...models.lms import (
    LearningPath, LearningActivityLog, LearningMilestone,
    LearningAssessment, LearningRecommendation
)
from ...core.database import SessionLocal


class LMSDataSource(DataSourceConnector):
    def __init__(self):
        self.name = "lms"
        self.description = "LMS 学习管理系统（明细追溯数据）"
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

            if data_type in ["all", "learning_paths"]:
                result["learning_paths"] = self._get_learning_paths(db, params)

            if data_type in ["all", "activity_logs"]:
                result["activity_logs"] = self._get_activity_logs(db, params)

            if data_type in ["all", "milestones"]:
                result["milestones"] = self._get_milestones(db, params)

            if data_type in ["all", "assessments"]:
                result["assessments"] = self._get_assessments(db, params)

            if data_type in ["all", "recommendations"]:
                result["recommendations"] = self._get_recommendations(db, params)

            if data_type in ["all", "student_trace"]:
                result["student_trace"] = self._get_student_trace(db, params)

            result["source"] = self.name
            result["fetched_at"] = datetime.utcnow().isoformat()

            return result
        finally:
            db.close()

    def _get_learning_paths(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LearningPath)

        if params.get("student_id"):
            query = query.filter(LearningPath.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(LearningPath.course_id == params["course_id"])

        if params.get("status"):
            query = query.filter(LearningPath.status == params["status"])

        total = query.count()
        paths = query.order_by(LearningPath.updated_at.desc()).limit(params.get("limit", 100)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": p.id,
                    "path_id": p.path_id,
                    "student_id": p.student_id,
                    "student_name": p.student_name,
                    "course_id": p.course_id,
                    "course_name": p.course_name,
                    "current_chapter": p.current_chapter,
                    "progress": p.progress,
                    "status": p.status,
                    "estimated_completion_date": p.estimated_completion_date.isoformat() if p.estimated_completion_date else None,
                    "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None
                }
                for p in paths
            ]
        }

    def _get_activity_logs(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LearningActivityLog)

        if params.get("student_id"):
            query = query.filter(LearningActivityLog.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(LearningActivityLog.course_id == params["course_id"])

        if params.get("activity_type"):
            query = query.filter(LearningActivityLog.activity_type == params["activity_type"])

        if params.get("start_date"):
            query = query.filter(LearningActivityLog.start_time >= params["start_date"])

        if params.get("end_date"):
            query = query.filter(LearningActivityLog.end_time <= params["end_date"])

        total = query.count()
        logs = query.order_by(LearningActivityLog.start_time.desc()).limit(params.get("limit", 1000)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": l.id,
                    "log_id": l.log_id,
                    "student_id": l.student_id,
                    "student_name": l.student_name,
                    "course_id": l.course_id,
                    "course_name": l.course_name,
                    "chapter_id": l.chapter_id,
                    "chapter_name": l.chapter_name,
                    "activity_type": l.activity_type,
                    "activity_content": l.activity_content,
                    "resource_type": l.resource_type,
                    "resource_id": l.resource_id,
                    "start_time": l.start_time.isoformat() if l.start_time else None,
                    "end_time": l.end_time.isoformat() if l.end_time else None,
                    "duration": l.duration,
                    "is_complete": l.is_complete,
                    "score": l.score,
                    "ip_address": l.ip_address
                }
                for l in logs
            ]
        }

    def _get_milestones(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LearningMilestone)

        if params.get("student_id"):
            query = query.filter(LearningMilestone.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(LearningMilestone.course_id == params["course_id"])

        if params.get("milestone_type"):
            query = query.filter(LearningMilestone.milestone_type == params["milestone_type"])

        total = query.count()
        milestones = query.order_by(LearningMilestone.achieved_at.desc()).limit(params.get("limit", 500)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": m.id,
                    "milestone_id": m.milestone_id,
                    "student_id": m.student_id,
                    "course_id": m.course_id,
                    "milestone_name": m.milestone_name,
                    "milestone_type": m.milestone_type,
                    "description": m.description,
                    "achieved_at": m.achieved_at.isoformat() if m.achieved_at else None,
                    "reward_points": m.reward_points
                }
                for m in milestones
            ]
        }

    def _get_assessments(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LearningAssessment)

        if params.get("student_id"):
            query = query.filter(LearningAssessment.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(LearningAssessment.course_id == params["course_id"])

        if params.get("chapter_id"):
            query = query.filter(LearningAssessment.chapter_id == params["chapter_id"])

        if params.get("assessment_type"):
            query = query.filter(LearningAssessment.assessment_type == params["assessment_type"])

        if params.get("start_date"):
            query = query.filter(LearningAssessment.created_at >= params["start_date"])

        total = query.count()
        assessments = query.order_by(LearningAssessment.created_at.desc()).limit(params.get("limit", 500)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": a.id,
                    "assessment_id": a.assessment_id,
                    "student_id": a.student_id,
                    "course_id": a.course_id,
                    "chapter_id": a.chapter_id,
                    "assessment_type": a.assessment_type,
                    "total_score": a.total_score,
                    "earned_score": a.earned_score,
                    "passed": a.passed,
                    "attempt_count": a.attempt_count,
                    "time_spent": a.time_spent,
                    "feedback": a.feedback,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in assessments
            ]
        }

    def _get_recommendations(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        query = db.query(LearningRecommendation)

        if params.get("student_id"):
            query = query.filter(LearningRecommendation.student_id == params["student_id"])

        if params.get("course_id"):
            query = query.filter(LearningRecommendation.course_id == params["course_id"])

        if params.get("priority"):
            query = query.filter(LearningRecommendation.priority == params["priority"])

        if params.get("is_viewed") is not None:
            query = query.filter(LearningRecommendation.is_viewed == params["is_viewed"])

        total = query.count()
        recommendations = query.order_by(LearningRecommendation.created_at.desc()).limit(params.get("limit", 200)).all()

        return {
            "total": total,
            "data": [
                {
                    "id": r.id,
                    "student_id": r.student_id,
                    "course_id": r.course_id,
                    "recommendation_type": r.recommendation_type,
                    "content": r.content,
                    "reason": r.reason,
                    "priority": r.priority,
                    "is_viewed": r.is_viewed,
                    "is_accepted": r.is_accepted,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "expires_at": r.expires_at.isoformat() if r.expires_at else None
                }
                for r in recommendations
            ]
        }

    def _get_student_trace(self, db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
        student_id = params.get("student_id")
        if not student_id:
            return {"total": 0, "data": []}

        activities = db.query(LearningActivityLog).filter(
            LearningActivityLog.student_id == student_id
        ).order_by(LearningActivityLog.start_time.desc()).limit(params.get("limit", 200)).all()

        assessments = db.query(LearningAssessment).filter(
            LearningAssessment.student_id == student_id
        ).order_by(LearningAssessment.created_at.desc()).limit(50).all()

        milestones = db.query(LearningMilestone).filter(
            LearningMilestone.student_id == student_id
        ).order_by(LearningMilestone.achieved_at.desc()).limit(50).all()

        total_duration = sum(a.duration for a in activities)
        total_assessments = len(assessments)
        passed_assessments = sum(1 for a in assessments if a.passed)
        total_milestones = len(milestones)

        return {
            "student_id": student_id,
            "summary": {
                "total_activities": len(activities),
                "total_duration": total_duration,
                "total_assessments": total_assessments,
                "passed_assessments": passed_assessments,
                "pass_rate": (passed_assessments / total_assessments * 100) if total_assessments > 0 else 0,
                "total_milestones": total_milestones,
                "total_reward_points": sum(m.reward_points for m in milestones)
            },
            "activity_timeline": [
                {
                    "timestamp": a.start_time.isoformat() if a.start_time else None,
                    "type": "activity",
                    "activity_type": a.activity_type,
                    "course_name": a.course_name,
                    "chapter_name": a.chapter_name,
                    "duration": a.duration,
                    "is_complete": a.is_complete
                }
                for a in activities
            ],
            "assessment_history": [
                {
                    "timestamp": a.created_at.isoformat() if a.created_at else None,
                    "type": "assessment",
                    "assessment_type": a.assessment_type,
                    "course_id": a.course_id,
                    "chapter_id": a.chapter_id,
                    "total_score": a.total_score,
                    "earned_score": a.earned_score,
                    "passed": a.passed,
                    "attempt_count": a.attempt_count
                }
                for a in assessments
            ],
            "milestone_history": [
                {
                    "timestamp": m.achieved_at.isoformat() if m.achieved_at else None,
                    "type": "milestone",
                    "milestone_name": m.milestone_name,
                    "milestone_type": m.milestone_type,
                    "reward_points": m.reward_points
                }
                for m in milestones
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
                        "learning_paths": db.query(LearningPath).count(),
                        "activity_logs": db.query(LearningActivityLog).count(),
                        "milestones": db.query(LearningMilestone).count(),
                        "assessments": db.query(LearningAssessment).count(),
                        "recommendations": db.query(LearningRecommendation).count()
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
                    "learning_paths": 0,
                    "activity_logs": 0,
                    "milestones": 0,
                    "assessments": 0,
                    "recommendations": 0
                }
            }

    def sync_data(self, **kwargs) -> Dict[str, Any]:
        self.last_sync = datetime.utcnow()
        return {
            "source": self.name,
            "synced_at": self.last_sync.isoformat(),
            "status": "success",
            "message": "LMS 数据同步完成"
        }
