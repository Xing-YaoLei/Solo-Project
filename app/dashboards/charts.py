import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from typing import Optional


COLOR_PRIMARY = "#2563EB"
COLOR_SUCCESS = "#10B981"
COLOR_WARNING = "#F59E0B"
COLOR_DANGER = "#EF4444"
COLOR_INFO = "#3B82F6"
COLOR_SECONDARY = "#6B7280"


def _apply_theme(fig: go.Figure) -> go.Figure:
    fig.update_layout(
        paper_bgcolor="white",
        plot_bgcolor="#F9FAFB",
        font=dict(family="PingFang SC, Microsoft YaHei, sans-serif", size=12),
        margin=dict(l=40, r=20, t=40, b=40),
        xaxis=dict(showgrid=True, gridcolor="#E5E7EB"),
        yaxis=dict(showgrid=True, gridcolor="#E5E7EB"),
    )
    return fig


def create_trend_chart(df: pd.DataFrame, title: str = "处方审核趋势") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df["date"], y=df["total"], name="处方总数",
        marker_color=COLOR_PRIMARY, opacity=0.8,
    ))
    fig.add_trace(go.Scatter(
        x=df["date"], y=df["approved"], name="审核通过",
        mode="lines+markers", line=dict(color=COLOR_SUCCESS, width=2),
        marker=dict(size=6),
    ))
    fig.add_trace(go.Scatter(
        x=df["date"], y=df["rejected"], name="审核驳回",
        mode="lines+markers", line=dict(color=COLOR_DANGER, width=2),
        marker=dict(size=6),
    ))
    fig.update_layout(
        title=title,
        barmode="group",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_theme(fig)


def create_amount_trend(df: pd.DataFrame, title: str = "处方金额趋势") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["date"], y=df["amount"],
        fill="tozeroy", mode="lines",
        line=dict(color=COLOR_INFO, width=2),
        fillcolor="rgba(59, 130, 246, 0.15)",
        name="处方金额",
    ))
    fig.update_layout(title=title)
    return _apply_theme(fig)


def create_photo_distribution_chart(df: pd.DataFrame, title: str = "处方照片数量分布") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    aggregated = df.groupby("photo_count_label", as_index=False).agg({
        "prescription_count": "sum",
        "unclear_count": "sum",
    })
    aggregated["clear_count"] = aggregated["prescription_count"] - aggregated["unclear_count"]

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=aggregated["photo_count_label"],
        y=aggregated["clear_count"],
        name="照片清晰",
        marker_color=COLOR_SUCCESS,
    ))
    fig.add_trace(go.Bar(
        x=aggregated["photo_count_label"],
        y=aggregated["unclear_count"],
        name="照片不清晰",
        marker_color=COLOR_WARNING,
    ))
    fig.update_layout(
        title=title,
        barmode="stack",
        xaxis_title="照片张数",
        yaxis_title="处方数",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_theme(fig)


def create_photo_quality_pie(df: pd.DataFrame, title: str = "照片质量分布") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    fig = go.Figure(data=[go.Pie(
        labels=df["quality"],
        values=df["count"],
        hole=0.45,
        marker=dict(colors=[COLOR_SUCCESS, COLOR_WARNING]),
        textinfo="label+percent",
    )])
    fig.update_layout(title=title)
    return _apply_theme(fig)


def create_pharmacist_funnel(df: pd.DataFrame, title: str = "药师审核意见漏斗") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    colors = [
        COLOR_SUCCESS, COLOR_INFO, COLOR_WARNING,
        COLOR_DANGER, "#8B5CF6", COLOR_SECONDARY, "#F97316",
    ]
    fig = go.Figure(go.Funnel(
        y=df["opinion_label"],
        x=df["count"],
        textposition="inside",
        textinfo="value+percent initial",
        marker=dict(color=colors[:len(df)]),
    ))
    fig.update_layout(title=title)
    return _apply_theme(fig)


def create_expiry_ranking_chart(df: pd.DataFrame, title: str = "批号效期排行（近效期）") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    color_map = {"严重": COLOR_DANGER, "警告": COLOR_WARNING, "正常": COLOR_INFO}
    df = df.copy()
    df["label"] = df.apply(lambda r: f"{r['drug_name']} ({r['batch_no']})", axis=1)

    fig = go.Figure()
    for urgency in ["严重", "警告", "正常"]:
        sub = df[df["urgency"] == urgency]
        if not sub.empty:
            fig.add_trace(go.Bar(
                y=sub["label"], x=sub["days_left"],
                name=urgency, orientation="h",
                marker_color=color_map[urgency],
                text=sub["days_left"].apply(lambda x: f"{x}天"),
                textposition="outside",
            ))
    fig.update_layout(
        title=title,
        barmode="stack",
        yaxis=dict(autorange="reversed"),
        xaxis_title="距效期剩余天数",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_theme(fig)


def create_member_change_chart(df: pd.DataFrame, title: str = "会员档案变化") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["date"], y=df["total_members"],
        name="会员总数", mode="lines+markers",
        line=dict(color=COLOR_PRIMARY, width=2),
        yaxis="y",
    ))
    fig.add_trace(go.Bar(
        x=df["date"], y=df["new_members"],
        name="新增会员", marker_color=COLOR_SUCCESS,
        yaxis="y2", opacity=0.6,
    ))
    fig.update_layout(
        title=title,
        xaxis=dict(domain=[0.1, 0.9]),
        yaxis=dict(title="会员总数", titlefont=dict(color=COLOR_PRIMARY), tickfont=dict(color=COLOR_PRIMARY)),
        yaxis2=dict(title="新增会员", titlefont=dict(color=COLOR_SUCCESS), tickfont=dict(color=COLOR_SUCCESS),
                    anchor="x", overlaying="y", side="right"),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_theme(fig)


def create_pharmacy_comparison(df: pd.DataFrame, title: str = "各门店处方审核对比") -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title=title, annotations=[dict(text="暂无数据", showarrow=False)])
        return _apply_theme(fig)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df["name"], y=df["prescription_count"],
        name="处方总数", marker_color=COLOR_PRIMARY,
    ))
    fig.add_trace(go.Bar(
        x=df["name"], y=df["approved"],
        name="审核通过", marker_color=COLOR_SUCCESS,
    ))
    fig.add_trace(go.Scatter(
        x=df["name"], y=df["approval_rate"],
        name="通过率(%)", mode="lines+markers",
        line=dict(color=COLOR_DANGER, width=2),
        yaxis="y2",
    ))
    fig.update_layout(
        title=title,
        yaxis=dict(title="处方数"),
        yaxis2=dict(title="通过率(%)", overlaying="y", side="right", range=[0, 100]),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_theme(fig)


def create_status_pie(summary: dict, title: str = "处方状态分布") -> go.Figure:
    labels = ["已审核通过", "待审核", "需澄清", "已驳回"]
    values = [
        summary.get("approved", 0),
        summary.get("pending_review", 0),
        summary.get("needs_clarification", 0),
        summary.get("rejected", 0),
    ]
    colors = [COLOR_SUCCESS, COLOR_INFO, COLOR_WARNING, COLOR_DANGER]
    fig = go.Figure(data=[go.Pie(
        labels=labels, values=values, hole=0.45,
        marker=dict(colors=colors),
        textinfo="label+percent",
    )])
    fig.update_layout(title=title)
    return _apply_theme(fig)


def create_kpi_card(value, label, color=COLOR_PRIMARY, prefix="", suffix="") -> go.Figure:
    fig = go.Figure()
    fig.add_trace(go.Indicator(
        mode="number",
        value=value,
        number=dict(
            font=dict(size=32, color=color),
            prefix=prefix, suffix=suffix,
        ),
        title=dict(text=label, font=dict(size=14, color="#6B7280")),
        domain=dict(x=[0, 1], y=[0, 1]),
    ))
    fig.update_layout(
        height=100, margin=dict(l=10, r=10, t=30, b=10),
        paper_bgcolor="white",
    )
    return fig
