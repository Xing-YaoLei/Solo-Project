import csv
import io
from datetime import datetime

from services.risk_analysis import ATTENDANCE_CALIBER_DEFINITION


CALIBER_SHEET_HEADER = "指标定义说明（到场率口径）"
CALIBER_SHEET_COLUMNS = ["指标名称", "口径定义"]
EXPORT_META = {
    "导出时间": lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
    "数据来源": "预约记录表 + 收银流水表 + 点评记录表 + 库存表",
    "到场率口径": ATTENDANCE_CALIBER_DEFINITION["到场率"],
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


def export_conflict_trend_csv(data: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["冲突检测趋势"])
    writer.writerow([])
    writer.writerow(["日期", "冲突对数"])

    for row in data:
        writer.writerow([row.get("date", ""), row.get("conflict_count", 0)])

    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_reschedule_composition_csv(data: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["改约记录构成"])
    writer.writerow([])
    writer.writerow(["改约原因", "记录数", "平均改约次数"])

    for row in data:
        writer.writerow([row.get("reason", ""), row.get("count", 0), row.get("avg_times", 0)])

    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_attendance_detail_csv(data: list[dict], daily_rates: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["到场状态明细"])
    writer.writerow([])

    writer.writerow(["--- 到场状态分布 ---"])
    writer.writerow(["日期", "到场状态", "人数"])

    for row in data:
        writer.writerow([row.get("date", ""), row.get("attendance_status", ""), row.get("count", 0)])

    writer.writerow([])
    writer.writerow(["--- 到场率趋势 ---"])
    writer.writerow(["日期", "到场率(%)"])

    for row in daily_rates:
        writer.writerow([row.get("date", ""), row.get("attendance_rate", 0)])

    writer.writerow([])
    for cal_row in _build_caliber_rows():
        writer.writerow(cal_row)

    return output.getvalue()


def export_anomaly_reminder_csv(data: list[dict], breakdown: list[dict], caliber: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["提醒名单异常标注"])
    writer.writerow([])

    writer.writerow(["--- 异常名单明细 ---"])
    writer.writerow(["顾客", "服务项目", "预约时间", "异常原因", "改约次数", "到场状态"])

    for row in data:
        writer.writerow([
            row.get("customer_name", ""),
            row.get("service_item", ""),
            str(row.get("appointment_time", "")),
            row.get("anomaly_reason", ""),
            row.get("reschedule_count", 0),
            row.get("attendance_status", ""),
        ])

    writer.writerow([])
    writer.writerow(["--- 异常原因分布 ---"])
    writer.writerow(["异常原因", "数量"])

    for row in breakdown:
        writer.writerow([row.get("reason", ""), row.get("count", 0)])

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
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["美业门店顾客预约风险监测 - 完整报告"])
    writer.writerow([f"导出时间: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 冲突检测趋势 " + "=" * 20])
    writer.writerow(["日期", "冲突对数"])
    for row in conflict_data:
        writer.writerow([row.get("date", ""), row.get("conflict_count", 0)])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 改约记录构成 " + "=" * 20])
    writer.writerow(["改约原因", "记录数", "平均改约次数"])
    for row in reschedule_data:
        writer.writerow([row.get("reason", ""), row.get("count", 0), row.get("avg_times", 0)])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 到场状态明细 " + "=" * 20])
    writer.writerow(["日期", "到场状态", "人数"])
    for row in attendance_data:
        writer.writerow([row.get("date", ""), row.get("attendance_status", ""), row.get("count", 0)])
    writer.writerow([])
    writer.writerow(["日期", "到场率(%)"])
    for row in attendance_rates:
        writer.writerow([row.get("date", ""), row.get("attendance_rate", 0)])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 提醒名单异常标注 " + "=" * 20])
    writer.writerow(["顾客", "服务项目", "预约时间", "异常原因", "改约次数", "到场状态"])
    for row in anomaly_data:
        writer.writerow([
            row.get("customer_name", ""),
            row.get("service_item", ""),
            str(row.get("appointment_time", "")),
            row.get("anomaly_reason", ""),
            row.get("reschedule_count", 0),
            row.get("attendance_status", ""),
        ])
    writer.writerow([])
    writer.writerow(["异常原因", "数量"])
    for row in anomaly_breakdown:
        writer.writerow([row.get("reason", ""), row.get("count", 0)])
    writer.writerow([])

    writer.writerow(["=" * 20 + " 指标定义说明（到场率口径） " + "=" * 20])
    writer.writerow(["指标名称", "口径定义"])
    for key, value in ATTENDANCE_CALIBER_DEFINITION.items():
        writer.writerow([key, value])
    writer.writerow([])
    writer.writerow(["导出元数据", ""])
    for meta_key, meta_value in EXPORT_META.items():
        writer.writerow([meta_key, meta_value() if callable(meta_value) else meta_value])

    return output.getvalue()
