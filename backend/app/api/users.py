from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..models import User, UserRole, WorkOrderStatus, WorkOrderPriority, WorkOrderCategory
from ..schemas import User as UserSchema
from ..services import user_service

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("", response_model=dict)
def list_users(
    skip: int = 0,
    limit: int = 20,
    role: Optional[UserRole] = None,
    current_user: User = Depends(lambda: User(id=1, role=UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    users, total = user_service.get_users(db, skip=skip, limit=limit, role=role)
    return {"items": users, "total": total, "page": skip // limit + 1, "page_size": limit}


@router.get("/workers", response_model=list)
def list_workers(
    current_user: User = Depends(lambda: User(id=1, role=UserRole.WORKER)),
    db: Session = Depends(get_db),
):
    return user_service.get_workers(db)


@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(lambda: User(id=1, role=UserRole.WORKER))):
    return current_user
