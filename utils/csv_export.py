import csv
import io
from datetime import datetime

from services.risk_analysis import ATTENDANCE_CALIBER_DEFINITION


CALIBER_SHEET_HEADER = "指标定义说明（到场率口径）"
EXPORT_META = {
    "导出时间": lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
    "数据来源": "预约记录表(appointments) + 收银流水表(cashier_records) + 点评记录表(review_records) + 库存表(inventory)",
    "到场率口径": ATTENDANCE_CALIBER_DEFINITION["到场率"],
    "可追溯字段说明": "cashier_record_id -> 收银流水表主键; cashier_amount -> 交易金额; "
                     "payment_method -> 支付方式; transaction_time -> 交易时间; "
                     "review_rating -> 点评评分; reviewed_at -> 点评时间",
}


def _build_caliber_rows() -> list[list[str]]:
    rows = [[CALIBER_SHEET_HEADER, ""]]
    for key, value in ATTENDANCE_CALIBER_DEFINITION.items():
        rows.append([key, value])
    rows.append([])
    rows.append(["导出元数据", ""])
    for meta_key, meta_value in EXPORT_META.items():
        rows.append([meta_key, meta_value() if callable(meta_value) else meta_value])
    return rows


CASHIER_TRACE_COLS = [
    "预约ID(appointment_id)",
    "收银流水ID(cashier_record_id)",
    "交易金额(cashier_amount)",
    "支付方式(payment_method)",
    "交易时间(transaction_time)",
    "交易类型(transaction_type)",
    "点评评分(review_rating)",
    "点评时间(reviewed_at)",
]


def _extract_cashier_trace(row: dict) -> list:
    return [
        row.get("appointment_id", ""),
        row.get("cashier_record_id", ""),
        row.get("cashier_amount", ""),
        row.get("payment_method", ""),
        row.get("transaction_time", ""),
        row.get("transaction_type", ""),
        row.get("review_rating", ""),
        row.get("reviewed_at", ""),
    ]


def export_conflict_trend_csv(data: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["冲突检测趋势"])
    writer.writerow([])
    writer.writerow(["日期", "冲突对数", f"口径: {caliber.get('冲突数', '')}"])

    for row in data:
        writer.writerow([row.get("date", ""), row.get("conflict_count", 0), ""])

    writer.writerow([])
    writer.writerow(["关联门店预约明细(按日期)：可通过 date JOIN appointments.appointment_time::date 追溯"])
    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_reschedule_composition_csv(data: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["改约记录构成"])
    writer.writerow([])
    writer.writerow(["改约原因", "记录数", "平均改约次数", f"口径: {caliber.get('改约构成', '')}"])

    for row in data:
        writer.writerow([
            row.get("reason", ""),
            row.get("count", 0),
            row.get("avg_times", 0),
            "",
        ])

    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_attendance_detail_csv(
    data: list[dict],
    daily_rates: list[dict],
    caliber: dict,
    trace_rows: list[dict] | None = None,
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["到场状态明细"])
    writer.writerow([])

    writer.writerow(["--- 到场状态分布 ---"])
    writer.writerow(["日期", "到场状态", "人数", "追溯方式"])
    for row in data:
        writer.writerow([
            row.get("date", ""),
            row.get("attendance_status", ""),
            row.get("count", 0),
            " cashier_records.appointment_id=appointments.id; transaction_type='service'视为已到场",
        ])

    writer.writerow([])
    writer.writerow(["--- 到场率趋势 ---"])
    writer.writerow(["日期", "到场率(%)", "到场率口径说明"])
    for row in daily_rates:
        writer.writerow([
            row.get("date", ""),
            row.get("attendance_rate", 0),
            " 到场率=到场/(到场+未到场+迟到)，已取消不计入分母；以收银流水(service类型)为确认依据",
        ])

    if trace_rows:
        writer.writerow([])
        writer.writerow(["--- 收银流水可追溯明细(每条预约对应) ---"])
        writer.writerow(CASHIER_TRACE_COLS)
        for tr in trace_rows:
            writer.writerow(_extract_cashier_trace(tr))

    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_anomaly_reminder_csv(
    data: list[dict],
    breakdown: list[dict],
    caliber: dict,
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["提醒名单异常标注"])
    writer.writerow([])

    writer.writerow(["--- 异常原因分布 ---"])
    writer.writerow(["异常原因", "数量"])
    for row in breakdown:
        writer.writerow([row.get("reason", ""), row.get("count", 0)])
    writer.writerow([])

    writer.writerow(["--- 异常名单明细(含收银流水追溯字段) ---"])
    header = [
        "顾客", "服务项目", "预约时间", "异常原因", "异常详情",
        "改约次数", "到场状态",
        *CASHIER_TRACE_COLS,
    ]
    writer.writerow(header)

    for row in data:
        writer.writerow([
            row.get("customer_name", ""),
            row.get("service_item", ""),
            str(row.get("appointment_time", "")),
            row.get("anomaly_reason", ""),
            row.get("anomaly_detail", ""),
            row.get("reschedule_count", 0),
            row.get("attendance_status", ""),
            *_extract_cashier_trace(row),
        ])

    writer.writerow([])
    writer.writerow(["--- 追溯说明 ---"])
    writer.writerow(["字段", "追溯方式"])
    writer.writerow(["cashier_record_id", "SELECT * FROM cashier_records WHERE id = <cashier_record_id>"])
    writer.writerow(["appointment_id", "SELECT * FROM appointments WHERE id = <appointment_id>"])
    writer.writerow(["review_rating", "SELECT * FROM review_records WHERE appointment_id = <appointment_id>"])
    writer.writerow(["库存不足", "SELECT * FROM inventory WHERE store_id=... AND service_item=... AND stock_qty-reserved_qty<=0"])
    writer.writerow([])
    for key, val in caliber.items():
        writer.writerow([key, val])
    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_full_report_csv(
    conflict_data: list[dict],
    conflict_caliber: dict,
    reschedule_data: list[dict],
    reschedule_caliber: dict,
    attendance_data: list[dict],
    attendance_rates: list[dict],
    attendance_caliber: dict,
    anomaly_data: list[dict],
    anomaly_breakdown: list[dict],
    anomaly_caliber: dict,
    attendance_trace: list[dict] | None = None,
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["美业门店顾客预约风险监测 - 完整报告(含指标追溯)"])
    writer.writerow([f"导出时间: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 冲突检测趋势 " + "=" * 20])
    writer.writerow(["日期", "冲突对数", f"口径: {conflict_caliber.get('冲突数', '')}"])
    for row in conflict_data:
        writer.writerow([row.get("date", ""), row.get("conflict_count", 0), ""])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 改约记录构成 " + "=" * 20])
    writer.writerow(["改约原因", "记录数", "平均改约次数", f"口径: {reschedule_caliber.get('改约构成', '')}"])
    for row in reschedule_data:
        writer.writerow([row.get("reason", ""), row.get("count", 0), row.get("avg_times", 0), ""])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 到场状态明细 " + "=" * 20])
    writer.writerow(["日期", "到场状态", "人数", "追溯方式"])
    for row in attendance_data:
        writer.writerow([
            row.get("date", ""),
            row.get("attendance_status", ""),
            row.get("count", 0),
            "JOIN cashier_records on appointment_id，transaction_type='service'视为已到场",
        ])
    writer.writerow([])
    writer.writerow(["日期", "到场率(%)", "到场率口径"])
    for row in attendance_rates:
        writer.writerow([row.get("date", ""), row.get("attendance_rate", 0), attendance_caliber.get("到场率", "")])
    writer.writerow([])

    if attendance_trace:
        writer.writerow(["--- 到场指标 → 收银流水可追溯明细 ---"])
        writer.writerow(CASHIER_TRACE_COLS)
        for tr in attendance_trace:
            writer.writerow(_extract_cashier_trace(tr))
        writer.writerow([])

    writer.writerow(["=" * 20 + " 提醒名单异常标注 " + "=" * 20])
    writer.writerow(["异常原因", "数量"])
    for row in anomaly_breakdown:
        writer.writerow([row.get("reason", ""), row.get("count", 0)])
    writer.writerow([])

    header = [
        "顾客", "服务项目", "预约时间", "异常原因", "异常详情",
        "改约次数", "到场状态",
        *CASHIER_TRACE_COLS,
    ]
    writer.writerow(header)
    for row in anomaly_data:
        writer.writerow([
            row.get("customer_name", ""),
            row.get("service_item", ""),
            str(row.get("appointment_time", "")),
            row.get("anomaly_reason", ""),
            row.get("anomaly_detail", ""),
            row.get("reschedule_count", 0),
            row.get("attendance_status", ""),
            *_extract_cashier_trace(row),
        ])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 指标定义说明（到场率口径） " + "=" * 20])
    writer.writerow(["指标名称", "口径定义 / 追溯路径"])
    for key, value in ATTENDANCE_CALIBER_DEFINITION.items():
        writer.writerow([key, value])
    writer.writerow([])
    writer.writerow(["导出元数据", ""])
    for meta_key, meta_value in EXPORT_META.items():
        writer.writerow([meta_key, meta_value() if callable(meta_value) else meta_value])
    writer.writerow([])
    writer.writerow(["SQL 追溯示例", ""])
    writer.writerow(["指标", "SQL"])
    writer.writerow([
        "已到场确认",
        "SELECT * FROM cashier_records cr JOIN appointments a ON cr.appointment_id=a.id "
        "WHERE a.id=<appointment_id> AND cr.transaction_type='service'",
    ])
    writer.writerow([
        "未到场确认",
        "SELECT a.* FROM appointments a LEFT JOIN cashier_records cr ON cr.appointment_id=a.id "
        "WHERE a.id=<appointment_id> AND cr.id IS NULL AND a.attendance_status='not_arrived'",
    ])
    writer.writerow([
        "库存不足",
        "SELECT * FROM inventory WHERE service_item='<service_item>' "
        "AND (stock_qty-reserved_qty)<=0",
    ])

    return output.getvalue()
