import dash
from dash import dcc, html, dash_table, Input, Output, State, callback, ALL
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime

from data.data_processor import data_processor
from utils.style_config import *
from utils.helpers import *


def get_drilldown_layout():
    return html.Div([
        html.Div([
            html.H3('处方审核深度复盘', style={'margin': 0, 'fontWeight': '600'}),
            html.P('多层下钻: 批号效期 → 会员档案 → 补货单 → 库存原始记录',
                   style={'margin': '5px 0 0 0', 'color': COLORS['text_light']})
        ], style=HEADER_STYLE),

        dcc.Tabs(
            id='drilldown-tabs',
            value='batch',
            children=[
                dcc.Tab(label='批号效期分析', value='batch', style=TAB_STYLE, selected_style=TAB_SELECTED_STYLE),
                dcc.Tab(label='会员处方档案', value='member', style=TAB_STYLE, selected_style=TAB_SELECTED_STYLE),
                dcc.Tab(label='补货单追踪', value='replenishment', style=TAB_STYLE, selected_style=TAB_SELECTED_STYLE),
            ],
            style={'marginBottom': '20px'}
        ),

        html.Div(id='drilldown-content'),

        html.Div(id='drilldown-modal', style={
            'display': 'none',
            'position': 'fixed',
            'zIndex': 1000,
            'left': 0,
            'top': 0,
            'width': '100%',
            'height': '100%',
            'overflow': 'auto',
            'backgroundColor': 'rgba(0,0,0,0.4)'
        }),
    ])


@callback(
    Output('drilldown-content', 'children'),
    Input('drilldown-tabs', 'value')
)
def render_drilldown_content(tab_value):
    if tab_value == 'batch':
        return get_batch_expiry_layout()
    elif tab_value == 'member':
        return get_member_analysis_layout()
    elif tab_value == 'replenishment':
        return get_replenishment_layout()
    return html.Div()


def get_batch_expiry_layout():
    start_date, end_date = get_date_range(30)

    return html.Div([
        html.Div([
            html.Div([
                html.Label('门店筛选:', style={'marginRight': '10px', 'fontWeight': '500'}),
                dcc.Dropdown(
                    id='batch-store-filter',
                    options=[{'label': '全部门店', 'value': 'all'}] +
                            [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                             for _, row in data_processor.loader.get_stores().iterrows()],
                    value='all',
                    style={'width': '200px', 'display': 'inline-block', 'marginRight': '20px'}
                ),
            ], style={'display': 'flex', 'alignItems': 'center'}),
            html.Div([
                html.Label('风险等级:', style={'marginRight': '10px', 'fontWeight': '500'}),
                dcc.Checklist(
                    id='batch-risk-filter',
                    options=[
                        {'label': '已过期', 'value': '已过期'},
                        {'label': '临期(30天内)', 'value': '临期(30天内)'},
                        {'label': '近效期(90天内)', 'value': '近效期(90天内)'},
                        {'label': '半年内', 'value': '半年内'},
                        {'label': '正常', 'value': '正常'},
                    ],
                    value=['已过期', '临期(30天内)', '近效期(90天内)'],
                    style={'display': 'flex', 'gap': '20px'}
                ),
            ], style={'display': 'flex', 'alignItems': 'center', 'marginTop': '15px'}),
        ], style=CARD_STYLE),

        html.Div([
            html.Div([
                html.H5('库存效期风险分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='batch-expiry-chart', style={'height': '400px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('风险库存价值分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='batch-value-chart', style={'height': '400px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.H5('高风险批次库存明细', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('点击批次号可查看该批次相关处方明细和会员信息',
                     style={'marginBottom': '10px', 'color': COLORS['text_light'], 'fontSize': '13px'}),
            dash_table.DataTable(
                id='batch-detail-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{风险等级} = "已过期"'}, 'backgroundColor': '#FFEBEE', 'color': COLORS['danger']},
                    {'if': {'filter_query': '{风险等级} = "临期(30天内)"'}, 'backgroundColor': '#FFF3E0', 'color': COLORS['warning']},
                ],
                page_size=10,
                row_selectable='single',
                active_cell={'row': 0, 'column': 0},
            )
        ], style=CARD_STYLE),

        html.Div(id='batch-related-prescriptions', style={'marginTop': '20px'}),
    ])


def get_member_analysis_layout():
    start_date, end_date = get_date_range(90)

    return html.Div([
        html.Div([
            dcc.DatePickerRange(
                id='member-date-range',
                start_date=start_date,
                end_date=end_date,
                display_format='YYYY-MM-DD',
                style={'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='member-store-filter',
                options=[{'label': '全部门店', 'value': 'all'}] +
                        [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                         for _, row in data_processor.loader.get_stores().iterrows()],
                value='all',
                style={'width': '200px', 'display': 'inline-block', 'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='member-chronic-filter',
                options=[{'label': '全部慢性病', 'value': 'all'},
                         {'label': '高血压', 'value': '高血压'},
                         {'label': '糖尿病', 'value': '糖尿病'},
                         {'label': '冠心病', 'value': '冠心病'},
                         {'label': '高血脂', 'value': '高血脂'}],
                value='all',
                style={'width': '150px', 'display': 'inline-block'}
            ),
        ], style=CARD_STYLE),

        html.Div([
            html.H5('会员处方分析', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('点击会员记录可查看该会员的历史处方和补货单追踪',
                     style={'marginBottom': '10px', 'color': COLORS['text_light'], 'fontSize': '13px'}),
            dash_table.DataTable(
                id='member-analysis-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{不清率(%)} > 20'}, 'backgroundColor': '#FFEBEE', 'color': COLORS['danger']},
                ],
                page_size=15,
                row_selectable='single',
                active_cell={'row': 0, 'column': 0},
            )
        ], style=CARD_STYLE),

        html.Div(id='member-detail-section', style={'marginTop': '20px'}),
    ])


def get_replenishment_layout():
    start_date, end_date = get_date_range(90)

    return html.Div([
        html.Div([
            dcc.DatePickerRange(
                id='replenish-date-range',
                start_date=start_date,
                end_date=end_date,
                display_format='YYYY-MM-DD',
                style={'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='replenish-store-filter',
                options=[{'label': '全部门店', 'value': 'all'}] +
                        [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                         for _, row in data_processor.loader.get_stores().iterrows()],
                value='all',
                style={'width': '200px', 'display': 'inline-block'}
            ),
        ], style=CARD_STYLE),

        html.Div([
            html.Div([
                html.H5('补货单时效分析', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='replenish-delay-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('供应商分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='replenish-supplier-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.H5('补货单明细', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('点击补货单号可追踪该批次药品的处方流向',
                     style={'marginBottom': '10px', 'color': COLORS['text_light'], 'fontSize': '13px'}),
            dash_table.DataTable(
                id='replenish-detail-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{是否延迟} = "是"'}, 'backgroundColor': '#FFF3E0', 'color': COLORS['warning']},
                ],
                page_size=15,
                row_selectable='single',
                active_cell={'row': 0, 'column': 0},
            )
        ], style=CARD_STYLE),

        html.Div(id='replenish-trace-section', style={'marginTop': '20px'}),
    ])


@callback(
    Output('batch-expiry-chart', 'figure'),
    Output('batch-value-chart', 'figure'),
    Output('batch-detail-table', 'data'),
    Output('batch-detail-table', 'columns'),
    Input('batch-store-filter', 'value'),
    Input('batch-risk-filter', 'value')
)
def update_batch_analysis(store_id, risk_filter):
    store_filter = None if store_id == 'all' else store_id
    inventory_data = data_processor.get_batch_expiry_analysis(store_filter)

    required_cols = ['expiry_status', 'store_name', 'inventory_id', 'quantity', 'stock_value']
    if not inventory_data.empty:
        missing_cols = [col for col in required_cols if col not in inventory_data.columns]
        if missing_cols:
            inventory_data = pd.DataFrame()

    if not inventory_data.empty and risk_filter and 'expiry_status' in inventory_data.columns:
        inventory_data = inventory_data[inventory_data['expiry_status'].isin(risk_filter)]

    expiry_fig = go.Figure()
    value_fig = go.Figure()
    table_data = []
    table_columns = []

    if not inventory_data.empty:
        expiry_summary = inventory_data.groupby(['expiry_status', 'store_name']).agg({
            'inventory_id': 'count',
            'quantity': 'sum',
            'stock_value': 'sum'
        }).reset_index()

        expiry_fig = px.bar(
            expiry_summary,
            x='store_name',
            y='inventory_id',
            color='expiry_status',
            color_discrete_map=RISK_COLORS,
            title='各门店风险批次数量'
        )
        expiry_fig.update_layout(
            barmode='stack',
            xaxis_title='',
            yaxis_title='批次数量',
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

        value_summary = inventory_data.groupby('expiry_status').agg({
            'stock_value': 'sum'
        }).reset_index()
        value_summary['stock_value'] = value_summary['stock_value'].round(2)

        value_fig = px.pie(
            value_summary,
            values='stock_value',
            names='expiry_status',
            color='expiry_status',
            color_discrete_map=RISK_COLORS,
            hole=0.4,
            title='风险库存价值占比'
        )
        value_fig.update_traces(textinfo='percent+label', textposition='outside')
        value_fig.update_layout(showlegend=False, margin=dict(l=0, r=0, t=30, b=0))

        display_cols = ['batch_no', 'drug_name', 'specification', 'store_name', 'quantity',
                        'expiry_date', 'days_to_expiry', 'expiry_status', 'stock_value']
        col_mapping = {
            'batch_no': '批号', 'drug_name': '药品名称', 'specification': '规格',
            'store_name': '门店', 'quantity': '库存数量', 'expiry_date': '有效期',
            'days_to_expiry': '距到期天数', 'expiry_status': '风险等级', 'stock_value': '库存价值'
        }
        available_cols = [col for col in display_cols if col in inventory_data.columns]
        display_data = inventory_data[available_cols].copy()
        if 'days_to_expiry' in display_data.columns:
            display_data = display_data.sort_values('days_to_expiry')
        display_data = display_data.rename(columns=col_mapping)
        if '有效期' in display_data.columns:
            display_data['有效期'] = display_data['有效期'].apply(format_date)
        if '库存价值' in display_data.columns:
            display_data['库存价值'] = display_data['库存价值'].apply(lambda x: f'¥{x:,.2f}')

        table_data = safe_df_to_records(display_data)
        table_columns = [
            {'name': col, 'id': col, 'selectable': True}
            for col in display_data.columns
        ]

    return expiry_fig, value_fig, table_data, table_columns


@callback(
    Output('batch-related-prescriptions', 'children'),
    Input('batch-detail-table', 'active_cell'),
    State('batch-detail-table', 'data')
)
def show_batch_related_prescriptions(active_cell, table_data):
    if not active_cell or not table_data:
        return html.Div()

    row_data = table_data[active_cell['row']]
    batch_no = row_data['批号']

    cashier_items = data_processor.loader.get_cashier_items()
    prescriptions = data_processor.loader.get_prescriptions()
    members = data_processor.loader.get_members()

    related_items = cashier_items[cashier_items['batch_no'] == batch_no]
    if related_items.empty:
        return html.Div([
            html.H5(f'批次 {batch_no} 相关处方', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('该批次暂无处方记录', style={'color': COLORS['text_light']})
        ], style=CARD_STYLE)

    rx_ids = related_items['prescription_id'].dropna().unique()
    related_prescriptions = prescriptions[prescriptions['prescription_id'].isin(rx_ids)]

    if not related_prescriptions.empty and not members.empty:
        related_prescriptions = related_prescriptions.merge(
            members[['member_id', 'name', 'phone', 'chronic_disease']],
            on='member_id', how='left'
        )

    display_cols = ['prescription_no', 'name', 'chronic_disease', 'created_at',
                    'audit_status', 'is_clear', 'unclear_reason']
    if all(col in related_prescriptions.columns for col in display_cols):
        display_data = related_prescriptions[display_cols].copy()
        display_data.columns = ['处方编号', '会员姓名', '慢性病', '开方时间',
                                '审核状态', '是否清晰', '不清原因']
        display_data['开方时间'] = display_data['开方时间'].apply(format_datetime)

        return html.Div([
            html.H5(f'批次 {batch_no} 相关处方明细 ({len(display_data)} 条)',
                    style={'marginBottom': '15px', 'fontWeight': '600'}),
            dash_table.DataTable(
                data=safe_df_to_records(display_data),
                columns=[{'name': col, 'id': col, 'selectable': True, 'sortable': True}
                         for col in display_data.columns],
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                page_size=10,
                row_selectable='single',
            )
        ], style=CARD_STYLE)

    return html.Div()


@callback(
    Output('member-analysis-table', 'data'),
    Output('member-analysis-table', 'columns'),
    Input('member-date-range', 'start_date'),
    Input('member-date-range', 'end_date'),
    Input('member-store-filter', 'value'),
    Input('member-chronic-filter', 'value')
)
def update_member_analysis(start_date, end_date, store_id, chronic_filter):
    store_filter = None if store_id == 'all' else store_id
    member_data = data_processor.get_member_prescription_analysis(start_date, end_date, store_filter)

    if not member_data.empty and chronic_filter != 'all':
        member_data = member_data[member_data['chronic_disease'] == chronic_filter]

    table_data = []
    table_columns = []

    if not member_data.empty:
        display_cols = ['member_card_no', 'name', 'chronic_disease', 'member_level',
                        'rx_count', 'unclear_count', 'unclear_rate', 'phone']
        display_data = member_data[display_cols].copy()
        display_data.columns = ['会员卡号', '姓名', '慢性病', '会员等级',
                                '处方次数', '不清次数', '不清率(%)', '联系电话']

        table_data = safe_df_to_records(display_data.head(100))
        table_columns = [
            {'name': col, 'id': col, 'selectable': True}
            for col in display_data.columns
        ]

    return table_data, table_columns


@callback(
    Output('member-detail-section', 'children'),
    Input('member-analysis-table', 'active_cell'),
    State('member-analysis-table', 'data'),
    State('member-date-range', 'start_date'),
    State('member-date-range', 'end_date')
)
def show_member_detail(active_cell, table_data, start_date, end_date):
    if not active_cell or not table_data:
        return html.Div()

    row_data = table_data[active_cell['row']]
    member_card_no = row_data['会员卡号']

    members = data_processor.loader.get_members()
    member = members[members['member_card_no'] == member_card_no]

    if member.empty:
        return html.Div()

    member_id = member['member_id'].iloc[0]
    prescriptions = data_processor.loader.get_prescriptions(start_date, end_date)
    member_prescriptions = prescriptions[prescriptions['member_id'] == member_id]

    member_info = member.iloc[0]

    return html.Div([
        html.H5(f'会员详情 - {member_info["name"]}', style={'marginBottom': '15px', 'fontWeight': '600'}),

        html.Div([
            html.Div([
                html.Div([
                    html.Label('会员卡号:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(member_info['member_card_no'])
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('联系电话:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(member_info['phone'])
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('慢性病:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(member_info.get('chronic_disease', '-'))
                ], style={'marginBottom': '10px'}),
            ], style={'flex': 1}),
            html.Div([
                html.Div([
                    html.Label('会员等级:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(member_info.get('member_level', '-'))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('出生日期:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(format_date(member_info.get('birthday')))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('注册日期:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(format_date(member_info.get('register_date')))
                ], style={'marginBottom': '10px'}),
            ], style={'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px', 'padding': '15px',
                  'backgroundColor': COLORS['light'], 'borderRadius': '8px'}),

        html.H6(f'历史处方记录 ({len(member_prescriptions)} 条)',
                style={'marginBottom': '10px', 'fontWeight': '600'}),
        dash_table.DataTable(
            data=safe_df_to_records(member_prescriptions),
            columns=[
                {'name': col, 'id': col, 'selectable': True}
                for col in ['prescription_no', 'diagnosis', 'audit_status', 'is_clear',
                            'unclear_reason', 'created_at']
            ],
            style_table=TABLE_STYLE,
            style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
            style_cell={'padding': '10px', 'textAlign': 'left'},
            page_size=10,
        )
    ], style=CARD_STYLE)


@callback(
    Output('replenish-delay-chart', 'figure'),
    Output('replenish-supplier-chart', 'figure'),
    Output('replenish-detail-table', 'data'),
    Output('replenish-detail-table', 'columns'),
    Input('replenish-date-range', 'start_date'),
    Input('replenish-date-range', 'end_date'),
    Input('replenish-store-filter', 'value')
)
def update_replenishment_analysis(start_date, end_date, store_id):
    store_filter = None if store_id == 'all' else store_id
    replenish_data = data_processor.get_replenishment_analysis(start_date, end_date, store_filter)

    delay_fig = go.Figure()
    supplier_fig = go.Figure()
    table_data = []
    table_columns = []

    if not replenish_data.empty:
        replenish_data['month'] = pd.to_datetime(replenish_data['order_date']).dt.to_period('M').dt.to_timestamp()
        delay_summary = replenish_data.groupby('month').agg({
            'replenishment_order_id': 'count',
            'is_delayed': 'sum'
        }).reset_index()
        delay_summary.columns = ['月份', '订单总数', '延迟订单数']
        delay_summary['准时率(%)'] = ((delay_summary['订单总数'] - delay_summary['延迟订单数']) /
                                     delay_summary['订单总数'] * 100).round(2)

        delay_fig = go.Figure()
        delay_fig.add_trace(go.Bar(
            x=delay_summary['月份'],
            y=delay_summary['订单总数'],
            name='订单总数',
            marker_color=COLORS['primary']
        ))
        delay_fig.add_trace(go.Bar(
            x=delay_summary['月份'],
            y=delay_summary['延迟订单数'],
            name='延迟订单数',
            marker_color=COLORS['danger']
        ))
        delay_fig.add_trace(go.Scatter(
            x=delay_summary['月份'],
            y=delay_summary['准时率(%)'],
            name='准时率(%)',
            yaxis='y2',
            mode='lines+markers',
            line=dict(color=COLORS['success'], width=2)
        ))
        delay_fig.update_layout(
            barmode='stack',
            yaxis2=dict(title='准时率(%)', overlaying='y', side='right', range=[0, 100]),
            yaxis=dict(title='订单数量'),
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

        supplier_summary = replenish_data.groupby('supplier').agg({
            'replenishment_order_id': 'count',
            'delay_days': 'mean',
            'total_amount': 'sum'
        }).reset_index()
        supplier_summary.columns = ['供应商', '订单数', '平均延迟天数', '总金额']
        supplier_summary['平均延迟天数'] = supplier_summary['平均延迟天数'].round(1)

        supplier_fig = px.bar(
            supplier_summary.sort_values('订单数', ascending=True),
            y='供应商',
            x='订单数',
            orientation='h',
            color='平均延迟天数',
            color_continuous_scale='RdYlGn_r',
            title='供应商订单量及平均延迟'
        )
        supplier_fig.update_layout(
            xaxis_title='订单数量',
            yaxis_title='',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

        replenish_data['是否延迟'] = replenish_data['is_delayed'].apply(lambda x: '是' if x else '否')
        display_cols = ['order_no', 'store_name', 'supplier', 'order_date',
                        'expected_date', 'actual_date', 'delay_days', '是否延迟', 'total_amount']
        display_data = replenish_data[display_cols].copy()
        display_data.columns = ['补货单号', '门店', '供应商', '下单日期',
                                '预计到货', '实际到货', '延迟天数', '是否延迟', '订单金额']
        display_data['下单日期'] = display_data['下单日期'].apply(format_date)
        display_data['预计到货'] = display_data['预计到货'].apply(format_date)
        display_data['实际到货'] = display_data['实际到货'].apply(format_date)
        display_data['订单金额'] = display_data['订单金额'].apply(lambda x: f'¥{x:,.2f}')

        table_data = safe_df_to_records(display_data)
        table_columns = [
            {'name': col, 'id': col, 'selectable': True}
            for col in display_data.columns
        ]

    return delay_fig, supplier_fig, table_data, table_columns


@callback(
    Output('replenish-trace-section', 'children'),
    Input('replenish-detail-table', 'active_cell'),
    State('replenish-detail-table', 'data')
)
def trace_replenish_to_prescription(active_cell, table_data):
    if not active_cell or not table_data:
        return html.Div()

    row_data = table_data[active_cell['row']]
    order_no = row_data['补货单号']

    replenishment = data_processor.loader.get_replenishment_orders()
    order = replenishment[replenishment['order_no'] == order_no]

    if order.empty:
        return html.Div()

    order_id = order['replenishment_order_id'].iloc[0]
    repl_items = data_processor.loader.get_replenishment_items(order_id)
    inventory = data_processor.loader.get_inventory()
    cashier_items = data_processor.loader.get_cashier_items()
    prescriptions = data_processor.loader.get_prescriptions()
    drugs = data_processor.loader.get_drugs()

    related_inv = inventory[inventory['replenishment_order_id'] == order_id]
    if related_inv.empty:
        return html.Div([
            html.H5(f'补货单 {order_no} 流向追踪', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('该补货单暂无库存关联', style={'color': COLORS['text_light']})
        ], style=CARD_STYLE)

    batch_nos = related_inv['batch_no'].unique()
    related_cashier = cashier_items[cashier_items['batch_no'].isin(batch_nos)]
    rx_ids = related_cashier['prescription_id'].dropna().unique()
    related_prescriptions = prescriptions[prescriptions['prescription_id'].isin(rx_ids)]

    if not related_prescriptions.empty and not drugs.empty:
        related_prescriptions = related_prescriptions.merge(
            drugs[['drug_id', 'drug_name']],
            left_on='drug_id', right_on='drug_id', how='left'
        ) if 'drug_id' in related_prescriptions.columns else related_prescriptions

    repl_items_display = repl_items.merge(drugs[['drug_id', 'drug_name', 'specification']], on='drug_id', how='left') \
        if not repl_items.empty and not drugs.empty else repl_items

    return html.Div([
        html.H5(f'补货单 {order_no} 流向追踪', style={'marginBottom': '15px', 'fontWeight': '600'}),

        html.Div([
            html.H6('补货单明细', style={'marginBottom': '10px', 'fontWeight': '600'}),
            dash_table.DataTable(
                data=safe_df_to_records(repl_items_display),
                columns=[
                    {'name': col, 'id': col, 'selectable': True}
                    for col in ['drug_name', 'specification', 'batch_no', 'order_quantity',
                                'received_quantity', 'unit_price']
                ] if not repl_items_display.empty else [],
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                page_size=5,
            )
        ], style={'marginBottom': '20px'}),

        html.Div([
            html.H6(f'关联库存批次 ({len(batch_nos)} 个批次)',
                    style={'marginBottom': '10px', 'fontWeight': '600'}),
            dash_table.DataTable(
                data=safe_df_to_records(related_inv),
                columns=[
                    {'name': col, 'id': col, 'selectable': True}
                    for col in ['batch_no', 'drug_id', 'quantity', 'expiry_date', 'store_id']
                ],
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                page_size=5,
            )
        ], style={'marginBottom': '20px'}),

        html.Div([
            html.H6(f'处方流向 ({len(related_prescriptions)} 张处方)',
                    style={'marginBottom': '10px', 'fontWeight': '600'}),
            dash_table.DataTable(
                data=safe_df_to_records(related_prescriptions),
                columns=[
                    {'name': col, 'id': col, 'selectable': True}
                    for col in ['prescription_no', 'store_id', 'member_id', 'audit_status',
                                'is_clear', 'created_at']
                ],
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                page_size=10,
            )
        ]),
    ], style=CARD_STYLE)
