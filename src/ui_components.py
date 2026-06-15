from typing import Optional, Dict, Any
import streamlit as st
import polars as pl
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta

def get_color_risk(score: float, thresholds: Optional[Dict[str, float]] = None) -> str:
    if thresholds is None:
        thresholds = {"low": 10, "medium": 25, "high": 50}
    
    if score < thresholds["low"]:
        return "#4CAF50"
    elif score < thresholds["medium"]:
        return "#FFC107"
    elif score < thresholds["high"]:
        return "#FF9800"
    else:
        return "#F44336"

def render_risk_gauge(score: float, title: str = "风险指数") -> go.Figure:
    color = get_color_risk(score)
    
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=score,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 18}},
        delta={'reference': 30, 'increasing': {'color': "#F44336"}, 'decreasing': {'color': "#4CAF50"}},
        gauge={
            'axis': {'range': [None, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
            'bar': {'color': color},
            'bgcolor': "white",
            'borderwidth': 2,
            'bordercolor': "gray",
            'steps': [
                {'range': [0, 10], 'color': '#E8F5E9'},
                {'range': [10, 25], 'color': '#FFF9C4'},
                {'range': [25, 50], 'color': '#FFE0B2'},
                {'range': [50, 100], 'color': '#FFEBEE'}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 50
            }
        }
    ))
    
    fig.update_layout(height=250)
    return fig

def render_metric_card(label: str, value: Any, delta: Optional[float] = None, 
                        delta_label: str = "环比") -> None:
    if delta is not None:
        delta_color = "normal" if delta >= 0 else "inverse"
        st.metric(label, value, f"{delta:+.2f}% ({delta_label})", delta_color=delta_color)
    else:
        st.metric(label, value)

def render_colored_dataframe(df: pl.DataFrame, color_col: str = "row_color", 
                              highlight_col: str = "highlight") -> None:
    if len(df) == 0:
        st.info("暂无数据")
        return
    
    pandas_df = df.to_pandas()
    
    if color_col in df.columns and highlight_col in df.columns:
        def highlight_rows(row):
            return [f'background-color: {row[color_col]}' for _ in row]
        
        styled = pandas_df.style.apply(highlight_rows, axis=1)
        st.dataframe(styled, use_container_width=True, hide_index=True)
    else:
        st.dataframe(pandas_df, use_container_width=True, hide_index=True)

def render_trend_chart(df: pl.DataFrame, x_col: str, y_col: str, 
                        color_col: Optional[str] = None, 
                        title: str = "趋势图",
                        y_label: str = "数值") -> go.Figure:
    pandas_df = df.to_pandas()
    
    if color_col and color_col in df.columns:
        fig = px.line(pandas_df, x=x_col, y=y_col, color=color_col,
                      markers=True, title=title)
    else:
        fig = px.line(pandas_df, x=x_col, y=y_col, markers=True, title=title)
    
    fig.update_layout(
        xaxis_title="日期",
        yaxis_title=y_label,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    return fig

def render_bar_chart(df: pl.DataFrame, x_col: str, y_col: str, 
                      color_col: Optional[str] = None,
                      title: str = "柱状图",
                      orientation: str = "v") -> go.Figure:
    pandas_df = df.to_pandas()
    
    if color_col and color_col in df.columns:
        fig = px.bar(pandas_df, x=x_col, y=y_col, color=color_col,
                     title=title, orientation=orientation)
    else:
        fig = px.bar(pandas_df, x=x_col, y=y_col, title=title, orientation=orientation)
    
    fig.update_layout(
        xaxis_title=x_col,
        yaxis_title=y_col,
        barmode="group"
    )
    return fig

def render_pie_chart(df: pl.DataFrame, names_col: str, values_col: str,
                      title: str = "占比图") -> go.Figure:
    pandas_df = df.to_pandas()
    fig = px.pie(pandas_df, names=names_col, values=values_col, title=title)
    fig.update_traces(textposition='inside', textinfo='percent+label')
    return fig

def render_region_selector(regions: list, default_all: bool = True) -> list:
    col1, col2 = st.columns([1, 3])
    with col1:
        select_all = st.checkbox("全选区域", value=default_all)
    with col2:
        if select_all:
            selected = st.multiselect("选择区域", regions, default=regions)
        else:
            selected = st.multiselect("选择区域", regions, default=[])
    return selected

def render_date_range_selector(default_days: int = 30) -> tuple:
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input("开始日期", value=datetime.now() - timedelta(days=default_days))
    with col2:
        end_date = st.date_input("结束日期", value=datetime.now())
    return start_date, end_date

def render_sync_status_indicator(status: str) -> None:
    status_colors = {
        "completed": ("#4CAF50", "✓ 完成"),
        "running": ("#2196F3", "⏳ 运行中"),
        "failed": ("#F44336", "✗ 失败"),
        "pending": ("#9E9E9E", "○ 待执行")
    }
    color, icon = status_colors.get(status, ("#9E9E9E", status))
    st.markdown(f'<span style="color:{color};font-weight:bold;">{icon}</span>', unsafe_allow_html=True)

def render_audit_trail(nodes: list) -> None:
    for node in nodes:
        col1, col2, col3, col4 = st.columns([1, 3, 2, 2])
        with col1:
            render_sync_status_indicator(node["status"])
        with col2:
            st.write(f"**{node['name']}**")
            st.caption(node.get("description", ""))
        with col3:
            st.write(f"处理: {node.get('records_processed', 0)} 条")
            if node.get("start_time") and node.get("end_time"):
                duration = (node["end_time"] - node["start_time"]).total_seconds()
                st.caption(f"耗时: {duration:.2f}s")
        with col4:
            if node.get("error"):
                st.error(node["error"])
            elif node.get("source_hash") and node.get("target_hash"):
                if node["source_hash"] == node["target_hash"]:
                    st.success("✓ 数据一致")
                else:
                    st.warning("⚠ 哈希不一致")
        st.divider()

def render_yoy_mom_indicator(current: float, previous: float, label: str) -> None:
    if previous == 0:
        change_pct = 0
    else:
        change_pct = (current - previous) / previous * 100
    
    delta_color = "normal" if change_pct >= 0 else "inverse"
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(f"{label}(本期)", f"{current:,.2f}")
    with col2:
        st.metric(f"{label}(上期)", f"{previous:,.2f}")
    with col3:
        st.metric("变动", f"{change_pct:+.2f}%", delta_color=delta_color)
