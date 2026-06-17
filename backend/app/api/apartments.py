from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_roles, get_current_user
from app.models import User, UserRole
from app.crud import apartment as crud_apartment
from app.schemas import Apartment, ApartmentCreate, ApartmentUpdate

router = APIRouter()


@router.get("", response_model=List[Apartment])
def list_apartments(
    skip: int = 0,
    limit: int = 100,
    building: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud_apartment.get_multi(
        db, skip=skip, limit=limit, building=building,
        is_active=is_active, search=search
    )


@router.post("", response_model=Apartment)
def create_apartment(
    apartment_in: ApartmentCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    existing = crud_apartment.get_by_code(db, apartment_in.apartment_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="公寓编号已存在"
        )
    return crud_apartment.create(db, apartment_in)


@router.get("/{apartment_id}", response_model=Apartment)
def get_apartment(
    apartment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = crud_apartment.get(db, apartment_id)
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="公寓不存在"
        )
    return apt


@router.put("/{apartment_id}", response_model=Apartment)
def update_apartment(
    apartment_id: int,
    apartment_in: ApartmentUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPERVISOR)),
    db: Session = Depends(get_db)
):
    db_apt = crud_apartment.get(db, apartment_id)
    if not db_apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="公寓不存在"
        )
    return crud_apartment.update(db, db_apt, apartment_in)
