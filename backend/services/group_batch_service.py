from sqlalchemy.orm import Session
from models.group_batch import GroupBatch, GroupBatchStatus
from schemas.group_batch import GroupBatchCreate, GroupBatchUpdate, GroupBatchStatusUpdate
from services.status_log_service import StatusLogService
from typing import Optional, Tuple
from datetime import datetime
import random
import string


class GroupBatchService:
    @staticmethod
    def generate_batch_no() -> str:
        date_str = datetime.now().strftime("%Y%m%d")
        suffix = "".join(random.choices(string.digits, k=4))
        return f"PT{date_str}{suffix}"

    @staticmethod
    def get_by_id(db: Session, batch_id: int) -> Optional[GroupBatch]:
        return db.query(GroupBatch).filter(GroupBatch.id == batch_id).first()

    @staticmethod
    def get_by_batch_no(db: Session, batch_no: str) -> Optional[GroupBatch]:
        return db.query(GroupBatch).filter(GroupBatch.batch_no == batch_no).first()

    @staticmethod
    def list(
        db: Session,
        keyword: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[int, list[GroupBatch]]:
        query = db.query(GroupBatch)
        if keyword:
            query = query.filter(
                (GroupBatch.batch_no.ilike(f"%{keyword}%"))
                | (GroupBatch.name.ilike(f"%{keyword}%"))
            )
        if status:
            query = query.filter(GroupBatch.status == status)
        total = query.count()
        items = query.order_by(GroupBatch.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    @staticmethod
    def create(db: Session, data: GroupBatchCreate) -> GroupBatch:
        if not data.batch_no:
            data.batch_no = GroupBatchService.generate_batch_no()
        batch = GroupBatch(**data.model_dump(exclude_unset=True))
        db.add(batch)
        db.flush()
        StatusLogService.create_log(
            db=db,
            related_type="group_batch",
            related_id=batch.id,
            old_status=None,
            new_status=batch.status,
            change_reason="创建团单",
            operator=data.operator,
        )
        return batch

    @staticmethod
    def update(db: Session, batch_id: int, data: GroupBatchUpdate) -> Optional[GroupBatch]:
        batch = GroupBatchService.get_by_id(db, batch_id)
        if not batch:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(batch, key, value)
        db.flush()
        return batch

    @staticmethod
    def update_status(
        db: Session,
        batch_id: int,
        data: GroupBatchStatusUpdate,
    ) -> Optional[GroupBatch]:
        batch = GroupBatchService.get_by_id(db, batch_id)
        if not batch:
            return None
        old_status = batch.status
        if old_status != data.status:
            batch.status = data.status
            if data.status == GroupBatchStatus.ARRIVED and not batch.actual_arrival_time:
                batch.actual_arrival_time = datetime.now()
            StatusLogService.create_log(
                db=db,
                related_type="group_batch",
                related_id=batch.id,
                old_status=old_status,
                new_status=data.status,
                change_reason=data.change_reason,
                operator=data.operator,
            )
        db.flush()
        return batch

    @staticmethod
    def delete(db: Session, batch_id: int) -> bool:
        batch = GroupBatchService.get_by_id(db, batch_id)
        if not batch:
            return False
        db.delete(batch)
        db.flush()
        return True
