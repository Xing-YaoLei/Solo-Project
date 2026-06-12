from datetime import datetime, date
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import RawReceipt, InventoryLedger


def clean_receipts(session):
    raw_rows = session.query(RawReceipt).filter(RawReceipt.is_cleaned == False).all()
    if not raw_rows:
        return 0

    seen = {}
    for row in raw_rows:
        key = (row.receipt_no, row.material_code, row.transaction_time)
        if key in seen:
            existing = seen[key]
            if row.ingested_at and existing.ingested_at and row.ingested_at > existing.ingested_at:
                seen[key] = row
        else:
            seen[key] = row

    deduped = list(seen.values())
    inserted = 0

    for row in deduped:
        member_id = row.member_id if row.member_id else "UNKNOWN"
        quantity = abs(float(row.quantity)) if row.quantity else 0.0
        amount = abs(float(row.amount)) if row.amount else 0.0
        if quantity == 0:
            continue

        ledger = InventoryLedger(
            store_code=row.store_code,
            material_code=row.material_code,
            material_name=row.material_name,
            transaction_type="consumption",
            quantity=Decimal(str(round(quantity, 3))),
            unit=row.unit,
            transaction_date=row.transaction_time.date() if row.transaction_time else date.today(),
        )
        session.add(ledger)
        inserted += 1

    for row in raw_rows:
        row.is_cleaned = True

    session.commit()
    return inserted


def get_receipt_df(session, store_code=None, start_date=None, end_date=None):
    query = session.query(InventoryLedger).filter(
        InventoryLedger.transaction_type == "consumption"
    )
    if store_code:
        query = query.filter(InventoryLedger.store_code == store_code)
    if start_date:
        query = query.filter(InventoryLedger.transaction_date >= start_date)
    if end_date:
        query = query.filter(InventoryLedger.transaction_date <= end_date)

    rows = query.all()
    data = [
        {
            "store_code": r.store_code,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "transaction_type": r.transaction_type,
            "quantity": float(r.quantity) if r.quantity else 0.0,
            "unit": r.unit,
            "transaction_date": r.transaction_date,
        }
        for r in rows
    ]
    return pd.DataFrame(data)
