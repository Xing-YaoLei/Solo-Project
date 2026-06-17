from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from decimal import Decimal

from ..database import get_db
from ..models import Contract, Bill, ExceptionOrder, ExceptionAffectedObject
from ..schemas import (
    AmountValidationRequest,
    AmountValidationResult,
)
from ..utils.no_generator import generate_exception_no
from ..utils.response import success_response

router = APIRouter(prefix="/api/validation", tags=["金额校验"])

DEFAULT_THRESHOLD = Decimal("0.05")
EXCEPTION_THRESHOLD_AMOUNT = Decimal("1000")
DEFAULT_HANDLER_ID = 2
DEFAULT_SUPERVISOR_ID = 1


@router.post("/amount")
def validate_amount(
    request: AmountValidationRequest,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail=f"合同ID {request.contract_id} 不存在")

    if request.bill_id:
        db_bill = db.query(Bill).filter(Bill.id == request.bill_id).first()
        if not db_bill:
            raise HTTPException(status_code=404, detail=f"单据ID {request.bill_id} 不存在")
        if db_bill.contract_id != request.contract_id:
            raise HTTPException(status_code=400, detail="单据不属于指定合同")

    expected = Decimal(str(request.expected_amount))
    actual = Decimal(str(request.actual_amount))
    diff_amount = abs(expected - actual)

    if expected == 0:
        diff_percentage = 100.0 if actual != 0 else 0.0
    else:
        diff_percentage = float((diff_amount / expected) * 100)

    is_valid = diff_percentage <= float(DEFAULT_THRESHOLD) * 100

    needs_exception = not is_valid and diff_amount > EXCEPTION_THRESHOLD_AMOUNT

    if is_valid:
        message = f"金额校验通过，差异率: {diff_percentage:.4f}%"
    else:
        message = f"金额校验失败，差异率: {diff_percentage:.4f}%，差异金额: {diff_amount:.2f}元"
        if needs_exception:
            message += "，需要生成异常单"

    return success_response(
        AmountValidationResult(
            is_valid=is_valid,
            diff_amount=float(diff_amount),
            diff_percentage=diff_percentage,
            threshold=float(DEFAULT_THRESHOLD) * 100,
            needs_exception=needs_exception,
            message=message,
        ),
        "金额校验完成",
    )


@router.post("/amount/create-exception")
def validate_and_create_exception(
    request: AmountValidationRequest,
    db: Session = Depends(get_db),
):
    result = validate_amount(request, db)
    validation_data = result["data"]

    if not validation_data["needs_exception"]:
        return success_response(
            {
                "validation_result": validation_data,
                "exception_created": False,
                "message": "差异未达到异常单生成条件",
            },
            "校验完成，未生成异常单",
        )

    db_contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
    db_bill = db.query(Bill).filter(Bill.id == request.bill_id).first() if request.bill_id else None

    exception_type = "amount_mismatch"
    title = request.description or f"金额差异异常-{db_contract.contract_no}"
    description = request.description or f"预期金额: {request.expected_amount}, 实际金额: {request.actual_amount}, 差异金额: {validation_data['diff_amount']}"

    exception_no = generate_exception_no(db)

    diff_amt = Decimal(str(validation_data["diff_amount"]))
    priority = "high" if diff_amt > Decimal("10000") else "normal"

    db_exception = ExceptionOrder(
        contract_id=request.contract_id,
        bill_id=request.bill_id,
        exception_no=exception_no,
        exception_type=exception_type,
        title=title,
        description=description,
        expected_amount=Decimal(str(request.expected_amount)),
        actual_amount=Decimal(str(request.actual_amount)),
        diff_amount=diff_amt,
        status="open",
        priority=priority,
        handler_id=DEFAULT_HANDLER_ID,
        supervisor_id=DEFAULT_SUPERVISOR_ID,
    )

    db.add(db_exception)
    db.flush()

    affected_objects = []

    affected_objects.append(ExceptionAffectedObject(
        exception_order_id=db_exception.id,
        object_type="contract",
        object_id=db_contract.id,
        object_name=db_contract.project_name,
        object_no=db_contract.contract_no,
        impact_level=priority,
        impact_description=f"合同金额校验不通过，差异{diff_amt:.2f}元",
    ))

    if db_bill:
        affected_objects.append(ExceptionAffectedObject(
            exception_order_id=db_exception.id,
            object_type="bill",
            object_id=db_bill.id,
            object_name=db_bill.bill_name,
            object_no=db_bill.bill_no,
            impact_level=priority,
            impact_description=f"单据金额与预期不符，差异{diff_amt:.2f}元",
        ))

    affected_objects.append(ExceptionAffectedObject(
        exception_order_id=db_exception.id,
        object_type="customer",
        object_id=db_contract.id,
        object_name=db_contract.client_name,
        object_no=db_contract.client_phone,
        impact_level="medium",
        impact_description="客户项目可能受金额差异影响",
    ))

    db.add_all(affected_objects)
    db.commit()
    db.refresh(db_exception)

    return success_response(
        {
            "validation_result": validation_data,
            "exception_created": True,
            "exception_id": db_exception.id,
            "exception_no": db_exception.exception_no,
            "handler_id": db_exception.handler_id,
            "supervisor_id": db_exception.supervisor_id,
            "affected_count": len(affected_objects),
            "message": "金额校验失败，已自动生成异常单",
        },
        "已自动生成异常单",
    )


@router.post("/bill/{bill_id}")
def validate_bill_amount(
    bill_id: int,
    auto_create_exception: bool = False,
    db: Session = Depends(get_db),
):
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="单据不存在")

    items_total = sum(item.actual_amount for item in db_bill.items) if db_bill.items else Decimal(0)
    bill_total = db_bill.total_amount
    diff_amount = abs(bill_total - items_total)

    if bill_total == 0:
        diff_percentage = 100.0 if items_total != 0 else 0.0
    else:
        diff_percentage = float((diff_amount / bill_total) * 100)

    is_valid = diff_percentage <= float(DEFAULT_THRESHOLD) * 100

    needs_exception = not is_valid and diff_amount > EXCEPTION_THRESHOLD_AMOUNT

    result = {
        "bill_id": bill_id,
        "bill_no": db_bill.bill_no,
        "bill_total": float(bill_total),
        "items_total": float(items_total),
        "diff_amount": float(diff_amount),
        "diff_percentage": diff_percentage,
        "is_valid": is_valid,
        "needs_exception": needs_exception,
        "threshold": float(DEFAULT_THRESHOLD) * 100,
    }

    if is_valid:
        result["message"] = f"单据金额校验通过，差异率: {diff_percentage:.4f}%"
    else:
        result["message"] = f"单据金额校验失败，单据总金额({bill_total})与明细合计({items_total})不一致，差异率: {diff_percentage:.4f}%"

    if auto_create_exception and needs_exception:
        exception_no = generate_exception_no(db)
        db_contract = db.query(Contract).filter(Contract.id == db_bill.contract_id).first()
        priority = "high" if float(diff_amount) > 10000 else "normal"

        db_exception = ExceptionOrder(
            contract_id=db_bill.contract_id,
            bill_id=bill_id,
            exception_no=exception_no,
            exception_type="bill_amount_mismatch",
            title=f"单据金额异常-{db_bill.bill_no}",
            description=f"单据总金额: {bill_total}, 明细合计: {items_total}, 差异金额: {diff_amount}",
            expected_amount=bill_total,
            actual_amount=items_total,
            diff_amount=diff_amount,
            status="open",
            priority=priority,
            handler_id=DEFAULT_HANDLER_ID,
            supervisor_id=DEFAULT_SUPERVISOR_ID,
        )

        db.add(db_exception)
        db.flush()

        affected_objects = []
        if db_contract:
            affected_objects.append(ExceptionAffectedObject(
                exception_order_id=db_exception.id,
                object_type="contract",
                object_id=db_contract.id,
                object_name=db_contract.project_name,
                object_no=db_contract.contract_no,
                impact_level=priority,
                impact_description=f"关联单据金额校验不通过",
            ))

        affected_objects.append(ExceptionAffectedObject(
            exception_order_id=db_exception.id,
            object_type="bill",
            object_id=db_bill.id,
            object_name=db_bill.bill_name,
            object_no=db_bill.bill_no,
            impact_level=priority,
            impact_description=f"单据明细与总金额不一致，差异{diff_amount:.2f}元",
        ))

        affected_objects.append(ExceptionAffectedObject(
            exception_order_id=db_exception.id,
            object_type="financial",
            object_id=0,
            object_name="财务对账",
            object_no="FIN-001",
            impact_level="high",
            impact_description="财务对账金额不一致，影响回款周期",
        ))

        db.add_all(affected_objects)
        db.commit()
        db.refresh(db_exception)

        result["exception_created"] = True
        result["exception_id"] = db_exception.id
        result["exception_no"] = db_exception.exception_no
        result["handler_id"] = db_exception.handler_id
        result["supervisor_id"] = db_exception.supervisor_id
        result["affected_count"] = len(affected_objects)
        result["message"] += "，已自动生成异常单"

    return success_response(result, "单据金额校验完成")


@router.post("/contract/{contract_id}/bills")
def validate_contract_bills(
    contract_id: int,
    db: Session = Depends(get_db),
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not db_contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    bills = db.query(Bill).filter(Bill.contract_id == contract_id).all()

    results = []
    total_bill_amount = Decimal(0)
    total_item_amount = Decimal(0)
    invalid_count = 0

    for bill in bills:
        items_total = sum(item.actual_amount for item in bill.items) if bill.items else Decimal(0)
        diff_amount = abs(bill.total_amount - items_total)

        if bill.total_amount == 0:
            diff_percentage = 100.0 if items_total != 0 else 0.0
        else:
            diff_percentage = float((diff_amount / bill.total_amount) * 100)

        is_valid = diff_percentage <= float(DEFAULT_THRESHOLD) * 100

        if not is_valid:
            invalid_count += 1

        total_bill_amount += bill.total_amount
        total_item_amount += items_total

        results.append({
            "bill_id": bill.id,
            "bill_no": bill.bill_no,
            "bill_type": bill.bill_type,
            "bill_total": float(bill.total_amount),
            "items_total": float(items_total),
            "diff_amount": float(diff_amount),
            "diff_percentage": diff_percentage,
            "is_valid": is_valid,
        })

    overall_diff = abs(total_bill_amount - total_item_amount)
    if total_bill_amount == 0:
        overall_diff_percentage = 100.0 if total_item_amount != 0 else 0.0
    else:
        overall_diff_percentage = float((overall_diff / total_bill_amount) * 100)

    return success_response(
        {
            "contract_id": contract_id,
            "contract_no": db_contract.contract_no,
            "total_bills": len(bills),
            "invalid_bills": invalid_count,
            "total_bill_amount": float(total_bill_amount),
            "total_item_amount": float(total_item_amount),
            "overall_diff_amount": float(overall_diff),
            "overall_diff_percentage": overall_diff_percentage,
            "all_valid": invalid_count == 0,
            "bill_results": results,
        },
        "合同下所有单据金额校验完成",
    )


@router.get("/threshold")
def get_validation_threshold():
    return success_response(
        {
            "diff_percentage_threshold": float(DEFAULT_THRESHOLD) * 100,
            "exception_amount_threshold": float(EXCEPTION_THRESHOLD_AMOUNT),
            "default_handler_id": DEFAULT_HANDLER_ID,
            "default_supervisor_id": DEFAULT_SUPERVISOR_ID,
            "description": "当差异率超过阈值且差异金额超过异常阈值时，需要生成异常单",
        },
        "获取校验阈值成功",
    )
