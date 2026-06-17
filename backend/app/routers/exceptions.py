from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from ..database import get_db
from ..models import ExceptionOrder, ExceptionAffectedObject, Contract, Bill, ReconciliationDiff
from ..schemas import (
    ExceptionOrderCreate,
    ExceptionOrderUpdate,
    ExceptionOrderResponse,
    ExceptionAffectedObjectCreate,
    ExceptionAffectedObjectUpdate,
    ExceptionAffectedObjectResponse,
    PaginatedResponse,
    PaginationParams,
)
from ..utils.timeline import create_timeline
from ..utils.response import success_response

router = APIRouter(prefix="/api/exceptions", tags=["异常单管理"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_exception_order(exception: ExceptionOrderCreate, db: Session = Depends(get_db)):
    if exception.contract_id:
        db_contract = db.query(Contract).filter(Contract.id == exception.contract_id).first()
        if not db_contract:
            raise HTTPException(status_code=404, detail=f"合同ID {exception.contract_id} 不存在")

    if exception.bill_id:
        db_bill = db.query(Bill).filter(Bill.id == exception.bill_id).first()
        if not db_bill:
            raise HTTPException(status_code=404, detail=f"单据ID {exception.bill_id} 不存在")

    if exception.reconciliation_diff_id:
        db_diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == exception.reconciliation_diff_id).first()
        if not db_diff:
            raise HTTPException(status_code=404, detail=f"对账差异ID {exception.reconciliation_diff_id} 不存在")

    existing = db.query(ExceptionOrder).filter(ExceptionOrder.exception_no == exception.exception_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"异常单编号 {exception.exception_no} 已存在")

    exception_data = exception.model_dump(exclude={"affected_objects"})

    if exception.diff_amount and exception.diff_amount > Decimal("10000"):
        exception_data["priority"] = "high"

    db_exception = ExceptionOrder(**exception_data)

    if exception.affected_objects:
        for obj_data in exception.affected_objects:
            obj_dict = obj_data.model_dump()
            db_obj = ExceptionAffectedObject(**obj_dict)
            db_exception.affected_objects.append(db_obj)

    db.add(db_exception)
    db.commit()
    db.refresh(db_exception)

    create_timeline(
        db=db,
        operation_type="create",
        status=db_exception.status,
        exception_order_id=db_exception.id,
        contract_id=db_exception.contract_id,
        bill_id=db_exception.bill_id,
        reconciliation_diff_id=db_exception.reconciliation_diff_id,
        remark="创建异常单",
    )

    return success_response(db_exception, "创建异常单成功")


@router.get("")
def get_exception_orders(
    pagination: PaginationParams = Depends(),
    contract_id: Optional[int] = None,
    bill_id: Optional[int] = None,
    reconciliation_diff_id: Optional[int] = None,
    exception_type: Optional[str] = None,
    priority: Optional[str] = None,
    handler_id: Optional[int] = None,
    supervisor_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ExceptionOrder)

    if pagination.keyword:
        query = query.filter(
            or_(
                ExceptionOrder.exception_no.contains(pagination.keyword),
                ExceptionOrder.title.contains(pagination.keyword),
                ExceptionOrder.description.contains(pagination.keyword),
            )
        )
    if pagination.status:
        query = query.filter(ExceptionOrder.status == pagination.status)
    if contract_id:
        query = query.filter(ExceptionOrder.contract_id == contract_id)
    if bill_id:
        query = query.filter(ExceptionOrder.bill_id == bill_id)
    if reconciliation_diff_id:
        query = query.filter(ExceptionOrder.reconciliation_diff_id == reconciliation_diff_id)
    if exception_type:
        query = query.filter(ExceptionOrder.exception_type == exception_type)
    if priority:
        query = query.filter(ExceptionOrder.priority == priority)
    if handler_id:
        query = query.filter(ExceptionOrder.handler_id == handler_id)
    if supervisor_id:
        query = query.filter(ExceptionOrder.supervisor_id == supervisor_id)
    if pagination.start_date:
        query = query.filter(ExceptionOrder.created_at >= pagination.start_date)
    if pagination.end_date:
        query = query.filter(ExceptionOrder.created_at <= pagination.end_date)

    total = query.count()
    items = (
        query.order_by(ExceptionOrder.created_at.desc())
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
        "获取异常单列表成功",
    )


@router.get("/{exception_id}")
def get_exception_order(exception_id: int, db: Session = Depends(get_db)):
    exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return success_response(exception, "获取异常单详情成功")


@router.put("/{exception_id}")
def update_exception_order(
    exception_id: int,
    exception_update: ExceptionOrderUpdate,
    db: Session = Depends(get_db),
):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    previous_status = db_exception.status
    update_data = exception_update.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == "closed":
        update_data["closed_at"] = datetime.now()

    for key, value in update_data.items():
        setattr(db_exception, key, value)

    db.commit()
    db.refresh(db_exception)

    if "status" in update_data and previous_status != db_exception.status:
        create_timeline(
            db=db,
            operation_type="status_change",
            status=db_exception.status,
            previous_status=previous_status,
            exception_order_id=db_exception.id,
            contract_id=db_exception.contract_id,
            bill_id=db_exception.bill_id,
            reconciliation_diff_id=db_exception.reconciliation_diff_id,
            remark=f"状态变更: {previous_status} -> {db_exception.status}",
        )
    else:
        create_timeline(
            db=db,
            operation_type="update",
            status=db_exception.status,
            exception_order_id=db_exception.id,
            contract_id=db_exception.contract_id,
            bill_id=db_exception.bill_id,
            reconciliation_diff_id=db_exception.reconciliation_diff_id,
            remark="更新异常单信息",
        )

    return success_response(db_exception, "更新异常单成功")


@router.delete("/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exception_order(exception_id: int, db: Session = Depends(get_db)):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    db.delete(db_exception)
    db.commit()

    return None


@router.get("/{exception_id}/affected-objects")
def get_affected_objects(exception_id: int, db: Session = Depends(get_db)):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    return success_response(db_exception.affected_objects, "获取影响对象列表成功")


@router.post("/{exception_id}/affected-objects", status_code=status.HTTP_201_CREATED)
def add_affected_object(
    exception_id: int,
    affected_object: ExceptionAffectedObjectCreate,
    db: Session = Depends(get_db),
):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    obj_data = affected_object.model_dump(exclude={"exception_order_id"})
    db_obj = ExceptionAffectedObject(exception_order_id=exception_id, **obj_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    create_timeline(
        db=db,
        operation_type="add_affected",
        status=db_exception.status,
        exception_order_id=exception_id,
        contract_id=db_exception.contract_id,
        bill_id=db_exception.bill_id,
        reconciliation_diff_id=db_exception.reconciliation_diff_id,
        remark=f"添加影响对象: {affected_object.object_name}",
    )

    return success_response(db_obj, "添加影响对象成功")


@router.put("/{exception_id}/affected-objects/{obj_id}")
def update_affected_object(
    exception_id: int,
    obj_id: int,
    obj_update: ExceptionAffectedObjectUpdate,
    db: Session = Depends(get_db),
):
    db_obj = (
        db.query(ExceptionAffectedObject)
        .filter(
            and_(
                ExceptionAffectedObject.id == obj_id,
                ExceptionAffectedObject.exception_order_id == exception_id,
            )
        )
        .first()
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail="影响对象不存在")

    update_data = obj_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)

    db.commit()
    db.refresh(db_obj)

    return success_response(db_obj, "更新影响对象成功")


@router.delete("/{exception_id}/affected-objects/{obj_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_affected_object(
    exception_id: int,
    obj_id: int,
    db: Session = Depends(get_db),
):
    db_obj = (
        db.query(ExceptionAffectedObject)
        .filter(
            and_(
                ExceptionAffectedObject.id == obj_id,
                ExceptionAffectedObject.exception_order_id == exception_id,
            )
        )
        .first()
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail="影响对象不存在")

    db.delete(db_obj)
    db.commit()

    return None


@router.post("/{exception_id}/close")
def close_exception_order(
    exception_id: int,
    final_conclusion: str = Query(...),
    db: Session = Depends(get_db),
):
    db_exception = db.query(ExceptionOrder).filter(ExceptionOrder.id == exception_id).first()
    if not db_exception:
        raise HTTPException(status_code=404, detail="异常单不存在")

    if db_exception.status == "closed":
        raise HTTPException(status_code=400, detail="该异常单已关闭")

    previous_status = db_exception.status
    db_exception.status = "closed"
    db_exception.final_conclusion = final_conclusion
    db_exception.closed_at = datetime.now()

    db.commit()
    db.refresh(db_exception)

    create_timeline(
        db=db,
        operation_type="close",
        status=db_exception.status,
        previous_status=previous_status,
        exception_order_id=db_exception.id,
        contract_id=db_exception.contract_id,
        bill_id=db_exception.bill_id,
        reconciliation_diff_id=db_exception.reconciliation_diff_id,
        remark=f"关闭异常单: {final_conclusion}",
    )

    return success_response(db_exception, "关闭异常单成功")
