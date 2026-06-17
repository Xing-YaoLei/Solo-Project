from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract, or_

from app.database import get_db
from app.security import require_roles, get_current_user
from app.models import (
    User, UserRole, CleaningSchedule, AttendanceRecord,
    CleaningStatus, AttendanceStatus
)
from app.schemas import (
    DashboardStats, AttendanceTrendPoint, DailyStats,
    StaffPerformance, TodoItem
)

router = APIRouter()


def _calculate_on_time(
    scheduled_start: datetime,
    actual_arrival: Optional[datetime],
    grace_minutes: int = 15
) -> bool:
    if not actual_arrival:
        return False
    threshold = scheduled_start + timedelta(minutes=grace_minutes)
    return actual_arrival <= threshold


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    today_schedules_query = db.query(CleaningSchedule).filter(
        CleaningSchedule.scheduled_date == today
    )

    if current_user.role == UserRole.SUPERVISOR:
        today_schedules_query = today_schedules_query.filter(
            or_(
                CleaningSchedule.supervisor_id == current_user.id,
                CleaningSchedule.supervisor_id == None
            )
        )

    today_schedules = today_schedules_query.all()

    today_completed = len([s for s in today_schedules if s.status == CleaningStatus.COMPLETED])
    today_in_progress = len([s for s in today_schedules if s.status == CleaningStatus.IN_PROGRESS])
    today_pending = len([s for s in today_schedules if s.status in [CleaningStatus.PENDING, CleaningStatus.CONFIRMED]])

    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    all_conflicts = db.query(CleaningSchedule).filter(
        CleaningSchedule.has_conflict == True,
        CleaningSchedule.status.notin_([CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED])
    ).count()

    def calc_attendance_rate(date_from, date_to):
        schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.scheduled_date >= date_from,
            CleaningSchedule.scheduled_date <= date_to
        ).all()
        if not schedules:
            return 0.0
        attended = [s for s in schedules if s.status != CleaningStatus.NO_SHOW
                    and s.status not in [CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED]
                    and s.attendance_status in [AttendanceStatus.ARRIVED, AttendanceStatus.CHECKED_OUT]]
        total_valid = len([s for s in schedules if s.status not in [CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED]])
        return (len(attended) / total_valid * 100) if total_valid > 0 else 0.0

    week_attendance = calc_attendance_rate(week_ago, today)
    month_attendance = calc_attendance_rate(month_ago, today)

    trend = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        day_schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.scheduled_date == d
        ).all()
        total = len([s for s in day_schedules if s.status not in [CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED]])
        arrived = 0
        on_time = 0
        late = 0
        no_show = 0

        for s in day_schedules:
            if s.status in [CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED]:
                continue
            if s.status == CleaningStatus.NO_SHOW:
                no_show += 1
            elif s.attendance_status in [AttendanceStatus.ARRIVED, AttendanceStatus.CHECKED_OUT]:
                arrived += 1
                arrival_records = db.query(AttendanceRecord).filter(
                    AttendanceRecord.cleaning_schedule_id == s.id,
                    AttendanceRecord.status == AttendanceStatus.ARRIVED
                ).first()
                if arrival_records and _calculate_on_time(s.start_time, arrival_records.timestamp):
                    on_time += 1
                else:
                    late += 1

        trend.append(AttendanceTrendPoint(
            date=d,
            total_schedules=total,
            arrived=arrived,
            on_time=on_time,
            late=late,
            no_show=no_show,
            attendance_rate=(arrived / total * 100) if total > 0 else 0.0,
            on_time_rate=(on_time / total * 100) if total > 0 else 0.0
        ))

    cleaners = db.query(User).filter(
        User.role == UserRole.CLEANER,
        User.is_active == True
    ).all()

    staff_perf = []
    perf_start = today - timedelta(days=30)
    for cleaner in cleaners:
        schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.cleaner_id == cleaner.id,
            CleaningSchedule.scheduled_date >= perf_start,
            CleaningSchedule.scheduled_date <= today
        ).all()
        total = len(schedules)
        completed = len([s for s in schedules if s.status == CleaningStatus.COMPLETED])
        attended = len([s for s in schedules if s.attendance_status in [AttendanceStatus.ARRIVED, AttendanceStatus.CHECKED_OUT]])
        total_valid = len([s for s in schedules if s.status not in [CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED]])

        on_time_count = 0
        scores = []
        for s in schedules:
            if s.quality_score is not None:
                scores.append(s.quality_score)
            arrival = db.query(AttendanceRecord).filter(
                AttendanceRecord.cleaning_schedule_id == s.id,
                AttendanceRecord.status == AttendanceStatus.ARRIVED
            ).first()
            if arrival and _calculate_on_time(s.start_time, arrival.timestamp):
                on_time_count += 1

        staff_perf.append(StaffPerformance(
            staff_id=cleaner.id,
            staff_name=cleaner.full_name,
            total_schedules=total,
            completed=completed,
            attendance_rate=(attended / total_valid * 100) if total_valid > 0 else 0.0,
            on_time_rate=(on_time_count / total_valid * 100) if total_valid > 0 else 0.0,
            avg_quality_score=(sum(scores) / len(scores)) if scores else None
        ))

    return DashboardStats(
        today_schedules=len(today_schedules),
        today_completed=today_completed,
        today_in_progress=today_in_progress,
        today_pending=today_pending,
        conflicts_count=all_conflicts,
        week_attendance_rate=week_attendance,
        month_attendance_rate=month_attendance,
        attendance_trend=trend,
        staff_performance=staff_perf
    )


@router.get("/daily-stats", response_model=List[DailyStats])
def get_daily_stats(
    date_from: date,
    date_to: date,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    results = []
    current = date_from
    while current <= date_to:
        schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.scheduled_date == current
        ).all()
        stats = DailyStats(
            date=current,
            total=len(schedules),
            pending=len([s for s in schedules if s.status == CleaningStatus.PENDING]),
            confirmed=len([s for s in schedules if s.status == CleaningStatus.CONFIRMED]),
            in_progress=len([s for s in schedules if s.status == CleaningStatus.IN_PROGRESS]),
            completed=len([s for s in schedules if s.status == CleaningStatus.COMPLETED]),
            cancelled=len([s for s in schedules if s.status == CleaningStatus.CANCELLED]),
            no_show=len([s for s in schedules if s.status == CleaningStatus.NO_SHOW])
        )
        results.append(stats)
        current += timedelta(days=1)
    return results


@router.get("/todos", response_model=List[TodoItem])
def get_my_todos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    todos = []
    today = date.today()
    now = datetime.now()

    if current_user.role == UserRole.CLEANER:
        my_schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.cleaner_id == current_user.id,
            CleaningSchedule.scheduled_date == today,
            CleaningSchedule.status.in_([CleaningStatus.PENDING, CleaningStatus.CONFIRMED, CleaningStatus.IN_PROGRESS])
        ).order_by(CleaningSchedule.start_time).all()

        for s in my_schedules:
            if s.status == CleaningStatus.IN_PROGRESS:
                title = f"进行中 - {s.apartment.apartment_code if s.apartment else '未知公寓'}"
                priority = 2
            elif s.start_time <= now + timedelta(hours=1):
                title = f"即将开始 - {s.apartment.apartment_code if s.apartment else '未知公寓'}"
                priority = 1
            else:
                title = f"待开始 - {s.apartment.apartment_code if s.apartment else '未知公寓'}"
                priority = 0

            todos.append(TodoItem(
                id=f"schedule_{s.id}",
                type="cleaning_task",
                title=title,
                description=f"时段: {s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}",
                priority=priority,
                due_time=s.start_time,
                schedule_id=s.id,
                created_at=s.created_at
            ))

    else:
        pending_conflicts = db.query(CleaningSchedule).filter(
            CleaningSchedule.has_conflict == True,
            CleaningSchedule.status.notin_([CleaningStatus.CANCELLED, CleaningStatus.RESCHEDULED])
        ).order_by(CleaningSchedule.scheduled_date).all()

        for s in pending_conflicts:
            risk_order = {"critical": 3, "high": 2, "medium": 1, "low": 0}
            todos.append(TodoItem(
                id=f"conflict_{s.id}",
                type="conflict",
                title=f"时段冲突待处理 - {s.schedule_code}",
                description=f"风险等级: {s.risk_level.value if s.risk_level else '未标记'}，日期: {s.scheduled_date}",
                priority=risk_order.get(s.risk_level.value if s.risk_level else "low", 0),
                due_time=s.start_time,
                schedule_id=s.id,
                created_at=s.created_at
            ))

        today_schedules = db.query(CleaningSchedule).filter(
            CleaningSchedule.scheduled_date == today,
            CleaningSchedule.status.in_([CleaningStatus.PENDING]),
            CleaningSchedule.cleaner_id == None
        ).order_by(CleaningSchedule.start_time).all()

        for s in today_schedules:
            todos.append(TodoItem(
                id=f"assign_{s.id}",
                type="assignment",
                title=f"待分配保洁员 - {s.apartment.apartment_code if s.apartment else '未知'}",
                description=f"时段: {s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}",
                priority=2,
                due_time=s.start_time,
                schedule_id=s.id,
                created_at=s.created_at
            ))

    todos.sort(key=lambda t: (-t.priority, t.due_time or datetime.min))
    return todos
