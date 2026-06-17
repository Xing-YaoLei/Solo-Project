from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.repair import RepairOrder, RepairCaliberVersion
from app.schemas.repair import RepairOrderCreate, RepairCaliberVersionCreate


class RepairService:
    def __init__(self, db: Session):
        self.db = db

    def create_caliber_version(self, caliber_in: RepairCaliberVersionCreate) -> RepairCaliberVersion:
        if caliber_in.is_active:
            self.db.query(RepairCaliberVersion).update({"is_active": False})
            self.db.commit()
        db_caliber = RepairCaliberVersion(**caliber_in.model_dump())
        self.db.add(db_caliber)
        self.db.commit()
        self.db.refresh(db_caliber)
        return db_caliber

    def get_active_caliber_version(self) -> Optional[RepairCaliberVersion]:
        return self.db.query(RepairCaliberVersion).filter(
            RepairCaliberVersion.is_active == True
        ).first()

    def get_caliber_version(self, version: str) -> Optional[RepairCaliberVersion]:
        return self.db.query(RepairCaliberVersion).filter(
            RepairCaliberVersion.version == version
        ).first()

    def list_caliber_versions(self) -> List[RepairCaliberVersion]:
        return self.db.query(RepairCaliberVersion).order_by(
            RepairCaliberVersion.effective_date.desc()
        ).all()

    def create_repair_order(self, repair_in: RepairOrderCreate) -> RepairOrder:
        if not repair_in.caliber_version:
            active_caliber = self.get_active_caliber_version()
            if active_caliber:
                repair_in.caliber_version = active_caliber.version
        
        db_repair = RepairOrder(**repair_in.model_dump())
        self.db.add(db_repair)
        self.db.commit()
        self.db.refresh(db_repair)
        return db_repair

    def get_repair_order(self, repair_id: int) -> Optional[RepairOrder]:
        return self.db.query(RepairOrder).filter(RepairOrder.id == repair_id).first()

    def list_repair_orders(
        self,
        worker_id: Optional[int] = None,
        status: Optional[str] = None,
        repair_type: Optional[str] = None,
        caliber_version: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[RepairOrder]:
        query = self.db.query(RepairOrder)
        if worker_id is not None:
            query = query.filter(RepairOrder.worker_id == worker_id)
        if status:
            query = query.filter(RepairOrder.status == status)
        if repair_type:
            query = query.filter(RepairOrder.repair_type == repair_type)
        if caliber_version:
            query = query.filter(RepairOrder.caliber_version == caliber_version)
        return query.order_by(RepairOrder.created_at.desc()).offset(skip).limit(limit).all()

    def update_repair_status(
        self,
        repair_id: int,
        status: str,
        worker_id: Optional[int] = None
    ) -> Optional[RepairOrder]:
        repair = self.db.query(RepairOrder).filter(RepairOrder.id == repair_id).first()
        if not repair:
            return None

        now = datetime.utcnow()
        repair.status = status

        if status == "assigned" and worker_id:
            repair.worker_id = worker_id
            repair.assign_time = now
        elif status == "processing":
            repair.start_time = now
        elif status == "completed":
            repair.complete_time = now
            if repair.start_time:
                duration = (now - repair.start_time).total_seconds() / 3600
                repair.duration_hours = round(duration, 2)

        self.db.commit()
        self.db.refresh(repair)
        return repair

    def calculate_duration(self, repair: RepairOrder, caliber_version: Optional[str] = None) -> Optional[float]:
        if not repair.start_time or not repair.complete_time:
            return None

        version = caliber_version or repair.caliber_version
        if not version:
            return None

        duration = (repair.complete_time - repair.start_time).total_seconds() / 3600
        
        caliber = self.get_caliber_version(version)
        if caliber and "round" in (caliber.calculation_rule or "").lower():
            return round(duration, 2)
        
        return round(duration, 2)
