from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/questions", tags=["题目管理"])


@router.get("", response_model=List[schemas.QuestionResponse])
def list_questions(
    course_id: Optional[int] = None,
    chapter_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    question_type: Optional[models.QuestionType] = None,
    difficulty: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Question).filter(models.Question.is_active == True)
    
    if course_id:
        query = query.filter(models.Question.course_id == course_id)
    if chapter_id:
        query = query.filter(models.Question.chapter_id == chapter_id)
    if question_type:
        query = query.filter(models.Question.question_type == question_type)
    if difficulty:
        query = query.filter(models.Question.difficulty == difficulty)
    if search:
        query = query.filter(models.Question.content.contains(search))
    if tag_id:
        query = query.join(models.QuestionTag).filter(models.QuestionTag.tag_id == tag_id)
    
    total = query.count()
    questions = query.order_by(models.Question.id.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return questions


@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    return question


@router.post("", response_model=schemas.QuestionResponse)
def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_question = models.Question(
        course_id=question.course_id,
        chapter_id=question.chapter_id,
        question_type=question.question_type,
        content=question.content,
        options=question.options,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        difficulty=question.difficulty
    )
    
    if question.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(question.tag_ids)).all()
        db_question.tags = tags
    
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    course = db.query(models.Course).filter(models.Course.id == question.course_id).first()
    if course:
        course.total_questions = db.query(models.Question).filter(
            models.Question.course_id == question.course_id,
            models.Question.is_active == True
        ).count()
    
    if question.chapter_id:
        chapter = db.query(models.Chapter).filter(models.Chapter.id == question.chapter_id).first()
        if chapter:
            chapter.question_count = db.query(models.Question).filter(
                models.Question.chapter_id == question.chapter_id,
                models.Question.is_active == True
            ).count()
    
    db.commit()
    return db_question


@router.put("/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    question: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    update_data = question.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)
    
    for key, value in update_data.items():
        setattr(db_question, key, value)
    
    if tag_ids is not None:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_question.tags = tags
    
    db.commit()
    db.refresh(db_question)
    return db_question


@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    db_question.is_active = False
    db.commit()
    
    course = db.query(models.Course).filter(models.Course.id == db_question.course_id).first()
    if course:
        course.total_questions = db.query(models.Question).filter(
            models.Question.course_id == db_question.course_id,
            models.Question.is_active == True
        ).count()
    db.commit()
    
    return {"message": "删除成功"}
