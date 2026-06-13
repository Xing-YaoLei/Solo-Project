from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    ProgressRecord, Course, CourseMember, User, ProgressStatus, UserRole
)
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.ProgressRecord])
def list_progress_records(
    course_id: Optional[int] = None,
    member_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProgressRecord)
    if current_user.role == UserRole.MEMBER:
        query = query.filter(ProgressRecord.member_id == current_user.id)
    elif current_user.role == UserRole.TRAINER:
        query = query.join(Course).filter(Course.trainer_id == current_user.id)
    if course_id:
        query = query.filter(ProgressRecord.course_id == course_id)
    if member_id:
        query = query.filter(ProgressRecord.member_id == member_id)
    return query.order_by(ProgressRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/history/{course_id}/{member_id}", response_model=List[schemas.ProgressRecord])
def get_progress_history(
    course_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ProgressRecord).filter(
        ProgressRecord.course_id == course_id,
        ProgressRecord.member_id == member_id
    ).order_by(ProgressRecord.created_at.desc()).all()


@router.post("", response_model=schemas.ProgressRecord)
def create_progress_record(
    record_in: schemas.ProgressRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == record_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    cm = db.query(CourseMember).filter(
        CourseMember.course_id == record_in.course_id,
        CourseMember.member_id == record_in.member_id
    ).first()
    if not cm:
        raise HTTPException(status_code=404, detail="学员未加入该课程")

    last_record = db.query(ProgressRecord).filter(
        ProgressRecord.course_id == record_in.course_id,
        ProgressRecord.member_id == record_in.member_id
    ).order_by(ProgressRecord.created_at.desc()).first()

    old_progress = last_record.new_progress if last_record else 0.0
    new_progress = max(0.0, min(100.0, record_in.new_progress))

    progress_status = ProgressStatus.ON_TRACK
    expected = cm.expected_progress_rate
    if new_progress < expected - 5:
        progress_status = ProgressStatus.BEHIND
    elif new_progress > expected + 5:
        progress_status = ProgressStatus.AHEAD

    record = ProgressRecord(
        course_id=record_in.course_id,
        member_id=record_in.member_id,
        chapter_id=record_in.chapter_id,
        operator_id=record_in.operator_id,
        old_progress=old_progress,
        new_progress=new_progress,
        progress_status=progress_status,
        consumed_sessions=record_in.consumed_sessions,
        remaining_sessions=record_in.remaining_sessions,
        change_reason=record_in.change_reason,
        extra_data=record_in.extra_data or {}
    )
    cm.actual_progress_rate = new_progress
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/current/{course_id}/{member_id}")
def get_current_progress(
    course_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cm = db.query(CourseMember).filter(
        CourseMember.course_id == course_id,
        CourseMember.member_id == member_id
    ).first()
    if not cm:
        raise HTTPException(status_code=404, detail="学员未加入该课程")

    last_record = db.query(ProgressRecord).filter(
        ProgressRecord.course_id == course_id,
        ProgressRecord.member_id == member_id
    ).order_by(ProgressRecord.created_at.desc()).first()

    return {
        "course_id": course_id,
        "member_id": member_id,
        "expected_progress": cm.expected_progress_rate,
        "actual_progress": cm.actual_progress_rate,
        "last_record": last_record,
        "is_behind": cm.actual_progress_rate < cm.expected_progress_rate - 5,
        "gap": round(cm.expected_progress_rate - cm.actual_progress_rate, 2)
    }
