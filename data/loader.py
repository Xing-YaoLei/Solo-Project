import pandas as pd
from models.schema import SessionLocal, Project, PaymentRecord, PurchaseOrder, PurchaseOrderItem, DesignExportItem, ReconciliationResult, Contract
from config import FIELD_MAPPING


def _session():
    return SessionLocal()


def load_projects():
    session = _session()
    try:
        rows = session.query(Project).all()
        data = [
            {
                "id": r.id,
                "name": r.name,
                "address": r.address,
                "client_name": r.client_name,
                "status": r.status,
            }
            for r in rows
        ]
        return pd.DataFrame(data)
    finally:
        session.close()


def load_payment_records(project_id=None):
    session = _session()
    try:
        q = session.query(PaymentRecord)
        if project_id:
            q = q.filter(PaymentRecord.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "project_id": r.project_id,
                "contract_id": r.contract_id,
                "payment_no": r.payment_no,
                "amount": float(r.amount) if r.amount else 0,
                "payment_type": r.payment_type,
                "payment_method": r.payment_method,
                "payment_date": r.payment_date,
                "payer_name": r.payer_name,
                "status": r.status,
                "remarks": r.remarks,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_purchase_orders(project_id=None):
    session = _session()
    try:
        q = session.query(PurchaseOrder)
        if project_id:
            q = q.filter(PurchaseOrder.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "project_id": r.project_id,
                "po_no": r.po_no,
                "version": r.version,
                "supplier_name": r.supplier_name,
                "total_amount": float(r.total_amount) if r.total_amount else 0,
                "order_date": r.order_date,
                "status": r.status,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_purchase_order_items(po_id=None, project_id=None):
    session = _session()
    try:
        q = session.query(PurchaseOrderItem).join(PurchaseOrder)
        if po_id:
            q = q.filter(PurchaseOrderItem.po_id == po_id)
        if project_id:
            q = q.filter(PurchaseOrder.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "po_id": r.po_id,
                "room": r.room,
                "material_name": r.material_name,
                "spec": r.spec,
                "qty": float(r.qty) if r.qty else 0,
                "unit": r.unit,
                "price": float(r.price) if r.price else 0,
                "amount": float(r.amount) if r.amount else 0,
                "category": r.category,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_design_export_items(project_id=None):
    session = _session()
    try:
        q = session.query(DesignExportItem)
        if project_id:
            q = q.filter(DesignExportItem.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "project_id": r.project_id,
                "export_batch": r.export_batch,
                "room_name": r.room_name,
                "item_name": r.item_name,
                "quantity": float(r.quantity) if r.quantity else 0,
                "unit": r.unit,
                "unit_price": float(r.unit_price) if r.unit_price else 0,
                "total_price": float(r.total_price) if r.total_price else 0,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_reconciliation_results(project_id=None):
    session = _session()
    try:
        q = session.query(ReconciliationResult)
        if project_id:
            q = q.filter(ReconciliationResult.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "project_id": r.project_id,
                "po_id": r.po_id,
                "design_item_id": r.design_item_id,
                "status": r.status,
                "internal_amount": float(r.internal_amount) if r.internal_amount else 0,
                "design_amount": float(r.design_amount) if r.design_amount else 0,
                "diff_amount": float(r.diff_amount) if r.diff_amount else 0,
                "gap_flag": r.gap_flag,
                "remarks": r.remarks,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_contracts(project_id=None):
    session = _session()
    try:
        q = session.query(Contract)
        if project_id:
            q = q.filter(Contract.project_id == project_id)
        rows = q.all()
        data = [
            {
                "id": r.id,
                "project_id": r.project_id,
                "contract_no": r.contract_no,
                "total_amount": float(r.total_amount) if r.total_amount else 0,
                "signed_date": r.signed_date,
                "attachment_path": r.attachment_path,
                "remarks": r.remarks,
                "version": r.version,
            }
            for r in rows
        ]
        return pd.DataFrame(data) if data else pd.DataFrame()
    finally:
        session.close()


def load_field_comparison(project_id=None):
    design_df = load_design_export_items(project_id)
    internal_df = load_purchase_order_items(project_id=project_id)

    if design_df.empty or internal_df.empty:
        return pd.DataFrame()

    comparison_rows = []
    for _, d_row in design_df.iterrows():
        internal_fields = {}
        for design_field, internal_field in FIELD_MAPPING.items():
            internal_fields[internal_field] = d_row.get(design_field, "")

        matches = internal_df[
            (internal_df["material_name"] == d_row.get("item_name", ""))
            & (internal_df["room"] == d_row.get("room_name", ""))
        ]

        if matches.empty:
            comparison_rows.append(
                {
                    "design_item_name": d_row.get("item_name", ""),
                    "design_room": d_row.get("room_name", ""),
                    "design_quantity": d_row.get("quantity", 0),
                    "design_unit_price": d_row.get("unit_price", 0),
                    "design_total_price": d_row.get("total_price", 0),
                    "internal_material_name": "",
                    "internal_room": "",
                    "internal_qty": "",
                    "internal_price": "",
                    "internal_amount": "",
                    "field_mismatch": "内部无对应记录",
                }
            )
        else:
            for _, i_row in matches.iterrows():
                mismatches = []
                for design_field, internal_field in FIELD_MAPPING.items():
                    dv = d_row.get(design_field)
                    iv = i_row.get(internal_field)
                    if str(dv) != str(iv):
                        mismatches.append(
                            f"{design_field}({dv})≠{internal_field}({iv})"
                        )

                comparison_rows.append(
                    {
                        "design_item_name": d_row.get("item_name", ""),
                        "design_room": d_row.get("room_name", ""),
                        "design_quantity": d_row.get("quantity", 0),
                        "design_unit_price": d_row.get("unit_price", 0),
                        "design_total_price": d_row.get("total_price", 0),
                        "internal_material_name": i_row.get("material_name", ""),
                        "internal_room": i_row.get("room", ""),
                        "internal_qty": i_row.get("qty", ""),
                        "internal_price": i_row.get("price", ""),
                        "internal_amount": i_row.get("amount", ""),
                        "field_mismatch": "; ".join(mismatches) if mismatches else "一致",
                    }
                )

    return pd.DataFrame(comparison_rows)
