from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from decimal import Decimal

from ..database import get_db
from ..models import Contract, Bill, ExceptionOrder
from ..schemas import (
    AmountValidationRequest,
    AmountValidationResult,
)
from ..utils.no_generator import generate_exception_no

router = APIRouter(prefix="/api/validation", tags=["金额校验"])

DEFAULT_THRESHOLD = Decimal("0.05")
EXCEPTION_THRESHOLD_AMOUNT = Decimal("1000")


@router.post("/amount", response_model=AmountValidationResult)
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

    return AmountValidationResult(
        is_valid=is_valid,
        diff_amount=float(diff_amount),
        diff_percentage=diff_percentage,
        threshold=float(DEFAULT_THRESHOLD) * 100,
        needs_exception=needs_exception,
        message=message,
    )


@router.post("/amount/create-exception")
def validate_and_create_exception(
    request: AmountValidationRequest,
    db: Session = Depends(get_db),
):
    result = validate_amount(request, db)

    if not result.needs_exception:
        return {
            "validation_result": result,
            "exception_created": False,
            "message": "差异未达到异常单生成条件",
        }

    db_contract = db.query(Contract).filter(Contract.id == request.contract_id).first()

    exception_type = "amount_mismatch"
    title = request.description or f"金额差异异常-{db_contract.contract_no}"
    description = request.description or f"预期金额: {request.expected_amount}, 实际金额: {request.actual_amount}, 差异金额: {result.diff_amount}"

    exception_no = generate_exception_no(db)

    db_exception = ExceptionOrder(
        contract_id=request.contract_id,
        bill_id=request.bill_id,
        exception_no=exception_no,
        exception_type=exception_type,
        title=title,
        description=description,
        expected_amount=Decimal(str(request.expected_amount)),
        actual_amount=Decimal(str(request.actual_amount)),
        diff_amount=Decimal(str(result.diff_amount)),
        status="pending",
        priority="high" if result.diff_amount > 10000 else "normal",
    )

    db.add(db_exception)
    db.commit()
    db.refresh(db_exception)

    return {
        "validation_result": result,
        "exception_created": True,
        "exception_id": db_exception.id,
        "exception_no": db_exception.exception_no,
        "message": "金额校验失败，已自动生成异常单",
    }


@router.post("/bill/{bill_id}", response_model=Dict[str, Any])
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
            status="pending",
            priority="high" if float(diff_amount) > 10000 else "normal",
        )

        db.add(db_exception)
        db.commit()
        db.refresh(db_exception)

        result["exception_created"] = True
        result["exception_id"] = db_exception.id
        result["exception_no"] = db_exception.exception_no
        result["message"] += "，已自动生成异常单"

    return result


@router.post("/contract/{contract_id}/bills", response_model=Dict[str, Any])
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

    return {
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
    }


@router.get("/threshold")
def get_validation_threshold():
    return {
        "diff_percentage_threshold": float(DEFAULT_THRESHOLD) * 100,
        "exception_amount_threshold": float(EXCEPTION_THRESHOLD_AMOUNT),
        "description": "当差异率超过阈值且差异金额超过异常阈值时，需要生成异常单",
    }
