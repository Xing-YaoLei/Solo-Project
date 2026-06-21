import dash
from dash import Input, Output, State, callback_context, html, dcc, ALL, MATCH, ALLSMALLER, Dash
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import base64
import io

from app import app, cache
from layouts import (
    build_funnel_layout,
    build_orders_layout,
    build_tracks_layout,
    build_subsidy_layout,
    build_anomaly_layout,
    build_review_layout,
)
from tasks.data_tasks import (
    get_funnel_data,
    get_orders_data,
    get_rider_tracks,
    get_anomalies,
    get_subsidy_rules,
    get_review_notes,
    get_track_anomaly_notes,
    get_all_review_notes,
    get_saved_views,
    add_review_note,
    add_track_anomaly_note,
    save_view,
    resolve_anomaly,
)
from tasks.sync_tasks import sync_instant_orders, ensure_riders_exist, sync_rider_tracks
from tasks.anomaly_tasks import run_all_anomaly_detection
from tasks.compensation_tasks import (
    ensure_subsidy_rules_exist,
    bulk_calculate_compensation,
    get_compensation_rules_explanation,
    calculate_compensation,
)
from tasks.data_tasks import export_report_excel
from models import get_db, Order, RiderTrack, Rider


FUNNEL_STAGE_LABELS = {
    "order_created": "下单",
    "payment_initiated": "发起支付",
    "payment_completed": "支付完成",
    "order_dispatched": "派单",
    "rider_assigned": "骑手接单",
    "rider_arrived": "骑手到达",
    "order_picked": "取货",
    "in_delivery": "配送中",
    "order_delivered": "送达",
    "order_completed": "完成",
}

ANOMALY_TYPE_LABELS = {
    "system_delay": "系统延迟",
    "payment_missing": "支付流水缺失",
    "map_calibration_change": "地图口径变化",
    "rider_reject_spike": "骑手拒单趋势",
}

SEVERITY_COLORS = {
    "high": "#dc3545",
    "medium": "#ffc107",
    "low": "#28a745",
}


@app.callback(Output("tab-content", "children"), [Input("main-tabs", "active_tab")])
def render_tab_content(active_tab):
    if active_tab == "funnel":
        return build_funnel_layout()
    elif active_tab == "orders":
        return build_orders_layout()
    elif active_tab == "tracks":
        return build_tracks_layout()
    elif active_tab == "subsidy":
        return build_subsidy_layout()
    elif active_tab == "anomaly":
        return build_anomaly_layout()
    elif active_tab == "review":
        return build_review_layout()
    return html.Div()


@app.callback(
    [
        Output("alert-banner-container", "children"),
        Output("anomaly-count-badge", "children"),
    ],
    [
        Input("refresh-trigger", "data"),
        Input("interval-refresh", "n_intervals"),
    ],
)
def update_alerts(_, __):
    try:
        anomalies_df = get_anomalies(is_resolved=False)
        if anomalies_df.empty:
            return [], "0 未处理异常"

        alerts = []
        type_counts = anomalies_df["anomaly_type"].value_counts()

        for atype, count in type_counts.items():
            label = ANOMALY_TYPE_LABELS.get(atype, atype)
            severity = anomalies_df[anomalies_df["anomaly_type"] == atype]["severity"].iloc[0]
            color = SEVERITY_COLORS.get(severity, "warning")
            alerts.append(
                dbc.Alert(
                    [
                        html.I(className="fas fa-exclamation-triangle me-2"),
                        f"检测到 {count} 条【{label}】异常，请及时处理",
                    ],
                    color=color,
                    dismissable=True,
                    className="mb-2",
                )
            )

        return alerts, f"{len(anomalies_df)} 未处理异常"
    except Exception as e:
        return [], "异常计数失败"


@app.callback(
    Output("refresh-trigger", "data"),
    [
        Input("btn-refresh", "n_clicks"),
        Input("btn-refresh-data", "n_clicks"),
    ],
    [State("refresh-trigger", "data")],
)
def trigger_refresh(btn1, btn2, current):
    ctx = callback_context
    if not ctx.triggered:
        return current
    try:
        ensure_riders_exist.delay().get()
        sync_instant_orders.delay().get()
        sync_rider_tracks.delay().get()
        ensure_subsidy_rules_exist.delay().get()
        run_all_anomaly_detection.delay().get()
        bulk_calculate_compensation.delay().get()
    except Exception:
        pass
    return current + 1 if current else 1


@app.callback(
    [Output("funnel-chart", "figure"), Output("funnel-metrics", "children"), Output("dropoff-reason-chart", "figure")],
    [Input("date-range-picker", "start_date"), Input("date-range-picker", "end_date"), Input("refresh-trigger", "data")],
)
def update_funnel(start_date, end_date, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        funnel_df = get_funnel_data(start_dt, end_dt)
        orders_df = get_orders_data(start_dt, end_dt)

        if funnel_df.empty or orders_df.empty:
            empty_fig = go.Figure()
            empty_fig.update_layout(title="暂无数据")
            return empty_fig, html.Div("暂无数据"), empty_fig

        stage_order = list(FUNNEL_STAGE_LABELS.keys())
        stage_counts = funnel_df.groupby("event_name")["order_id"].nunique().reindex(stage_order).fillna(0)

        total_orders = len(orders_df)
        completed_orders = len(orders_df[orders_df["status"] == "completed"])
        conversion_rate = completed_orders / total_orders if total_orders > 0 else 0

        avg_duration = funnel_df.groupby("event_name")["duration_seconds"].mean().reindex(stage_order).fillna(0)

        fig = go.Figure()
        colors = ["#636EFA", "#EF553B", "#00CC96", "#AB63FA", "#FFA15A", "#19D3F3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52"]

        fig.add_trace(go.Funnel(
            name="订单数",
            y=[FUNNEL_STAGE_LABELS.get(s, s) for s in stage_order],
            x=stage_counts.values,
            textinfo="value+percent initial",
            marker={"color": colors},
        ))

        fig.update_layout(
            title="即时下单转化漏斗",
            margin=dict(l=120),
        )

        metrics = [
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("总订单数", className="card-subtitle text-muted"),
                        html.H2(f"{total_orders}", className="card-title text-primary"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("已完成", className="card-subtitle text-muted"),
                        html.H2(f"{completed_orders}", className="card-title text-success"),
                    ]),
                ])),
            ], className="mb-2"),
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("整体转化率", className="card-subtitle text-muted"),
                        html.H2(f"{conversion_rate:.1%}", className="card-title text-info"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("系统延迟订单", className="card-subtitle text-muted"),
                        html.H2(f"{len(orders_df[orders_df['system_delay_seconds'] > 300])}", className="card-title text-danger"),
                    ]),
                ])),
            ], className="mb-2"),
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("支付流水缺失", className="card-subtitle text-muted"),
                        html.H2(f"{len(orders_df[orders_df['payment_status'] == 'missing'])}", className="card-title text-warning"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("骑手拒单率", className="card-subtitle text-muted"),
                        html.H2(f"{orders_df['rider_rejected'].mean():.1%}", className="card-title text-secondary"),
                    ]),
                ])),
            ]),
        ]

        dropoff_df = funnel_df[funnel_df["is_drop_off"] == True]
        if not dropoff_df.empty:
            reason_counts = dropoff_df["drop_off_reason"].value_counts()
            reason_labels = {
                "rider_rejected": "骑手拒单",
                "payment_timeout": "支付超时",
                None: "其他",
            }
            reason_df = pd.DataFrame({
                "reason": [reason_labels.get(r, r) for r in reason_counts.index],
                "count": reason_counts.values,
            })
            dropoff_fig = px.pie(reason_df, values="count", names="reason", title="流失原因")
            dropoff_fig.update_layout(showlegend=True, margin=dict(l=10, r=10, t=40, b=10))
        else:
            dropoff_fig = go.Figure()
            dropoff_fig.update_layout(title="暂无流失数据")

        return fig, metrics, dropoff_fig
    except Exception as e:
        empty_fig = go.Figure()
        empty_fig.update_layout(title=f"加载失败: {str(e)}")
        return empty_fig, html.Div(f"加载失败: {str(e)}"), empty_fig


@app.callback(
    Output("funnel-detail-table", "children"),
    [Input("date-range-picker", "start_date"), Input("date-range-picker", "end_date"), Input("refresh-trigger", "data")],
)
def update_funnel_detail(start_date, end_date, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        funnel_df = get_funnel_data(start_dt, end_dt)
        if funnel_df.empty:
            return html.Thead(html.Tr(html.Th("暂无数据")))

        stage_order = list(FUNNEL_STAGE_LABELS.keys())
        stage_stats = funnel_df.groupby("event_name").agg({
            "order_id": "nunique",
            "duration_seconds": ["mean", "max"],
            "is_drop_off": "sum",
        }).reindex(stage_order).fillna(0)

        stage_stats.columns = ["订单数", "平均耗时(秒)", "最大耗时(秒)", "流失数"]
        stage_stats = stage_stats.reset_index()
        stage_stats["event_name"] = stage_stats["event_name"].map(FUNNEL_STAGE_LABELS)
        stage_stats.columns = ["阶段", "订单数", "平均耗时(秒)", "最大耗时(秒)", "流失数"]

        stage_stats["转化率"] = (stage_stats["订单数"] / stage_stats["订单数"].iloc[0]).apply(lambda x: f"{x:.1%}")
        stage_stats["平均耗时(秒)"] = stage_stats["平均耗时(秒)"].apply(lambda x: f"{x:.0f}")
        stage_stats["最大耗时(秒)"] = stage_stats["最大耗时(秒)"].apply(lambda x: f"{x:.0f}")

        return [
            html.Thead(html.Tr([html.Th(col) for col in stage_stats.columns])),
            html.Tbody([
                html.Tr([html.Td(row[col]) for col in stage_stats.columns])
                for _, row in stage_stats.iterrows()
            ]),
        ]
    except Exception as e:
        return html.Thead(html.Tr(html.Th(f"加载失败: {str(e)}")))


@app.callback(
    [Output("orders-map", "figure"), Output("orders-stats", "children"), Output("orders-table", "children")],
    [
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("order-status-filter", "value"),
        Input("payment-status-filter", "value"),
        Input("map-version-filter", "value"),
        Input("refresh-trigger", "data"),
    ],
)
def update_orders(start_date, end_date, status_filter, payment_filter, map_filter, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        orders_df = get_orders_data(start_dt, end_dt)

        if orders_df.empty:
            empty_fig = go.Figure()
            empty_fig.update_layout(title="暂无数据")
            return empty_fig, html.Div("暂无数据"), html.Thead(html.Tr(html.Th("暂无数据")))

        df = orders_df.copy()
        if status_filter and status_filter != "all":
            df = df[df["status"] == status_filter]
        if payment_filter and payment_filter != "all":
            df = df[df["payment_status"] == payment_filter]
        if map_filter and map_filter != "all":
            df = df[df["map_calibration_version"] == map_filter]

        if df.empty:
            empty_fig = go.Figure()
            empty_fig.update_layout(title="暂无匹配数据")
            return empty_fig, html.Div("暂无匹配数据"), html.Thead(html.Tr(html.Th("暂无匹配数据")))

        map_df = df[df["pickup_lat"].notna() & df["pickup_lng"].notna()].copy()
        if not map_df.empty:
            color_map = {
                "completed": "#28a745",
                "in_progress": "#17a2b8",
                "rejected": "#dc3545",
            }
            map_df["color"] = map_df["status"].map(color_map).fillna("#6c757d")

            fig = go.Figure()

            fig.add_trace(go.Scattermapbox(
                lat=map_df["pickup_lat"],
                lon=map_df["pickup_lng"],
                mode="markers",
                marker=go.scattermapbox.Marker(size=8, color=map_df["color"], opacity=0.7),
                text=map_df.apply(lambda r: f"{r['order_no']} | {r['status']} | {r['pickup_address']}", axis=1),
                hoverinfo="text",
                name="取货点",
            ))

            delivery_df = map_df[map_df["delivery_lat"].notna()]
            if not delivery_df.empty:
                fig.add_trace(go.Scattermapbox(
                    lat=delivery_df["delivery_lat"],
                    lon=delivery_df["delivery_lng"],
                    mode="markers",
                    marker=go.scattermapbox.Marker(size=6, color="#ffc107", opacity=0.5),
                    text=delivery_df["delivery_address"],
                    hoverinfo="text",
                    name="送货点",
                ))

            fig.update_layout(
                mapbox=dict(
                    style="carto-positron",
                    zoom=11,
                    center=dict(lat=map_df["pickup_lat"].mean(), lon=map_df["pickup_lng"].mean()),
                ),
                margin={"r": 0, "t": 0, "l": 0, "b": 0},
                showlegend=True,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
        else:
            fig = go.Figure()
            fig.update_layout(title="暂无地图数据")

        total_amount = df["amount"].sum()
        total_subsidy = df["subsidy_amount"].sum()
        total_compensation = df["compensation_amount"].sum()
        avg_distance = df["distance_km"].mean()

        stats = [
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("订单数", className="card-subtitle text-muted"),
                        html.H3(f"{len(df)}", className="card-title text-primary"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("订单金额", className="card-subtitle text-muted"),
                        html.H3(f"¥{total_amount:.0f}", className="card-title text-success"),
                    ]),
                ])),
            ], className="mb-2"),
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("补贴金额", className="card-subtitle text-muted"),
                        html.H3(f"¥{total_subsidy:.0f}", className="card-title text-warning"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("赔付金额", className="card-subtitle text-muted"),
                        html.H3(f"¥{total_compensation:.0f}", className="card-title text-danger"),
                    ]),
                ])),
            ], className="mb-2"),
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("平均距离", className="card-subtitle text-muted"),
                        html.H3(f"{avg_distance:.1f}km", className="card-title text-info"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("地图版本数", className="card-subtitle text-muted"),
                        html.H3(f"{df['map_calibration_version'].nunique()}", className="card-title text-secondary"),
                    ]),
                ])),
            ]),
        ]

        table_df = df[[
            "order_no", "status", "pickup_address", "delivery_address",
            "distance_km", "amount", "subsidy_amount", "compensation_amount",
            "payment_status", "rider_rejected", "map_calibration_version", "created_at",
        ]].copy()
        table_df["created_at"] = pd.to_datetime(table_df["created_at"]).dt.strftime("%Y-%m-%d %H:%M")
        table_df.columns = [
            "订单号", "状态", "取货地址", "送货地址", "距离(km)",
            "金额(¥)", "补贴(¥)", "赔付(¥)", "支付状态", "是否拒单", "地图版本", "创建时间",
        ]

        table_header = [html.Thead(html.Tr([html.Th(col) for col in table_df.columns]))]
        table_body = [
            html.Tbody([
                html.Tr(
                    [html.Td(row[col]) for col in table_df.columns],
                    id={"type": "order-row", "index": int(df[df["order_no"] == row["订单号"]].index[0]) if not df[df["order_no"] == row["订单号"]].empty else 0},
                    style={"cursor": "pointer"},
                )
                for _, row in table_df.head(100).iterrows()
            ])
        ]

        return fig, stats, table_header + table_body
    except Exception as e:
        empty_fig = go.Figure()
        empty_fig.update_layout(title=f"加载失败: {str(e)}")
        return empty_fig, html.Div(f"加载失败: {str(e)}"), html.Thead(html.Tr(html.Th(f"加载失败: {str(e)}")))


@app.callback(
    Output("order-detail-modal", "is_open"),
    [
        Input({"type": "order-row", "index": ALL}, "n_clicks"),
        Input("btn-close-order-detail", "n_clicks"),
    ],
    [State("order-detail-modal", "is_open")],
)
def toggle_order_modal(row_clicks, close_click, is_open):
    ctx = callback_context
    if not ctx.triggered:
        return False
    trigger = ctx.triggered[0]["prop_id"]
    if "btn-close-order-detail" in trigger:
        return False
    if any(n for n in row_clicks if n):
        return True
    return is_open


@app.callback(
    Output("order-detail-body", "children"),
    [Input({"type": "order-row", "index": ALL}, "n_clicks")],
    [State("date-range-picker", "start_date"), State("date-range-picker", "end_date")],
)
def update_order_detail(row_clicks, start_date, end_date):
    ctx = callback_context
    if not ctx.triggered or not any(n for n in row_clicks if n):
        return html.Div("请选择订单")

    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
        orders_df = get_orders_data(start_dt, end_dt)

        if orders_df.empty:
            return html.Div("暂无订单数据")

        for idx, clicks in enumerate(row_clicks):
            if clicks and idx < len(orders_df):
                order_row = orders_df.iloc[idx]
                order_id = int(order_row["id"])

                db = next(get_db())
                order = db.query(Order).filter(Order.id == order_id).first()
                if not order:
                    return html.Div("订单不存在")

                review_notes = get_review_notes(order_id=order_id)
                comp, breakdown = calculate_compensation(order)

                detail = [
                    dbc.Row([
                        dbc.Col([
                            html.H5(f"订单号: {order.order_no}"),
                            html.P(f"状态: {order.status}"),
                            html.P(f"创建时间: {order.created_at}"),
                            html.Hr(),
                            html.P(f"取货地址: {order.pickup_address}"),
                            html.P(f"送货地址: {order.delivery_address}"),
                            html.P(f"距离: {order.distance_km} km"),
                            html.P(f"地图版本: {order.map_calibration_version}"),
                        ], width=6),
                        dbc.Col([
                            html.H6("费用明细"),
                            html.P(f"订单金额: ¥{order.amount:.2f}"),
                            html.P(f"补贴金额: ¥{order.subsidy_amount:.2f}"),
                            html.P(f"赔付金额: ¥{order.compensation_amount:.2f}"),
                            html.Hr(),
                            html.P(f"支付状态: {order.payment_status}"),
                            html.P(f"骑手拒单: {'是' if order.rider_rejected else '否'} (拒单次数: {order.reject_count})"),
                            html.P(f"系统延迟: {order.system_delay_seconds}秒"),
                        ], width=6),
                    ]),
                    html.Hr(),
                    html.H6("赔付计算明细"),
                    html.Pre(str(breakdown)),
                    html.Hr(),
                    html.H6("复盘备注"),
                ]

                if not review_notes.empty:
                    for _, note in review_notes.iterrows():
                        detail.append(
                            dbc.Card([
                                dbc.CardHeader([
                                    html.Strong(f"{note.get('author', '未知')} "),
                                    dbc.Badge(note.get("review_type", ""), color="info", className="ms-2"),
                                    dbc.Badge(note.get("judgment_tag", ""), color="warning", className="ms-1"),
                                    html.Span(f" - {note.get('created_at', '')}", className="text-muted ms-2"),
                                ]),
                                dbc.CardBody(note.get("content", "")),
                            ], className="mb-2")
                        )
                else:
                    detail.append(html.P("暂无复盘备注"))

                return detail
    except Exception as e:
        return html.Div(f"加载失败: {str(e)}")


@app.callback(
    [Output("rider-dropdown", "options"), Output("track-order-dropdown", "options")],
    [Input("date-range-picker", "start_date"), Input("date-range-picker", "end_date"), Input("refresh-trigger", "data")],
)
def update_track_dropdowns(start_date, end_date, _):
    try:
        db = next(get_db())
        riders = db.query(Rider).order_by(Rider.rider_no).all()
        rider_options = [{"label": f"{r.rider_no} - {r.name}", "value": r.id} for r in riders]

        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
        orders_df = get_orders_data(start_dt, end_dt)
        order_options = []
        if not orders_df.empty:
            order_options = [{"label": r["order_no"], "value": int(r["id"])} for _, r in orders_df.iterrows()]

        return rider_options, order_options
    except Exception as e:
        return [], []


@app.callback(
    [Output("track-map", "figure"), Output("track-stats", "children"), Output("track-detail-table", "children"), Output("anomaly-points-table", "children")],
    [
        Input("rider-dropdown", "value"),
        Input("track-order-dropdown", "value"),
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("btn-toggle-anomalies", "n_clicks"),
        Input("refresh-trigger", "data"),
    ],
)
def update_tracks(rider_id, order_id, start_date, end_date, toggle_clicks, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        show_anomalies = toggle_clicks and toggle_clicks % 2 == 1

        tracks_df = get_rider_tracks(rider_id=rider_id, order_id=order_id, start_date=start_dt, end_date=end_dt)

        if tracks_df.empty:
            empty_fig = go.Figure()
            empty_fig.update_layout(title="请选择骑手或订单查看轨迹")
            return empty_fig, html.Div("暂无轨迹数据"), html.Thead(html.Tr(html.Th("暂无数据"))), html.Thead(html.Tr(html.Th("暂无异常点")))

        df = tracks_df.copy()

        fig = go.Figure()

        normal_df = df[~df["is_anomaly"]] if show_anomalies else df
        if not normal_df.empty:
            fig.add_trace(go.Scattermapbox(
                lat=normal_df["lat"],
                lon=normal_df["lng"],
                mode="lines+markers",
                marker=go.scattermapbox.Marker(size=6, color="#17a2b8"),
                line=dict(width=2, color="#17a2b8"),
                text=normal_df.apply(lambda r: f"{r['timestamp']} | 速度:{r['speed']}km/h", axis=1),
                hoverinfo="text",
                name="正常轨迹",
            ))

        if show_anomalies:
            anomaly_df = df[df["is_anomaly"]]
            if not anomaly_df.empty:
                fig.add_trace(go.Scattermapbox(
                    lat=anomaly_df["lat"],
                    lon=anomaly_df["lng"],
                    mode="markers",
                    marker=go.scattermapbox.Marker(size=14, color="#dc3545", symbol="marker"),
                    text=anomaly_df.apply(lambda r: f"异常:{r.get('anomaly_type', '')} | {r.get('anomaly_note', '无备注')}", axis=1),
                    hoverinfo="text",
                    name="异常点",
                ))

        center_lat = df["lat"].mean()
        center_lng = df["lng"].mean()
        fig.update_layout(
            mapbox=dict(
                style="carto-positron",
                zoom=13,
                center=dict(lat=center_lat, lon=center_lng),
            ),
            margin={"r": 0, "t": 0, "l": 0, "b": 0},
            showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )

        total_points = len(df)
        anomaly_points = len(df[df["is_anomaly"]])
        avg_speed = df["speed"].mean()
        time_span = None
        if len(df) >= 2:
            time_span = (pd.to_datetime(df["timestamp"]).max() - pd.to_datetime(df["timestamp"]).min()).total_seconds() / 60

        stats = [
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("轨迹点数", className="card-subtitle text-muted"),
                        html.H3(f"{total_points}", className="card-title text-primary"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("异常点数", className="card-subtitle text-muted"),
                        html.H3(f"{anomaly_points}", className="card-title text-danger"),
                    ]),
                ])),
            ], className="mb-2"),
            dbc.Row([
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("平均速度", className="card-subtitle text-muted"),
                        html.H3(f"{avg_speed:.1f} km/h", className="card-title text-info"),
                    ]),
                ])),
                dbc.Col(dbc.Card([
                    dbc.CardBody([
                        html.H6("时长", className="card-subtitle text-muted"),
                        html.H3(f"{time_span:.0f}分钟" if time_span else "-", className="card-title text-success"),
                    ]),
                ])),
            ]),
        ]

        detail_df = df[["timestamp", "lat", "lng", "speed", "is_anomaly", "anomaly_type", "anomaly_note"]].copy()
        detail_df["timestamp"] = pd.to_datetime(detail_df["timestamp"]).dt.strftime("%H:%M:%S")
        detail_df.columns = ["时间", "纬度", "经度", "速度(km/h)", "是否异常", "异常类型", "备注"]
        detail_table = [
            html.Thead(html.Tr([html.Th(col) for col in detail_df.columns])),
            html.Tbody([
                html.Tr(
                    [html.Td(row[col]) for col in detail_df.columns],
                    style={"backgroundColor": "#fff3cd"} if row["是否异常"] else {},
                    id={"type": "track-row", "index": idx},
                )
                for idx, row in detail_df.iterrows()
            ]),
        ]

        anomaly_table_content = html.Thead(html.Tr(html.Th("暂无异常点")))
        if anomaly_points > 0:
            anom_df = df[df["is_anomaly"]][["timestamp", "anomaly_type", "anomaly_note"]].copy()
            anom_df["timestamp"] = pd.to_datetime(anom_df["timestamp"]).dt.strftime("%Y-%m-%d %H:%M")
            anom_df.columns = ["时间", "异常类型", "备注"]
            anomaly_table_content = [
                html.Thead(html.Tr([html.Th(col) for col in anom_df.columns])),
                html.Tbody([
                    html.Tr([html.Td(row[col]) for col in anom_df.columns])
                    for _, row in anom_df.iterrows()
                ]),
            ]

        return fig, stats, detail_table, anomaly_table_content
    except Exception as e:
        empty_fig = go.Figure()
        empty_fig.update_layout(title=f"加载失败: {str(e)}")
        return empty_fig, html.Div(f"加载失败: {str(e)}"), html.Thead(html.Tr(html.Th(f"加载失败: {str(e)}"))), html.Thead(html.Tr(html.Th("加载失败")))


@app.callback(
    [Output("subsidy-rules-table", "children"), Output("subsidy-distribution-chart", "figure"), Output("compensation-rules", "children"), Output("subsidy-orders-table", "children")],
    [Input("date-range-picker", "start_date"), Input("date-range-picker", "end_date"), Input("refresh-trigger", "data")],
)
def update_subsidy(start_date, end_date, _):
    try:
        rules_df = get_subsidy_rules(is_active=True)
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
        orders_df = get_orders_data(start_dt, end_dt)

        rules_table = html.Thead(html.Tr(html.Th("暂无补贴规则")))
        if not rules_df.empty:
            rules_display = rules_df[[
                "rule_name", "rule_type", "conditions", "subsidy_amount", "subsidy_percentage",
                "effective_from", "effective_to", "saved_view_name",
            ]].copy()
            rules_display.columns = ["规则名称", "类型", "条件", "补贴金额(¥)", "补贴比例", "生效开始", "生效结束", "关联视图"]
            rules_table = [
                html.Thead(html.Tr([html.Th(col) for col in rules_display.columns])),
                html.Tbody([
                    html.Tr([html.Td(row[col]) for col in rules_display.columns])
                    for _, row in rules_display.iterrows()
                ]),
            ]

        dist_fig = go.Figure()
        if not orders_df.empty:
            subsidy_orders = orders_df[orders_df["subsidy_amount"] > 0]
            if not subsidy_orders.empty:
                dist_fig = px.histogram(
                    subsidy_orders, x="subsidy_amount", nbins=20,
                    title="补贴金额分布",
                    labels={"subsidy_amount": "补贴金额(¥)"},
                )
            else:
                dist_fig.update_layout(title="暂无补贴订单")
        else:
            dist_fig.update_layout(title="暂无订单数据")

        comp_rules = get_compensation_rules_explanation()
        comp_rules_html = []
        for key, rule in comp_rules.items():
            comp_rules_html.append(
                dbc.Card([
                    dbc.CardHeader(html.Strong(rule.get("description", key))),
                    dbc.CardBody([
                        html.P([html.I(className="fas fa-calculator me-2"), f"公式: {rule.get('formula', '')}"]),
                    ]),
                ], className="mb-2", outline=True, color="info")
            )

        subsidy_orders_table = html.Thead(html.Tr(html.Th("暂无补贴订单")))
        if not orders_df.empty:
            sub_orders = orders_df[orders_df["subsidy_amount"] > 0][[
                "order_no", "status", "amount", "subsidy_amount", "compensation_amount", "distance_km", "created_at",
            ]].copy()
            if not sub_orders.empty:
                sub_orders["created_at"] = pd.to_datetime(sub_orders["created_at"]).dt.strftime("%Y-%m-%d %H:%M")
                sub_orders.columns = ["订单号", "状态", "金额(¥)", "补贴(¥)", "赔付(¥)", "距离(km)", "创建时间"]
                subsidy_orders_table = [
                    html.Thead(html.Tr([html.Th(col) for col in sub_orders.columns])),
                    html.Tbody([
                        html.Tr([html.Td(row[col]) for col in sub_orders.columns])
                        for _, row in sub_orders.head(100).iterrows()
                    ]),
                ]

        return rules_table, dist_fig, comp_rules_html, subsidy_orders_table
    except Exception as e:
        return html.Thead(html.Tr(html.Th(f"加载失败"))), go.Figure(), html.Div(f"加载失败: {str(e)}"), html.Thead(html.Tr(html.Th("加载失败")))


@app.callback(
    [Output("anomaly-trend-chart", "figure"), Output("anomaly-type-chart", "figure"), Output("anomalies-table", "children"), Output("reject-trend-chart", "figure")],
    [
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("anomaly-type-filter", "value"),
        Input("anomaly-resolved-filter", "value"),
        Input("refresh-trigger", "data"),
    ],
)
def update_anomaly(start_date, end_date, type_filter, resolved_filter, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        anomalies_df = get_anomalies(start_date=start_dt, end_date=end_dt)
        orders_df = get_orders_data(start_dt, end_dt)

        trend_fig = go.Figure()
        type_fig = go.Figure()
        table_content = html.Thead(html.Tr(html.Th("暂无异常数据")))
        reject_fig = go.Figure()

        if not anomalies_df.empty:
            df = anomalies_df.copy()
            if type_filter and type_filter != "all":
                df = df[df["anomaly_type"] == type_filter]
            if resolved_filter and resolved_filter != "all":
                df = df[df["is_resolved"] == (resolved_filter == "resolved")]

            if not df.empty:
                df["detected_date"] = pd.to_datetime(df["detected_at"]).dt.date
                daily = df.groupby(["detected_date", "anomaly_type"]).size().unstack(fill_value=0).reset_index()

                for atype in daily.columns[1:]:
                    trend_fig.add_trace(go.Scatter(
                        x=daily["detected_date"],
                        y=daily[atype],
                        mode="lines+markers",
                        name=ANOMALY_TYPE_LABELS.get(atype, atype),
                    ))

                trend_fig.update_layout(title="异常检测趋势", xaxis_title="日期", yaxis_title="异常数")

                type_counts = df["anomaly_type"].value_counts()
                type_fig = px.pie(
                    names=[ANOMALY_TYPE_LABELS.get(t, t) for t in type_counts.index],
                    values=type_counts.values,
                    title="异常类型分布",
                )

                display_df = df[[
                    "anomaly_type", "severity", "description", "affected_from", "affected_to",
                    "is_resolved", "compensation_applied", "detected_at",
                ]].copy()
                display_df["anomaly_type"] = display_df["anomaly_type"].map(ANOMALY_TYPE_LABELS)
                display_df["detected_at"] = pd.to_datetime(display_df["detected_at"]).dt.strftime("%Y-%m-%d %H:%M")
                display_df["affected_from"] = pd.to_datetime(display_df["affected_from"]).dt.strftime("%Y-%m-%d %H:%M")
                display_df["affected_to"] = pd.to_datetime(display_df["affected_to"]).dt.strftime("%Y-%m-%d %H:%M")
                display_df["is_resolved"] = display_df["is_resolved"].map({True: "已处理", False: "未处理"})
                display_df.columns = ["异常类型", "严重程度", "描述", "影响开始", "影响结束", "状态", "已赔付(¥)", "检测时间"]

                table_content = [
                    html.Thead(html.Tr([html.Th(col) for col in display_df.columns])),
                    html.Tbody([
                        html.Tr(
                            [html.Td(row[col]) for col in display_df.columns],
                            id={"type": "anomaly-row", "index": idx},
                            style={
                                "cursor": "pointer",
                                "backgroundColor": SEVERITY_COLORS.get(row.get("严重程度", ""), "") + "20",
                            },
                        )
                        for idx, row in display_df.iterrows()
                    ]),
                ]

        if not orders_df.empty:
            orders_df["hour"] = pd.to_datetime(orders_df["created_at"]).dt.floor("h")
            hourly = orders_df.groupby("hour").agg({
                "rider_rejected": ["sum", "count"],
            }).reset_index()
            hourly.columns = ["hour", "rejected", "total"]
            hourly["reject_rate"] = hourly["rejected"] / hourly["total"]

            reject_fig = go.Figure()
            reject_fig.add_trace(go.Scatter(
                x=hourly["hour"],
                y=hourly["reject_rate"],
                mode="lines+markers",
                name="拒单率",
                line=dict(color="#17a2b8"),
            ))

            if not anomalies_df.empty:
                reject_anomalies = anomalies_df[anomalies_df["anomaly_type"] == "rider_reject_spike"]
                for _, anom in reject_anomalies.iterrows():
                    reject_fig.add_vrect(
                        x0=anom["affected_from"],
                        x1=anom["affected_to"],
                        fillcolor="#dc3545",
                        opacity=0.2,
                        layer="below",
                        line_width=0,
                        annotation_text=f"异常区间: {ANOMALY_TYPE_LABELS.get(anom['anomaly_type'], '')}",
                        annotation_position="top left",
                    )

            reject_fig.update_layout(
                title="骑手拒单率趋势（红色区域为受影响区间）",
                xaxis_title="时间",
                yaxis_title="拒单率",
                yaxis=dict(tickformat=".1%"),
            )

        return trend_fig, type_fig, table_content, reject_fig
    except Exception as e:
        return go.Figure(), go.Figure(), html.Thead(html.Tr(html.Th(f"加载失败: {str(e)}"))), go.Figure()


@app.callback(
    [Output("review-timeline", "children"), Output("review-notes-table", "children"), Output("review-order-dropdown", "options")],
    [
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("review-type-filter", "value"),
        Input("refresh-trigger", "data"),
    ],
)
def update_review(start_date, end_date, type_filter, _):
    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        all_notes_df = get_all_review_notes(start_date=start_dt, end_date=end_dt)
        orders_df = get_orders_data(start_dt, end_dt)

        order_options = []
        if not orders_df.empty:
            order_options = [{"label": r["order_no"], "value": int(r["id"])} for _, r in orders_df.iterrows()]

        timeline = html.Div("暂无复盘备注")
        table_content = html.Thead(html.Tr(html.Th("暂无复盘备注")))

        if not all_notes_df.empty:
            df = all_notes_df.copy()

            if type_filter and type_filter != "all":
                if type_filter == "order":
                    df = df[df["type"] == "review"]
                elif type_filter == "anomaly":
                    df = df[df["type"] == "review"]
                    if "review_type" in df.columns:
                        df = df[df["review_type"] == "anomaly_analysis"]
                elif type_filter == "track":
                    df = df[df["type"] == "track_anomaly"]

            if df.empty:
                return html.Div("暂无匹配的备注"), html.Thead(html.Tr(html.Th("暂无匹配数据"))), order_options

            df = df.sort_values("created_at", ascending=False)

            timeline_items = []
            for _, note in df.head(50).iterrows():
                note_type = note.get("type", "review")
                judgment = note.get("judgment_tag", "")

                badge_color = "primary"
                if judgment == "system_issue" or judgment == "signal_error":
                    badge_color = "danger"
                elif judgment == "rider_issue" or judgment == "stopped" or judgment == "detour":
                    badge_color = "warning"
                elif judgment == "user_issue":
                    badge_color = "info"
                elif judgment == "gps_drift":
                    badge_color = "secondary"
                elif judgment == "external":
                    badge_color = "dark"
                elif judgment == "mixed":
                    badge_color = "light"
                elif judgment == "pending":
                    badge_color = "warning"
                elif judgment == "normal":
                    badge_color = "success"

                type_label = "订单备注" if note_type == "review" else "轨迹异常备注"
                type_icon = "fa-file-alt" if note_type == "review" else "fa-map-marker-alt"
                type_badge_color = "info" if note_type == "review" else "warning"

                header_items = [
                    html.I(className=f"fas {type_icon} me-2"),
                    html.Strong(f"{note.get('author', '未知')}"),
                    dbc.Badge(type_label, color=type_badge_color, className="ms-2"),
                ]

                review_type_val = note.get("review_type", "")
                if review_type_val:
                    header_items.append(dbc.Badge(review_type_val, color="info", className="ms-1"))

                if judgment:
                    header_items.append(dbc.Badge(f"判断: {judgment}", color=badge_color, className="ms-1"))

                created_at = note.get("created_at", "")
                if created_at:
                    header_items.append(html.Span(f" - {created_at}", className="text-muted ms-2"))

                body_items = []
                order_id_val = note.get("order_id")
                if order_id_val:
                    body_items.append(html.P([html.I(className="fas fa-receipt me-2"), f"关联订单: #{order_id_val}"]))
                if note_type == "track_anomaly":
                    anomaly_type = note.get("anomaly_type", "")
                    if anomaly_type:
                        body_items.append(html.P([html.I(className="fas fa-exclamation-triangle me-2"), f"异常类型: {anomaly_type}"]))
                body_items.append(html.P(note.get("content", "")))

                timeline_items.append(
                    dbc.Card([
                        dbc.CardHeader(header_items),
                        dbc.CardBody(body_items),
                    ], className=f"mb-3 border-{'warning' if note_type == 'track_anomaly' else 'info'}")
                )

            timeline = html.Div(timeline_items)

            display_columns = []
            if "author" in df.columns:
                display_columns.append("author")
            if "content" in df.columns:
                display_columns.append("content")
            if "review_type" in df.columns:
                display_columns.append("review_type")
            if "type" in df.columns:
                display_columns.append("type")
            if "judgment_tag" in df.columns:
                display_columns.append("judgment_tag")
            if "order_id" in df.columns:
                display_columns.append("order_id")
            if "created_at" in df.columns:
                display_columns.append("created_at")

            display_df = df[display_columns].copy()
            display_df["created_at"] = pd.to_datetime(display_df["created_at"]).dt.strftime("%Y-%m-%d %H:%M")

            column_labels = {
                "author": "作者",
                "content": "内容",
                "review_type": "备注类型",
                "type": "来源",
                "judgment_tag": "判断标签",
                "order_id": "订单ID",
                "created_at": "创建时间",
            }
            display_df.columns = [column_labels.get(col, col) for col in display_df.columns]

            table_content = [
                html.Thead(html.Tr([html.Th(col) for col in display_df.columns])),
                html.Tbody([
                    html.Tr([html.Td(row[col]) for col in display_df.columns])
                    for _, row in display_df.iterrows()
                ]),
            ]

        return timeline, table_content, order_options
    except Exception as e:
        return html.Div(f"加载失败: {str(e)}"), html.Thead(html.Tr(html.Th("加载失败"))), []


@app.callback(
    Output("review-notes-table", "children", allow_duplicate=True),
    [Input("btn-submit-review", "n_clicks")],
    [
        State("review-order-dropdown", "value"),
        State("new-review-type", "value"),
        State("new-review-judgment", "value"),
        State("new-review-content", "value"),
        State("new-review-author", "value"),
        State("date-range-picker", "start_date"),
        State("date-range-picker", "end_date"),
    ],
    prevent_initial_call=True,
)
def submit_review_note(n_clicks, order_id, review_type, judgment, content, author, start_date, end_date):
    if not n_clicks or not content:
        raise PreventUpdate

    try:
        add_review_note(
            order_id=order_id,
            content=content,
            author=author or "analyst",
            review_type=review_type or "general",
            judgment_tag=judgment,
        )
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        notes_df = get_review_notes()
        if notes_df.empty:
            return html.Thead(html.Tr(html.Th("暂无复盘备注")))

        df = notes_df.sort_values("created_at", ascending=False)
        display_df = df[[
            "author", "content", "review_type", "judgment_tag", "order_id", "created_at",
        ]].copy()
        display_df["created_at"] = pd.to_datetime(display_df["created_at"]).dt.strftime("%Y-%m-%d %H:%M")
        display_df.columns = ["作者", "内容", "类型", "判断标签", "订单ID", "创建时间"]

        return [
            html.Thead(html.Tr([html.Th(col) for col in display_df.columns])),
            html.Tbody([
                html.Tr([html.Td(row[col]) for col in display_df.columns])
                for _, row in display_df.iterrows()
            ]),
        ]
    except Exception as e:
        return html.Thead(html.Tr(html.Th(f"保存失败: {str(e)}")))


@app.callback(
    Output("download-excel", "data"),
    [Input("btn-export", "n_clicks")],
    [State("date-range-picker", "start_date"), State("date-range-picker", "end_date")],
    prevent_initial_call=True,
)
def download_excel(n_clicks, start_date, end_date):
    if not n_clicks:
        raise PreventUpdate

    try:
        start_dt = pd.to_datetime(start_date) if start_date else None
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None

        excel_data = export_report_excel.delay(start_date=start_dt, end_date=end_dt).get()

        filename = f"即时下单漏斗报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return dcc.send_bytes(excel_data, filename)
    except Exception as e:
        return None


@app.callback(
    Output("save-view-modal", "is_open"),
    [Input("btn-save-view", "n_clicks"), Input("btn-cancel-save", "n_clicks"), Input("btn-confirm-save", "n_clicks")],
    [State("save-view-modal", "is_open")],
)
def toggle_save_modal(open_click, cancel_click, confirm_click, is_open):
    ctx = callback_context
    if not ctx.triggered:
        return False
    trigger = ctx.triggered[0]["prop_id"]
    if "btn-save-view" in trigger:
        return True
    return False


@app.callback(
    Output("dummy-output", "children"),
    [Input("btn-confirm-save", "n_clicks")],
    [
        State("view-name-input", "value"),
        State("view-type-dropdown", "value"),
        State("main-tabs", "active_tab"),
    ],
    prevent_initial_call=True,
)
def confirm_save_view(n_clicks, view_name, view_type, active_tab):
    if not n_clicks or not view_name:
        raise PreventUpdate
    try:
        save_view(
            view_name=view_name,
            view_type=view_type or active_tab,
            filters={"tab": active_tab},
            columns=[],
            author="analyst",
        )
        return ""
    except Exception:
        return ""


@app.callback(
    [Output("track-anomaly-modal", "is_open"), Output("selected-track-id-store", "data")],
    [Input({"type": "track-row", "index": ALL}, "n_clicks"), Input("btn-cancel-track-note", "n_clicks")],
    [State("track-anomaly-modal", "is_open"), State("selected-track-id-store", "data"),
     State("date-range-picker", "start_date"), State("date-range-picker", "end_date"),
     State("rider-dropdown", "value"), State("track-order-dropdown", "value")],
)
def toggle_track_anomaly_modal(row_clicks, cancel_click, is_open, selected_track_id, start_date, end_date, rider_id, order_id):
    ctx = callback_context
    if not ctx.triggered:
        return False, None
    trigger = ctx.triggered[0]["prop_id"]
    if "btn-cancel" in trigger:
        return False, selected_track_id

    if any(n is not None and n > 0 for n in row_clicks):
        clicked_idx = None
        for i, clicks in enumerate(row_clicks):
            if clicks and clicks > 0:
                clicked_idx = i
                break

        if clicked_idx is not None:
            try:
                start_dt = pd.to_datetime(start_date) if start_date else None
                end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
                tracks_df = get_rider_tracks(rider_id=rider_id, order_id=order_id,
                                             start_date=start_dt, end_date=end_dt)
                if not tracks_df.empty and clicked_idx < len(tracks_df):
                    track_id = int(tracks_df.iloc[clicked_idx]["id"])
                    return True, track_id
            except Exception:
                pass
        return True, selected_track_id

    return is_open, selected_track_id


@app.callback(
    Output("refresh-trigger", "data", allow_duplicate=True),
    [Input("btn-save-track-note", "n_clicks")],
    [State("selected-track-id-store", "data"), State("track-anomaly-note-input", "value"),
     State("track-anomaly-judgment", "value"), State("refresh-trigger", "data")],
    prevent_initial_call=True,
)
def save_track_anomaly_note(n_clicks, track_id, note_content, judgment_tag, refresh_trigger):
    if not n_clicks or not track_id or not note_content:
        raise PreventUpdate

    try:
        add_track_anomaly_note(
            track_id=int(track_id),
            content=note_content,
            author="analyst",
            judgment_tag=judgment_tag,
        )
        return (refresh_trigger or 0) + 1
    except Exception as e:
        print(f"保存轨迹备注失败: {e}")
        raise PreventUpdate
