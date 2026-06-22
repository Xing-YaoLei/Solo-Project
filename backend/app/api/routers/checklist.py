from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import AuditChecklist, User, UserRole
from app.schemas import (
    AuditChecklistCreate,
    AuditChecklistUpdate,
    AuditChecklistResponse,
    AuditChecklistListResponse,
)
from app.api.routers.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/checklists", tags=["检查清单"])


@router.post("", response_model=AuditChecklistResponse, status_code=status.HTTP_201_CREATED)
def create_checklist(
    checklist_in: AuditChecklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR))
):
    checklist = AuditChecklist(
        **checklist_in.model_dump(),
        created_by=current_user.id
    )
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.get("", response_model=AuditChecklistListResponse)
def list_checklists(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditChecklist)
    if category:
        query = query.filter(AuditChecklist.category == category)
    if keyword:
        query = query.filter(
            AuditChecklist.title.contains(keyword) | AuditChecklist.description.contains(keyword)
        )
    total = query.count()
    items = query.order_by(AuditChecklist.created_at.desc()).offset(skip).limit(limit).all()
    return AuditChecklistListResponse(total=total, items=items)


@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(AuditChecklist.category).distinct().all()
    return {"categories": [c[0] for c in categories]}


@router.get("/{checklist_id}", response_model=AuditChecklistResponse)
def get_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checklist = db.query(AuditChecklist).filter(AuditChecklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="检查清单不存在")
    return checklist


@router.put("/{checklist_id}", response_model=AuditChecklistResponse)
def update_checklist(
    checklist_id: int,
    checklist_in: AuditChecklistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AUDITOR))
):
    checklist = db.query(AuditChecklist).filter(AuditChecklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="检查清单不存在")

    update_data = checklist_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(checklist, field, value)

    db.commit()
    db.refresh(checklist)
    return checklist


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    checklist = db.query(AuditChecklist).filter(AuditChecklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="检查清单不存在")

    db.delete(checklist)
    db.commit()
