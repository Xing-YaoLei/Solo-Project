import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from typing import Optional

from config import Config


STATUS_COLORS = {"正常": "#2ECC71", "预警": "#F39C12", "严重": "#E74C3C"}
STATUS_PALETTE = {"normal": "#2ECC71", "warning": "#F39C12", "critical": "#E74C3C"}


def create_arrival_status_chart(df_status: pd.DataFrame) -> go.Figure:
    if df_status.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无到场状态数据")
        return fig

    fig = px.pie(
        df_status,
        names="arrival_status",
        values="count",
        hole=0.45,
        color="arrival_status",
        color_discrete_map=STATUS_COLORS,
        title="到场状态分布",
    )
    fig.update_traces(
        textinfo="label+percent+value",
        textfont_size=13,
        marker=dict(line=dict(color="white", width=2)),
    )
    fig.update_layout(
        legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5),
        margin=dict(l=20, r=20, t=60, b=20),
        height=380,
    )
    return fig


def create_reminder_funnel_chart(df_funnel: pd.DataFrame) -> go.Figure:
    if df_funnel.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无漏斗数据")
        return fig

    fig = go.Figure(go.Funnel(
        y=df_funnel["stage"].tolist(),
        x=df_funnel["count"].tolist(),
        textposition="inside",
        textinfo="value+percent initial",
        opacity=0.9,
        marker={
            "color": ["#3498DB", "#5DADE2", "#85C1E9", "#2ECC71", "#27AE60", "#F39C12"],
            "line": {"width": [3, 2, 2, 2, 2, 3], "color": ["#2874A6", "#fff"] * 3},
        },
        connector={"line": {"color": "#BDC3C7", "dash": "solid", "width": 2}},
    ))
    fig.update_layout(
        title=dict(
            text="预约漏斗转化（围绕预约人群追踪，消费仅统计关联预约订单）",
            font=dict(size=14),
        ),
        margin=dict(l=20, r=20, t=60, b=20),
        height=380,
    )
    return fig


def create_timeslot_heatmap(df_rank: pd.DataFrame) -> go.Figure:
    if df_rank.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无时段排行数据")
        return fig

    pivot = df_rank.pivot(index="zone", columns="time_slot", values="checked_in").fillna(0)
    ordered_slots = [s for s in Config.TIME_SLOTS if s in pivot.columns]
    pivot = pivot.reindex(columns=ordered_slots)

    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=pivot.columns.tolist(),
        y=pivot.index.tolist(),
        colorscale="YlOrRd",
        hoverongaps=False,
        text=pivot.values.astype(int),
        texttemplate="%{text}",
        hovertemplate="区域: %{y}<br>时段: %{x}<br>到场人数: %{z}<extra></extra>",
    ))
    fig.update_layout(
        title="日历时段到场人数排行（热力图）",
        xaxis_title="时段",
        yaxis_title="区域",
        margin=dict(l=100, r=20, t=60, b=20),
        height=420,
    )
    return fig


def create_capacity_change_chart(df_capacity: pd.DataFrame) -> go.Figure:
    if df_capacity.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无容量规则变化数据")
        return fig

    df = df_capacity.copy()
    df = df.assign(
        date_str=pd.to_datetime(df["date"]).dt.strftime("%m-%d"),
    )
    df = df.assign(
        label=df["date_str"] + " " + df["time_slot"],
    )

    rule_type_colors = {
        "normal": "#3498DB",
        "holiday": "#E67E22",
        "weather": "#9B59B6",
        "emergency": "#E74C3C",
    }
    df = df.assign(
        color=df["rule_type"].map(rule_type_colors).fillna("#95A5A6")
    )

    fig = go.Figure()
    for zone in df["zone"].unique():
        zdf = df[df["zone"] == zone]
        fig.add_trace(go.Scatter(
            x=zdf["label"],
            y=zdf["max_capacity"],
            mode="lines+markers",
            name=zone,
            marker=dict(size=9, color=zdf["color"].tolist(), line=dict(width=1, color="white")),
            line=dict(width=2),
            hovertemplate=(
                "区域: " + zone + "<br>日期时段: %{x}<br>最大容量: %{y}<br>"
                + "阈值: %{customdata[0]}<br>规则类型: %{customdata[1]}<br>原因: %{customdata[2]}<extra></extra>"
            ),
            customdata=zdf[["warning_threshold", "rule_type", "reason"]].values.tolist(),
        ))

    fig.update_layout(
        title="容量规则变化趋势",
        xaxis_title="日期-时段",
        yaxis_title="最大容量（人）",
        legend_title="区域",
        hovermode="x unified",
        margin=dict(l=60, r=20, t=60, b=120),
        height=420,
    )
    fig.update_xaxes(tickangle=-45)
    return fig


def create_kpi_cards(df: pd.DataFrame) -> list:
    if df.empty:
        return ["—", "—", "—", "—", "—", "—", "—", "—"]
    total_resv = int(df["reservation_count"].sum())
    total_checkin = int(df["checked_in"].sum())
    total_consume_linked = int(df["consumed"].sum())
    avg_rate = df["checkin_rate"].mean() if "checkin_rate" in df.columns else 0

    camera_flow = int(df["camera_total_flow"].sum()) if "camera_total_flow" in df.columns else 0
    merchant_visitors = int(df["merchant_total_visitors"].sum()) if "merchant_total_visitors" in df.columns else 0
    merchant_amount = float(df["merchant_total_amount"].sum()) if "merchant_total_amount" in df.columns else 0.0

    return [
        f"{total_resv:,}",
        f"{total_checkin:,}",
        f"{total_consume_linked:,}",
        f"{avg_rate * 100:.1f}%" if avg_rate else "0.0%",
        f"{camera_flow:,}",
        f"{merchant_visitors:,}",
        f"¥{merchant_amount:,.0f}",
    ]


def create_zone_rate_bar(df_zone: pd.DataFrame) -> go.Figure:
    if df_zone.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无区域到场率数据")
        return fig

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df_zone["zone"],
        y=df_zone["avg_checkin_rate"] * 100,
        name="平均到场率(%)",
        marker_color="#3498DB",
        text=[f"{v * 100:.1f}%" for v in df_zone["avg_checkin_rate"]],
        textposition="outside",
    ))
    fig.add_trace(go.Bar(
        x=df_zone["zone"],
        y=df_zone["avg_conversion_rate"] * 100,
        name="消费转化率(%)",
        marker_color="#F39C12",
        text=[f"{v * 100:.1f}%" for v in df_zone["avg_conversion_rate"]],
        textposition="outside",
    ))
    fig.update_layout(
        barmode="group",
        title="各区域到场率与转化率",
        yaxis_title="百分比(%)",
        legend_title="指标",
        margin=dict(l=60, r=20, t=60, b=80),
        height=380,
    )
    fig.update_xaxes(tickangle=-30)
    return fig


def create_pending_reminder_bar(df_pending: pd.DataFrame) -> go.Figure:
    if df_pending.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无待提醒名单")
        return fig

    top = df_pending.head(15).copy()
    top = top.assign(label=top["zone"] + " " + top["time_slot"])

    fig = go.Figure(go.Bar(
        x=top["pending_reminder"],
        y=top["label"],
        orientation="h",
        marker_color="#E74C3C",
        text=top["pending_reminder"].astype(str),
        textposition="outside",
        hovertemplate=(
            "%{y}<br>待提醒: %{x}人<br>"
            "预约: %{customdata[0]} 到场: %{customdata[1]}<br>"
            "到场率: %{customdata[2]:.1%}<extra></extra>"
        ),
        customdata=top[["reservation_count", "checked_in", "checkin_rate"]].values.tolist(),
    ))
    fig.update_layout(
        title="待重点提醒名单 TOP15（提醒未到场）",
        xaxis_title="待提醒人数",
        margin=dict(l=160, r=20, t=60, b=20),
        height=420,
        yaxis=dict(autorange="reversed"),
    )
    return fig
