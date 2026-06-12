from datetime import datetime, date
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import RawInventory, CleanedInventory, InventoryLedger, BatchInfo


def clean_inventory(session):
    raw_rows = session.query(RawInventory).filter(RawInventory.is_cleaned == False).all()
    if not raw_rows:
        return 0

    latest_map = {}
    for row in raw_rows:
        key = (row.store_code, row.material_code, row.batch_no, row.snapshot_date)
        if key in latest_map:
            existing = latest_map[key]
            if row.ingested_at and existing.ingested_at and row.ingested_at > existing.ingested_at:
                latest_map[key] = row
        else:
            latest_map[key] = row

    deduped = list(latest_map.values())
    inserted = 0

    for row in deduped:
        stock_qty = max(float(row.stock_qty), 0.0) if row.stock_qty else 0.0

        cleaned = CleanedInventory(
            store_code=row.store_code,
            material_code=row.material_code,
            material_name=row.material_name,
            batch_no=row.batch_no,
            stock_qty=Decimal(str(round(stock_qty, 3))),
            unit=row.unit,
            safety_stock=row.safety_stock,
            warehouse_code=row.warehouse_code,
            snapshot_date=row.snapshot_date,
        )
        session.add(cleaned)
        inserted += 1

    for row in raw_rows:
        row.is_cleaned = True

    session.commit()

    return inserted


def generate_inventory_ledger_from_snapshots(session):
    from sqlalchemy import func

    all_rows = (
        session.query(CleanedInventory)
        .order_by(
            CleanedInventory.store_code,
            CleanedInventory.material_code,
            CleanedInventory.batch_no,
            CleanedInventory.snapshot_date,
        )
        .all()
    )
    if not all_rows:
        return 0

    grouped_by_batch = {}
    grouped_by_mat = {}
    for r in all_rows:
        key_batch = (r.store_code, r.material_code, r.batch_no)
        grouped_by_batch.setdefault(key_batch, []).append(r)
        key_mat = (r.store_code, r.material_code)
        grouped_by_mat.setdefault(key_mat, []).append(r)

    existing_set = set(
        (r.store_code, r.material_code, r.batch_no or "", r.transaction_date.isoformat(), r.transaction_type)
        for r in session.query(
            InventoryLedger.store_code,
            InventoryLedger.material_code,
            InventoryLedger.batch_no,
            InventoryLedger.transaction_date,
            InventoryLedger.transaction_type,
        ).filter(InventoryLedger.transaction_type.in_(["inbound", "outbound", "adjust"])).all()
    )

    supplier_map = {}
    for b in session.query(BatchInfo).all():
        key = (b.store_code, b.material_code, b.batch_no)
        supplier_map[key] = b.supplier_code

    daily_consumption_map = _compute_daily_consumption_avg(session)

    inserted = 0

    for key_batch, snapshots in grouped_by_batch.items():
        store_code, material_code, batch_no = key_batch
        snapshots_sorted = sorted(snapshots, key=lambda x: x.snapshot_date)
        supplier_code = supplier_map.get(key_batch)
        material_name = snapshots_sorted[0].material_name
        unit = snapshots_sorted[0].unit
        avg_daily_consume = daily_consumption_map.get((store_code, material_code), 0.0)

        for i in range(1, len(snapshots_sorted)):
            prev = snapshots_sorted[i - 1]
            curr = snapshots_sorted[i]
            prev_qty = float(prev.stock_qty) if prev.stock_qty else 0.0
            curr_qty = float(curr.stock_qty) if curr.stock_qty else 0.0
            delta = curr_qty - prev_qty

            if abs(delta) < 1e-6:
                continue

            txn_date = curr.snapshot_date
            days_between = max(1, (curr.snapshot_date - prev.snapshot_date).days)
            expected_consume = avg_daily_consume * days_between

            if delta > 0:
                txn_type = "inbound"
                txn_qty = delta
            else:
                abs_delta = abs(delta)
                if avg_daily_consume <= 0:
                    txn_type = "outbound"
                    txn_qty = abs_delta
                elif abs_delta > expected_consume * 1.15:
                    txn_type = "outbound"
                    txn_qty = max(abs_delta - expected_consume, 0.01)
                elif abs_delta < expected_consume * 0.85:
                    txn_type = "adjust"
                    txn_qty = max(abs(expected_consume - abs_delta), 0.01)
                else:
                    continue

            if txn_qty < 1e-6:
                continue

            dedup_key = (store_code, material_code, batch_no or "", txn_date.isoformat(), txn_type)
            if dedup_key in existing_set:
                continue

            session.add(InventoryLedger(
                store_code=store_code,
                material_code=material_code,
                material_name=material_name,
                transaction_type=txn_type,
                quantity=Decimal(str(round(txn_qty, 5))),
                unit=unit,
                batch_no=batch_no,
                supplier_code=supplier_code,
                transaction_date=txn_date,
            ))
            existing_set.add(dedup_key)
            inserted += 1

    for key_mat, snapshots in grouped_by_mat.items():
        store_code, material_code = key_mat
        by_date = {}
        for s in snapshots:
            by_date.setdefault(s.snapshot_date, []).append(s)

        dates_sorted = sorted(by_date.keys())
        if len(dates_sorted) < 2:
            continue

        material_name = snapshots[0].material_name
        unit = snapshots[0].unit
        avg_daily_consume = daily_consumption_map.get((store_code, material_code), 0.0)

        for i in range(1, len(dates_sorted)):
            prev_date = dates_sorted[i - 1]
            curr_date = dates_sorted[i]
            prev_total = sum(float(s.stock_qty) if s.stock_qty else 0.0 for s in by_date[prev_date])
            curr_total = sum(float(s.stock_qty) if s.stock_qty else 0.0 for s in by_date[curr_date])
            delta = curr_total - prev_total
            days_between = max(1, (curr_date - prev_date).days)
            expected_consume = avg_daily_consume * days_between
            actual_change = -delta

            if avg_daily_consume <= 0:
                continue
            if expected_consume <= 0:
                continue

            diff_ratio = abs(actual_change - expected_consume) / expected_consume
            if diff_ratio <= 0.15:
                continue

            adjust_qty = actual_change - expected_consume
            if abs(adjust_qty) < 0.01:
                continue

            _batch_tag = ""
            dedup_key = (store_code, material_code, _batch_tag, curr_date.isoformat(), "adjust")
            if dedup_key in existing_set:
                continue

            session.add(InventoryLedger(
                store_code=store_code,
                material_code=material_code,
                material_name=material_name,
                transaction_type="adjust",
                quantity=Decimal(str(round(abs(adjust_qty), 5))),
                unit=unit,
                transaction_date=curr_date,
            ))
            existing_set.add(dedup_key)
            inserted += 1

    session.flush()
    return inserted


def _compute_daily_consumption_avg(session, days=14):
    from datetime import timedelta
    from sqlalchemy import func

    cutoff = date.today() - timedelta(days=days)
    rows = (
        session.query(
            InventoryLedger.store_code,
            InventoryLedger.material_code,
            func.avg(InventoryLedger.quantity).label("avg_qty"),
        )
        .filter(
            InventoryLedger.transaction_type == "consumption",
            InventoryLedger.transaction_date >= cutoff,
        )
        .group_by(
            InventoryLedger.store_code,
            InventoryLedger.material_code,
        )
        .all()
    )
    result = {}
    for r in rows:
        key = (r.store_code, r.material_code)
        result[key] = float(r.avg_qty) if r.avg_qty else 0.0
    return result


def get_inventory_df(session, store_code=None, snapshot_date=None):
    query = session.query(CleanedInventory)
    if store_code:
        query = query.filter(CleanedInventory.store_code == store_code)
    if snapshot_date:
        query = query.filter(CleanedInventory.snapshot_date == snapshot_date)

    rows = query.all()
    data = [
        {
            "store_code": r.store_code,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "batch_no": r.batch_no,
            "stock_qty": float(r.stock_qty) if r.stock_qty else 0.0,
            "unit": r.unit,
            "safety_stock": float(r.safety_stock) if r.safety_stock else 0.0,
            "warehouse_code": r.warehouse_code,
            "snapshot_date": r.snapshot_date,
        }
        for r in rows
    ]
    return pd.DataFrame(data)


def get_batch_df(session, store_code=None, material_code=None):
    from db.models import BatchInfo
    from datetime import date

    query = session.query(BatchInfo)
    if store_code:
        query = query.filter(BatchInfo.store_code == store_code)
    if material_code:
        query = query.filter(BatchInfo.material_code == material_code)

    rows = query.all()
    today = date.today()
    data = []
    for r in rows:
        days_to_expiry = (r.expiry_date - today).days if r.expiry_date else 999
        if days_to_expiry <= 0:
            status = "expired"
        elif days_to_expiry <= 30:
            status = "near_expiry"
        else:
            status = "active"
        data.append({
            "batch_no": r.batch_no,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "store_code": r.store_code,
            "supplier_code": r.supplier_code,
            "production_date": r.production_date,
            "expiry_date": r.expiry_date,
            "received_date": r.received_date,
            "initial_qty": float(r.initial_qty) if r.initial_qty else 0.0,
            "current_qty": float(r.current_qty) if r.current_qty else 0.0,
            "unit": r.unit,
            "status": status,
            "days_to_expiry": days_to_expiry,
        })
    return pd.DataFrame(data)


def get_supplier_df(session, supplier_code=None):
    from db.models import Supplier

    query = session.query(Supplier)
    if supplier_code:
        query = query.filter(Supplier.supplier_code == supplier_code)

    rows = query.all()
    data = [
        {
            "supplier_code": r.supplier_code,
            "supplier_name": r.supplier_name,
            "contact_person": r.contact_person,
            "contact_phone": r.contact_phone,
            "lead_time_days": int(r.lead_time_days) if r.lead_time_days else 0,
            "rating": float(r.rating) if r.rating else 0.0,
            "material_category": r.material_category,
        }
        for r in rows
    ]
    return pd.DataFrame(data)


def get_inventory_ledger_df(session, store_code=None, material_code=None, start_date=None, end_date=None):
    from db.models import InventoryLedger

    query = session.query(InventoryLedger)
    if store_code:
        query = query.filter(InventoryLedger.store_code == store_code)
    if material_code:
        query = query.filter(InventoryLedger.material_code == material_code)
    if start_date:
        query = query.filter(InventoryLedger.transaction_date >= start_date)
    if end_date:
        query = query.filter(InventoryLedger.transaction_date <= end_date)

    rows = query.order_by(InventoryLedger.transaction_date.desc()).all()
    type_map = {
        "consumption": "消耗",
        "inbound": "入库",
        "outbound": "出库",
        "adjust": "调整",
    }
    data = [
        {
            "store_code": r.store_code,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "transaction_type": type_map.get(r.transaction_type, r.transaction_type),
            "quantity": float(r.quantity) if r.quantity else 0.0,
            "unit": r.unit,
            "batch_no": r.batch_no,
            "supplier_code": r.supplier_code,
            "transaction_date": r.transaction_date,
        }
        for r in rows
    ]
    return pd.DataFrame(data)


def get_stores_list(session):
    rows = session.query(CleanedInventory.store_code).distinct().all()
    return sorted([r[0] for r in rows])


def get_materials_list(session, store_code=None):
    query = session.query(CleanedInventory.material_code, CleanedInventory.material_name).distinct()
    if store_code:
        query = query.filter(CleanedInventory.store_code == store_code)
    rows = query.all()
    return [(r[0], r[1] or r[0]) for r in rows]
