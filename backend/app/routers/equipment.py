from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta
import random
from app.services.mock_data import STORES

router = APIRouter()

EQUIPMENT_TYPES = [
    {"type": "意式咖啡机", "model": "La Marzocco Linea PB"},
    {"type": "意式咖啡机", "model": "Synesso MVP Hydra"},
    {"type": "磨豆机", "model": "Mahlkonig E65S"},
    {"type": "奶泡机", "model": "Melitta Cino Milk"},
    {"type": "制冰机", "model": "Manitowoc RFF-0300A"},
    {"type": "冷藏柜", "model": "Hoshizaki RTC-77MA"},
]

_equipments = []
_eq_id = 1
for store in STORES:
    for eq_type in EQUIPMENT_TYPES[:4]:
        _equipments.append({
            "id": _eq_id,
            "equipment_code": f"{store['store_code']}-EQ{_eq_id:03d}",
            "equipment_name": eq_type["model"],
            "equipment_type": eq_type["type"],
            "store_id": store["id"],
            "store_name": store["store_name"],
            "model": eq_type["model"],
            "manufacturer": random.choice(["La Marzocco", "Mahlkonig", "Synesso", "Nuova Simonelli"]),
            "status": random.choices(["online", "online", "online", "warning", "offline"], weights=[60, 20, 10, 7, 3])[0],
            "clean_risk_score": round(random.uniform(10, 85), 2),
            "last_heartbeat": datetime.utcnow() - timedelta(minutes=random.randint(0, 120)),
            "offline_duration_minutes": random.randint(0, 480),
            "created_at": datetime(2026, 1, 15),
            "updated_at": datetime.utcnow(),
        })
        _eq_id += 1

_status_logs = {}
_base_date = datetime(2026, 5, 1)
for eq in _equipments:
    logs = []
    log_id = 1
    for day in range(30):
        stat_date = _base_date + timedelta(days=day)
        num_logs = random.randint(1, 3)
        for _ in range(num_logs):
            event_time = stat_date.replace(hour=random.randint(0, 23), minute=random.randint(0, 59))
            status = random.choices(["online", "online", "warning", "offline"], weights=[70, 15, 10, 5])[0]
            is_offline_gap = status == "offline" and random.random() < 0.6
            reason = None
            if status == "warning":
                reason = random.choice(["清洁风险评分偏高", "设备温度异常", "压力波动"])
            elif status == "offline":
                reason = random.choice(["网络中断", "设备断电", "系统维护"])
            log = {
                "id": log_id,
                "equipment_id": eq["id"],
                "status": status,
                "event_time": event_time,
                "reason": reason,
                "is_offline_gap": is_offline_gap,
                "gap_start_time": event_time - timedelta(minutes=random.randint(30, 240)) if is_offline_gap else None,
                "gap_end_time": event_time + timedelta(minutes=random.randint(30, 240)) if is_offline_gap else None,
                "sample_data_ref": f"samples/{eq['equipment_code']}/{event_time.strftime('%Y%m%d%H%M')}" if is_offline_gap else None,
                "metrics": {
                    "clean_risk_score": round(random.uniform(10, 90), 2),
                    "temperature_c": round(random.uniform(85, 96), 1),
                    "pressure_bar": round(random.uniform(8.5, 10.5), 2),
                },
                "created_at": event_time,
            }
            logs.append(log)
            log_id += 1
    logs.sort(key=lambda x: x["event_time"], reverse=True)
    _status_logs[eq["id"]] = logs

_sync_delays = []
_sync_id = 1
for day in range(45):
    affected_date = _base_date + timedelta(days=day)
    if random.random() < 0.4:
        for _ in range(random.randint(1, 3)):
            data_type = random.choice(["inventory", "pos", "equipment_clean"])
            source_systems = {
                "inventory": ["WMS系统", "ERP系统", "盘点App"],
                "pos": ["POS收银系统", "订单中台", "支付网关"],
                "equipment_clean": ["IoT设备平台", "数据采集网关", "边缘计算节点"],
            }
            delay_minutes = random.randint(35, 480)
            expected_sync = affected_date.replace(hour=random.randint(1, 5), minute=random.randint(0, 59))
            actual_sync = expected_sync + timedelta(minutes=delay_minutes)
            _sync_delays.append({
                "id": _sync_id,
                "data_type": data_type,
                "source_system": random.choice(source_systems[data_type]),
                "expected_sync_time": expected_sync,
                "actual_sync_time": actual_sync,
                "delay_minutes": delay_minutes,
                "affected_date": affected_date.date(),
                "store_id": random.choice(STORES)["id"],
                "description": f"{data_type}数据延迟同步{delay_minutes}分钟",
                "is_resolved": random.random() < 0.7,
                "created_at": actual_sync,
            })
            _sync_id += 1
_sync_delays.sort(key=lambda x: x["affected_date"], reverse=True)


@router.get("/stores/")
async def get_stores():
    return {
        "code": 0,
        "message": "success",
        "data": STORES,
        "total": len(STORES),
    }


@router.get("/")
async def get_equipments(
    store_id: Optional[int] = Query(None, description="门店ID"),
    status: Optional[str] = Query(None, description="设备状态: online/warning/offline"),
    equipment_type: Optional[str] = Query(None, description="设备类型"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    filtered = _equipments
    if store_id is not None:
        filtered = [eq for eq in filtered if eq["store_id"] == store_id]
    if status:
        filtered = [eq for eq in filtered if eq["status"] == status]
    if equipment_type:
        filtered = [eq for eq in filtered if eq["equipment_type"] == equipment_type]

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


@router.get("/{equipment_id}")
async def get_equipment_detail(equipment_id: int):
    equipment = next((eq for eq in _equipments if eq["id"] == equipment_id), None)
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")

    store = next((s for s in STORES if s["id"] == equipment["store_id"]), None)
    detail = {
        **equipment,
        "store_info": store,
        "specs": {
            "power": "220V/50Hz",
            "weight": f"{random.randint(25, 80)}kg",
            "dimensions": f"{random.randint(400, 800)}x{random.randint(300, 600)}x{random.randint(400, 700)}mm",
            "install_date": (datetime(2026, 1, 1) + timedelta(days=random.randint(0, 100))).strftime("%Y-%m-%d"),
            "warranty_expire": (datetime(2027, 6, 1) + timedelta(days=random.randint(0, 180))).strftime("%Y-%m-%d"),
        },
        "today_metrics": {
            "clean_count": random.randint(3, 12),
            "brew_count": random.randint(50, 300),
            "avg_clean_score": round(random.uniform(75, 98), 1),
            "runtime_hours": round(random.uniform(6, 14), 1),
        },
    }
    return {
        "code": 0,
        "message": "success",
        "data": detail,
    }


@router.get("/{equipment_id}/status-logs")
async def get_equipment_status_logs(
    equipment_id: int,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    if equipment_id not in _status_logs:
        raise HTTPException(status_code=404, detail="设备不存在")

    logs = _status_logs[equipment_id]
    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size
    paged_data = logs[start:end]

    return {
        "code": 0,
        "message": "success",
        "data": paged_data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/sync-delays")
async def get_sync_delays(
    data_type: Optional[str] = Query(None, description="数据类型: inventory/pos/equipment_clean"),
    is_resolved: Optional[bool] = Query(None, description="是否已解决"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    filtered = _sync_delays
    if data_type:
        filtered = [d for d in filtered if d["data_type"] == data_type]
    if is_resolved is not None:
        filtered = [d for d in filtered if d["is_resolved"] == is_resolved]

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
