from typing import Optional, Callable, Dict, Any
from datetime import datetime
import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import functools

from config import RISK_LEVELS
from .ui_components import render_error_fallback


def safe_render_chart(
    chart_func: Callable,
    component_name: str,
    last_update_time: Optional[datetime] = None,
    retry_callback: Optional[Callable] = None,
    retry_key: str = "chart_retry",
    *args,
    **kwargs,
):
    try:
        return chart_func(*args, **kwargs)
    except Exception as e:
        render_error_fallback(
            error=e,
            component_name=component_name,
            last_update_time=last_update_time,
            retry_callback=retry_callback,
            retry_key=retry_key,
        )
        return None


RISK_COLOR_MAP = {
    "低风险": "#2ecc71",
    "中风险": "#f1c40f",
    "高风险": "#e67e22",
    "极高风险": "#e74c3c",
}


def create_risk_chart(df: pl.DataFrame) -> go.Figure:
    if df.height == 0 or "risk_level" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无风险数据")
        return fig

    risk_counts = df.group_by("risk_level").agg(pl.count("project_id").alias("count")).to_pandas()

    all_risks = pl.DataFrame({"risk_level": RISK_LEVELS})
    risk_counts = (
        all_risks.join(pl.DataFrame(risk_counts), on="risk_level", how="left")
        .fill_null(0)
        .to_pandas()
    )

    fig = go.Figure(data=[
        go.Pie(
            labels=risk_counts["risk_level"],
            values=risk_counts["count"],
            hole=0.4,
            marker=dict(colors=[RISK_COLOR_MAP.get(r, "#95a5a6") for r in risk_counts["risk_level"]]),
            textinfo="label+percent+value",
            textposition="outside",
        )
    ])
    fig.update_layout(
        title="风险等级分布",
        showlegend=True,
        height=350,
        margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def create_completeness_chart(df: pl.DataFrame) -> go.Figure:
    if df.height == 0 or "overall_completeness" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无完整率数据")
        return fig

    bins = [0, 50, 70, 90, 101]
    labels = ["0-50%", "50-70%", "70-90%", "90-100%"]
    colors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71"]

    pandas_df = df.to_pandas()
    pandas_df["completeness_group"] = pandas_df["overall_completeness"].apply(
        lambda x: next((labels[i] for i in range(len(bins) - 1) if bins[i] <= x < bins[i + 1]), labels[-1])
    )
    counts = pandas_df["completeness_group"].value_counts().reindex(labels, fill_value=0)

    fig = go.Figure(data=[
        go.Bar(
            x=counts.index,
            y=counts.values,
            marker_color=colors,
            text=counts.values,
            textposition="outside",
        )
    ])
    fig.update_layout(
        title="资料完整率分布",
        xaxis_title="完整率区间",
        yaxis_title="项目数量",
        height=350,
        margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def create_region_completeness_chart(df: pl.DataFrame) -> go.Figure:
    if df.height == 0 or "region" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无区域数据")
        return fig

    grouped = df.group_by("region").agg([
        pl.mean("overall_completeness").round(2).alias("avg_completeness"),
        pl.count("project_id").alias("project_count"),
    ]).sort("avg_completeness", descending=True).to_pandas()

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=grouped["region"],
        y=grouped["avg_completeness"],
        name="平均完整率(%)",
        marker_color="#3498db",
        text=grouped["avg_completeness"],
        textposition="outside",
        yaxis="y",
    ))
    fig.add_trace(go.Scatter(
        x=grouped["region"],
        y=grouped["project_count"],
        name="项目数量",
        mode="lines+markers",
        line=dict(color="#e74c3c", width=2),
        marker=dict(size=8),
        yaxis="y2",
    ))
    fig.update_layout(
        title="各区域资料完整率对比",
        xaxis_title="区域",
        yaxis=dict(title="平均完整率(%)", range=[0, 105]),
        yaxis2=dict(title="项目数量", overlaying="y", side="right"),
        height=400,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def create_timeline_chart(df: pl.DataFrame, date_col: str = "confirmation_date") -> go.Figure:
    if df.height == 0 or date_col not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无时间序列数据")
        return fig

    pandas_df = df.to_pandas()
    pandas_df["date"] = pandas_df[date_col].dt.floor("D")

    daily = pandas_df.groupby("date").agg(
        avg_completeness=("overall_completeness", "mean"),
        project_count=("project_id", "nunique"),
    ).reset_index().sort_values("date")

    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(
        go.Scatter(
            x=daily["date"],
            y=daily["avg_completeness"].round(2),
            name="平均完整率(%)",
            mode="lines+markers",
            line=dict(color="#2ecc71", width=3),
            fill="tozeroy",
            fillcolor="rgba(46, 204, 113, 0.1)",
        ),
        secondary_y=False,
    )
    fig.add_trace(
        go.Bar(
            x=daily["date"],
            y=daily["project_count"],
            name="项目数量",
            marker_color="#3498db",
            opacity=0.6,
        ),
        secondary_y=True,
    )
    fig.update_layout(
        title="客户确认完整率趋势",
        xaxis_title="日期",
        height=400,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=10, r=10, t=50, b=10),
    )
    fig.update_yaxes(title_text="平均完整率(%)", secondary_y=False, range=[0, 105])
    fig.update_yaxes(title_text="项目数量", secondary_y=True)
    return fig


def create_mom_yoy_chart(df: pl.DataFrame, title: str = "同环比分析") -> go.Figure:
    if df.height == 0 or "current_value" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title=f"暂无{title}数据")
        return fig

    pandas_df = df.to_pandas().sort_values("month")

    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=("当期值", "同环比增长率(%)"),
        vertical_spacing=0.15,
    )

    fig.add_trace(
        go.Bar(
            x=pandas_df["month"].dt.strftime("%Y-%m"),
            y=pandas_df["current_value"],
            name="当期值",
            marker_color="#3498db",
        ),
        row=1, col=1,
    )

    if "mom_rate" in pandas_df.columns:
        fig.add_trace(
            go.Scatter(
                x=pandas_df["month"].dt.strftime("%Y-%m"),
                y=pandas_df["mom_rate"],
                name="环比(%)",
                mode="lines+markers",
                line=dict(color="#e67e22", width=2),
            ),
            row=2, col=1,
        )
    if "yoy_rate" in pandas_df.columns:
        fig.add_trace(
            go.Scatter(
                x=pandas_df["month"].dt.strftime("%Y-%m"),
                y=pandas_df["yoy_rate"],
                name="同比(%)",
                mode="lines+markers",
                line=dict(color="#9b59b6", width=2),
            ),
            row=2, col=1,
        )

    fig.update_layout(
        title=title,
        height=500,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=10, r=10, t=80, b=10),
    )
    fig.update_yaxes(title_text="数值", row=1, col=1)
    fig.update_yaxes(title_text="增长率(%)", row=2, col=1)
    return fig


def create_sync_status_chart(df: pl.DataFrame) -> go.Figure:
    if df.height == 0 or "status" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无同步状态数据")
        return fig

    status_counts = df.group_by("status").agg(pl.count("batch_id").alias("count")).to_pandas()

    color_map = {
        "成功": "#2ecc71",
        "部分成功": "#f1c40f",
        "失败": "#e74c3c",
        "同步中": "#3498db",
        "待同步": "#95a5a6",
    }

    fig = go.Figure(data=[
        go.Bar(
            x=status_counts["status"],
            y=status_counts["count"],
            marker_color=[color_map.get(s, "#95a5a6") for s in status_counts["status"]],
            text=status_counts["count"],
            textposition="outside",
        )
    ])
    fig.update_layout(
        title="同步批次状态统计",
        xaxis_title="状态",
        yaxis_title="批次数量",
        height=300,
        margin=dict(l=10, r=10, t=50, b=10),
    )
    return fig


def create_attachment_category_chart(df: pl.DataFrame) -> go.Figure:
    if df.height == 0 or "category" not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="暂无附件分类数据")
        return fig

    category_counts = df.group_by("category").agg([
        pl.count("id").alias("count"),
        pl.sum("file_size").alias("total_size"),
    ]).sort("count", descending=True).to_pandas()

    fig = go.Figure(data=[
        go.Bar(
            x=category_counts["category"],
            y=category_counts["count"],
            marker_color="#1abc9c",
            text=category_counts["count"],
            textposition="outside",
        )
    ])
    fig.update_layout(
        title="附件材料分类统计",
        xaxis_title="材料类别",
        yaxis_title="数量",
        height=350,
        xaxis_tickangle=-30,
        margin=dict(l=10, r=10, t=50, b=60),
    )
    return fig
