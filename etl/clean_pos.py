from datetime import datetime
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import RawPos, ProductBom, InventoryLedger


def clean_pos(session):
    raw_rows = session.query(RawPos).filter(RawPos.is_cleaned == False).all()
    if not raw_rows:
        return 0

    seen = {}
    for row in raw_rows:
        key = (row.pos_trans_id, row.product_code)
        if key not in seen:
            seen[key] = row

    deduped = list(seen.values())
    valid = [r for r in deduped if r.quantity and float(r.quantity) > 0]

    if valid:
        bom_map = _load_bom_map(session)
        ledger_inserted = 0
        for row in valid:
            product_code = row.product_code
            qty = float(row.quantity)
            if product_code in bom_map:
                for bom_item in bom_map[product_code]:
                    mat_code = bom_item["material_code"]
                    mat_name = bom_item["material_name"]
                    usage_per_unit = bom_item["usage_qty"]
                    unit = bom_item["unit"]
                    total_material_qty = qty * usage_per_unit
                    if total_material_qty > 0:
                        ledger = InventoryLedger(
                            store_code=row.store_code,
                            material_code=mat_code,
                            material_name=mat_name,
                            transaction_type="consumption",
                            quantity=Decimal(str(round(total_material_qty, 5))),
                            unit=unit,
                            transaction_date=row.transaction_time.date(),
                        )
                        session.add(ledger)
                        ledger_inserted += 1

    for row in raw_rows:
        row.is_cleaned = True

    session.commit()
    return len(valid)


def _load_bom_map(session):
    bom_rows = session.query(ProductBom).all()
    bom_map = {}
    for bom in bom_rows:
        key = bom.product_code
        if key not in bom_map:
            bom_map[key] = []
        bom_map[key].append({
            "material_code": bom.material_code,
            "material_name": bom.material_name,
            "usage_qty": float(bom.usage_qty) if bom.usage_qty else 0.0,
            "unit": bom.unit,
        })
    return bom_map


def get_pos_df(session, store_code=None, start_date=None, end_date=None):
    query = session.query(RawPos).filter(RawPos.is_cleaned == True)
    if store_code:
        query = query.filter(RawPos.store_code == store_code)
    if start_date:
        query = query.filter(RawPos.transaction_time >= start_date)
    if end_date:
        query = query.filter(RawPos.transaction_time <= end_date)

    rows = query.all()
    data = [
        {
            "pos_trans_id": r.pos_trans_id,
            "store_code": r.store_code,
            "transaction_time": r.transaction_time,
            "product_code": r.product_code,
            "product_name": r.product_name,
            "quantity": float(r.quantity) if r.quantity else 0.0,
            "amount": float(r.amount) if r.amount else 0.0,
        }
        for r in rows
    ]
    return pd.DataFrame(data)
