from sqlalchemy.orm import Session
from models.exception_order import (
    ExceptionOrder,
    ExceptionOrderType,
    ExceptionOrderStatus,
    ResponsibilityParty,
)
from models.arrival_list import ArrivalList
from schemas.exception_order import (
    ExceptionOrderCreate,
    ExceptionOrderUpdate,
    ExceptionOrderProcess,
)
from services.status_log_service import StatusLogService
from typing import Optional, Tuple
from datetime import datetime
import random
import string
import json


class ExceptionOrderService:
    @staticmethod
    def generate_exception_no() -> str:
        date_str = datetime.now().strftime("%Y%m%d")
        suffix = "".join(random.choices(string.digits, k=4))
        return f"EX{date_str}{suffix}"

    @staticmethod
    def get_by_id(db: Session, exception_id: int) -> Optional[ExceptionOrder]:
        return db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()

    @staticmethod
    def list(
        db: Session,
        keyword: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        responsibility_party: Optional[str] = None,
        group_batch_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[int, list[ExceptionOrder]]:
        query = db.query(ExceptionOrder)
        if keyword:
            query = query.filter(
                (ExceptionOrder.exception_no.ilike(f"%{keyword}%"))
                | (ExceptionOrder.title.ilike(f"%{keyword}%"))
            )
        if status:
            query = query.filter(ExceptionOrder.status == status)
        if type:
            query = query.filter(ExceptionOrder.type == type)
        if responsibility_party:
            query = query.filter(ExceptionOrder.responsibility_party == responsibility_party)
        if group_batch_id:
            query = query.filter(ExceptionOrder.group_batch_id == group_batch_id)
        total = query.count()
        items = query.order_by(ExceptionOrder.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    @staticmethod
    def create(db: Session, data: ExceptionOrderCreate) -> ExceptionOrder:
        if not data.exception_no:
            data.exception_no = ExceptionOrderService.generate_exception_no()
        exception = ExceptionOrder(**data.model_dump(exclude_unset=True))
        if not exception.reported_time:
            exception.reported_time = datetime.now()
        db.add(exception)
        db.flush()
        StatusLogService.create_log(
            db=db,
            related_type="exception",
            related_id=exception.id,
            old_status=None,
            new_status=exception.status,
            change_reason="创建异常单",
            operator=data.reported_by,
        )
        return exception

    @staticmethod
    def create_from_shortage(db: Session, arrival: ArrivalList) -> ExceptionOrder:
        product_info = json.dumps(
            {
                "product_id": arrival.product_id,
                "product_sku": arrival.product_sku,
                "product_name": arrival.product_name,
                "expected": arrival.expected_quantity,
                "actual": arrival.actual_quantity,
                "shortage": arrival.shortage_quantity,
            },
            ensure_ascii=False,
        )
        data = ExceptionOrderCreate(
            group_batch_id=arrival.group_batch_id,
            arrival_list_id=arrival.id,
            exception_no=ExceptionOrderService.generate_exception_no(),
            type=ExceptionOrderType.SHORTAGE,
            title=f"到货短少-{arrival.product_name}",
            description=f"商品{arrival.product_name}(SKU:{arrival.product_sku})到货短少{arrival.shortage_quantity}份，预计{arrival.expected_quantity}份，实际{arrival.actual_quantity}份",
            product_info=product_info,
            affected_quantity=arrival.shortage_quantity,
            estimated_loss=arrival.unit_price * arrival.shortage_quantity if arrival.unit_price else 0,
            responsibility_party=ResponsibilityParty.UNKNOWN,
            status=ExceptionOrderStatus.PENDING,
            reported_by=arrival.warehouse_operator,
            reported_time=datetime.now(),
            remark=arrival.remark,
        )
        return ExceptionOrderService.create(db, data)

    @staticmethod
    def process_exception(
        db: Session,
        exception_id: int,
        data: ExceptionOrderProcess,
    ) -> Optional[ExceptionOrder]:
        exception = ExceptionOrderService.get_by_id(db, exception_id)
        if not exception:
            return None

        old_status = exception.status
        exception.status = data.status
        exception.responsibility_party = data.responsibility_party or exception.responsibility_party
        exception.responsibility_detail = data.responsibility_detail or exception.responsibility_detail
        exception.process_result = data.process_result
        exception.compensation_amount = data.compensation_amount
        exception.processor = data.processor
        exception.process_time = datetime.now()
        if data.remark:
            exception.remark = data.remark

        if old_status != data.status:
            StatusLogService.create_log(
                db=db,
                related_type="exception",
                related_id=exception.id,
                old_status=old_status,
                new_status=data.status,
                change_reason=data.process_result,
                operator=data.processor,
                extra_info={
                    "responsibility_party": exception.responsibility_party,
                    "compensation_amount": float(data.compensation_amount),
                },
            )

        db.flush()
        return exception

    @staticmethod
    def update(db: Session, exception_id: int, data: ExceptionOrderUpdate) -> Optional[ExceptionOrder]:
        exception = ExceptionOrderService.get_by_id(db, exception_id)
        if not exception:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(exception, key, value)
        db.flush()
        return exception

    @staticmethod
    def delete(db: Session, exception_id: int) -> bool:
        exception = ExceptionOrderService.get_by_id(db, exception_id)
        if not exception:
            return False
        db.delete(exception)
        db.flush()
        return True
