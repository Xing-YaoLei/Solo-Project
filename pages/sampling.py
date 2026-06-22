import dash
from dash import dcc, html, Input, Output, State, callback, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime

from utils.data_service import get_sampling_data
from app.config import Config

dash.register_page(__name__, path='/sampling')

RISK_COLORS = Config.RISK_COLORS
STATUS_COLORS = Config.STATUS_COLORS


def create_gauge_chart(coverage, target, title):
    color = '#2d6a4f' if coverage >= target else ('#f77f00' if coverage >= target * 0.7 else '#d62828')
    
    fig = go.Figure(go.Indicator(
        mode='gauge+number+delta',
        value=coverage,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 14, 'color': '#333'}},
        delta={'reference': target, 'relative': True, 'valueformat': '.1%'},
        gauge={
            'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': '#999'},
            'bar': {'color': color, 'thickness': 0.3},
            'bgcolor': 'white',
            'borderwidth': 2,
            'bordercolor': '#ccc',
            'steps': [
                {'range': [0, target * 0.7], 'color': 'rgba(214, 40, 40, 0.15)'},
                {'range': [target * 0.7, target], 'color': 'rgba(247, 127, 0, 0.15)'},
                {'range': [target, 100], 'color': 'rgba(45, 106, 79, 0.15)'}
            ],
            'threshold': {
                'line': {'color': '#d62828', 'width': 3},
                'thickness': 0.75,
                'value': target
            }
        },
        number={'suffix': '%', 'font': {'size': 24, 'family': 'JetBrains Mono'}}
    ))
    
    fig.update_layout(
        height=200,
        margin=dict(l=20, r=20, t=40, b=20),
        paper_bgcolor='rgba(0,0,0,0)',
        font={'family': 'Noto Sans SC'}
    )
    
    return fig


def create_coverage_bar_chart(coverage_data):
    depts = [d['department'] for d in coverage_data]
    coverages = [d['coverage'] for d in coverage_data]
    targets = [d['target'] for d in coverage_data]
    
    colors = []
    for d in coverage_data:
        if d['coverage'] >= d['target']:
            colors.append('#2d6a4f')
        elif d['coverage'] >= d['target'] * 0.7:
            colors.append('#f77f00')
        else:
            colors.append('#d62828')
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=depts,
        y=coverages,
        marker=dict(color=colors, line=dict(color='white', width=1)),
        text=[f'{c}%' for c in coverages],
        textposition='auto',
        name='实际覆盖率',
        hovertemplate='<b>%{x}</b><br>覆盖率: %{y}%<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=depts,
        y=targets,
        mode='lines+markers',
        line=dict(color='#1e3a5f', width=2, dash='dash'),
        marker=dict(symbol='circle', size=8, color='#1e3a5f'),
        name='目标值',
        hovertemplate='<b>%{x}</b><br>目标: %{y}%<extra></extra>'
    ))
    
    fig.update_layout(
        xaxis_title='部门',
        yaxis_title='覆盖率 (%)',
        yaxis=dict(range=[0, 100]),
        legend=dict(orientation='h', y=1.1),
        margin=dict(l=0, r=0, t=20, b=0),
        height=350,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        barmode='group'
    )
    
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef')
    
    return fig


def create_sampling_result_pie(records):
    results = {}
    for r in records:
        result = r.get('result', '待核实')
        results[result] = results.get(result, 0) + 1
    
    labels = list(results.keys())
    values = list(results.values())
    colors_map = {
        '符合': '#2d6a4f',
        '不符合': '#d62828',
        '待核实': '#f77f00'
    }
    colors = [colors_map.get(l, '#6c757d') for l in labels]
    
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.5,
        marker=dict(colors=colors, line=dict(color='white', width=2)),
        textinfo='label+percent',
        hovertemplate='<b>%{label}</b><br>数量: %{value}<br>占比: %{percent}<extra></extra>'
    )])
    
    fig.update_layout(
        margin=dict(l=0, r=0, t=20, b=0),
        height=250,
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=True,
        legend=dict(orientation='h', y=-0.1)
    )
    
    return fig


def layout():
    return html.Div([
        html.H2('抽样分析', className='page-title'),
        html.P('查看各业务模块抽样覆盖率，管理抽样记录，确保审计样本具有代表性', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('部门:', className='filter-label'),
                dcc.Dropdown(
                    id='sampling-dept-filter',
                    options=[
                        {'label': '全部部门', 'value': 'all'},
                        {'label': '财务部', 'value': 1},
                        {'label': '采购部', 'value': 2},
                        {'label': '销售部', 'value': 3},
                        {'label': '人力资源部', 'value': 4},
                        {'label': '信息技术部', 'value': 5},
                        {'label': '行政部', 'value': 6},
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '150px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Span('抽样结果:', className='filter-label'),
                dcc.Dropdown(
                    id='sampling-result-filter',
                    options=[
                        {'label': '全部结果', 'value': 'all'},
                        {'label': '符合', 'value': '符合'},
                        {'label': '不符合', 'value': '不符合'},
                        {'label': '待核实', 'value': '待核实'},
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '150px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Button('📊 导出报告', id='export-sampling-report', 
                           className='btn btn-primary btn-sm'),
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div(id='gauge-container', className='metrics-grid'),
        
        html.Div([
            html.Div([
                html.H3('各部门抽样覆盖率对比', className='chart-title'),
                dcc.Graph(id='coverage-bar-chart', config={'displayModeBar': False})
            ], className='chart-card', style={'gridColumn': 'span 2'}),
            html.Div([
                html.H3('抽样结果分布', className='chart-title'),
                dcc.Graph(id='sampling-result-pie', config={'displayModeBar': False})
            ], className='chart-card'),
        ], className='chart-row'),
        
        html.Div([
            html.H3('抽样记录详情', className='chart-title'),
            html.Div(id='sampling-table-container', style={'marginTop': '16px'})
        ], className='chart-card'),
        
        html.Div([
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('抽样记录详情')),
                dbc.ModalBody(id='sampling-detail-body'),
                dbc.ModalFooter(
                    dbc.Button('关闭', id='close-sampling-modal', className='btn btn-outline')
                ),
            ], id='sampling-modal', size='lg', is_open=False),
        ])
    ])


@callback(
    [Output('gauge-container', 'children'),
     Output('coverage-bar-chart', 'figure'),
     Output('sampling-result-pie', 'figure'),
     Output('sampling-table-container', 'children')],
    [Input('sampling-dept-filter', 'value'),
     Input('sampling-result-filter', 'value')]
)
def update_sampling_data(dept_filter, result_filter):
    data = get_sampling_data()
    coverage_data = data['coverage_by_department']
    records = data['sampling_records']
    
    if dept_filter != 'all':
        dept_name_map = {1: '财务部', 2: '采购部', 3: '销售部', 4: '人力资源部', 5: '信息技术部', 6: '行政部'}
        target_dept = dept_name_map.get(dept_filter)
        coverage_data = [d for d in coverage_data if d['department'] == target_dept]
        records = [r for r in records if r['department'] == target_dept]
    
    if result_filter != 'all':
        records = [r for r in records if r.get('result') == result_filter]
    
    gauges = []
    for dept_data in coverage_data:
        gauge = html.Div([
            dcc.Graph(
                figure=create_gauge_chart(
                    dept_data['coverage'], 
                    dept_data['target'],
                    dept_data['department']
                ),
                config={'displayModeBar': False}
            ),
            html.Div([
                html.Span(f"抽样: {dept_data['sampled_count']}/{dept_data['total_transactions']} 笔",
                         style={'fontSize': '12px', 'color': '#666'})
            ], style={'textAlign': 'center', 'marginTop': '-10px'})
        ], className='chart-card fade-in-up', style={'padding': '15px'})
        gauges.append(gauge)
    
    table_columns = [
        {'name': '抽样编号', 'id': 'sample_no'},
        {'name': '问题标题', 'id': 'issue_title'},
        {'name': '部门', 'id': 'department'},
        {'name': '风险等级', 'id': 'risk_level'},
        {'name': '抽样人', 'id': 'sampled_by'},
        {'name': '抽样时间', 'id': 'sampled_at'},
        {'name': '结果', 'id': 'result'},
        {'name': '关联交易号', 'id': 'transaction_no'},
        {'name': '操作', 'id': 'action'}
    ]
    
    table_data = []
    for r in records:
        risk_level = r['risk_level']
        result = r.get('result', '待核实')
        result_class = 'verified' if result == '符合' else ('pending' if result == '待核实' else 'overdue')
        
        row = {
            'sample_no': r['sample_no'],
            'issue_title': r['issue_title'],
            'department': r['department'],
            'risk_level': risk_level.upper(),
            'risk_level_class': f'risk-badge {risk_level}',
            'sampled_by': r['sampled_by'],
            'sampled_at': r['sampled_at'],
            'result': result,
            'result_class': f'status-badge {result_class}',
            'transaction_no': r.get('transaction_no', '-'),
            'action': '查看详情'
        }
        table_data.append(row)
    
    risk_colors = Config.RISK_COLORS
    status_colors = {
        'verified': '#2d6a4f',
        'pending': '#f77f00',
        'overdue': '#d62828'
    }
    
    style_data_conditional = [
        {'if': {'row_index': 'odd'}, 'backgroundColor': '#fafbfc'},
        {
            'if': {'column_id': 'risk_level', 'filter_query': '{risk_level} eq "CRITICAL"'},
            'color': risk_colors.get('critical', '#dc2626'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'risk_level', 'filter_query': '{risk_level} eq "HIGH"'},
            'color': risk_colors.get('high', '#ea580c'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'risk_level', 'filter_query': '{risk_level} eq "MEDIUM"'},
            'color': risk_colors.get('medium', '#ca8a04'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'risk_level', 'filter_query': '{risk_level} eq "LOW"'},
            'color': risk_colors.get('low', '#16a34a'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'result', 'filter_query': '{result} eq "符合"'},
            'color': status_colors['verified'],
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'result', 'filter_query': '{result} eq "待核实"'},
            'color': status_colors['pending'],
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'result', 'filter_query': '{result} eq "不符合"'},
            'color': status_colors['overdue'],
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'action'},
            'color': '#1e3a5f',
            'textDecoration': 'underline',
            'cursor': 'pointer'
        }
    ]
    
    table = dash_table.DataTable(
        columns=table_columns,
        data=table_data,
        style_table={'overflowX': 'auto'},
        style_header={
            'backgroundColor': '#f8f9fa',
            'fontWeight': '600',
            'color': '#1e3a5f',
            'borderBottom': '2px solid #e9ecef'
        },
        style_cell={
            'padding': '12px 16px',
            'textAlign': 'left',
            'borderBottom': '1px solid #f1f3f5',
            'fontSize': '13px'
        },
        style_data_conditional=style_data_conditional,
        page_size=10,
        page_current=0,
        sort_action='native',
        filter_action='native',
        id='sampling-datatable'
    )
    
    return (
        gauges,
        create_coverage_bar_chart(coverage_data),
        create_sampling_result_pie(records),
        table
    )


@callback(
    Output('sampling-modal', 'is_open'),
    Output('sampling-detail-body', 'children'),
    [Input('sampling-datatable', 'active_cell'),
     Input('close-sampling-modal', 'n_clicks')],
    [State('sampling-datatable', 'data'),
     State('sampling-modal', 'is_open')],
    prevent_initial_call=True
)
def toggle_sampling_modal(active_cell, close_click, table_data, is_open):
    from dash import ctx
    
    triggered = ctx.triggered[0]
    
    if 'close-sampling-modal' in triggered['prop_id']:
        return False, None
    
    if 'sampling-datatable.active_cell' in triggered['prop_id'] and active_cell:
        if active_cell.get('column_id') == 'action':
            row = active_cell.get('row')
            if row is not None and row < len(table_data):
                sample_no = table_data[row]['sample_no']
                
                data = get_sampling_data()
                record = next((r for r in data['sampling_records'] if r['sample_no'] == sample_no), None)
                
                if record:
                    body = html.Div([
                        html.Div([
                            html.Div([
                                html.Strong('抽样编号：'), record['sample_no']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('关联问题：'), record['issue_title']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('风险等级：'),
                                html.Span(record['risk_level'].upper(), 
                                         className=f'risk-badge {record["risk_level"]}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('部门：'), record['department']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('抽样人：'), record['sampled_by']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('抽样时间：'), record['sampled_at']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('结果：'),
                                html.Span(record.get('result', '待核实'), 
                                         className=f'status-badge {"verified" if record.get("result") == "符合" else ("pending" if record.get("result") == "待核实" else "overdue")}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('备注：'), record.get('notes', '无')
                            ], style={'marginBottom': '16px'}),
                        ], style={'padding': '16px', 'background': '#f8f9fa', 'borderRadius': '6px', 'marginBottom': '16px'}),
                        
                        html.H5('关联数据'),
                        html.Div([
                            html.Div([
                                html.H6('ERP交易数据'),
                                html.Div([
                                    html.Div([html.Strong('交易号：'), record.get('transaction_no', '-')], style={'marginBottom': '4px'}),
                                    html.Div([html.Strong('金额：'), f"¥{record.get('transaction_amount', 0):,.2f}" if record.get('transaction_amount') else '-'], style={'marginBottom': '4px'}),
                                ], style={'padding': '12px', 'border': '1px solid #e9ecef', 'borderRadius': '4px'})
                            ], style={'flex': '1'}),
                            html.Div([
                                html.H6('权限日志数据'),
                                html.Div([
                                    html.Div([html.Strong('操作：'), record.get('permission_action', '-')], style={'marginBottom': '4px'}),
                                    html.Div([html.Strong('资源：'), record.get('permission_resource', '-')], style={'marginBottom': '4px'}),
                                ], style={'padding': '12px', 'border': '1px solid #e9ecef', 'borderRadius': '4px'})
                            ], style={'flex': '1', 'marginLeft': '16px'}),
                        ], style={'display': 'flex'}),
                        
                        html.Div([
                            html.Button(
                                '🔗 查看完整问题详情',
                                id={'type': 'go-to-detail', 'index': record['issue_id']},
                                className='btn btn-primary',
                                style={'marginTop': '16px'}
                            )
                        ])
                    ])
                    return True, body
    
    return is_open, None


layout = layout
