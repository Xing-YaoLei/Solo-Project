from datetime import date, timedelta
from dash import Input, Output, State, callback_context, html, dash_table, ALL, MATCH, no_update
import dash_bootstrap_components as dbc
import pandas as pd
import json
import dash

from app.main import app
from app.components.charts import (
    create_appointment_trend_chart,
    create_vehicle_brand_chart,
    create_vehicle_age_chart,
    create_diagnosis_category_chart,
    create_diagnosis_severity_chart,
    create_order_type_chart,
    create_order_amount_chart,
    create_rework_trend_chart,
    create_rework_reason_chart,
    create_caliber_compare_chart,
    create_parts_shortage_chart,
    create_parts_rework_correlation_chart,
)
from data.queries import DataQueryService
from data.models import ReworkRateCaliberVersion
from data.database import SessionLocal


def get_query_service():
    return DataQueryService()


def _get_threshold_defaults():
    with get_query_service() as svc:
        configs = svc.get_threshold_config()
    return [{
        "key": c['config_key'],
        "name": c['config_name'],
        "value": c['config_value'],
        "type": c['config_type'],
        "category": c['category'],
        "desc": c['description']
    } for c in configs]


def _get_caliber_versions():
    with get_query_service() as svc:
        versions = svc.get_caliber_versions()
    result = {}
    for v in versions:
        result[v['version_code']] = {
            "name": v['version_name'],
            "description": v['description'],
            "formula": v['definition_formula'],
            "change_reason": v['change_reason'],
            "effective_date": v['effective_date'].isoformat() if v['effective_date'] else "",
            "is_active": v['is_active']
        }
    return result


@app.callback(
    [Output('kpi-appointments', 'children'),
     Output('kpi-arrival-rate', 'children'),
     Output('kpi-rework-rate', 'children'),
     Output('kpi-shortage-rate', 'children'),
     Output('kpi-appointments-trend', 'children'),
     Output('kpi-arrival-trend', 'children'),
     Output('kpi-rework-trend', 'children'),
     Output('kpi-shortage-trend', 'children'),
     Output('appointment-trend-chart', 'figure')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('btn-refresh', 'n_clicks'),
     Input('interval-component', 'n_intervals')]
)
def update_overview(start_date, end_date, n_clicks, n_intervals):
    if not start_date or not end_date:
        return "-", "-", "-", "-", "", "", "", "", {}

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    with get_query_service() as svc:
        df = svc.get_appointment_trend(start, end)
        rework_info = svc.get_rework_rate(start, end)
        shortage_info = svc.get_parts_shortage_stats(start, end)

    if df.empty:
        df = pd.DataFrame(columns=['date', '预约量', '到店量', '到店率', '总金额'])

    total_appointments = int(df['预约量'].sum()) if not df.empty else 0
    total_arrivals = int(df['到店量'].sum()) if not df.empty else 0
    arrival_rate = round(total_arrivals / total_appointments * 100, 1) if total_appointments > 0 else 0

    rework_rate = rework_info.get('rework_rate', 0)
    shortage_rate = shortage_info.get('shortage_rate', 0)

    prev_start = start - (end - start)
    prev_end = start - timedelta(days=1)

    try:
        with get_query_service() as svc_prev:
            prev_df = svc_prev.get_appointment_trend(prev_start, prev_end)
            prev_rework = svc_prev.get_rework_rate(prev_start, prev_end)
            prev_shortage = svc_prev.get_parts_shortage_stats(prev_start, prev_end)

        prev_appointments = int(prev_df['预约量'].sum()) if not prev_df.empty else 0
        prev_arrivals = int(prev_df['到店量'].sum()) if not prev_df.empty else 0
        prev_arrival_rate = round(prev_arrivals / prev_appointments * 100, 1) if prev_appointments > 0 else 0
        prev_rework_rate = prev_rework.get('rework_rate', 0)
        prev_shortage_rate = prev_shortage.get('shortage_rate', 0)

        if prev_appointments > 10:
            appt_change = (total_appointments - prev_appointments) / prev_appointments * 100
            appointment_trend = f"{'↑' if appt_change >= 0 else '↓'} 较上期 {abs(appt_change):.1f}%"
        else:
            appointment_trend = "— 上期数据不足"

        if prev_arrival_rate > 0:
            arrival_change = arrival_rate - prev_arrival_rate
            arrival_trend = f"{'↑' if arrival_change >= 0 else '↓'} 较上期 {abs(arrival_change):.1f}%"
        else:
            arrival_trend = "— 上期数据不足"

        if prev_rework_rate > 0:
            rework_change = rework_rate - prev_rework_rate
            rework_trend = f"{'↑' if rework_change >= 0 else '↓'} 较上期 {abs(rework_change):.2f}%"
            rework_trend_color = "text-success" if rework_change <= 0 else "text-danger"
        else:
            rework_trend = "— 上期数据不足"
            rework_trend_color = "text-muted"

        if prev_shortage_rate > 0:
            shortage_change = shortage_rate - prev_shortage_rate
            shortage_trend = f"{'↑' if shortage_change >= 0 else '↓'} 较上期 {abs(shortage_change):.2f}%"
            shortage_trend_color = "text-danger" if shortage_change >= 0 else "text-success"
        else:
            shortage_trend = "— 上期数据不足"
            shortage_trend_color = "text-muted"
    except Exception as e:
        appointment_trend = "— 上期数据不足"
        arrival_trend = "— 上期数据不足"
        rework_trend = "— 上期数据不足"
        rework_trend_color = "text-muted"
        shortage_trend = "— 上期数据不足"
        shortage_trend_color = "text-muted"

    fig = create_appointment_trend_chart(df)

    return (
        f"{total_appointments} 单",
        f"{arrival_rate} %",
        f"{rework_rate} %",
        f"{shortage_rate} %",
        html.Span(appointment_trend, className="text-success"),
        html.Span(arrival_trend, className="text-success"),
        html.Span(rework_trend, className=rework_trend_color),
        html.Span(shortage_trend, className=shortage_trend_color),
        fig
    )


@app.callback(
    [Output('vehicle-brand-chart', 'figure'),
     Output('vehicle-age-chart', 'figure'),
     Output('vehicle-detail-table', 'children')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('btn-refresh', 'n_clicks')]
)
def update_vehicles_tab(start_date, end_date, n_clicks):
    if not start_date or not end_date:
        return {}, {}, html.Div()

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    with get_query_service() as svc:
        vehicle_stats = svc.get_vehicle_stats(start, end)
        age_data = svc.get_vehicle_age_distribution()
        detail_df = svc.get_vehicles_detail(start, end)

    brand_data = vehicle_stats.get('brand_distribution', [])
    brand_fig = create_vehicle_brand_chart(brand_data)
    age_fig = create_vehicle_age_chart(age_data)

    if detail_df.empty:
        detail_table = html.Div("暂无车辆数据", className="text-center text-muted p-4")
    else:
        detail_table = dash_table.DataTable(
            data=detail_df.to_dict('records'),
            columns=[{'name': col, 'id': col} for col in detail_df.columns],
            page_size=10,
            style_table={'overflowX': 'auto'},
            style_cell={'textAlign': 'left', 'padding': '8px'},
            style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
            sort_action='native',
        )

    return brand_fig, age_fig, detail_table


@app.callback(
    Output('vehicle-detail-section', 'style'),
    Input('btn-vehicle-detail', 'n_clicks'),
    State('vehicle-detail-section', 'style')
)
def toggle_vehicle_detail(n_clicks, current_style):
    if n_clicks is None:
        return current_style
    if current_style.get('display') == 'none':
        return {'display': 'block'}
    return {'display': 'none'}


@app.callback(
    [Output('diagnosis-category-chart', 'figure'),
     Output('diagnosis-severity-chart', 'figure'),
     Output('diagnosis-detail-table', 'children')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('btn-refresh', 'n_clicks')]
)
def update_diagnosis_tab(start_date, end_date, n_clicks):
    if not start_date or not end_date:
        return {}, {}, html.Div()

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    with get_query_service() as svc:
        df = svc.get_diagnosis_stats(start, end)
        detail_df = svc.get_diagnosis_detail(start, end)

    category_fig = create_diagnosis_category_chart(df)
    severity_fig = create_diagnosis_severity_chart(df)

    if detail_df.empty:
        detail_table = html.Div("暂无诊断数据", className="text-center text-muted p-4")
    else:
        detail_table = dash_table.DataTable(
            data=detail_df.to_dict('records'),
            columns=[{'name': col, 'id': col} for col in detail_df.columns],
            page_size=10,
            style_table={'overflowX': 'auto'},
            style_cell={'textAlign': 'left', 'padding': '8px'},
            style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
            sort_action='native',
        )

    return category_fig, severity_fig, detail_table


@app.callback(
    Output('diagnosis-detail-section', 'style'),
    Input('btn-diagnosis-detail', 'n_clicks'),
    State('diagnosis-detail-section', 'style')
)
def toggle_diagnosis_detail(n_clicks, current_style):
    if n_clicks is None:
        return current_style
    if current_style.get('display') == 'none':
        return {'display': 'block'}
    return {'display': 'none'}


@app.callback(
    [Output('order-type-chart', 'figure'),
     Output('order-amount-chart', 'figure'),
     Output('order-detail-table', 'children')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('btn-refresh', 'n_clicks')]
)
def update_orders_tab(start_date, end_date, n_clicks):
    if not start_date or not end_date:
        return {}, {}, html.Div()

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    with get_query_service() as svc:
        df = svc.get_order_item_stats(start, end)
        detail_df = svc.get_repair_orders_detail(start, end)

    type_fig = create_order_type_chart(df)
    amount_fig = create_order_amount_chart(df)

    if detail_df.empty:
        detail_table = html.Div("暂无工单数据", className="text-center text-muted p-4")
    else:
        detail_table = dash_table.DataTable(
            data=detail_df.to_dict('records'),
            columns=[{'name': col, 'id': col} for col in detail_df.columns],
            page_size=15,
            style_table={'overflowX': 'auto'},
            style_cell={'textAlign': 'left', 'padding': '8px'},
            style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
            style_data_conditional=[
                {
                    'if': {'filter_query': '{是否返修} = "是"'},
                    'backgroundColor': '#fef2f2',
                }
            ],
            sort_action='native',
        )

    return type_fig, amount_fig, detail_table


@app.callback(
    Output('order-detail-section', 'style'),
    Input('btn-order-detail', 'n_clicks'),
    State('order-detail-section', 'style')
)
def toggle_order_detail(n_clicks, current_style):
    if n_clicks is None:
        return current_style
    if current_style.get('display') == 'none':
        return {'display': 'block'}
    return {'display': 'none'}


@app.callback(
    [Output('rework-trend-chart', 'figure'),
     Output('rework-reason-chart', 'figure'),
     Output('rework-detail-table', 'children')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('caliber-version-selector', 'value'),
     Input('btn-refresh', 'n_clicks')]
)
def update_rework_tab(start_date, end_date, caliber_version, n_clicks):
    if not start_date or not end_date:
        return {}, {}, html.Div()

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    if not caliber_version:
        caliber_version = 'v1.0'

    with get_query_service() as svc:
        trend_data = svc.get_rework_trend(start, end, caliber_version)
        reason_data = svc.get_rework_reason_stats(start, end, caliber_version)
        detail_df = svc.get_rework_detail(start, end, caliber_version)

    trend_fig = create_rework_trend_chart(trend_data)
    reason_fig = create_rework_reason_chart(reason_data)

    if detail_df.empty:
        detail_table = html.Div("暂无返修数据", className="text-center text-muted p-4")
    else:
        detail_table = dash_table.DataTable(
            data=detail_df.to_dict('records'),
            columns=[{'name': col, 'id': col} for col in detail_df.columns],
            page_size=10,
            style_table={'overflowX': 'auto'},
            style_cell={'textAlign': 'left', 'padding': '8px'},
            style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
            sort_action='native',
        )

    return trend_fig, reason_fig, detail_table


@app.callback(
    [Output('parts-shortage-chart', 'figure'),
     Output('parts-rework-correlation-chart', 'figure'),
     Output('parts-shortage-table', 'children')],
    [Input('date-range-picker', 'start_date'),
     Input('date-range-picker', 'end_date'),
     Input('btn-refresh', 'n_clicks')]
)
def update_parts_tab(start_date, end_date, refresh_clicks):
    if not start_date or not end_date:
        return {}, {}, html.Div()

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    with get_query_service() as svc:
        shortage_info = svc.get_parts_shortage_stats(start, end)
        correlation_data = svc.get_parts_rework_correlation(start, end)

    parts_data = shortage_info.get('top_shortage_parts', [])
    shortage_fig = create_parts_shortage_chart(parts_data)
    corr_fig = create_parts_rework_correlation_chart(correlation_data)

    if not parts_data:
        parts_table = html.Div("暂无配件缺货数据", className="text-center text-muted p-4")
    else:
        parts_df = pd.DataFrame(parts_data)
        parts_table = dash_table.DataTable(
            data=parts_df.to_dict('records'),
            columns=[{'name': '配件编码', 'id': 'part_code'},
                     {'name': '配件名称', 'id': 'part_name'},
                     {'name': '缺货次数', 'id': 'shortage_count'},
                     {'name': '缺货数量', 'id': 'shortage_qty'}],
            page_size=10,
            style_table={'overflowX': 'auto'},
            style_cell={'textAlign': 'left', 'padding': '8px'},
            style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
            sort_action='native',
        )

    return shortage_fig, corr_fig, parts_table


@app.callback(
    Output('date-range-picker', 'start_date'),
    Output('date-range-picker', 'end_date'),
    [Input('btn-7d', 'n_clicks'),
     Input('btn-30d', 'n_clicks'),
     Input('btn-90d', 'n_clicks')]
)
def update_date_range(btn7d, btn30d, btn90d):
    ctx = callback_context
    if not ctx.triggered:
        end = date.today()
        start = end - timedelta(days=90)
        return start, end

    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    end = date.today()

    if button_id == 'btn-7d':
        start = end - timedelta(days=7)
    elif button_id == 'btn-30d':
        start = end - timedelta(days=30)
    else:
        start = end - timedelta(days=90)

    return start, end


@app.callback(
    Output('threshold-store', 'data'),
    Output('threshold-toast', 'is_open'),
    Output('threshold-toast', 'children'),
    Input({'type': 'threshold-save', 'index': ALL}, 'n_clicks'),
    State({'type': 'threshold-input', 'index': ALL}, 'value'),
    State({'type': 'threshold-input', 'index': ALL}, 'id'),
    State('threshold-store', 'data'),
    prevent_initial_call=True,
)
def save_threshold_config(save_clicks, input_values, input_ids, current_data):
    ctx = callback_context
    if not ctx.triggered:
        return current_data, False, ""

    trigger_id = ctx.triggered[0]['prop_id']
    try:
        trigger_dict = json.loads(trigger_id.split('.')[0])
        threshold_key = trigger_dict['index']
    except (json.JSONDecodeError, KeyError):
        return current_data, False, ""

    for i, inp_id in enumerate(input_ids):
        if inp_id.get('index') == threshold_key:
            new_value = input_values[i]
            if new_value is not None:
                str_value = str(new_value)

                with get_query_service() as svc:
                    success = svc.update_threshold_config(
                        config_key=threshold_key,
                        config_value=str_value,
                        updated_by="dashboard_user"
                    )

                if success:
                    current_data[threshold_key] = str_value
                    toast_msg = f"阈值已保存：{threshold_key} = {str_value}"
                else:
                    toast_msg = f"保存失败：阈值配置不存在 - {threshold_key}"
                    return current_data, True, toast_msg
            else:
                toast_msg = f"值不能为空"
                return current_data, True, toast_msg
            break

    return current_data, True, toast_msg


@app.callback(
    Output('threshold-config-cards', 'children'),
    Input('threshold-store', 'data'),
)
def update_threshold_cards_from_store(threshold_data):
    cards = []

    with get_query_service() as svc:
        configs = svc.get_threshold_config()

    for c in configs:
        current_value = threshold_data.get(c['config_key'], c['config_value'])
        card = dbc.Col(
            dbc.Card([
                dbc.CardHeader(html.Strong(c['config_name'])),
                dbc.CardBody([
                    html.H4(current_value, className="text-primary mb-2"),
                    html.P(c['description'], className="text-muted small mb-2"),
                    dbc.Input(
                        id={'type': 'threshold-input', 'index': c['config_key']},
                        type=c['config_type'],
                        value=current_value,
                        className="mb-2",
                        size="sm",
                    ),
                    dbc.Button(
                        "保存",
                        id={'type': 'threshold-save', 'index': c['config_key']},
                        color="primary",
                        size="sm",
                    ),
                ]),
                dbc.CardFooter([
                    html.Small(f"分类：{c['category']}", className="text-muted"),
                    html.Br(),
                    html.Small(f"上次更新：{c['updated_at'].strftime('%Y-%m-%d %H:%M') if c['updated_at'] else '未更新'}", className="text-muted"),
                ]),
            ]),
            width=4,
        )
        cards.append(card)
    return cards


@app.callback(
    Output('caliber-version-selector', 'options'),
    Input('caliber-store', 'data'),
)
def update_caliber_options(caliber_data):
    versions = caliber_data.get('versions', {})
    options = []
    for code, info in versions.items():
        active_marker = " (激活)" if info.get('is_active') else ""
        label = f"{code} - {info['name']}{active_marker}"
        options.append({'label': label, 'value': code})
    return options


@app.callback(
    Output('caliber-info-alert', 'children'),
    Input('caliber-version-selector', 'value'),
    State('caliber-store', 'data'),
)
def update_caliber_info(caliber_version, caliber_data):
    versions = caliber_data.get('versions', {})
    info = versions.get(caliber_version, {})

    alert_content = dbc.Alert(
        [
            dbc.Row([
                dbc.Col([
                    html.Strong(f"当前口径：{info.get('name', '')}（{caliber_version}）"),
                    html.Br(),
                    html.Small(f"定义：{info.get('description', '')}"),
                    html.Br(),
                    html.Small(f"公式：{info.get('formula', '')}"),
                ], width=10),
                dbc.Col([
                    html.Small(f"生效日期：{info.get('effective_date', '')}"),
                    html.Br(),
                    html.Small(f"变更原因：{info.get('change_reason', '')}", className="text-muted"),
                ], width=2, className="text-end"),
            ]),
        ],
        color="info",
        className="mb-0"
    )
    return alert_content


@app.callback(
    Output('caliber-compare-chart', 'figure'),
    Input('date-range-picker', 'start_date'),
    Input('date-range-picker', 'end_date'),
    State('caliber-store', 'data'),
)
def update_caliber_compare(start_date, end_date, caliber_data):
    if not start_date or not end_date:
        return {}

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    versions = caliber_data.get('versions', {})
    compare_data = []

    with get_query_service() as svc:
        for code, info in versions.items():
            rework_info = svc.get_rework_rate(start, end, caliber_version=code)
            rate = rework_info.get('rework_rate', 0)
            compare_data.append({
                'version': f"{code}\n({info.get('name', '')})",
                'rate': rate
            })

    return create_caliber_compare_chart(compare_data)


@app.callback(
    Output('review-materials-list', 'children'),
    Output('review-toast', 'is_open'),
    Output('review-toast', 'children'),
    Input('btn-generate-review', 'n_clicks'),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('caliber-version-selector', 'value'),
)
def generate_review_material(n_clicks, start_date, end_date, caliber_version):
    if not start_date or not end_date:
        return html.Div("请先选择日期范围"), False, ""

    if not caliber_version:
        caliber_version = 'v1.0'

    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    toast_open = False
    toast_msg = ""

    if n_clicks and n_clicks > 0:
        with get_query_service() as svc:
            rework_info = svc.get_rework_rate(start, end, caliber_version)
            shortage_info = svc.get_parts_shortage_stats(start, end)
            correlation = svc.get_parts_rework_correlation(start, end)

            top_parts = shortage_info.get('top_shortage_parts', [])[:5]
            related_part_codes = [p['part_code'] for p in top_parts]

            total_rework = rework_info.get('rework_count', 0)
            total_shortage = shortage_info.get('shortage_count', 0)
            parts_related_rework = sum(c['rework_count'] for c in correlation[:5])

            key_metrics = {
                '总返修率': f"{rework_info.get('rework_rate', 0)}%",
                '总返修工单': f"{total_rework}单",
                '配件缺货次数': f"{total_shortage}次",
                '配件相关返修': f"{parts_related_rework}单",
                '口径版本': caliber_version
            }

            parts_desc = ', '.join([f'{p["part_name"]}({p["shortage_count"]}次)' for p in top_parts])
            summary = (
                f"基于{caliber_version}口径，分析{start_date}至{end_date}期间配件缺货与返修率的关联。"
                f"本期返修率为{rework_info.get('rework_rate', 0)}%，共发生配件缺货{total_shortage}次，"
                f"关联返修{parts_related_rework}单。"
                f"Top缺货配件：{parts_desc}。"
                f"建议：针对高频缺货配件增加安全库存。"
            )

            svc.create_review_material(
                title=f'配件缺货返修复盘报告 ({start_date} ~ {end_date})',
                summary=summary,
                review_type='配件缺货',
                caliber_version=caliber_version,
                key_metrics=key_metrics,
                related_part_codes=related_part_codes,
                created_by='dashboard_user'
            )

        toast_open = True
        toast_msg = f"复盘材料已生成，口径版本：{caliber_version}"

    with get_query_service() as svc:
        review_materials = svc.get_review_materials()

    review_cards = []
    for rm in review_materials:
        status_color = 'success' if rm['status'] in ['已完成', '已生成'] else 'warning'
        type_color = 'info' if rm['review_type'] == '配件缺货' else 'secondary'
        metrics_html = ""
        if rm.get('key_metrics'):
            metrics_parts = [f"{k}: {v}" for k, v in rm['key_metrics'].items()]
            metrics_html = html.P(" | ".join(metrics_parts), className="text-info small mb-2")

        card = dbc.Card([
            dbc.CardBody([
                dbc.Row([
                    dbc.Col([
                        html.H6(rm['title'], className="mb-1"),
                        metrics_html,
                        html.P(rm['summary'], className="text-muted small mb-2"),
                        html.Div([
                            dbc.Badge(rm['review_type'], color=type_color, className="me-2"),
                            dbc.Badge(f"口径：{rm['caliber_version']}", color="secondary", className="me-2"),
                            dbc.Badge(rm['status'], color=status_color),
                        ], className="small"),
                    ], width=10),
                    dbc.Col([
                        html.Small(rm['review_date'].isoformat(), className="text-muted"),
                        html.Br(),
                        html.Small(f"生成人：{rm.get('created_by', '')}", className="text-muted"),
                    ], width=2, className="text-end"),
                ]),
            ])
        ], className="mb-2")
        review_cards.append(card)

    if not review_cards:
        review_cards = html.Div("暂无复盘材料", className="text-center text-muted p-4")

    return review_cards, toast_open, toast_msg


def register_callbacks():
    pass
