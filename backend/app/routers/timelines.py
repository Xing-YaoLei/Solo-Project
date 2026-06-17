from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List

from ..database import get_db
from ..models import StatusTimeline, Contract, Bill, ReconciliationDiff, ExceptionOrder
from ..schemas import (
    StatusTimelineResponse,
    PaginatedResponse,
    PaginationParams,
)

router = APIRouter(prefix="/api/timelines", tags=["状态时间线"])


@router.get("", response_model=PaginatedResponse[StatusTimelineResponse])
def get_timelines(
    pagination: PaginationParams = Depends(),
    contract_id: Optional[int] = None,
    bill_id: Optional[int] = None,
    reconciliation_diff_id: Optional[int] = None,
    exception_order_id: Optional[int] = None,
    operation_type: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(StatusTimeline)

    if pagination.keyword:
        query = query.filter(
            or_(
                StatusTimeline.status.contains(pagination.keyword),
                StatusTimeline.operation_type.contains(pagination.keyword),
                StatusTimeline.remark.contains(pagination.keyword),
            )
        )
    if pagination.status:
        query = query.filter(StatusTimeline.status == pagination.status)
    if contract_id:
        query = query.filter(StatusTimeline.contract_id == contract_id)
    if bill_id:
        query = query.filter(StatusTimeline.bill_id == bill_id)
    if reconciliation_diff_id:
        query = query.filter(StatusTimeline.reconciliation_diff_id == reconciliation_diff_id)
    if exception_order_id:
        query = query.filter(StatusTimeline.exception_order_id == exception_order_id)
    if operation_type:
        query = query.filter(StatusTimeline.operation_type == operation_type)
    if operator_id:
        query = query.filter(StatusTimeline.operator_id == operator_id)
    if pagination.start_date:
        query = query.filter(StatusTimeline.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(StatusTimeline.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(StatusTimeline.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=total_pages,
    )


@router.get("/contract/{contract_id}", response_model=List[StatusTimelineResponse])
def get_contract_timelines(
    contract_id: int,
    operation_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    query = db.query(StatusTimeline).filter(StatusTimeline.contract_id == contract_id)
    if operation_type:
        query = query.filter(StatusTimeline.operation_type == operation_type)

    return query.order_by(StatusTimeline.created_at.desc()).all()


@router.get("/bill/{bill_id}", response_model=List[StatusTimelineResponse])
def get_bill_timelines(
    bill_id: int,
    operation_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    query = db.query(StatusTimeline).filter(StatusTimeline.bill_id == bill_id)
    if operation_type:
        query = query.filter(StatusTimeline.operation_type == operation_type)

    return query.order_by(StatusTimeline.created_at.desc()).all()


@router.get("/reconciliation/{diff_id}", response_model=List[StatusTimelineResponse])
def get_reconciliation_timelines(
    diff_id: int,
    operation_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not db_diff:
        raise HTTPException(status_code=404, detail="对账差异记录不存在")

    query = db.query(StatusTimeline).filter(StatusTimeline.reconciliation_diff_id == diff_id)
    if operation_type:
        query = query.filter(StatusTimeline.operation_type == operation_type)

    return query.order_by(StatusTimeline.created_at.desc()).all()


@router.get("/exception/{exception_id}", response_model=List[StatusTimelineResponse])
def get_exception_timelines(
    exception_id: int,
    operation_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    query = db.query(StatusTimeline).filter(StatusTimeline.exception_order_id == exception_id)
    if operation_type:
        query = query.filter(StatusTimeline.operation_type == operation_type)

    return query.order_by(StatusTimeline.created_at.desc()).all()


@router.get("/{timeline_id}", response_model=StatusTimelineResponse)
def get_timeline(timeline_id: int, db: Session = Depends(get_db)):
    timeline = db.query(StatusTimeline).filter(StatusTimeline.id == timeline_id).first()
    if not timeline:
        raise HTTPException(status_code=404, detail="时间线记录不存在")
    return timeline
