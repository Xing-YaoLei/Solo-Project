from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import random
import io
import csv
from app.services.mock_data import STORES
from app.services.duckdb_service import get_analytics

router = APIRouter()

CLEANING_SKUS = [
    {"code": "CLN001", "name": "咖啡机清洁片", "cat": "清洁耗材"},
    {"code": "CLN002", "name": "蒸汽棒清洁刷", "cat": "清洁耗材"},
    {"code": "CLN003", "name": "冲煮头反冲粉", "cat": "清洁耗材"},
    {"code": "CLN004", "name": "奶缸消毒片", "cat": "清洁耗材"},
    {"code": "CLN005", "name": "设备除垢剂", "cat": "清洁耗材"},
    {"code": "CLN006", "name": "台面消毒液", "cat": "清洁耗材"},
    {"code": "BEAN001", "name": "意式拼配豆1kg", "cat": "咖啡豆"},
    {"code": "BEAN002", "name": "单品豆SOE 250g", "cat": "咖啡豆"},
    {"code": "MILK001", "name": "全脂牛奶1L", "cat": "乳制品"},
    {"code": "MILK002", "name": "燕麦奶1L", "cat": "乳制品"},
]

_inventory_versions = []
_inventory_items: Dict[int, List[Dict[str, Any]]] = {}

_base_date = datetime(2026, 5, 1)
_version_id_seq = 1

for version_num in [1, 2]:
    for store in STORES:
        snapshot_date = _base_date + timedelta(days=14 if version_num == 1 else 21)
        batch_id = f"INV-V{version_num}-{store['store_code']}"
        items = []
        item_id = 1
        total_value = 0.0

        for sku in CLEANING_SKUS:
            qty = random.randint(5, 50)
            if version_num == 2 and random.random() < 0.3:
                qty = max(0, qty + random.randint(-10, 15))
            price = round(random.uniform(20, 200), 2)
            total_price = round(qty * price, 2)
            total_value += total_price

            items.append({
                "id": item_id,
                "version_id": _version_id_seq,
                "sku_code": sku["code"],
                "sku_name": sku["name"],
                "category": sku["cat"],
                "quantity": float(qty),
                "unit": "个",
                "unit_price": price,
                "total_price": total_price,
                "cleaning_item_flag": sku["code"].startswith("CLN"),
                "sync_delay_minutes": random.choice([0, 0, 0, 45, 120]) if version_num == 1 and random.random() < 0.3 else 0,
                "extra_data": {
                    "min_stock": random.randint(5, 15),
                    "max_stock": random.randint(40, 80),
                    "supplier": random.choice(["供应商A", "供应商B", "供应商C"]),
                },
                "created_at": datetime.utcnow(),
            })
            item_id += 1

        version = {
            "id": _version_id_seq,
            "version_number": version_num,
            "batch_id": batch_id,
            "snapshot_date": snapshot_date,
            "store_id": store["id"],
            "store_name": store["store_name"],
            "store_code": store["store_code"],
            "source_system": random.choice(["WMS系统", "ERP系统", "盘点App"]),
            "sync_delay_minutes": max([i["sync_delay_minutes"] for i in items]),
            "sync_timestamp": snapshot_date + timedelta(hours=random.randint(1, 8)),
            "record_count": len(items),
            "total_value": round(total_value, 2),
            "is_active": version_num == 2,
            "created_at": datetime.utcnow(),
        }
        _inventory_versions.append(version)
        _inventory_items[_version_id_seq] = items
        _version_id_seq += 1

_inventory_versions.sort(key=lambda x: (x["version_number"], x["store_id"]), reverse=True)


@router.get("/versions")
async def get_inventory_versions(
    store_id: Optional[int] = Query(None, description="门店ID"),
    version_number: Optional[int] = Query(None, description="版本号"),
    is_active: Optional[bool] = Query(None, description="是否当前版本"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    filtered = _inventory_versions
    if store_id is not None:
        filtered = [v for v in filtered if v["store_id"] == store_id]
    if version_number is not None:
        filtered = [v for v in filtered if v["version_number"] == version_number]
    if is_active is not None:
        filtered = [v for v in filtered if v["is_active"] == is_active]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    paged_data = filtered[start:end]

    return {
        "code": 0,
        "message": "success",
        "data": paged_data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/versions/{version_id}")
async def get_inventory_version_detail(version_id: int):
    version = next((v for v in _inventory_versions if v["id"] == version_id), None)
    if not version:
        raise HTTPException(status_code=404, detail="版本不存在")

    items = _inventory_items.get(version_id, [])
    cleaning_count = sum(1 for i in items if i["cleaning_item_flag"])
    non_cleaning_count = len(items) - cleaning_count

    categories = {}
    for item in items:
        cat = item["category"]
        if cat not in categories:
            categories[cat] = {"count": 0, "total_value": 0.0}
        categories[cat]["count"] += 1
        categories[cat]["total_value"] += item["total_price"]

    detail = {
        **version,
        "item_summary": {
            "total_items": len(items),
            "cleaning_items": cleaning_count,
            "non_cleaning_items": non_cleaning_count,
            "total_quantity": sum(i["quantity"] for i in items),
        },
        "category_summary": categories,
        "delay_summary": {
            "items_with_delay": sum(1 for i in items if i["sync_delay_minutes"] > 0),
            "max_delay_minutes": max(i["sync_delay_minutes"] for i in items) if items else 0,
            "avg_delay_minutes": round(sum(i["sync_delay_minutes"] for i in items) / len(items), 2) if items else 0,
        },
    }
    return {
        "code": 0,
        "message": "success",
        "data": detail,
    }


@router.get("/versions/{version_id}/items")
async def get_inventory_version_items(
    version_id: int,
    category: Optional[str] = Query(None, description="商品分类"),
    cleaning_item_flag: Optional[bool] = Query(None, description="是否清洁用品"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    if version_id not in _inventory_items:
        raise HTTPException(status_code=404, detail="版本不存在")

    items = _inventory_items[version_id]
    filtered = items

    if category:
        filtered = [i for i in filtered if i["category"] == category]
    if cleaning_item_flag is not None:
        filtered = [i for i in filtered if i["cleaning_item_flag"] == cleaning_item_flag]
    if keyword:
        kw = keyword.lower()
        filtered = [i for i in filtered if kw in i["sku_code"].lower() or kw in i["sku_name"].lower()]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    paged_data = filtered[start:end]

    return {
        "code": 0,
        "message": "success",
        "data": paged_data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/compare")
async def compare_inventory_versions(
    version_id_1: int = Query(..., description="版本1 ID"),
    version_id_2: int = Query(..., description="版本2 ID"),
    store_id: Optional[int] = Query(None, description="门店ID"),
    change_type: Optional[str] = Query(None, description="变更类型: new_in_v2/removed_in_v2/modified/unchanged"),
):
    v1 = next((v for v in _inventory_versions if v["id"] == version_id_1), None)
    v2 = next((v for v in _inventory_versions if v["id"] == version_id_2), None)
    if not v1:
        raise HTTPException(status_code=404, detail=f"版本{version_id_1}不存在")
    if not v2:
        raise HTTPException(status_code=404, detail=f"版本{version_id_2}不存在")

    analytics = get_analytics()
    try:
        duckdb_result = analytics.compare_inventory_versions(
            version_id_1=v1["version_number"],
            version_id_2=v2["version_number"],
            store_id=store_id,
        )
    except Exception:
        duckdb_result = []

    if not duckdb_result:
        items1 = _inventory_items.get(version_id_1, [])
        items2 = _inventory_items.get(version_id_2, [])
        items1_map = {i["sku_code"]: i for i in items1}
        items2_map = {i["sku_code"]: i for i in items2}

        all_skus = set(items1_map.keys()) | set(items2_map.keys())
        for sku in all_skus:
            i1 = items1_map.get(sku)
            i2 = items2_map.get(sku)
            qty1 = i1["quantity"] if i1 else None
            qty2 = i2["quantity"] if i2 else None
            total1 = i1["total_price"] if i1 else None
            total2 = i2["total_price"] if i2 else None

            if i1 is None:
                ct = "new_in_v2"
            elif i2 is None:
                ct = "removed_in_v2"
            elif qty1 != qty2 or total1 != total2:
                ct = "modified"
            else:
                ct = "unchanged"

            diff_pct = None
            if qty1 and qty1 != 0:
                diff_pct = round((qty2 - qty1) / qty1 * 100, 2) if qty2 is not None else None

            duckdb_result.append({
                "sku_code": sku,
                "sku_name": (i1 or i2)["sku_name"],
                "category": (i1 or i2)["category"],
                "v1_quantity": qty1,
                "v2_quantity": qty2,
                "qty_diff": (qty2 or 0) - (qty1 or 0),
                "qty_diff_pct": diff_pct,
                "v1_total": total1,
                "v2_total": total2,
                "total_diff": (total2 or 0) - (total1 or 0),
                "change_type": ct,
            })

    if change_type:
        duckdb_result = [r for r in duckdb_result if r["change_type"] == change_type]

    summary = {
        "version_1": {"id": v1["id"], "version_number": v1["version_number"], "batch_id": v1["batch_id"]},
        "version_2": {"id": v2["id"], "version_number": v2["version_number"], "batch_id": v2["batch_id"]},
        "total_changes": len(duckdb_result),
        "new_items": sum(1 for r in duckdb_result if r["change_type"] == "new_in_v2"),
        "removed_items": sum(1 for r in duckdb_result if r["change_type"] == "removed_in_v2"),
        "modified_items": sum(1 for r in duckdb_result if r["change_type"] == "modified"),
        "unchanged_items": sum(1 for r in duckdb_result if r["change_type"] == "unchanged"),
        "total_qty_diff": sum(r["qty_diff"] or 0 for r in duckdb_result),
        "total_value_diff": round(sum(r["total_diff"] or 0 for r in duckdb_result), 2),
    }

    return {
        "code": 0,
        "message": "success",
        "data": {
            "summary": summary,
            "differences": duckdb_result,
        },
    }


@router.get("/versions/export/{version_id}")
async def export_inventory_version(version_id: int, format: str = Query("csv", description="导出格式: csv")):
    if version_id not in _inventory_items:
        raise HTTPException(status_code=404, detail="版本不存在")

    version = next((v for v in _inventory_versions if v["id"] == version_id), None)
    items = _inventory_items[version_id]

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "版本ID", "批次号", "门店编码", "门店名称", "快照日期",
            "SKU编码", "SKU名称", "分类", "数量", "单位",
            "单价", "总价", "是否清洁用品", "同步延迟(分钟)",
        ])
        for item in items:
            writer.writerow([
                version["id"],
                version["batch_id"],
                version["store_code"],
                version["store_name"],
                version["snapshot_date"].strftime("%Y-%m-%d"),
                item["sku_code"],
                item["sku_name"],
                item["category"],
                item["quantity"],
                item["unit"],
                item["unit_price"],
                item["total_price"],
                "是" if item["cleaning_item_flag"] else "否",
                item["sync_delay_minutes"],
            ])

        output.seek(0)
        filename = f"inventory_version_{version_id}_{version['batch_id']}.csv"
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
        }
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers=headers,
        )
    else:
        raise HTTPException(status_code=400, detail="不支持的导出格式")
