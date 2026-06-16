from dash import Input, Output, State, callback, dash_table, dcc, html
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
from datetime import date, timedelta
import pandas as pd
import numpy as np
from etl.data_service import DataService
from config.settings import settings

data_service = DataService()


@callback(
    [
        Output("risk-score", "children"),
        Output("risk-score-change", "children"),
        Output("avg-completion", "children"),
        Output("avg-delay", "children"),
        Output("unresolved-anomalies", "children"),
        Output("risk-monitor-chart", "figure"),
        Output("anomalies-table", "data"),
        Output("metrics-accordion", "children"),
        Output("refresh-status", "children"),
    ],
    [
        Input("date-range-dropdown", "value"),
        Input("metrics-dropdown", "value"),
        Input("refresh-btn", "n_clicks"),
        Input("auto-refresh-interval", "n_intervals"),
    ],
)
def update_risk_monitor(date_range, selected_metrics, n_clicks, n_intervals):
    metrics_df, anomalies_df = data_service.get_risk_monitor_data(days=date_range)
    stats = data_service.get_summary_stats(metrics_df)

    risk_score = f"{stats.get('latest_risk_score', 0):.1f}"
    score_change = stats.get('risk_score_change', 0)
    if score_change > 0:
        score_text = f"↑ {score_change:.1f} 较昨日"
        score_style = {"color": "green"}
    elif score_change < 0:
        score_text = f"↓ {abs(score_change):.1f} 较昨日"
        score_style = {"color": "red"}
    else:
        score_text = "与昨日持平"
        score_style = {"color": "gray"}

    avg_completion = f"{stats.get('avg_completion_rate', 0):.1f}%"
    avg_delay = f"{stats.get('avg_delay_rate', 0):.1f}%"
    unresolved = stats.get('unresolved_anomalies', 0)

    fig = create_risk_monitor_chart(metrics_df, anomalies_df, selected_metrics)

    anomalies_data = anomalies_df.to_dict('records') if not anomalies_df.empty else []

    accordion_items = create_metrics_accordion()

    refresh_status = html.Div([
        dbc.Alert(
            f"数据已刷新 - 最后更新: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}",
            color="success",
            dismissable=True,
            duration=3000,
        )
    ])

    return (
        risk_score,
        html.Span(score_text, style=score_style),
        avg_completion,
        avg_delay,
        unresolved,
        fig,
        anomalies_data,
        accordion_items,
        refresh_status,
    )


def create_risk_monitor_chart(metrics_df, anomalies_df, selected_metrics):
    if metrics_df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无数据，请先生成模拟数据或连接真实数据库",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16)
        )
        return fig

    metric_colors = {
        "训练完成率": "#2ecc71",
        "收费表延迟率": "#f39c12",
        "病历完整度": "#3498db",
        "打卡一致性": "#9b59b6",
        "医保拒付率": "#e74c3c",
        "综合风险评分": "#1abc9c",
    }

    fig = go.Figure()

    if isinstance(selected_metrics, str):
        selected_metrics = [selected_metrics]

    if "all" in selected_metrics or not selected_metrics:
        metric_columns = ["训练完成率", "收费表延迟率", "病历完整度", "打卡一致性", "医保拒付率"]
    else:
        metric_columns = [m for m in selected_metrics if m != "all" and m in metric_colors]

    for metric in metric_columns:
        if metric in metrics_df.columns:
            fig.add_trace(go.Scatter(
                x=metrics_df["date"],
                y=metrics_df[metric],
                name=metric,
                mode="lines+markers",
                line=dict(color=metric_colors.get(metric, "#333"), width=2),
                marker=dict(size=8),
                hovertemplate=f"{metric}: %{{y:.1f}}%<br>日期: %{{x}}<extra></extra>",
            ))

    fig.add_trace(go.Scatter(
        x=metrics_df["date"],
        y=metrics_df["综合风险评分"],
        name="综合风险评分",
        mode="lines",
        line=dict(color=metric_colors["综合风险评分"], width=3, dash="dash"),
        hovertemplate=f"综合风险评分: %{{y:.1f}}<br>日期: %{{x}}<extra></extra>",
    ))

    anomaly_type_shapes = {
        "收费表延迟": "triangle-up",
        "病历系统缺失": "square",
        "打卡记录口径变化": "diamond",
        "医保拒付": "x",
    }

    anomaly_type_colors = {
        "收费表延迟": "#f39c12",
        "病历系统缺失": "#e67e22",
        "打卡记录口径变化": "#9b59b6",
        "医保拒付": "#e74c3c",
    }

    if not anomalies_df.empty:
        for anomaly_type in anomalies_df["anomaly_type"].unique():
            type_anomalies = anomalies_df[anomalies_df["anomaly_type"] == anomaly_type]

            y_positions = []
            for _, row in type_anomalies.iterrows():
                anomaly_date = row["date"]
                if anomaly_date in metrics_df["date"].values:
                    metric_val = metrics_df[metrics_df["date"] == anomaly_date]["综合风险评分"].values[0]
                else:
                    metric_val = metrics_df["综合风险评分"].min() if not metrics_df.empty else 50
                y_positions.append(metric_val + 5)

            fig.add_trace(go.Scatter(
                x=type_anomalies["date"],
                y=y_positions,
                name=f"⚠️ {anomaly_type}",
                mode="markers+text",
                marker=dict(
                    symbol=anomaly_type_shapes.get(anomaly_type, "circle"),
                    size=14,
                    color=anomaly_type_colors.get(anomaly_type, "#e74c3c"),
                    line=dict(width=2, color="white"),
                ),
                text=type_anomalies["severity"].apply(lambda x: "🔴" if x == "high" else "🟠"),
                textposition="top center",
                hovertemplate=f"{anomaly_type}<br>%{{x}}<br>%{{customdata}}<extra></extra>",
                customdata=type_anomalies["description"],
                showlegend=True,
            ))

            for _, row in type_anomalies.iterrows():
                fig.add_vline(
                    x=row["date"],
                    line_dash="dot",
                    line_color=anomaly_type_colors.get(anomaly_type, "#e74c3c"),
                    opacity=0.5,
                )

    fig.update_layout(
        title="康复评估风险监测趋势图",
        xaxis_title="日期",
        yaxis_title="百分比 (%) / 评分",
        hovermode="x unified",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
        ),
        margin=dict(l=50, r=50, t=80, b=50),
        height=500,
    )

    fig.update_xaxes(
        rangeslider_visible=True,
        rangeselector=dict(
            buttons=list([
                dict(count=7, label="1周", step="day", stepmode="backward"),
                dict(count=14, label="2周", step="day", stepmode="backward"),
                dict(count=30, label="1月", step="day", stepmode="backward"),
                dict(step="all", label="全部"),
            ])
        ),
    )

    fig.add_hline(
        y=80,
        line_dash="dash",
        line_color="green",
        annotation_text="优秀阈值",
        annotation_position="right",
    )

    fig.add_hrect(
        y0=0, y1=60,
        fillcolor="red",
        opacity=0.1,
        layer="below",
        annotation_text="高风险区域",
        annotation_position="right",
    )

    return fig


def create_metrics_accordion():
    definitions = data_service.get_metrics_definitions()
    items = []

    for key, definition in definitions.items():
        body = html.Div([
            html.Strong("计算公式："),
            html.P(definition["formula"]),
            html.Strong("指标描述："),
            html.P(definition["description"]),
            html.Strong("数据来源："),
            html.P(", ".join(definition["data_sources"])),
        ])

        items.append(dbc.AccordionItem(
            title=f"{definition['name']} ({key})",
            children=body,
        ))

    return items


@callback(
    Output("download-csv", "data"),
    Input("download-btn", "n_clicks"),
    State("date-range-dropdown", "value"),
    prevent_initial_call=True,
)
def download_csv(n_clicks, date_range):
    if n_clicks is None:
        return None

    metrics_df, anomalies_df = data_service.get_risk_monitor_data(days=date_range)

    if metrics_df.empty:
        return dict(content="暂无数据可导出", filename="rehab_data_empty.csv")

    csv_content = data_service.generate_download_csv(metrics_df, anomalies_df)
    filename = f"康复评估风险监测数据_{date.today().strftime('%Y%m%d')}.csv"

    return dict(
        content=csv_content,
        filename=filename,
        type="text/csv",
        encoding="utf-8-sig",
    )


@callback(
    [
        Output("treatment-calendar-chart", "figure"),
        Output("treatment-details-table", "data"),
    ],
    Input("calendar-days", "value"),
)
def update_treatment_calendar(days):
    df = data_service.get_treatment_calendar(days=days)

    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无治疗数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16)
        )
        return fig, []

    pivot_df = df.pivot_table(
        index="date",
        columns="treatment_type",
        values="duration",
        aggfunc="sum",
        fill_value=0,
    ).reset_index()

    fig = go.Figure()

    treatment_types = [c for c in pivot_df.columns if c != "date"]
    colors = px.colors.qualitative.Set3[:len(treatment_types)]

    for i, t_type in enumerate(treatment_types):
        fig.add_trace(go.Bar(
            x=pivot_df["date"],
            y=pivot_df[t_type],
            name=t_type,
            marker_color=colors[i],
        ))

    fig.update_layout(
        title="治疗日历 - 各类型治疗时长分布",
        xaxis_title="日期",
        yaxis_title="总时长(分钟)",
        barmode="stack",
        hovermode="x unified",
    )

    for _, row in df[df["pain_reduction"].notna()].iterrows():
        if row["pain_reduction"] > 2:
            fig.add_annotation(
                x=row["date"],
                y=0,
                text=f"👍",
                showarrow=True,
                arrowhead=1,
                ax=0,
                ay=-20,
            )

    table_data = df.to_dict("records")

    return fig, table_data


@callback(
    [
        Output("equipment-status-chart", "figure"),
        Output("equipment-details-table", "data"),
        Output("equipment-stats-cards", "children"),
    ],
    Input("url", "pathname"),
)
def update_equipment_status(pathname):
    if pathname != "/equipment":
        return go.Figure(), [], []

    df = data_service.get_equipment_status()

    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无器械数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16)
        )
        return fig, [], []

    status_counts = df.groupby("status").size().reset_index(name="count")
    status_names = {"active": "正常使用", "maintenance": "维护中", "broken": "故障"}
    status_counts["status_name"] = status_counts["status"].map(status_names)

    fig = go.Figure(go.Pie(
        labels=status_counts["status_name"],
        values=status_counts["count"],
        hole=0.4,
        marker=dict(colors=["#2ecc71", "#f39c12", "#e74c3c"]),
        textinfo="label+percent",
    ))

    fig.update_layout(title="器械状态分布")

    utilization_fig = go.Figure(go.Bar(
        x=df["name"],
        y=df["utilization_rate"],
        marker_color=df["utilization_rate"].apply(
            lambda x: "#2ecc71" if x >= 80 else ("#f39c12" if x >= 50 else "#e74c3c")
        ),
    ))

    utilization_fig.update_layout(
        title="器械使用率",
        xaxis_title="器械名称",
        yaxis_title="使用率(%)",
        yaxis_range=[0, 100],
    )

    total_equipment = len(df)
    active_count = len(df[df["status"] == "active"])
    avg_utilization = df["utilization_rate"].mean()
    maintenance_soon = len(df[df["next_maintenance"].notna()])

    stats_cards = [
        dbc.Card(dbc.CardBody([
            html.H6("器械总数"),
            html.H3(total_equipment, className="text-primary"),
        ]), className="mb-2"),
        dbc.Card(dbc.CardBody([
            html.H6("正常使用"),
            html.H3(active_count, className="text-success"),
        ]), className="mb-2"),
        dbc.Card(dbc.CardBody([
            html.H6("平均使用率"),
            html.H3(f"{avg_utilization:.1f}%", className="text-info"),
        ]), className="mb-2"),
        dbc.Card(dbc.CardBody([
            html.H6("待维护"),
            html.H3(maintenance_soon, className="text-warning"),
        ]), className="mb-2"),
    ]

    table_data = df.to_dict("records")

    return utilization_fig, table_data, stats_cards


@callback(
    [
        Output("nursing-summary-chart", "figure"),
        Output("nursing-logs-table", "data"),
    ],
    Input("nursing-days", "value"),
)
def update_nursing_logs(days):
    df = data_service.get_nursing_logs(days=days)

    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无护理日志数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16)
        )
        return fig, []

    daily_summary = df.groupby("date").agg(
        total_logs=("date", "count"),
        abnormal_count=("has_abnormalities", "sum"),
    ).reset_index()

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=daily_summary["date"],
        y=daily_summary["total_logs"],
        name="护理记录数",
        marker_color="#3498db",
    ))

    fig.add_trace(go.Bar(
        x=daily_summary["date"],
        y=daily_summary["abnormal_count"],
        name="异常记录数",
        marker_color="#e74c3c",
    ))

    fig.update_layout(
        title="每日护理记录统计",
        xaxis_title="日期",
        yaxis_title="记录数",
        barmode="group",
    )

    table_data = df.to_dict("records")

    return fig, table_data
