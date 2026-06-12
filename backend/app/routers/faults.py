import random
from fastapi import APIRouter, Query, HTTPException, Body
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


def _format_dt(dt):
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)


def _format_date(dt):
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d")
    return str(dt)[:10]


@router.get("/overview")
async def get_fault_overview():
    mock = get_mock_data()
    faults = mock["fault_records"]
    stores = {s["id"]: s for s in mock["stores"]}
    equipments = {e["id"]: e for e in mock["equipments"]}

    total_count = len(faults)

    by_status = {}
    by_severity = {}
    by_type = {}
    cleaning_related_count = 0

    for f in faults:
        status = f["status"]
        by_status[status] = by_status.get(status, 0) + 1

        severity = f["severity"]
        by_severity[severity] = by_severity.get(severity, 0) + 1

        ftype = f["fault_type"]
        by_type[ftype] = by_type.get(ftype, 0) + 1

        if f.get("is_cleaning_related"):
            cleaning_related_count += 1

    base_date = datetime(2026, 5, 1)
    trend_days = 30
    trend = []
    for i in range(trend_days):
        day = base_date + timedelta(days=15 + i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)

        day_faults = [
            f for f in faults
            if isinstance(f["fault_time"], datetime) and day_start <= f["fault_time"] <= day_end
        ]

        day_stats = {
            "date": _format_date(day),
            "total_count": len(day_faults),
            "by_severity": {},
            "by_status": {},
            "cleaning_related_count": sum(1 for f in day_faults if f.get("is_cleaning_related")),
        }

        for f in day_faults:
            sev = f["severity"]
            day_stats["by_severity"][sev] = day_stats["by_severity"].get(sev, 0) + 1
            st = f["status"]
            day_stats["by_status"][st] = day_stats["by_status"].get(st, 0) + 1

        for sev in ["critical", "high", "medium", "low"]:
            day_stats["by_severity"].setdefault(sev, 0)
        for st in ["pending", "processing", "resolved", "closed"]:
            day_stats["by_status"].setdefault(st, 0)

        trend.append(day_stats)

    avg_resolve_hours = 0
    resolved = [f for f in faults if f.get("resolved_time") and f.get("fault_time")]
    if resolved:
        total_hours = sum(
            (f["resolved_time"] - f["fault_time"]).total_seconds() / 3600
            for f in resolved
        )
        avg_resolve_hours = round(total_hours / len(resolved), 2)

    total_downtime = sum(f.get("downtime_minutes", 0) or 0 for f in faults)
    total_maintenance_cost = sum(f.get("maintenance_cost", 0) or 0 for f in faults)

    overview = {
        "total_count": total_count,
        "pending_count": by_status.get("pending", 0),
        "processing_count": by_status.get("processing", 0),
        "resolved_count": by_status.get("resolved", 0),
        "closed_count": by_status.get("closed", 0),
        "cleaning_related_count": cleaning_related_count,
        "cleaning_related_rate": round(cleaning_related_count / max(total_count, 1) * 100, 2),
        "avg_resolve_hours": avg_resolve_hours,
        "total_downtime_minutes": total_downtime,
        "total_maintenance_cost": round(total_maintenance_cost, 2),
        "by_severity": {
            "critical": by_severity.get("critical", 0),
            "high": by_severity.get("high", 0),
            "medium": by_severity.get("medium", 0),
            "low": by_severity.get("low", 0),
        },
        "by_type": dict(sorted(by_type.items(), key=lambda x: x[1], reverse=True)),
        "by_status": {
            "pending": by_status.get("pending", 0),
            "processing": by_status.get("processing", 0),
            "resolved": by_status.get("resolved", 0),
            "closed": by_status.get("closed", 0),
        },
        "trend": trend,
    }

    return {
        "code": 0,
        "message": "success",
        "data": overview,
    }


@router.get("/")
async def get_fault_list(
    store_id: Optional[int] = Query(None, description="门店ID"),
    equipment_id: Optional[int] = Query(None, description="设备ID"),
    status: Optional[str] = Query(None, description="状态：pending/processing/resolved/closed"),
    severity: Optional[str] = Query(None, description="严重程度：low/medium/high/critical"),
    fault_type: Optional[str] = Query(None, description="故障类型"),
    fault_category: Optional[str] = Query(None, description="故障分类：清洁相关/机械故障"),
    is_cleaning_related: Optional[bool] = Query(None, description="是否清洁相关"),
    start_date: Optional[str] = Query(None, description="故障开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="故障结束日期 YYYY-MM-DD"),
    detected_by: Optional[str] = Query(None, description="检测人"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    mock = get_mock_data()
    faults = mock["fault_records"]
    stores = {s["id"]: s for s in mock["stores"]}
    equipments = {e["id"]: e for e in mock["equipments"]}
    tasks = mock["rectification_tasks"]
    tasks_by_fault: Dict[int, List[Any]] = {}
    for t in tasks:
        fid = t.get("fault_id")
        if fid:
            if fid not in tasks_by_fault:
                tasks_by_fault[fid] = []
            tasks_by_fault[fid].append(t)

    filtered = faults
    if store_id:
        filtered = [f for f in filtered if f["store_id"] == store_id]
    if equipment_id:
        filtered = [f for f in filtered if f["equipment_id"] == equipment_id]
    if status:
        filtered = [f for f in filtered if f["status"] == status]
    if severity:
        filtered = [f for f in filtered if f["severity"] == severity]
    if fault_type:
        filtered = [f for f in filtered if fault_type in f["fault_type"]]
    if fault_category:
        filtered = [f for f in filtered if f.get("fault_category") == fault_category]
    if is_cleaning_related is not None:
        filtered = [f for f in filtered if f.get("is_cleaning_related") == is_cleaning_related]
    if detected_by:
        filtered = [f for f in filtered if detected_by in (f.get("detected_by") or "")]
    if start_date:
        sd = datetime.strptime(start_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() >= sd.date()]
    if end_date:
        ed = datetime.strptime(end_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() <= ed.date()]

    total = len(filtered)
    offset = (page - 1) * page_size
    paged = sorted(filtered, key=lambda x: x["fault_time"], reverse=True)[offset:offset + page_size]

    result = []
    for f in paged:
        store = stores.get(f["store_id"], {})
        eq = equipments.get(f["equipment_id"], {})
        fault_tasks = tasks_by_fault.get(f["id"], [])
        result.append({
            "id": f["id"],
            "fault_code": f["fault_code"],
            "equipment_id": f["equipment_id"],
            "equipment_code": eq.get("equipment_code", ""),
            "equipment_name": eq.get("equipment_name", ""),
            "equipment_type": eq.get("equipment_type", ""),
            "store_id": f["store_id"],
            "store_code": store.get("store_code", ""),
            "store_name": store.get("store_name", ""),
            "region": store.get("region", ""),
            "city": store.get("city", ""),
            "fault_type": f["fault_type"],
            "fault_category": f.get("fault_category", ""),
            "severity": f["severity"],
            "severity_name": {
                "critical": "紧急",
                "high": "高",
                "medium": "中",
                "low": "低",
            }.get(f["severity"], f["severity"]),
            "fault_time": _format_dt(f["fault_time"]),
            "detected_by": f.get("detected_by", ""),
            "description": f.get("description", ""),
            "is_cleaning_related": f.get("is_cleaning_related", False),
            "status": f["status"],
            "status_name": {
                "pending": "待处理",
                "processing": "处理中",
                "resolved": "已解决",
                "closed": "已关闭",
            }.get(f["status"], f["status"]),
            "resolved_time": _format_dt(f.get("resolved_time")),
            "resolved_by": f.get("resolved_by"),
            "downtime_minutes": f.get("downtime_minutes", 0),
            "maintenance_cost": round(f.get("maintenance_cost", 0) or 0, 2),
            "task_count": len(fault_tasks),
            "has_task": len(fault_tasks) > 0,
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


@router.get("/{fault_id}")
async def get_fault_detail(fault_id: int):
    mock = get_mock_data()
    faults = mock["fault_records"]
    stores = {s["id"]: s for s in mock["stores"]}
    equipments = {e["id"]: e for e in mock["equipments"]}
    tasks = mock["rectification_tasks"]
    rechecks = mock["recheck_results"]

    fault = None
    for f in faults:
        if f["id"] == fault_id:
            fault = f
            break

    if not fault:
        raise HTTPException(status_code=404, detail=f"故障记录ID {fault_id} 不存在")

    store = stores.get(fault["store_id"], {})
    eq = equipments.get(fault["equipment_id"], {})

    fault_tasks = [t for t in tasks if t.get("fault_id") == fault_id]
    task_ids = [t["id"] for t in fault_tasks]
    fault_rechecks = [r for r in rechecks if r.get("task_id") in task_ids]

    resolve_duration_hours = None
    if fault.get("resolved_time") and fault.get("fault_time"):
        resolve_duration_hours = round(
            (fault["resolved_time"] - fault["fault_time"]).total_seconds() / 3600, 2
        )

    detail = {
        "id": fault["id"],
        "fault_code": fault["fault_code"],
        "equipment": {
            "id": eq.get("id"),
            "equipment_code": eq.get("equipment_code", ""),
            "equipment_name": eq.get("equipment_name", ""),
            "equipment_type": eq.get("equipment_type", ""),
            "model": eq.get("model", ""),
            "manufacturer": eq.get("manufacturer", ""),
            "status": eq.get("status", ""),
        },
        "store": {
            "id": store.get("id"),
            "store_code": store.get("store_code", ""),
            "store_name": store.get("store_name", ""),
            "region": store.get("region", ""),
            "city": store.get("city", ""),
        },
        "fault_type": fault["fault_type"],
        "fault_category": fault.get("fault_category", ""),
        "severity": fault["severity"],
        "severity_name": {
            "critical": "紧急",
            "high": "高",
            "medium": "中",
            "low": "低",
        }.get(fault["severity"], fault["severity"]),
        "fault_time": _format_dt(fault["fault_time"]),
        "detected_by": fault.get("detected_by", ""),
        "description": fault.get("description", ""),
        "root_cause": fault.get("root_cause", ""),
        "impact_assessment": fault.get("impact_assessment", ""),
        "is_cleaning_related": fault.get("is_cleaning_related", False),
        "status": fault["status"],
        "status_name": {
            "pending": "待处理",
            "processing": "处理中",
            "resolved": "已解决",
            "closed": "已关闭",
        }.get(fault["status"], fault["status"]),
        "resolved_time": _format_dt(fault.get("resolved_time")),
        "resolved_by": fault.get("resolved_by"),
        "resolution": fault.get("resolution"),
        "resolve_duration_hours": resolve_duration_hours,
        "downtime_minutes": fault.get("downtime_minutes", 0),
        "maintenance_cost": round(fault.get("maintenance_cost", 0) or 0, 2),
        "related_data": fault.get("related_data", {}),
        "tasks": [
            {
                "id": t["id"],
                "task_code": t["task_code"],
                "task_type": t["task_type"],
                "priority": t["priority"],
                "title": t["title"],
                "status": t["status"],
                "status_name": {
                    "pending": "待执行",
                    "in_progress": "进行中",
                    "completed": "已完成",
                    "failed": "失败",
                    "closed": "已关闭",
                }.get(t["status"], t["status"]),
                "progress": t.get("progress", 0),
                "deadline": _format_dt(t["deadline"]),
                "assignee": t.get("assignee", ""),
                "recheck_count": sum(1 for r in fault_rechecks if r["task_id"] == t["id"]),
            }
            for t in fault_tasks
        ],
        "rechecks": [
            {
                "id": r["id"],
                "recheck_code": r["recheck_code"],
                "task_id": r["task_id"],
                "recheck_time": _format_dt(r["recheck_time"]),
                "rechecker": r.get("rechecker", ""),
                "result": r["result"],
                "result_name": "合格" if r["result"] == "pass" else "不合格",
                "score": r.get("score"),
                "description": r.get("description", ""),
                "conclusion": r.get("conclusion", ""),
            }
            for r in fault_rechecks
        ],
        "created_at": _format_dt(fault.get("created_at")),
        "updated_at": _format_dt(fault.get("updated_at")) if fault.get("updated_at") else _format_dt(fault.get("created_at")),
    }

    return {
        "code": 0,
        "message": "success",
        "data": detail,
    }


@router.post("/{fault_id}/resolve")
async def resolve_fault(
    fault_id: int,
    body: Dict[str, Any] = Body(default={}),
):
    mock = get_mock_data()
    faults = mock["fault_records"]

    fault = None
    fault_idx = -1
    for idx, f in enumerate(faults):
        if f["id"] == fault_id:
            fault = f
            fault_idx = idx
            break

    if not fault:
        raise HTTPException(status_code=404, detail=f"故障记录ID {fault_id} 不存在")

    resolved_by = body.get("resolved_by", "张三")
    resolution = body.get("resolution", "已完成深度清洁和部件检查，设备运行正常")
    downtime_minutes = body.get("downtime_minutes", random.randint(60, 240))
    maintenance_cost = body.get("maintenance_cost", round(random.uniform(100, 800), 2))

    now = datetime.now()

    faults[fault_idx]["status"] = "resolved"
    faults[fault_idx]["resolved_time"] = now
    faults[fault_idx]["resolved_by"] = resolved_by
    faults[fault_idx]["resolution"] = resolution
    faults[fault_idx]["downtime_minutes"] = downtime_minutes
    faults[fault_idx]["maintenance_cost"] = maintenance_cost

    updated = faults[fault_idx]

    return {
        "code": 0,
        "message": "故障已标记为已解决",
        "data": {
            "id": updated["id"],
            "fault_code": updated["fault_code"],
            "status": updated["status"],
            "status_name": "已解决",
            "resolved_time": _format_dt(updated["resolved_time"]),
            "resolved_by": updated["resolved_by"],
            "resolution": updated["resolution"],
            "downtime_minutes": updated["downtime_minutes"],
            "maintenance_cost": round(updated["maintenance_cost"], 2),
        },
    }


@router.get("/stats/by-type")
async def get_fault_stats_by_type(
    store_id: Optional[int] = Query(None, description="门店ID"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    is_cleaning_related: Optional[bool] = Query(None, description="是否清洁相关"),
):
    mock = get_mock_data()
    faults = mock["fault_records"]
    stores = {s["id"]: s for s in mock["stores"]}

    filtered = faults
    if store_id:
        filtered = [f for f in filtered if f["store_id"] == store_id]
    if is_cleaning_related is not None:
        filtered = [f for f in filtered if f.get("is_cleaning_related") == is_cleaning_related]
    if start_date:
        sd = datetime.strptime(start_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() >= sd.date()]
    if end_date:
        ed = datetime.strptime(end_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() <= ed.date()]

    type_stats: Dict[str, Dict[str, Any]] = {}

    for f in filtered:
        ftype = f["fault_type"]
        if ftype not in type_stats:
            type_stats[ftype] = {
                "fault_type": ftype,
                "fault_category": f.get("fault_category", ""),
                "is_cleaning_related": f.get("is_cleaning_related", False),
                "total_count": 0,
                "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
                "by_status": {"pending": 0, "processing": 0, "resolved": 0, "closed": 0},
                "store_distribution": {},
                "total_downtime_minutes": 0,
                "total_maintenance_cost": 0.0,
                "avg_resolve_hours": 0,
                "_resolve_times": [],
            }

        ts = type_stats[ftype]
        ts["total_count"] += 1

        sev = f["severity"]
        ts["by_severity"][sev] = ts["by_severity"].get(sev, 0) + 1

        st = f["status"]
        ts["by_status"][st] = ts["by_status"].get(st, 0) + 1

        sid = f["store_id"]
        store = stores.get(sid, {})
        sname = store.get("store_name", f"门店{sid}")
        ts["store_distribution"][sname] = ts["store_distribution"].get(sname, 0) + 1

        ts["total_downtime_minutes"] += f.get("downtime_minutes", 0) or 0
        ts["total_maintenance_cost"] += f.get("maintenance_cost", 0) or 0

        if f.get("resolved_time") and f.get("fault_time"):
            hours = (f["resolved_time"] - f["fault_time"]).total_seconds() / 3600
            ts["_resolve_times"].append(hours)

    result_list = []
    for ts in type_stats.values():
        if ts["_resolve_times"]:
            ts["avg_resolve_hours"] = round(sum(ts["_resolve_times"]) / len(ts["_resolve_times"]), 2)
        del ts["_resolve_times"]
        ts["total_maintenance_cost"] = round(ts["total_maintenance_cost"], 2)
        result_list.append(ts)

    result_list.sort(key=lambda x: x["total_count"], reverse=True)

    return {
        "code": 0,
        "message": "success",
        "data": {
            "total_types": len(result_list),
            "total_faults": len(filtered),
            "stats": result_list,
        },
    }


@router.get("/stats/by-store")
async def get_fault_stats_by_store(
    region: Optional[str] = Query(None, description="区域"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    is_cleaning_related: Optional[bool] = Query(None, description="是否清洁相关"),
):
    mock = get_mock_data()
    faults = mock["fault_records"]
    stores = mock["stores"]

    filtered = faults
    if is_cleaning_related is not None:
        filtered = [f for f in filtered if f.get("is_cleaning_related") == is_cleaning_related]
    if start_date:
        sd = datetime.strptime(start_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() >= sd.date()]
    if end_date:
        ed = datetime.strptime(end_date, "%Y-%m-%d")
        filtered = [f for f in filtered if isinstance(f["fault_time"], datetime) and f["fault_time"].date() <= ed.date()]

    store_stats: Dict[int, Dict[str, Any]] = {}

    for store in stores:
        sid = store["id"]
        if region and store.get("region") != region:
            continue
        store_stats[sid] = {
            "store_id": sid,
            "store_code": store["store_code"],
            "store_name": store["store_name"],
            "region": store.get("region", ""),
            "city": store.get("city", ""),
            "total_count": 0,
            "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "by_status": {"pending": 0, "processing": 0, "resolved": 0, "closed": 0},
            "by_type": {},
            "cleaning_related_count": 0,
            "mechanical_count": 0,
            "total_downtime_minutes": 0,
            "total_maintenance_cost": 0.0,
            "avg_resolve_hours": 0,
            "_resolve_times": [],
        }

    for f in filtered:
        sid = f["store_id"]
        if sid not in store_stats:
            continue

        ss = store_stats[sid]
        ss["total_count"] += 1

        sev = f["severity"]
        ss["by_severity"][sev] = ss["by_severity"].get(sev, 0) + 1

        st = f["status"]
        ss["by_status"][st] = ss["by_status"].get(st, 0) + 1

        ftype = f["fault_type"]
        ss["by_type"][ftype] = ss["by_type"].get(ftype, 0) + 1

        if f.get("is_cleaning_related"):
            ss["cleaning_related_count"] += 1
        else:
            ss["mechanical_count"] += 1

        ss["total_downtime_minutes"] += f.get("downtime_minutes", 0) or 0
        ss["total_maintenance_cost"] += f.get("maintenance_cost", 0) or 0

        if f.get("resolved_time") and f.get("fault_time"):
            hours = (f["resolved_time"] - f["fault_time"]).total_seconds() / 3600
            ss["_resolve_times"].append(hours)

    result_list = []
    for ss in store_stats.values():
        if ss["_resolve_times"]:
            ss["avg_resolve_hours"] = round(sum(ss["_resolve_times"]) / len(ss["_resolve_times"]), 2)
        del ss["_resolve_times"]
        ss["total_maintenance_cost"] = round(ss["total_maintenance_cost"], 2)
        ss["cleaning_related_rate"] = round(
            ss["cleaning_related_count"] / max(ss["total_count"], 1) * 100, 2
        )
        ss["by_type"] = dict(sorted(ss["by_type"].items(), key=lambda x: x[1], reverse=True))
        result_list.append(ss)

    result_list.sort(key=lambda x: x["total_count"], reverse=True)

    region_summary = {}
    for ss in result_list:
        r = ss["region"]
        if r not in region_summary:
            region_summary[r] = {
                "region": r,
                "store_count": 0,
                "total_count": 0,
                "cleaning_related_count": 0,
                "avg_resolve_hours_list": [],
                "total_maintenance_cost": 0,
            }
        rs = region_summary[r]
        rs["store_count"] += 1
        rs["total_count"] += ss["total_count"]
        rs["cleaning_related_count"] += ss["cleaning_related_count"]
        if ss["avg_resolve_hours"] > 0:
            rs["avg_resolve_hours_list"].append(ss["avg_resolve_hours"])
        rs["total_maintenance_cost"] += ss["total_maintenance_cost"]

    region_list = []
    for rs in region_summary.values():
        avg_h = 0
        if rs["avg_resolve_hours_list"]:
            avg_h = round(sum(rs["avg_resolve_hours_list"]) / len(rs["avg_resolve_hours_list"]), 2)
        region_list.append({
            "region": rs["region"],
            "store_count": rs["store_count"],
            "total_count": rs["total_count"],
            "cleaning_related_count": rs["cleaning_related_count"],
            "cleaning_related_rate": round(
                rs["cleaning_related_count"] / max(rs["total_count"], 1) * 100, 2
            ),
            "avg_resolve_hours": avg_h,
            "total_maintenance_cost": round(rs["total_maintenance_cost"], 2),
        })

    return {
        "code": 0,
        "message": "success",
        "data": {
            "total_stores": len(result_list),
            "total_faults": len(filtered),
            "region_summary": region_list,
            "store_details": result_list,
        },
    }
