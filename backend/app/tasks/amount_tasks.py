from decimal import Decimal
from datetime import datetime
from celery import Task
from sqlalchemy.orm import Session
from .worker import celery
from ..database import SessionLocal
from ..models import Contract, Bill, ReconciliationDiff, ExceptionOrder, ExceptionAffectedObject
from ..utils.no_generator import generate_exception_no, generate_diff_no
from ..utils.timeline import create_timeline


class DatabaseTask(Task):
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery.task(base=DatabaseTask, bind=True, name="amount_tasks.verify_contract_amount")
def verify_contract_amount(self, contract_id: int, threshold: float = 100.0, operator_id: int = None):
    db = self.db
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return {"status": "error", "message": f"Contract {contract_id} not found"}

        bills = db.query(Bill).filter(Bill.contract_id == contract_id).all()
        total_bill_amount = sum(bill.total_amount for bill in bills)
        contract_amount = contract.contract_amount or Decimal(0)
        diff_amount = abs(total_bill_amount - contract_amount)

        create_timeline(
            db,
            operation_type="amount_verify",
            status="completed",
            contract_id=contract_id,
            operator_id=operator_id,
            remark=f"金额校验完成：合同金额 {contract_amount}，账单总金额 {total_bill_amount}，差异 {diff_amount}"
        )

        if diff_amount > Decimal(str(threshold)):
            diff = ReconciliationDiff(
                contract_id=contract_id,
                diff_no=generate_diff_no(db),
                diff_type="contract_bill_mismatch",
                expected_amount=contract_amount,
                actual_amount=total_bill_amount,
                diff_amount=diff_amount,
                status="pending"
            )
            db.add(diff)
            db.flush()

            create_timeline(
                db,
                operation_type="diff_create",
                status="pending",
                contract_id=contract_id,
                reconciliation_diff_id=diff.id,
                operator_id=operator_id,
                remark=f"金额差异超过阈值 {threshold}，自动创建对账差异单"
            )

            exception_order = create_exception_order_from_diff(db, diff.id, operator_id)

            return {
                "status": "diff_detected",
                "contract_id": contract_id,
                "contract_amount": str(contract_amount),
                "total_bill_amount": str(total_bill_amount),
                "diff_amount": str(diff_amount),
                "threshold": threshold,
                "diff_id": diff.id,
                "exception_order_id": exception_order.id if exception_order else None
            }

        return {
            "status": "verified",
            "contract_id": contract_id,
            "contract_amount": str(contract_amount),
            "total_bill_amount": str(total_bill_amount),
            "diff_amount": str(diff_amount),
            "threshold": threshold,
            "message": "金额校验通过，差异在允许范围内"
        }

    except Exception as e:
        db.rollback()
        create_timeline(
            db,
            operation_type="amount_verify",
            status="failed",
            contract_id=contract_id,
            operator_id=operator_id,
            remark=f"金额校验失败：{str(e)}"
        )
        raise


@celery.task(base=DatabaseTask, bind=True, name="amount_tasks.verify_bill_amount")
def verify_bill_amount(self, bill_id: int, threshold: float = 100.0, operator_id: int = None):
    db = self.db
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            return {"status": "error", "message": f"Bill {bill_id} not found"}

        items_total = sum(item.actual_amount for item in bill.items) if bill.items else Decimal(0)
        bill_total = bill.total_amount or Decimal(0)
        diff_amount = abs(bill_total - items_total)

        create_timeline(
            db,
            operation_type="bill_amount_verify",
            status="completed",
            bill_id=bill_id,
            operator_id=operator_id,
            remark=f"账单金额校验完成：账单金额 {bill_total}，明细总金额 {items_total}，差异 {diff_amount}"
        )

        if diff_amount > Decimal(str(threshold)):
            diff = ReconciliationDiff(
                contract_id=bill.contract_id,
                bill_id=bill_id,
                diff_no=generate_diff_no(db),
                diff_type="bill_item_mismatch",
                expected_amount=bill_total,
                actual_amount=items_total,
                diff_amount=diff_amount,
                status="pending"
            )
            db.add(diff)
            db.flush()

            create_timeline(
                db,
                operation_type="diff_create",
                status="pending",
                bill_id=bill_id,
                reconciliation_diff_id=diff.id,
                operator_id=operator_id,
                remark=f"账单金额差异超过阈值 {threshold}，自动创建对账差异单"
            )

            exception_order = create_exception_order_from_diff(db, diff.id, operator_id)

            return {
                "status": "diff_detected",
                "bill_id": bill_id,
                "bill_amount": str(bill_total),
                "items_total": str(items_total),
                "diff_amount": str(diff_amount),
                "threshold": threshold,
                "diff_id": diff.id,
                "exception_order_id": exception_order.id if exception_order else None
            }

        return {
            "status": "verified",
            "bill_id": bill_id,
            "bill_amount": str(bill_total),
            "items_total": str(items_total),
            "diff_amount": str(diff_amount),
            "threshold": threshold,
            "message": "账单金额校验通过"
        }

    except Exception as e:
        db.rollback()
        create_timeline(
            db,
            operation_type="bill_amount_verify",
            status="failed",
            bill_id=bill_id,
            operator_id=operator_id,
            remark=f"账单金额校验失败：{str(e)}"
        )
        raise


def create_exception_order_from_diff(db: Session, diff_id: int, operator_id: int = None) -> ExceptionOrder:
    diff = db.query(ReconciliationDiff).filter(ReconciliationDiff.id == diff_id).first()
    if not diff:
        return None

    priority = "high" if diff.diff_amount > Decimal("10000") else "normal"
    exception_type = "amount_mismatch"

    exception_order = ExceptionOrder(
        contract_id=diff.contract_id,
        bill_id=diff.bill_id,
        reconciliation_diff_id=diff.id,
        exception_no=generate_exception_no(db),
        exception_type=exception_type,
        title=f"金额差异异常 - {diff.diff_no}",
        description=f"系统自动检测到金额差异，预期金额：{diff.expected_amount}，实际金额：{diff.actual_amount}，差异金额：{diff.diff_amount}",
        expected_amount=diff.expected_amount,
        actual_amount=diff.actual_amount,
        diff_amount=diff.diff_amount,
        status="pending",
        priority=priority,
        handler_id=None,
        supervisor_id=None
    )
    db.add(exception_order)
    db.flush()

    affected_object = ExceptionAffectedObject(
        exception_order_id=exception_order.id,
        object_type="reconciliation_diff",
        object_id=diff.id,
        object_name=f"对账差异单 {diff.diff_no}",
        object_no=diff.diff_no,
        impact_level="high",
        impact_description="金额差异可能导致财务对账不准确，需要及时处理"
    )
    db.add(affected_object)

    if diff.contract_id:
        contract = db.query(Contract).filter(Contract.id == diff.contract_id).first()
        if contract:
            contract_affected = ExceptionAffectedObject(
                exception_order_id=exception_order.id,
                object_type="contract",
                object_id=contract.id,
                object_name=contract.project_name,
                object_no=contract.contract_no,
                impact_level="medium",
                impact_description="关联合同金额存在差异"
            )
            db.add(contract_affected)

    if diff.bill_id:
        bill = db.query(Bill).filter(Bill.id == diff.bill_id).first()
        if bill:
            bill_affected = ExceptionAffectedObject(
                exception_order_id=exception_order.id,
                object_type="bill",
                object_id=bill.id,
                object_name=bill.bill_name,
                object_no=bill.bill_no,
                impact_level="medium",
                impact_description="关联账单金额存在差异"
            )
            db.add(bill_affected)

    create_timeline(
        db,
        operation_type="exception_create",
        status="pending",
        exception_order_id=exception_order.id,
        operator_id=operator_id,
        remark=f"系统自动生成异常单，关联对账差异：{diff.diff_no}"
    )

    diff.status = "exception_created"
    db.commit()

    return exception_order


@celery.task(base=DatabaseTask, bind=True, name="amount_tasks.batch_verify_contracts")
def batch_verify_contracts(self, contract_ids: list, threshold: float = 100.0, operator_id: int = None):
    results = []
    for contract_id in contract_ids:
        try:
            result = verify_contract_amount.delay(contract_id, threshold, operator_id)
            results.append({"contract_id": contract_id, "task_id": result.id, "status": "submitted"})
        except Exception as e:
            results.append({"contract_id": contract_id, "status": "failed", "error": str(e)})
    return {"total": len(contract_ids), "results": results}
