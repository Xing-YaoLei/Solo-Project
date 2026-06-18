import uuid
from datetime import datetime
from models.schema import SessionLocal, ReconciliationResult
from data.loader import (
    load_purchase_order_items,
    load_design_export_items,
    load_reconciliation_results,
)
from config import AMOUNT_TOLERANCE


def run_reconciliation(project_id):
    internal_df = load_purchase_order_items(project_id=project_id)
    design_df = load_design_export_items(project_id)

    if internal_df.empty and design_df.empty:
        return load_reconciliation_results(project_id)

    results = []
    matched_design_ids = set()

    for _, i_row in internal_df.iterrows():
        design_match = design_df[
            (design_df["item_name"] == i_row["material_name"])
            & (design_df["room_name"] == i_row["room"])
        ]

        if design_match.empty:
            results.append(
                {
                    "project_id": project_id,
                    "po_id": i_row.get("po_id"),
                    "design_item_id": None,
                    "status": "missing_design",
                    "internal_amount": i_row.get("amount", 0),
                    "design_amount": 0,
                    "diff_amount": i_row.get("amount", 0),
                    "gap_flag": 1,
                    "remarks": "设计软件导出无对应项",
                }
            )
        else:
            for _, d_row in design_match.iterrows():
                matched_design_ids.add(d_row["id"])
                i_amt = i_row.get("amount", 0) or 0
                d_amt = d_row.get("total_price", 0) or 0
                diff = round(i_amt - d_amt, 2)
                is_match = abs(diff) <= AMOUNT_TOLERANCE

                results.append(
                    {
                        "project_id": project_id,
                        "po_id": i_row.get("po_id"),
                        "design_item_id": d_row["id"],
                        "status": "matched" if is_match else "mismatched",
                        "internal_amount": i_amt,
                        "design_amount": d_amt,
                        "diff_amount": diff,
                        "gap_flag": 0 if is_match else 1,
                        "remarks": (
                            ""
                            if is_match
                            else f"金额差异: 内部{i_amt} vs 设计{d_amt}, 差额{diff}"
                        ),
                    }
                )

    for _, d_row in design_df.iterrows():
        if d_row["id"] not in matched_design_ids:
            d_amt = d_row.get("total_price", 0) or 0
            results.append(
                {
                    "project_id": project_id,
                    "po_id": None,
                    "design_item_id": d_row["id"],
                    "status": "missing_internal",
                    "internal_amount": 0,
                    "design_amount": d_amt,
                    "diff_amount": -d_amt,
                    "gap_flag": 1,
                    "remarks": "内部采购单无对应项",
                }
            )

    session = SessionLocal()
    try:
        session.query(ReconciliationResult).filter(
            ReconciliationResult.project_id == project_id
        ).delete()

        for r in results:
            row = ReconciliationResult(
                id=str(uuid.uuid4()),
                project_id=r["project_id"],
                po_id=r["po_id"],
                design_item_id=r["design_item_id"],
                status=r["status"],
                internal_amount=r["internal_amount"],
                design_amount=r["design_amount"],
                diff_amount=r["diff_amount"],
                gap_flag=r["gap_flag"],
                remarks=r["remarks"],
                created_at=datetime.now(),
            )
            session.add(row)

        session.commit()
    finally:
        session.close()

    return load_reconciliation_results(project_id)


def compute_amount_summary(project_id=None):
    recon_df = load_reconciliation_results(project_id)
    if recon_df.empty:
        return {
            "total_items": 0,
            "matched_items": 0,
            "mismatched_items": 0,
            "missing_internal": 0,
            "missing_design": 0,
            "total_gap": 0,
            "gap_rate": 0,
        }

    total = len(recon_df)
    matched = len(recon_df[recon_df["status"] == "matched"])
    mismatched = len(recon_df[recon_df["status"] == "mismatched"])
    missing_internal = len(recon_df[recon_df["status"] == "missing_internal"])
    missing_design = len(recon_df[recon_df["status"] == "missing_design"])
    gap_items = recon_df[recon_df["gap_flag"] == 1]
    total_gap = float(gap_items["diff_amount"].sum()) if not gap_items.empty else 0
    gap_rate = len(gap_items) / total if total > 0 else 0

    return {
        "total_items": total,
        "matched_items": matched,
        "mismatched_items": mismatched,
        "missing_internal": missing_internal,
        "missing_design": missing_design,
        "total_gap": round(total_gap, 2),
        "gap_rate": round(gap_rate, 4),
    }


def compute_payment_cycle(project_id=None):
    from data.loader import load_payment_records, load_contracts

    payments_df = load_payment_records(project_id)
    contracts_df = load_contracts(project_id)

    if payments_df.empty or contracts_df.empty:
        return []

    payments_with_contract = payments_df.merge(
        contracts_df[["id", "contract_no", "signed_date", "total_amount"]],
        left_on="contract_id",
        right_on="id",
        how="left",
        suffixes=("", "_contract"),
    )

    cycles = []
    for contract_id, group in payments_with_contract.groupby("contract_id"):
        if not contract_id:
            continue
        contract_row = contracts_df[contracts_df["id"] == contract_id].iloc[0]
        signed_date = contract_row.get("signed_date")
        contract_amount = contract_row.get("total_amount", 0)
        paid_amount = group["amount"].sum()
        paid_count = len(group)

        first_payment = None
        last_payment = None
        if signed_date and not group.empty:
            first_payment = group["payment_date"].min()
            last_payment = group["payment_date"].max()
            days_to_first = (first_payment - signed_date).days if first_payment else None
            days_to_last = (last_payment - signed_date).days if last_payment else None
        else:
            days_to_first = None
            days_to_last = None

        sort_date = first_payment or signed_date or None

        cycles.append(
            {
                "contract_id": contract_id,
                "contract_no": contract_row.get("contract_no", ""),
                "contract_amount": float(contract_amount),
                "paid_amount": float(paid_amount),
                "paid_ratio": round(
                    float(paid_amount) / float(contract_amount)
                    if contract_amount
                    else 0,
                    4,
                ),
                "paid_count": paid_count,
                "days_to_first": days_to_first,
                "days_to_last": days_to_last,
                "signed_date": signed_date,
                "first_payment_date": first_payment,
                "last_payment_date": last_payment,
                "sort_date": sort_date,
            }
        )

    return cycles
