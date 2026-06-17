from datetime import datetime, date, time, timedelta
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy import and_, or_, not_
from sqlalchemy.orm import Session

from app.models import (
    CleaningSchedule, TimeSlot, CapacityRule, Apartment, User,
    CleaningStatus, RiskLevel, UserRole
)
from app.config import settings


def check_time_overlap(
    start1: datetime, end1: datetime,
    start2: datetime, end2: datetime,
    min_gap_minutes: int = 0
) -> bool:
    if min_gap_minutes > 0:
        start1 = start1 - timedelta(minutes=min_gap_minutes)
        end1 = end1 + timedelta(minutes=min_gap_minutes)
    return start1 < end2 and start2 < end1


def detect_staff_conflicts(
    db: Session,
    cleaner_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_schedule_id: Optional[int] = None,
    min_gap_minutes: Optional[int] = None
) -> List[Tuple[CleaningSchedule, str]]:
    if cleaner_id is None:
        return []

    gap = min_gap_minutes if min_gap_minutes is not None else settings.MIN_GAP_BETWEEN_CLEANINGS_MINUTES

    query = db.query(CleaningSchedule).filter(
        CleaningSchedule.cleaner_id == cleaner_id,
        CleaningSchedule.status.notin_([
            CleaningStatus.CANCELLED,
            CleaningStatus.RESCHEDULED
        ])
    )

    if exclude_schedule_id:
        query = query.filter(CleaningSchedule.id != exclude_schedule_id)

    existing_schedules = query.all()
    conflicts = []

    for existing in existing_schedules:
        if check_time_overlap(
            start_time, end_time,
            existing.start_time, existing.end_time,
            min_gap_minutes=0
        ):
            conflicts.append((existing, "direct_overlap"))
        elif check_time_overlap(
            start_time, end_time,
            existing.start_time, existing.end_time,
            min_gap_minutes=gap
        ):
            conflicts.append((existing, "insufficient_gap"))

    return conflicts


def detect_apartment_conflicts(
    db: Session,
    apartment_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_schedule_id: Optional[int] = None
) -> List[CleaningSchedule]:
    query = db.query(CleaningSchedule).filter(
        CleaningSchedule.apartment_id == apartment_id,
        CleaningSchedule.status.notin_([
            CleaningStatus.CANCELLED,
            CleaningStatus.RESCHEDULED
        ])
    )

    if exclude_schedule_id:
        query = query.filter(CleaningSchedule.id != exclude_schedule_id)

    existing_schedules = query.all()
    conflicts = []

    for existing in existing_schedules:
        if check_time_overlap(
            start_time, end_time,
            existing.start_time, existing.end_time,
            min_gap_minutes=0
        ):
            conflicts.append(existing)

    return conflicts


def get_applicable_capacity_rules(
    db: Session,
    scheduled_date: date,
    time_slot_id: Optional[int] = None
) -> List[CapacityRule]:
    day_of_week = scheduled_date.weekday()

    query = db.query(CapacityRule).filter(
        CapacityRule.is_active == True
    )

    query = query.filter(
        or_(
            CapacityRule.apply_date_start == None,
            CapacityRule.apply_date_start <= scheduled_date
        ),
        or_(
            CapacityRule.apply_date_end == None,
            CapacityRule.apply_date_end >= scheduled_date
        )
    )

    rules = query.all()
    applicable_rules = []

    for rule in rules:
        if rule.apply_day_of_week and len(rule.apply_day_of_week) > 0:
            if day_of_week not in rule.apply_day_of_week:
                continue

        if rule.time_slot_id is not None and time_slot_id is not None:
            if rule.time_slot_id != time_slot_id:
                continue

        applicable_rules.append(rule)

    applicable_rules.sort(key=lambda r: r.priority, reverse=True)
    return applicable_rules


def check_capacity_rules(
    db: Session,
    scheduled_date: date,
    start_time: datetime,
    end_time: datetime,
    time_slot_id: Optional[int] = None,
    cleaner_id: Optional[int] = None,
    exclude_schedule_id: Optional[int] = None
) -> Tuple[bool, List[str], List[Dict[str, Any]]]:
    warnings = []
    conflicts = []

    rules = get_applicable_capacity_rules(db, scheduled_date, time_slot_id)

    for rule in rules:
        if rule.rule_type == "global_daily":
            day_start = datetime.combine(scheduled_date, time.min)
            day_end = datetime.combine(scheduled_date, time.max)

            query = db.query(CleaningSchedule).filter(
                CleaningSchedule.scheduled_date == scheduled_date,
                CleaningSchedule.status.notin_([
                    CleaningStatus.CANCELLED,
                    CleaningStatus.RESCHEDULED
                ])
            )
            if exclude_schedule_id:
                query = query.filter(CleaningSchedule.id != exclude_schedule_id)

            count = query.count()

            if count >= rule.max_cleanings:
                warnings.append(
                    f"当日保洁任务已达上限 ({count}/{rule.max_cleanings})，规则：{rule.rule_name}"
                )
                conflicts.append({
                    "conflict_type": "capacity_exceeded",
                    "risk_level": RiskLevel.MEDIUM if count == rule.max_cleanings else RiskLevel.HIGH,
                    "description": f"当日保洁任务数量达到容量限制",
                    "details": {"rule": rule.rule_name, "current": count, "limit": rule.max_cleanings}
                })

        elif rule.rule_type == "time_slot":
            if time_slot_id and rule.time_slot_id == time_slot_id:
                query = db.query(CleaningSchedule).filter(
                    CleaningSchedule.scheduled_date == scheduled_date,
                    CleaningSchedule.time_slot_id == time_slot_id,
                    CleaningSchedule.status.notin_([
                        CleaningStatus.CANCELLED,
                        CleaningStatus.RESCHEDULED
                    ])
                )
                if exclude_schedule_id:
                    query = query.filter(CleaningSchedule.id != exclude_schedule_id)

                count = query.count()

                if count >= rule.max_cleanings:
                    warnings.append(
                        f"时段容量已饱和 ({count}/{rule.max_cleanings})，规则：{rule.rule_name}"
                    )
                    conflicts.append({
                        "conflict_type": "time_slot_capacity",
                        "risk_level": RiskLevel.MEDIUM,
                        "description": f"该时段保洁任务达到容量限制",
                        "details": {"rule": rule.rule_name, "current": count, "limit": rule.max_cleanings}
                    })

        elif rule.rule_type == "staff_daily":
            if cleaner_id:
                query = db.query(CleaningSchedule).filter(
                    CleaningSchedule.cleaner_id == cleaner_id,
                    CleaningSchedule.scheduled_date == scheduled_date,
                    CleaningSchedule.status.notin_([
                        CleaningStatus.CANCELLED,
                        CleaningStatus.RESCHEDULED
                    ])
                )
                if exclude_schedule_id:
                    query = query.filter(CleaningSchedule.id != exclude_schedule_id)

                count = query.count()
                max_per_staff = rule.max_cleanings_per_staff or settings.MAX_CLEANINGS_PER_DAY_PER_STAFF

                if count >= max_per_staff:
                    warnings.append(
                        f"该保洁员当日任务已满 ({count}/{max_per_staff})，规则：{rule.rule_name}"
                    )
                    conflicts.append({
                        "conflict_type": "staff_daily_capacity",
                        "risk_level": RiskLevel.HIGH,
                        "description": f"保洁员当日任务数量超过上限",
                        "details": {"rule": rule.rule_name, "current": count, "limit": max_per_staff}
                    })

    default_max_staff = settings.MAX_CLEANINGS_PER_DAY_PER_STAFF
    if cleaner_id:
        query = db.query(CleaningSchedule).filter(
            CleaningSchedule.cleaner_id == cleaner_id,
            CleaningSchedule.scheduled_date == scheduled_date,
            CleaningSchedule.status.notin_([
                CleaningStatus.CANCELLED,
                CleaningStatus.RESCHEDULED
            ])
        )
        if exclude_schedule_id:
            query = query.filter(CleaningSchedule.id != exclude_schedule_id)

        count = query.count()
        if count >= default_max_staff:
            warnings.append(
                f"该保洁员当日任务已满 ({count}/{default_max_staff})"
            )

    return len(conflicts) > 0, warnings, conflicts


def check_all_conflicts(
    db: Session,
    apartment_id: int,
    start_time: datetime,
    end_time: datetime,
    cleaner_id: Optional[int] = None,
    time_slot_id: Optional[int] = None,
    exclude_schedule_id: Optional[int] = None
) -> Dict[str, Any]:
    all_conflicts = []
    all_warnings = []
    scheduled_date = start_time.date()

    if cleaner_id:
        staff_conflicts = detect_staff_conflicts(
            db, cleaner_id, start_time, end_time, exclude_schedule_id
        )
        for (schedule, conflict_type) in staff_conflicts:
            risk = RiskLevel.HIGH if conflict_type == "direct_overlap" else RiskLevel.MEDIUM
            desc = "时间完全重叠" if conflict_type == "direct_overlap" else "任务间隔不足"
            all_conflicts.append({
                "conflict_type": f"staff_{conflict_type}",
                "risk_level": risk,
                "description": f"与保洁员任务 #{schedule.schedule_code} {desc}",
                "conflicting_schedule_id": schedule.id,
                "details": {
                    "conflicting_schedule": schedule.schedule_code,
                    "time_range": f"{schedule.start_time} ~ {schedule.end_time}"
                }
            })

    apartment_conflicts = detect_apartment_conflicts(
        db, apartment_id, start_time, end_time, exclude_schedule_id
    )
    for schedule in apartment_conflicts:
        all_conflicts.append({
            "conflict_type": "apartment_overlap",
            "risk_level": RiskLevel.HIGH,
            "description": f"与公寓 #{schedule.apartment_id} 的任务 #{schedule.schedule_code} 时间重叠",
            "conflicting_schedule_id": schedule.id,
            "details": {
                "conflicting_schedule": schedule.schedule_code,
                "time_range": f"{schedule.start_time} ~ {schedule.end_time}"
            }
        })

    has_capacity_issue, capacity_warnings, capacity_conflicts = check_capacity_rules(
        db, scheduled_date, start_time, end_time, time_slot_id, cleaner_id, exclude_schedule_id
    )
    all_warnings.extend(capacity_warnings)
    all_conflicts.extend(capacity_conflicts)

    overall_risk = None
    if all_conflicts:
        risk_levels = [c["risk_level"] for c in all_conflicts]
        if RiskLevel.CRITICAL in risk_levels:
            overall_risk = RiskLevel.CRITICAL
        elif RiskLevel.HIGH in risk_levels:
            overall_risk = RiskLevel.HIGH
        elif RiskLevel.MEDIUM in risk_levels:
            overall_risk = RiskLevel.MEDIUM
        else:
            overall_risk = RiskLevel.LOW

    return {
        "has_conflict": len(all_conflicts) > 0,
        "conflicts": all_conflicts,
        "capacity_warnings": all_warnings,
        "overall_risk_level": overall_risk
    }
