from datetime import date, timedelta
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from dash import Input, Output, State, no_update
from sqlalchemy import func

from config import DEFAULT_TURNOVER_ALERT_DAYS
from db.connection import Session
from db.models import (
    CleanedInventory, MaterialDailyUsage, BatchInfo, AlertThreshold,
)
from etl.clean_inventory import (
    get_inventory_df, get_batch_df, get_stores_list, get_materials_list,
)
from etl.caliber_match import get_usage_df
from dashboard.components.inventory_ledger import create_inventory_trend_chart


def _get_turnover_threshold(session, store_code, material_code):
    threshold = DEFAULT_TURNOVER_ALERT_DAYS
    if store_code and material_code:
        row = (
            session.query(AlertThreshold)
            .filter(
                AlertThreshold.store_code == store_code,
                AlertThreshold.material_code == material_code,
                AlertThreshold.threshold_type == "turnover",
                AlertThreshold.is_active == True,
            )
            .first()
        )
        if row:
            threshold = float(row.threshold_value)
    return threshold


_LAYOUT_COMMON = dict(
    template="plotly_white",
    font=dict(family="Microsoft YaHei, sans-serif"),
    margin=dict(l=60, r=30, t=50, b=60),
)


def register_trend_callbacks(app):

    @app.callback(
        [
            Output("trend-store-filter", "options"),
            Output("trend-material-filter", "options"),
        ],
        [Input("trend-store", "data")],
        prevent_initial_call=False,
    )
    def load_filter_options(_):
        session = Session()
        try:
            stores = get_stores_list(session)
            store_options = [{"label": s, "value": s} for s in stores]

            materials = get_materials_list(session)
            material_options = [
                {"label": f"{name} ({code})", "value": code}
                for code, name in materials
            ]
            return store_options, material_options
        finally:
            Session.remove()

    @app.callback(
        Output("trend-material-filter", "options", allow_duplicate=True),
        [Input("trend-store-filter", "value")],
        prevent_initial_call=True,
    )
    def update_materials_by_store(store_code):
        if not store_code:
            return no_update
        session = Session()
        try:
            materials = get_materials_list(session, store_code=store_code)
            return [
                {"label": f"{name} ({code})", "value": code}
                for code, name in materials
            ]
        finally:
            Session.remove()

    @app.callback(
        [
            Output("trend-inventory-chart", "figure"),
            Output("trend-usage-chart", "figure"),
            Output("trend-turnover-chart", "figure"),
            Output("trend-expiry-chart", "figure"),
        ],
        [
            Input("trend-store-filter", "value"),
            Input("trend-material-filter", "value"),
            Input("trend-date-range", "start_date"),
            Input("trend-date-range", "end_date"),
        ],
        prevent_initial_call=False,
    )
    def update_trend_charts(store_code, material_code, start_date, end_date):
        session = Session()
        try:
            start = pd.to_datetime(start_date).date() if start_date else (date.today() - timedelta(days=30))
            end = pd.to_datetime(end_date).date() if end_date else date.today()

            inv_df = get_inventory_df(session, store_code=store_code)
            if material_code:
                inv_df = inv_df[inv_df["material_code"] == material_code] if not inv_df.empty else inv_df
            if not inv_df.empty:
                inv_df = inv_df[
                    (inv_df["snapshot_date"] >= start) & (inv_df["snapshot_date"] <= end)
                ]

            inv_fig = go.Figure()
            if not inv_df.empty:
                inv_grouped = inv_df.groupby(["snapshot_date", "material_name"], as_index=False)["stock_qty"].sum()
                inv_fig = create_inventory_trend_chart(inv_grouped)
            else:
                inv_fig.update_layout(title="库存变动趋势（暂无数据）", **_LAYOUT_COMMON)

            usage_df = get_usage_df(
                session,
                store_code=store_code,
                material_code=material_code,
                start_date=start,
                end_date=end,
            )
            usage_fig = go.Figure()
            if not usage_df.empty:
                usage_grouped = usage_df.groupby("usage_date", as_index=False)["usage_qty"].sum()
                usage_fig = px.bar(
                    usage_grouped,
                    x="usage_date",
                    y="usage_qty",
                    title="日均用量趋势",
                )
                usage_fig.update_layout(
                    xaxis_title="日期",
                    yaxis_title="用量",
                    **_LAYOUT_COMMON,
                )
            else:
                usage_fig.update_layout(title="日均用量趋势（暂无数据）", **_LAYOUT_COMMON)

            turnover_threshold = _get_turnover_threshold(session, store_code, material_code)
            turnover_fig = go.Figure()
            if not usage_df.empty and "turnover_days" in usage_df.columns:
                turnover_grouped = usage_df.groupby("usage_date", as_index=False)["turnover_days"].mean()
                turnover_grouped = turnover_grouped.dropna(subset=["turnover_days"])
                if not turnover_grouped.empty:
                    turnover_fig = px.line(
                        turnover_grouped,
                        x="usage_date",
                        y="turnover_days",
                        markers=True,
                        title="周转天数趋势",
                    )
                    turnover_fig.add_hline(
                        y=turnover_threshold, line_dash="dash", line_color="red",
                        annotation_text=f"预警阈值 {turnover_threshold:.0f}天",
                    )
                    turnover_fig.update_layout(
                        xaxis_title="日期",
                        yaxis_title="周转天数",
                        **_LAYOUT_COMMON,
                    )
                else:
                    turnover_fig.update_layout(title="周转天数趋势（暂无数据）", **_LAYOUT_COMMON)
            else:
                turnover_fig.update_layout(title="周转天数趋势（暂无数据）", **_LAYOUT_COMMON)

            batch_df = get_batch_df(session, store_code=store_code, material_code=material_code)
            expiry_fig = go.Figure()
            if not batch_df.empty:
                valid_batch = batch_df.dropna(subset=["expiry_date"]).copy()
                if not valid_batch.empty:
                    expiry_counts = valid_batch.groupby(pd.cut(
                        valid_batch["days_to_expiry"],
                        bins=[-9999, 0, 7, 14, 30, 60, 9999],
                        labels=["已过期", "0-7天", "7-14天", "14-30天", "30-60天", "60天以上"],
                    )).size().reset_index(name="count")
                    color_map = {
                        "已过期": "#e74c3c",
                        "0-7天": "#e67e22",
                        "7-14天": "#f39c12",
                        "14-30天": "#f1c40f",
                        "30-60天": "#3498db",
                        "60天以上": "#2ecc71",
                    }
                    expiry_fig = go.Figure(go.Bar(
                        x=expiry_counts["days_to_expiry"],
                        y=expiry_counts["count"],
                        marker_color=[color_map.get(str(cat), "#95a5a6") for cat in expiry_counts["days_to_expiry"]],
                    ))
                    expiry_fig.update_layout(
                        title="批次到期分布",
                        xaxis_title="距到期天数区间",
                        yaxis_title="批次数量",
                        **_LAYOUT_COMMON,
                    )
                else:
                    expiry_fig.update_layout(title="批次到期分布（暂无数据）", **_LAYOUT_COMMON)
            else:
                expiry_fig.update_layout(title="批次到期分布（暂无数据）", **_LAYOUT_COMMON)

            return inv_fig, usage_fig, turnover_fig, expiry_fig
        finally:
            Session.remove()
