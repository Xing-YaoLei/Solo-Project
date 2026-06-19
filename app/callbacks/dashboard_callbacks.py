import io
import base64
from datetime import datetime, timedelta

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from dash import Input, Output, State, callback, html, dcc, no_update, dash_table
import dash_bootstrap_components as dbc

from data import (
    get_work_orders_df,
    get_appointments_df,
    get_daily_appointments_stats,
    get_rework_rate_stats,
    get_anomalies_df,
    get_repair_type_distribution,
    get_parts_df,
    get_work_order_by_id,
    get_work_order_items,
    get_quotes_df,
    get_remarks,
    add_remark,
    update_anomaly_status,
)
from config import RISK_THRESHOLDS, EXPORT_CONFIG


@callback(
    [
        Output("kpi-today-appointments", "children"),
        Output("kpi-arrival-rate", "children"),
        Output("kpi-pending-orders", "children"),
        Output("kpi-shortage-orders", "children"),
        Output("kpi-rework-rate", "children"),
        Output("kpi-high-risk-count", "children"),
        Output("kpi-open-anomalies", "children"),
        Output("kpi-critical-anomalies", "children"),
    ],
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("refresh-interval", "n_intervals"),
        Input("btn-refresh", "n_clicks"),
    ]
)
def update_kpi_cards(start_date, end_date, n_intervals, n_clicks):
    today = datetime.now().date()

    apt_df = get_appointments_df(
        start_date=datetime.combine(today, datetime.min.time()),
        end_date=datetime.combine(today, datetime.max.time())
    )
    today_apt = len(apt_df)
    arrived = len(apt_df[apt_df["status"] == "arrived"]) if not apt_df.empty else 0
    arrival_rate = f"{arrived / today_apt * 100:.1f}%" if today_apt > 0 else "--"

    orders_df = get_work_orders_df(start_date=start_date, end_date=end_date)
    pending = len(orders_df[orders_df["status"].isin(["pending", "in_progress", "parts_pending"])]) if not orders_df.empty else 0
    shortage = len(orders_df[orders_df["has_parts_shortage"] == True]) if not orders_df.empty else 0

    completed_orders = orders_df[orders_df["status"] == "completed"] if not orders_df.empty else pd.DataFrame()
    if not completed_orders.empty:
        rework_count = completed_orders["is_rework"].sum()
        rework_rate = f"{rework_count / len(completed_orders) * 100:.1f}%"
    else:
        rework_rate = "--"

    high_risk_apt = len(apt_df[apt_df["risk_level"] == "high"]) if not apt_df.empty else 0

    anomalies_df = get_anomalies_df(status="open")
    open_anomalies = len(anomalies_df) if not anomalies_df.empty else 0
    critical = len(anomalies_df[anomalies_df["severity"] == "critical"]) if not anomalies_df.empty else 0

    return (
        f"{today_apt} 个",
        f"到店率 {arrival_rate}",
        f"{pending} 个",
        f"缺货 {shortage} 个",
        rework_rate,
        f"高风险 {high_risk_apt}",
        f"{open_anomalies} 条",
        f"严重 {critical}",
    )


@callback(
    Output("appointment-trend-chart", "figure"),
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("risk-level-filter", "value"),
        Input("refresh-interval", "n_intervals"),
    ]
)
def update_appointment_trend(start_date, end_date, risk_level, n_intervals):
    if start_date and end_date:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        days = (end_dt - start_dt).days
    else:
        days = 30

    stats_df = get_daily_appointments_stats(days=days)

    if stats_df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无数据")
        return fig

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=stats_df["date"],
        y=stats_df["total_count"],
        name="预约总数",
        marker_color="#4e73df",
        hovertemplate="日期: %{x}<br>预约数: %{y}<extra></extra>"
    ))

    fig.add_trace(go.Scatter(
        x=stats_df["date"],
        y=stats_df["high_risk_count"],
        name="高风险",
        mode="lines+markers",
        line=dict(color="#e74a3b", width=2),
        yaxis="y2",
        hovertemplate="日期: %{x}<br>高风险: %{y}<extra></extra>"
    ))

    fig.add_trace(go.Scatter(
        x=stats_df["date"],
        y=stats_df["arrived_count"],
        name="已到店",
        mode="lines+markers",
        line=dict(color="#1cc88a", width=2),
        yaxis="y2",
        hovertemplate="日期: %{x}<br>已到店: %{y}<extra></extra>"
    ))

    fig.update_layout(
        barmode="group",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=20, b=40),
        yaxis=dict(title="预约数"),
        yaxis2=dict(title="数量", overlaying="y", side="right"),
        hovermode="x unified",
    )

    return fig


@callback(
    Output("risk-distribution-chart", "figure"),
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("refresh-interval", "n_intervals"),
    ]
)
def update_risk_distribution(start_date, end_date, n_intervals):
    apt_df = get_appointments_df(start_date=start_date, end_date=end_date)

    if apt_df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无数据")
        return fig

    risk_counts = apt_df["risk_level"].value_counts().reset_index()
    risk_counts.columns = ["risk_level", "count"]

    color_map = {"high": "#e74a3b", "medium": "#f6c23e", "low": "#1cc88a"}
    label_map = {"high": "高风险", "medium": "中风险", "low": "低风险"}

    risk_counts["label"] = risk_counts["risk_level"].map(label_map)
    risk_counts["color"] = risk_counts["risk_level"].map(color_map)

    fig = go.Figure(data=[go.Pie(
        labels=risk_counts["label"],
        values=risk_counts["count"],
        hole=0.4,
        marker=dict(colors=risk_counts["color"]),
        textinfo="label+percent",
        textposition="outside",
    )])

    fig.update_layout(
        margin=dict(l=20, r=20, t=20, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5),
    )

    return fig


@callback(
    Output("rework-rate-chart", "figure"),
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("refresh-interval", "n_intervals"),
    ]
)
def update_rework_rate_chart(start_date, end_date, n_intervals):
    stats_df = get_rework_rate_stats(start_date=start_date, end_date=end_date)

    if stats_df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无数据")
        return fig

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=stats_df["date"],
        y=stats_df["total_orders"],
        name="完工工单",
        marker_color="#4e73df",
        opacity=0.7,
        hovertemplate="日期: %{x}<br>完工工单: %{y}<extra></extra>"
    ))

    fig.add_trace(go.Scatter(
        x=stats_df["date"],
        y=stats_df["rework_rate"] * 100,
        name="返修率 (%)",
        mode="lines+markers",
        line=dict(color="#e74a3b", width=3),
        marker=dict(size=8),
        yaxis="y2",
        hovertemplate="日期: %{x}<br>返修率: %{y:.1f}%<extra></extra>"
    ))

    high_threshold = RISK_THRESHOLDS["high_risk_repair_rate"] * 100
    fig.add_hline(
        y=high_threshold,
        line_dash="dash",
        line_color="#e74a3b",
        annotation_text=f"高风险线 ({high_threshold:.0f}%)",
        annotation_position="right",
    )

    fig.update_layout(
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=20, b=40),
        yaxis=dict(title="完工工单数"),
        yaxis2=dict(title="返修率 (%)", overlaying="y", side="right", range=[0, 30]),
        hovermode="x unified",
    )

    return fig


@callback(
    Output("repair-type-chart", "figure"),
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("refresh-interval", "n_intervals"),
    ]
)
def update_repair_type_chart(start_date, end_date, n_intervals):
    dist_df = get_repair_type_distribution(start_date=start_date, end_date=end_date)

    if dist_df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无数据")
        return fig

    dist_df = dist_df.sort_values("count", ascending=True)

    fig = go.Figure(go.Bar(
        y=dist_df["repair_type"],
        x=dist_df["count"],
        orientation="h",
        marker=dict(
            color=dist_df["count"],
            colorscale="Blues",
            showscale=False,
        ),
        text=dist_df["count"],
        textposition="outside",
        hovertemplate="维修类型: %{y}<br>工单数量: %{x}<extra></extra>"
    ))

    fig.update_layout(
        margin=dict(l=40, r=40, t=20, b=40),
        xaxis=dict(title="工单数量"),
    )

    return fig


@callback(
    [
        Output("work-orders-table", "data"),
        Output("repair-type-filter", "options"),
    ],
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("order-status-filter", "value"),
        Input("repair-type-filter", "value"),
        Input("shortage-only-switch", "value"),
        Input("refresh-interval", "n_intervals"),
        Input("btn-refresh", "n_clicks"),
    ]
)
def update_work_orders_table(start_date, end_date, status, repair_type, shortage_only, n_intervals, n_clicks):
    status_filter = None if status == "all" else status
    repair_type_filter = None if repair_type == "all" else repair_type
    shortage_filter = True if shortage_only else None

    df = get_work_orders_df(
        start_date=start_date,
        end_date=end_date,
        status=status_filter,
        repair_type=repair_type_filter,
        has_parts_shortage=shortage_filter,
    )

    if df.empty:
        table_data = []
    else:
        df["total_amount"] = df["total_amount"].apply(lambda x: f"¥{x:.2f}")
        df["is_rework"] = df["is_rework"].apply(lambda x: "是" if x else "否")
        df["has_parts_shortage"] = df["has_parts_shortage"].apply(lambda x: "是" if x else "否")

        status_map = {
            "pending": "待处理",
            "in_progress": "进行中",
            "parts_pending": "配件待料",
            "completed": "已完成",
            "cancelled": "已取消",
        }
        df["status"] = df["status"].map(status_map).fillna(df["status"])
        table_data = df.to_dict("records")

    all_orders = get_work_orders_df(start_date=start_date, end_date=end_date)
    if not all_orders.empty:
        repair_types = sorted(all_orders["repair_type"].dropna().unique().tolist())
        options = [{"label": "全部", "value": "all"}] + [{"label": t, "value": t} for t in repair_types]
    else:
        options = [{"label": "全部", "value": "all"}]

    return table_data, options


@callback(
    Output("anomalies-table-container", "children"),
    [
        Input("anomaly-tabs", "active_tab"),
        Input("refresh-interval", "n_intervals"),
    ]
)
def update_anomalies_table(active_tab, n_intervals):
    type_map = {
        "all-anomalies": None,
        "parts-shortage": "parts_shortage",
        "review-flag": "review_flag",
        "insurance-issue": "insurance_issue",
        "data-error": "data_error",
    }

    anomaly_type = type_map.get(active_tab)
    df = get_anomalies_df(anomaly_type=anomaly_type, status="open")

    if df.empty:
        return html.Div([
            html.I(className="fas fa-check-circle text-success me-2"),
            html.Span("暂无待处理异常", className="text-muted")
        ], className="text-center py-4")

    df["severity_label"] = df["severity"].map({
        "critical": "严重",
        "high": "高",
        "medium": "中",
        "low": "低",
    })

    df["type_label"] = df["anomaly_type"].map({
        "parts_shortage": "配件缺货",
        "review_flag": "复盘标记",
        "insurance_issue": "保险问题",
        "data_error": "数据错误",
    })

    severity_colors = {
        "critical": "danger",
        "high": "warning",
        "medium": "info",
        "low": "secondary",
    }

    rows = []
    for _, row in df.head(10).iterrows():
        badge_color = severity_colors.get(row["severity"], "secondary")
        rows.append(html.Tr([
            html.Td(dbc.Badge(row["severity_label"], color=badge_color, className="me-1")),
            html.Td(row["type_label"]),
            html.Td(html.Strong(row["title"])),
            html.Td(row["description"], className="text-muted small"),
            html.Td(row["related_no"]),
            html.Td(row["detected_at"].strftime("%Y-%m-%d %H:%M") if pd.notna(row["detected_at"]) else ""),
            html.Td(
                dbc.Button("处理", size="sm", color="primary", outline=True,
                           id={"type": "handle-anomaly", "index": row["id"]})
            ),
        ]))

    table = dbc.Table([
        html.Thead([
            html.Tr([
                html.Th("严重度"),
                html.Th("类型"),
                html.Th("标题"),
                html.Th("描述"),
                html.Th("关联单号"),
                html.Th("发现时间"),
                html.Th("操作"),
            ])
        ]),
        html.Tbody(rows)
    ], bordered=True, hover=True, size="sm", className="mb-0")

    return table


@callback(
    [
        Output("sync-parts-status", "children"),
        Output("sync-orders-status", "children"),
        Output("sync-insurance-status", "children"),
        Output("sync-anomaly-status", "children"),
    ],
    [Input("refresh-interval", "n_intervals")]
)
def update_sync_status(n_intervals):
    from models import SessionLocal, SyncLog

    db = SessionLocal()
    try:
        def get_last_status(task_name):
            log = db.query(SyncLog).filter(
                SyncLog.task_name == task_name
            ).order_by(SyncLog.created_at.desc()).first()

            if log:
                status_map = {"success": "成功", "failed": "失败", "running": "运行中"}
                status_label = status_map.get(log.status, log.status)
                status_color = {"success": "text-success", "failed": "text-danger", "running": "text-warning"}.get(log.status, "text-muted")
                time_str = log.finished_at.strftime("%H:%M") if log.finished_at else "--"
                return html.Span([
                    html.Span(status_label, className=f"{status_color} me-2"),
                    f"({time_str} · {log.records_count}条)"
                ])
            return html.Span("暂无记录", className="text-muted")

        return (
            get_last_status("配件系统同步"),
            get_last_status("维修工单同步"),
            get_last_status("保险材料同步"),
            "已启用 · 自动检测",
        )
    finally:
        db.close()


@callback(
    Output("current-filter-state", "data"),
    [
        Input("date-picker-range", "start_date"),
        Input("date-picker-range", "end_date"),
        Input("order-status-filter", "value"),
        Input("repair-type-filter", "value"),
        Input("shortage-only-switch", "value"),
        Input("risk-level-filter", "value"),
    ]
)
def store_filter_state(start_date, end_date, status, repair_type, shortage_only, risk_level):
    return {
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
        "repair_type": repair_type,
        "shortage_only": shortage_only,
        "risk_level": risk_level,
        "export_caliber": "返修率按完工工单计算，日期范围以工单创建时间为准",
    }


@callback(
    Output("btn-export-rework", "href"),
    [Input("current-filter-state", "data")],
    prevent_initial_call=True
)
def export_rework_report(filter_state):
    return "/export/rework"
