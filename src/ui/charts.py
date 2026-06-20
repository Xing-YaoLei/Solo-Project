from __future__ import annotations

from typing import Optional, Any, Dict, List, Sequence

import streamlit as st
import polars as pl
import plotly.graph_objects as go
import plotly.express as px


def safe_drop_columns(df: pl.DataFrame, columns: Sequence[str]) -> pl.DataFrame:
    existing = [c for c in columns if c in df.columns]
    if not existing:
        return df
    return df.drop(existing, strict=True)


def safe_select_columns(df: pl.DataFrame, columns: Sequence[str]) -> pl.DataFrame:
    existing = [c for c in columns if c in df.columns]
    if not existing:
        return df.select([])
    return df.select(existing)


def style_dataframe(df: pl.DataFrame, height: int = 400, use_container_width: bool = True) -> None:
    pandas_df = df.to_pandas()
    st.dataframe(
        pandas_df,
        height=height,
        use_container_width=use_container_width,
        hide_index=True,
    )


def make_funnel_chart(funnel_df: pl.DataFrame) -> go.Figure:
    fig = go.Figure(
        go.Funnel(
            y=funnel_df["stage"].to_list(),
            x=funnel_df["count"].to_list(),
            marker=dict(color=funnel_df["color"].to_list()),
            textinfo="value+percent initial",
            textfont=dict(size=14),
            connector={"line": {"color": "royalblue", "dash": "dot", "width": 3}},
        )
    )
    fig.update_layout(
        title="🎫 票务核销漏斗分析",
        title_font=dict(size=18),
        margin=dict(l=20, r=20, t=60, b=20),
        height=480,
    )
    return fig


def make_timeline_chart(timeline_df: pl.DataFrame, title: str = "检票入场时间分布") -> go.Figure:
    if timeline_df.height == 0:
        return go.Figure().update_layout(title=title, height=350)

    pandas_df = timeline_df.to_pandas()
    pandas_df["time_bucket"] = pandas_df["time_bucket"].astype(str)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=pandas_df["time_bucket"],
            y=pandas_df["success_count"],
            name="成功检票",
            marker_color="#10B981",
            opacity=0.85,
        )
    )
    fig.add_trace(
        go.Bar(
            x=pandas_df["time_bucket"],
            y=pandas_df["fail_count"],
            name="失败/异常",
            marker_color="#EF4444",
            opacity=0.85,
        )
    )

    fig.update_layout(
        title=title,
        barmode="stack",
        xaxis_title="时间",
        yaxis_title="检票次数",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=350,
        margin=dict(l=20, r=20, t=60, b=80),
    )
    fig.update_xaxes(tickangle=-45)
    return fig


def make_sponsor_chart(sponsor_df: pl.DataFrame) -> go.Figure:
    if sponsor_df.height == 0:
        return go.Figure().update_layout(title="赞助商票券利用率", height=350)

    pandas_df = sponsor_df.to_pandas()
    fig = go.Figure()

    fig.add_trace(
        go.Bar(
            x=pandas_df["sponsor_name"],
            y=pandas_df["allocated_tickets"],
            name="分配票数",
            marker_color="#6366F1",
            opacity=0.6,
        )
    )
    fig.add_trace(
        go.Bar(
            x=pandas_df["sponsor_name"],
            y=pandas_df["checked_in_count"],
            name="已核销",
            marker_color="#10B981",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=pandas_df["sponsor_name"],
            y=pandas_df["utilization_rate"],
            name="利用率(%)",
            yaxis="y2",
            mode="lines+markers",
            marker=dict(color="#F59E0B", size=10),
            line=dict(width=3),
        )
    )

    fig.update_layout(
        title="🏢 赞助商票券使用情况",
        xaxis_title="赞助商",
        yaxis_title="票数",
        yaxis2=dict(title="利用率(%)", overlaying="y", side="right", range=[0, 110]),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        barmode="group",
        height=400,
        margin=dict(l=20, r=50, t=80, b=80),
    )
    fig.update_xaxes(tickangle=-30)
    return fig


def make_ticket_type_chart(tt_df: pl.DataFrame) -> go.Figure:
    if tt_df.height == 0:
        return go.Figure().update_layout(title="票种核销率分析", height=400)

    pandas_df = tt_df.to_pandas()
    fig = px.scatter(
        pandas_df,
        x="redemption_rate",
        y="total_revenue",
        size="paid_count",
        color="type_name",
        hover_name="type_name",
        hover_data={
            "sponsor_name": True,
            "price": True,
            "total_quantity": True,
            "paid_count": True,
            "refunded_count": True,
            "checked_in_count": True,
            "redemption_rate": True,
            "total_revenue": True,
        },
        size_max=60,
        opacity=0.85,
    )
    fig.update_layout(
        title="💎 票种核销与收入矩阵",
        xaxis_title="核销率 (%)",
        yaxis_title="实际收入 (元)",
        legend_title="票种",
        height=400,
        margin=dict(l=60, r=20, t=60, b=60),
    )
    return fig


def make_gate_efficiency_chart(gate_df: pl.DataFrame) -> go.Figure:
    if gate_df.height == 0:
        return go.Figure().update_layout(title="各检票口效率对比", height=350)

    pandas_df = gate_df.to_pandas()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=pandas_df["gate_name"],
            y=pandas_df["success_count"],
            name="成功",
            marker_color="#10B981",
        )
    )
    fig.add_trace(
        go.Bar(
            x=pandas_df["gate_name"],
            y=pandas_df["fail_count"],
            name="失败",
            marker_color="#EF4444",
        )
    )
    fig.update_layout(
        title="🚪 各检票口通行效率",
        barmode="stack",
        xaxis_title="检票口",
        yaxis_title="检票次数",
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=20, r=20, t=60, b=60),
    )
    return fig


def make_staff_chart(staff_df: pl.DataFrame) -> go.Figure:
    if staff_df.height == 0:
        return go.Figure().update_layout(title="检票人员绩效", height=350)

    pandas_df = staff_df.head(15).to_pandas()
    fig = go.Figure(
        go.Bar(
            x=pandas_df["staff_name"],
            y=pandas_df["total_scans"],
            marker=dict(
                color=pandas_df["success_rate"],
                colorscale="RdYlGn",
                showscale=True,
                colorbar=dict(title="成功率(%)"),
            ),
            text=pandas_df["success_rate"].apply(lambda x: f"{x}%"),
            textposition="outside",
        )
    )
    fig.update_layout(
        title="👥 检票人员绩效 TOP15",
        xaxis_title="人员",
        yaxis_title="检票总数",
        height=380,
        margin=dict(l=20, r=20, t=60, b=80),
    )
    fig.update_xaxes(tickangle=-45)
    return fig


def metric_card(
    label: str,
    value: Any,
    delta: Optional[str] = None,
    delta_color: str = "normal",
    help_text: Optional[str] = None,
) -> None:
    st.metric(
        label=label,
        value=value,
        delta=delta,
        delta_color=delta_color,
        help=help_text,
    )


def status_badge(status: str, status_type: Optional[str] = None) -> str:
    type_map = {
        "success": ("#10B981", "white"),
        "warning": ("#F59E0B", "white"),
        "error": ("#EF4444", "white"),
        "info": ("#3B82F6", "white"),
        "neutral": ("#6B7280", "white"),
    }
    if status_type and status_type in type_map:
        bg, fg = type_map[status_type]
    elif status in ["success", "paid", "active", "completed", "resolved"]:
        bg, fg = type_map["success"]
    elif status in ["pending", "processing", "in_progress"]:
        bg, fg = type_map["warning"]
    elif status in ["failed", "error", "rejected", "refunded", "cancelled"]:
        bg, fg = type_map["error"]
    else:
        bg, fg = type_map["neutral"]

    return (
        f'<span style="background-color:{bg};color:{fg};padding:3px 10px;'
        f'border-radius:12px;font-size:12px;font-weight:600;">{status}</span>'
    )
