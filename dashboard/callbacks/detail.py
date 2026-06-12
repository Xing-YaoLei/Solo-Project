from datetime import date, timedelta
import pandas as pd
import plotly.graph_objects as go
from dash import Input, Output, State, no_update, html
import dash_bootstrap_components as dbc

from db.connection import Session
from db.models import BatchInfo, Supplier
from etl.clean_inventory import (
    get_inventory_df, get_batch_df, get_supplier_df,
    get_inventory_ledger_df, get_stores_list,
)
from alert.review import get_review_df
from dashboard.components.inventory_ledger import create_inventory_detail_table
from dashboard.components.batch_expiry import create_batch_detail_table
from dashboard.components.supplier_info import create_supplier_detail_table


def register_detail_callbacks(app):

    @app.callback(
        Output("detail-store-filter", "options"),
        [Input("detail-store", "data")],
        prevent_initial_call=False,
    )
    def load_store_options(_):
        session = Session()
        try:
            stores = get_stores_list(session)
            return [{"label": s, "value": s} for s in stores]
        finally:
            Session.remove()

    @app.callback(
        [
            Output("detail-inventory-table", "data"),
            Output("detail-inventory-table", "columns"),
            Output("detail-batch-table", "data"),
            Output("detail-batch-table", "columns"),
            Output("detail-supplier-table", "data"),
            Output("detail-supplier-table", "columns"),
            Output("detail-review-table", "data"),
            Output("detail-review-table", "columns"),
            Output("review-root-cause", "children"),
            Output("review-action-plan", "children"),
        ],
        [
            Input("detail-store-filter", "value"),
            Input("detail-tab-selector", "value"),
        ],
        prevent_initial_call=False,
    )
    def update_detail_tables(store_code, active_tab):
        session = Session()
        try:
            ledger_df = get_inventory_ledger_df(session, store_code=store_code)
            inv_cols = [
                {"name": "日期", "id": "transaction_date"},
                {"name": "门店编码", "id": "store_code"},
                {"name": "物料编码", "id": "material_code"},
                {"name": "物料名称", "id": "material_name"},
                {"name": "类型", "id": "transaction_type"},
                {"name": "数量", "id": "quantity"},
                {"name": "单位", "id": "unit"},
                {"name": "批次号", "id": "batch_no"},
                {"name": "供应商", "id": "supplier_code"},
            ]
            inv_style = [
                {"if": {"filter_query": "{transaction_type} = '消耗'"}, "backgroundColor": "#fdebd0", "color": "#d35400"},
                {"if": {"filter_query": "{transaction_type} = '入库'"}, "backgroundColor": "#d5f5e3", "color": "#27ae60"},
                {"if": {"filter_query": "{transaction_type} = '出库'"}, "backgroundColor": "#fadbd8", "color": "#c0392b"},
                {"if": {"filter_query": "{transaction_type} = '调整'"}, "backgroundColor": "#d6eaf8", "color": "#2874a6"},
            ]
            inv_data = ledger_df.to_dict("records") if not ledger_df.empty else []

            batch_df = get_batch_df(session, store_code=store_code)
            batch_cols = [
                {"name": "批次号", "id": "batch_no"},
                {"name": "物料名称", "id": "material_name"},
                {"name": "供应商", "id": "supplier_code"},
                {"name": "生产日期", "id": "production_date"},
                {"name": "到期日期", "id": "expiry_date"},
                {"name": "距到期天数", "id": "days_to_expiry"},
                {"name": "当前数量", "id": "current_qty"},
                {"name": "状态", "id": "status"},
            ]
            batch_style = [
                {"if": {"filter_query": "{status} = 'expired'"}, "backgroundColor": "#d5d8dc", "color": "#2c3e50"},
                {"if": {"filter_query": "{status} = 'near_expiry'"}, "backgroundColor": "#fdebd0", "color": "#e67e22"},
                {"if": {"filter_query": "{status} = 'active'"}, "backgroundColor": "#d5f5e3", "color": "#27ae60"},
            ]
            batch_data = batch_df.to_dict("records") if not batch_df.empty else []

            supplier_df = get_supplier_df(session)
            supplier_cols = [
                {"name": "供应商编码", "id": "supplier_code"},
                {"name": "供应商名称", "id": "supplier_name"},
                {"name": "联系人", "id": "contact_person"},
                {"name": "联系电话", "id": "contact_phone"},
                {"name": "交货天数", "id": "lead_time_days"},
                {"name": "评分", "id": "rating"},
                {"name": "物料类别", "id": "material_category"},
            ]
            supplier_style = [
                {"if": {"filter_query": "{rating} >= 4"}, "backgroundColor": "#d5f5e3", "color": "#27ae60"},
                {"if": {"filter_query": "{rating} >= 3 && {rating} < 4"}, "backgroundColor": "#fdebd0", "color": "#e67e22"},
                {"if": {"filter_query": "{rating} < 3"}, "backgroundColor": "#fadbd8", "color": "#e74c3c"},
            ]
            supplier_data = supplier_df.to_dict("records") if not supplier_df.empty else []

            review_df = get_review_df(session, store_code=store_code, status="open")
            review_cols = [
                {"name": "ID", "id": "id"},
                {"name": "标题", "id": "title"},
                {"name": "物料编码", "id": "material_code"},
                {"name": "物料名称", "id": "material_name"},
                {"name": "短缺数量", "id": "shortage_qty"},
                {"name": "周转天数", "id": "turnover_days"},
                {"name": "日均用量", "id": "avg_daily_usage"},
                {"name": "复盘日期", "id": "review_date"},
                {"name": "状态", "id": "status"},
            ]
            review_style = [
                {"if": {"filter_query": "{turnover_days} <= 7"}, "backgroundColor": "#ffcccc", "color": "#cc0000"},
            ]
            review_data = review_df.to_dict("records") if not review_df.empty else []

            root_cause_children = []
            action_plan_children = []
            if not review_df.empty:
                first_review = review_df.iloc[0]
                root_cause_children = [
                    dbc.CardHeader("根因分析"),
                    dbc.CardBody([
                        html.H6(f"{first_review['material_name']} ({first_review['material_code']})",
                                className="text-primary mb-2"),
                        html.P(first_review.get("root_cause") or "暂无", className="text-muted"),
                        html.Hr(),
                        html.Small([
                            f"周转天数: {first_review['turnover_days']:.1f} 天",
                            html.Br(),
                            f"日均用量: {first_review['avg_daily_usage']:.3f}",
                            html.Br(),
                            f"短缺数量: {first_review['shortage_qty']:.3f}",
                        ]),
                    ]),
                ]
                action_plan_children = [
                    dbc.CardHeader("行动计划"),
                    dbc.CardBody([
                        html.H6("补货建议", className="text-success mb-2"),
                        html.P(first_review.get("action_plan") or "暂无", className="text-muted"),
                        html.Hr(),
                        html.Small([
                            f"供应商: {first_review.get('supplier_code') or '未关联'}",
                            html.Br(),
                            f"批次信息: {first_review.get('batch_info_summary') or '无'}",
                        ]),
                    ]),
                ]
            else:
                root_cause_children = [
                    dbc.CardHeader("根因分析"),
                    dbc.CardBody(html.P("暂无待处理复盘", className="text-muted text-center mt-3")),
                ]
                action_plan_children = [
                    dbc.CardHeader("行动计划"),
                    dbc.CardBody(html.P("暂无行动计划", className="text-muted text-center mt-3")),
                ]

            return (
                inv_data, inv_cols,
                batch_data, batch_cols,
                supplier_data, supplier_cols,
                review_data, review_cols,
                dbc.Card(root_cause_children, className="h-100"),
                dbc.Card(action_plan_children, className="h-100"),
            )
        finally:
            Session.remove()
