from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_roles, get_current_user
from app.models import User, UserRole
from app.crud import time_slot as crud_time_slot
from app.schemas import TimeSlot, TimeSlotCreate, TimeSlotUpdate

router = APIRouter()


@router.get("", response_model=List[TimeSlot])
def list_time_slots(
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_time_slot.get_multi(db, is_active=is_active)


@router.post("", response_model=TimeSlot)
def create_time_slot(
    slot_in: TimeSlotCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    return crud_time_slot.create(db, slot_in)


@router.get("/{slot_id}", response_model=TimeSlot)
def get_time_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    slot = crud_time_slot.get(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="时段不存在"
        )
    return slot


@router.put("/{slot_id}", response_model=TimeSlot)
def update_time_slot(
    slot_id: int,
    slot_in: TimeSlotUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    db_slot = crud_time_slot.get(db, slot_id)
    if not db_slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="时段不存在"
        )
    return crud_time_slot.update(db, db_slot, slot_in)
