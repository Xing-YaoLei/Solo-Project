import io
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from dash import dcc, html, dash_table, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

from dashboard.app import app, cache
from data.queries import (
    get_cleaning_appointments, get_follow_up_tasks, get_imaging_records,
    get_treatment_plans, get_his_sync_logs, calculate_return_visit_rate,
    aggregate_daily_stats, detect_no_show_impact_periods, get_sync_delay_annotations
)
from config.settings import Config


def get_empty_fig(title="暂无数据"):
    fig = go.Figure()
    fig.update_layout(
        title=title,
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        annotations=[dict(
            text="请刷新数据或检查数据库连接",
            xref="paper", yref="paper",
            showarrow=False, font=dict(size=16, color="#999")
        )]
    )
    return fig


def create_kpi_cards(df_daily, return_summary):
    today = date.today().isoformat()
    if not df_daily.empty:
        latest = df_daily.iloc[-1]
        total_appt = int(latest["total_appointments"])
        no_show = int(latest["no_show_count"])
        no_show_rate = latest["no_show_rate"]
        completed = int(latest["completed_count"])
        his_delay = int(latest["his_delay_count"])
        img_missing = int(latest["imaging_missing_count"])
    else:
        total_appt = no_show = completed = his_delay = img_missing = 0
        no_show_rate = 0.0

    cards = dbc.Row([
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("今日洁牙预约", className="card-title text-muted"),
                html.H2(f"{total_appt}", className="text-primary"),
                html.Small(f"数据日期: {today}", className="text-muted")
            ])
        ], className="shadow-sm border-0"), width=2),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("已完成", className="card-title text-muted"),
                html.H2(f"{completed}", className="text-success"),
                html.Small(
                    f"完成率 {df_daily.iloc[-1]['completion_rate']:.1f}%" if not df_daily.empty else "完成率 0%",
                    className="text-muted"
                )
            ])
        ], className="shadow-sm border-0"), width=2),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("爽约/取消", className="card-title text-muted"),
                html.H2(f"{no_show}", className="text-danger"),
                html.Small(f"爽约率 {no_show_rate:.1f}%", className="text-muted")
            ])
        ], className="shadow-sm border-0"), width=2),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("复诊率", className="card-title text-muted"),
                html.H2(f"{return_summary.get('return_rate', 0):.1f}%", className="text-info"),
                html.Small(
                    f"随访窗 {return_summary.get('window_days', 180)}天",
                    className="text-muted"
                )
            ])
        ], className="shadow-sm border-0"), width=2),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("HIS延迟异常", className="card-title text-muted"),
                html.H2(f"{his_delay}", className="text-warning"),
                html.Small(
                    f"阈值 {Config.HIS_DELAY_THRESHOLD_MINUTES}分钟",
                    className="text-muted"
                )
            ])
        ], className="shadow-sm border-0"), width=2),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H5("影像缺失", className="card-title text-muted"),
                html.H2(f"{img_missing}", className="text-secondary"),
                html.Small("近7天洁牙后影像", className="text-muted")
            ])
        ], className="shadow-sm border-0"), width=2),
    ], className="mb-4 g-3")
    return cards


def create_daily_trend_chart(df_daily, no_show_periods, sync_annotations):
    if df_daily.empty:
        return get_empty_fig("洁牙预约趋势图 - 暂无数据")

    fig = make_subplots(
        rows=2, cols=1, shared_xaxes=True,
        vertical_spacing=0.08,
        subplot_titles=("每日预约量与完成情况", "爽约率与异常指标趋势"),
        row_heights=[0.55, 0.45]
    )

    fig.add_trace(go.Bar(
        x=df_daily["date_str"], y=df_daily["total_appointments"],
        name="总预约量", marker_color="#4C78A8", opacity=0.8
    ), row=1, col=1)
    fig.add_trace(go.Bar(
        x=df_daily["date_str"], y=df_daily["completed_count"],
        name="已完成", marker_color="#54A24B", opacity=0.8
    ), row=1, col=1)
    fig.add_trace(go.Bar(
        x=df_daily["date_str"], y=df_daily["no_show_count"],
        name="爽约数", marker_color="#E45756", opacity=0.8
    ), row=1, col=1)

    fig.add_trace(go.Scatter(
        x=df_daily["date_str"], y=df_daily["no_show_rate"],
        mode="lines+markers", name="爽约率(%)",
        line=dict(color="#E45756", width=2),
        marker=dict(size=8)
    ), row=2, col=1)
    fig.add_trace(go.Scatter(
        x=df_daily["date_str"], y=df_daily["his_delay_count"],
        mode="lines+markers", name="HIS延迟数",
        line=dict(color="#F58518", width=2, dash="dot"),
        marker=dict(size=6)
    ), row=2, col=1)
    fig.add_trace(go.Scatter(
        x=df_daily["date_str"], y=df_daily["imaging_missing_count"],
        mode="lines+markers", name="影像缺失数",
        line=dict(color="#72B7B2", width=2, dash="dash"),
        marker=dict(size=6)
    ), row=2, col=1)

    for idx, period in enumerate(no_show_periods):
        start_d = period["start_date"]
        end_d = period["end_date"]
        label = f"🔴 爽约影响期 #{idx+1}<br>平均 {period['avg_no_show_rate']:.1f}% | 持续{period.get('days_count', '?')}天"

        fig.add_shape(
            type="rect",
            x0=start_d, x1=end_d,
            y0=0, y1=1,
            yref="paper",
            fillcolor="#E45756",
            opacity=0.18,
            layer="below",
            line_width=0,
            row=1, col=1
        )
        fig.add_shape(
            type="rect",
            x0=start_d, x1=end_d,
            y0=0, y1=1,
            yref="paper",
            fillcolor="#E45756",
            opacity=0.18,
            layer="below",
            line_width=0,
            row=2, col=1
        )

        mid_date = pd.Timestamp(start_d) + (pd.Timestamp(end_d) - pd.Timestamp(start_d)) / 2
        fig.add_annotation(
            x=mid_date,
            y=1.08,
            yref="paper",
            text=label,
            showarrow=False,
            font=dict(size=11, color="#C0392B"),
            bgcolor="rgba(255,235,235,0.95)",
            bordercolor="#E45756",
            borderwidth=1,
            align="center",
            row=1, col=1
        )

    for ann in sync_annotations:
        ann_date = pd.to_datetime(ann["time"]).strftime("%Y-%m-%d")
        delay_min = ann.get("delay_minutes", 0)
        records = ann.get("records_count", 0)
        label_text = f"⚠️ HIS延迟 {delay_min:.0f}分钟<br>({records}条记录)"

        fig.add_shape(
            type="rect",
            x0=ann_date, x1=ann_date,
            y0=0, y1=1,
            yref="paper",
            fillcolor="#F58518",
            opacity=0.25,
            layer="below",
            line_width=0,
            row=1, col=1
        )
        fig.add_shape(
            type="rect",
            x0=ann_date, x1=ann_date,
            y0=0, y1=1,
            yref="paper",
            fillcolor="#F58518",
            opacity=0.25,
            layer="below",
            line_width=0,
            row=2, col=1
        )

        fig.add_shape(
            type="line",
            x0=ann_date, x1=ann_date,
            y0=0, y1=1,
            yref="paper",
            line=dict(color="#D35400", width=3, dash="dashdot"),
            layer="above",
            row=1, col=1
        )

        fig.add_annotation(
            x=ann_date,
            y=1,
            yref="paper",
            xanchor="left",
            yanchor="top",
            text=label_text,
            showarrow=False,
            font=dict(size=11, color="#D35400", family="Arial, sans-serif"),
            bgcolor="rgba(255,248,220,0.9)",
            bordercolor="#F58518",
            borderwidth=1,
            align="left",
            row=1, col=1
        )

    fig.update_layout(
        barmode="group",
        height=600,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_white",
        hovermode="x unified"
    )
    fig.update_yaxes(title_text="预约数", row=1, col=1)
    fig.update_yaxes(title_text="数值", row=2, col=1)

    return fig


def create_anomaly_scatter_chart(df_appointments):
    if df_appointments.empty:
        return get_empty_fig("异常点分布图 - 暂无数据")

    anomaly_data = df_appointments[
        df_appointments["anomaly_flag"] != ""
    ].copy()

    if anomaly_data.empty:
        return get_empty_fig("异常点分布图 - 暂无异常")

    colors = {
        "HIS_DELAY": "#F58518",
        "IMAGING_MISSING": "#72B7B2",
        "BILLING_CALIBER": "#B279A2"
    }

    fig = go.Figure()

    anomaly_types = ["HIS_DELAY", "IMAGING_MISSING", "BILLING_CALIBER"]
    for atype in anomaly_types:
        sub = anomaly_data[anomaly_data["anomaly_types"].apply(lambda x: atype in x)]
        if not sub.empty:
            hover_texts = []
            for _, row in sub.iterrows():
                text_parts = [
                    f"预约号: {row['appointment_no']}",
                    f"患者: {row['patient_name']}",
                    f"日期: {row['date_str']}",
                    f"状态: {row['status']}"
                ]
                if atype == "HIS_DELAY":
                    text_parts.append(f"延迟: {row['sync_delay_minutes']:.1f}分钟")
                if row["review_note"]:
                    text_parts.append(f"复盘: {row['review_note'][:50]}")
                hover_texts.append("<br>".join(text_parts))

            fig.add_trace(go.Scatter(
                x=sub["date_str"],
                y=sub["patient_name"],
                mode="markers",
                name={
                    "HIS_DELAY": "HIS同步延迟",
                    "IMAGING_MISSING": "影像资料缺失",
                    "BILLING_CALIBER": "收费口径变化"
                }[atype],
                marker=dict(
                    color=colors[atype],
                    size=14,
                    line=dict(width=2, color="white"),
                    symbol="diamond"
                ),
                text=hover_texts,
                hoverinfo="text",
                customdata=sub["id"].values
            ))

    fig.update_layout(
        height=500,
        title="异常点分布（含复盘关联）",
        xaxis=dict(title="预约日期", tickangle=-45),
        yaxis=dict(title="患者", tickfont=dict(size=9)),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_white",
        hoverlabel=dict(bgcolor="white", font_size=12)
    )

    return fig


def create_status_pie_chart(df_appointments):
    if df_appointments.empty:
        return get_empty_fig("预约状态分布 - 暂无数据")

    status_counts = df_appointments["status"].value_counts().reset_index()
    status_counts.columns = ["status", "count"]

    status_labels = {
        "scheduled": "已预约",
        "completed": "已完成",
        "done": "已完成",
        "no_show": "爽约",
        "missed": "爽约",
        "cancelled": "已取消",
        "rescheduled": "已改期"
    }
    status_counts["status_label"] = status_counts["status"].map(status_labels).fillna(status_counts["status"])

    color_map = {
        "已预约": "#4C78A8",
        "已完成": "#54A24B",
        "爽约": "#E45756",
        "已取消": "#9D755D",
        "已改期": "#EECA3B"
    }

    fig = go.Figure(go.Pie(
        labels=status_counts["status_label"],
        values=status_counts["count"],
        hole=0.4,
        marker=dict(colors=[color_map.get(s, "#999") for s in status_counts["status_label"]]),
        textinfo="label+percent",
        insidetextorientation="radial"
    ))

    fig.update_layout(
        height=400,
        title="洁牙预约状态分布",
        template="plotly_white"
    )
    return fig


def create_return_rate_funnel(df_return, summary):
    if df_return.empty:
        return get_empty_fig("复诊率漏斗 - 暂无数据")

    stages = [
        ("洁牙总人数", summary["total_cleanings"]),
        ("已过随访期", summary["eligible_for_return"]),
        ("已复诊/完成随访", summary["returned_count"])
    ]

    fig = go.Figure(go.Funnel(
        y=[s[0] for s in stages],
        x=[s[1] for s in stages],
        textposition="inside",
        textinfo="value+percent initial",
        opacity=0.75,
        marker=dict(color=["#4C78A8", "#54A24B", "#72B7B2"]),
        connector=dict(fillcolor="#f0f0f0")
    ))

    fig.update_layout(
        height=350,
        title=f"复诊率转化漏斗 (当前: {summary['return_rate']:.1f}%)",
        template="plotly_white"
    )
    return fig


def create_no_show_periods_summary(no_show_periods):
    if not no_show_periods:
        return html.Div()

    cards = []
    for idx, period in enumerate(no_show_periods):
        card = dbc.Card([
            dbc.CardBody([
                html.Div([
                    html.Strong(f"🔴 爽约影响期 #{idx+1}", className="text-danger"),
                    html.Small(
                        f"  {period['start_date']} ~ {period['end_date']}",
                        className="text-muted ms-2"
                    )
                ], className="mb-2"),
                dbc.Row([
                    dbc.Col([
                        html.Div([
                            html.Small("平均爽约率", className="text-muted d-block"),
                            html.Strong(f"{period['avg_no_show_rate']:.1f}%", className="text-danger h5")
                        ])
                    ]),
                    dbc.Col([
                        html.Div([
                            html.Small("持续天数", className="text-muted d-block"),
                            html.Strong(f"{period.get('days_count', '?')}天", className="h5")
                        ])
                    ]),
                    dbc.Col([
                        html.Div([
                            html.Small("爽约总数", className="text-muted d-block"),
                            html.Strong(f"{period.get('total_no_shows', 0)}人", className="h5")
                        ])
                    ]),
                    dbc.Col([
                        html.Div([
                            html.Small("预约总数", className="text-muted d-block"),
                            html.Strong(f"{period.get('total_appointments', 0)}人", className="h5")
                        ])
                    ])
                ])
            ])
        ], className="border-danger mb-2", style={"borderLeft": "4px solid #E45756"})
        cards.append(card)

    return html.Div([
        html.H6("📊 爽约影响时段汇总", className="text-danger mb-2"),
        html.Div(cards)
    ])


def create_anomaly_table(df_appointments):
    if df_appointments.empty:
        return html.Div("暂无异常数据", className="text-center text-muted p-4")

    anomalies = df_appointments[df_appointments["anomaly_flag"] != ""].copy()
    if anomalies.empty:
        return html.Div("暂无异常记录", className="text-center text-muted p-4")

    anomaly_type_labels = {
        "HIS_DELAY": ("HIS同步延迟", "warning"),
        "IMAGING_MISSING": ("影像资料缺失", "info"),
        "BILLING_CALIBER": ("收费口径变化", "secondary")
    }

    table_rows = []
    for _, row in anomalies.iterrows():
        anomaly_types = row.get("anomaly_types", [])
        if isinstance(anomaly_types, str):
            anomaly_types = [t for t in anomaly_types.split("|") if t]

        badges = []
        for atype in anomaly_types:
            label, color = anomaly_type_labels.get(atype, (atype, "light"))
            badges.append(
                dbc.Badge(label, color=color, className="me-1 mb-1", pill=True)
            )

        delay_text = ""
        if row.get("has_his_delay") and row.get("sync_delay_minutes", 0) > 0:
            delay_text = f"延迟 {row['sync_delay_minutes']:.1f} 分钟"

        caliber_text = ""
        if row.get("has_billing_caliber"):
            caliber_text = f"版本: {row.get('billing_version', '未知')}"

        review_note = row.get("review_note", "") or ""

        table_rows.append(html.Tr([
            html.Td(row.get("appointment_no", "")),
            html.Td(row.get("date_str", "")),
            html.Td(row.get("patient_name", "")),
            html.Td(row.get("doctor_name", "")),
            html.Td([
                html.Div(badges),
                html.Small([
                    delay_text if delay_text else "",
                    html.Br() if delay_text and caliber_text else "",
                    caliber_text if caliber_text else ""
                ], className="text-muted")
            ]),
            html.Td([
                html.Strong("复盘说明: ", className="text-primary") if review_note else "",
                html.Span(review_note) if review_note else html.Span("待复盘", className="text-muted fst-italic")
            ])
        ]))

    table_header = html.Thead(html.Tr([
        html.Th("预约号"),
        html.Th("日期"),
        html.Th("患者"),
        html.Th("医生"),
        html.Th("异常类型"),
        html.Th("复盘说明")
    ]))

    table_body = html.Tbody(table_rows)

    return dbc.Table(
        [table_header, table_body],
        bordered=True,
        hover=True,
        responsive=True,
        size="sm",
        className="mb-0"
    )


def create_treatment_plan_component(df_plans):
    if df_plans.empty:
        return html.Div("暂无治疗计划数据", className="text-center text-muted p-4")

    display_cols = [
        "plan_no", "plan_date", "patient_name", "appt_date",
        "plan_content", "estimated_fee", "actual_fee", "status", "cleaning_stage"
    ]
    display_data = df_plans[display_cols].copy()
    display_data.columns = [
        "计划编号", "制定日期", "患者", "关联预约日期",
        "计划内容", "预估费用", "实际费用", "状态", "洁牙阶段"
    ]

    return dash_table.DataTable(
        id="treatment-plan-table",
        data=display_data.to_dict("records"),
        columns=[{"name": c, "id": c} for c in display_data.columns],
        page_size=8,
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"padding": "8px 12px", "textAlign": "left", "whiteSpace": "normal", "height": "auto"},
        style_data_conditional=[
            {"if": {"filter_query": "{状态} = 'completed'"}, "color": "#54A24B"},
            {"if": {"filter_query": "{状态} = 'pending'"}, "color": "#F58518"}
        ]
    )


def create_follow_up_component(df_followups):
    if df_followups.empty:
        return html.Div("暂无随访任务数据", className="text-center text-muted p-4")

    display_cols = [
        "task_no", "task_date", "patient_name", "original_appt_date",
        "task_type", "assigned_to", "status", "content", "result_note"
    ]
    display_data = df_followups[display_cols].copy()
    display_data.columns = [
        "任务编号", "随访日期", "患者", "原预约日期",
        "随访类型", "负责人", "状态", "随访内容", "随访结果"
    ]

    return dash_table.DataTable(
        id="followup-table",
        data=display_data.to_dict("records"),
        columns=[{"name": c, "id": c} for c in display_data.columns],
        page_size=8,
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"padding": "8px 12px", "textAlign": "left", "whiteSpace": "normal", "height": "auto"},
        style_data_conditional=[
            {"if": {"filter_query": "{状态} = 'completed'"}, "color": "#54A24B"},
            {"if": {"filter_query": "{状态} = 'pending'"}, "color": "#F58518"},
            {"if": {"filter_query": "{状态} = 'overdue'"}, "color": "#E45756"}
        ]
    )


def create_imaging_component(df_imaging):
    if df_imaging.empty:
        return html.Div("暂无影像记录数据", className="text-center text-muted p-4")

    display_cols = [
        "image_no", "image_type", "patient_name", "appt_date",
        "image_date", "upload_status", "is_missing", "missing_note"
    ]
    display_data = df_imaging[display_cols].copy()
    display_data.columns = [
        "影像编号", "类型", "患者", "预约日期",
        "拍摄日期", "上传状态", "是否缺失", "缺失说明"
    ]

    return dash_table.DataTable(
        id="imaging-table",
        data=display_data.to_dict("records"),
        columns=[{"name": c, "id": c} for c in display_data.columns],
        page_size=8,
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"padding": "8px 12px", "textAlign": "left", "whiteSpace": "normal", "height": "auto"},
        style_data_conditional=[
            {"if": {"filter_query": "{是否缺失} = 'True'"}, "backgroundColor": "#FFE6E6", "color": "#E45756"}
        ]
    )
