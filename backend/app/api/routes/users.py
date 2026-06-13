from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models import User, UserRole
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.User])
def list_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.like(search_pattern)) |
            (User.full_name.like(search_pattern)) |
            (User.email.like(search_pattern))
        )
    return query.offset(skip).limit(limit).all()


@router.get("/trainers", response_model=List[schemas.User])
def list_trainers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(User).filter(User.role == UserRole.TRAINER, User.is_active == True).all()


@router.get("/members", response_model=List[schemas.User])
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(User).filter(User.role == UserRole.MEMBER, User.is_active == True).all()


@router.get("/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
