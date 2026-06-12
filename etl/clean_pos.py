from datetime import datetime

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import RawPos


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

    for row in raw_rows:
        row.is_cleaned = True

    session.commit()
    return len(valid)


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
