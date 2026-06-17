from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_worker, get_current_active_admin
from app.models.user import User
from app.models.inspection import InspectionRecord, InspectionItem
from app.schemas.inspection import (
    InspectionRecord as InspectionRecordSchema,
    InspectionRecordCreate,
    InspectionItem as InspectionItemSchema,
    InspectionItemCreate,
)

router = APIRouter()


@router.post("", response_model=InspectionRecordSchema)
def create_inspection(
    inspection_in: InspectionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    items_data = inspection_in.items or []
    inspection_data = inspection_in.model_dump(exclude={"items"})
    
    db_inspection = InspectionRecord(**inspection_data)
    db.add(db_inspection)
    db.flush()
    
    for item_data in items_data:
        db_item = InspectionItem(**item_data.model_dump(), inspection_id=db_inspection.id)
        db.add(db_item)
    
    db.commit()
    db.refresh(db_inspection)
    
    return db_inspection


@router.get("", response_model=List[InspectionRecordSchema])
def list_inspections(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    property_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    query = db.query(InspectionRecord)
    if status:
        query = query.filter(InspectionRecord.status == status)
    if customer_id:
        query = query.filter(InspectionRecord.customer_id == customer_id)
    if property_id:
        query = query.filter(InspectionRecord.property_id == property_id)
    
    return query.order_by(InspectionRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{inspection_id}", response_model=InspectionRecordSchema)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    inspection = db.query(InspectionRecord).filter(InspectionRecord.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection record not found",
        )
    return inspection


@router.put("/{inspection_id}/status", response_model=InspectionRecordSchema)
def update_inspection_status(
    inspection_id: int,
    status: str,
    inspector_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    inspection = db.query(InspectionRecord).filter(InspectionRecord.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection record not found",
        )
    
    if status not in ["pending", "processing", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status",
        )
    
    inspection.status = status
    if inspector_id:
        inspection.inspector_id = inspector_id
    
    db.commit()
    db.refresh(inspection)
    return inspection


@router.post("/{inspection_id}/items", response_model=InspectionItemSchema)
def add_inspection_item(
    inspection_id: int,
    item_in: InspectionItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_worker),
):
    inspection = db.query(InspectionRecord).filter(InspectionRecord.id == inspection_id).first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection record not found",
        )
    
    db_item = InspectionItem(**item_in.model_dump(), inspection_id=inspection_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item
