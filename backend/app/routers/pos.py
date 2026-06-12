from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from app.services.duckdb_service import get_analytics
from app.services.mock_data import generate_mock_data

router = APIRouter()

_mock_cache = None


def get_mock_data():
    global _mock_cache
    if _mock_cache is None:
        _mock_cache = generate_mock_data()
    return _mock_cache


@router.get("/versions")
async def get_pos_versions():
    mock = get_mock_data()
    stores = mock["stores"]

    versions = []
    for vid in [1, 2]:
        version_stores = []
        txn_count = 0
        total_amount = 0.0

        for store in stores:
            batch_id = f"POS-V{vid}-{store['store_code']}"
            version_stores.append({
                "store_id": store["id"],
                "store_code": store["store_code"],
                "store_name": store["store_name"],
                "batch_id": batch_id,
            })

        base_date = datetime(2026, 5, 1)
        business_dates = [base_date + timedelta(days=i) for i in range(45)]

        versions.append({
            "id": vid,
            "version_number": vid,
            "name": f"POS版本 V{vid}",
            "description": f"POS流水快照版本{vid}" + ("（修正同步延迟和金额差异）" if vid == 2 else "（原始采集）"),
            "source_system": "POS收银系统",
            "store_count": len(stores),
            "stores": version_stores,
            "date_range_start": business_dates[0].strftime("%Y-%m-%d"),
            "date_range_end": business_dates[-1].strftime("%Y-%m-%d"),
            "day_count": len(business_dates),
            "transaction_count": 5 * 45 * 140,
            "total_amount": round(5 * 45 * 140 * 165, 2),
            "sync_timestamp": (datetime(2026, 6, 15, 8, 30) if vid == 1 else datetime(2026, 6, 15, 10, 0)).strftime("%Y-%m-%d %H:%M:%S"),
            "is_active": vid == 2,
            "created_at": (datetime(2026, 6, 15, 8, 30) if vid == 1 else datetime(2026, 6, 15, 10, 0)).strftime("%Y-%m-%d %H:%M:%S"),
        })

    return {
        "code": 0,
        "message": "success",
        "data": versions,
        "total": len(versions),
    }


@router.get("/versions/{version_id}")
async def get_pos_version_detail(version_id: int):
    if version_id not in [1, 2]:
        raise HTTPException(status_code=404, detail=f"版本ID {version_id} 不存在")

    mock = get_mock_data()
    stores = mock["stores"]
    analytics = get_analytics()

    store_filter = ""
    sql = f"""
        SELECT
            COUNT(DISTINCT txn_id) as txn_count,
            COUNT(DISTINCT member_id) as member_count,
            SUM(total_amount) as total_amount,
            SUM(pay_amount) as pay_amount,
            SUM(subtotal) as goods_amount,
            AVG(total_amount) as avg_txn_amount,
            SUM(CASE WHEN sync_delay_minutes > 30 THEN 1 ELSE 0 END) as delayed_txn_count,
            MAX(sync_delay_minutes) as max_delay_minutes
        FROM pos_snapshot
        WHERE version_id = ?
    """
    stats = analytics.con.execute(sql, [version_id]).fetchdf().iloc[0].to_dict()

    daily_sql = f"""
        SELECT
            DATE_TRUNC('day', business_date) as biz_date,
            COUNT(DISTINCT txn_id) as txn_count,
            SUM(total_amount) as total_amount,
            SUM(CASE WHEN sync_delay_minutes > 30 THEN 1 ELSE 0 END) as delayed_count
        FROM pos_snapshot
        WHERE version_id = ?
        GROUP BY DATE_TRUNC('day', business_date)
        ORDER BY biz_date ASC
    """
    daily_stats = analytics.con.execute(daily_sql, [version_id]).fetchdf().to_dict("records")

    pay_method_sql = f"""
        SELECT
            pay_method,
            COUNT(DISTINCT txn_id) as txn_count,
            SUM(total_amount) as total_amount
        FROM pos_snapshot
        WHERE version_id = ?
        GROUP BY pay_method
        ORDER BY txn_count DESC
    """
    pay_method_stats = analytics.con.execute(pay_method_sql, [version_id]).fetchdf().to_dict("records")

    version_stores = []
    for store in stores:
        store_sql = f"""
            SELECT
                COUNT(DISTINCT txn_id) as txn_count,
                SUM(total_amount) as total_amount,
                MAX(sync_delay_minutes) as max_delay
            FROM pos_snapshot
            WHERE version_id = ? AND store_id = ?
        """
        s = analytics.con.execute(store_sql, [version_id, store["id"]]).fetchdf().iloc[0].to_dict()
        version_stores.append({
            "store_id": store["id"],
            "store_code": store["store_code"],
            "store_name": store["store_name"],
            "region": store["region"],
            "city": store["city"],
            "batch_id": f"POS-V{version_id}-{store['store_code']}",
            "transaction_count": int(s["txn_count"] or 0),
            "total_amount": round(float(s["total_amount"] or 0), 2),
            "max_sync_delay_minutes": int(s["max_delay"] or 0),
        })

    detail = {
        "id": version_id,
        "version_number": version_id,
        "name": f"POS版本 V{version_id}",
        "description": f"POS流水快照版本{version_id}" + ("（修正同步延迟和金额差异）" if version_id == 2 else "（原始采集）"),
        "source_system": "POS收银系统",
        "sync_timestamp": (datetime(2026, 6, 15, 8, 30) if version_id == 1 else datetime(2026, 6, 15, 10, 0)).strftime("%Y-%m-%d %H:%M:%S"),
        "is_active": version_id == 2,
        "statistics": {
            "transaction_count": int(stats["txn_count"] or 0),
            "member_count": int(stats["member_count"] or 0),
            "member_rate": round(int(stats["member_count"] or 0) / max(int(stats["txn_count"] or 0), 1) * 100, 2),
            "total_amount": round(float(stats["total_amount"] or 0), 2),
            "pay_amount": round(float(stats["pay_amount"] or 0), 2),
            "goods_amount": round(float(stats["goods_amount"] or 0), 2),
            "avg_txn_amount": round(float(stats["avg_txn_amount"] or 0), 2),
            "delayed_txn_count": int(stats["delayed_txn_count"] or 0),
            "max_sync_delay_minutes": int(stats["max_delay_minutes"] or 0),
        },
        "daily_trend": daily_stats,
        "pay_method_distribution": pay_method_stats,
        "store_breakdown": version_stores,
        "created_at": (datetime(2026, 6, 15, 8, 30) if version_id == 1 else datetime(2026, 6, 15, 10, 0)).strftime("%Y-%m-%d %H:%M:%S"),
    }

    return {
        "code": 0,
        "message": "success",
        "data": detail,
    }


@router.get("/versions/{version_id}/transactions")
async def get_pos_transactions(
    version_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    store_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    txn_id: Optional[str] = Query(None),
    member_id: Optional[str] = Query(None),
    pay_method: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
):
    if version_id not in [1, 2]:
        raise HTTPException(status_code=404, detail=f"版本ID {version_id} 不存在")

    analytics = get_analytics()
    mock = get_mock_data()
    stores = {s["id"]: s for s in mock["stores"]}

    conditions = ["version_id = ?"]
    params: List[Any] = [version_id]

    if store_id:
        conditions.append("store_id = ?")
        params.append(store_id)
    if start_date:
        conditions.append("business_date >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("business_date <= ?")
        params.append(end_date)
    if txn_id:
        conditions.append("txn_id LIKE ?")
        params.append(f"%{txn_id}%")
    if member_id:
        conditions.append("member_id = ?")
        params.append(member_id)
    if pay_method:
        conditions.append("pay_method = ?")
        params.append(pay_method)
    if min_amount is not None:
        conditions.append("total_amount >= ?")
        params.append(min_amount)
    if max_amount is not None:
        conditions.append("total_amount <= ?")
        params.append(max_amount)

    where_clause = " AND ".join(conditions)

    count_sql = f"SELECT COUNT(DISTINCT txn_id) FROM pos_snapshot WHERE {where_clause}"
    total = analytics.con.execute(count_sql, params).fetchone()[0]

    offset = (page - 1) * page_size
    txn_sql = f"""
        SELECT DISTINCT
            txn_id,
            version_id,
            business_date,
            store_id,
            txn_time,
            member_id,
            total_amount,
            pay_amount,
            pay_method,
            sync_delay_minutes,
            created_at
        FROM pos_snapshot
        WHERE {where_clause}
        ORDER BY txn_time DESC
        LIMIT ? OFFSET ?
    """
    txn_params = params + [page_size, offset]
    txns_df = analytics.con.execute(txn_sql, txn_params).fetchdf()
    txns = txns_df.to_dict("records")

    txn_ids = [t["txn_id"] for t in txns]
    items = []
    if txn_ids:
        placeholders = ",".join(["?"] * len(txn_ids))
        items_sql = f"""
            SELECT
                txn_id,
                sku_code,
                sku_name,
                quantity,
                unit_price,
                subtotal
            FROM pos_snapshot
            WHERE txn_id IN ({placeholders}) AND version_id = ?
        """
        items_params = txn_ids + [version_id]
        items_df = analytics.con.execute(items_sql, items_params).fetchdf()
        items = items_df.to_dict("records")

    items_by_txn: Dict[str, List[Any]] = {}
    for item in items:
        tid = item["txn_id"]
        if tid not in items_by_txn:
            items_by_txn[tid] = []
        items_by_txn[tid].append({
            "sku_code": item["sku_code"],
            "sku_name": item["sku_name"],
            "quantity": float(item["quantity"]),
            "unit_price": round(float(item["unit_price"]), 2),
            "subtotal": round(float(item["subtotal"]), 2),
        })

    result = []
    for t in txns:
        store = stores.get(t["store_id"], {})
        result.append({
            "txn_id": t["txn_id"],
            "version_id": t["version_id"],
            "business_date": t["business_date"].strftime("%Y-%m-%d") if hasattr(t["business_date"], "strftime") else str(t["business_date"])[:10],
            "txn_time": t["txn_time"].strftime("%Y-%m-%d %H:%M:%S") if hasattr(t["txn_time"], "strftime") else str(t["txn_time"]),
            "store_id": t["store_id"],
            "store_code": store.get("store_code", ""),
            "store_name": store.get("store_name", ""),
            "member_id": t["member_id"],
            "total_amount": round(float(t["total_amount"]), 2),
            "pay_amount": round(float(t["pay_amount"]), 2),
            "pay_method": t["pay_method"],
            "sync_delay_minutes": int(t["sync_delay_minutes"] or 0),
            "items": items_by_txn.get(t["txn_id"], []),
        })

    return {
        "code": 0,
        "message": "success",
        "data": result,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/compare")
async def compare_pos_versions(
    version_id_1: int = Query(..., description="版本1 ID"),
    version_id_2: int = Query(..., description="版本2 ID"),
    store_id: Optional[int] = Query(None, description="门店ID（可选）"),
):
    if version_id_1 not in [1, 2] or version_id_2 not in [1, 2]:
        raise HTTPException(status_code=400, detail="版本ID必须是1或2")
    if version_id_1 == version_id_2:
        raise HTTPException(status_code=400, detail="两个版本ID不能相同")

    analytics = get_analytics()
    mock = get_mock_data()
    stores = {s["id"]: s for s in mock["stores"]}

    compare_results = analytics.compare_pos_versions(version_id_1, version_id_2, store_id)

    v1_stats_sql = """
        SELECT
            COUNT(DISTINCT txn_id) as txn_count,
            SUM(total_amount) as total_amount,
            SUM(CASE WHEN sync_delay_minutes > 30 THEN 1 ELSE 0 END) as delayed_count,
            MAX(sync_delay_minutes) as max_delay
        FROM pos_snapshot
        WHERE version_id = ?
    """ + (f" AND store_id = {store_id}" if store_id else "")

    v2_stats_sql = v1_stats_sql

    v1_stats = analytics.con.execute(v1_stats_sql, [version_id_1]).fetchdf().iloc[0].to_dict()
    v2_stats = analytics.con.execute(v2_stats_sql, [version_id_2]).fetchdf().iloc[0].to_dict()

    store_breakdown = []
    if not store_id:
        for sid, store in stores.items():
            s_compare = analytics.compare_pos_versions(version_id_1, version_id_2, sid)
            s_v1_sql = "SELECT COUNT(DISTINCT txn_id) as c, SUM(total_amount) as a FROM pos_snapshot WHERE version_id = ? AND store_id = ?"
            s_v2_sql = s_v1_sql
            sv1 = analytics.con.execute(s_v1_sql, [version_id_1, sid]).fetchdf().iloc[0]
            sv2 = analytics.con.execute(s_v2_sql, [version_id_2, sid]).fetchdf().iloc[0]
            store_breakdown.append({
                "store_id": sid,
                "store_code": store["store_code"],
                "store_name": store["store_name"],
                "region": store["region"],
                f"v{version_id_1}_txn_count": int(sv1["c"] or 0),
                f"v{version_id_2}_txn_count": int(sv2["c"] or 0),
                "txn_count_diff": int((sv2["c"] or 0) - (sv1["c"] or 0)),
                f"v{version_id_1}_total_amount": round(float(sv1["a"] or 0), 2),
                f"v{version_id_2}_total_amount": round(float(sv2["a"] or 0), 2),
                "total_amount_diff": round(float((sv2["a"] or 0) - (sv1["a"] or 0)), 2),
                "change_count": len(s_compare),
            })

    formatted_daily = []
    for r in compare_results:
        formatted_daily.append({
            "business_date": r["business_date"].strftime("%Y-%m-%d") if hasattr(r["business_date"], "strftime") else str(r["business_date"])[:10],
            f"v{version_id_1}_txn_count": int(r.get(f"v{version_id_1}_txn_count", r.get("v1_txn_count", 0)) or 0),
            f"v{version_id_2}_txn_count": int(r.get(f"v{version_id_2}_txn_count", r.get("v2_txn_count", 0)) or 0),
            "txn_count_diff": int(r.get("txn_count_diff", 0) or 0),
            f"v{version_id_1}_total_amount": round(float(r.get(f"v{version_id_1}_total", r.get("v1_total", 0)) or 0), 2),
            f"v{version_id_2}_total_amount": round(float(r.get(f"v{version_id_2}_total", r.get("v2_total", 0)) or 0), 2),
            "total_amount_diff": round(float(r.get("total_diff", 0) or 0), 2),
            "total_amount_diff_pct": round(float(r.get("total_diff_pct", 0) or 0), 2),
            "change_type": r.get("change_type", ""),
        })

    return {
        "code": 0,
        "message": "success",
        "data": {
            "version_1": {
                "id": version_id_1,
                "name": f"V{version_id_1}",
                "txn_count": int(v1_stats["txn_count"] or 0),
                "total_amount": round(float(v1_stats["total_amount"] or 0), 2),
                "delayed_txn_count": int(v1_stats["delayed_count"] or 0),
                "max_sync_delay_minutes": int(v1_stats["max_delay"] or 0),
            },
            "version_2": {
                "id": version_id_2,
                "name": f"V{version_id_2}",
                "txn_count": int(v2_stats["txn_count"] or 0),
                "total_amount": round(float(v2_stats["total_amount"] or 0), 2),
                "delayed_txn_count": int(v2_stats["delayed_count"] or 0),
                "max_sync_delay_minutes": int(v2_stats["max_delay"] or 0),
            },
            "summary": {
                "txn_count_diff": int((v2_stats["txn_count"] or 0) - (v1_stats["txn_count"] or 0)),
                "total_amount_diff": round(float((v2_stats["total_amount"] or 0) - (v1_stats["total_amount"] or 0)), 2),
                "total_amount_diff_pct": round(
                    float((v2_stats["total_amount"] or 0) - (v1_stats["total_amount"] or 0)) / max(float(v1_stats["total_amount"] or 0), 1) * 100, 2
                ),
                "changed_days": len(compare_results),
                "sync_delay_improvement": int(max((v1_stats["max_delay"] or 0) - (v2_stats["max_delay"] or 0), 0)),
            },
            "daily_comparison": formatted_daily,
            "store_breakdown": store_breakdown,
        },
    }


@router.get("/conflicts")
async def detect_pos_member_conflicts(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
    store_id: Optional[int] = Query(None, description="门店ID（可选）"),
    conflict_type: Optional[str] = Query(None, description="冲突类型：pos_only/member_only/amount_mismatch"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    analytics = get_analytics()
    mock = get_mock_data()
    stores = {s["id"]: s for s in mock["stores"]}

    result = analytics.detect_member_pos_conflicts(start_date, end_date, store_id)
    summary = result["summary"]
    all_details = result["details"]

    if conflict_type:
        all_details = [d for d in all_details if d["conflict_type"] == conflict_type]

    total = len(all_details)
    offset = (page - 1) * page_size
    paged_details = all_details[offset:offset + page_size]

    formatted_details = []
    for d in paged_details:
        sid = d.get("store_id")
        store = stores.get(sid, {})
        formatted_details.append({
            "conflict_type": d["conflict_type"],
            "conflict_type_name": {
                "pos_only": "POS独有（会员小票缺失）",
                "member_only": "会员小票独有（POS缺失）",
                "amount_mismatch": "金额不一致",
            }.get(d["conflict_type"], d["conflict_type"]),
            "pos_txn_id": d.get("pos_txn_id"),
            "member_receipt_no": d.get("member_receipt_no"),
            "pos_member_id": d.get("pos_member_id"),
            "member_id": d.get("member_id"),
            "store_id": sid,
            "store_code": store.get("store_code", ""),
            "store_name": store.get("store_name", ""),
            "business_date": d["business_date"].strftime("%Y-%m-%d") if hasattr(d["business_date"], "strftime") else str(d["business_date"])[:10],
            "txn_time": d["txn_time"].strftime("%Y-%m-%d %H:%M:%S") if hasattr(d["txn_time"], "strftime") else str(d["txn_time"]),
            "pos_total": round(float(d["pos_total"]), 2) if d.get("pos_total") is not None else None,
            "member_total": round(float(d["member_total"]), 2) if d.get("member_total") is not None else None,
            "amount_diff": round(float(d["amount_diff"]), 2) if d.get("amount_diff") is not None else None,
            "description": d.get("description", ""),
        })

    return {
        "code": 0,
        "message": "success",
        "data": {
            "summary": {
                "date_range": {
                    "start_date": start_date,
                    "end_date": end_date,
                },
                "store_id": store_id,
                "pos_txn_count": int(summary["pos_txn_count"] or 0),
                "member_txn_count": int(summary["member_txn_count"] or 0),
                "matched_count": int(summary["matched_count"] or 0),
                "matched_rate": round(int(summary["matched_count"] or 0) / max(int(summary["pos_txn_count"] or 0), int(summary["member_txn_count"] or 0), 1) * 100, 2),
                "pos_only_count": int(summary["pos_only_count"] or 0),
                "member_only_count": int(summary["member_only_count"] or 0),
                "amount_mismatch_count": int(summary["amount_mismatch_count"] or 0),
                "total_conflict_count": int(summary["pos_only_count"] or 0) + int(summary["member_only_count"] or 0) + int(summary["amount_mismatch_count"] or 0),
            },
            "details": formatted_details,
        },
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/conflicts/export")
async def export_pos_member_conflicts(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD"),
    store_id: Optional[int] = Query(None, description="门店ID（可选）"),
    conflict_type: Optional[str] = Query(None, description="冲突类型过滤"),
    format: str = Query("json", description="导出格式：json/csv"),
):
    analytics = get_analytics()
    mock = get_mock_data()
    stores = {s["id"]: s for s in mock["stores"]}

    result = analytics.detect_member_pos_conflicts(start_date, end_date, store_id)
    all_details = result["details"]

    if conflict_type:
        all_details = [d for d in all_details if d["conflict_type"] == conflict_type]

    export_rows = []
    for d in all_details:
        sid = d.get("store_id")
        store = stores.get(sid, {})
        export_rows.append({
            "冲突类型": d["conflict_type"],
            "冲突类型说明": {
                "pos_only": "POS独有（会员小票缺失）",
                "member_only": "会员小票独有（POS缺失）",
                "amount_mismatch": "金额不一致",
            }.get(d["conflict_type"], d["conflict_type"]),
            "POS交易号": d.get("pos_txn_id", ""),
            "会员小票号": d.get("member_receipt_no", ""),
            "POS会员ID": d.get("pos_member_id", ""),
            "会员ID": d.get("member_id", ""),
            "门店ID": sid or "",
            "门店编码": store.get("store_code", ""),
            "门店名称": store.get("store_name", ""),
            "业务日期": d["business_date"].strftime("%Y-%m-%d") if hasattr(d["business_date"], "strftime") else str(d["business_date"])[:10],
            "交易时间": d["txn_time"].strftime("%Y-%m-%d %H:%M:%S") if hasattr(d["txn_time"], "strftime") else str(d["txn_time"]),
            "POS交易金额": round(float(d["pos_total"]), 2) if d.get("pos_total") is not None else "",
            "会员小票金额": round(float(d["member_total"]), 2) if d.get("member_total") is not None else "",
            "金额差异": round(float(d["amount_diff"]), 2) if d.get("amount_diff") is not None else "",
            "冲突说明": d.get("description", ""),
        })

    filename = f"pos_member_conflicts_{start_date}_{end_date}"
    if store_id:
        filename += f"_store{store_id}"

    if format == "csv":
        import csv
        import io
        from fastapi.responses import StreamingResponse

        if not export_rows:
            csv_content = ""
        else:
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=export_rows[0].keys())
            writer.writeheader()
            writer.writerows(export_rows)
            csv_content = output.getvalue()

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv; charset=utf-8-sig",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )

    return {
        "code": 0,
        "message": "success",
        "data": {
            "filename": f"{filename}.json",
            "export_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date_range": {
                "start_date": start_date,
                "end_date": end_date,
            },
            "store_id": store_id,
            "conflict_type_filter": conflict_type,
            "row_count": len(export_rows),
            "rows": export_rows,
        },
    }
