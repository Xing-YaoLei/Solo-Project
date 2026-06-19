from datetime import datetime

import pandas as pd
import plotly.graph_objects as go
from dash import Input, Output, State, callback, html, dcc, ctx, no_update, dash_table
import dash_bootstrap_components as dbc

from data import (
    get_work_order_by_id,
    get_work_order_items,
    get_parts_df,
    get_part_stock_records,
    get_quotes_df,
    get_remarks,
    add_remark,
    get_work_orders_df,
)


@callback(
    Output("detail-order-title", "children"),
    Output("detail-order-info", "children"),
    [Input("selected-order-id", "data")],
    prevent_initial_call=True
)
def update_order_detail(order_id):
    if not order_id:
        return "工单详情", []

    order = get_work_order_by_id(order_id)
    if not order:
        return "工单不存在", []

    title = f"工单详情 - {order['order_no']}"

    status_map = {
        "pending": ("待处理", "secondary"),
        "in_progress": ("进行中", "primary"),
        "parts_pending": ("配件待料", "warning"),
        "completed": ("已完成", "success"),
        "cancelled": ("已取消", "danger"),
    }
    status_label, status_color = status_map.get(order["status"], (order["status"], "secondary"))

    info_items = [
        dbc.Col([
            html.Label("工单号", className="text-muted small"),
            html.H6(order["order_no"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("车牌号", className="text-muted small"),
            html.H6(order["license_plate"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("车型", className="text-muted small"),
            html.H6(order["vehicle_model"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("状态", className="text-muted small"),
            html.Div(dbc.Badge(status_label, color=status_color, className="fs-6"))
        ], md=3),
        dbc.Col([
            html.Label("客户姓名", className="text-muted small"),
            html.H6(order["customer_name"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("联系电话", className="text-muted small"),
            html.H6(order["phone"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("里程数", className="text-muted small"),
            html.H6(f"{order['mileage']:,} km", className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("维修类型", className="text-muted small"),
            html.H6(order["repair_type"], className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("服务顾问", className="text-muted small"),
            html.H6(order["advisor"] or "-", className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("维修技师", className="text-muted small"),
            html.H6(order["technician"] or "-", className="mb-0")
        ], md=3),
        dbc.Col([
            html.Label("总金额", className="text-muted small"),
            html.H6(f"¥{order['total_amount']:.2f}", className="mb-0 text-primary")
        ], md=3),
        dbc.Col([
            html.Label("是否返修", className="text-muted small"),
            html.H6(
                f"是 (第{order['rework_count']}次" if order["is_rework"] else "否",
                className=f"mb-0 {'text-danger' if order['is_rework'] else ''}"
            )
        ], md=3),
        dbc.Col([
            html.Label("故障描述", className="text-muted small"),
            html.P(order["fault_description"] or "-", className="mb-0")
        ], md=12),
    ]

    if order["has_parts_shortage"]:
        info_items.append(dbc.Col([
            dbc.Alert([
                html.I(className="fas fa-exclamation-triangle me-2"),
                "该工单存在配件缺货情况，请及时处理"
            ], color="warning", className="mb-0 mt-2")
        ], md=12))

    return title, info_items


@callback(
    Output("detail-items-table", "data"),
    [Input("selected-order-id", "data")],
    prevent_initial_call=True
)
def update_order_items(order_id):
    if not order_id:
        return []

    items_df = get_work_order_items(order_id)
    if items_df.empty:
        return []

    items_df["unit_price"] = items_df["unit_price"].apply(lambda x: f"¥{x:.2f}")
    items_df["amount"] = items_df["amount"].apply(lambda x: f"¥{x:.2f}")

    type_map = {"labor": "工时", "part": "配件", "other": "其他"}
    items_df["item_type"] = items_df["item_type"].map(type_map).fillna(items_df["item_type"])

    status_map = {
        "pending": "待处理",
        "in_progress": "进行中",
        "completed": "已完成",
        "shortage": "缺货",
    }
    items_df["status"] = items_df["status"].map(status_map).fillna(items_df["status"])

    return items_df.to_dict("records")


@callback(
    Output("detail-tabs-content", "children"),
    [Input("detail-tabs", "active_tab"), Input("selected-order-id", "data")],
    prevent_initial_call=True
)
def render_detail_tabs(active_tab, order_id):
    if not order_id:
        return html.Div("请选择工单", className="text-center py-4 text-muted")

    if active_tab == "tab-parts-stock":
        return _render_parts_stock_tab(order_id)
    elif active_tab == "tab-quotes":
        return _render_quotes_tab(order_id)
    elif active_tab == "tab-original":
        return _render_original_tab(order_id)

    return html.Div("请选择标签页", className="text-center py-4 text-muted")


def _render_parts_stock_tab(order_id):
    items_df = get_work_order_items(order_id)

    part_items = items_df[items_df["item_type"] == "part"] if not items_df.empty else pd.DataFrame()

    if part_items.empty:
        return html.Div([
            html.I(className="fas fa-info-circle me-2"),
            html.Span("该工单暂无配件项目", className="text-muted")
        ], className="text-center py-4")

    part_codes = part_items["item_code"].tolist()
    parts_df = get_parts_df()

    related_parts = parts_df[parts_df["part_code"].isin(part_codes)] if not parts_df.empty else pd.DataFrame()

    if related_parts.empty:
        return html.Div("未找到相关配件库存信息", className="text-center py-4 text-muted")

    related_parts["stock_status"] = related_parts.apply(
        lambda x: "缺货" if x["is_shortage"] else "充足",
        axis=1
    )
    related_parts["unit_price"] = related_parts["unit_price"].apply(lambda x: f"¥{x:.2f}")

    table = dash_table.DataTable(
        columns=[
            {"name": "配件编码", "id": "part_code"},
            {"name": "配件名称", "id": "part_name"},
            {"name": "分类", "id": "category"},
            {"name": "品牌", "id": "brand"},
            {"name": "规格", "id": "spec"},
            {"name": "单价", "id": "unit_price"},
            {"name": "当前库存", "id": "stock_quantity"},
            {"name": "安全库存", "id": "safe_stock"},
            {"name": "库存状态", "id": "stock_status"},
            {"name": "仓库", "id": "warehouse"},
        ],
        data=related_parts.to_dict("records"),
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "rgb(230, 230, 230)",
            "fontWeight": "bold"
        },
        style_data_conditional=[
            {
                "if": {"filter_query": "{stock_status} = '缺货'"},
                "backgroundColor": "#fff3cd",
                "color": "#856404",
                "fontWeight": "bold",
            },
        ],
    )

    return dbc.Card([
        dbc.CardHeader("工单配件库存详情"),
        dbc.CardBody(table)
    ], className="border-0")


def _render_quotes_tab(order_id):
    quotes_df = get_quotes_df(work_order_id=order_id)

    if quotes_df.empty:
        return html.Div([
            html.I(className="fas fa-file-invoice-dollar me-2"),
            html.Span("该工单暂无报价单", className="text-muted")
        ], className="text-center py-4")

    quotes_df["total_amount"] = quotes_df["total_amount"].apply(lambda x: f"¥{x:.2f}")
    quotes_df["parts_amount"] = quotes_df["parts_amount"].apply(lambda x: f"¥{x:.2f}")
    quotes_df["labor_amount"] = quotes_df["labor_amount"].apply(lambda x: f"¥{x:.2f}")

    status_map = {
        "draft": "草稿",
        "submitted": "已提交",
        "approved": "已批准",
        "rejected": "已拒绝",
        "confirmed": "已确认",
    }
    quotes_df["status"] = quotes_df["status"].map(status_map).fillna(quotes_df["status"])

    table = dash_table.DataTable(
        columns=[
            {"name": "报价单号", "id": "quote_no"},
            {"name": "状态", "id": "status"},
            {"name": "总金额", "id": "total_amount"},
            {"name": "配件金额", "id": "parts_amount"},
            {"name": "工时金额", "id": "labor_amount"},
            {"name": "创建人", "id": "created_by"},
            {"name": "有效期", "id": "valid_until"},
        ],
        data=quotes_df.to_dict("records"),
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "rgb(230, 230, 230)",
            "fontWeight": "bold"
        },
    )

    return dbc.Card([
        dbc.CardHeader("关联报价单"),
        dbc.CardBody(table)
    ], className="border-0")


def _render_original_tab(order_id):
    order = get_work_order_by_id(order_id)
    if not order:
        return html.Div("未找到工单信息", className="text-center py-4 text-muted")

    items_df = get_work_order_items(order_id)

    original_data = {
        "基本信息": [
            {"字段": "工单号", "值": order["order_no"]},
            {"字段": "车牌号", "值": order["license_plate"]},
            {"字段": "车型", "值": order["vehicle_model"]},
            {"字段": "客户姓名", "值": order["customer_name"]},
            {"字段": "联系电话", "值": order["phone"]},
            {"字段": "里程数", "值": f"{order['mileage']:,} km"},
            {"字段": "维修类型", "值": order["repair_type"]},
            {"字段": "故障描述", "值": order["fault_description"] or "-"},
            {"字段": "服务顾问", "值": order["advisor"] or "-"},
            {"字段": "维修技师", "值": order["technician"] or "-"},
            {"字段": "开工时间", "值": str(order["start_time"]) if order["start_time"] else "-"},
            {"字段": "完工时间", "值": str(order["complete_time"]) if order["complete_time"] else "-"},
            {"字段": "总金额", "值": f"¥{order['total_amount']:.2f}"},
            {"字段": "是否返修", "值": "是" if order["is_rework"] else "否"},
            {"字段": "返修次数", "值": str(order["rework_count"]) + "次"},
        ],
        "项目明细": items_df.to_dict("records") if not items_df.empty else []
    }

    info_table = dash_table.DataTable(
        columns=[{"name": "字段", "id": "字段"}, {"name": "值", "id": "值"}],
        data=original_data["基本信息"],
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "rgb(230, 230, 230)",
            "fontWeight": "bold"
        },
    )

    items_table = None
    if items_df.empty:
        items_table = html.P("暂无项目明细", className="text-muted")
    else:
        items_table = dash_table.DataTable(
            columns=[
                {"name": "项目类型", "id": "item_type"},
                {"name": "项目编码", "id": "item_code"},
                {"name": "项目名称", "id": "item_name"},
                {"name": "数量", "id": "quantity"},
                {"name": "单价", "id": "unit_price"},
                {"name": "金额", "id": "amount"},
            ],
            data=items_df.to_dict("records"),
            style_table={"overflowX": "auto"},
            style_header={
                "backgroundColor": "rgb(230, 230, 230)",
                "fontWeight": "bold"
            },
        )

    return html.Div([
        dbc.Card([
            dbc.CardHeader("原始样本 - 工单基本信息"),
            dbc.CardBody(info_table)
        ], className="border-0 mb-3"),
        dbc.Card([
            dbc.CardHeader("原始样本 - 项目明细"),
            dbc.CardBody(items_table)
        ], className="border-0"),
    ])


@callback(
    Output("remarks-list", "children"),
    [
        Input("selected-order-id", "data"),
        Input("btn-send-remark", "n_clicks"),
    ],
    [State("remark-input", "value")],
    prevent_initial_call=True
)
def update_remarks(order_id, n_clicks, remark_content):
    if not order_id:
        return []

    triggered = ctx.triggered_id

    if triggered == "btn-send-remark" and remark_content and remark_content.strip():
        order = get_work_order_by_id(order_id)
        if order:
            add_remark(
                related_type="work_order",
                related_id=order_id,
                related_no=order["order_no"],
                content=remark_content.strip(),
                author="当前用户",
            )

    remarks_df = get_remarks("work_order", order_id)

    remarks_list = []

    if remarks_df.empty:
        return html.Div([
            html.I(className="fas fa-comments me-2"),
            html.Span("暂无备注", className="text-muted")
        ], className="text-center py-3")

    for _, row in remarks_df.iterrows():
        pinned_icon = html.I(className="fas fa-thumbtack fa-xs text-warning me-1") if row["is_pinned"] else ""

        remark_card = dbc.Card([
            dbc.CardBody([
                html.Div([
                    html.Strong(row["author"]),
                    html.Small(f" · {row['created_at'].strftime('%Y-%m-%d %H:%M')}", className="text-muted ms-2"),
                    pinned_icon,
                ], className="mb-2"),
                html.P(row["content"], className="mb-0 small"),
            ])
        ], className=f"mb-2 {'border-warning' if row['is_pinned'] else ''}")

        remarks_list.append(remark_card)

    return remarks_list


@callback(
    Output("remark-input", "value"),
    [Input("btn-send-remark", "n_clicks")],
    prevent_initial_call=True
)
def clear_remark_input(n_clicks):
    return ""
