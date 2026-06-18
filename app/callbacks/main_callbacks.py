from datetime import date, timedelta
from dash import Input, Output, State, callback_context, html, dash_table, ALL, MATCH, no_update
import dash_bootstrap_components as dbc
import pandas as pd
import random
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

CALIBER_INFO = {
    "v1.0": {
        "name": "基础口径",
        "description": "同一车辆30天内同故障二次进厂计为返修",
        "formula": "返修率 = 返修工单数 / 总工单数 × 100%",
        "change_reason": "初始版本",
    },
    "v1.1": {
        "name": "扩大口径",
        "description": "同一车辆60天内同类故障二次进厂计为返修，包含配件质量问题",
        "formula": "返修率 = 返修工单数(60天同类故障) / 总工单数 × 100%",
        "change_reason": "扩大返修判定窗口，细化故障分类",
    },
}

THRESHOLD_DEFAULTS = [
    {"key": "rework_rate_warning", "name": "返修率预警阈值", "value": "5", "type": "number",
     "category": "返修管理", "desc": "返修率超过此值触发预警"},
    {"key": "rework_rate_critical", "name": "返修率严重阈值", "value": "8", "type": "number",
     "category": "返修管理", "desc": "返修率超过此值触发严重告警"},
    {"key": "parts_shortage_rate", "name": "配件缺货率阈值", "value": "3", "type": "number",
     "category": "配件管理", "desc": "配件缺货率超过此值需要复盘"},
    {"key": "appointment_fill_rate", "name": "预约到店率预警", "value": "85", "type": "number",
     "category": "预约管理", "desc": "预约到店率低于此值预警"},
    {"key": "rework_window_days", "name": "返修判定窗口(天)", "value": "30", "type": "number",
     "category": "返修管理", "desc": "多少天内二次进厂算返修"},
    {"key": "safe_stock_days", "name": "安全库存天数", "value": "7", "type": "number",
     "category": "配件管理", "desc": "配件安全库存覆盖天数"},
]


def generate_mock_appointment_data(start_date: date, end_date: date) -> pd.DataFrame:
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    data = []
    for d in dates:
        base = 20 + random.randint(-5, 10)
        arrival = base - random.randint(0, 5)
        data.append({
            'date': d.date(),
            '预约量': base,
            '到店量': arrival,
            '到店率': round(arrival / base * 100, 1) if base > 0 else 0,
            '总金额': base * random.uniform(800, 2000),
        })
    return pd.DataFrame(data)


def generate_mock_vehicle_data():
    brands = ['大众', '丰田', '本田', '别克', '奥迪', '宝马', '奔驰', '日产', '现代', '其他']
    counts = [random.randint(20, 80) for _ in brands]
    return [{'brand': b, 'count': c} for b, c in zip(brands, counts)]


def generate_mock_diagnosis_data():
    categories = ['动力系统', '车身系统', '底盘系统', '网络通讯', '电池管理', '电机控制', '其他']
    severities = ['严重', '中等', '轻微']
    data = []
    for cat in categories:
        for sev in severities:
            data.append({
                '故障类别': cat,
                '严重程度': sev,
                '数量': random.randint(1, 20),
            })
    return pd.DataFrame(data)


def generate_mock_order_item_data():
    types = ['常规保养', '故障维修', '事故维修', '检测诊断', '改装升级']
    data = []
    for t in types:
        count = random.randint(10, 100)
        data.append({
            '项目类型': t,
            '数量': count,
            '总金额': count * random.uniform(300, 1500),
        })
    return pd.DataFrame(data)


def generate_mock_rework_trend(start_date: date, end_date: date):
    dates = pd.date_range(start=start_date, end=end_date, freq='W')
    data = []
    for d in dates:
        data.append({
            'date': d.date(),
            'rework_rate': round(random.uniform(2, 7), 2),
        })
    return data


def generate_mock_rework_reasons():
    reasons = [
        {'rework_type': '配件相关', 'count': random.randint(5, 15)},
        {'rework_type': '工艺相关', 'count': random.randint(3, 10)},
        {'rework_type': '诊断相关', 'count': random.randint(2, 8)},
        {'rework_type': '客户相关', 'count': random.randint(1, 5)},
        {'rework_type': '其他', 'count': random.randint(1, 4)},
    ]
    return reasons


def generate_mock_parts_shortage():
    parts = [
        {'part_code': 'P001', 'part_name': '前刹车片', 'shortage_count': random.randint(5, 20), 'shortage_qty': random.randint(10, 50)},
        {'part_code': 'P002', 'part_name': '机油滤芯', 'shortage_count': random.randint(3, 15), 'shortage_qty': random.randint(20, 80)},
        {'part_code': 'P003', 'part_name': '空气滤芯', 'shortage_count': random.randint(3, 12), 'shortage_qty': random.randint(15, 60)},
        {'part_code': 'P004', 'part_name': '火花塞', 'shortage_count': random.randint(2, 10), 'shortage_qty': random.randint(10, 40)},
        {'part_code': 'P005', 'part_name': '蓄电池', 'shortage_count': random.randint(2, 8), 'shortage_qty': random.randint(5, 25)},
        {'part_code': 'P006', 'part_name': '轮胎', 'shortage_count': random.randint(1, 7), 'shortage_qty': random.randint(5, 20)},
        {'part_code': 'P007', 'part_name': '雨刮片', 'shortage_count': random.randint(5, 18), 'shortage_qty': random.randint(30, 100)},
        {'part_code': 'P008', 'part_name': '变速箱油', 'shortage_count': random.randint(1, 6), 'shortage_qty': random.randint(8, 30)},
        {'part_code': 'P009', 'part_name': '刹车油', 'shortage_count': random.randint(2, 9), 'shortage_qty': random.randint(12, 45)},
        {'part_code': 'P010', 'part_name': '空调滤芯', 'shortage_count': random.randint(4, 14), 'shortage_qty': random.randint(20, 70)},
    ]
    return parts


def generate_mock_orders_detail(start_date: date, end_date: date) -> pd.DataFrame:
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    data = []
    order_types = ['常规保养', '故障维修', '事故维修', '检测诊断']
    statuses = ['已完成', '进行中', '待处理']
    brands = ['大众', '丰田', '本田', '别克', '奥迪']
    advisors = ['张三', '李四', '王五', '赵六']
    technicians = ['技师A', '技师B', '技师C', '技师D']

    order_no = 1000
    for d in dates:
        daily_count = random.randint(15, 30)
        for i in range(daily_count):
            order_no += 1
            is_rework = random.random() < 0.05
            data.append({
                '工单号': f'WO{order_no}',
                '预约日期': d.date(),
                '到店日期': d.date() if random.random() > 0.1 else None,
                '工单类型': random.choice(order_types),
                '状态': random.choice(statuses),
                '车牌号': f'京A{random.randint(10000, 99999)}',
                '品牌': random.choice(brands),
                '车型': f'{random.choice(brands)}A6L',
                '服务顾问': random.choice(advisors),
                '技师': random.choice(technicians),
                '总金额': round(random.uniform(300, 5000), 2),
                '是否返修': '是' if is_rework else '否',
            })
    return pd.DataFrame(data)


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

    df = generate_mock_appointment_data(start, end)

    total_appointments = int(df['预约量'].sum())
    total_arrivals = int(df['到店量'].sum())
    arrival_rate = round(total_arrivals / total_appointments * 100, 1) if total_appointments > 0 else 0

    rework_rate = round(random.uniform(3, 6), 2)
    shortage_rate = round(random.uniform(1, 4), 2)

    appointment_trend = "↑ 较上期增长 5.2%"
    arrival_trend = "↑ 较上期增长 2.1%"
    rework_trend = "↓ 较上期下降 0.3%"
    rework_trend_color = "text-success"
    shortage_trend = "↑ 较上期上升 0.5%"
    shortage_trend_color = "text-danger"

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
    brand_data = generate_mock_vehicle_data()
    age_data = [
        {'age_group': '0-2年', 'count': 45},
        {'age_group': '2-5年', 'count': 78},
        {'age_group': '5-8年', 'count': 56},
        {'age_group': '8年以上', 'count': 23},
    ]

    brand_fig = create_vehicle_brand_chart(brand_data)
    age_fig = create_vehicle_age_chart(age_data)

    detail_df = pd.DataFrame([
        {'车牌号': '京A12345', '品牌': '大众', '车型': '迈腾', '车龄': 3,
         '里程': 45000, '车主': '张三', '末次进厂': '2024-01-15'},
        {'车牌号': '京B67890', '品牌': '丰田', '车型': '凯美瑞', '车龄': 5,
         '里程': 82000, '车主': '李四', '末次进厂': '2024-01-10'},
        {'车牌号': '京C11111', '品牌': '本田', '车型': '雅阁', '车龄': 2,
         '里程': 28000, '车主': '王五', '末次进厂': '2024-01-18'},
    ])

    detail_table = dash_table.DataTable(
        data=detail_df.to_dict('records'),
        columns=[{'name': col, 'id': col} for col in detail_df.columns],
        page_size=10,
        style_table={'overflowX': 'auto'},
        style_cell={'textAlign': 'left', 'padding': '8px'},
        style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
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
    df = generate_mock_diagnosis_data()

    category_fig = create_diagnosis_category_chart(df)
    severity_fig = create_diagnosis_severity_chart(df)

    detail_df = pd.DataFrame([
        {'工单号': 'WO1001', '故障码': 'P0123', '故障描述': '节气门位置传感器故障',
         '故障类别': '动力系统', '严重程度': '中等', '技师': '技师A'},
        {'工单号': 'WO1002', '故障码': 'B0456', '故障描述': '左前车窗电机故障',
         '故障类别': '车身系统', '严重程度': '轻微', '技师': '技师B'},
        {'工单号': 'WO1003', '故障码': 'C0789', '故障描述': 'ABS传感器故障',
         '故障类别': '底盘系统', '严重程度': '严重', '技师': '技师C'},
    ])

    detail_table = dash_table.DataTable(
        data=detail_df.to_dict('records'),
        columns=[{'name': col, 'id': col} for col in detail_df.columns],
        page_size=10,
        style_table={'overflowX': 'auto'},
        style_cell={'textAlign': 'left', 'padding': '8px'},
        style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
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
    df = generate_mock_order_item_data()

    type_fig = create_order_type_chart(df)
    amount_fig = create_order_amount_chart(df)

    start = date.fromisoformat(start_date) if start_date else date.today()
    end = date.fromisoformat(end_date) if end_date else date.today()
    detail_df = generate_mock_orders_detail(start, end)

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
    start = date.fromisoformat(start_date) if start_date else date.today()
    end = date.fromisoformat(end_date) if end_date else date.today()

    trend_data = generate_mock_rework_trend(start, end)
    reason_data = generate_mock_rework_reasons()

    trend_fig = create_rework_trend_chart(trend_data)
    reason_fig = create_rework_reason_chart(reason_data)

    detail_df = pd.DataFrame([
        {'返修工单号': 'WO1050', '原始工单号': 'WO1020', '车牌号': '京A12345',
         '返修原因': '配件质量问题', '返修类型': '配件相关', '返修日期': '2024-01-20',
         '口径版本': caliber_version},
        {'返修工单号': 'WO1051', '原始工单号': 'WO1025', '车牌号': '京B67890',
         '返修原因': '安装工艺问题', '返修类型': '工艺相关', '返修日期': '2024-01-18',
         '口径版本': caliber_version},
    ])

    detail_table = dash_table.DataTable(
        data=detail_df.to_dict('records'),
        columns=[{'name': col, 'id': col} for col in detail_df.columns],
        page_size=10,
        style_table={'overflowX': 'auto'},
        style_cell={'textAlign': 'left', 'padding': '8px'},
        style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
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
    parts_data = generate_mock_parts_shortage()
    shortage_fig = create_parts_shortage_chart(parts_data)
    corr_fig = create_parts_rework_correlation_chart()

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
            current_data[threshold_key] = str(new_value) if new_value is not None else current_data[threshold_key]
            break

    toast_msg = f"阈值已更新：{threshold_key} = {current_data[threshold_key]}"
    return current_data, True, toast_msg


@app.callback(
    Output('threshold-config-cards', 'children'),
    Input('threshold-store', 'data'),
)
def update_threshold_cards_from_store(threshold_data):
    cards = []
    for th in THRESHOLD_DEFAULTS:
        current_value = threshold_data.get(th['key'], th['value'])
        card = dbc.Col(
            dbc.Card([
                dbc.CardHeader(html.Strong(th['name'])),
                dbc.CardBody([
                    html.H4(current_value, className="text-primary mb-2"),
                    html.P(th['desc'], className="text-muted small mb-2"),
                    dbc.Input(
                        id={'type': 'threshold-input', 'index': th['key']},
                        type=th['type'],
                        value=current_value,
                        className="mb-2",
                        size="sm",
                    ),
                    dbc.Button(
                        "保存",
                        id={'type': 'threshold-save', 'index': th['key']},
                        color="primary",
                        size="sm",
                    ),
                ]),
                dbc.CardFooter(html.Small(f"分类：{th['category']}", className="text-muted")),
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
        label = f"{code} - {info['name']}"
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
    versions = caliber_data.get('versions', {})
    compare_data = []
    for code, info in versions.items():
        if code == 'v1.0':
            rate = 3.2
        elif code == 'v1.1':
            rate = 5.8
        else:
            rate = 4.0
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
    if not caliber_version:
        caliber_version = 'v1.0'

    review_materials = [
        {
            'title': '刹车片缺货专项复盘',
            'date': '2024-01-15',
            'type': '配件缺货',
            'summary': '本月刹车片缺货导致3次延误，关联返修2单，建议增加安全库存',
            'caliber': 'v1.0',
            'status': '已完成',
        },
        {
            'title': '火花塞质量问题返修分析',
            'date': '2024-01-10',
            'type': '配件质量',
            'summary': '火花塞批次质量问题导致返修5单，已联系供应商处理',
            'caliber': 'v1.0',
            'status': '进行中',
        },
    ]

    is_new = False
    toast_msg = ""

    if n_clicks and n_clicks > 0:
        is_new = True
        toast_msg = f"复盘材料已生成，口径版本：{caliber_version}"
        new_report = {
            'title': f'配件缺货返修复盘报告 ({start_date} ~ {end_date})',
            'date': date.today().isoformat(),
            'type': '配件缺货',
            'summary': f'基于{caliber_version}口径，分析配件缺货与返修率的关联关系。'
                       f'本月共发生配件缺货12次，关联返修3单，建议增加安全库存。',
            'caliber': caliber_version,
            'status': '已生成',
        }
        review_materials.insert(0, new_report)

    review_cards = []
    for rm in review_materials:
        status_color = 'success' if rm['status'] in ['已完成', '已生成'] else 'warning'
        type_color = 'info' if rm['type'] == '配件缺货' else 'secondary'
        card = dbc.Card([
            dbc.CardBody([
                dbc.Row([
                    dbc.Col([
                        html.H6(rm['title'], className="mb-1"),
                        html.P(rm['summary'], className="text-muted small mb-2"),
                        html.Div([
                            dbc.Badge(rm['type'], color=type_color, className="me-2"),
                            dbc.Badge(f"口径：{rm['caliber']}", color="secondary", className="me-2"),
                            dbc.Badge(rm['status'], color=status_color),
                        ], className="small"),
                    ], width=10),
                    dbc.Col([
                        html.Small(rm['date'], className="text-muted"),
                        html.Br(),
                        dbc.Button("查看详情", color="link", size="sm", className="p-0 mt-1"),
                    ], width=2, className="text-end"),
                ]),
            ])
        ], className="mb-2")
        review_cards.append(card)

    return review_cards, is_new, toast_msg


def register_callbacks():
    pass
