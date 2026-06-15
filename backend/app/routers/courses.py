from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/courses", tags=["课程管理"])


@router.get("", response_model=List[schemas.CourseListItem])
def list_courses(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Course)
    if search:
        query = query.filter(
            (models.Course.name.contains(search)) |
            (models.Course.code.contains(search))
        )
    return query.order_by(models.Course.id.desc()).all()


@router.get("/{course_id}", response_model=schemas.CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course


@router.post("", response_model=schemas.CourseResponse)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_course = db.query(models.Course).filter(models.Course.code == course.code).first()
    if db_course:
        raise HTTPException(status_code=400, detail="课程编码已存在")
    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.put("/{course_id}", response_model=schemas.CourseResponse)
def update_course(
    course_id: int,
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="课程不存在")
    for key, value in course.model_dump().items():
        setattr(db_course, key, value)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="课程不存在")
    db.delete(db_course)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{course_id}/chapters", response_model=schemas.ChapterResponse)
def create_chapter(
    course_id: int,
    chapter: schemas.ChapterCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    db_chapter = models.Chapter(**chapter.model_dump())
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter


@router.put("/chapters/{chapter_id}", response_model=schemas.ChapterResponse)
def update_chapter(
    chapter_id: int,
    chapter: schemas.ChapterCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not db_chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    for key, value in chapter.model_dump().items():
        setattr(db_chapter, key, value)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter


@router.delete("/chapters/{chapter_id}")
def delete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not db_chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    db.delete(db_chapter)
    db.commit()
    return {"message": "删除成功"}
