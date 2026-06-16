from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.medication import Medication
from app.models.elder import Elder
from app.schemas.medication import MedicationCreate, MedicationUpdate, MedicationResponse
from app.schemas.common import PaginatedResponse
from app.utils.audit import AuditLogger

router = APIRouter(tags=["用药清单"])


@router.get("/api/elders/{elder_id}/medications", response_model=PaginatedResponse)
async def get_medications(
    elder_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    query = db.query(Medication).filter(Medication.elder_id == elder_id)

    if status:
        query = query.filter(Medication.status == status)

    total = query.count()
    items = query.order_by(Medication.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }


@router.post("/api/elders/{elder_id}/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    elder_id: int,
    medication_in: MedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="老人档案不存在")

    db_medication = Medication(**medication_in.model_dump())
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_create("medication", db_medication.id, {
        "elder_id": elder_id,
        "drug_name": db_medication.drug_name,
        "dosage": db_medication.dosage,
        "status": db_medication.status
    })

    return db_medication


@router.put("/api/medications/{id}", response_model=MedicationResponse)
async def update_medication(
    id: int,
    medication_in: MedicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_medication = db.query(Medication).filter(Medication.id == id).first()
    if not db_medication:
        raise HTTPException(status_code=404, detail="用药记录不存在")

    old_data = {
        "drug_name": db_medication.drug_name,
        "dosage": db_medication.dosage,
        "frequency": db_medication.frequency,
        "status": db_medication.status
    }

    update_data = medication_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_medication, key, value)

    db.commit()
    db.refresh(db_medication)

    new_data = {
        "drug_name": db_medication.drug_name,
        "dosage": db_medication.dosage,
        "frequency": db_medication.frequency,
        "status": db_medication.status
    }

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_update("medication", db_medication.id, old_data, new_data)

    return db_medication


@router.delete("/api/medications/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_medication = db.query(Medication).filter(Medication.id == id).first()
    if not db_medication:
        raise HTTPException(status_code=404, detail="用药记录不存在")

    old_data = {
        "id": db_medication.id,
        "elder_id": db_medication.elder_id,
        "drug_name": db_medication.drug_name
    }

    db.delete(db_medication)
    db.commit()

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_delete("medication", id, old_data)

    return None


@router.patch("/api/medications/{id}/status", response_model=MedicationResponse)
async def update_medication_status(
    id: int,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_medication = db.query(Medication).filter(Medication.id == id).first()
    if not db_medication:
        raise HTTPException(status_code=404, detail="用药记录不存在")

    old_status = db_medication.status
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="状态字段不能为空")

    db_medication.status = new_status
    db.commit()
    db.refresh(db_medication)

    audit_logger = AuditLogger(db, user_id=current_user.id)
    audit_logger.log_status_change("medication", db_medication.id, old_status, new_status,
                                    remark=status_data.get("remark"))

    return db_medication
