from typing import List, Optional, Tuple
from datetime import date, timedelta
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.models.shortage_order import (
    ShortageOrder,
    ShortageOrderStatus,
    ShortagePriority,
)
from app.models.shortage_action_log import ShortageActionLog, ShortageAction
from app.models.material_batch import MaterialBatch, MaterialBatchStatus
from app.schemas.shortage_order import (
    ShortageOrderCreate,
    ShortageOrderUpdate,
    ShortageOrderQueryParams,
    ShortageActionType,
)


class ShortageService:
    def get_by_id(self, db: Session, shortage_id: int) -> Optional[ShortageOrder]:
        return (
            db.query(ShortageOrder)
            .filter(ShortageOrder.id == shortage_id)
            .first()
        )

    def get_list(
        self, db: Session, params: ShortageOrderQueryParams
    ) -> Tuple[List[ShortageOrder], int]:
        query = db.query(ShortageOrder)

        if params.status:
            query = query.filter(ShortageOrder.status == params.status)

        if params.priority:
            query = query.filter(ShortageOrder.priority == params.priority)

        if params.responsible_person:
            query = query.filter(
                ShortageOrder.responsible_person == params.responsible_person
            )

        if params.start_date:
            query = query.filter(ShortageOrder.created_at >= params.start_date)

        if params.end_date:
            query = query.filter(ShortageOrder.created_at <= params.end_date)

        if params.keyword:
            query = query.filter(
                or_(
                    ShortageOrder.material_name.ilike(f"%{params.keyword}%"),
                    ShortageOrder.responsible_person.ilike(f"%{params.keyword}%"),
                )
            )

        total = query.count()
        orders = (
            query.order_by(
                ShortageOrder.priority.desc(), ShortageOrder.created_at.desc()
            )
            .offset(params.offset)
            .limit(params.limit)
            .all()
        )

        return orders, total

    def _create_action_log(
        self,
        db: Session,
        shortage_order_id: int,
        action: ShortageAction,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
        supplement_quantity: Optional[float] = None,
    ) -> ShortageActionLog:
        log = ShortageActionLog(
            shortage_order_id=shortage_order_id,
            action=action,
            operator_id=operator_id,
            operator=operator,
            remark=remark,
            supplement_quantity=supplement_quantity,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def create(
        self,
        db: Session,
        obj_in: ShortageOrderCreate,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
    ) -> ShortageOrder:
        db_obj = ShortageOrder(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        batch = db.query(MaterialBatch).filter(MaterialBatch.id == obj_in.batch_id).first()
        if batch:
            batch.status = MaterialBatchStatus.SHORTAGE
            db.add(batch)
            db.commit()

        self._create_action_log(
            db,
            shortage_order_id=db_obj.id,
            action=ShortageAction.CREATE,
            operator_id=operator_id,
            operator=operator,
            remark="创建短缺工单",
        )

        return db_obj

    def update(
        self,
        db: Session,
        db_obj: ShortageOrder,
        obj_in: ShortageOrderUpdate,
    ) -> ShortageOrder:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def assign(
        self,
        db: Session,
        shortage_id: int,
        responsible_person: str,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
    ) -> Optional[ShortageOrder]:
        db_obj = self.get_by_id(db, shortage_id)
        if not db_obj:
            return None

        db_obj.responsible_person = responsible_person
        db_obj.status = ShortageOrderStatus.PROCESSING
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        self._create_action_log(
            db,
            shortage_order_id=shortage_id,
            action=ShortageAction.ASSIGN,
            operator_id=operator_id,
            operator=operator,
            remark=f"分派给 {responsible_person} 处理",
        )

        return db_obj

    def supplement(
        self,
        db: Session,
        shortage_id: int,
        supplement_quantity: float,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> Optional[ShortageOrder]:
        db_obj = self.get_by_id(db, shortage_id)
        if not db_obj:
            return None

        remaining = db_obj.shortage_quantity - supplement_quantity
        if remaining <= 0:
            db_obj.status = ShortageOrderStatus.SUPPLEMENTED
        else:
            db_obj.shortage_quantity = remaining
            db_obj.status = ShortageOrderStatus.PROCESSING

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        self._create_action_log(
            db,
            shortage_order_id=shortage_id,
            action=ShortageAction.SUPPLEMENT,
            operator_id=operator_id,
            operator=operator,
            remark=remark or "补录补货",
            supplement_quantity=supplement_quantity,
        )

        return db_obj

    def retry(
        self,
        db: Session,
        shortage_id: int,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> Optional[ShortageOrder]:
        db_obj = self.get_by_id(db, shortage_id)
        if not db_obj:
            return None

        db_obj.status = ShortageOrderStatus.RETRIED
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        self._create_action_log(
            db,
            shortage_order_id=shortage_id,
            action=ShortageAction.RETRY,
            operator_id=operator_id,
            operator=operator,
            remark=remark or "重试处理",
        )

        return db_obj

    def close(
        self,
        db: Session,
        shortage_id: int,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
    ) -> Optional[ShortageOrder]:
        db_obj = self.get_by_id(db, shortage_id)
        if not db_obj:
            return None

        db_obj.status = ShortageOrderStatus.CLOSED
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        self._create_action_log(
            db,
            shortage_order_id=shortage_id,
            action=ShortageAction.CLOSE,
            operator_id=operator_id,
            operator=operator,
            remark=remark or "关闭工单",
        )

        return db_obj

    def process_action(
        self,
        db: Session,
        shortage_id: int,
        action_type: ShortageActionType,
        operator_id: Optional[int] = None,
        operator: Optional[str] = None,
        remark: Optional[str] = None,
        supplement_quantity: Optional[float] = None,
    ) -> Optional[ShortageOrder]:
        if action_type == ShortageActionType.SUPPLEMENT:
            if supplement_quantity is None or supplement_quantity <= 0:
                raise ValueError("补货数量必须大于0")
            return self.supplement(
                db, shortage_id, supplement_quantity, operator_id, operator, remark
            )
        elif action_type == ShortageActionType.RETRY:
            return self.retry(db, shortage_id, operator_id, operator, remark)
        elif action_type == ShortageActionType.CLOSE:
            return self.close(db, shortage_id, operator_id, operator, remark)
        return None

    def get_action_logs(
        self, db: Session, shortage_id: int
    ) -> List[ShortageActionLog]:
        return (
            db.query(ShortageActionLog)
            .filter(ShortageActionLog.shortage_order_id == shortage_id)
            .order_by(ShortageActionLog.created_at.desc())
            .all()
        )

    def auto_create_from_batch(
        self,
        db: Session,
        batch: MaterialBatch,
        operator: str = "system",
    ) -> Optional[ShortageOrder]:
        existing_order = (
            db.query(ShortageOrder)
            .filter(
                and_(
                    ShortageOrder.batch_id == batch.id,
                    ShortageOrder.status.in_(
                        [
                            ShortageOrderStatus.PENDING,
                            ShortageOrderStatus.PROCESSING,
                            ShortageOrderStatus.RETRIED,
                        ]
                    ),
                )
            )
            .first()
        )

        if existing_order:
            return None

        current_stock = 0
        shortage_quantity = batch.quantity - current_stock
        if shortage_quantity <= 0:
            return None

        order_data = ShortageOrderCreate(
            batch_id=batch.id,
            material_name=batch.material_name,
            shortage_quantity=shortage_quantity,
            unit=batch.unit,
            responsible_person=batch.responsible_person,
            priority=ShortagePriority.HIGH,
            status=ShortageOrderStatus.PENDING,
            deadline=date.today() + timedelta(days=3),
        )

        return self.create(db, order_data, operator=operator)

    def get_overdue_orders(self, db: Session) -> List[ShortageOrder]:
        today = date.today()
        return (
            db.query(ShortageOrder)
            .filter(
                and_(
                    ShortageOrder.deadline < today,
                    ShortageOrder.status.notin_(
                        [ShortageOrderStatus.CLOSED, ShortageOrderStatus.SUPPLEMENTED]
                    ),
                )
            )
            .all()
        )

    def get_summary(self, db: Session) -> dict:
        total = db.query(ShortageOrder).count()
        pending = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.status == ShortageOrderStatus.PENDING)
            .count()
        )
        processing = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.status == ShortageOrderStatus.PROCESSING)
            .count()
        )
        retried = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.status == ShortageOrderStatus.RETRIED)
            .count()
        )
        supplemented = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.status == ShortageOrderStatus.SUPPLEMENTED)
            .count()
        )
        closed = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.status == ShortageOrderStatus.CLOSED)
            .count()
        )

        high_priority = (
            db.query(ShortageOrder)
            .filter(ShortageOrder.priority == ShortagePriority.HIGH)
            .count()
        )

        overdue = len(self.get_overdue_orders(db))

        return {
            "total": total,
            "pending": pending,
            "processing": processing,
            "retried": retried,
            "supplemented": supplemented,
            "closed": closed,
            "high_priority": high_priority,
            "overdue": overdue,
        }


shortage_service = ShortageService()
