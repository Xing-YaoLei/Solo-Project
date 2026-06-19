from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pathlib import Path
import pandas as pd
from utils.config import settings
from data.queries import (
    calculate_occupancy_rate, get_ota_orders,
    get_payment_transactions, get_cleaning_tasks
)


def export_occupancy_report(
    start_date: date,
    end_date: date,
    property_ids: Optional[List[str]] = None,
    group_by: str = "day",
    channels: Optional[List[str]] = None,
    filter_description: Optional[str] = None
) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"入住率报表_{start_date}_{end_date}_{timestamp}.xlsx"
    filepath = settings.EXPORT_DIR / filename

    filter_criteria = {
        "开始日期": str(start_date),
        "结束日期": str(end_date),
        "统计维度": {"day": "按天", "week": "按周", "month": "按月"}.get(group_by, group_by),
        "房源筛选": "全部房源" if not property_ids else f"指定{len(property_ids)}个房源",
        "渠道筛选": "全部渠道" if not channels else ",".join(channels),
        "生成时间": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    if filter_description:
        filter_criteria["备注"] = filter_description

    occupancy_df = calculate_occupancy_rate(start_date, end_date, property_ids, group_by)

    summary_data = []
    if not occupancy_df.empty:
        overall_avg_rate = round(occupancy_df["occupancy_rate"].mean(), 2)
        total_conflicts = int(occupancy_df["conflict_count"].sum())
        total_occupied = int(occupancy_df["occupied_count"].sum())

        summary_data = [
            {"指标": "统计周期", "值": f"{start_date} 至 {end_date}"},
            {"指标": "平均入住率", "值": f"{overall_avg_rate}%"},
            {"指标": "累计占用间夜数", "值": total_occupied},
            {"指标": "房态冲突数量", "值": total_conflicts},
            {"指标": "房源数量", "值": occupancy_df["property_code"].nunique() if "property_code" in occupancy_df.columns else 0}
        ]

    summary_df = pd.DataFrame(summary_data)
    filter_df = pd.DataFrame([
        {"筛选口径": k, "值": v} for k, v in filter_criteria.items()
    ])

    orders_df = get_ota_orders(start_date, end_date, property_ids, channels)
    payments_df = get_payment_transactions(
        datetime.combine(start_date, datetime.min.time()),
        datetime.combine(end_date, datetime.max.time()),
        property_ids
    )
    cleaning_df = get_cleaning_tasks(start_date, end_date, property_ids)

    with pd.ExcelWriter(filepath, engine="xlsxwriter") as writer:
        workbook = writer.book

        header_format = workbook.add_format({
            "bold": True,
            "bg_color": "#4472C4",
            "font_color": "white",
            "border": 1,
            "align": "center",
            "valign": "vcenter"
        })

        title_format = workbook.add_format({
            "bold": True,
            "font_size": 14,
            "align": "center",
            "valign": "vcenter"
        })

        normal_format = workbook.add_format({
            "border": 1,
            "align": "left",
            "valign": "vcenter"
        })

        rate_format = workbook.add_format({
            "border": 1,
            "align": "right",
            "valign": "vcenter",
            "num_format": "0.00%"
        })

        number_format = workbook.add_format({
            "border": 1,
            "align": "right",
            "valign": "vcenter",
            "num_format": "#,##0"
        })

        filter_df.to_excel(writer, sheet_name="筛选口径", index=False, startrow=1)
        ws = writer.sheets["筛选口径"]
        ws.merge_range("A1:B1", "筛选口径与生成信息", title_format)
        for col_num, value in enumerate(filter_df.columns.values):
            ws.write(1, col_num, value, header_format)
        for row in range(len(filter_df)):
            for col in range(len(filter_df.columns)):
                ws.write(row + 2, col, str(filter_df.iloc[row, col]), normal_format)
        ws.set_column("A:B", 25)

        if not summary_df.empty:
            summary_df.to_excel(writer, sheet_name="汇总指标", index=False, startrow=1)
            ws = writer.sheets["汇总指标"]
            ws.merge_range("A1:B1", "核心指标汇总", title_format)
            for col_num, value in enumerate(summary_df.columns.values):
                ws.write(1, col_num, value, header_format)
            for row in range(len(summary_df)):
                for col in range(len(summary_df.columns)):
                    ws.write(row + 2, col, str(summary_df.iloc[row, col]), normal_format)
            ws.set_column("A:B", 25)

        if not occupancy_df.empty:
            occupancy_df.to_excel(writer, sheet_name="入住率明细", index=False, startrow=1)
            ws = writer.sheets["入住率明细"]
            ws.merge_range(0, 0, 0, len(occupancy_df.columns) - 1, "入住率明细数据", title_format)
            for col_num, value in enumerate(occupancy_df.columns.values):
                ws.write(1, col_num, value, header_format)

            date_col = occupancy_df.columns.get_loc("status_date") if "status_date" in occupancy_df.columns else -1
            rate_col = occupancy_df.columns.get_loc("occupancy_rate") if "occupancy_rate" in occupancy_df.columns else -1
            occupied_col = occupancy_df.columns.get_loc("occupied_count") if "occupied_count" in occupancy_df.columns else -1
            conflict_col = occupancy_df.columns.get_loc("conflict_count") if "conflict_count" in occupancy_df.columns else -1

            for row in range(len(occupancy_df)):
                for col in range(len(occupancy_df.columns)):
                    cell_value = occupancy_df.iloc[row, col]
                    fmt = normal_format
                    if col == rate_col:
                        try:
                            cell_value = float(cell_value) / 100
                            fmt = rate_format
                        except (ValueError, TypeError):
                            pass
                    elif col in [occupied_col, conflict_col]:
                        fmt = number_format
                    ws.write(row + 2, col, cell_value, fmt)

            for col in range(len(occupancy_df.columns)):
                ws.set_column(col, col, 18)

        if not orders_df.empty:
            display_cols = [
                "order_no", "property_name", "channel", "check_in_date",
                "check_out_date", "guest_name", "room_count", "room_type",
                "total_amount", "paid_amount", "order_status", "is_anomaly"
            ]
            available_cols = [c for c in display_cols if c in orders_df.columns]
            orders_export = orders_df[available_cols].copy()
            orders_export.columns = [
                "订单号", "房源名称", "渠道", "入住日期", "退房日期",
                "客人姓名", "房间数", "房型", "订单总额", "已付金额", "订单状态", "是否异常"
            ]
            orders_export.to_excel(writer, sheet_name="OTA订单", index=False, startrow=1)
            ws = writer.sheets["OTA订单"]
            ws.merge_range(0, 0, 0, len(orders_export.columns) - 1, "OTA订单明细", title_format)
            for col_num, value in enumerate(orders_export.columns.values):
                ws.write(1, col_num, value, header_format)
            for row in range(len(orders_export)):
                for col in range(len(orders_export.columns)):
                    ws.write(row + 2, col, str(orders_export.iloc[row, col]), normal_format)
            for col in range(len(orders_export.columns)):
                ws.set_column(col, col, 15)

        if not payments_df.empty:
            display_cols = [
                "transaction_no", "property_name", "channel", "payment_method",
                "amount", "transaction_time", "transaction_status", "payer", "is_anomaly"
            ]
            available_cols = [c for c in display_cols if c in payments_df.columns]
            payments_export = payments_df[available_cols].copy()
            payments_export.columns = [
                "交易流水号", "房源名称", "渠道", "支付方式",
                "交易金额", "交易时间", "交易状态", "付款方", "是否异常"
            ]
            payments_export.to_excel(writer, sheet_name="收款流水", index=False, startrow=1)
            ws = writer.sheets["收款流水"]
            ws.merge_range(0, 0, 0, len(payments_export.columns) - 1, "收款流水明细", title_format)
            for col_num, value in enumerate(payments_export.columns.values):
                ws.write(1, col_num, value, header_format)
            for row in range(len(payments_export)):
                for col in range(len(payments_export.columns)):
                    ws.write(row + 2, col, str(payments_export.iloc[row, col]), normal_format)
            for col in range(len(payments_export.columns)):
                ws.set_column(col, col, 18)

        if not cleaning_df.empty:
            display_cols = [
                "task_no", "property_name", "room_type", "scheduled_date",
                "task_type", "task_status", "assigned_to", "completed_at", "remark"
            ]
            available_cols = [c for c in display_cols if c in cleaning_df.columns]
            cleaning_export = cleaning_df[available_cols].copy()
            cleaning_export.columns = [
                "任务编号", "房源名称", "房型", "计划日期",
                "任务类型", "任务状态", "负责人", "完成时间", "备注"
            ]
            cleaning_export.to_excel(writer, sheet_name="保洁任务", index=False, startrow=1)
            ws = writer.sheets["保洁任务"]
            ws.merge_range(0, 0, 0, len(cleaning_export.columns) - 1, "保洁任务明细", title_format)
            for col_num, value in enumerate(cleaning_export.columns.values):
                ws.write(1, col_num, value, header_format)
            for row in range(len(cleaning_export)):
                for col in range(len(cleaning_export.columns)):
                    ws.write(row + 2, col, str(cleaning_export.iloc[row, col]), normal_format)
            for col in range(len(cleaning_export.columns)):
                ws.set_column(col, col, 18)

    return filepath
