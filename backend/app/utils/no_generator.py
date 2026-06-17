from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Contract, Bill, ReconciliationDiff, ExceptionOrder


def generate_contract_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"HT{today}"
    last = db.query(Contract).filter(Contract.contract_no.like(f"{prefix}%")).order_by(Contract.contract_no.desc()).first()
    if last:
        seq = int(last.contract_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_bill_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"DJ{today}"
    last = db.query(Bill).filter(Bill.bill_no.like(f"{prefix}%")).order_by(Bill.bill_no.desc()).first()
    if last:
        seq = int(last.bill_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_diff_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"DZ{today}"
    last = db.query(ReconciliationDiff).filter(ReconciliationDiff.diff_no.like(f"{prefix}%")).order_by(ReconciliationDiff.diff_no.desc()).first()
    if last:
        seq = int(last.diff_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def generate_exception_no(db: Session) -> str:
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"YC{today}"
    last = db.query(ExceptionOrder).filter(ExceptionOrder.exception_no.like(f"{prefix}%")).order_by(ExceptionOrder.exception_no.desc()).first()
    if last:
        seq = int(last.exception_no[-4:]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"
