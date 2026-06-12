from sqlalchemy.orm import Session
from models.arrival_list import ArrivalList, ArrivalListStatus
from models.group_batch import GroupBatch
from schemas.arrival_list import ArrivalListCreate, ArrivalListUpdate, ArrivalConfirm
from services.status_log_service import StatusLogService
from services.exception_order_service import ExceptionOrderService
from typing import Optional, Tuple
from datetime import datetime


class ArrivalListService:
    @staticmethod
    def get_by_id(db: Session, arrival_id: int) -> Optional[ArrivalList]:
        return db.query(ArrivalList).filter(ArrivalList.id == arrival_id).first()

    @staticmethod
    def list_by_batch(
        db: Session,
        group_batch_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[int, list[ArrivalList]]:
        query = db.query(ArrivalList).filter(ArrivalList.group_batch_id == group_batch_id)
        total = query.count()
        items = query.order_by(ArrivalList.id.desc()).offset(skip).limit(limit).all()
        return total, items

    @staticmethod
    def list(
        db: Session,
        keyword: Optional[str] = None,
        status: Optional[str] = None,
        group_batch_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[int, list[ArrivalList]]:
        query = db.query(ArrivalList)
        if keyword:
            query = query.filter(
                (ArrivalList.product_sku.ilike(f"%{keyword}%"))
                | (ArrivalList.product_name.ilike(f"%{keyword}%"))
            )
        if status:
            query = query.filter(ArrivalList.status == status)
        if group_batch_id:
            query = query.filter(ArrivalList.group_batch_id == group_batch_id)
        total = query.count()
        items = query.order_by(ArrivalList.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    @staticmethod
    def create(db: Session, data: ArrivalListCreate) -> ArrivalList:
        arrival = ArrivalList(**data.model_dump(exclude_unset=True))
        arrival.shortage_quantity = max(0, arrival.expected_quantity - arrival.actual_quantity)
        if arrival.unit_price and arrival.actual_quantity:
            arrival.total_amount = arrival.unit_price * arrival.actual_quantity
        db.add(arrival)
        db.flush()
        StatusLogService.create_log(
            db=db,
            related_type="arrival_list",
            related_id=arrival.id,
            old_status=None,
            new_status=arrival.status,
            change_reason="创建到货清单",
            operator=data.warehouse_operator,
        )
        return arrival

    @staticmethod
    def update(db: Session, arrival_id: int, data: ArrivalListUpdate) -> Optional[ArrivalList]:
        arrival = ArrivalListService.get_by_id(db, arrival_id)
        if not arrival:
            return None
        update_data = data.model_dump(exclude_unset=True)
        
        if "status" in update_data:
            old_status = arrival.status
            new_status = update_data["status"]
            if old_status != new_status:
                StatusLogService.create_log(
                    db=db,
                    related_type="arrival_list",
                    related_id=arrival.id,
                    old_status=old_status,
                    new_status=new_status,
                    change_reason=getattr(data, "change_reason", "更新到货信息") or "更新到货信息",
                    operator=getattr(data, "warehouse_operator", None),
                )
        
        for key, value in update_data.items():
            setattr(arrival, key, value)
        arrival.shortage_quantity = max(0, arrival.expected_quantity - arrival.actual_quantity)
        if arrival.unit_price and arrival.actual_quantity:
            arrival.total_amount = arrival.unit_price * arrival.actual_quantity
        db.flush()
        return arrival

    @staticmethod
    def confirm_arrival(
        db: Session,
        arrival_id: int,
        data: ArrivalConfirm,
    ) -> Optional[ArrivalList]:
        arrival = ArrivalListService.get_by_id(db, arrival_id)
        if not arrival:
            return None

        old_status = arrival.status
        arrival.actual_quantity = data.actual_quantity
        arrival.arrival_time = data.arrival_time or datetime.now()
        arrival.warehouse_operator = data.warehouse_operator
        if data.remark:
            arrival.remark = data.remark

        arrival.shortage_quantity = max(0, arrival.expected_quantity - arrival.actual_quantity)
        if arrival.unit_price and arrival.actual_quantity:
            arrival.total_amount = arrival.unit_price * arrival.actual_quantity

        if arrival.shortage_quantity > 0:
            new_status = ArrivalListStatus.SHORTAGE
            arrival.has_exception = 1
        elif arrival.actual_quantity >= arrival.expected_quantity:
            new_status = ArrivalListStatus.COMPLETED
        elif arrival.actual_quantity > 0:
            new_status = ArrivalListStatus.PARTIAL
        else:
            new_status = ArrivalListStatus.PENDING

        arrival.status = new_status

        if old_status != new_status:
            StatusLogService.create_log(
                db=db,
                related_type="arrival_list",
                related_id=arrival.id,
                old_status=old_status,
                new_status=new_status,
                change_reason="到货确认",
                operator=data.warehouse_operator,
                extra_info={
                    "expected": arrival.expected_quantity,
                    "actual": arrival.actual_quantity,
                    "shortage": arrival.shortage_quantity,
                },
            )

        if arrival.shortage_quantity > 0 and data.create_exception_on_shortage:
            ExceptionOrderService.create_from_shortage(db, arrival)

        batch = db.query(GroupBatch).filter(GroupBatch.id == arrival.group_batch_id).first()
        if batch:
            all_arrivals = db.query(ArrivalList).filter(ArrivalList.group_batch_id == batch.id).all()
            all_completed = all(
                a.status in [ArrivalListStatus.COMPLETED, ArrivalListStatus.SHORTAGE]
                for a in all_arrivals
            )
            if all_completed:
                from models.group_batch import GroupBatchStatus
                batch.status = GroupBatchStatus.ARRIVED
                batch.actual_arrival_time = datetime.now()

        db.flush()
        return arrival

    @staticmethod
    def delete(db: Session, arrival_id: int) -> bool:
        arrival = ArrivalListService.get_by_id(db, arrival_id)
        if not arrival:
            return False
        db.delete(arrival)
        db.flush()
        return True
