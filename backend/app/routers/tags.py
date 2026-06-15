from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/tags", tags=["标签管理"])


@router.get("", response_model=List[schemas.TagResponse])
def list_tags(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Tag)
    if category:
        query = query.filter(models.Tag.category == category)
    return query.order_by(models.Tag.name).all()


@router.post("", response_model=schemas.TagResponse)
def create_tag(
    tag: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_tag = db.query(models.Tag).filter(models.Tag.name == tag.name).first()
    if db_tag:
        raise HTTPException(status_code=400, detail="标签已存在")
    db_tag = models.Tag(**tag.model_dump())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.put("/{tag_id}", response_model=schemas.TagResponse)
def update_tag(
    tag_id: int,
    tag: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN, models.UserRole.TEACHER))
):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    for key, value in tag.model_dump().items():
        setattr(db_tag, key, value)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(models.UserRole.ADMIN))
):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    db.delete(db_tag)
    db.commit()
    return {"message": "删除成功"}
