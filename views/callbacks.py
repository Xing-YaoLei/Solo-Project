import logging
from datetime import datetime, timedelta

import pandas as pd
import plotly.graph_objects as go
from dash import html, dash_table, Input, Output, State
import dash_bootstrap_components as dbc

from analysis.funnel import get_funnel_data, aggregate_funnel_by_date, aggregate_funnel_by_region
from analysis.comparison import compute_settlement_comparison, compute_tag_comparison
from analysis.fulfillment import (
    get_fulfillment_rate_by_date,
    get_fulfillment_rate_by_region,
    get_fulfillment_detail,
)
from analysis.shortage import (
    get_shortage_overview,
    get_shortage_sample_records,
    get_arrival_checklist_for_batch,
)

logger = logging.getLogger(__name__)

FUNNEL_STAGES = ["下单", "出库", "配送", "签收", "结算"]
FUNNEL_COLORS = ["#636EFA", "#AB63FA", "#FFA15A", "#19D3F3", "#FF6692"]


def register_callbacks(app):
    @app.callback(
        [Output("funnel-chart", "figure")],
        [Input("btn-query", "n_clicks")],
        [
            State("filter-start-date", "date"),
            State("filter-end-date", "date"),
            State("filter-region", "value"),
            State("filter-fulfillment", "value"),
        ],
        prevent_initial_call=False,
    )
    def update_funnel(n_clicks, start_date, end_date, region_code, fulfillment_filter):
        df = get_funnel_data(
            start_date=start_date,
            end_date=end_date,
            region_code=region_code if region_code else None,
        )

        if not df.empty and fulfillment_filter != "all":
            if fulfillment_filter == "below0.8":
                df = df[df["fulfillment_on_time_rate"] < 0.8]
            else:
                threshold = float(fulfillment_filter)
                df = df[df["fulfillment_on_time_rate"] >= threshold]

        if df.empty:
            fig = go.Figure()
            fig.update_layout(title="暂无数据", template="plotly_white")
            return (fig,)

        agg = df.agg(
            {
                "total_orders": "sum",
                "outbound_orders": "sum",
                "delivered_orders": "sum",
                "received_orders": "sum",
                "settled_orders": "sum",
            }
        )
        values = [
            int(agg["total_orders"]),
            int(agg["outbound_orders"]),
            int(agg["delivered_orders"]),
            int(agg["received_orders"]),
            int(agg["settled_orders"]),
        ]

        fig = go.Figure(
            go.Funnel(
                y=FUNNEL_STAGES,
                x=values,
                textinfo="value+percent initial",
                marker={"color": FUNNEL_COLORS},
            )
        )
        fig.update_layout(
            title="预售团单漏斗",
            template="plotly_white",
            height=450,
        )
        return (fig,)

    @app.callback(
        Output("fulfillment-chart", "figure"),
        [
            Input("fulfillment-tab", "value"),
            Input("btn-query", "n_clicks"),
        ],
        [
            State("filter-start-date", "date"),
            State("filter-end-date", "date"),
            State("filter-region", "value"),
        ],
    )
    def update_fulfillment(tab, n_clicks, start_date, end_date, region_code):
        rc = region_code if region_code else None

        if tab == "by-date":
            df = get_fulfillment_rate_by_date(start_date=start_date, end_date=end_date)
            if df.empty:
                return go.Figure().update_layout(title="暂无数据", template="plotly_white")

            fig = go.Figure()
            fig.add_trace(
                go.Bar(
                    x=df["batch_date"],
                    y=df["avg_on_time_rate"],
                    name="平均准时率",
                    marker_color="#636EFA",
                    customdata=df.to_dict("records"),
                )
            )
            fig.add_trace(
                go.Scatter(
                    x=df["batch_date"],
                    y=df["avg_on_time_rate"],
                    mode="lines+markers",
                    name="准时率趋势",
                    line=dict(color="#FF6692", width=2),
                )
            )
            fig.update_layout(
                title="履约准时率（按日期）",
                template="plotly_white",
                yaxis_tickformat=".0%",
                xaxis_title="日期",
                yaxis_title="准时率",
                height=400,
            )
        else:
            df = get_fulfillment_rate_by_region(start_date=start_date, end_date=end_date)
            if df.empty:
                return go.Figure().update_layout(title="暂无数据", template="plotly_white")

            fig = go.Figure()
            fig.add_trace(
                go.Bar(
                    x=df["region_name"],
                    y=df["avg_on_time_rate"],
                    name="平均准时率",
                    marker_color="#AB63FA",
                    customdata=df.to_dict("records"),
                )
            )
            fig.update_layout(
                title="履约准时率（按区域）",
                template="plotly_white",
                yaxis_tickformat=".0%",
                xaxis_title="区域",
                yaxis_title="准时率",
                height=400,
            )

        return fig

    @app.callback(
        Output("comparison-chart", "figure"),
        [
            Input("comparison-tab", "value"),
            Input("btn-query", "n_clicks"),
        ],
        [
            State("filter-start-date", "date"),
            State("filter-end-date", "date"),
            State("filter-region", "value"),
            State("filter-tag", "value"),
        ],
    )
    def update_comparison(tab, n_clicks, start_date, end_date, region_code, tag_name):
        if tab == "settlement":
            df = compute_settlement_comparison(
                start_date=start_date,
                end_date=end_date,
                region_code=region_code if region_code else None,
            )
            if df.empty:
                return go.Figure().update_layout(title="暂无数据", template="plotly_white")

            fig = go.Figure()
            if "period_str" in df.columns and "settled_amount" in df.columns:
                top_skus = df.groupby("sku_name")["settled_amount"].sum().nlargest(5).index
                plot_df = df[df["sku_name"].isin(top_skus)]
                for sku in top_skus:
                    sku_df = plot_df[plot_df["sku_name"] == sku]
                    fig.add_trace(
                        go.Bar(
                            x=sku_df["period_str"],
                            y=sku_df["settled_amount"],
                            name=str(sku),
                        )
                    )
            fig.update_layout(
                title="结算单同环比（周维度 TOP5 SKU）",
                template="plotly_white",
                barmode="group",
                height=400,
            )
        else:
            df = compute_tag_comparison(
                tag_name=tag_name if tag_name else None,
                start_date=start_date,
                end_date=end_date,
            )
            if df.empty:
                return go.Figure().update_layout(title="暂无数据", template="plotly_white")

            fig = go.Figure()
            if "tag_value" in df.columns:
                for tv in df["tag_value"].unique()[:6]:
                    tag_df = df[df["tag_value"] == tv]
                    fig.add_trace(
                        go.Scatter(
                            x=tag_df["settlement_date"],
                            y=tag_df["settled_amount"],
                            mode="lines+markers",
                            name=str(tv),
                        )
                    )
            fig.update_layout(
                title="商品标签同环比",
                template="plotly_white",
                height=400,
            )

        return fig

    @app.callback(
        [Output("shortage-chart", "figure"), Output("shortage-sample-table", "children")],
        [Input("btn-query", "n_clicks")],
        [
            State("filter-start-date", "date"),
            State("filter-end-date", "date"),
            State("filter-region", "value"),
        ],
        prevent_initial_call=False,
    )
    def update_shortage(n_clicks, start_date, end_date, region_code):
        df = get_shortage_overview(
            start_date=start_date,
            end_date=end_date,
            region_code=region_code if region_code else None,
        )

        if df.empty:
            fig = go.Figure()
            fig.update_layout(title="暂无短少数据", template="plotly_white")
            return fig, html.P("暂无短少记录")

        fig = go.Figure()
        if "check_date" in df.columns and "sku_name" in df.columns:
            top_skus = df.groupby("sku_name")["total_shortage"].sum().nlargest(8).index
            plot_df = df[df["sku_name"].isin(top_skus)]
            fig.add_trace(
                go.Bar(
                    x=plot_df["sku_name"],
                    y=plot_df["total_shortage"],
                    name="短少数量",
                    marker_color="#FF6692",
                    customdata=plot_df[["sku_code", "region_code"]].to_dict("records"),
                )
            )
        fig.update_layout(
            title="到货短少概览（TOP8 SKU）",
            template="plotly_white",
            xaxis_title="商品",
            yaxis_title="短少数量",
            height=400,
        )

        sample_df = get_shortage_sample_records(
            start_date=start_date,
            end_date=end_date,
            region_code=region_code if region_code else None,
            limit=10,
        )
        table = _make_table(sample_df, table_id="shortage-sample-tbl")
        return fig, table

    @app.callback(
        Output("batch-detail-modal", "is_open"),
        [
            Input("funnel-chart", "clickData"),
            Input("btn-close-batch-modal", "n_clicks"),
        ],
        [State("batch-detail-modal", "is_open")],
        prevent_initial_call=True,
    )
    def toggle_batch_modal(click_data, close_btn, is_open):
        from dash import callback_context
        ctx = callback_context
        if not ctx.triggered:
            return is_open
        trigger_id = ctx.triggered[0]["prop_id"]
        if "btn-close-batch-modal" in trigger_id:
            return False
        if click_data:
            return True
        return is_open

    @app.callback(
        [
            Output("batch-detail-info", "children"),
            Output("batch-arrival-table", "children"),
        ],
        [Input("funnel-chart", "clickData")],
        prevent_initial_call=True,
    )
    def show_batch_detail(click_data):
        if not click_data:
            return html.P("请点击漏斗图查看批次明细"), html.P("")

        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from db.models import GroupBuyBatch
        from config import config

        engine = create_engine(config.DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        point_index = click_data["points"][0].get("pointIndex", 0)
        fm_df = get_funnel_data(limit_batch=1, offset=point_index)
        if fm_df.empty:
            session.close()
            return html.P("未找到对应批次"), html.P("")

        batch_no = fm_df.iloc[0]["batch_no"]
        gbb = session.query(GroupBuyBatch).filter_by(batch_no=batch_no).first()
        session.close()

        if not gbb:
            return html.P(f"批次 {batch_no} 未找到"), html.P("")

        info = dbc.ListGroup(
            [
                dbc.ListGroupItem(f"批次号: {gbb.batch_no}"),
                dbc.ListGroupItem(f"日期: {gbb.batch_date}"),
                dbc.ListGroupItem(f"区域: {gbb.region_name} ({gbb.region_code})"),
                dbc.ListGroupItem(f"社区: {gbb.community_name}"),
                dbc.ListGroupItem(f"团长: {gbb.leader_name}"),
                dbc.ListGroupItem(f"总订单: {gbb.total_orders}"),
                dbc.ListGroupItem(f"总金额: ¥{gbb.total_amount}"),
                dbc.ListGroupItem(f"预计到货: {gbb.expected_arrival_time}"),
                dbc.ListGroupItem(f"实际到货: {gbb.actual_arrival_time}"),
            ]
        )

        acl_df = get_arrival_checklist_for_batch(batch_no)
        arrival_table = _make_table(acl_df, table_id="batch-arrival-tbl")

        return info, arrival_table

    @app.callback(
        Output("shortage-detail-modal", "is_open"),
        [
            Input("shortage-chart", "clickData"),
            Input("btn-close-shortage-modal", "n_clicks"),
        ],
        [State("shortage-detail-modal", "is_open")],
        prevent_initial_call=True,
    )
    def toggle_shortage_modal(click_data, close_btn, is_open):
        from dash import callback_context
        ctx = callback_context
        if not ctx.triggered:
            return is_open
        trigger_id = ctx.triggered[0]["prop_id"]
        if "btn-close-shortage-modal" in trigger_id:
            return False
        if click_data:
            return True
        return is_open

    @app.callback(
        Output("shortage-detail-content", "children"),
        [Input("shortage-chart", "clickData")],
        [
            State("filter-start-date", "date"),
            State("filter-end-date", "date"),
            State("filter-region", "value"),
        ],
        prevent_initial_call=True,
    )
    def show_shortage_detail(click_data, start_date, end_date, region_code):
        if not click_data:
            return html.P("请点击短少图表柱体查看样本记录")

        customdata = click_data["points"][0].get("customdata")
        sku_code = None
        click_region = None
        if customdata:
            sku_code = customdata.get("sku_code")
            click_region = customdata.get("region_code")

        df = get_shortage_sample_records(
            sku_code=sku_code,
            region_code=click_region or (region_code if region_code else None),
            start_date=start_date,
            end_date=end_date,
            limit=30,
        )

        if df.empty:
            return html.P("未找到短少样本记录")

        return _make_table(df, table_id="shortage-detail-tbl")

    @app.callback(
        Output("sync-batch-table", "children"),
        [Input("btn-query", "n_clicks")],
        prevent_initial_call=False,
    )
    def update_sync_batch_table(n_clicks):
        from sync.warehouse import WarehouseSyncer
        from sync.driver_track import DriverTrackSyncer
        from sync.miniapp_order import MiniappOrderSyncer

        wh_syncer = WarehouseSyncer()
        dt_syncer = DriverTrackSyncer()
        mo_syncer = MiniappOrderSyncer()

        wh_df = wh_syncer.get_batch_history()
        dt_df = dt_syncer.get_batch_history()
        mo_df = mo_syncer.get_batch_history()

        all_df = pd.concat([wh_df, dt_df, mo_df], ignore_index=True)
        if all_df.empty:
            return html.P("暂无同步批次记录")

        display_cols = ["batch_id", "source", "status", "record_count", "started_at", "finished_at"]
        existing_cols = [c for c in display_cols if c in all_df.columns]
        display_df = all_df[existing_cols].head(20)

        return _make_table(display_df, table_id="sync-batch-tbl")


def _make_table(df, table_id="table"):
    if df.empty:
        return html.P("无数据")

    cols = [{"name": col, "id": col} for col in df.columns]
    data = df.to_dict("records")

    for row in data:
        for key in row:
            if pd.isna(row[key]):
                row[key] = ""
            elif isinstance(row[key], (pd.Timestamp, datetime)):
                row[key] = str(row[key])

    return dash_table.DataTable(
        id=table_id,
        columns=cols,
        data=data,
        page_size=10,
        style_table={"overflowX": "auto"},
        style_cell={"textAlign": "left", "fontSize": "12px", "padding": "4px"},
        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
    )
