from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from ..database import get_db
from ..models import Bill, BillItem, Contract
from ..schemas import (
    BillCreate,
    BillUpdate,
    BillResponse,
    BillItemCreate,
    BillItemUpdate,
    BillItemResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..utils.timeline import create_timeline
from ..utils.response import success_response

router = APIRouter(prefix="/api/bills", tags=["单据管理"])


def validate_bill_amount(bill: Bill) -> dict:
    items_total = sum(item.actual_amount for item in bill.items) if bill.items else Decimal(0)
    diff = abs(bill.total_amount - items_total)
    is_valid = diff < Decimal("0.01")
    return {
        "is_valid": is_valid,
        "bill_total": bill.total_amount,
        "items_total": items_total,
        "diff_amount": diff,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_bill(bill: BillCreate, db: Session = Depends(get_db)):
    db_contract = db.query(Contract).filter(Contract.id == bill.contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail=f"合同ID {bill.contract_id} 不存在")

    existing = db.query(Bill).filter(Bill.bill_no == bill.bill_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"单据编号 {bill.bill_no} 已存在")

    bill_data = bill.model_dump(exclude={"items"})
    db_bill = Bill(**bill_data)

    if bill.items:
        for item_data in bill.items:
            item_dict = item_data.model_dump()
            db_item = BillItem(**item_dict)
            db_bill.items.append(db_item)

    validation = validate_bill_amount(db_bill)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"金额校验失败: 单据总金额({validation['bill_total']})与明细合计({validation['items_total']})不一致, 差额: {validation['diff_amount']}",
        )

    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)

    create_timeline(
        db=db,
        operation_type="create",
        status=db_bill.status,
        bill_id=db_bill.id,
        contract_id=db_bill.contract_id,
        remark="创建单据",
    )

    return success_response(db_bill, "创建单据成功")


@router.get("")
def get_bills(
    pagination: PaginationParams = Depends(),
    contract_id: Optional[int] = None,
    bill_type: Optional[str] = None,
    created_by: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Bill)

    if pagination.keyword:
        query = query.filter(
            or_(
                Bill.bill_no.contains(pagination.keyword),
                Bill.bill_name.contains(pagination.keyword),
            )
        )
    if pagination.status:
        query = query.filter(Bill.status == pagination.status)
    if contract_id:
        query = query.filter(Bill.contract_id == contract_id)
    if bill_type:
        query = query.filter(Bill.bill_type == bill_type)
    if created_by:
        query = query.filter(Bill.created_by == created_by)
    if pagination.start_date:
        query = query.filter(Bill.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(Bill.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(Bill.created_at.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = (total + pagination.page_size - 1) // pagination.page_size

    return success_response(
        PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
        ),
        "获取单据列表成功",
    )


@router.get("/{bill_id}")
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="单据不存在")
    return success_response(bill, "获取单据详情成功")


@router.put("/{bill_id}")
def update_bill(
    bill_id: int,
    bill_update: BillUpdate,
    db: Session = Depends(get_db),
):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    previous_status = db_bill.status
    update_data = bill_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == "verified" and "verified_by" in update_data:
        update_data["verified_at"] = datetime.now()

    for key, value in update_data.items():
        setattr(db_bill, key, value)

    validation = validate_bill_amount(db_bill)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"金额校验失败: 单据总金额({validation['bill_total']})与明细合计({validation['items_total']})不一致, 差额: {validation['diff_amount']}",
        )

    db.commit()
    db.refresh(db_bill)

    if "status" in update_data and previous_status != db_bill.status:
        create_timeline(
            db=db,
            operation_type="status_change",
            status=db_bill.status,
            previous_status=previous_status,
            bill_id=db_bill.id,
            contract_id=db_bill.contract_id,
            remark=f"状态变更: {previous_status} -> {db_bill.status}",
        )
    else:
        create_timeline(
            db=db,
            operation_type="update",
            status=db_bill.status,
            bill_id=db_bill.id,
            contract_id=db_bill.contract_id,
            remark="更新单据信息",
        )

    return success_response(db_bill, "更新单据成功")


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    db.delete(db_bill)
    db.commit()

    return None


@router.get("/{bill_id}/items")
def get_bill_items(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    return success_response(db_bill.items, "获取单据明细列表成功")


@router.post("/{bill_id}/items", status_code=status.HTTP_201_CREATED)
def create_bill_item(
    bill_id: int,
    item: BillItemCreate,
    db: Session = Depends(get_db),
):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    item_data = item.model_dump(exclude={"bill_id"})
    db_item = BillItem(bill_id=bill_id, **item_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    db.refresh(db_bill)
    validation = validate_bill_amount(db_bill)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"金额校验失败: 单据总金额({validation['bill_total']})与明细合计({validation['items_total']})不一致, 差额: {validation['diff_amount']}",
        )

    create_timeline(
        db=db,
        operation_type="add_item",
        status=db_bill.status,
        bill_id=bill_id,
        contract_id=db_bill.contract_id,
        remark=f"添加明细: {item.item_name}",
    )

    return success_response(db_item, "创建单据明细成功")


@router.put("/{bill_id}/items/{item_id}")
def update_bill_item(
    bill_id: int,
    item_id: int,
    item_update: BillItemUpdate,
    db: Session = Depends(get_db),
):
    db_item = (
        db.query(BillItem)
        .filter(and_(BillItem.id == item_id, BillItem.bill_id == bill_id))
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="单据明细不存在")

    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)

    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    validation = validate_bill_amount(db_bill)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"金额校验失败: 单据总金额({validation['bill_total']})与明细合计({validation['items_total']})不一致, 差额: {validation['diff_amount']}",
        )

    create_timeline(
        db=db,
        operation_type="update_item",
        status=db_bill.status,
        bill_id=bill_id,
        contract_id=db_bill.contract_id,
        remark=f"更新明细: {db_item.item_name}",
    )

    return success_response(db_item, "更新单据明细成功")


@router.delete("/{bill_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill_item(
    bill_id: int,
    item_id: int,
    db: Session = Depends(get_db),
):
    db_item = (
        db.query(BillItem)
        .filter(and_(BillItem.id == item_id, BillItem.bill_id == bill_id))
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="单据明细不存在")

    item_name = db_item.item_name
    db.delete(db_item)
    db.commit()

    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    validation = validate_bill_amount(db_bill)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"金额校验失败: 单据总金额({validation['bill_total']})与明细合计({validation['items_total']})不一致, 差额: {validation['diff_amount']}",
        )

    create_timeline(
        db=db,
        operation_type="delete_item",
        status=db_bill.status,
        bill_id=bill_id,
        contract_id=db_bill.contract_id,
        remark=f"删除明细: {item_name}",
    )

    return None


@router.get("/{bill_id}/validate")
def validate_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    validation = validate_bill_amount(db_bill)
    return success_response(validation, "单据金额校验成功")
