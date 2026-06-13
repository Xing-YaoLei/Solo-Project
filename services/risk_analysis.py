from datetime import datetime, timedelta

import pandas as pd

from db.queries import (
    get_all_appointments_raw,
    get_attendance_summary,
    get_conflict_appointments,
    get_inventory,
    get_last_refresh_time,
    get_reschedule_records,
)


ATTENDANCE_CALIBER_DEFINITION = {
    "到场率": "到场率 = 到场人数 / (到场人数 + 未到场人数 + 迟到人数)，不含已取消预约。"
             "以收银流水 transaction_type='service' 且 appointment_id 存在作为确认依据",
    "到场": "顾客在预约时间段内签到到店，以系统签到记录或收银流水（transaction_type='service'）确认。"
            "数据来源: 预约表 attendance_status='arrived' AND (收银流水表 transaction_type='service' 存在)",
    "未到场": "预约时间结束后30分钟内未签到，且无收银流水记录（transaction_type='service'）。"
              "数据来源: 预约表 attendance_status='not_arrived' AND 收银流水表中 appointment_id 无匹配",
    "迟到": "超过预约时间15分钟后才签到到店。"
            "数据来源: 预约表 attendance_status='late' 且 cashier 表 transaction_time > appointment_time + 15min",
    "已取消": "预约开始前主动取消的预约，不计入到场率分母。",
    "改约": "原预约时间变更至少一次的记录，含顾客主动改约和门店调整。",
    "冲突": "同一技师同一时段被分配给两个及以上有效预约（未取消），基于预约表 JOIN 检测。",
    "异常_改约过多": "单日改约≥3次（单顾客在单个自然日内 reschedule_count 累计 >=3）",
    "异常_连续未到场": "单顾客连续2次及以上 appointment attendance_status='not_arrived'",
    "异常_库存不足": "预约前1小时内，对应 service_item 的库存 (stock_qty - reserved_qty) <=0，"
                   "数据来源: 库存表 JOIN 预约表 service_item",
    "异常_低评分未到场": "attendance_status='not_arrived' 且 review_records.rating <= 2",
    "异常标注": "满足以下任一条件：①单日改约≥3次 ②连续2次未到场 ③预约前1h内无库存 ④低评分（≤2分）且未到场。"
               "判定时关联预约表、库存表、点评记录表、收银流水表四张数据源。",
}

TRACE_SOURCE_COLUMNS = [
    "cashier_record_id", "cashier_amount", "payment_method",
    "transaction_time", "transaction_type", "cashier_remark",
    "review_rating", "review_content", "reviewed_at",
]


def _detect_too_many_reschedule(df: pd.DataFrame) -> pd.DataFrame:
    """① 单日改约≥3次：单顾客在同一自然日 reschedule_count >= 3"""
    if df.empty:
        return pd.DataFrame()
    df = df.copy()
    df["appt_date"] = pd.to_datetime(df["appointment_time"]).dt.date
    grp = df.groupby(["customer_id", "customer_name", "appt_date"]).agg(
        daily_reschedule_total=("reschedule_count", "sum"),
        appointment_list=("id", lambda x: list(x)),
    ).reset_index()
    bad = grp[grp["daily_reschedule_total"] >= 3].copy()
    bad["anomaly_reason"] = "改约过多(单日改约>=3次)"
    bad["anomaly_detail"] = bad.apply(
        lambda r: f"顾客{r['customer_name']}在{r['appt_date']}当日共改约{r['daily_reschedule_total']}次",
        axis=1,
    )
    return bad


def _detect_consecutive_not_arrived(df: pd.DataFrame) -> pd.DataFrame:
    """② 连续未到场：按 customer_id 排序，若有连续 2+ 条 attendance_status='not_arrived'"""
    if df.empty:
        return pd.DataFrame()
    df = df.copy()
    df = df.sort_values(["customer_id", "appointment_time"]).reset_index(drop=True)
    hits = []
    for cid, grp in df.groupby("customer_id"):
        grp = grp.reset_index(drop=True)
        streak = 0
        first_idx = -1
        for i, row in grp.iterrows():
            status = str(row.get("attendance_status") or "")
            if status == "not_arrived":
                if streak == 0:
                    first_idx = i
                streak += 1
            else:
                if streak >= 2:
                    start = grp.iloc[first_idx]
                    end = grp.iloc[i - 1]
                    hits.append({
                        "customer_id": cid,
                        "customer_name": start.get("customer_name"),
                        "anomaly_reason": "连续未到场(>=2次)",
                        "anomaly_detail": (
                            f"顾客{start.get('customer_name')}从"
                            f"{pd.to_datetime(start['appointment_time']).strftime('%Y-%m-%d %H:%M')}到"
                            f"{pd.to_datetime(end['appointment_time']).strftime('%Y-%m-%d %H:%M')}"
                            f"连续{streak}次未到场"
                        ),
                        "appointment_ids": list(grp.loc[first_idx : i - 1, "id"].astype(int).tolist()),
                        "appointment_id": int(grp.iloc[first_idx]["id"]),
                        "service_item": start.get("service_item"),
                        "appointment_time": start.get("appointment_time"),
                        "reschedule_count": int(start.get("reschedule_count") or 0),
                        "attendance_status": start.get("attendance_status"),
                    })
                streak = 0
                first_idx = -1
        if streak >= 2:
            start = grp.iloc[first_idx]
            end = grp.iloc[-1]
            hits.append({
                "customer_id": cid,
                "customer_name": start.get("customer_name"),
                "anomaly_reason": "连续未到场(>=2次)",
                "anomaly_detail": (
                    f"顾客{start.get('customer_name')}从"
                    f"{pd.to_datetime(start['appointment_time']).strftime('%Y-%m-%d %H:%M')}到"
                    f"{pd.to_datetime(end['appointment_time']).strftime('%Y-%m-%d %H:%M')}"
                    f"连续{streak}次未到场"
                ),
                "appointment_ids": list(grp.loc[first_idx :, "id"].astype(int).tolist()),
                "appointment_id": int(grp.iloc[first_idx]["id"]),
                "service_item": start.get("service_item"),
                "appointment_time": start.get("appointment_time"),
                "reschedule_count": int(start.get("reschedule_count") or 0),
                "attendance_status": start.get("attendance_status"),
            })
    return pd.DataFrame(hits)


def _detect_inventory_shortage(df: pd.DataFrame, inv_df: pd.DataFrame, now: datetime) -> pd.DataFrame:
    """③ 库存不足：预约前1小时内，对应 service_item 的 (stock_qty - reserved_qty) <= 0"""
    if df.empty or inv_df.empty:
        return pd.DataFrame()
    df = df.copy()
    df["appointment_time"] = pd.to_datetime(df["appointment_time"])
    window_start = now
    window_end = now + timedelta(hours=1)
    upcoming = df[
        (df["appointment_time"] >= window_start)
        & (df["appointment_time"] <= window_end)
        & (df["status"] != "cancelled")
    ].copy()
    if upcoming.empty:
        return pd.DataFrame()

    inv_df = inv_df.copy()
    inv_df["available"] = inv_df["stock_qty"].fillna(0) - inv_df["reserved_qty"].fillna(0)
    shortage_items = set(inv_df[inv_df["available"] <= 0]["service_item"].tolist())

    hits = []
    for _, row in upcoming.iterrows():
        si = row.get("service_item")
        if si in shortage_items:
            hits.append({
                "customer_id": row.get("customer_id"),
                "customer_name": row.get("customer_name"),
                "anomaly_reason": "库存不足(预约前1h内无库存)",
                "anomaly_detail": (
                    f"顾客{row.get('customer_name')}将于{row['appointment_time'].strftime('%Y-%m-%d %H:%M')}"
                    f"预约服务【{si}】，但库存表显示可用数量<=0"
                ),
                "appointment_id": int(row.get("id")),
                "service_item": si,
                "appointment_time": row.get("appointment_time"),
                "reschedule_count": int(row.get("reschedule_count") or 0),
                "attendance_status": row.get("attendance_status"),
            })
    return pd.DataFrame(hits)


def _detect_low_rate_not_arrived(df: pd.DataFrame) -> pd.DataFrame:
    """④ 低评分未到场：attendance_status='not_arrived' AND review_rating <= 2"""
    if df.empty:
        return pd.DataFrame()
    df = df.copy()
    mask = (
        (df["attendance_status"] == "not_arrived")
        & (df["review_rating"].notna())
        & (df["review_rating"].astype(int) <= 2)
    )
    bad = df[mask].copy()
    if bad.empty:
        return pd.DataFrame()
    bad["anomaly_reason"] = "低评分未到场(评分<=2且未到场)"
    bad["anomaly_detail"] = bad.apply(
        lambda r: f"顾客{r.get('customer_name')}评分{r['review_rating']}且未到场，点评内容: {str(r.get('review_content') or '')[:40]}",
        axis=1,
    )
    bad["appointment_id"] = bad["id"].astype(int)
    return bad


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
            "冲突数": "同一技师同一时段内存在2个及以上有效（未取消）预约的对数，数据来源: appointments 自连接",
        },
    }


def compute_reschedule_composition(store_id: str | None = None, days: int = 30) -> dict:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    df = get_reschedule_records(store_id, start_date=start_date, end_date=end_date)

    if df.empty:
        return {
            "data": [],
            "caliber": {"改约构成": "按改约原因分类统计改约记录数，数据来源: appointments.reschedule_reason"},
        }

    df["reschedule_reason"] = df["reschedule_reason"].fillna("未注明")

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
    with pd.option_context("mode.chained_assignment", None):
        pivot["attendance_rate"] = 0.0
        valid = denominator > 0
        pivot.loc[valid, "attendance_rate"] = (
            (pivot.loc[valid, "arrived"] / denominator[valid]) * 100
        ).round(2)

    daily_rates = pivot[["date", "attendance_rate"]].to_dict("records")
    detail_records = df.to_dict("records")

    return {
        "data": detail_records,
        "daily_rates": daily_rates,
        "caliber": ATTENDANCE_CALIBER_DEFINITION,
    }


def compute_anomaly_reminders(store_id: str | None = None) -> dict:
    if not store_id:
        return {"data": [], "breakdown": [], "caliber": {"异常标注": ATTENDANCE_CALIBER_DEFINITION["异常标注"]}}

    df = get_all_appointments_raw(store_id)
    inv_df = get_inventory(store_id)

    anomalies_list = []

    r1 = _detect_too_many_reschedule(df)
    if not r1.empty:
        anomalies_list.append(r1)

    r2 = _detect_consecutive_not_arrived(df)
    if not r2.empty:
        anomalies_list.append(r2)

    r3 = _detect_inventory_shortage(df, inv_df, datetime.utcnow())
    if not r3.empty:
        anomalies_list.append(r3)

    r4 = _detect_low_rate_not_arrived(df)
    if not r4.empty:
        anomalies_list.append(r4)

    if not anomalies_list:
        return {"data": [], "breakdown": [], "caliber": {"异常标注": ATTENDANCE_CALIBER_DEFINITION["异常标注"]}}

    merged = pd.concat(anomalies_list, ignore_index=True, sort=False)

    trace_cols = [
        "cashier_record_id", "cashier_amount", "payment_method",
        "transaction_time", "transaction_type", "cashier_remark",
        "review_rating", "review_content", "reviewed_at",
    ]
    for c in trace_cols:
        if c not in merged.columns and c in df.columns:
            if "appointment_id" in merged.columns:
                lookup = df[df["id"].notna()].drop_duplicates("id").set_index("id")
                merged[c] = merged["appointment_id"].map(
                    lambda aid: lookup.at[aid, c] if isinstance(aid, (int, float)) and aid in lookup.index else None
                )
            else:
                merged[c] = None

    merged = merged.where(pd.notna(merged), None)

    records = []
    for _, row in merged.iterrows():
        rec = row.to_dict()
        appt_id = rec.get("appointment_id")
        if pd.isna(appt_id) or appt_id is None:
            alist = rec.get("appointment_list")
            if alist and len(alist):
                rec["appointment_id"] = alist[0]
        records.append(rec)

    breakdown = (
        merged.groupby("anomaly_reason")
        .size()
        .reset_index(name="count")
        .rename(columns={"anomaly_reason": "reason"})
        .to_dict("records")
    )

    return {
        "data": records,
        "breakdown": breakdown,
        "caliber": {
            "异常标注": ATTENDANCE_CALIBER_DEFINITION["异常标注"],
            "异常_改约过多": ATTENDANCE_CALIBER_DEFINITION["异常_改约过多"],
            "异常_连续未到场": ATTENDANCE_CALIBER_DEFINITION["异常_连续未到场"],
            "异常_库存不足": ATTENDANCE_CALIBER_DEFINITION["异常_库存不足"],
            "异常_低评分未到场": ATTENDANCE_CALIBER_DEFINITION["异常_低评分未到场"],
        },
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
