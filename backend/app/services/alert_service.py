from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from ..models import AlertThreshold, MaterialDistribution, Student, Course, NoteTask, Enrollment
from .funnel_service import FunnelService
from ..core.redis_client import get_redis
import json
import uuid


class AlertService:
    """预警服务 - 阈值管理、预警检测、备注任务生成"""

    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis()
        self.funnel_service = FunnelService(db)

    def get_thresholds(
        self,
        type: Optional[str] = None,
        is_active: bool = True
    ) -> List[AlertThreshold]:
        """获取预警阈值列表"""
        query = self.db.query(AlertThreshold)
        if type:
            query = query.filter(AlertThreshold.type == type)
        if is_active is not None:
            query = query.filter(AlertThreshold.is_active == is_active)
        return query.order_by(AlertThreshold.level.desc()).all()

    def create_threshold(self, data: Dict[str, Any]) -> AlertThreshold:
        """创建预警阈值"""
        threshold = AlertThreshold(**data)
        self.db.add(threshold)
        self.db.commit()
        self.db.refresh(threshold)
        return threshold

    def update_threshold(self, threshold_id: int, data: Dict[str, Any]) -> Optional[AlertThreshold]:
        """更新预警阈值"""
        threshold = self.db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
        if not threshold:
            return None
        for key, value in data.items():
            setattr(threshold, key, value)
        self.db.commit()
        self.db.refresh(threshold)
        return threshold

    def delete_threshold(self, threshold_id: int) -> bool:
        """删除预警阈值"""
        threshold = self.db.query(AlertThreshold).filter(AlertThreshold.id == threshold_id).first()
        if not threshold:
            return False
        self.db.delete(threshold)
        self.db.commit()
        return True

    def check_alerts(
        self,
        course_id: Optional[int] = None,
        region_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """检测预警 - 检查所有阈值是否命中"""
        thresholds = self.get_thresholds(is_active=True)
        alerts = []

        for threshold in thresholds:
            if threshold.course_id and course_id and threshold.course_id != course_id:
                continue
            if threshold.region_id and region_id and threshold.region_id != region_id:
                continue

            hit = self._check_threshold(threshold, course_id, region_id)
            if hit:
                alerts.append(hit)

        return alerts

    def _check_threshold(
        self,
        threshold: AlertThreshold,
        course_id: Optional[int],
        region_id: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """检查单个阈值是否命中"""
        actual_course = threshold.course_id or course_id
        actual_region = threshold.region_id or region_id

        if threshold.type == 'completion_rate':
            funnel = self.funnel_service.get_funnel_overview(
                course_id=actual_course,
                region_id=actual_region
            )
            actual_value = funnel['completion_rate']
        elif threshold.type == 'delay_days':
            delayed = self.funnel_service.get_delayed_distributions(
                course_id=actual_course,
                region_id=actual_region
            )
            actual_value = len(delayed)
        elif threshold.type == 'homework_rate':
            actual_value = self._get_homework_submit_rate(actual_course, actual_region)
        else:
            return None

        is_alert = self._compare(actual_value, threshold.threshold_value, threshold.operator)

        if is_alert:
            return {
                "threshold_id": threshold.id,
                "threshold_name": threshold.name,
                "type": threshold.type,
                "level": threshold.level,
                "threshold_value": threshold.threshold_value,
                "actual_value": actual_value,
                "operator": threshold.operator,
                "course_id": actual_course,
                "region_id": actual_region
            }
        return None

    def _compare(self, actual: float, threshold: float, operator: str) -> bool:
        """比较实际值与阈值"""
        if operator == 'lt':
            return actual < threshold
        elif operator == 'gt':
            return actual > threshold
        elif operator == 'eq':
            return actual == threshold
        elif operator == 'lte':
            return actual <= threshold
        elif operator == 'gte':
            return actual >= threshold
        return False

    def _get_homework_submit_rate(self, course_id: Optional[int], region_id: Optional[int]) -> float:
        """获取作业提交率"""
        from ..models import Homework
        from sqlalchemy import func

        query = self.db.query(
            func.count(Homework.id),
            func.sum(case((Homework.is_submitted == True, 1), else_=0))
        )
        if course_id:
            query = query.filter(Homework.course_id == course_id)
        if region_id:
            query = query.join(Student).filter(Student.region_id == region_id)

        total, submitted = query.first()
        return round(submitted / total * 100, 2) if total > 0 else 0.0

    def generate_note_task(
        self,
        alert: Dict[str, Any],
        created_by: str = "system"
    ) -> NoteTask:
        """命中预警后生成备注任务"""
        task_no = f"NT{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

        task = NoteTask(
            task_no=task_no,
            type=alert['type'],
            title=f"【{alert['level']}】{alert['threshold_name']}",
            content=f"预警触发：{alert['threshold_name']}\n阈值：{alert['threshold_value']}\n实际值：{alert['actual_value']}\n请尽快处理。",
            status="pending",
            priority="high" if alert['level'] == 'danger' else "medium",
            trigger_threshold_id=alert['threshold_id'],
            chart_ref=f"funnel_{alert.get('course_id', 'all')}",
            created_by=created_by
        )

        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        self.funnel_service.invalidate_cache()

        return task

    def get_note_tasks(
        self,
        status: Optional[str] = None,
        student_id: Optional[int] = None
    ) -> List[NoteTask]:
        """获取备注任务列表"""
        query = self.db.query(NoteTask)
        if status:
            query = query.filter(NoteTask.status == status)
        if student_id:
            query = query.filter(NoteTask.student_id == student_id)
        return query.order_by(NoteTask.created_at.desc()).all()

    def resolve_note_task(self, task_id: int, conclusion: str) -> Optional[NoteTask]:
        """处理备注任务 - 添加结论"""
        task = self.db.query(NoteTask).filter(NoteTask.id == task_id).first()
        if not task:
            return None
        task.conclusion = conclusion
        task.status = "resolved"
        task.resolved_at = datetime.now()
        self.db.commit()
        self.db.refresh(task)
        return task


def get_alert_service(db: Session) -> AlertService:
    return AlertService(db)
