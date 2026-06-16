import pandas as pd
from datetime import datetime, date
from typing import Tuple, Dict, Any, List

from app.models import (
    get_session, Member, Prescription, InsuranceSettlement, ImportSource
)
from app.data.batch_manager import create_batch
from app.data.pos_importer import _map_columns, _parse_date, _parse_float


INSURANCE_COLUMN_MAPPING = {
    "settlement_no": ["结算单号", "settlement_no"],
    "prescription_no": ["处方号", "prescription_no"],
    "member_no": ["会员号", "member_no"],
    "insurance_type": ["医保类型", "insurance_type"],
    "total_cost": ["总费用", "total_cost", "total"],
    "insurance_pay": ["医保支付", "insurance_pay", "insurance_payment"],
    "individual_pay": ["个人支付", "individual_pay", "self_pay"],
    "settlement_date": ["结算日期", "settlement_date"],
    "is_settled": ["是否结算", "is_settled"],
}


def import_insurance_data(file_path: str, created_by: int = None) -> Tuple[int, int, str]:
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Use .xlsx or .csv")

    df = _map_columns(df, INSURANCE_COLUMN_MAPPING)

    required_cols = ["prescription_no", "settlement_no"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    total = len(df)
    success = 0
    failed = 0

    with create_batch(
        source=ImportSource.INSURANCE,
        file_name=file_path.split("/")[-1],
        created_by=created_by,
        total_records=total,
    ) as (batch, session):
        for _, row in df.iterrows():
            try:
                prescription_no = str(row.get("prescription_no", "")).strip()
                settlement_no = str(row.get("settlement_no", "")).strip()
                if not prescription_no or not settlement_no:
                    failed += 1
                    continue

                prescription = session.query(Prescription).filter(
                    Prescription.prescription_no == prescription_no
                ).first()

                member = None
                if "member_no" in df.columns and pd.notna(row.get("member_no")):
                    member = session.query(Member).filter(
                        Member.member_no == str(row["member_no"])
                    ).first()

                if prescription:
                    existing = session.query(InsuranceSettlement).filter(
                        InsuranceSettlement.prescription_id == prescription.id
                    ).first()

                    insurance_pay = _parse_float(row.get("insurance_pay"))
                    individual_pay = _parse_float(row.get("individual_pay"))
                    total_cost = _parse_float(row.get("total_cost")) or (insurance_pay + individual_pay)

                    prescription.insurance_amount = insurance_pay
                    prescription.self_pay_amount = individual_pay

                    if existing:
                        existing.settlement_no = settlement_no
                        existing.insurance_type = str(row.get("insurance_type", existing.insurance_type)) if pd.notna(row.get("insurance_type")) else existing.insurance_type
                        existing.total_cost = total_cost
                        existing.insurance_pay = insurance_pay
                        existing.individual_pay = individual_pay
                        existing.settlement_date = _parse_date(row.get("settlement_date"))
                        existing.is_settled = bool(row.get("is_settled", True))
                        if member:
                            existing.member_id = member.id
                    else:
                        settlement = InsuranceSettlement(
                            prescription_id=prescription.id,
                            member_id=member.id if member else None,
                            settlement_no=settlement_no,
                            insurance_type=str(row.get("insurance_type", "")) if pd.notna(row.get("insurance_type")) else None,
                            total_cost=total_cost,
                            insurance_pay=insurance_pay,
                            individual_pay=individual_pay,
                            settlement_date=_parse_date(row.get("settlement_date")),
                            is_settled=bool(row.get("is_settled", True)),
                        )
                        session.add(settlement)
                    success += 1
                else:
                    failed += 1
            except Exception:
                failed += 1
                continue

        batch.success_records = success
        batch.failed_records = failed
        session.commit()

    return success, failed, batch.batch_no


def sync_insurance_api(prescription_no: str, insurance_data: Dict[str, Any]) -> bool:
    session = get_session()
    try:
        prescription = session.query(Prescription).filter(
            Prescription.prescription_no == prescription_no
        ).first()
        if not prescription:
            return False

        insurance_pay = _parse_float(insurance_data.get("insurance_pay", 0))
        individual_pay = _parse_float(insurance_data.get("individual_pay", 0))

        prescription.insurance_amount = insurance_pay
        prescription.self_pay_amount = individual_pay

        existing = session.query(InsuranceSettlement).filter(
            InsuranceSettlement.prescription_id == prescription.id
        ).first()

        if existing:
            existing.insurance_pay = insurance_pay
            existing.individual_pay = individual_pay
            existing.settlement_no = insurance_data.get("settlement_no", existing.settlement_no)
            existing.is_settled = True
        else:
            settlement = InsuranceSettlement(
                prescription_id=prescription.id,
                settlement_no=insurance_data.get("settlement_no"),
                insurance_type=insurance_data.get("insurance_type"),
                total_cost=insurance_pay + individual_pay,
                insurance_pay=insurance_pay,
                individual_pay=individual_pay,
                settlement_date=date.today(),
                is_settled=True,
            )
            session.add(settlement)
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()
