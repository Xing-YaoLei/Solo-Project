from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/study-progress", tags=["学习进度"])


def get_teacher_course_ids(db: Session, teacher: models.User) -> List[int]:
    courses = db.query(models.Course).filter(
        models.Course.teachers.any(id=teacher.id)
    ).all()
    return [c.id for c in courses]


def calculate_risk_level(progress: models.StudyProgress, db: Session) -> models.RiskLevel:
    rules = db.query(models.ReminderRule).filter(
        models.ReminderRule.is_active == True
    ).all()
    
    risk_level = models.RiskLevel.NORMAL
    
    for rule in rules:
        if rule.rule_type == "completion_rate":
            if progress.completion_rate < rule.threshold:
                if rule.risk_level.value > risk_level.value:
                    risk_level = rule.risk_level
        elif rule.rule_type == "days_without_practice" and rule.days_without_practice:
            if progress.last_practice_at:
                days_since = (datetime.utcnow() - progress.last_practice_at.replace(tzinfo=None)).days
                if days_since >= rule.days_without_practice:
                    if rule.risk_level.value > risk_level.value:
                        risk_level = rule.risk_level
    
    return risk_level


@router.get("", response_model=List[schemas.StudyProgressResponse])
def list_study_progress(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    risk_level: Optional[models.RiskLevel] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.StudyProgress)
    
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.StudyProgress.student_id == current_user.id)
    elif current_user.role == models.UserRole.TEACHER:
        allowed_course_ids = get_teacher_course_ids(db, current_user)
        if course_id:
            if course_id not in allowed_course_ids:
                return []
            query = query.filter(models.StudyProgress.course_id == course_id)
        else:
            query = query.filter(models.StudyProgress.course_id.in_(allowed_course_ids))
    else:
        if student_id:
            query = query.filter(models.StudyProgress.student_id == student_id)
        if course_id:
            query = query.filter(models.StudyProgress.course_id == course_id)
    
    if risk_level:
        query = query.filter(models.StudyProgress.risk_level == risk_level)
    
    progresses = query.order_by(models.StudyProgress.updated_at.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return progresses


@router.get("/{progress_id}", response_model=schemas.StudyProgressResponse)
def get_study_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == progress_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    if current_user.role == models.UserRole.STUDENT and progress.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看")
    
    if current_user.role == models.UserRole.TEACHER:
        allowed_course_ids = get_teacher_course_ids(db, current_user)
        if progress.course_id not in allowed_course_ids:
            raise HTTPException(status_code=403, detail="无权查看")
    
    return progress


@router.post("/practice", response_model=schemas.PracticeRecordResponse)
def submit_practice(
    practice: schemas.PracticeRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.STUDENT))
):
    question = db.query(models.Question).filter(
        models.Question.id == practice.question_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    is_correct = practice.is_correct
    if is_correct is None and question.correct_answer:
        is_correct = practice.user_answer == question.correct_answer
    
    score = practice.score
    if score is None and is_correct is not None:
        score = 100.0 if is_correct else 0.0
    
    attempt_count = db.query(models.PracticeRecord).filter(
        models.PracticeRecord.student_id == current_user.id,
        models.PracticeRecord.question_id == practice.question_id
    ).count()
    
    record = models.PracticeRecord(
        student_id=current_user.id,
        question_id=practice.question_id,
        course_id=question.course_id,
        chapter_id=question.chapter_id,
        user_answer=practice.user_answer,
        is_correct=is_correct,
        score=score,
        time_spent=practice.time_spent,
        attempt_number=attempt_count + 1
    )
    db.add(record)
    
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.student_id == current_user.id,
        models.StudyProgress.course_id == question.course_id
    ).first()
    
    if not progress:
        total_questions = db.query(models.Question).filter(
            models.Question.course_id == question.course_id,
            models.Question.is_active == True
        ).count()
        progress = models.StudyProgress(
            student_id=current_user.id,
            course_id=question.course_id,
            total_questions=total_questions,
            completed_questions=0,
            correct_count=0,
            accuracy_rate=0.0,
            completion_rate=0.0
        )
        db.add(progress)
        db.flush()
    
    first_attempt = attempt_count == 0
    if first_attempt:
        progress.completed_questions += 1
        if is_correct:
            progress.correct_count += 1
    
    if progress.completed_questions > 0:
        progress.accuracy_rate = round(
            progress.correct_count / progress.completed_questions * 100, 2
        )
    if progress.total_questions > 0:
        progress.completion_rate = round(
            progress.completed_questions / progress.total_questions * 100, 2
        )
    
    progress.last_practice_at = datetime.utcnow()
    
    old_risk = progress.risk_level
    new_risk = calculate_risk_level(progress, db)
    if old_risk != new_risk:
        progress.risk_level = new_risk
        risk_record = models.RiskRecord(
            study_progress_id=progress.id,
            previous_level=old_risk,
            current_level=new_risk,
            reason="练习提交后重新评估风险等级"
        )
        db.add(risk_record)
    
    db.commit()
    db.refresh(record)
    record.question = question
    
    return record


@router.get("/practice/records", response_model=List[schemas.PracticeRecordResponse])
def list_practice_records(
    course_id: Optional[int] = None,
    question_id: Optional[int] = None,
    student_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.PracticeRecord)
    
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.PracticeRecord.student_id == current_user.id)
    elif student_id:
        query = query.filter(models.PracticeRecord.student_id == student_id)
    
    if course_id:
        query = query.filter(models.PracticeRecord.course_id == course_id)
    if question_id:
        query = query.filter(models.PracticeRecord.question_id == question_id)
    
    records = query.order_by(models.PracticeRecord.created_at.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return records


@router.get("/trends/completion", response_model=List[schemas.CompletionTrendItem])
def get_completion_trend(
    days: int = Query(30, ge=7, le=365),
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.MANAGER, models.UserRole.TEACHER))
):
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)
    
    trends = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        
        query = db.query(
            func.avg(models.StudyProgress.completion_rate),
            func.count(models.StudyProgress.id)
        ).filter(
            func.date(models.StudyProgress.updated_at) <= current_date
        )
        
        if course_id:
            query = query.filter(models.StudyProgress.course_id == course_id)
        
        avg_rate, count = query.first()
        
        trends.append(schemas.CompletionTrendItem(
            date=current_date.isoformat(),
            completion_rate=round(avg_rate or 0, 2),
            student_count=count or 0
        ))
    
    return trends


@router.post("/{progress_id}/assess-risk")
def assess_risk(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == progress_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    old_risk = progress.risk_level
    new_risk = calculate_risk_level(progress, db)
    
    if old_risk != new_risk:
        progress.risk_level = new_risk
        risk_record = models.RiskRecord(
            study_progress_id=progress.id,
            previous_level=old_risk,
            current_level=new_risk,
            reason="手动触发风险评估"
        )
        db.add(risk_record)
        db.commit()
    
    return {
        "previous_level": old_risk,
        "current_level": new_risk,
        "changed": old_risk != new_risk
    }


@router.get("/{progress_id}/chapter-progress")
def get_chapter_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == progress_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    if current_user.role == models.UserRole.STUDENT and progress.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看")
    if current_user.role == models.UserRole.TEACHER:
        allowed_course_ids = get_teacher_course_ids(db, current_user)
        if progress.course_id not in allowed_course_ids:
            raise HTTPException(status_code=403, detail="无权查看")
    
    chapters = db.query(models.Chapter).filter(
        models.Chapter.course_id == progress.course_id
    ).order_by(models.Chapter.order_index).all()
    
    chapter_progress = []
    for chapter in chapters:
        total_q = db.query(models.Question).filter(
            models.Question.chapter_id == chapter.id,
            models.Question.is_active == True
        ).count()
        
        completed_q = db.query(func.count(func.distinct(models.PracticeRecord.question_id))).filter(
            models.PracticeRecord.student_id == progress.student_id,
            models.PracticeRecord.chapter_id == chapter.id
        ).scalar() or 0
        
        correct_q = db.query(func.count(func.distinct(models.PracticeRecord.question_id))).filter(
            models.PracticeRecord.student_id == progress.student_id,
            models.PracticeRecord.chapter_id == chapter.id,
            models.PracticeRecord.is_correct == True
        ).scalar() or 0
        
        completion_rate = round(completed_q / total_q * 100, 2) if total_q > 0 else 0
        accuracy_rate = round(correct_q / completed_q * 100, 2) if completed_q > 0 else 0
        
        if completion_rate < 30:
            risk = models.RiskLevel.CRITICAL
        elif completion_rate < 50:
            risk = models.RiskLevel.DANGER
        elif completion_rate < 70:
            risk = models.RiskLevel.WARNING
        else:
            risk = models.RiskLevel.NORMAL
        
        chapter_progress.append({
            "chapter_id": chapter.id,
            "chapter_name": chapter.name,
            "order_index": chapter.order_index,
            "total_questions": total_q,
            "completed_questions": completed_q,
            "correct_questions": correct_q,
            "completion_rate": completion_rate,
            "accuracy_rate": accuracy_rate,
            "risk_level": risk.value,
        })
    
    return {
        "progress_id": progress.id,
        "course_id": progress.course_id,
        "chapters": chapter_progress,
    }


@router.get("/practice/records/by-chapter/{chapter_id}")
def get_chapter_practice_records(
    chapter_id: int,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    if current_user.role == models.UserRole.STUDENT:
        student_id = current_user.id
    elif current_user.role == models.UserRole.TEACHER:
        allowed_course_ids = get_teacher_course_ids(db, current_user)
        if chapter.course_id not in allowed_course_ids:
            raise HTTPException(status_code=403, detail="无权查看")
    
    query = db.query(models.PracticeRecord).filter(
        models.PracticeRecord.chapter_id == chapter_id
    )
    if student_id:
        query = query.filter(models.PracticeRecord.student_id == student_id)
    
    records = query.order_by(models.PracticeRecord.created_at.desc()).limit(50).all()
    return records
