from dash import html, dcc, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

from app.models import RoleEnum
from app.auth import can_view_amount
from app.data.queries import get_document_details
from .funnel import COLOR_PALETTE


DOC_TYPE_LABELS = {
    "quotation": "报价单",
    "purchase": "采购单"
}


def create_document_detail_view(doc_type: str = "quotation",
                                project_id: int = None,
                                user_role: RoleEnum = None):
    df = get_document_details(doc_type, project_id)
    show_amount = can_view_amount(user_role)

    if df.empty:
        data = []
        cols = ["暂无数据"]
        summary = None
    else:
        cols = list(df.columns)
        display = df.copy()

        amount_cols = [c for c in cols if c in ["小计", "单价", "实际金额", "预算金额"] or "金额" in c]
        if not show_amount:
            for c in amount_cols:
                if c in display.columns:
                    display[c] = "***"

        data = display.astype(str).to_dict("records")

        summary = _build_doc_summary(df, doc_type, show_amount)

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

    return df, summary, dash_table.DataTable(
        id="doc-detail-table",
        columns=[{"name": c, "id": c} for c in cols],
        data=data,
        page_size=15,
        style_header=style_header,
        style_cell=style_cell,
        style_table={'overflowX': 'auto'},
        sort_action='native',
        filter_action='native',
        export_format='none',
        row_selectable='single'
    )


def _build_doc_summary(df: pd.DataFrame, doc_type: str, show_amount: bool) -> list:
    cards = []
    label = DOC_TYPE_LABELS.get(doc_type, doc_type)

    if doc_type == "quotation":
        if "报价单号" in df.columns:
            doc_count = df["报价单号"].nunique()
        else:
            doc_count = 0
        if "小计" in df.columns:
            total = df["小计"].sum()
        else:
            total = 0
        if "分类" in df.columns:
            cat_count = df["分类"].nunique()
        else:
            cat_count = 0
        item_count = len(df)

        cards_data = [
            (f"{label}份数", f"{doc_count}", "📋", COLOR_PALETTE['primary']),
            ("分项条目数", f"{item_count}", "📝", COLOR_PALETTE['info']),
            ("涉及分类", f"{cat_count}", "🗂", COLOR_PALETTE['success']),
            ("合计金额", f"￥{total:,.2f}" if show_amount else "***", "💹", COLOR_PALETTE['warning']),
        ]
    elif doc_type == "purchase":
        if "采购单号" in df.columns:
            doc_count = df["采购单号"].nunique()
        else:
            doc_count = 0
        if "小计" in df.columns:
            total = df["小计"].sum()
        else:
            total = 0
        if "品牌" in df.columns:
            brand_count = df["品牌"].nunique()
        else:
            brand_count = 0
        if "供应商" in df.columns:
            supplier_count = df["供应商"].nunique()
        else:
            supplier_count = 0

        cards_data = [
            (f"{label}份数", f"{doc_count}", "📦", COLOR_PALETTE['primary']),
            ("材料条目数", f"{len(df)}", "📝", COLOR_PALETTE['info']),
            ("涉及品牌", f"{brand_count}", "🏷", COLOR_PALETTE['success']),
            ("供应商数", f"{supplier_count}", "🏭", COLOR_PALETTE['secondary']),
        ]
    else:
        cards_data = []

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
                    style=dict(borderLeft=f"4px solid {color}")
                ),
                md=3, xs=6, className="mb-3"
            )
        )
    return cards
