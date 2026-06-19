from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import timedelta


STATUS_COLORS = {
    "已入住": "#198754",
    "已确认": "#0d6efd",
    "已完成": "#6f42c1",
    "空房": "#adb5bd",
    "在途": "#fd7e14",
    "锁定": "#6c757d",
    "CONFLICT": "#dc3545"
}

OCCUPANCY_COLORS = {
    "occupied": "#198754",
    "vacant": "#adb5bd",
    "reserved": "#0d6efd",
    "conflict": "#dc3545"
}


def build_calendar_view():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col([
                    html.H5("房源房态日历", className="mb-0"),
                    html.Small("点击单元格可下钻查看详情", className="text-muted")
                ]),
                dbc.Col([
                    dbc.Button(
                        html.I(className="bi bi-chat-square-text"),
                        id="calendar-note-btn",
                        color="outline-secondary",
                        size="sm",
                        className="float-end ms-2",
                        title="添加备注"
                    ),
                    dbc.Button(
                        "图例",
                        id="legend-toggle-btn",
                        color="outline-secondary",
                        size="sm",
                        className="float-end"
                    )
                ])
            ])
        ]),
        dbc.CardBody([
            html.Div(id="legend-container", children=build_legend(), className="mb-3"),
            dcc.Graph(id="room-status-heatmap", style={"height": "600px"})
        ])
    ], className="mb-4")


def build_legend():
    legend_items = [
        {"label": "已入住/占用", "color": OCCUPANCY_COLORS["occupied"]},
        {"label": "已预订", "color": OCCUPANCY_COLORS["reserved"]},
        {"label": "空房", "color": OCCUPANCY_COLORS["vacant"]},
        {"label": "房态冲突", "color": OCCUPANCY_COLORS["conflict"]}
    ]
    return dbc.Row([
        dbc.Col(
            html.Div([
                html.Span(style={
                    "display": "inline-block",
                    "width": "20px",
                    "height": "20px",
                    "backgroundColor": item["color"],
                    "borderRadius": "4px",
                    "marginRight": "8px",
                    "verticalAlign": "middle"
                }),
                html.Span(item["label"], className="align-middle")
            ], className="d-inline-flex align-items-center me-4 mb-2"),
            md=3, sm=6
        ) for item in legend_items
    ])


def create_heatmap_figure(df: pd.DataFrame, start_date, end_date):
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无数据，请调整筛选条件或同步数据",
            showarrow=False,
            font={"size": 16, "color": "#999"}
        )
        return fig

    date_range = pd.date_range(start=start_date, end=end_date, freq="D")

    df["status_date"] = pd.to_datetime(df["status_date"])

    properties = sorted(df["property_name"].unique()) if "property_name" in df.columns else []

    if not properties:
        fig = go.Figure()
        fig.add_annotation(text="无房源数据", showarrow=False)
        return fig

    z_data = []
    text_data = []
    custom_data = []

    for prop in properties:
        prop_row_vals = []
        prop_text_vals = []
        prop_custom_vals = []

        for d in date_range:
            day_data = df[
                (df["property_name"] == prop) &
                (df["status_date"].dt.date == d.date())
            ]

            if day_data.empty:
                prop_row_vals.append(0)
                prop_text_vals.append("空房")
                prop_custom_vals.append({
                    "property_name": prop,
                    "date": str(d.date()),
                    "status": "vacant",
                    "has_conflict": False,
                    "room_type": ""
                })
            else:
                has_conflict = day_data["has_conflict"].any()
                if has_conflict:
                    status_val = 3
                    status_label = "房态冲突"
                elif day_data["occupancy_status"].iloc[0] == "occupied":
                    status_val = 1
                    status_label = "已入住"
                elif day_data["occupancy_status"].iloc[0] == "reserved":
                    status_val = 2
                    status_label = "已预订"
                else:
                    status_val = 0
                    status_label = "空房"

                room_types = day_data["room_type"].unique().tolist()
                sources = day_data["source"].dropna().unique().tolist()

                prop_row_vals.append(status_val)
                prop_text_vals.append(
                    f"{prop}<br>"
                    f"日期: {d.strftime('%Y-%m-%d')}<br>"
                    f"状态: {status_label}<br>"
                    f"房型: {', '.join(room_types)}<br>"
                    f"来源: {', '.join(sources) if sources else 'N/A'}"
                    + ("<br><b>⚠ 存在冲突</b>" if has_conflict else "")
                )
                prop_custom_vals.append({
                    "property_name": prop,
                    "property_id": str(day_data["property_id"].iloc[0]) if "property_id" in day_data.columns else None,
                    "date": str(d.date()),
                    "status": status_label,
                    "has_conflict": bool(has_conflict),
                    "room_types": room_types,
                    "sources": sources
                })

        z_data.append(prop_row_vals)
        text_data.append(prop_text_vals)
        custom_data.append(prop_custom_vals)

    colorscale = [
        [0.0, OCCUPANCY_COLORS["vacant"]],
        [0.33, OCCUPANCY_COLORS["occupied"]],
        [0.66, OCCUPANCY_COLORS["reserved"]],
        [1.0, OCCUPANCY_COLORS["conflict"]]
    ]

    fig = go.Figure(data=go.Heatmap(
        z=z_data,
        x=[d.strftime("%Y-%m-%d") for d in date_range],
        y=properties,
        text=text_data,
        customdata=custom_data,
        hoverinfo="text",
        colorscale=colorscale,
        showscale=False,
        xgap=1,
        ygap=1,
        zmin=0,
        zmax=3
    ))

    fig.update_layout(
        margin={"l": 150, "r": 20, "t": 20, "b": 80},
        xaxis={
            "title": "日期",
            "tickangle": -45,
            "tickmode": "array",
            "tickvals": [i for i, d in enumerate(date_range) if d.day == 1 or i % 7 == 0],
            "ticktext": [d.strftime("%m-%d") for i, d in enumerate(date_range) if d.day == 1 or i % 7 == 0]
        },
        yaxis={"title": "房源"},
        clickmode="event+select",
        dragmode=False
    )

    return fig


def build_detail_modal():
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle(id="detail-modal-title", children="详情")),
        dbc.ModalBody([
            dbc.Tabs(id="detail-tabs", active_tab="orders-tab", children=[
                dbc.Tab(label="渠道订单", tab_id="orders-tab", children=[
                    html.Div(id="orders-detail-content", className="mt-3")
                ]),
                dbc.Tab(label="保洁任务", tab_id="cleaning-tab", children=[
                    html.Div(id="cleaning-detail-content", className="mt-3")
                ]),
                dbc.Tab(label="原始样本", tab_id="raw-tab", children=[
                    html.Div(id="raw-detail-content", className="mt-3")
                ])
            ])
        ]),
        dbc.ModalFooter([
            dbc.Button(
                [html.I(className="bi bi-chat-square-text me-1"), "添加备注"],
                id="add-note-btn",
                color="primary",
                outline=True
            ),
            dbc.Button("关闭", id="close-detail-modal", color="secondary")
        ])
    ], id="detail-modal", size="xl", scrollable=True)


def build_note_modal():
    return dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("添加备注")),
        dbc.ModalBody([
            dbc.Textarea(
                id="note-content-input",
                placeholder="请输入备注内容...",
                rows=5,
                className="mb-3"
            ),
            dbc.Input(
                id="note-author-input",
                placeholder="备注人（可选）",
                type="text",
                className="mb-2"
            )
        ]),
        dbc.ModalFooter([
            dbc.Button("取消", id="close-note-modal", color="secondary"),
            dbc.Button("保存", id="save-note-btn", color="primary")
        ])
    ], id="note-modal", size="lg")


def render_orders_table(df: pd.DataFrame):
    if df.empty:
        return html.Div("暂无订单数据", className="text-muted text-center py-4")

    display_cols = [
        "order_no", "channel", "check_in_date", "check_out_date",
        "guest_name", "room_type", "room_count", "total_amount",
        "paid_amount", "order_status", "is_anomaly"
    ]
    available_cols = [c for c in display_cols if c in df.columns]

    return dash_table.DataTable(
        data=df[available_cols].to_dict("records"),
        columns=[{"name": c, "id": c} for c in available_cols],
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"textAlign": "left", "padding": "8px"},
        style_data_conditional=[
            {
                "if": {"filter_query": "{is_anomaly} = true"},
                "backgroundColor": "#fff3cd",
                "color": "#856404"
            },
            {
                "if": {"filter_query": "{order_status} = '已取消'"},
                "color": "#dc3545",
                "textDecoration": "line-through"
            }
        ],
        page_size=10,
        sort_action="native"
    )


def render_cleaning_table(df: pd.DataFrame):
    if df.empty:
        return html.Div("暂无保洁任务数据", className="text-muted text-center py-4")

    display_cols = [
        "task_no", "room_type", "scheduled_date", "task_type",
        "task_status", "assigned_to", "completed_at", "remark"
    ]
    available_cols = [c for c in display_cols if c in df.columns]

    status_colors = {
        "待执行": "#fff3cd",
        "进行中": "#cfe2ff",
        "已完成": "#d1e7dd",
        "已取消": "#f8d7da"
    }

    return dash_table.DataTable(
        data=df[available_cols].to_dict("records"),
        columns=[{"name": c, "id": c} for c in available_cols],
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
        style_cell={"textAlign": "left", "padding": "8px"},
        style_data_conditional=[
            {
                "if": {
                    "filter_query": "{{task_status}} = '{}'".format(status),
                    "column_id": "task_status"
                },
                "backgroundColor": color,
                "color": "#000"
            } for status, color in status_colors.items()
        ],
        page_size=10,
        sort_action="native"
    )


def render_raw_data(df: pd.DataFrame, title: str = "原始数据"):
    if df.empty:
        return html.Div("暂无原始数据", className="text-muted text-center py-4")

    return [
        html.H6(title, className="mb-2"),
        dash_table.DataTable(
            data=df.to_dict("records"),
            columns=[{"name": c, "id": c} for c in df.columns],
            style_table={"overflowX": "auto"},
            style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
            style_cell={"textAlign": "left", "padding": "8px", "fontSize": "12px"},
            style_data={"whiteSpace": "normal", "height": "auto"},
            page_size=5,
            sort_action="native"
        )
    ]
