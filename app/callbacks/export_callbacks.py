import io
from datetime import datetime

import pandas as pd
from dash import Input, Output, State, callback, dcc, html, ctx
import dash_bootstrap_components as dbc

from data import (
    get_rework_rate_stats,
    get_work_orders_df,
    get_repair_type_distribution,
)
from config import EXPORT_CONFIG


@callback(
    Output("download-rework-report", "data"),
    [Input("btn-export-rework", "n_clicks")],
    [State("current-filter-state", "data")],
    prevent_initial_call=True
)
def export_rework_report(n_clicks, filter_state):
    if not n_clicks:
        return None

    start_date = filter_state.get("start_date")
    end_date = filter_state.get("end_date")
    status = filter_state.get("status", "all")
    repair_type = filter_state.get("repair_type", "all")
    shortage_only = filter_state.get("shortage_only", False)
    risk_level = filter_state.get("risk_level", "all")

    status_filter = None if status == "all" else status
    repair_type_filter = None if repair_type == "all" else repair_type
    shortage_filter = True if shortage_only else None

    orders_df = get_work_orders_df(
        start_date=start_date,
        end_date=end_date,
        status=status_filter,
        repair_type=repair_type_filter,
        has_parts_shortage=shortage_filter,
    )

    repair_dist = get_repair_type_distribution(
        start_date=start_date,
        end_date=end_date,
        status=status,
        repair_type=repair_type,
        has_parts_shortage=shortage_filter,
        risk_level=risk_level,
    )

    rework_stats = get_rework_rate_stats(
        start_date=start_date,
        end_date=end_date,
        repair_type=repair_type,
        has_parts_shortage=shortage_filter,
        risk_level=risk_level,
    )

    completed_orders = orders_df[orders_df["status"] == "completed"] if not orders_df.empty else pd.DataFrame()
    rework_orders = completed_orders[completed_orders["is_rework"] == True] if not completed_orders.empty else pd.DataFrame()

    status_label_map = {
        "all": "全部",
        "pending": "待处理",
        "in_progress": "进行中",
        "parts_pending": "配件待料",
        "completed": "已完成",
        "cancelled": "已取消",
    }
    risk_label_map = {
        "all": "全部",
        "high": "高风险",
        "medium": "中风险",
        "low": "低风险",
    }

    summary_rows = [
        ("统计周期", f"{start_date} 至 {end_date}"),
        ("工单状态筛选", status_label_map.get(status, status)),
        ("维修类型筛选", "全部" if repair_type == "all" else repair_type),
        ("风险等级筛选", risk_label_map.get(risk_level, risk_level)),
        ("仅显示缺货", "是" if shortage_only else "否"),
        ("", ""),
        ("筛选后总工单", len(orders_df) if not orders_df.empty else 0),
        ("筛选后完工工单", len(completed_orders) if not completed_orders.empty else 0),
        ("筛选后返修工单", len(rework_orders) if not rework_orders.empty else 0),
        ("整体返修率", f"{len(rework_orders) / len(completed_orders) * 100:.2f}%" if len(completed_orders) > 0 else "N/A"),
        ("", ""),
        ("数据导出时间", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        ("统计口径", filter_state.get("export_caliber", "返修率按完工工单计算，日期范围以工单创建时间为准")),
    ]

    summary_df = pd.DataFrame(summary_rows, columns=["项目", "数值"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="统计概览", index=False)

        if not rework_stats.empty:
            rework_stats_export = rework_stats.copy()
            rework_stats_export["rework_rate"] = rework_stats_export["rework_rate"] * 100
            rework_stats_export.columns = ["日期", "完工工单数", "返修工单数", "返修率(%)"]
            rework_stats_export.to_excel(writer, sheet_name="每日返修率", index=False)

        if not orders_df.empty:
            orders_export = orders_df[[
                "order_no", "license_plate", "vehicle_model", "customer_name",
                "repair_type", "status", "technician", "advisor",
                "total_amount", "is_rework", "rework_count",
                "has_parts_shortage", "created_at",
            ]].copy()
            orders_export.columns = [
                "工单号", "车牌号", "车型", "客户姓名", "维修类型",
                "状态", "技师", "服务顾问", "金额", "是否返修",
                "返修次数", "配件缺货", "创建时间",
            ]
            orders_export["是否返修"] = orders_export["是否返修"].map({True: "是", False: "否"})
            orders_export["配件缺货"] = orders_export["配件缺货"].map({True: "是", False: "否"})
            status_map = {
                "pending": "待处理",
                "in_progress": "进行中",
                "parts_pending": "配件待料",
                "completed": "已完成",
                "cancelled": "已取消",
            }
            orders_export["状态"] = orders_export["状态"].map(status_map).fillna(orders_export["状态"])
            orders_export["金额"] = orders_export["金额"].apply(lambda x: f"¥{x:.2f}")
            orders_export.to_excel(writer, sheet_name="工单明细", index=False)

        if not rework_orders.empty:
            rework_export = rework_orders[[
                "order_no", "license_plate", "vehicle_model", "customer_name",
                "repair_type", "technician", "advisor", "total_amount",
                "rework_count", "complete_time",
            ]].copy()
            rework_export.columns = [
                "工单号", "车牌号", "车型", "客户姓名", "维修类型",
                "技师", "服务顾问", "金额", "返修次数", "完工时间",
            ]
            rework_export["金额"] = rework_export["金额"].apply(lambda x: f"¥{x:.2f}")
            rework_export.to_excel(writer, sheet_name="返修工单明细", index=False)

        if not repair_dist.empty:
            repair_dist_export = repair_dist.copy()
            repair_dist_export.columns = ["维修类型", "工单数", "总金额(元)"]
            repair_dist_export.to_excel(writer, sheet_name="维修类型分布", index=False)

    output.seek(0)

    date_str = f"{start_date}_{end_date}" if start_date and end_date else "all"
    filename = f"返修率报告_{date_str}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"

    return dcc.send_bytes(output.getvalue(), filename)
