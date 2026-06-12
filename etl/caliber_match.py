from datetime import date
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import InventoryLedger, CleanedInventory, MaterialDailyUsage


def caliber_match(session):
    ledger_rows = (
        session.query(
            InventoryLedger.store_code,
            InventoryLedger.material_code,
            InventoryLedger.unit,
            InventoryLedger.transaction_date,
            func.sum(InventoryLedger.quantity).label("total_qty"),
        )
        .filter(InventoryLedger.transaction_type == "consumption")
        .group_by(
            InventoryLedger.store_code,
            InventoryLedger.material_code,
            InventoryLedger.unit,
            InventoryLedger.transaction_date,
        )
        .all()
    )

    snapshot_map = {}
    inv_rows = session.query(CleanedInventory).all()
    for inv in inv_rows:
        key = (inv.store_code, inv.material_code)
        if key not in snapshot_map or inv.snapshot_date > snapshot_map[key].snapshot_date:
            snapshot_map[key] = inv

    inserted = 0
    for row in ledger_rows:
        usage_qty = float(row.total_qty) if row.total_qty else 0.0

        existing = (
            session.query(MaterialDailyUsage)
            .filter(
                MaterialDailyUsage.store_code == row.store_code,
                MaterialDailyUsage.material_code == row.material_code,
                MaterialDailyUsage.usage_date == row.transaction_date,
            )
            .first()
        )
        if existing:
            existing.usage_qty = Decimal(str(round(usage_qty, 3)))
        else:
            daily_usage = MaterialDailyUsage(
                store_code=row.store_code,
                material_code=row.material_code,
                usage_date=row.transaction_date,
                usage_qty=Decimal(str(round(usage_qty, 3))),
                unit=row.unit,
            )
            session.add(daily_usage)
        inserted += 1

    avg_usage_map = _compute_avg_daily_usage(session)
    for (store_code, material_code), avg_qty in avg_usage_map.items():
        snapshot = snapshot_map.get((store_code, material_code))
        current_stock = float(snapshot.stock_qty) if snapshot and snapshot.stock_qty else 0.0
        turnover = current_stock / avg_qty if avg_qty > 0 else Decimal("0")

        usage_rows = (
            session.query(MaterialDailyUsage)
            .filter(
                MaterialDailyUsage.store_code == store_code,
                MaterialDailyUsage.material_code == material_code,
            )
            .all()
        )
        for u in usage_rows:
            u.turnover_days = Decimal(str(round(float(turnover), 2)))

    session.commit()
    return inserted


def _compute_avg_daily_usage(session, days=30):
    from datetime import timedelta

    cutoff = date.today() - timedelta(days=days)
    rows = (
        session.query(
            MaterialDailyUsage.store_code,
            MaterialDailyUsage.material_code,
            func.avg(MaterialDailyUsage.usage_qty).label("avg_qty"),
        )
        .filter(MaterialDailyUsage.usage_date >= cutoff)
        .group_by(
            MaterialDailyUsage.store_code,
            MaterialDailyUsage.material_code,
        )
        .all()
    )
    return {(r.store_code, r.material_code): float(r.avg_qty) if r.avg_qty else 0.0 for r in rows}


def get_usage_df(session, store_code=None, material_code=None, start_date=None, end_date=None):
    query = session.query(MaterialDailyUsage)
    if store_code:
        query = query.filter(MaterialDailyUsage.store_code == store_code)
    if material_code:
        query = query.filter(MaterialDailyUsage.material_code == material_code)
    if start_date:
        query = query.filter(MaterialDailyUsage.usage_date >= start_date)
    if end_date:
        query = query.filter(MaterialDailyUsage.usage_date <= end_date)

    rows = query.all()
    data = [
        {
            "store_code": r.store_code,
            "material_code": r.material_code,
            "usage_date": r.usage_date,
            "usage_qty": float(r.usage_qty) if r.usage_qty else 0.0,
            "unit": r.unit,
            "turnover_days": float(r.turnover_days) if r.turnover_days else 0.0,
        }
        for r in rows
    ]
    return pd.DataFrame(data)


def compute_turnover(session, store_code, material_code):
    snapshot = (
        session.query(CleanedInventory)
        .filter(
            CleanedInventory.store_code == store_code,
            CleanedInventory.material_code == material_code,
        )
        .order_by(CleanedInventory.snapshot_date.desc())
        .first()
    )
    if not snapshot:
        return None

    current_stock = float(snapshot.stock_qty) if snapshot.stock_qty else 0.0
    avg_map = _compute_avg_daily_usage(session)
    avg_daily = avg_map.get((store_code, material_code), 0.0)

    if avg_daily <= 0:
        return None

    turnover = current_stock / avg_daily
    return round(turnover, 2)
