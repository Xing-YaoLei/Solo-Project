# -*- coding: utf-8 -*-
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from collections import Counter

from app.services.duckdb_service import get_analytics
from app.services.mock_data import generate_mock_data

router = APIRouter()

_mock_data = None


def _get_mock_data():
    global _mock_data
    if _mock_data is None:
        _mock_data = generate_mock_data()
    return _mock_data


def _get_store_name(store_id: int) -> str:
    data = _get_mock_data()
    stores = data.get("stores", [])
    store = next((s for s in stores if s["id"] == store_id), None)
    return store["store_name"] if store else f"门店{store_id}"


def _get_equipment_info(equipment_id: int) -> Dict[str, Any]:
    data = _get_mock_data()
    equipments = data.get("equipments", [])
    eq = next((e for e in equipments if e["id"] == equipment_id), None)
    return eq or {"id": equipment_id, "equipment_name": f"设备{equipment_id}"}


@router.get("/records", response_model=Dict[str, Any])
async def get_inspection_records(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    store_id: Optional[int] = Query(None, description="门店ID"),
    equipment_id: Optional[int] = Query(None, description="设备ID"),
    inspection_type: Optional[str] = Query(None, description="巡检类型"),
    is_pass: Optional[bool] = Query(None, description="是否通过"),
):
    data = _get_mock_data()
    records = data["inspection_records"]

    filtered = []
    for rec in records:
        if store_id is not None and rec["store_id"] != store_id:
            continue
        if equipment_id is not None and rec["equipment_id"] != equipment_id:
            continue
        if inspection_type is not None and rec["inspection_type"] != inspection_type:
            continue
        if is_pass is not None and rec["is_pass"] != is_pass:
            continue
        filtered.append(rec)

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    page_items = filtered[start:end]

    enriched = []
    for item in page_items:
        r = dict(item)
        r["store_name"] = _get_store_name(r["store_id"])
        eq = _get_equipment_info(r["equipment_id"])
        r["equipment_name"] = eq.get("equipment_name", "")
        r["equipment_code"] = eq.get("equipment_code", "")
        r["equipment_type"] = eq.get("equipment_type", "")
        enriched.append(r)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "page_size": page_size,
        "summary": {
            "total_count": total,
            "pass_count": sum(1 for r in filtered if r["is_pass"]),
            "fail_count": sum(1 for r in filtered if not r["is_pass"]),
            "avg_score": round(sum(r["score"] for r in filtered) / len(filtered), 2) if filtered else 0,
        }
    }


@router.get("/records/{record_id}", response_model=Dict[str, Any])
async def get_inspection_detail(record_id: int):
    data = _get_mock_data()
    records = data["inspection_records"]

    record = next((r for r in records if r["id"] == record_id), None)
    if record is None:
        raise HTTPException(status_code=404, detail=f"巡检记录 {record_id} 不存在")

    result = dict(record)
    result["store_name"] = _get_store_name(result["store_id"])
    eq = _get_equipment_info(result["equipment_id"])
    result["equipment_name"] = eq.get("equipment_name", "")
    result["equipment_code"] = eq.get("equipment_code", "")
    result["equipment_type"] = eq.get("equipment_type", "")
    result["model"] = eq.get("model", "")
    result["manufacturer"] = eq.get("manufacturer", "")

    pass_item_count = sum(1 for it in result.get("item_results", []) if it.get("result") == "pass")
    total_item_count = len(result.get("item_results", []))
    result["item_pass_count"] = pass_item_count
    result["item_total_count"] = total_item_count
    result["item_pass_rate"] = round(pass_item_count / total_item_count * 100, 2) if total_item_count > 0 else 0

    data = _get_mock_data()
    linked_tasks = [t for t in data["rectification_tasks"] if t.get("inspection_id") == record_id]
    result["linked_tasks"] = linked_tasks
    result["linked_task_count"] = len(linked_tasks)

    return result


@router.get("/templates", response_model=Dict[str, Any])
async def get_inspection_templates(
    is_active: Optional[bool] = Query(None, description="是否启用"),
    equipment_type: Optional[str] = Query(None, description="设备类型"),
):
    templates = [
        {
            "id": 1,
            "template_code": "TPL-ESP-001",
            "template_name": "意式咖啡机日常巡检模板V2.1",
            "equipment_type": "意式咖啡机",
            "version": "2.1",
            "items": [
                {"id": "i1", "name": "机身外观清洁", "category": "外观", "weight": 10, "max_score": 10, "standard": "机身无污渍、无咖啡渍"},
                {"id": "i2", "name": "冲煮头清洁", "category": "清洁", "weight": 20, "max_score": 20, "standard": "冲煮头无堵塞、无残粉"},
                {"id": "i3", "name": "蒸汽棒清洁与除垢", "category": "清洁", "weight": 20, "max_score": 20, "standard": "蒸汽棒无奶垢、出汽顺畅"},
                {"id": "i4", "name": "压力表检查", "category": "功能", "weight": 15, "max_score": 15, "standard": "气压0.8-1.0bar，水压8-10bar"},
                {"id": "i5", "name": "温度测试", "category": "功能", "weight": 15, "max_score": 15, "standard": "冲煮温度90-96℃，蒸汽温度120-130℃"},
                {"id": "i6", "name": "接水盘清洁", "category": "清洁", "weight": 10, "max_score": 10, "standard": "接水盘无积水、无污渍"},
                {"id": "i7", "name": "台面周边清洁", "category": "环境", "weight": 10, "max_score": 10, "standard": "台面整洁，周边无杂物"},
            ],
            "scoring_rules": {
                "pass_threshold": 80,
                "excellent_threshold": 90,
                "deduction_rules": {
                    "minor": 5,
                    "major": 15,
                    "critical": 30,
                }
            },
            "pass_threshold": 80.0,
            "is_active": True,
            "created_by": "运营部-张工",
            "created_at": datetime(2026, 3, 15, 10, 0, 0),
            "updated_at": datetime(2026, 4, 20, 14, 30, 0),
            "usage_count": 256,
        },
        {
            "id": 2,
            "template_code": "TPL-GRD-001",
            "template_name": "磨豆机日常巡检模板V1.5",
            "equipment_type": "磨豆机",
            "version": "1.5",
            "items": [
                {"id": "g1", "name": "机身外观", "category": "外观", "weight": 15, "max_score": 15, "standard": "机身干净，无残粉溢出"},
                {"id": "g2", "name": "豆仓清洁", "category": "清洁", "weight": 25, "max_score": 25, "standard": "豆仓无残粉、无旧豆"},
                {"id": "g3", "name": "刀盘检查与清洁", "category": "维护", "weight": 30, "max_score": 30, "standard": "刀盘无残粉堵塞，间隙正常"},
                {"id": "g4", "name": "出粉口清洁", "category": "清洁", "weight": 15, "max_score": 15, "standard": "出粉口无堵塞、无结块"},
                {"id": "g5", "name": "功能测试", "category": "功能", "weight": 15, "max_score": 15, "standard": "研磨度调节顺畅，出粉均匀"},
            ],
            "scoring_rules": {
                "pass_threshold": 80,
                "excellent_threshold": 90,
            },
            "pass_threshold": 80.0,
            "is_active": True,
            "created_by": "运营部-李工",
            "created_at": datetime(2026, 2, 28, 9, 0, 0),
            "updated_at": datetime(2026, 4, 10, 11, 0, 0),
            "usage_count": 189,
        },
        {
            "id": 3,
            "template_code": "TPL-ICE-001",
            "template_name": "制冰机专项巡检模板V1.0",
            "equipment_type": "制冰机",
            "version": "1.0",
            "items": [
                {"id": "c1", "name": "外观清洁", "category": "外观", "weight": 10, "max_score": 10, "standard": "外壳清洁无污渍"},
                {"id": "c2", "name": "储冰箱清洁", "category": "清洁", "weight": 25, "max_score": 25, "standard": "储冰箱无异味、无积水"},
                {"id": "c3", "name": "冷凝器清洁", "category": "维护", "weight": 25, "max_score": 25, "standard": "冷凝器无灰尘堵塞"},
                {"id": "c4", "name": "水路系统检查", "category": "功能", "weight": 20, "max_score": 20, "standard": "水路通畅，无漏水"},
                {"id": "c5", "name": "制冰质量检查", "category": "功能", "weight": 20, "max_score": 20, "standard": "冰块晶莹剔透，厚度均匀"},
            ],
            "scoring_rules": {
                "pass_threshold": 80,
            },
            "pass_threshold": 80.0,
            "is_active": True,
            "created_by": "工程部-王工",
            "created_at": datetime(2026, 4, 1, 8, 30, 0),
            "updated_at": datetime(2026, 4, 1, 8, 30, 0),
            "usage_count": 67,
        },
        {
            "id": 4,
            "template_code": "TPL-RFG-001",
            "template_name": "冷藏柜巡检模板V1.2",
            "equipment_type": "冷藏柜",
            "version": "1.2",
            "items": [
                {"id": "r1", "name": "外观与密封条", "category": "外观", "weight": 20, "max_score": 20, "standard": "外观清洁，密封条完好"},
                {"id": "r2", "name": "内部清洁", "category": "清洁", "weight": 25, "max_score": 25, "standard": "内部无污渍、无异味"},
                {"id": "r3", "name": "温度检查", "category": "功能", "weight": 30, "max_score": 30, "standard": "冷藏2-8℃，冷冻-18℃以下"},
                {"id": "r4", "name": "散热格栅清洁", "category": "维护", "weight": 15, "max_score": 15, "standard": "格栅无灰尘堵塞"},
                {"id": "r5", "name": "门封测试", "category": "功能", "weight": 10, "max_score": 10, "standard": "关门后密封良好"},
            ],
            "scoring_rules": {"pass_threshold": 80},
            "pass_threshold": 80.0,
            "is_active": False,
            "created_by": "工程部-赵工",
            "created_at": datetime(2026, 1, 20, 10, 0, 0),
            "updated_at": datetime(2026, 3, 25, 16, 0, 0),
            "usage_count": 145,
        },
    ]

    filtered = []
    for t in templates:
        if is_active is not None and t["is_active"] != is_active:
            continue
        if equipment_type is not None and t["equipment_type"] != equipment_type:
            continue
        filtered.append(t)

    return {
        "items": filtered,
        "total": len(filtered),
        "equipment_types": list(set(t["equipment_type"] for t in templates)),
    }


@router.get("/trends", response_model=Dict[str, Any])
async def get_inspection_trends(
    store_id: Optional[int] = Query(None, description="门店ID"),
    periods: int = Query(8, ge=1, le=24, description="周期数"),
):
    analytics = get_analytics()
    comparison_data = analytics.get_inspection_comparison(
        period_type="weekly",
        store_id=store_id,
        periods=periods,
    )

    data = _get_mock_data()
    store_map = {s["id"]: s["store_name"] for s in data.get("stores", [])}

    by_store = {}
    for item in comparison_data:
        sid = item["store_id"]
        if sid not in by_store:
            by_store[sid] = {
                "store_id": sid,
                "store_name": store_map.get(sid, f"门店{sid}"),
                "periods": [],
            }
        by_store[sid]["periods"].append({
            "period_start": item["period_start"],
            "period_end": item["period_end"],
            "pass_rate": item["pass_rate"],
            "prev_pass_rate": item["prev_pass_rate"],
            "improvement_rate": item["improvement_rate"],
            "avg_score": item["avg_score"],
            "prev_avg_score": item["prev_avg_score"],
            "total_inspections": item["total_inspections"],
        })

    overall_periods = {}
    for item in comparison_data:
        key = (item["period_start"], item["period_end"])
        if key not in overall_periods:
            overall_periods[key] = {
                "period_start": item["period_start"],
                "period_end": item["period_end"],
                "total_inspections": 0,
                "pass_rate_sum": 0,
                "avg_score_sum": 0,
                "store_count": 0,
            }
        overall_periods[key]["total_inspections"] += item["total_inspections"]
        overall_periods[key]["pass_rate_sum"] += item["pass_rate"]
        overall_periods[key]["avg_score_sum"] += item["avg_score"]
        overall_periods[key]["store_count"] += 1

    overall_trend = []
    for key, val in sorted(overall_periods.items()):
        overall_trend.append({
            "period_start": val["period_start"],
            "period_end": val["period_end"],
            "total_inspections": val["total_inspections"],
            "pass_rate": round(val["pass_rate_sum"] / val["store_count"], 2),
            "avg_score": round(val["avg_score_sum"] / val["store_count"], 2),
        })

    for i, cur in enumerate(overall_trend):
        if i > 0:
            prev = overall_trend[i - 1]
            cur["prev_pass_rate"] = prev["pass_rate"]
            cur["improvement_rate"] = round(cur["pass_rate"] - prev["pass_rate"], 2)
        else:
            cur["prev_pass_rate"] = round(cur["pass_rate"] - 2.5, 2)
            cur["improvement_rate"] = 2.5

    return {
        "period_type": "weekly",
        "periods_count": len(overall_trend),
        "overall_trend": overall_trend,
        "by_store": list(by_store.values()),
        "source": "duckdb",
    }


@router.get("/comparison", response_model=Dict[str, Any])
async def get_inspection_comparison_analysis(
    store_id: Optional[int] = Query(None, description="门店ID"),
    periods: int = Query(8, ge=2, le=24, description="周期数"),
):
    analytics = get_analytics()
    comparison_data = analytics.get_inspection_comparison(
        period_type="weekly",
        store_id=store_id,
        periods=periods,
    )

    data = _get_mock_data()
    store_map = {s["id"]: s for s in data.get("stores", [])}

    half = len(comparison_data) // 2
    first_half = comparison_data[:half] if half > 0 else []
    second_half = comparison_data[half:] if len(comparison_data) > half else []

    def avg_pass_rate(items):
        if not items:
            return 0
        if isinstance(items[0], dict):
            return round(sum(i["pass_rate"] for i in items) / len(items), 2)
        return round(sum(items) / len(items), 2)

    def avg_score(items):
        if not items:
            return 0
        if isinstance(items[0], dict):
            return round(sum(i["avg_score"] for i in items) / len(items), 2)
        return round(sum(items) / len(items), 2)

    def total_inspections(items):
        if not items:
            return 0
        if isinstance(items[0], dict):
            return sum(i["total_inspections"] for i in items)
        return int(sum(items))

    current_pass_rate = avg_pass_rate(second_half)
    previous_pass_rate = avg_pass_rate(first_half)
    improvement_rate = round(current_pass_rate - previous_pass_rate, 2)
    improvement_pct = round(
        (current_pass_rate - previous_pass_rate) / previous_pass_rate * 100, 2
    ) if previous_pass_rate > 0 else 0

    current_avg_score = avg_score(second_half)
    previous_avg_score = avg_score(first_half)
    score_improvement = round(current_avg_score - previous_avg_score, 2)

    current_total = total_inspections(second_half)
    previous_total = total_inspections(first_half)

    store_stats = {}
    for item in comparison_data:
        sid = item["store_id"]
        if sid not in store_stats:
            store_stats[sid] = {
                "store_id": sid,
                "store_name": store_map.get(sid, {}).get("store_name", f"门店{sid}"),
                "store_code": store_map.get(sid, {}).get("store_code", ""),
                "region": store_map.get(sid, {}).get("region", ""),
                "first_half_pass_rates": [],
                "second_half_pass_rates": [],
                "first_half_scores": [],
                "second_half_scores": [],
                "total_inspections": 0,
            }
        ss = store_stats[sid]
        idx = comparison_data.index(item)
        in_second = idx >= len(comparison_data) // 2
        if in_second:
            ss["second_half_pass_rates"].append(item["pass_rate"])
            ss["second_half_scores"].append(item["avg_score"])
        else:
            ss["first_half_pass_rates"].append(item["pass_rate"])
            ss["first_half_scores"].append(item["avg_score"])
        ss["total_inspections"] += item["total_inspections"]

    store_ranking = []
    for sid, ss in store_stats.items():
        cur_rate = avg_pass_rate(ss["second_half_pass_rates"])
        prev_rate = avg_pass_rate(ss["first_half_pass_rates"])
        cur_score = avg_score(ss["second_half_scores"])
        improve = round(cur_rate - prev_rate, 2)
        store_ranking.append({
            **ss,
            "current_pass_rate": cur_rate,
            "previous_pass_rate": prev_rate,
            "improvement_rate": improve,
            "current_avg_score": cur_score,
            "is_improved": improve > 0,
        })
    store_ranking.sort(key=lambda x: x["current_pass_rate"], reverse=True)
    for i, s in enumerate(store_ranking):
        s["rank"] = i + 1

    top_improved = sorted(store_ranking, key=lambda x: x["improvement_rate"], reverse=True)[:3]
    top_declined = sorted(store_ranking, key=lambda x: x["improvement_rate"])[:3]

    issue_counter = Counter()
    for rec in data["inspection_records"]:
        for issue in rec.get("issue_items", []):
            issue_counter[issue["name"]] += 1
    top_issues = [
        {"name": name, "count": count, "percentage": round(count / len(data["inspection_records"]) * 100, 1)}
        for name, count in issue_counter.most_common(5)
    ]

    return {
        "period_type": "weekly",
        "total_periods": len(comparison_data),
        "comparison": {
            "current_period": {
                "label": "后周期",
                "period_count": len(second_half),
                "total_inspections": current_total,
                "avg_pass_rate": current_pass_rate,
                "avg_score": current_avg_score,
            },
            "previous_period": {
                "label": "前周期",
                "period_count": len(first_half),
                "total_inspections": previous_total,
                "avg_pass_rate": previous_pass_rate,
                "avg_score": previous_avg_score,
            },
            "improvement": {
                "pass_rate_diff": improvement_rate,
                "pass_rate_diff_pct": improvement_pct,
                "score_diff": score_improvement,
                "inspection_diff": current_total - previous_total,
                "trend": "up" if improvement_rate > 0 else ("down" if improvement_rate < 0 else "stable"),
            },
        },
        "store_ranking": store_ranking,
        "top_improved": top_improved,
        "top_declined": top_declined,
        "top_issues": top_issues,
    }


@router.get("/records/export", response_model=Dict[str, Any])
async def export_inspection_records(
    store_id: Optional[int] = Query(None, description="门店ID"),
    equipment_id: Optional[int] = Query(None, description="设备ID"),
    inspection_type: Optional[str] = Query(None, description="巡检类型"),
    is_pass: Optional[bool] = Query(None, description="是否通过"),
    format: str = Query("xlsx", description="导出格式：xlsx/csv"),
):
    data = _get_mock_data()
    records = data["inspection_records"]

    filtered = []
    for rec in records:
        if store_id is not None and rec["store_id"] != store_id:
            continue
        if equipment_id is not None and rec["equipment_id"] != equipment_id:
            continue
        if inspection_type is not None and rec["inspection_type"] != inspection_type:
            continue
        if is_pass is not None and rec["is_pass"] != is_pass:
            continue
        filtered.append(rec)

    export_rows = []
    for rec in filtered:
        pass_items = sum(1 for it in rec.get("item_results", []) if it.get("result") == "pass")
        total_items = len(rec.get("item_results", []))
        issue_names = "；".join([i["name"] for i in rec.get("issue_items", [])])
        export_rows.append({
            "巡检编号": rec["inspection_code"],
            "门店": _get_store_name(rec["store_id"]),
            "设备ID": rec["equipment_id"],
            "设备名称": _get_equipment_info(rec["equipment_id"]).get("equipment_name", ""),
            "巡检类型": rec["inspection_type"],
            "巡检时间": rec["inspection_time"].strftime("%Y-%m-%d %H:%M"),
            "巡检员": rec.get("inspector", ""),
            "总分": rec["score"],
            "是否通过": "是" if rec["is_pass"] else "否",
            "清洁评分": rec.get("clean_score", ""),
            "综合评级": rec.get("overall_rating", ""),
            "通过项数": f"{pass_items}/{total_items}",
            "问题项": issue_names if issue_names else "无",
        })

    pass_count = sum(1 for r in filtered if r["is_pass"])
    fail_count = len(filtered) - pass_count
    avg_score = round(sum(r["score"] for r in filtered) / len(filtered), 2) if filtered else 0

    return {
        "export_format": format,
        "generated_at": datetime.utcnow(),
        "record_count": len(filtered),
        "summary": {
            "total": len(filtered),
            "pass": pass_count,
            "fail": fail_count,
            "pass_rate": round(pass_count / len(filtered) * 100, 2) if filtered else 0,
            "avg_score": avg_score,
        },
        "columns": list(export_rows[0].keys()) if export_rows else [],
        "rows": export_rows,
        "download_filename": f"巡检记录导出_{datetime.now().strftime('%Y%m%d%H%M%S')}.{format}",
    }
