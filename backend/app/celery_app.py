from celery import Celery
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app import models

RISK_LEVEL_ORDER = {
    models.RiskLevel.NORMAL: 0,
    models.RiskLevel.WARNING: 1,
    models.RiskLevel.DANGER: 2,
    models.RiskLevel.CRITICAL: 3,
}

celery = Celery(
    "edu_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)


@celery.task
def assess_all_risks():
    db = SessionLocal()
    try:
        progresses = db.query(models.StudyProgress).all()
        updated_count = 0
        
        rules = db.query(models.ReminderRule).filter(
            models.ReminderRule.is_active == True
        ).all()
        
        for progress in progresses:
            old_risk = progress.risk_level
            new_risk = models.RiskLevel.NORMAL
            
            for rule in rules:
                if rule.rule_type == "completion_rate":
                    if progress.completion_rate < rule.threshold:
                        if RISK_LEVEL_ORDER[rule.risk_level] > RISK_LEVEL_ORDER[new_risk]:
                            new_risk = rule.risk_level
                elif rule.rule_type == "days_without_practice" and rule.days_without_practice:
                    if progress.last_practice_at:
                        days_since = (
                            datetime.utcnow() - progress.last_practice_at.replace(tzinfo=None)
                        ).days
                        if days_since >= rule.days_without_practice:
                            if RISK_LEVEL_ORDER[rule.risk_level] > RISK_LEVEL_ORDER[new_risk]:
                                new_risk = rule.risk_level
            
            if old_risk != new_risk:
                progress.risk_level = new_risk
                risk_record = models.RiskRecord(
                    study_progress_id=progress.id,
                    previous_level=old_risk,
                    current_level=new_risk,
                    reason="定时任务自动评估风险等级"
                )
                db.add(risk_record)
                
                if new_risk in [models.RiskLevel.WARNING, models.RiskLevel.DANGER, models.RiskLevel.CRITICAL]:
                    reminder = models.ReminderRecord(
                        study_progress_id=progress.id,
                        message=f"您的学习进度风险等级已调整为 {new_risk.value}，请及时跟进",
                        is_read=False
                    )
                    db.add(reminder)
                
                updated_count += 1
        
        db.commit()
        return {"updated_count": updated_count}
    finally:
        db.close()


@celery.task
def send_daily_reminders():
    db = SessionLocal()
    try:
        progresses = db.query(models.StudyProgress).filter(
            models.StudyProgress.completion_rate < 100
        ).all()
        
        reminder_count = 0
        for progress in progresses:
            if progress.last_practice_at:
                days_since = (
                    datetime.utcnow() - progress.last_practice_at.replace(tzinfo=None)
                ).days
                if days_since >= 2:
                    reminder = models.ReminderRecord(
                        study_progress_id=progress.id,
                        message=f"您已经 {days_since} 天没有练习了，继续加油！",
                        is_read=False
                    )
                    db.add(reminder)
                    reminder_count += 1
        
        db.commit()
        return {"reminder_count": reminder_count}
    finally:
        db.close()


@celery.task
def generate_progress_report(report_type: str = "daily"):
    db = SessionLocal()
    try:
        total_students = db.query(models.User).filter(
            models.User.role == models.UserRole.STUDENT,
            models.User.is_active == True
        ).count()
        
        total_courses = db.query(models.Course).count()
        
        avg_completion = db.query(
            models.func.avg(models.StudyProgress.completion_rate)
        ).scalar() or 0
        
        at_risk_count = db.query(models.StudyProgress).filter(
            models.StudyProgress.risk_level.in_([
                models.RiskLevel.WARNING,
                models.RiskLevel.DANGER,
                models.RiskLevel.CRITICAL
            ])
        ).count()
        
        return {
            "report_type": report_type,
            "total_students": total_students,
            "total_courses": total_courses,
            "avg_completion_rate": round(avg_completion, 2),
            "at_risk_count": at_risk_count
        }
    finally:
        db.close()


celery.conf.beat_schedule = {
    "assess-risks-every-hour": {
        "task": "app.celery_app.assess_all_risks",
        "schedule": 3600,
    },
    "daily-reminders": {
        "task": "app.celery_app.send_daily_reminders",
        "schedule": 86400,
    },
}
