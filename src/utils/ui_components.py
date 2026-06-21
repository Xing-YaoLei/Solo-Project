import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import polars as pl
from typing import Optional, List, Dict, Any
from datetime import datetime

from src.utils.analyzer import YoYMoMResult


def render_metric_card(title: str, value: Any, suffix: str = "",
                       yoy_result: Optional[YoYMoMResult] = None,
                       help_text: str = ""):
    delta = None
    delta_color = "normal"
    if yoy_result:
        sign = "+" if yoy_result.change_rate >= 0 else ""
        delta = f"{sign}{yoy_result.change_rate}% 环比"
        delta_color = "normal" if yoy_result.is_positive else "inverse"

    st.metric(
        label=title,
        value=f"{value}{suffix}",
        delta=delta,
        delta_color=delta_color,
        help=help_text,
    )


def render_delay_banner(delay_info: List[Dict[str, Any]]):
    delayed_sources = [s for s in delay_info if s.get("is_delayed")]
    if not delayed_sources:
        return

    for source in delayed_sources:
        source_name = source.get("source_name", "未知数据源")
        delay_hours = source.get("delay_hours", 0)
        st.warning(
            f"⚠️ **{source_name}** 数据同步延迟约 {delay_hours} 小时，"
            f"可能影响近期趋势判断，请注意甄别。"
        )


def plot_line_chart(df: pl.DataFrame, x_col: str, y_cols: List[str],
                    title: str = "", y_title: str = "",
                    delay_points: Optional[List[datetime]] = None,
                    delay_annotations: Optional[List[Dict[str, Any]]] = None):
    if df.is_empty():
        st.info("暂无数据")
        return

    fig = go.Figure()

    color_map = {
        "submit_count": "#3b82f6",
        "return_count": "#ef4444",
        "publish_count": "#22c55e",
        "total_risk_words": "#f59e0b",
        "scheduled_count": "#8b5cf6",
        "published_count": "#22c55e",
    }

    name_map = {
        "submit_count": "提交数",
        "return_count": "退回数",
        "publish_count": "发布数",
        "total_risk_words": "风险词总数",
        "scheduled_count": "排期数",
        "published_count": "已发布数",
    }

    for col in y_cols:
        fig.add_trace(go.Scatter(
            x=df[x_col].to_list(),
            y=df[col].to_list(),
            mode="lines+markers",
            name=name_map.get(col, col),
            line=dict(color=color_map.get(col, None), width=2),
            marker=dict(size=4),
        ))

    if delay_annotations:
        for ann in delay_annotations:
            dp = ann.get("date")
            label = ann.get("label", "数据延迟")
            detail = ann.get("detail", "")
            text = label
            if detail:
                text = f"{label}<br>{detail}"
            fig.add_shape(
                type="line",
                x0=dp,
                x1=dp,
                y0=0,
                y1=1,
                yref="paper",
                line=dict(
                    color="orange",
                    width=2,
                    dash="dash",
                ),
            )
            fig.add_annotation(
                x=dp,
                y=1,
                yref="paper",
                text=text,
                showarrow=False,
                yshift=10,
                font=dict(color="orange", size=10),
                bgcolor="rgba(255,255,255,0.85)",
                bordercolor="orange",
                borderwidth=1,
                borderpad=3,
            )
    elif delay_points:
        for dp in delay_points:
            fig.add_shape(
                type="line",
                x0=dp,
                x1=dp,
                y0=0,
                y1=1,
                yref="paper",
                line=dict(
                    color="orange",
                    width=2,
                    dash="dash",
                ),
            )
            fig.add_annotation(
                x=dp,
                y=1,
                yref="paper",
                text="数据延迟",
                showarrow=False,
                yshift=10,
                font=dict(color="orange"),
            )

    fig.update_layout(
        title=title,
        xaxis_title="日期",
        yaxis_title=y_title,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=0, r=0, t=40, b=0),
        height=300,
    )

    st.plotly_chart(fig, use_container_width=True)


def plot_bar_chart(df: pl.DataFrame, x_col: str, y_col: str,
                   color_col: Optional[str] = None, title: str = "",
                   orientation: str = "v"):
    if df.is_empty():
        st.info("暂无数据")
        return

    if orientation == "h":
        fig = px.bar(
            df.to_pandas(),
            y=x_col,
            x=y_col,
            color=color_col,
            title=title,
            orientation="h",
        )
    else:
        fig = px.bar(
            df.to_pandas(),
            x=x_col,
            y=y_col,
            color=color_col,
            title=title,
        )

    fig.update_layout(
        margin=dict(l=0, r=0, t=40, b=0),
        height=300,
        showlegend=True if color_col else False,
    )

    st.plotly_chart(fig, use_container_width=True)


def plot_funnel(df: pl.DataFrame, stage_col: str, value_col: str,
                rate_col: Optional[str] = None, title: str = ""):
    if df.is_empty():
        st.info("暂无数据")
        return

    fig = go.Figure(go.Funnel(
        y=df[stage_col].to_list(),
        x=df[value_col].to_list(),
        textinfo="value+percent initial",
        marker=dict(
            color=["#3b82f6", "#60a5fa", "#22c55e", "#f59e0b", "#8b5cf6"]
        ),
        connector={"fillcolor": "#e5e7eb"},
    ))

    fig.update_layout(
        title=title,
        margin=dict(l=0, r=0, t=40, b=0),
        height=350,
    )

    st.plotly_chart(fig, use_container_width=True)


def plot_pie_chart(df: pl.DataFrame, names_col: str, values_col: str,
                   title: str = ""):
    if df.is_empty():
        st.info("暂无数据")
        return

    fig = px.pie(
        df.to_pandas(),
        names=names_col,
        values=values_col,
        title=title,
        hole=0.4,
    )

    fig.update_layout(
        margin=dict(l=0, r=0, t=40, b=0),
        height=300,
        showlegend=True,
    )

    st.plotly_chart(fig, use_container_width=True)


def styled_dataframe(df: pl.DataFrame, height: int = 400,
                     use_container_width: bool = True):
    if df.is_empty():
        st.info("暂无数据")
        return

    st.dataframe(
        df.to_pandas(),
        use_container_width=use_container_width,
        height=height,
        hide_index=True,
    )
