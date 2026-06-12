from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import EquipmentRemark, EquipmentRemarkCreate
from app.services.remark_service import RemarkService

router = APIRouter(prefix="/api/remarks", tags=["remarks"])


@router.get("/equipment/{equipment_id}", response_model=List[EquipmentRemark])
def list_remarks_by_equipment(
    equipment_id: int,
    remark_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return RemarkService.list_by_equipment(db, equipment_id, remark_type)


@router.get("/store/{store_id}", response_model=List[EquipmentRemark])
def list_remarks_by_store(
    store_id: int,
    remark_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return RemarkService.list_by_store(db, store_id, remark_type)


@router.post("", response_model=EquipmentRemark)
def create_remark(
    remark_data: EquipmentRemarkCreate,
    db: Session = Depends(get_db),
):
    return RemarkService.create(db, remark_data)


@router.get("/{remark_id}", response_model=EquipmentRemark)
def get_remark(remark_id: int, db: Session = Depends(get_db)):
    remark = RemarkService.get(db, remark_id)
    if not remark:
        raise HTTPException(status_code=404, detail="Remark not found")
    return remark


@router.delete("/{remark_id}")
def delete_remark(remark_id: int, db: Session = Depends(get_db)):
    success = RemarkService.delete(db, remark_id)
    if not success:
        raise HTTPException(status_code=404, detail="Remark not found")
    return {"message": "Deleted successfully"}
