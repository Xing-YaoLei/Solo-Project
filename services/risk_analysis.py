from datetime import datetime, timedelta

import pandas as pd

from db.queries import (
    get_anomaly_reminders,
    get_appointments,
    get_attendance_summary,
    get_conflict_appointments,
    get_inventory,
    get_last_refresh_time,
    get_reschedule_records,
)


ATTENDANCE_CALIBER_DEFINITION = {
    "到场率": "到场率 = 到场人数 / (到场人数 + 未到场人数 + 迟到人数)，不含已取消预约",
    "到场": "顾客在预约时间段内签到到店，以系统签到记录或收银流水确认",
    "未到场": "预约时间结束后30分钟内未签到，且无收银流水记录",
    "迟到": "超过预约时间15分钟后才签到到店",
    "已取消": "预约开始前主动取消的预约，不计入到场率分母",
    "改约": "原预约时间变更至少一次的记录，含顾客主动改约和门店调整",
    "冲突": "同一技师同一时段被分配给两个及以上有效预约（未取消）",
    "异常标注": "满足以下任一条件：①单日改约≥3次 ②连续2次未到场 ③预约前1h内无库存 ④低评分（≤2分）且未到场",
}


def compute_conflict_trend(store_id: str | None = None, days: int = 30) -> dict:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    if store_id:
        all_conflicts = []
        for i in range(days):
            day = start_date + timedelta(days=i)
            day_conflicts = get_conflict_appointments(store_id, date=day)
            all_conflicts.append({
                "date": day.strftime("%Y-%m-%d"),
                "conflict_count": len(day_conflicts),
            })
    else:
        all_conflicts = []
        for i in range(days):
            day = start_date + timedelta(days=i)
            all_conflicts.append({
                "date": day.strftime("%Y-%m-%d"),
                "conflict_count": 0,
            })

    return {
        "data": all_conflicts,
        "caliber": {
            "冲突数": "同一技师同一时段内存在2个及以上有效（未取消）预约的对数",
        },
    }


def compute_reschedule_composition(store_id: str | None = None, days: int = 30) -> dict:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    df = get_reschedule_records(store_id, start_date=start_date, end_date=end_date)

    if df.empty:
        return {
            "data": [],
            "caliber": {"改约构成": "按改约原因分类统计改约记录数"},
        }

    composition = df.groupby("reschedule_reason").agg(
        count=("id", "count"),
        avg_reschedule_count=("reschedule_count", "mean"),
    ).reset_index()

    composition["avg_reschedule_count"] = composition["avg_reschedule_count"].round(2)

    records = composition.rename(columns={
        "reschedule_reason": "reason",
        "count": "count",
        "avg_reschedule_count": "avg_times",
    }).to_dict("records")

    return {
        "data": records,
        "caliber": {"改约构成": "按改约原因分类统计改约记录数，avg_times为该类原因平均改约次数"},
    }


def compute_attendance_summary(store_id: str | None = None, days: int = 30) -> dict:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    df = get_attendance_summary(store_id, start_date=start_date, end_date=end_date)

    if df.empty:
        return {
            "data": [],
            "daily_rates": [],
            "caliber": ATTENDANCE_CALIBER_DEFINITION,
        }

    pivot = df.pivot_table(index="date", columns="attendance_status", values="count", fill_value=0).reset_index()
    pivot.columns.name = None

    status_cols = [c for c in pivot.columns if c != "date"]
    for col in ["arrived", "not_arrived", "late", "cancelled"]:
        if col not in status_cols:
            pivot[col] = 0

    denominator = pivot["arrived"] + pivot["not_arrived"] + pivot["late"]
    pivot["attendance_rate"] = (pivot["arrived"] / denominator * 100).round(2)

    daily_rates = pivot[["date", "attendance_rate"]].to_dict("records")

    detail_records = df.to_dict("records")

    return {
        "data": detail_records,
        "daily_rates": daily_rates,
        "caliber": ATTENDANCE_CALIBER_DEFINITION,
    }


def compute_anomaly_reminders(store_id: str | None = None) -> dict:
    df = get_anomaly_reminders(store_id)

    if df.empty:
        return {
            "data": [],
            "caliber": {"异常标注": ATTENDANCE_CALIBER_DEFINITION["异常标注"]},
        }

    anomaly_breakdown = df.groupby("anomaly_reason").agg(count=("id", "count")).reset_index()
    anomaly_breakdown = anomaly_breakdown.rename(columns={"anomaly_reason": "reason"})

    records = df.to_dict("records")
    breakdown = anomaly_breakdown.to_dict("records")

    return {
        "data": records,
        "breakdown": breakdown,
        "caliber": {"异常标注": ATTENDANCE_CALIBER_DEFINITION["异常标注"]},
    }


def get_refresh_timestamp() -> str:
    last_time = get_last_refresh_time()
    if last_time:
        return last_time.strftime("%Y-%m-%d %H:%M:%S")
    return "暂无刷新记录"


def check_inventory_conflict(store_id: str, service_item: str, appointment_time: datetime) -> bool:
    inv_df = get_inventory(store_id)
    if inv_df.empty:
        return False

    matching = inv_df[inv_df["service_item"] == service_item]
    if matching.empty:
        return False

    available = (matching["stock_qty"] - matching["reserved_qty"]).sum()
    return available <= 0
