from datetime import datetime, timedelta, date
from typing import List, Dict, Any
from sqlalchemy import and_, or_

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import (
    CleaningSchedule, User, AttendanceRecord,
    CleaningStatus, AttendanceStatus, UserRole
)


@celery_app.task(name="app.tasks.send_upcoming_reminders")
def send_upcoming_reminders() -> Dict[str, Any]:
    db = SessionLocal()
    try:
        now = datetime.now()
        reminder_window_start = now + timedelta(minutes=30)
        reminder_window_end = now + timedelta(hours=2)

        upcoming = db.query(CleaningSchedule).filter(
            CleaningSchedule.start_time >= reminder_window_start,
            CleaningSchedule.start_time <= reminder_window_end,
            CleaningSchedule.status.in_([
                CleaningStatus.PENDING,
                CleaningStatus.CONFIRMED
            ])
        ).all()

        reminders_sent = []
        for schedule in upcoming:
            if schedule.cleaner_id:
                reminders_sent.append({
                    "schedule_id": schedule.id,
                    "schedule_code": schedule.schedule_code,
                    "cleaner_id": schedule.cleaner_id,
                    "start_time": schedule.start_time.isoformat()
                })

        return {
            "task": "send_upcoming_reminders",
            "timestamp": now.isoformat(),
            "reminders_count": len(reminders_sent),
            "details": reminders_sent
        }
    finally:
        db.close()


@celery_app.task(name="app.tasks.check_daily_attendance")
def check_daily_attendance() -> Dict[str, Any]:
    db = SessionLocal()
    try:
        today = date.today()
        now = datetime.now()

        scheduled_today = db.query(CleaningSchedule).filter(
            CleaningSchedule.scheduled_date == today,
            CleaningSchedule.status.notin_([
                CleaningStatus.CANCELLED,
                CleaningStatus.RESCHEDULED
            ])
        ).all()

        no_show_count = 0
        late_count = 0
        processed = []

        for schedule in scheduled_today:
            grace_period = timedelta(minutes=30)
            if (
                schedule.end_time < now
                and schedule.attendance_status == AttendanceStatus.NOT_STARTED
                and schedule.status not in [CleaningStatus.NO_SHOW, CleaningStatus.COMPLETED]
            ):
                schedule.status = CleaningStatus.NO_SHOW
                attendance = AttendanceRecord(
                    cleaning_schedule_id=schedule.id,
                    status=AttendanceStatus.NOT_STARTED,
                    timestamp=now,
                    notes="系统自动标记为未到场"
                )
                db.add(attendance)
                no_show_count += 1
                processed.append({
                    "schedule_id": schedule.id,
                    "action": "marked_no_show"
                })

            elif (
                schedule.start_time + grace_period < now
                and schedule.attendance_status == AttendanceStatus.NOT_STARTED
                and schedule.status == CleaningStatus.CONFIRMED
            ):
                attendance = AttendanceRecord(
                    cleaning_schedule_id=schedule.id,
                    status=AttendanceStatus.NOT_STARTED,
                    timestamp=now,
                    notes="已超出预计到场时间，请尽快确认"
                )
                db.add(attendance)
                late_count += 1
                processed.append({
                    "schedule_id": schedule.id,
                    "action": "flagged_late"
                })

        db.commit()

        return {
            "task": "check_daily_attendance",
            "date": today.isoformat(),
            "no_show_count": no_show_count,
            "late_count": late_count,
            "processed": processed
        }
    finally:
        db.close()


@celery_app.task(name="app.tasks.generate_weekly_performance_report")
def generate_weekly_performance_report() -> Dict[str, Any]:
    db = SessionLocal()
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday() + 7)
        week_end = week_start + timedelta(days=6)

        cleaners = db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).all()

        report_data = []
        for cleaner in cleaners:
            schedules = db.query(CleaningSchedule).filter(
                CleaningSchedule.cleaner_id == cleaner.id,
                CleaningSchedule.scheduled_date >= week_start,
                CleaningSchedule.scheduled_date <= week_end
            ).all()

            total = len(schedules)
            completed = len([s for s in schedules if s.status == CleaningStatus.COMPLETED])
            no_show = len([s for s in schedules if s.status == CleaningStatus.NO_SHOW])

            attendance_records = []
            for s in schedules:
                records = db.query(AttendanceRecord).filter(
                    AttendanceRecord.cleaning_schedule_id == s.id
                ).order_by(AttendanceRecord.created_at).all()
                attendance_records.extend(records)

            report_data.append({
                "cleaner_id": cleaner.id,
                "cleaner_name": cleaner.full_name,
                "total_schedules": total,
                "completed": completed,
                "no_show": no_show,
                "completion_rate": (completed / total * 100) if total > 0 else 0,
                "attendance_rate": ((total - no_show) / total * 100) if total > 0 else 0
            })

        return {
            "task": "generate_weekly_performance_report",
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "generated_at": datetime.now().isoformat(),
            "staff_performance": report_data
        }
    finally:
        db.close()


@celery_app.task(name="app.tasks.notify_conflict_assignment")
def notify_conflict_assignment(schedule_id: int, conflict_details: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "task": "notify_conflict_assignment",
        "schedule_id": schedule_id,
        "conflicts": conflict_details,
        "notified_at": datetime.now().isoformat()
    }
