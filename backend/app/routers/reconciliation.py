from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import ReconciliationDiff, Contract, Bill
from ..schemas import (
    ReconciliationDiffCreate,
    ReconciliationDiffUpdate,
    ReconciliationDiffResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..utils.timeline import create_timeline

router = APIRouter(prefix="/api/reconciliation", tags=["对账差异管理"])


@router.post("", response_model=ReconciliationDiffResponse, status_code=status.HTTP_201_CREATED)
def create_reconciliation_diff(diff: ReconciliationDiffCreate, db: Session = Depends(get_db)):
    db_contract = db.query(Contract).filter(Contract.id == diff.contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail=f"合同ID {diff.contract_id} 不存在")

    if diff.bill_id:
        db_bill = db.query(Bill).filter(Bill.id == diff.bill_id).first()
        if not db_bill:
            raise HTTPException(status_code=404, detail=f"单据ID {diff.bill_id} 不存在")
        if db_bill.contract_id != diff.contract_id:
            raise HTTPException(status_code=400, detail="单据不属于指定合同")

    existing = db.query(ReconciliationDiff).filter(ReconciliationDiff.diff_no == diff.diff_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"差异编号 {diff.diff_no} 已存在")

    db_diff = ReconciliationDiff(**diff.model_dump())
    db.add(db_diff)
    db.commit()
    db.refresh(db_diff)

    create_timeline(
        db=db,
        operation_type="create",
        status=db_diff.status,
        reconciliation_diff_id=db_diff.id,
        contract_id=db_diff.contract_id,
        bill_id=db_diff.bill_id,
        remark="创建对账差异记录",
    )

    return db_diff


@router.get("", response_model=PaginatedResponse[ReconciliationDiffResponse])
def get_reconciliation_diffs(
    pagination: PaginationParams = Depends(),
    contract_id: Optional[int] = None,
    bill_id: Optional[int] = None,
    diff_type: Optional[str] = None,
    handled_by: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ReconciliationDiff)

    if pagination.keyword:
        query = query.filter(
            or_(
                ReconciliationDiff.diff_no.contains(pagination.keyword),
                ReconciliationDiff.handler_conclusion.contains(pagination.keyword),
                ReconciliationDiff.remark.contains(pagination.keyword),
            )
        )
    if pagination.status:
        query = query.filter(ReconciliationDiff.status == pagination.status)
    if contract_id:
        query = query.filter(ReconciliationDiff.contract_id == contract_id)
    if bill_id:
        query = query.filter(ReconciliationDiff.bill_id == bill_id)
    if diff_type:
        query = query.filter(ReconciliationDiff.diff_type == diff_type)
    if handled_by:
        query = query.filter(ReconciliationDiff.handled_by == handled_by)
    if pagination.start_date:
        query = query.filter(ReconciliationDiff.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(ReconciliationDiff.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(ReconciliationDiff.created_at.desc())
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


@router.get("/{diff_id}", response_model=ReconciliationDiffResponse)
def get_reconciliation_diff(diff_id: int, db: Session = Depends(get_db)):
    diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not diff:
        raise HTTPException(status_code=404, detail="对账差异记录不存在")
    return diff


@router.put("/{diff_id}", response_model=ReconciliationDiffResponse)
def update_reconciliation_diff(
    diff_id: int,
    diff_update: ReconciliationDiffUpdate,
    db: Session = Depends(get_db),
):
    db_diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not db_diff:
        raise HTTPException(status_code=404, detail="对账差异记录不存在")

    previous_status = db_diff.status
    update_data = diff_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] in ["resolved", "rejected"] and "handled_by" in update_data:
        update_data["handled_at"] = datetime.now()

    for key, value in update_data.items():
        setattr(db_diff, key, value)

    db.commit()
    db.refresh(db_diff)

    if "status" in update_data and previous_status != db_diff.status:
        create_timeline(
            db=db,
            operation_type="status_change",
            status=db_diff.status,
            previous_status=previous_status,
            reconciliation_diff_id=db_diff.id,
            contract_id=db_diff.contract_id,
            bill_id=db_diff.bill_id,
            remark=f"状态变更: {previous_status} -> {db_diff.status}",
        )
    else:
        create_timeline(
            db=db,
            operation_type="update",
            status=db_diff.status,
            reconciliation_diff_id=db_diff.id,
            contract_id=db_diff.contract_id,
            bill_id=db_diff.bill_id,
            remark="更新对账差异记录",
        )

    return db_diff


@router.delete("/{diff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reconciliation_diff(diff_id: int, db: Session = Depends(get_db)):
    db_diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not db_diff:
        raise HTTPException(status_code=404, detail="对账差异记录不存在")

    db.delete(db_diff)
    db.commit()

    return None


@router.post("/{diff_id}/handle", response_model=ReconciliationDiffResponse)
def handle_reconciliation_diff(
    diff_id: int,
    diff_update: ReconciliationDiffUpdate,
    db: Session = Depends(get_db),
):
    db_diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not db_diff:
        raise HTTPException(status_code=404, detail="对账差异记录不存在")

    if db_diff.status in ["resolved", "rejected"]:
        raise HTTPException(status_code=400, detail="该差异已处理，无法重复处理")

    previous_status = db_diff.status
    update_data = diff_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] in ["resolved", "rejected"]:
        update_data["handled_at"] = datetime.now()

    for key, value in update_data.items():
        setattr(db_diff, key, value)

    db.commit()
    db.refresh(db_diff)

    create_timeline(
        db=db,
        operation_type="handle",
        status=db_diff.status,
        previous_status=previous_status,
        reconciliation_diff_id=db_diff.id,
        contract_id=db_diff.contract_id,
        bill_id=db_diff.bill_id,
        remark=f"处理对账差异: {previous_status} -> {db_diff.status}",
    )

    return db_diff


@router.get("/contract/{contract_id}", response_model=List[ReconciliationDiffResponse])
def get_contract_reconciliation_diffs(
    contract_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    query = db.query(ReconciliationDiff).filter(ReconciliationDiff.contract_id == contract_id)
    if status:
        query = query.filter(ReconciliationDiff.status == status)

    return query.order_by(ReconciliationDiff.created_at.desc()).all()
