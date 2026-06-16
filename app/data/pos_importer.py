import pandas as pd
from datetime import datetime
from dateutil import parser as date_parser
from typing import Optional, Tuple, List

from app.models import (
    get_session, Pharmacy, Member, Prescription, PrescriptionItem,
    PrescriptionStatus, ImportSource, PrescriptionPhoto
)
from app.data.batch_manager import create_batch, update_batch_stats


POS_COLUMN_MAPPING = {
    "prescription_no": ["处方号", "prescription_no", "prescriptionNo", "rx_no"],
    "pharmacy_code": ["门店编码", "pharmacy_code", "store_code", "门店代码"],
    "pos_order_no": ["收银单号", "pos_order_no", "order_no"],
    "patient_name": ["患者姓名", "patient_name", "name"],
    "member_no": ["会员号", "member_no", "memberNo"],
    "doctor_name": ["医生姓名", "doctor_name"],
    "hospital": ["开具医院", "hospital"],
    "prescription_date": ["处方日期", "prescription_date", "rx_date"],
    "drug_code": ["药品编码", "drug_code"],
    "drug_name": ["药品名称", "drug_name"],
    "generic_name": ["通用名", "generic_name"],
    "specification": ["规格", "specification"],
    "batch_no": ["批号", "batch_no", "lot_no"],
    "expiry_date": ["有效期", "效期", "expiry_date"],
    "quantity": ["数量", "quantity"],
    "unit": ["单位", "unit"],
    "unit_price": ["单价", "unit_price", "price"],
    "dosage": ["用法用量", "dosage"],
    "frequency": ["频次", "frequency"],
    "days_supply": ["用药天数", "days_supply"],
    "total_amount": ["总金额", "total_amount", "amount"],
    "photo_count": ["处方照片数", "photo_count"],
    "photo_urls": ["照片地址", "photo_urls"],
}


def _map_columns(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
    rename_map = {}
    lower_cols = {str(c).strip().lower(): c for c in df.columns}
    for target, candidates in mapping.items():
        for cand in candidates:
            if cand.lower() in lower_cols:
                rename_map[lower_cols[cand.lower()]] = target
                break
    return df.rename(columns=rename_map)


def _parse_date(value) -> Optional[datetime.date]:
    if pd.isna(value) or value == "":
        return None
    try:
        if isinstance(value, (datetime, pd.Timestamp)):
            return value.date() if hasattr(value, "date") else value
        return date_parser.parse(str(value)).date()
    except (ValueError, TypeError):
        return None


def _parse_float(value) -> float:
    if pd.isna(value) or value == "":
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def _parse_int(value) -> int:
    if pd.isna(value) or value == "":
        return 0
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return 0


def import_pos_data(file_path: str, created_by: int = None) -> Tuple[int, int, str]:
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Use .xlsx or .csv")

    df = _map_columns(df, POS_COLUMN_MAPPING)

    required_cols = ["prescription_no", "pharmacy_code", "drug_name"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    total = len(df)
    success = 0
    failed = 0

    with create_batch(
        source=ImportSource.POS,
        file_name=file_path.split("/")[-1],
        created_by=created_by,
        total_records=total,
    ) as (batch, session):
        pharmacy_cache = {}
        for code in df["pharmacy_code"].dropna().unique():
            ph = session.query(Pharmacy).filter(Pharmacy.code == str(code)).first()
            pharmacy_cache[str(code)] = ph.id if ph else None

        prescription_groups = df.groupby("prescription_no", dropna=False)

        for rx_no, group in prescription_groups:
            if pd.isna(rx_no):
                failed += len(group)
                continue
            try:
                first_row = group.iloc[0]
                pharmacy_id = pharmacy_cache.get(str(first_row.get("pharmacy_code", "")))
                if not pharmacy_id:
                    failed += len(group)
                    continue

                existing = session.query(Prescription).filter(
                    Prescription.prescription_no == str(rx_no)
                ).first()

                member = None
                member_no = first_row.get("member_no")
                if pd.notna(member_no) and member_no != "":
                    member = session.query(Member).filter(
                        Member.member_no == str(member_no)
                    ).first()

                if existing:
                    existing.batch_id = batch.id
                    existing.total_amount = _parse_float(first_row.get("total_amount", existing.total_amount))
                    existing.photo_count = _parse_int(first_row.get("photo_count", existing.photo_count))
                    prescription = existing
                else:
                    prescription = Prescription(
                        prescription_no=str(rx_no),
                        pharmacy_id=pharmacy_id,
                        member_id=member.id if member else None,
                        batch_id=batch.id,
                        pos_order_no=str(first_row.get("pos_order_no", "")) if pd.notna(first_row.get("pos_order_no")) else None,
                        patient_name=str(first_row.get("patient_name", "")) if pd.notna(first_row.get("patient_name")) else None,
                        doctor_name=str(first_row.get("doctor_name", "")) if pd.notna(first_row.get("doctor_name")) else None,
                        hospital=str(first_row.get("hospital", "")) if pd.notna(first_row.get("hospital")) else None,
                        prescription_date=_parse_date(first_row.get("prescription_date")),
                        status=PrescriptionStatus.RECEIVED,
                        total_amount=_parse_float(first_row.get("total_amount")),
                        photo_count=_parse_int(first_row.get("photo_count")),
                    )
                    session.add(prescription)
                    session.flush()

                for _, row in group.iterrows():
                    item = PrescriptionItem(
                        prescription_id=prescription.id,
                        drug_code=str(row.get("drug_code", "")) if pd.notna(row.get("drug_code")) else None,
                        drug_name=str(row.get("drug_name", "")),
                        generic_name=str(row.get("generic_name", "")) if pd.notna(row.get("generic_name")) else None,
                        specification=str(row.get("specification", "")) if pd.notna(row.get("specification")) else None,
                        batch_no=str(row.get("batch_no", "")) if pd.notna(row.get("batch_no")) else None,
                        expiry_date=_parse_date(row.get("expiry_date")),
                        quantity=_parse_float(row.get("quantity")),
                        unit=str(row.get("unit", "")) if pd.notna(row.get("unit")) else None,
                        unit_price=_parse_float(row.get("unit_price")),
                        total_price=_parse_float(row.get("unit_price")) * _parse_float(row.get("quantity")),
                        dosage=str(row.get("dosage", "")) if pd.notna(row.get("dosage")) else None,
                        frequency=str(row.get("frequency", "")) if pd.notna(row.get("frequency")) else None,
                        days_supply=_parse_int(row.get("days_supply")),
                    )
                    session.add(item)

                photo_urls = first_row.get("photo_urls")
                if pd.notna(photo_urls) and photo_urls != "":
                    urls = str(photo_urls).split(";") if ";" in str(photo_urls) else [str(photo_urls)]
                    for i, url in enumerate(urls):
                        if url.strip():
                            photo = PrescriptionPhoto(
                                prescription_id=prescription.id,
                                photo_url=url.strip(),
                                page_no=i + 1,
                            )
                            session.add(photo)

                success += len(group)
                session.flush()
            except Exception:
                failed += len(group)
                session.rollback()
                continue

        batch.success_records = success
        batch.failed_records = failed
        session.commit()

    return success, failed, batch.batch_no
