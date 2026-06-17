from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_roles, get_current_user
from app.models import User, UserRole, CleaningStatus, RiskLevel, RescheduleReason
from app.crud import cleaning_schedule as crud_schedule
from app.crud import reschedule_record as crud_reschedule
from app.crud import attendance_record as crud_attendance
from app.schemas import (
    CleaningSchedule, CleaningScheduleCreate, CleaningScheduleUpdate,
    ConflictCheckRequest, ConflictCheckResponse, ConflictInfo,
    RescheduleRecord, RescheduleRecordCreate,
    AttendanceRecord, AttendanceRecordCreate
)
from app.utils.scheduler import check_all_conflicts

router = APIRouter()


@router.get("", response_model=List[CleaningSchedule])
def list_schedules(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[CleaningStatus] = None,
    cleaner_id: Optional[int] = None,
    supervisor_id: Optional[int] = None,
    apartment_id: Optional[int] = None,
    has_conflict: Optional[bool] = None,
    risk_level: Optional[RiskLevel] = None,
    scope: Optional[str] = Query(
        None, description="Scope: mine, team, all"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if scope == "mine" or current_user.role == UserRole.CLEANER:
        return crud_schedule.get_for_user(
            db, current_user.id, current_user.role,
            date_from=date_from, date_to=date_to, status=status
        )
    elif scope == "team" and current_user.role == UserRole.SUPERVISOR:
        return crud_schedule.get_for_user(
            db, current_user.id, current_user.role,
            date_from=date_from, date_to=date_to, status=status
        )
    else:
        return crud_schedule.get_multi(
            db, skip=skip, limit=limit,
            date_from=date_from, date_to=date_to,
            status=status, cleaner_id=cleaner_id,
            supervisor_id=supervisor_id, apartment_id=apartment_id,
            has_conflict=has_conflict, risk_level=risk_level
        )


@router.get("/calendar", response_model=List[CleaningSchedule])
def get_calendar_schedules(
    date_from: date,
    date_to: date,
    cleaner_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.CLEANER:
        cleaner_id = current_user.id

    query_params = {
        "date_from": date_from,
        "date_to": date_to,
    }
    if cleaner_id:
        query_params["cleaner_id"] = cleaner_id

    return crud_schedule.get_multi(db, **query_params)


@router.post("/check-conflicts", response_model=ConflictCheckResponse)
def check_schedule_conflicts(
    check_request: ConflictCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = check_all_conflicts(
        db,
        apartment_id=check_request.apartment_id,
        start_time=check_request.start_time,
        end_time=check_request.end_time,
        cleaner_id=check_request.cleaner_id,
        exclude_schedule_id=check_request.schedule_id
    )
    conflicts = []
    for c in result["conflicts"]:
        conflicts.append(ConflictInfo(
            conflict_type=c["conflict_type"],
            risk_level=c["risk_level"],
            description=c["description"],
            conflicting_schedule_id=c.get("conflicting_schedule_id"),
            details=c.get("details", {})
        ))
    return ConflictCheckResponse(
        has_conflict=result["has_conflict"],
        conflicts=conflicts,
        capacity_warnings=result["capacity_warnings"]
    )


@router.post("", response_model=CleaningSchedule)
def create_schedule(
    schedule_in: CleaningScheduleCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    return crud_schedule.create(
        db, schedule_in, created_by_id=current_user.id
    )


@router.get("/{schedule_id}", response_model=CleaningSchedule)
def get_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = crud_schedule.get(db, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    if current_user.role == UserRole.CLEANER and schedule.cleaner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看该排班记录"
        )
    return schedule


@router.put("/{schedule_id}", response_model=CleaningSchedule)
def update_schedule(
    schedule_id: int,
    schedule_in: CleaningScheduleUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    db_schedule = crud_schedule.get(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    return crud_schedule.update(db, db_schedule, schedule_in)


@router.post("/{schedule_id}/status/{status}", response_model=CleaningSchedule)
def update_schedule_status(
    schedule_id: int,
    status: CleaningStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_schedule = crud_schedule.get(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    if (
        current_user.role == UserRole.CLEANER
        and db_schedule.cleaner_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改该排班记录状态"
        )
    if (
        current_user.role == UserRole.CLEANER
        and status not in [CleaningStatus.IN_PROGRESS, CleaningStatus.COMPLETED]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="保洁员只能开始或完成任务"
        )
    return crud_schedule.update_status(db, db_schedule, status)


@router.post("/{schedule_id}/reschedule", response_model=CleaningSchedule)
def reschedule(
    schedule_id: int,
    reschedule_data: RescheduleRecordCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    db_schedule = crud_schedule.get(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    return crud_schedule.reschedule(
        db,
        db_obj=db_schedule,
        new_start=reschedule_data.new_start_time,
        new_end=reschedule_data.new_end_time,
        new_cleaner_id=reschedule_data.new_cleaner_id,
        reason=reschedule_data.reason,
        reason_detail=reschedule_data.reason_detail,
        requested_by=current_user.id,
        approved_by=current_user.id
    )


@router.get("/{schedule_id}/reschedules", response_model=List[RescheduleRecord])
def get_reschedule_history(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = crud_schedule.get(db, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    return crud_reschedule.get_by_schedule(db, schedule_id)


@router.post("/{schedule_id}/attendance", response_model=AttendanceRecord)
def record_attendance(
    schedule_id: int,
    attendance_in: AttendanceRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = crud_schedule.get(db, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    if (
        current_user.role == UserRole.CLEANER
        and schedule.cleaner_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权记录该任务的到场状态"
        )
    return crud_schedule.record_attendance(
        db, schedule_id, attendance_in, recorded_by=current_user.id
    )


@router.get("/{schedule_id}/attendance", response_model=List[AttendanceRecord])
def get_attendance_history(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = crud_schedule.get(db, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    return crud_attendance.get_by_schedule(db, schedule_id)


@router.post("/{schedule_id}/mark-no-show", response_model=CleaningSchedule)
def mark_no_show(
    schedule_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    db_schedule = crud_schedule.get(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班记录不存在"
        )
    return crud_schedule.mark_no_show(db, db_schedule)
