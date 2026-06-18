from dash import dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from app.data.queries import get_attachment_type_stats, get_contract_attachments
from .funnel import COLOR_PALETTE


ATTACHMENT_TYPE_ICONS = {
    "主合同": "📄",
    "报价单": "💰",
    "设计图": "🎨",
    "施工图纸": "📐",
    "材料清单": "📦",
    "验收单": "✅",
    "变更单": "🔄",
    "补充协议": "📝",
    "预算表": "📊",
    "工期表": "📅",
    "其他": "📎"
}


def create_attachment_type_chart():
    df = get_attachment_type_stats()
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无合同附件数据", height=420)
        return fig, df

    colors = px.colors.qualitative.Set2 + px.colors.qualitative.Pastel
    fig = go.Figure()

    fig.add_trace(go.Pie(
        labels=df["附件类型"],
        values=df["数量"],
        name="数量",
        hole=0.55,
        marker=dict(colors=colors[:len(df)]),
        textinfo="label+percent+value",
        textposition="outside",
        textfont=dict(size=11, family="微软雅黑"),
        hovertemplate="<b>%{label}</b><br>数量: %{value}<br>占比: %{percent}<extra></extra>",
        domain=dict(x=[0, 0.48])
    ))

    fig.add_trace(go.Bar(
        x=df["附件类型"],
        y=df["总大小(MB)"],
        name="总大小(MB)",
        marker_color=COLOR_PALETTE['secondary'],
        text=[f"{v:.1f}MB" for v in df["总大小(MB)"]],
        textposition="outside",
        domain=dict(x=[0.58, 1])
    ))

    fig.update_layout(
        title=dict(
            text="📎 合同附件构成（类型分布）",
            font=dict(size=15, color=COLOR_PALETTE['dark'], family="微软雅黑"),
            x=0.5
        ),
        height=420,
        margin=dict(l=60, r=60, t=100, b=60),
        paper_bgcolor="#FAFAFA",
        plot_bgcolor="#FAFAFA",
        font=dict(family="微软雅黑"),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        yaxis=dict(title="文件大小（MB）", gridcolor="#E0E0E0", domain=[0, 1]),
        yaxis2=dict(domain=[0, 1]),
    )
    return fig, df


def create_attachment_legend_cards(df: pd.DataFrame):
    if df.empty:
        return []

    cards = []
    for _, row in df.iterrows():
        icon = ATTACHMENT_TYPE_ICONS.get(row["附件类型"], "📎")
        cards.append(
            dbc.Col(
                dbc.Card(
                    dbc.CardBody([
                        html.Div([
                            html.Span(icon, style={"fontSize": "24px", "marginRight": "8px"}),
                            html.Span(row["附件类型"], className="fw-bold small"),
                        ], className="mb-1"),
                        html.Div([
                            html.H6(f"{row['数量']} 份", className="mb-0",
                                    style=dict(color=COLOR_PALETTE['primary'])),
                            html.Small(f"{row['总大小(MB)']:.2f} MB", className="text-muted"),
                        ]),
                    ]),
                    className="h-100 shadow-sm",
                ),
                md=2, xs=4, className="mb-2"
            )
        )
    return cards


from dash import html


def create_attachment_detail_table(df: pd.DataFrame = None):
    if df is None:
        df = get_contract_attachments()

    if df.empty:
        data = []
        cols = ["合同编号", "项目编号", "项目名称", "附件类型", "文件名", "文件大小(KB)", "上传时间"]
    else:
        cols = ["合同编号", "项目编号", "项目名称", "附件类型", "文件名", "文件大小(KB)", "上传时间"]
        display = df[cols].copy()
        display["上传时间"] = display["上传时间"].astype(str)
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
    style_cell_conditional = [
        {'if': {'column_id': c}, 'textAlign': 'center'}
        for c in ["合同编号", "项目编号", "附件类型", "文件大小(KB)", "上传时间"]
    ]

    return dash_table.DataTable(
        id="attachment-detail-table",
        columns=[{"name": c, "id": c} for c in cols],
        data=data,
        page_size=10,
        style_header=style_header,
        style_cell=style_cell,
        style_cell_conditional=style_cell_conditional,
        style_table={'overflowX': 'auto'},
        sort_action='native',
        filter_action='native',
        export_format='none'
    )
