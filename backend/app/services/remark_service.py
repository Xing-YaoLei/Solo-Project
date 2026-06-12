from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models import EquipmentRemark
from app.schemas import EquipmentRemarkCreate


class RemarkService:
    @staticmethod
    def list_by_equipment(db: Session, equipment_id: int,
                          remark_type: Optional[str] = None) -> List[EquipmentRemark]:
        query = db.query(EquipmentRemark).filter(EquipmentRemark.equipment_id == equipment_id)
        if remark_type:
            query = query.filter(EquipmentRemark.remark_type == remark_type)
        return query.order_by(EquipmentRemark.created_at.desc()).all()

    @staticmethod
    def list_by_store(db: Session, store_id: int,
                      remark_type: Optional[str] = None) -> List[EquipmentRemark]:
        query = db.query(EquipmentRemark).filter(EquipmentRemark.store_id == store_id)
        if remark_type:
            query = query.filter(EquipmentRemark.remark_type == remark_type)
        return query.order_by(EquipmentRemark.created_at.desc()).all()

    @staticmethod
    def create(db: Session, remark_data: EquipmentRemarkCreate) -> EquipmentRemark:
        remark = EquipmentRemark(**remark_data.model_dump())
        db.add(remark)
        db.commit()
        db.refresh(remark)
        return remark

    @staticmethod
    def get(db: Session, remark_id: int) -> Optional[EquipmentRemark]:
        return db.query(EquipmentRemark).filter(EquipmentRemark.id == remark_id).first()

    @staticmethod
    def delete(db: Session, remark_id: int) -> bool:
        remark = db.query(EquipmentRemark).filter(EquipmentRemark.id == remark_id).first()
        if remark:
            db.delete(remark)
            db.commit()
            return True
        return False
