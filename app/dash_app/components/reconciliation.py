from dash import html, dcc, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from app.auth import can_view_amount
from app.models import RoleEnum
from app.data.queries import get_reconciliation_trend
from app.data.services import build_reconciliation_trend_df, aggregate_monthly_diff, aggregate_category_diff
from .funnel import COLOR_PALETTE


def create_reconciliation_trend_chart(months: int = 6, user_role: RoleEnum = None):
    df = build_reconciliation_trend_df(months=months)
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无对账差异数据", height=420)
        return fig, df

    monthly = aggregate_monthly_diff(df)
    if monthly.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无对账差异数据", height=420)
        return fig, df

    show_amount = can_view_amount(user_role)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=monthly["月份"],
        y=monthly["预算总额"],
        name="预算总额",
        marker_color=COLOR_PALETTE['light'],
        marker_line_color=COLOR_PALETTE['primary'],
        marker_line_width=1,
        opacity=0.9
    ))
    fig.add_trace(go.Bar(
        x=monthly["月份"],
        y=monthly["实际总额"],
        name="实际总额",
        marker_color=COLOR_PALETTE['primary'],
        opacity=0.85
    ))
    if show_amount:
        fig.add_trace(go.Scatter(
            x=monthly["月份"],
            y=monthly["差异率(%)"],
            name="月差异率(%)",
            mode="lines+markers+text",
            yaxis="y2",
            line=dict(color=COLOR_PALETTE['danger'], width=3),
            marker=dict(size=10, color=COLOR_PALETTE['danger']),
            text=[f"{v:.1f}%" for v in monthly["差异率(%)"]],
            textposition="top center",
            textfont=dict(color=COLOR_PALETTE['danger'])
        ))

    fig.update_layout(
        title=dict(
            text="📊 对账差异趋势（预算 vs 实际）",
            font=dict(size=15, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5
        ),
        height=420,
        barmode="group",
        bargap=0.25,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=60, r=60, t=100, b=40),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        xaxis=dict(title="月份"),
        yaxis=dict(title="金额（元）", gridcolor="#E0E0E0"),
        yaxis2=dict(
            title="差异率 (%)",
            overlaying="y",
            side="right",
            gridcolor="rgba(192,0,0,0.1)",
            zerolinecolor=COLOR_PALETTE['danger']
        ) if show_amount else {}
    )
    return fig, df


def create_category_diff_bar(months: int = 6):
    df = build_reconciliation_trend_df(months=months)
    if df.empty:
        return go.Figure().update_layout(title="暂无分类数据", height=360)

    cat_df = aggregate_category_diff(df)
    if cat_df.empty:
        return go.Figure().update_layout(title="暂无分类数据", height=360)

    colors = []
    for diff in cat_df["差异总额"]:
        if diff > 0:
            colors.append(COLOR_PALETTE['success'])
        elif diff < 0:
            colors.append(COLOR_PALETTE['danger'])
        else:
            colors.append(COLOR_PALETTE['light'])

    fig = go.Figure(go.Bar(
        x=cat_df["差异总额"],
        y=cat_df["分类"],
        orientation="h",
        marker_color=colors,
        opacity=0.85,
        text=[f"{v:,.0f} 元" for v in cat_df["差异总额"]],
        textposition="auto"
    ))

    fig.update_layout(
        title=dict(
            text="🔍 采购分类差异TOP（按差异金额绝对值排序）",
            font=dict(size=14, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5
        ),
        height=360,
        margin=dict(l=140, r=60, t=80, b=40),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        xaxis=dict(title="差异金额（元）", gridcolor="#E0E0E0"),
        yaxis=dict(title=""),
        shapes=[dict(
            type="line",
            x0=0, x1=0,
            y0=0, y1=1,
            xref="x", yref="paper",
            line=dict(color=COLOR_PALETTE['dark'], width=1, dash="dash")
        )]
    )
    return fig


def create_reconciliation_datatable(df: pd.DataFrame, user_role: RoleEnum = None):
    show_amount = can_view_amount(user_role)
    if df.empty:
        cols = ["日期", "采购单号", "分类", "供应商", "预算金额", "实际金额", "差异金额", "差异率(%)", "状态"]
        data = []
    else:
        cols = ["日期", "采购单号", "分类", "供应商", "预算金额",
                "实际金额", "差异金额", "差异率(%)", "状态"]
        display_df = df[cols].copy()
        if not show_amount:
            for c in ["预算金额", "实际金额", "差异金额"]:
                display_df[c] = "***"
        display_df["日期"] = display_df["日期"].astype(str)
        data = display_df.to_dict("records")

    style_header = {
        'backgroundColor': COLOR_PALETTE['primary'],
        'color': 'white',
        'fontWeight': 'bold',
        'textAlign': 'center',
        'fontFamily': '微软雅黑',
        'fontSize': '13px'
    }
    style_cell = {
        'textAlign': 'center',
        'fontFamily': '微软雅黑',
        'fontSize': '12px',
        'padding': '6px',
        'whiteSpace': 'normal',
        'height': 'auto'
    }
    style_data_conditional = [
        {
            'if': {
                'filter_query': '{差异率(%)} < -5',
                'column_id': ['差异金额', '差异率(%)']
            },
            'backgroundColor': '#FFCCCC',
            'color': COLOR_PALETTE['danger'],
            'fontWeight': 'bold'
        },
        {
            'if': {
                'filter_query': '{差异率(%)} > 5',
                'column_id': ['差异金额', '差异率(%)']
            },
            'backgroundColor': '#C6EFCE',
            'color': COLOR_PALETTE['success'],
            'fontWeight': 'bold'
        }
    ] if show_amount else []

    return dash_table.DataTable(
        id="recon-detail-table",
        columns=[{"name": c, "id": c} for c in cols],
        data=data,
        page_size=12,
        style_header=style_header,
        style_cell=style_cell,
        style_data_conditional=style_data_conditional,
        style_table={'overflowX': 'auto'},
        sort_action='native',
        filter_action='native',
        export_format='none'
    )
