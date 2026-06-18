from dash import dash_table, html
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from app.data.queries import get_approval_abnormal
from .funnel import COLOR_PALETTE


def create_approval_abnormal_chart():
    df = get_approval_abnormal()
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无审批数据", height=400)
        return fig, df

    status_count = df["状态"].value_counts().reset_index()
    status_count.columns = ["状态", "数量"]

    abnormal_count = df["是否异常"].value_counts().reset_index()
    abnormal_count.columns = ["是否异常", "数量"]

    type_abnormal = df[df["是否异常"] == "是"]["审批类型"].value_counts().reset_index()
    type_abnormal.columns = ["审批类型", "异常数"]

    colors = {
        "已通过": COLOR_PALETTE['success'],
        "待审批": COLOR_PALETTE['warning'],
        "已驳回": COLOR_PALETTE['danger'],
        "异常": COLOR_PALETTE['danger'],
    }

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=status_count["状态"],
        y=status_count["数量"],
        name="审批状态分布",
        marker_color=[colors.get(s, COLOR_PALETTE['info']) for s in status_count["状态"]],
        opacity=0.85,
        text=status_count["数量"],
        textposition="outside"
    ))

    if not type_abnormal.empty:
        for i, row in type_abnormal.iterrows():
            fig.add_annotation(
                x=-0.4 + i * 0.08, y=1.10,
                xref="paper", yref="paper",
                text=f"⚠️ {row['审批类型']}: {row['异常数']}异常",
                showarrow=False,
                font=dict(size=10, color=COLOR_PALETTE['danger']),
                align="left"
            )

    fig.update_layout(
        title=dict(
            text="⚖️ 审批状态与异常分布（红点标注=异常）",
            font=dict(size=15, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5
        ),
        height=400,
        margin=dict(l=60, r=60, t=110, b=40),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        showlegend=False,
        yaxis=dict(title="数量", gridcolor="#E0E0E0"),
    )
    return fig, df


def create_timeline_chart(df: pd.DataFrame):
    if df.empty:
        return go.Figure().update_layout(title="暂无审批时序数据", height=360)

    abnormal_df = df[df["是否异常"] == "是"].copy()

    fig = go.Figure()
    if "提交时间" in df.columns and not df["提交时间"].isna().all():
        all_times = df["提交时间"].dropna()
        if len(all_times) > 0:
            fig.add_trace(go.Scatter(
                x=all_times,
                y=[1] * len(all_times),
                mode="markers",
                name="正常审批",
                marker=dict(
                    color=COLOR_PALETTE['success'],
                    size=10,
                    opacity=0.6
                ),
                text=df.loc[all_times.index, "项目编号"].astype(str) + " - " + df.loc[all_times.index, "审批类型"],
                hovertemplate="%{text}<extra></extra>"
            ))

    if len(abnormal_df) > 0 and "提交时间" in abnormal_df.columns:
        abnormal_times = abnormal_df["提交时间"].dropna()
        if len(abnormal_times) > 0:
            fig.add_trace(go.Scatter(
                x=abnormal_times,
                y=[1] * len(abnormal_times),
                mode="markers",
                name="异常审批 (超时/驳回)",
                marker=dict(
                    color=COLOR_PALETTE['danger'],
                    size=16,
                    symbol="triangle-up",
                    line=dict(color="white", width=2)
                ),
                text=abnormal_df.loc[abnormal_times.index, "异常原因"].astype(str),
                hovertemplate="⚠️ %{text}<extra></extra>"
            ))

    fig.update_layout(
        title=dict(
            text="📅 审批异常时间线（红色三角=异常节点）",
            font=dict(size=14, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5
        ),
        height=320,
        margin=dict(l=60, r=60, t=80, b=60),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        yaxis=dict(showticklabels=False, showgrid=False, title=""),
        xaxis=dict(title="提交时间", gridcolor="#E0E0E0"),
    )
    return fig


def create_approval_abnormal_table(df: pd.DataFrame):
    if df.empty:
        cols = ["项目编号", "项目名称", "审批类型", "状态", "是否异常", "异常原因", "提交时间", "审批时间"]
        data = []
    else:
        cols = ["项目编号", "项目名称", "审批类型", "关联单据", "审批人",
                "状态", "是否异常", "异常原因", "提交时间", "审批时间", "超时(小时)"]
        display = df[cols].copy()
        for c in ["提交时间", "审批时间"]:
            if c in display.columns:
                display[c] = display[c].astype(str)
        data = display.to_dict("records")

    style_header = {
        'backgroundColor': COLOR_PALETTE['primary'],
        'color': 'white',
        'fontWeight': 'bold',
        'textAlign': 'center',
        'fontFamily': '微软雅黑',
        'fontSize': '13px'
    }
    style_cell = {
        'textAlign': 'left',
        'fontFamily': '微软雅黑',
        'fontSize': '12px',
        'padding': '6px',
        'whiteSpace': 'normal',
        'height': 'auto'
    }
    style_data_conditional = [
        {
            'if': {'filter_query': '{是否异常} = "是"'},
            'backgroundColor': '#FFE6E6',
            'fontWeight': 'bold'
        },
        {
            'if': {
                'filter_query': '{状态} = "已驳回"',
                'column_id': '状态'
            },
            'color': COLOR_PALETTE['danger'],
            'fontWeight': 'bold'
        },
        {
            'if': {
                'filter_query': '{状态} = "已通过"',
                'column_id': '状态'
            },
            'color': COLOR_PALETTE['success'],
            'fontWeight': 'bold'
        }
    ]

    return dash_table.DataTable(
        id="approval-abnormal-table",
        columns=[{"name": c, "id": c} for c in cols],
        data=data,
        page_size=12,
        style_header=style_header,
        style_cell=style_cell,
        style_data_conditional=style_data_conditional,
        style_table={'overflowX': 'auto'},
        sort_action='native',
        filter_action='native',
        export_format='none',
        row_selectable='multi'
    )


def create_abnormal_summary_cards(df: pd.DataFrame):
    if df.empty:
        return []

    total = len(df)
    abnormal = len(df[df["是否异常"] == "是"])
    rejected = len(df[df["状态"] == "已驳回"])
    pending = len(df[df["状态"] == "待审批"])

    cards_data = [
        ("审批总数", f"{total}", "📋", COLOR_PALETTE['primary']),
        ("异常数", f"{abnormal}", "⚠️", COLOR_PALETTE['danger']),
        ("已驳回", f"{rejected}", "❌", "#E06666"),
        ("待审批", f"{pending}", "⏳", COLOR_PALETTE['warning']),
    ]
    cards = []
    for title, value, icon, color in cards_data:
        cards.append(
            dbc.Col(
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.Span(icon, style={"fontSize": "22px", "marginRight": "8px"}),
                            html.Small(title, className="text-muted"),
                        ], className="mb-1"),
                        html.H4(value, className="mb-0", style={"color": color}),
                    ]),
                    className="h-100 shadow-sm",
                    style=dict(borderTop=f"4px solid {color}")
                ),
                md=3, xs=6, className="mb-3"
            )
        )
    return cards
