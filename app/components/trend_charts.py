from dash import dcc, html
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from typing import Optional


def build_trend_view():
    return dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader([
                    dbc.Row([
                        dbc.Col(html.H5("入住率趋势", className="mb-0")),
                        dbc.Col([
                            dbc.Button(
                                html.I(className="bi bi-chat-square-text"),
                                id="trend-note-btn",
                                color="outline-secondary",
                                size="sm",
                                className="float-end",
                                title="添加备注"
                            )
                        ])
                    ])
                ]),
                dbc.CardBody([
                    dcc.Graph(id="occupancy-trend-chart", style={"height": "400px"})
                ])
            ], className="h-100 mb-4")
        ], md=8),
        dbc.Col([
            dbc.Card([
                dbc.CardHeader([
                    dbc.Row([
                        dbc.Col(html.H5("渠道订单占比", className="mb-0")),
                        dbc.Col([
                            dbc.Button(
                                html.I(className="bi bi-chat-square-text"),
                                id="channel-note-btn",
                                color="outline-secondary",
                                size="sm",
                                className="float-end",
                                title="添加备注"
                            )
                        ])
                    ])
                ]),
                dbc.CardBody([
                    dcc.Graph(id="channel-pie-chart", style={"height": "400px"})
                ])
            ], className="h-100 mb-4")
        ], md=4)
    ], className="mb-4")


def build_anomaly_view():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("数据质量监控", className="mb-0")),
                dbc.Col([
                    dbc.Button(
                        html.I(className="bi bi-chat-square-text"),
                        id="anomaly-note-btn",
                        color="outline-secondary",
                        size="sm",
                        className="float-end",
                        title="添加备注"
                    )
                ])
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col(md=6, children=[
                    dcc.Graph(id="anomaly-bar-chart", style={"height": "350px"})
                ]),
                dbc.Col(md=6, children=[
                    dcc.Graph(id="anomaly-severity-chart", style={"height": "350px"})
                ])
            ])
        ])
    ], className="mb-4")


def create_occupancy_trend_chart(df: pd.DataFrame, group_by: str = "day"):
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无入住率数据",
            showarrow=False,
            font={"size": 16, "color": "#999"}
        )
        return fig

    date_col = "status_date"
    if group_by == "week":
        date_col = "week"
    elif group_by == "month":
        date_col = "month"

    fig = go.Figure()

    for prop_name in df["property_name"].unique():
        prop_df = df[df["property_name"] == prop_name].sort_values(date_col)

        fig.add_trace(go.Scatter(
            x=prop_df[date_col],
            y=prop_df["occupancy_rate"],
            mode="lines+markers",
            name=prop_name,
            hovertemplate=(
                f"<b>{prop_name}</b><br>"
                "日期: %{x}<br>"
                "入住率: %{y:.1f}%<br>"
                "<extra></extra>"
            )
        ))

    if len(df["property_name"].unique()) > 1:
        overall_df = df.groupby(date_col).agg({
            "occupancy_rate": "mean",
            "occupied_count": "sum",
            "room_count": "mean"
        }).reset_index()

        fig.add_trace(go.Scatter(
            x=overall_df[date_col],
            y=overall_df["occupancy_rate"],
            mode="lines+markers",
            name="整体平均",
            line={"color": "#dc3545", "width": 3, "dash": "dash"},
            marker={"size": 8},
            hovertemplate=(
                "<b>整体平均</b><br>"
                "日期: %{x}<br>"
                "入住率: %{y:.1f}%<br>"
                "<extra></extra>"
            )
        ))

    fig.update_layout(
        xaxis_title="日期",
        yaxis_title="入住率 (%)",
        yaxis={"range": [0, 100]},
        legend={"orientation": "h", "yanchor": "bottom", "y": 1.02, "xanchor": "right", "x": 1},
        margin={"l": 60, "r": 20, "t": 40, "b": 60},
        hovermode="x unified"
    )

    fig.add_hline(
        y=60,
        line_dash="dash",
        line_color="#ffc107",
        annotation_text="基准线 60%",
        annotation_position="bottom right"
    )

    return fig


def create_channel_pie_chart(df: pd.DataFrame):
    if df.empty or "channel" not in df.columns:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无渠道订单数据",
            showarrow=False,
            font={"size": 16, "color": "#999"}
        )
        return fig

    channel_stats = df.groupby("channel").agg({
        "order_no": "count",
        "total_amount": "sum"
    }).reset_index()
    channel_stats.columns = ["渠道", "订单数", "总金额"]

    fig = px.pie(
        channel_stats,
        values="订单数",
        names="渠道",
        hole=0.4,
        title="各渠道订单分布",
        color_discrete_sequence=px.colors.qualitative.Set2
    )

    fig.update_traces(
        textposition="inside",
        textinfo="percent+label",
        hovertemplate=(
            "<b>%{label}</b><br>"
            "订单数: %{value}<br>"
            "占比: %{percent}<br>"
            "<extra></extra>"
        )
    )

    fig.update_layout(
        showlegend=True,
        legend={"orientation": "h", "yanchor": "bottom", "y": -0.1, "xanchor": "center", "x": 0.5},
        margin={"l": 20, "r": 20, "t": 60, "b": 60}
    )

    return fig


def create_anomaly_bar_chart(df: pd.DataFrame):
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无异常数据",
            showarrow=False,
            font={"size": 16, "color": "#999"}
        )
        return fig

    source_counts = df.groupby("source_table").size().reset_index(name="count")
    source_counts = source_counts.sort_values("count", ascending=True)

    label_map = {
        "ota_orders": "OTA订单",
        "payment_transactions": "收款流水",
        "door_lock_records": "门锁记录",
        "room_status": "房态"
    }
    source_zh = source_counts["source_table"].map(lambda x: label_map.get(x, x))
    source_counts = source_counts.assign(source_table=source_zh)

    fig = go.Figure(go.Bar(
        x=source_counts["count"],
        y=source_counts["source_table"],
        orientation="h",
        marker={
            "color": source_counts["count"],
            "colorscale": "Reds",
            "showscale": False
        },
        text=source_counts["count"],
        textposition="outside",
        hovertemplate=(
            "<b>%{y}</b><br>"
            "异常数: %{x}<br>"
            "<extra></extra>"
        )
    ))

    fig.update_layout(
        xaxis_title="异常数量",
        yaxis_title="数据来源",
        title="各数据源异常分布",
        margin={"l": 120, "r": 40, "t": 50, "b": 40}
    )

    return fig


def create_anomaly_severity_chart(df: pd.DataFrame):
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无异常数据",
            showarrow=False,
            font={"size": 16, "color": "#999"}
        )
        return fig

    severity_counts = df.groupby("severity").size().reset_index(name="count")
    severity_zh = severity_counts["severity"].map({
        "error": "严重错误",
        "warning": "警告",
        "info": "提示"
    })
    severity_counts = severity_counts.assign(severity=severity_zh.fillna(severity_counts["severity"]))

    color_map = {"严重错误": "#dc3545", "警告": "#ffc107", "提示": "#0d6efd"}
    colors = [color_map.get(s, "#6c757d") for s in severity_counts["severity"]]

    fig = go.Figure(go.Bar(
        x=severity_counts["severity"],
        y=severity_counts["count"],
        marker={"color": colors},
        text=severity_counts["count"],
        textposition="outside",
        hovertemplate=(
            "<b>%{x}</b><br>"
            "数量: %{y}<br>"
            "<extra></extra>"
        )
    ))

    fig.update_layout(
        xaxis_title="严重程度",
        yaxis_title="数量",
        title="异常严重程度分布",
        margin={"l": 60, "r": 40, "t": 50, "b": 40}
    )

    return fig
