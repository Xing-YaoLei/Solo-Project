import pandas as pd
from datetime import datetime
from typing import Tuple, Dict, Any

from app.models import (
    get_session, Member, Pharmacy, Prescription,
    ImportSource
)
from app.data.batch_manager import create_batch, update_batch_stats
from app.data.pos_importer import _map_columns, _parse_date


MEMBER_COLUMN_MAPPING = {
    "member_no": ["会员号", "member_no", "memberNo"],
    "name": ["姓名", "name", "会员姓名"],
    "gender": ["性别", "gender"],
    "birth_date": ["出生日期", "birth_date", "birthday"],
    "phone": ["手机号", "phone", "mobile"],
    "id_card": ["身份证号", "id_card", "idCard"],
    "pharmacy_code": ["门店编码", "pharmacy_code"],
    "insurance_no": ["医保号", "insurance_no"],
    "insurance_type": ["医保类型", "insurance_type"],
    "register_date": ["注册日期", "register_date"],
}


def import_member_data(file_path: str, created_by: int = None) -> Tuple[int, int, str]:
    if file_path.endswith(".xlsx") or file_path.endswith(".xls"):
        df = pd.read_excel(file_path)
    elif file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        raise ValueError("Unsupported file format. Use .xlsx or .csv")

    df = _map_columns(df, MEMBER_COLUMN_MAPPING)

    if "member_no" not in df.columns:
        raise ValueError("Missing required column: member_no")

    total = len(df)
    success = 0
    failed = 0

    with create_batch(
        source=ImportSource.MEMBER,
        file_name=file_path.split("/")[-1],
        created_by=created_by,
        total_records=total,
    ) as (batch, session):
        pharmacy_cache = {}
        if "pharmacy_code" in df.columns:
            for code in df["pharmacy_code"].dropna().unique():
                ph = session.query(Pharmacy).filter(Pharmacy.code == str(code)).first()
                pharmacy_cache[str(code)] = ph.id if ph else None

        for _, row in df.iterrows():
            try:
                member_no = str(row.get("member_no", "")).strip()
                if not member_no:
                    failed += 1
                    continue

                pharmacy_id = None
                if "pharmacy_code" in df.columns and pd.notna(row.get("pharmacy_code")):
                    pharmacy_id = pharmacy_cache.get(str(row["pharmacy_code"]))

                existing = session.query(Member).filter(Member.member_no == member_no).first()

                if existing:
                    existing.name = str(row.get("name", existing.name)) if pd.notna(row.get("name")) else existing.name
                    existing.gender = str(row.get("gender", existing.gender)) if pd.notna(row.get("gender")) else existing.gender
                    existing.birth_date = _parse_date(row.get("birth_date")) or existing.birth_date
                    existing.phone = str(row.get("phone", existing.phone)) if pd.notna(row.get("phone")) else existing.phone
                    existing.id_card = str(row.get("id_card", existing.id_card)) if pd.notna(row.get("id_card")) else existing.id_card
                    existing.insurance_no = str(row.get("insurance_no", existing.insurance_no)) if pd.notna(row.get("insurance_no")) else existing.insurance_no
                    existing.insurance_type = str(row.get("insurance_type", existing.insurance_type)) if pd.notna(row.get("insurance_type")) else existing.insurance_type
                    if pharmacy_id:
                        existing.pharmacy_id = pharmacy_id
                    existing.updated_at = datetime.utcnow()
                else:
                    member = Member(
                        member_no=member_no,
                        name=str(row.get("name", "")) if pd.notna(row.get("name")) else "",
                        gender=str(row.get("gender", "")) if pd.notna(row.get("gender")) else None,
                        birth_date=_parse_date(row.get("birth_date")),
                        phone=str(row.get("phone", "")) if pd.notna(row.get("phone")) else None,
                        id_card=str(row.get("id_card", "")) if pd.notna(row.get("id_card")) else None,
                        pharmacy_id=pharmacy_id,
                        insurance_no=str(row.get("insurance_no", "")) if pd.notna(row.get("insurance_no")) else None,
                        insurance_type=str(row.get("insurance_type", "")) if pd.notna(row.get("insurance_type")) else None,
                    )
                    session.add(member)
                success += 1
            except Exception:
                failed += 1
                continue

        batch.success_records = success
        batch.failed_records = failed
        session.commit()

    return success, failed, batch.batch_no


def link_members_to_prescriptions() -> Dict[str, int]:
    session = get_session()
    try:
        unlinked = session.query(Prescription).filter(
            Prescription.member_id.is_(None)).all()
        linked_count = 0
        for rx in unlinked:
            if rx.patient_name:
                member = session.query(Member).filter(
                    Member.name == rx.patient_name
                ).first()
                if member:
                    rx.member_id = member.id
                    linked_count += 1
        session.commit()
        return {"linked": linked_count, "total": len(unlinked)}
    finally:
        session.close()
