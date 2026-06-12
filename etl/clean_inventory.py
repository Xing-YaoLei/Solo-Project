from datetime import datetime
from decimal import Decimal

import pandas as pd
from sqlalchemy import func

from db.connection import Session
from db.models import RawInventory, CleanedInventory


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
