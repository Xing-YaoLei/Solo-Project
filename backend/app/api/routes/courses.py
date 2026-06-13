from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Course, Chapter, Assignment, Tag, AssignmentTag,
    CourseMember, User, CourseStatus, UserRole
)
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.CourseListItem])
def list_courses(
    status: Optional[CourseStatus] = None,
    trainer_id: Optional[int] = None,
    member_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Course)
    if current_user.role == UserRole.TRAINER:
        query = query.filter(Course.trainer_id == current_user.id)
    elif current_user.role == UserRole.MEMBER:
        query = query.join(CourseMember).filter(CourseMember.member_id == current_user.id)
    if status:
        query = query.filter(Course.status == status)
    if trainer_id:
        query = query.filter(Course.trainer_id == trainer_id)
    if member_id:
        query = query.join(CourseMember).filter(CourseMember.member_id == member_id)
    if search:
        query = query.filter(Course.name.like(f"%{search}%"))
    courses = query.order_by(Course.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for course in courses:
        member_count = len(course.members)
        completion_rate = 0.0
        total_chapters = len(course.chapters)
        if total_chapters > 0:
            completed_chapters = sum(1 for c in course.chapters if c.is_completed)
            completion_rate = round((completed_chapters / total_chapters) * 100, 2)
        result.append(schemas.CourseListItem(
            id=course.id,
            name=course.name,
            status=course.status,
            total_sessions=course.total_sessions,
            total_duration_hours=course.total_duration_hours,
            start_date=course.start_date,
            end_date=course.end_date,
            trainer_name=course.trainer.full_name,
            member_count=member_count,
            completion_rate=completion_rate,
            created_at=course.created_at
        ))
    return result


@router.get("/{course_id}", response_model=schemas.Course)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course


@router.post("", response_model=schemas.Course)
def create_course(
    course_in: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trainer_id = course_in.trainer_id if current_user.role in (UserRole.ADMIN, UserRole.MANAGER) else current_user.id
    course = Course(
        name=course_in.name,
        description=course_in.description,
        cover_url=course_in.cover_url,
        trainer_id=trainer_id,
        total_sessions=course_in.total_sessions,
        total_duration_hours=course_in.total_duration_hours,
        start_date=course_in.start_date,
        end_date=course_in.end_date
    )
    db.add(course)
    db.flush()
    if course_in.member_ids:
        for mid in course_in.member_ids:
            db.add(CourseMember(course_id=course.id, member_id=mid))
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=schemas.Course)
def update_course(
    course_id: int,
    course_in: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    update_data = course_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/members", response_model=List[schemas.CourseMember])
def add_course_members(
    course_id: int,
    member_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    added = []
    for mid in member_ids:
        existing = db.query(CourseMember).filter(
            CourseMember.course_id == course_id,
            CourseMember.member_id == mid
        ).first()
        if not existing:
            cm = CourseMember(course_id=course_id, member_id=mid)
            db.add(cm)
            db.flush()
            db.refresh(cm)
            added.append(cm)
    db.commit()
    return added


@router.delete("/{course_id}/members/{member_id}")
def remove_course_member(
    course_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cm = db.query(CourseMember).filter(
        CourseMember.course_id == course_id,
        CourseMember.member_id == member_id
    ).first()
    if cm:
        db.delete(cm)
        db.commit()
    return {"message": "已移除"}


@router.post("/{course_id}/chapters", response_model=schemas.Chapter)
def create_chapter(
    course_id: int,
    chapter_in: schemas.ChapterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    chapter = Chapter(**chapter_in.model_dump())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


@router.put("/chapters/{chapter_id}", response_model=schemas.Chapter)
def update_chapter(
    chapter_id: int,
    chapter_in: schemas.ChapterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    update_data = chapter_in.model_dump(exclude_unset=True)
    if "is_completed" in update_data and update_data["is_completed"]:
        update_data["completed_at"] = datetime.utcnow()
    for field, value in update_data.items():
        setattr(chapter, field, value)
    db.commit()
    db.refresh(chapter)
    return chapter


@router.post("/chapters/{chapter_id}/assignments", response_model=schemas.Assignment)
def create_assignment(
    chapter_id: int,
    assignment_in: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    data = assignment_in.model_dump(exclude={"tag_ids"})
    assignment = Assignment(**data)
    db.add(assignment)
    db.flush()
    if assignment_in.tag_ids:
        for tid in assignment_in.tag_ids:
            db.add(AssignmentTag(assignment_id=assignment.id, tag_id=tid))
    db.commit()
    db.refresh(assignment)
    return assignment


@router.put("/assignments/{assignment_id}", response_model=schemas.Assignment)
def update_assignment(
    assignment_id: int,
    assignment_in: schemas.AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="作业不存在")
    update_data = assignment_in.model_dump(exclude_unset=True, exclude={"tag_ids"})
    if "is_completed" in update_data and update_data["is_completed"]:
        update_data["completed_at"] = datetime.utcnow()
    for field, value in update_data.items():
        setattr(assignment, field, value)
    if assignment_in.tag_ids is not None:
        db.query(AssignmentTag).filter(AssignmentTag.assignment_id == assignment_id).delete()
        for tid in assignment_in.tag_ids:
            db.add(AssignmentTag(assignment_id=assignment.id, tag_id=tid))
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/tags/all", response_model=List[schemas.Tag])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Tag).all()


@router.post("/tags", response_model=schemas.Tag)
def create_tag(
    tag_in: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Tag).filter(Tag.name == tag_in.name).first()
    if existing:
        return existing
    tag = Tag(**tag_in.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag
