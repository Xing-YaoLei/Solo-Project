from datetime import date, timedelta
from decimal import Decimal

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from dash import Input, Output, State, callback_context, no_update, html
import dash_bootstrap_components as dbc
from sqlalchemy import func

from db.connection import Session
from db.models import (
    CleanedInventory, AlertRecord, ReviewMaterial, MaterialDailyUsage,
    BatchInfo,
)
from etl.clean_inventory import (
    get_inventory_df, get_batch_df, get_supplier_df,
)
from dashboard.components.inventory_ledger import create_inventory_overview_chart
from dashboard.components.batch_expiry import create_expiry_distribution_chart
from dashboard.components.supplier_info import create_supplier_rating_chart
from alert.threshold import get_threshold_df, create_threshold, update_threshold, delete_threshold


_LAYOUT_COMMON = dict(
    template="plotly_white",
    font=dict(family="Microsoft YaHei, sans-serif"),
    margin=dict(l=60, r=30, t=50, b=60),
)


def register_overview_callbacks(app):

    @app.callback(
        [
            Output("kpi-material-count", "children"),
            Output("kpi-alert-count", "children"),
            Output("kpi-review-count", "children"),
            Output("kpi-avg-turnover", "children"),
            Output("overview-inventory-chart", "figure"),
            Output("overview-batch-chart", "figure"),
            Output("overview-supplier-chart", "figure"),
            Output("threshold-table", "data"),
            Output("threshold-table", "columns"),
        ],
        [Input("overview-store", "data"), Input("btn-refresh-threshold", "n_clicks")],
        prevent_initial_call=False,
    )
    def update_overview_content(_, __):
        session = Session()
        try:
            inv_df = get_inventory_df(session)

            if inv_df.empty:
                return (
                    dbc.CardBody([html.H4("0", className="card-value"), html.P("库存物料总数")]),
                    dbc.CardBody([html.H4("0", className="card-value"), html.P("低库存预警数")]),
                    dbc.CardBody([html.H4("0", className="card-value"), html.P("待处理复盘")]),
                    dbc.CardBody([html.H4("0", className="card-value"), html.P("平均周转天数")]),
                    go.Figure(), go.Figure(), go.Figure(),
                    [], [],
                )

            latest_date = inv_df["snapshot_date"].max()
            latest_inv = inv_df[inv_df["snapshot_date"] == latest_date].copy()
            latest_inv = latest_inv.groupby(
                ["store_code", "material_code", "material_name"], as_index=False
            ).agg({
                "stock_qty": "sum",
                "safety_stock": "max",
                "unit": "first",
            })

            material_count = len(latest_inv[["store_code", "material_code"]].drop_duplicates())

            alert_count = (
                session.query(func.count(AlertRecord.id))
                .filter(AlertRecord.is_resolved == False)
                .scalar()
            ) or 0

            review_count = (
                session.query(func.count(ReviewMaterial.id))
                .filter(ReviewMaterial.status == "open")
                .scalar()
            ) or 0

            cutoff = date.today() - timedelta(days=30)
            avg_turnover_rows = (
                session.query(func.avg(MaterialDailyUsage.turnover_days))
                .filter(MaterialDailyUsage.usage_date >= cutoff)
                .filter(MaterialDailyUsage.turnover_days.isnot(None))
                .scalar()
            )
            avg_turnover = f"{float(avg_turnover_rows):.1f}" if avg_turnover_rows else "0"

            top_inv = latest_inv.nlargest(10, "stock_qty")
            inv_fig = create_inventory_overview_chart(top_inv)

            batch_df = get_batch_df(session)
            batch_fig = go.Figure()
            if not batch_df.empty:
                status_counts = batch_df["status"].value_counts().reset_index()
                status_counts.columns = ["status", "count"]
                status_map = {"active": "正常", "near_expiry": "临近过期", "expired": "已过期"}
                status_counts["status_cn"] = status_counts["status"].map(status_map)
                color_map = {"active": "#2ecc71", "near_expiry": "#e67e22", "expired": "#e74c3c"}
                batch_fig = go.Figure(go.Pie(
                    labels=status_counts["status_cn"],
                    values=status_counts["count"],
                    marker=dict(colors=[color_map[s] for s in status_counts["status"]]),
                    hole=0.4,
                ))
                batch_fig.update_layout(title="批次状态分布", **_LAYOUT_COMMON)

            supplier_df = get_supplier_df(session)
            supplier_fig = go.Figure()
            if not supplier_df.empty:
                supplier_fig = create_supplier_rating_chart(supplier_df)

            threshold_df = get_threshold_df(session)
            type_map = {"turnover": "周转天数", "expiry": "效期预警", "stockout": "缺货预警"}
            if not threshold_df.empty:
                threshold_df["threshold_type_cn"] = threshold_df["threshold_type"].map(type_map)
            threshold_columns = [
                {"name": "ID", "id": "id"},
                {"name": "物料编码", "id": "material_code"},
                {"name": "门店编码", "id": "store_code"},
                {"name": "阈值类型", "id": "threshold_type_cn"},
                {"name": "阈值", "id": "threshold_value"},
                {"name": "更新人", "id": "updated_by"},
                {"name": "更新时间", "id": "updated_at"},
            ]

            return (
                [dbc.CardBody([html.H4(str(material_count), className="card-value"), html.P("库存物料总数")])],
                [dbc.CardBody([html.H4(str(alert_count), className="card-value"), html.P("低库存预警数")])],
                [dbc.CardBody([html.H4(str(review_count), className="card-value"), html.P("待处理复盘")])],
                [dbc.CardBody([html.H4(str(avg_turnover), className="card-value"), html.P("平均周转天数")])],
                inv_fig,
                batch_fig,
                supplier_fig,
                threshold_df.to_dict("records"),
                threshold_columns,
            )
        except Exception as e:
            return (
                [dbc.CardBody([html.H4("错误", className="card-value"), html.P("库存物料总数")])],
                [dbc.CardBody([html.H4(str(e), className="card-value"), html.P("低库存预警数")])],
                [dbc.CardBody([html.H4("-", className="card-value"), html.P("待处理复盘")])],
                [dbc.CardBody([html.H4("-", className="card-value"), html.P("平均周转天数")])],
                go.Figure(), go.Figure(), go.Figure(),
                [], [],
            )
        finally:
            Session.remove()

    @app.callback(
        Output("threshold-modal", "is_open"),
        [
            Input("btn-add-threshold", "n_clicks"),
            Input("modal-threshold-close", "n_clicks"),
            Input("modal-threshold-save", "n_clicks"),
        ],
        [State("threshold-modal", "is_open")],
        prevent_initial_call=True,
    )
    def toggle_threshold_modal(add_clicks, close_clicks, save_clicks, is_open):
        ctx = callback_context
        if not ctx.triggered:
            return is_open
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
        if trigger_id in ("btn-add-threshold",):
            return True
        return False

    @app.callback(
        [
            Output("threshold-material-code", "value"),
            Output("threshold-store-code", "value"),
            Output("threshold-type", "value"),
            Output("threshold-value", "value"),
        ],
        [Input("btn-add-threshold", "n_clicks")],
        prevent_initial_call=True,
    )
    def reset_modal_fields(_):
        return "", "", "", None

    @app.callback(
        Output("overview-store", "data"),
        [Input("modal-threshold-save", "n_clicks")],
        [
            State("threshold-material-code", "value"),
            State("threshold-store-code", "value"),
            State("threshold-type", "value"),
            State("threshold-value", "value"),
        ],
        prevent_initial_call=True,
    )
    def save_threshold(_, material_code, store_code, threshold_type, threshold_value):
        if not material_code or not store_code or not threshold_type or threshold_value is None:
            return no_update
        session = Session()
        try:
            create_threshold(
                session,
                material_code=material_code,
                store_code=store_code,
                threshold_type=threshold_type,
                threshold_value=threshold_value,
            )
            session.commit()
            return {"timestamp": pd.Timestamp.now().isoformat()}
        except Exception:
            session.rollback()
            raise
        finally:
            Session.remove()
