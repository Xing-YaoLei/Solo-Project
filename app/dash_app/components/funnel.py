from dash import html, dcc, callback, Input, Output, State, dash_table, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta, date

from app.models import RoleEnum
from app.auth import has_view_permission, can_view_amount
from app.data.queries import get_project_funnel


COLOR_PALETTE = {
    'primary': '#2E75B6',
    'secondary': '#5B9BD5',
    'success': '#70AD47',
    'warning': '#FFC000',
    'danger': '#C00000',
    'info': '#4472C4',
    'light': '#D9E1F2',
    'dark': '#1F4E79',
}

FUNNEL_STAGE_COLORS = [
    COLOR_PALETTE['primary'],
    COLOR_PALETTE['secondary'],
    COLOR_PALETTE['info'],
    COLOR_PALETTE['success'],
    COLOR_PALETTE['warning'],
    COLOR_PALETTE['dark'],
]


def create_funnel_chart(user_role: RoleEnum = None):
    df = get_project_funnel()
    if df.empty:
        return go.Figure().update_layout(title="暂无漏斗数据", height=480)

    show_amount = can_view_amount(user_role)
    fig = go.Figure()

    fig.add_trace(go.Funnel(
        name="项目数",
        y=df["阶段"],
        x=df["项目数"],
        textposition="inside",
        textinfo="value+percent initial",
        marker=dict(color=FUNNEL_STAGE_COLORS),
        opacity=0.85,
        connector=dict(fill=dict(color="#F2F2F2"), line=dict(width=0)),
    ))

    if show_amount:
        annotations = []
        for i, row in df.iterrows():
            annotations.append(dict(
                x=row["项目数"],
                y=row["阶段"],
                xref="x",
                yref="y",
                text=f"￥{row['报价金额(万)']:.1f}万",
                showarrow=False,
                xanchor="left",
                font=dict(color=COLOR_PALETTE['dark'], size=11, family="微软雅黑")
            ))
        fig.update_layout(annotations=annotations)

    fig.update_layout(
        title=dict(
            text="🏠 量房→报价→签单→施工→竣工 转化漏斗",
            font=dict(size=16, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5,
            xanchor="center"
        ),
        height=480,
        margin=dict(l=100, r=160, t=80, b=40),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        showlegend=False,
        xaxis=dict(title=dict(text="项目数量（个）", font=dict(size=11))),
    )
    return fig


def create_funnel_summary_cards(df: pd.DataFrame, user_role: RoleEnum = None):
    if df.empty:
        return []
    show_amount = can_view_amount(user_role)
    cards = []
    total = df["项目数"].sum()

    for i, row in df.iterrows():
        conv = (row["项目数"] / total * 100) if total > 0 else 0
        amount_text = f"￥{row['报价金额(万)']:.1f}万" if show_amount else "***"
        cards.append(
            dbc.Col(
                dbc.Card(
                    dbc.CardBody([
                        html.Div(row["阶段"], className="text-muted small mb-1"),
                        html.H4(f"{row['项目数']} 个", className="mb-1",
                                style=dict(color=FUNNEL_STAGE_COLORS[i % len(FUNNEL_STAGE_COLORS)])),
                        html.Div([
                            html.Small(f"占比 {conv:.1f}%", className="text-muted"),
                            html.Br(),
                            html.Small(amount_text, className="text-primary"),
                        ]),
                    ]),
                    className="h-100 shadow-sm",
                    style=dict(borderLeft=f"4px solid {FUNNEL_STAGE_COLORS[i % len(FUNNEL_STAGE_COLORS)]}")
                ),
                md=2, xs=6, className="mb-3"
            )
        )
    return cards
