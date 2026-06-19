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

    rework_stats = get_rework_rate_stats(start_date=start_date, end_date=end_date)
    orders_df = get_work_orders_df(start_date=start_date, end_date=end_date)
    repair_dist = get_repair_type_distribution(start_date=start_date, end_date=end_date)

    completed_orders = orders_df[orders_df["status"] == "completed"] if not orders_df.empty else pd.DataFrame()
    rework_orders = completed_orders[completed_orders["is_rework"] == True] if not completed_orders.empty else pd.DataFrame()

    summary_data = {
        "统计口径": [
            "统计周期",
            "完工工单数",
            "返修工单数",
            "整体返修率",
            "数据导出时间",
            "说明",
        ],
        "数值": [
            f"{start_date} 至 {end_date}",
            len(completed_orders),
            len(rework_orders),
            f"{len(rework_orders) / len(completed_orders) * 100:.2f}%" if len(completed_orders) > 0 else "N/A",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            filter_state.get("export_caliber", "返修率按完工工单计算"),
        ]
    }
    summary_df = pd.DataFrame(summary_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="统计概览", index=False)

        if not rework_stats.empty:
            rework_stats["rework_rate"] = rework_stats["rework_rate"] * 100
            rework_stats.columns = ["日期", "完工工单数", "返修工单数", "返修率(%)"]
            rework_stats.to_excel(writer, sheet_name="每日返修率", index=False)

        if not rework_orders.empty:
            rework_export = rework_orders[[
                "order_no", "license_plate", "vehicle_model", "customer_name",
                "repair_type", "technician", "total_amount", "rework_count",
                "complete_time"
            ]].copy()
            rework_export.columns = [
                "工单号", "车牌号", "车型", "客户姓名", "维修类型",
                "技师", "金额", "返修次数", "完工时间"
            ]
            rework_export.to_excel(writer, sheet_name="返修工单明细", index=False)

        if not repair_dist.empty:
            repair_dist.columns = ["维修类型", "工单数", "总金额(元)"]
            repair_dist.to_excel(writer, sheet_name="维修类型分布", index=False)

    output.seek(0)

    filename = f"返修率报告_{start_date}_{end_date}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"

    return dcc.send_bytes(output.getvalue(), filename)
