import json
import uuid
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from dash import Input, Output, State, ctx, no_update, callback_context
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
from dash import html, dcc

from dash_app.layout import (
    get_overview_layout, get_order_map_layout, get_trajectory_layout,
    get_subsidy_layout, get_thresholds_layout, get_review_layout
)
from dash_app.components.charts import (
    create_order_trend_chart, create_delivery_time_chart,
    create_order_type_chart, create_hourly_distribution_chart,
    create_order_address_map, create_trajectory_map,
    create_speed_chart, create_subsidy_trend_chart,
    create_subsidy_type_chart, create_rider_metrics,
    create_rejection_reason_chart, create_compensation_chart
)
from utils.data_query import (
    get_date_range, get_orders_data, get_payments_data,
    get_trajectories_data, get_thresholds_data, get_alerts_data,
    get_subsidy_rules, get_rejections_data, calculate_overview_metrics
)
from database.db import get_db_session
from database.models import WarningThreshold, Order
from celery_tasks.review_generator import generate_review_material, get_review_materials


def register_callbacks(app, cache):
    
    @app.callback(
        Output('tab-content', 'children'),
        Input('main-tabs', 'value')
    )
    def render_tab_content(tab_value):
        if tab_value == 'overview':
            return get_overview_layout()
        elif tab_value == 'order-map':
            return get_order_map_layout()
        elif tab_value == 'trajectory':
            return get_trajectory_layout()
        elif tab_value == 'subsidy':
            return get_subsidy_layout()
        elif tab_value == 'thresholds':
            return get_thresholds_layout()
        elif tab_value == 'review':
            return get_review_layout()
        return html.Div("请选择标签页")

    @app.callback(
        [Output('last-update-time', 'children')],
        Input('interval-component', 'n_intervals')
    )
    def update_last_update(n):
        return [datetime.now().strftime('%Y-%m-%d %H:%M:%S')]

    @app.callback(
        [Output('start-date-picker', 'disabled'),
         Output('end-date-picker', 'disabled')],
        Input('time-range-dropdown', 'value')
    )
    def toggle_date_pickers(time_range):
        if time_range == 'custom':
            return False, False
        return True, True

    @app.callback(
        [Output('total-orders', 'children'),
         Output('completed-orders', 'children'),
         Output('cancelled-orders', 'children'),
         Output('risk-orders', 'children'),
         Output('completion-rate', 'children'),
         Output('cancel-rate', 'children'),
         Output('risk-rate', 'children'),
         Output('total-revenue', 'children'),
         Output('total-subsidy', 'children'),
         Output('subsidy-per-order', 'children'),
         Output('total-compensation', 'children'),
         Output('compensation-per-rejection', 'children'),
         Output('avg-order-value', 'children'),
         Output('avg-delivery-time', 'children'),
         Output('delivery-p95', 'children'),
         Output('rejection-rate', 'children'),
         Output('rejection-count', 'children'),
         Output('alert-count', 'children'),
         Output('unhandled-alerts', 'children'),
         Output('order-trend-chart', 'figure'),
         Output('delivery-time-chart', 'figure'),
         Output('order-type-chart', 'figure'),
         Output('hourly-distribution-chart', 'figure'),
         Output('alerts-table', 'data')],
        [Input('refresh-btn', 'n_clicks'),
         Input('interval-component', 'n_intervals'),
         Input('time-range-dropdown', 'value')],
        [State('start-date-picker', 'date'),
         State('end-date-picker', 'date')]
    )
    def update_overview_metrics(n_refresh, n_interval, time_range, start_date, end_date):
        if time_range == 'custom' and start_date and end_date:
            start_time = datetime.strptime(start_date, '%Y-%m-%d')
            end_time = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
        else:
            start_time, end_time = get_date_range(time_range)

        orders_df = get_orders_data(start_time, end_time)
        payments_df = get_payments_data(start_time, end_time)
        rejections_df = get_rejections_data(start_time, end_time)
        alerts = get_alerts_data(start_time, end_time, limit=100)

        metrics = calculate_overview_metrics(orders_df, payments_df, rejections_df, alerts)

        order_trend_fig = create_order_trend_chart(orders_df)
        delivery_time_fig = create_delivery_time_chart(orders_df)
        order_type_fig = create_order_type_chart(orders_df)
        hourly_dist_fig = create_hourly_distribution_chart(orders_df)

        return (
            metrics['total_orders'],
            metrics['completed_orders'],
            metrics['cancelled_orders'],
            metrics['risk_orders'],
            metrics['completion_rate'],
            metrics['cancel_rate'],
            metrics['risk_rate'],
            metrics['total_revenue'],
            metrics['total_subsidy'],
            metrics['subsidy_per_order'],
            metrics['total_compensation'],
            metrics['compensation_per_rejection'],
            metrics['avg_order_value'],
            metrics['avg_delivery_time'],
            metrics['delivery_p95'],
            metrics['rejection_rate'],
            metrics['rejection_count'],
            metrics['alert_count'],
            metrics['unhandled_alerts'],
            order_trend_fig,
            delivery_time_fig,
            order_type_fig,
            hourly_dist_fig,
            alerts
        )

    @app.callback(
        [Output('order-address-map', 'figure'),
         Output('order-detail-table', 'data')],
        [Input('refresh-map-btn', 'n_clicks'),
         Input('interval-component', 'n_intervals'),
         Input('order-status-filter', 'value'),
         Input('order-type-filter', 'value'),
         Input('map-type-filter', 'value')]
    )
    def update_order_map(n_refresh, n_interval, status_filter, type_filter, map_type):
        start_time, end_time = get_date_range('7days')
        orders_df = get_orders_data(start_time, end_time)

        map_fig = create_order_address_map(orders_df, status_filter, type_filter, map_type)

        table_data = []
        if not orders_df.empty:
            display_df = orders_df.copy()
            display_df['create_time'] = display_df['create_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
            display_df['distance_km'] = display_df['distance_km'].round(2)
            table_data = display_df[[
                'order_no', 'order_type', 'order_status', 'pickup_address',
                'delivery_address', 'distance_km', 'actual_amount', 'create_time'
            ]].head(100).to_dict('records')

        return map_fig, table_data

    @app.callback(
        [Output('trajectory-map', 'figure'),
         Output('rider-metrics', 'children'),
         Output('speed-chart', 'figure'),
         Output('trajectory-detail-table', 'data')],
        Input('search-trajectory-btn', 'n_clicks'),
        [State('rider-id-input', 'value'),
         State('traj-order-id-input', 'value'),
         State('traj-time-range', 'value')]
    )
    def update_trajectory_data(n_clicks, rider_id, order_id, time_range):
        if n_clicks == 0 or (not rider_id and not order_id):
            return (go.Figure().update_layout(title="请输入骑手ID或订单ID后查询"),
                    [], go.Figure().update_layout(title="暂无数据"), [])

        hours_map = {'1h': 1, '3h': 3, '6h': 6, '24h': 24}
        hours = hours_map.get(time_range, 3)
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)

        traj_df = get_trajectories_data(rider_id, order_id, start_time, end_time)
        traj_df['record_time'] = pd.to_datetime(traj_df['record_time'])

        order_info = None
        if order_id:
            with get_db_session() as session:
                order = session.query(Order).filter(Order.order_id == order_id).first()
                if order:
                    order_info = {
                        'pickup_lat': float(order.pickup_lat) if order.pickup_lat else None,
                        'pickup_lng': float(order.pickup_lng) if order.pickup_lng else None,
                        'delivery_lat': float(order.delivery_lat) if order.delivery_lat else None,
                        'delivery_lng': float(order.delivery_lng) if order.delivery_lng else None,
                        'pickup_address': order.pickup_address,
                        'delivery_address': order.delivery_address
                    }

        orders_df = get_orders_data(start_time, end_time)

        traj_fig = create_trajectory_map(traj_df, order_info)
        speed_fig = create_speed_chart(traj_df)
        rider_metrics = create_rider_metrics(traj_df, orders_df, rider_id or '')

        table_data = []
        if not traj_df.empty:
            display_df = traj_df.copy()
            display_df['record_time'] = display_df['record_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
            table_data = display_df[[
                'record_time', 'lng', 'lat', 'speed_kmh', 'heading', 'accuracy_m'
            ]].to_dict('records')

        return traj_fig, rider_metrics, speed_fig, table_data

    @app.callback(
        [Output('subsidy-total-amount', 'children'),
         Output('subsidy-order-count', 'children'),
         Output('subsidy-avg-per-order', 'children'),
         Output('subsidy-ratio', 'children'),
         Output('subsidy-trend-chart', 'figure'),
         Output('subsidy-type-chart', 'figure'),
         Output('subsidy-rules-table', 'data')],
        [Input('refresh-subsidy-btn', 'n_clicks'),
         Input('subsidy-time-range', 'value')]
    )
    def update_subsidy_data(n_clicks, time_range):
        start_time, end_time = get_date_range(time_range)
        orders_df = get_orders_data(start_time, end_time)
        rules = get_subsidy_rules()

        subsidy_orders = orders_df[orders_df['subsidy_amount'] > 0]
        total_subsidy = subsidy_orders['subsidy_amount'].sum()
        total_revenue = orders_df['actual_amount'].sum()
        subsidy_ratio = (total_subsidy / total_revenue * 100) if total_revenue > 0 else 0

        trend_fig = create_subsidy_trend_chart(orders_df)
        type_fig = create_subsidy_type_chart(orders_df)

        return (
            f'{total_subsidy:,.2f}',
            f'{len(subsidy_orders):,}',
            f'{total_subsidy / max(len(subsidy_orders), 1):.2f}',
            f'{subsidy_ratio:.2f}',
            trend_fig,
            type_fig,
            rules
        )

    @app.callback(
        Output('thresholds-table', 'data'),
        [Input('add-threshold-btn', 'n_clicks'),
         Input('interval-component', 'n_intervals')],
        State('thresholds-table', 'data')
    )
    def load_thresholds(n_add, n_interval, current_data):
        if ctx.triggered_id == 'add-threshold-btn':
            new_row = {
                'metric_code': f'NEW_{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'metric_name': '新指标',
                'metric_category': '其他',
                'warning_level': 'warning',
                'operator': '>',
                'threshold_value': 0,
                'unit': '',
                'description': '',
                'is_active': True,
                'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            if current_data:
                current_data.append(new_row)
            else:
                current_data = [new_row]
            return current_data
        
        thresholds = get_thresholds_data()
        for t in thresholds:
            t['updated_at'] = t['updated_at'].strftime('%Y-%m-%d %H:%M:%S') if t['updated_at'] else ''
        return thresholds

    @app.callback(
        Output('threshold-save-status', 'children'),
        Input('save-thresholds-btn', 'n_clicks'),
        State('thresholds-table', 'data'),
        prevent_initial_call=True
    )
    def save_thresholds(n_clicks, rows):
        if n_clicks == 0 or not rows:
            return no_update

        try:
            with get_db_session() as session:
                existing_codes = {t.metric_code for t in session.query(WarningThreshold).all()}
                row_codes = set()

                for row in rows:
                    row_codes.add(row['metric_code'])
                    
                    threshold = session.query(WarningThreshold).filter(
                        WarningThreshold.metric_code == row['metric_code']
                    ).first()

                    if threshold:
                        threshold.metric_name = row['metric_name']
                        threshold.metric_category = row['metric_category']
                        threshold.warning_level = row['warning_level']
                        threshold.operator = row['operator']
                        threshold.threshold_value = float(row['threshold_value'])
                        threshold.unit = row['unit']
                        threshold.description = row['description']
                        threshold.is_active = bool(row['is_active'])
                        threshold.updated_at = datetime.now()
                    else:
                        new_threshold = WarningThreshold(
                            threshold_id=str(uuid.uuid4()),
                            metric_code=row['metric_code'],
                            metric_name=row['metric_name'],
                            metric_category=row['metric_category'],
                            warning_level=row['warning_level'],
                            operator=row['operator'],
                            threshold_value=float(row['threshold_value']),
                            unit=row['unit'],
                            description=row['description'],
                            is_active=bool(row['is_active']),
                            updated_by='dash_app'
                        )
                        session.add(new_threshold)

                deleted_codes = existing_codes - row_codes
                for code in deleted_codes:
                    session.query(WarningThreshold).filter(
                        WarningThreshold.metric_code == code
                    ).delete()

                session.commit()

            return dbc.Alert("阈值配置保存成功！", color="success", duration=3000)
        except Exception as e:
            return dbc.Alert(f"保存失败: {str(e)}", color="danger", duration=5000)

    @app.callback(
        Output('review-rider-id', 'disabled'),
        Input('review-type-dropdown', 'value')
    )
    def toggle_rider_id_input(review_type):
        return review_type != 'rider'

    @app.callback(
        [Output('review-content', 'children'),
         Output('review-history-table', 'data')],
        [Input('generate-review-btn', 'n_clicks'),
         Input('view-history-review-btn', 'n_clicks')],
        [State('review-type-dropdown', 'value'),
         State('review-rider-id', 'value'),
         State('review-start-date', 'date'),
         State('review-end-date', 'date')]
    )
    def handle_review_actions(n_gen, n_view, review_type, rider_id, start_date, end_date):
        triggered = ctx.triggered_id
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()

        review_content = []

        if triggered == 'generate-review-btn' and n_gen > 0:
            try:
                result = generate_review_material(
                    review_type, start_date_obj, end_date_obj,
                    rider_id if review_type == 'rider' else None,
                    created_by='dash_user'
                )
                
                review_content = [
                    dbc.Card([
                        dbc.CardHeader("📄 复盘材料生成成功"),
                        dbc.CardBody([
                            html.H5(f"复盘ID: {result['review_id']}"),
                            html.Pre(result['summary'], className="bg-light p-3 rounded"),
                            html.Hr(),
                            dcc.Markdown(f"""
**复盘详情:**

- 复盘类型: {review_type}
- 时间范围: {start_date_obj} 至 {end_date_obj}
{f"- 骑手ID: {rider_id}" if rider_id else ""}

**详细数据:**
```json
{json.dumps(result['material_data'], ensure_ascii=False, indent=2)}
```
                            """)
                        ])
                    ])
                ]
            except Exception as e:
                review_content = [
                    dbc.Alert(f"生成复盘材料失败: {str(e)}", color="danger")
                ]

        history = get_review_materials(
            review_type=review_type if review_type != 'rider' else None,
            rider_id=rider_id if review_type == 'rider' else None,
            start_date=start_date_obj,
            end_date=end_date_obj,
            limit=50
        )

        return review_content, history

    @app.callback(
        Output('review-content', 'children', allow_duplicate=True),
        Input('review-history-table', 'selected_rows'),
        State('review-history-table', 'data'),
        prevent_initial_call=True
    )
    def display_selected_review(selected_rows, table_data):
        if not selected_rows or not table_data:
            return no_update

        idx = selected_rows[0]
        review = table_data[idx]

        with get_db_session() as session:
            from database.models import ReviewMaterial
            full_review = session.query(ReviewMaterial).filter(
                ReviewMaterial.review_id == review['review_id']
            ).first()

            if not full_review:
                return dbc.Alert("未找到复盘详情", color="warning")

            return [
                dbc.Card([
                    dbc.CardHeader(f"📄 复盘详情 - {review['review_id']}"),
                    dbc.CardBody([
                        html.Pre(full_review.summary, className="bg-light p-3 rounded"),
                        html.Hr(),
                        dcc.Markdown(f"""
**复盘信息:**

- 复盘类型: {review['review_type']}
- 时间范围: {review['start_date']} 至 {review['end_date']}
{f"- 骑手ID: {review['rider_id']}" if review['rider_id'] else ""}
- 创建时间: {review['created_at']}

**核心指标:**
- 总订单: {review['total_orders']} 单
- 拒单数: {review['rejection_count']} 次
- 拒单率: {float(review['rejection_rate']):.2%}
- 赔付总额: {float(review['total_compensation']):,.2f} 元

**详细数据:**
```json
{json.dumps(full_review.material_data, ensure_ascii=False, indent=2)}
```
                        """)
                    ])
                ])
            ]


import plotly.graph_objects as go
