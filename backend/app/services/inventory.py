from typing import List, Optional, Tuple
from datetime import date
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.models.inventory_record import InventoryRecord, InventoryRecordType
from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.models.safety_stock import SafetyStockConfig
from app.schemas.inventory_record import (
    InventoryRecordCreate,
    InventoryRecordQueryParams,
)
from app.services.material_batch import material_batch_service


class InventoryService:
    def get_by_id(self, db: Session, record_id: int) -> Optional[InventoryRecord]:
        return (
            db.query(InventoryRecord)
            .filter(InventoryRecord.id == record_id)
            .first()
        )

    def get_list(
        self, db: Session, params: InventoryRecordQueryParams
    ) -> Tuple[List[InventoryRecord], int]:
        query = db.query(InventoryRecord)

        if params.batch_id:
            query = query.filter(InventoryRecord.batch_id == params.batch_id)

        if params.type:
            query = query.filter(InventoryRecord.type == params.type)

        if params.region:
            query = query.filter(InventoryRecord.region == params.region)

        if params.start_date:
            query = query.filter(InventoryRecord.created_at >= params.start_date)

        if params.end_date:
            query = query.filter(InventoryRecord.created_at <= params.end_date)

        if params.keyword:
            query = query.filter(
                or_(
                    InventoryRecord.operator.ilike(f"%{params.keyword}%"),
                    InventoryRecord.remark.ilike(f"%{params.keyword}%"),
                )
            )

        total = query.count()
        records = (
            query.order_by(InventoryRecord.created_at.desc())
            .offset(params.offset)
            .limit(params.limit)
            .all()
        )

        return records, total

    def create_record(
        self, db: Session, obj_in: InventoryRecordCreate
    ) -> InventoryRecord:
        db_obj = InventoryRecord(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        material_batch_service.update_stock_status(db, obj_in.batch_id)
        self.update_safety_stock(db, obj_in.batch_id)

        return db_obj

    def stock_in(
        self,
        db: Session,
        batch_id: int,
        quantity: float,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        region: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> InventoryRecord:
        obj_in = InventoryRecordCreate(
            batch_id=batch_id,
            type=InventoryRecordType.IN,
            quantity=quantity,
            operator_id=operator_id,
            operator=operator,
            region=region,
            remark=remark,
        )
        return self.create_record(db, obj_in)

    def stock_out(
        self,
        db: Session,
        batch_id: int,
        quantity: float,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        region: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> InventoryRecord:
        current_stock = material_batch_service.get_current_stock(db, batch_id)
        if current_stock < quantity:
            raise ValueError(f"库存不足，当前库存: {current_stock}, 出库数量: {quantity}")

        obj_in = InventoryRecordCreate(
            batch_id=batch_id,
            type=InventoryRecordType.OUT,
            quantity=quantity,
            operator_id=operator_id,
            operator=operator,
            region=region,
            remark=remark,
        )
        return self.create_record(db, obj_in)

    def transfer(
        self,
        db: Session,
        batch_id: int,
        quantity: float,
        from_region: str,
        to_region: str,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> InventoryRecord:
        current_stock = material_batch_service.get_current_stock(db, batch_id)
        if current_stock < quantity:
            raise ValueError(f"库存不足，当前库存: {current_stock}, 调拨数量: {quantity}")

        transfer_remark = f"从 {from_region} 调拨到 {to_region}"
        if remark:
            transfer_remark += f"，{remark}"

        obj_in = InventoryRecordCreate(
            batch_id=batch_id,
            type=InventoryRecordType.TRANSFER,
            quantity=quantity,
            operator_id=operator_id,
            operator=operator,
            region=to_region,
            remark=transfer_remark,
        )
        return self.create_record(db, obj_in)

    def adjust(
        self,
        db: Session,
        batch_id: int,
        quantity: float,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        region: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> InventoryRecord:
        obj_in = InventoryRecordCreate(
            batch_id=batch_id,
            type=InventoryRecordType.ADJUST,
            quantity=quantity,
            operator_id=operator_id,
            operator=operator,
            region=region,
            remark=remark,
        )
        return self.create_record(db, obj_in)

    def delete(self, db: Session, record_id: int) -> bool:
        db_obj = self.get_by_id(db, record_id)
        if not db_obj:
            return False
        batch_id = db_obj.batch_id
        db.delete(db_obj)
        db.commit()

        material_batch_service.update_stock_status(db, batch_id)
        self.update_safety_stock(db, batch_id)

        return True

    def update_safety_stock(self, db: Session, batch_id: int) -> Optional[SafetyStockConfig]:
        batch = material_batch_service.get_by_id(db, batch_id)
        if not batch:
            return None

        current_stock = material_batch_service.get_current_stock(db, batch_id)

        safety_config = (
            db.query(SafetyStockConfig)
            .filter(
                and_(
                    SafetyStockConfig.material_name == batch.material_name,
                    SafetyStockConfig.region == batch.region,
                )
            )
            .first()
        )

        if safety_config:
            safety_config.current_stock = current_stock
            db.add(safety_config)
            db.commit()
            db.refresh(safety_config)

        return safety_config

    def get_batch_inventory_summary(
        self, db: Session, batch_id: int
    ) -> dict:
        batch = material_batch_service.get_by_id(db, batch_id)
        if not batch:
            return {}

        current_stock = material_batch_service.get_current_stock(db, batch_id)

        total_in = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.batch_id == batch_id,
                    InventoryRecord.type == InventoryRecordType.IN,
                )
            )
            .scalar()
            or 0
        )

        total_out = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.batch_id == batch_id,
                    InventoryRecord.type == InventoryRecordType.OUT,
                )
            )
            .scalar()
            or 0
        )

        total_transfer = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.batch_id == batch_id,
                    InventoryRecord.type == InventoryRecordType.TRANSFER,
                )
            )
            .scalar()
            or 0
        )

        total_adjust = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.batch_id == batch_id,
                    InventoryRecord.type == InventoryRecordType.ADJUST,
                )
            )
            .scalar()
            or 0
        )

        return {
            "batch_id": batch_id,
            "batch_no": batch.batch_no,
            "material_name": batch.material_name,
            "initial_quantity": batch.quantity,
            "current_stock": current_stock,
            "total_in": total_in,
            "total_out": total_out,
            "total_transfer": total_transfer,
            "total_adjust": total_adjust,
            "status": batch.status.value if batch.status else None,
        }

    def get_daily_summary(
        self, db: Session, summary_date: Optional[date] = None
    ) -> dict:
        if not summary_date:
            summary_date = date.today()

        start_datetime = func.date(summary_date)
        end_datetime = func.date(summary_date + func.interval("1 day"))

        today_in = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.IN,
                    func.date(InventoryRecord.created_at) == summary_date,
                )
            )
            .scalar()
            or 0
        )

        today_out = (
            db.query(func.sum(InventoryRecord.quantity))
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.OUT,
                    func.date(InventoryRecord.created_at) == summary_date,
                )
            )
            .scalar()
            or 0
        )

        in_count = (
            db.query(func.count(InventoryRecord.id))
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.IN,
                    func.date(InventoryRecord.created_at) == summary_date,
                )
            )
            .scalar()
            or 0
        )

        out_count = (
            db.query(func.count(InventoryRecord.id))
            .filter(
                and_(
                    InventoryRecord.type == InventoryRecordType.OUT,
                    func.date(InventoryRecord.created_at) == summary_date,
                )
            )
            .scalar()
            or 0
        )

        return {
            "date": summary_date.isoformat(),
            "total_in_quantity": today_in,
            "total_out_quantity": today_out,
            "in_count": in_count,
            "out_count": out_count,
            "net_change": today_in - today_out,
        }


inventory_service = InventoryService()
