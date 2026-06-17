from typing import List, Optional, Tuple, Dict, Any
from datetime import date
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session, joinedload

from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.models.inventory_record import InventoryRecord, InventoryRecordType
from app.schemas.material_batch import (
    MaterialBatchCreate,
    MaterialBatchUpdate,
    MaterialBatchQueryParams,
)


class MaterialBatchService:
    def get_by_id(self, db: Session, batch_id: int) -> Optional[MaterialBatch]:
        return (
            db.query(MaterialBatch)
            .options(joinedload(MaterialBatch.supplier))
            .filter(MaterialBatch.id == batch_id)
            .first()
        )

    def get_by_batch_no(self, db: Session, batch_no: str) -> Optional[MaterialBatch]:
        return db.query(MaterialBatch).filter(MaterialBatch.batch_no == batch_no).first()

    def get_list(
        self, db: Session, params: MaterialBatchQueryParams
    ) -> Tuple[List[MaterialBatch], int]:
        query = db.query(MaterialBatch).options(joinedload(MaterialBatch.supplier))

        if params.keyword:
            query = query.filter(
                or_(
                    MaterialBatch.batch_no.ilike(f"%{params.keyword}%"),
                    MaterialBatch.material_name.ilike(f"%{params.keyword}%"),
                    MaterialBatch.supplier_name.ilike(f"%{params.keyword}%"),
                )
            )

        if params.status:
            query = query.filter(MaterialBatch.status == params.status)

        if params.region:
            query = query.filter(MaterialBatch.region == params.region)

        if params.responsible_person:
            query = query.filter(
                MaterialBatch.responsible_person == params.responsible_person
            )

        if params.category:
            query = query.filter(MaterialBatch.category == params.category)

        if params.start_date:
            query = query.filter(MaterialBatch.in_date >= params.start_date)

        if params.end_date:
            query = query.filter(MaterialBatch.in_date <= params.end_date)

        total = query.count()

        if params.sort_by:
            sort_column = getattr(MaterialBatch, params.sort_by, None)
            if sort_column is not None:
                if params.sort_order == "desc":
                    query = query.order_by(sort_column.desc())
                else:
                    query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(MaterialBatch.id.desc())

        batches = query.offset(params.offset).limit(params.limit).all()

        return batches, total

    def create(self, db: Session, obj_in: MaterialBatchCreate) -> MaterialBatch:
        db_obj = MaterialBatch(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, db_obj: MaterialBatch, obj_in: MaterialBatchUpdate
    ) -> MaterialBatch:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, batch_id: int) -> bool:
        db_obj = self.get_by_id(db, batch_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True

    def update_status(
        self, db: Session, batch_id: int, status: MaterialBatchStatus
    ) -> Optional[MaterialBatch]:
        db_obj = self.get_by_id(db, batch_id)
        if not db_obj:
            return None
        db_obj.status = status
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_current_stock(self, db: Session, batch_id: int) -> float:
        records = (
            db.query(InventoryRecord)
            .filter(InventoryRecord.batch_id == batch_id)
            .all()
        )

        stock = 0.0
        for record in records:
            if record.type in [InventoryRecordType.IN, InventoryRecordType.ADJUST]:
                stock += record.quantity
            elif record.type in [InventoryRecordType.OUT, InventoryRecordType.TRANSFER]:
                stock -= record.quantity

        return stock

    def update_stock_status(self, db: Session, batch_id: int) -> Optional[MaterialBatch]:
        db_obj = self.get_by_id(db, batch_id)
        if not db_obj:
            return None

        current_stock = self.get_current_stock(db, batch_id)

        if current_stock <= 0:
            db_obj.status = MaterialBatchStatus.SHORTAGE
        elif current_stock < db_obj.quantity:
            db_obj.status = MaterialBatchStatus.IN_USE
        elif current_stock >= db_obj.quantity and db_obj.in_date:
            db_obj.status = MaterialBatchStatus.IN_STOCK

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def calculate_turnover_days(
        self, db: Session, batch_id: int
    ) -> Optional[MaterialBatch]:
        db_obj = self.get_by_id(db, batch_id)
        if not db_obj or not db_obj.in_date:
            return db_obj

        out_records = (
            db.query(InventoryRecord)
            .filter(
                and_(
                    InventoryRecord.batch_id == batch_id,
                    InventoryRecord.type == InventoryRecordType.OUT,
                )
            )
            .order_by(InventoryRecord.created_at.desc())
            .first()
        )

        if out_records:
            end_date = out_records.created_at.date()
            actual_days = (end_date - db_obj.in_date).days
            db_obj.actual_turnover_days = actual_days

            if actual_days > db_obj.expected_turnover_days:
                pass

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_summary(self, db: Session) -> Dict[str, Any]:
        total_batches = db.query(MaterialBatch).count()
        total_quantity = db.query(func.sum(MaterialBatch.quantity)).scalar() or 0

        status_counts = (
            db.query(MaterialBatch.status, func.count(MaterialBatch.id))
            .group_by(MaterialBatch.status)
            .all()
        )

        status_summary = {status.value: count for status, count in status_counts}

        return {
            "total_batches": total_batches,
            "total_quantity": total_quantity,
            "status_summary": status_summary,
        }


material_batch_service = MaterialBatchService()
