from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(tags=["处理详情"])


def get_teacher_course_ids(db: Session, teacher: models.User) -> List[int]:
    courses = db.query(models.Course).filter(
        models.Course.teachers.any(id=teacher.id)
    ).all()
    return [c.id for c in courses]


@router.get("/study-progress/{progress_id}/communications", response_model=List[schemas.CommunicationResponse])
def list_communications(
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
    
    communications = db.query(models.Communication).filter(
        models.Communication.study_progress_id == progress_id
    ).order_by(models.Communication.created_at.asc()).all()
    
    return communications


@router.post("/communications", response_model=schemas.CommunicationResponse)
def create_communication(
    comm: schemas.CommunicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == comm.study_progress_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    if current_user.role == models.UserRole.STUDENT and progress.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")
    
    db_comm = models.Communication(
        study_progress_id=comm.study_progress_id,
        sender_id=current_user.id,
        message=comm.message,
        message_type=comm.message_type
    )
    db.add(db_comm)
    db.commit()
    db.refresh(db_comm)
    
    if current_user.role in [models.UserRole.TEACHER, models.UserRole.ADMIN]:
        todo = models.TodoItem(
            user_id=progress.student_id,
            title="老师有新的沟通消息",
            description=f"课程 {progress.course.name} 的学习进度有新的沟通消息",
            todo_type="communication",
            related_id=comm.study_progress_id,
            priority=2
        )
        db.add(todo)
        db.commit()
    
    return db_comm


@router.get("/study-progress/{progress_id}/reviews", response_model=List[schemas.ReviewConclusionResponse])
def list_reviews(
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
    
    reviews = db.query(models.ReviewConclusion).filter(
        models.ReviewConclusion.study_progress_id == progress_id
    ).order_by(models.ReviewConclusion.created_at.desc()).all()
    
    return reviews


@router.post("/reviews", response_model=schemas.ReviewConclusionResponse)
def create_review(
    review: schemas.ReviewConclusionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.TEACHER, models.UserRole.ADMIN, models.UserRole.MANAGER))
):
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == review.study_progress_id
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="学习进度不存在")
    
    db_review = models.ReviewConclusion(
        study_progress_id=review.study_progress_id,
        reviewer_id=current_user.id,
        conclusion=review.conclusion,
        action_plan=review.action_plan,
        risk_level_after=review.risk_level_after
    )
    db.add(db_review)
    
    if review.risk_level_after and review.risk_level_after != progress.risk_level:
        old_risk = progress.risk_level
        progress.risk_level = review.risk_level_after
        risk_record = models.RiskRecord(
            study_progress_id=progress.id,
            previous_level=old_risk,
            current_level=review.risk_level_after,
            reason=f"复核结论调整风险等级: {review.conclusion[:50]}"
        )
        db.add(risk_record)
    
    todo = models.TodoItem(
        user_id=progress.student_id,
        title="学习进度复核结论已更新",
        description=f"课程 {progress.course.name} 的学习进度有新的复核结论，请查看",
        todo_type="review",
        related_id=review.study_progress_id,
        priority=1
    )
    db.add(todo)
    
    db.commit()
    db.refresh(db_review)
    return db_review


@router.get("/todos/mine", response_model=List[schemas.TodoItemResponse])
def get_my_todos(
    is_completed: bool = None,
    todo_type: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.TodoItem).filter(
        models.TodoItem.user_id == current_user.id
    )
    if is_completed is not None:
        query = query.filter(models.TodoItem.is_completed == is_completed)
    if todo_type:
        query = query.filter(models.TodoItem.todo_type == todo_type)
    
    return query.order_by(
        models.TodoItem.priority.asc(),
        models.TodoItem.created_at.desc()
    ).all()


@router.post("/todos", response_model=schemas.TodoItemResponse)
def create_todo(
    todo: schemas.TodoItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_todo = models.TodoItem(
        user_id=current_user.id,
        **todo.model_dump()
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.put("/todos/{todo_id}/complete")
def complete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    todo = db.query(models.TodoItem).filter(
        models.TodoItem.id == todo_id,
        models.TodoItem.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    
    todo.is_completed = True
    todo.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "已完成"}


@router.get("/todos/teacher", response_model=List[schemas.TodoItemResponse])
def get_teacher_todos(
    generate_missing: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.TEACHER, models.UserRole.ADMIN, models.UserRole.MANAGER))
):
    from app.routers.study_progress import calculate_risk_level

    all_progresses = db.query(models.StudyProgress).all()
    for p in all_progresses:
        recalculated = calculate_risk_level(p, db)
        if p.risk_level != recalculated:
            p.risk_level = recalculated
    db.commit()

    high_risk_values = [models.RiskLevel.DANGER.value, models.RiskLevel.CRITICAL.value]
    if current_user.role in [models.UserRole.ADMIN, models.UserRole.MANAGER]:
        high_risk_progresses = db.query(models.StudyProgress).filter(
            models.StudyProgress.risk_level.in_(high_risk_values)
        ).all()
    else:
        allowed_course_ids = get_teacher_course_ids(db, current_user)
        high_risk_progresses = db.query(models.StudyProgress).filter(
            models.StudyProgress.risk_level.in_(high_risk_values),
            models.StudyProgress.course_id.in_(allowed_course_ids)
        ).all()
    
    if generate_missing:
        existing_related_ids = set()
        existing_todos = db.query(models.TodoItem).filter(
            models.TodoItem.user_id == current_user.id,
            models.TodoItem.todo_type == "risk_followup",
            models.TodoItem.is_completed == False
        ).all()
        existing_related_ids = {t.related_id for t in existing_todos if t.related_id}
        
        for progress in high_risk_progresses:
            if progress.id not in existing_related_ids:
                todo = models.TodoItem(
                    user_id=current_user.id,
                    title=f"跟进风险学生: {progress.student.full_name or progress.student.username}",
                    description=(
                        f"【{progress.course.name}】"
                        f"完成率 {progress.completion_rate}%，"
                        f"正确率 {progress.accuracy_rate}%，"
                        f"风险等级: {progress.risk_level.value if isinstance(progress.risk_level, models.RiskLevel) else progress.risk_level}，"
                        f"上次练习: {progress.last_practice_at.strftime('%m月%d日') if progress.last_practice_at else '无'}"
                    ),
                    todo_type="risk_followup",
                    related_id=progress.id,
                    priority=1 if (progress.risk_level.value if isinstance(progress.risk_level, models.RiskLevel) else progress.risk_level) == models.RiskLevel.CRITICAL.value else 2,
                    is_completed=False,
                )
                db.add(todo)
        db.commit()
    
    todos = db.query(models.TodoItem).filter(
        models.TodoItem.user_id == current_user.id,
        models.TodoItem.is_completed == False
    ).order_by(
        models.TodoItem.priority.asc(),
        models.TodoItem.created_at.desc()
    ).all()
    
    return todos
