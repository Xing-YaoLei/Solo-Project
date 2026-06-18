from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.auth import get_current_user
from ..core.celery_app import celery_app
from ..models import User, PartShortage, PartShortageStatus, Part, WorkOrder
from ..schemas import (
    PartShortageCreate,
    PartShortageUpdate,
    PartShortageResponse,
)

router = APIRouter(prefix="/shortages", tags=["缺货管理"])


@router.get("", response_model=List[PartShortageResponse])
def list_shortages(
    status: Optional[PartShortageStatus] = None,
    open_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PartShortage)
        .options(
            joinedload(PartShortage.part),
            joinedload(PartShortage.work_order),
            joinedload(PartShortage.handler),
        )
    )
    if status:
        query = query.filter(PartShortage.status == status)
    if open_only:
        query = query.filter(PartShortage.status != PartShortageStatus.CLOSED)
    return query.order_by(PartShortage.reported_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PartShortageResponse)
def create_shortage(
    shortage_in: PartShortageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    part = db.query(Part).filter(Part.id == shortage_in.part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="配件不存在")

    shortage = PartShortage(**shortage_in.model_dump())
    db.add(shortage)
    db.commit()
    db.refresh(shortage)

    try:
        celery_app.send_task(
            "app.celery_tasks.tasks.notify_shortage_handler",
            args=[shortage.id, shortage.handler_id or 0, part.name],
        )
    except Exception:
        pass

    shortage.part = part
    return shortage


@router.get("/{shortage_id}", response_model=PartShortageResponse)
def get_shortage(
    shortage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shortage = (
        db.query(PartShortage)
        .options(
            joinedload(PartShortage.part),
            joinedload(PartShortage.work_order),
            joinedload(PartShortage.handler),
        )
        .filter(PartShortage.id == shortage_id)
        .first()
    )
    if not shortage:
        raise HTTPException(status_code=404, detail="缺货记录不存在")
    return shortage


@router.put("/{shortage_id}", response_model=PartShortageResponse)
def update_shortage(
    shortage_id: int,
    shortage_in: PartShortageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shortage = (
        db.query(PartShortage)
        .options(
            joinedload(PartShortage.part),
            joinedload(PartShortage.work_order),
            joinedload(PartShortage.handler),
        )
        .filter(PartShortage.id == shortage_id)
        .first()
    )
    if not shortage:
        raise HTTPException(status_code=404, detail="缺货记录不存在")

    update_data = shortage_in.model_dump(exclude_unset=True)
    if (
        "status" in update_data
        and update_data["status"] == PartShortageStatus.CLOSED
        and not shortage.closed_at
    ):
        update_data["closed_at"] = datetime.utcnow()
        if "handler_id" not in update_data:
            update_data["handler_id"] = current_user.id

    for key, value in update_data.items():
        setattr(shortage, key, value)

    db.commit()
    db.refresh(shortage)
    return shortage


@router.post("/{shortage_id}/close", response_model=PartShortageResponse)
def close_shortage(
    shortage_id: int,
    shortage_in: PartShortageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shortage = (
        db.query(PartShortage)
        .options(
            joinedload(PartShortage.part),
            joinedload(PartShortage.work_order),
            joinedload(PartShortage.handler),
        )
        .filter(PartShortage.id == shortage_id)
        .first()
    )
    if not shortage:
        raise HTTPException(status_code=404, detail="缺货记录不存在")

    shortage.status = PartShortageStatus.CLOSED
    shortage.closed_at = datetime.utcnow()
    shortage.handler_id = current_user.id
    if shortage_in.action_taken:
        shortage.action_taken = shortage_in.action_taken
    if shortage_in.reason:
        shortage.reason = shortage_in.reason

    db.commit()
    db.refresh(shortage)
    return shortage
