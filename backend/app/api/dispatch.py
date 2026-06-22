from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..schemas import schemas
from ..models import models
from .auth import get_current_active_user
from ..config import settings

router = APIRouter(prefix="/api/dispatch-rules", tags=["派工规则"])


@router.get("", response_model=List[schemas.DispatchRule])
def list_dispatch_rules(
    is_active: Optional[bool] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    query = db.query(models.DispatchRule)
    if is_active is not None:
        query = query.filter(models.DispatchRule.is_active == is_active)
    if department:
        query = query.filter(models.DispatchRule.department == department)
    return query.order_by(models.DispatchRule.priority.desc()).all()


@router.get("/{rule_id}", response_model=schemas.DispatchRule)
def get_dispatch_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    rule = db.query(models.DispatchRule).filter(models.DispatchRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="派工规则不存在")
    return rule


@router.post("", response_model=schemas.DispatchRule)
def create_dispatch_rule(
    rule_in: schemas.DispatchRuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    rule = models.DispatchRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=schemas.DispatchRule)
def update_dispatch_rule(
    rule_id: int,
    rule_in: schemas.DispatchRuleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    rule = db.query(models.DispatchRule).filter(models.DispatchRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="派工规则不存在")
    for key, value in rule_in.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_dispatch_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    rule = db.query(models.DispatchRule).filter(models.DispatchRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="派工规则不存在")
    db.delete(rule)
    db.commit()
    return {"message": "删除成功"}


router2 = APIRouter(prefix="/api/users", tags=["用户"])


@router2.get("", response_model=List[schemas.User])
def list_users(
    role: Optional[schemas.UserRole] = None,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    if department:
        query = query.filter(models.User.department == department)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    return query.all()


@router2.get("/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router2.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    for key, value in user_in.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


router3 = APIRouter(prefix="/api/upload", tags=["文件上传"])


@router3.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(filepath)

    return {
        "filename": filename,
        "original_name": file.filename,
        "filepath": filepath,
        "file_type": file.content_type,
        "file_size": file_size,
        "url": f"/uploads/{filename}",
    }
