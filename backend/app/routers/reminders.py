from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/reminder-rules", tags=["提醒规则"])


@router.get("", response_model=List[schemas.ReminderRuleResponse])
def list_reminder_rules(
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ReminderRule)
    if is_active is not None:
        query = query.filter(models.ReminderRule.is_active == is_active)
    return query.order_by(models.ReminderRule.id).all()


@router.post("", response_model=schemas.ReminderRuleResponse)
def create_reminder_rule(
    rule: schemas.ReminderRuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_rule = models.ReminderRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.put("/{rule_id}", response_model=schemas.ReminderRuleResponse)
def update_reminder_rule(
    rule_id: int,
    rule: schemas.ReminderRuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_rule = db.query(models.ReminderRule).filter(
        models.ReminderRule.id == rule_id
    ).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="提醒规则不存在")
    for key, value in rule.model_dump().items():
        setattr(db_rule, key, value)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.delete("/{rule_id}")
def delete_reminder_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_rule = db.query(models.ReminderRule).filter(
        models.ReminderRule.id == rule_id
    ).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="提醒规则不存在")
    db.delete(db_rule)
    db.commit()
    return {"message": "删除成功"}


@router.get("/records/mine", response_model=List[schemas.ReminderRecordResponse])
def get_my_reminders(
    is_read: bool = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ReminderRecord).join(models.StudyProgress).filter(
        models.StudyProgress.student_id == current_user.id
    )
    if is_read is not None:
        query = query.filter(models.ReminderRecord.is_read == is_read)
    return query.order_by(models.ReminderRecord.created_at.desc()).all()


@router.post("/records/{record_id}/read")
def mark_reminder_read(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    record = db.query(models.ReminderRecord).filter(
        models.ReminderRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="提醒记录不存在")
    
    progress = db.query(models.StudyProgress).filter(
        models.StudyProgress.id == record.study_progress_id
    ).first()
    
    if progress and progress.student_id != current_user.id:
        if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TEACHER]:
            raise HTTPException(status_code=403, detail="无权操作")
    
    record.is_read = True
    db.commit()
    return {"message": "已标记为已读"}
