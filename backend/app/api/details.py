from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_roles, get_current_user
from app.models import User, UserRole
from app.crud import conflict_record as crud_conflict
from app.crud import communication_record as crud_communication
from app.crud import review_opinion as crud_review
from app.crud import capacity_rule as crud_capacity
from app.schemas import (
    ConflictRecord, ConflictRecordUpdate,
    CommunicationRecord, CommunicationRecordCreate,
    ReviewOpinion, ReviewOpinionCreate,
    CapacityRule, CapacityRuleCreate
)

router = APIRouter()


@router.get("/conflicts", response_model=List[ConflictRecord])
def list_unresolved_conflicts(
    skip: int = 0,
    limit: int = 100,
    is_resolved: Optional[bool] = False,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    if is_resolved is None or is_resolved:
        from app.crud import conflict_record
        all_conflicts = db.query(conflict_record.model_class).all()
        return all_conflicts
    return crud_conflict.get_unresolved(db, skip=skip, limit=limit)


@router.put("/conflicts/{conflict_id}", response_model=ConflictRecord)
def resolve_conflict(
    conflict_id: int,
    conflict_in: ConflictRecordUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    db_conflict = crud_conflict.get(db, conflict_id)
    if not db_conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="冲突记录不存在"
        )
    if conflict_in.is_resolved:
        conflict_in.resolved_by = current_user.id
    return crud_conflict.update(db, db_conflict, conflict_in)


@router.get("/{schedule_id}/conflicts", response_model=List[ConflictRecord])
def get_schedule_conflicts(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_conflict.get_by_schedule(db, schedule_id)


@router.get("/{schedule_id}/communications", response_model=List[CommunicationRecord])
def get_communications(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_communication.get_by_schedule(db, schedule_id)


@router.post("/{schedule_id}/communications", response_model=CommunicationRecord)
def add_communication(
    schedule_id: int,
    comm_in: CommunicationRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comm_in.cleaning_schedule_id = schedule_id
    return crud_communication.create(db, comm_in, sender_id=current_user.id)


@router.get("/{schedule_id}/reviews", response_model=List[ReviewOpinion])
def get_reviews(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_review.get_by_schedule(db, schedule_id)


@router.post("/{schedule_id}/reviews", response_model=ReviewOpinion)
def add_review(
    schedule_id: int,
    review_in: ReviewOpinionCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    review_in.cleaning_schedule_id = schedule_id
    return crud_review.create(db, review_in, reviewer_id=current_user.id)


@router.get("/capacity-rules", response_model=List[CapacityRule])
def list_capacity_rules(
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    return crud_capacity.get_multi(db, is_active=is_active)


@router.post("/capacity-rules", response_model=CapacityRule)
def create_capacity_rule(
    rule_in: CapacityRuleCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return crud_capacity.create(db, rule_in)
