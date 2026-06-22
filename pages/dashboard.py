import dash
from dash import dcc, html, Input, Output, State, callback, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import pandas as pd

from utils.data_service import get_risk_summary, get_trend_data, get_issues_by_filter
from app.config import Config

dash.register_page(__name__, path='/', name='风险监测')

RISK_COLORS = Config.RISK_COLORS
STATUS_COLORS = Config.STATUS_COLORS


def create_metric_card(value, label, trend=None, trend_up=False, variant='primary'):
    trend_class = 'up' if trend_up else 'down'
    trend_arrow = '↑' if trend_up else '↓'
    
    if isinstance(value, (int, float)):
        display_value = f'{value:,}'
    else:
        display_value = str(value)
    
    return html.Div([
        html.Div(display_value, className='metric-value'),
        html.Div(label, className='metric-label'),
        html.Div([
            html.Span(trend_arrow + ' ' + str(trend), className=f'metric-trend {trend_class}')
        ]) if trend else None
    ], className=f'metric-card {variant} fade-in-up')


def create_heatmap(data):
    depts = [d['department'] for d in data['department_risks']]
    dept_ids = [d['department_id'] for d in data['department_risks']]
    risk_levels = ['critical', 'high', 'medium', 'low']
    
    z = []
    customdata = []
    for d in data['department_risks']:
        row = [d['critical'], d['high'], d['medium'], d['low']]
        z.append(row)
        customdata_row = []
        for i, rl in enumerate(risk_levels):
            customdata_row.append([d['department_id'], rl, d['department']])
        customdata.append(customdata_row)
    
    colorscale = [
        [0, '#ffffff'],
        [0.2, '#fef3c7'],
        [0.4, '#fcd34d'],
        [0.6, '#f97316'],
        [0.8, '#dc2626'],
        [1, '#7f1d1d']
    ]
    
    fig = go.Figure(data=go.Heatmap(
        z=z,
        x=risk_levels,
        y=depts,
        customdata=customdata,
        colorscale=colorscale,
        showscale=True,
        hovertemplate='<b>%{y}</b><br>' +
                      '风险等级: %{x}<br>' +
                      '问题数量: %{z}<extra></extra>',
        text=z,
        texttemplate='%{text}',
        textfont={'size': 12, 'color': 'white'}
    ))
    
    fig.update_layout(
        xaxis_title='风险等级',
        yaxis_title='部门',
        margin=dict(l=0, r=0, t=20, b=0),
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig


def create_trend_chart(trend_df):
    fig = go.Figure()
    
    for risk in ['critical', 'high', 'medium', 'low']:
        df_risk = trend_df[trend_df['risk_level'] == risk]
        fig.add_trace(go.Scatter(
            x=df_risk['month'],
            y=df_risk['count'],
            name=risk,
            mode='lines+markers',
            line=dict(color=RISK_COLORS.get(risk, '#666'), width=3),
            marker=dict(size=8),
            hovertemplate='<b>%{x}</b><br>' +
                         f'{risk}: ' + '%{y} 个问题<extra></extra>'
        ))
    
    fig.update_layout(
        xaxis_title='月份',
        yaxis_title='问题数量',
        legend_title='风险等级',
        margin=dict(l=0, r=0, t=20, b=0),
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        hovermode='x unified'
    )
    
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef')
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef')
    
    return fig


def create_risk_pie_chart(risk_dist):
    labels = list(risk_dist.keys())
    values = list(risk_dist.values())
    colors = [RISK_COLORS.get(l, '#666') for l in labels]
    
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.6,
        marker=dict(colors=colors, line=dict(color='white', width=3)),
        textinfo='label+percent',
        texttemplate='<b>%{label}</b><br>%{value}个 (%{percent})',
        hovertemplate='<b>%{label}</b><br>数量: %{value}<br>占比: %{percent}<extra></extra>'
    )])
    
    fig.update_layout(
        margin=dict(l=0, r=0, t=20, b=0),
        height=300,
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=False
    )
    
    return fig


def create_status_bar_chart(status_dist):
    status_order = ['pending', 'in_progress', 'verified', 'resolved', 'closed']
    status_names = {
        'pending': '待处理',
        'in_progress': '处理中',
        'verified': '已核实',
        'resolved': '已解决',
        'closed': '已关闭'
    }
    
    x = [status_names[s] for s in status_order]
    y = [status_dist.get(s, 0) for s in status_order]
    colors = [STATUS_COLORS.get(s, '#666') for s in status_order]
    
    fig = go.Figure(data=[go.Bar(
        x=x,
        y=y,
        marker=dict(color=colors, line=dict(color='white', width=1)),
        text=y,
        textposition='auto',
        hovertemplate='<b>%{x}</b><br>数量: %{y}<extra></extra>'
    )])
    
    fig.update_layout(
        xaxis_title='处理状态',
        yaxis_title='问题数量',
        margin=dict(l=0, r=0, t=20, b=0),
        height=300,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig


def layout():
    default_start = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    default_end = datetime.now().strftime('%Y-%m-%d')
    
    return html.Div([
        html.H2('风险监测总览', className='page-title'),
        html.P('实时监控各部门合规审计问题，按风险等级、处理状态进行多维度分析', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('时间范围:', className='filter-label'),
                dcc.DatePickerRange(
                    id='date-range',
                    start_date=default_start,
                    end_date=default_end,
                    display_format='YYYY-MM-DD'
                )
            ], className='filter-item'),
            html.Div([
                html.Span('部门:', className='filter-label'),
                dcc.Dropdown(
                    id='dept-filter',
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
                html.Button('🔄 刷新', id='refresh-btn', className='btn btn-primary btn-sm'),
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div(id='metrics-container', className='metrics-grid'),
        
        html.Div([
            html.Div([
                html.H3('风险热力分布', className='chart-title'),
                dcc.Graph(id='heatmap-chart', config={'displayModeBar': False})
            ], className='chart-card'),
            html.Div([
                html.H3('风险等级分布', className='chart-title'),
                dcc.Graph(id='risk-pie-chart', config={'displayModeBar': False})
            ], className='chart-card'),
        ], className='chart-row'),
        
        html.Div([
            html.Div([
                html.H3('问题趋势分析', className='chart-title'),
                dcc.Graph(id='trend-chart', config={'displayModeBar': False})
            ], className='chart-card'),
            html.Div([
                html.H3('处理状态分布', className='chart-title'),
                dcc.Graph(id='status-chart', config={'displayModeBar': False})
            ], className='chart-card'),
        ], className='chart-row'),
        
        dcc.Interval(
            id='interval-component',
            interval=60*1000,
            n_intervals=0
        ),
        
        dbc.Modal(
            [
                dbc.ModalHeader(id='chart-modal-header'),
                dbc.ModalBody(id='chart-modal-body'),
                dbc.ModalFooter(
                    dbc.Button('关闭', id='close-chart-modal', className='ms-auto')
                ),
            ],
            id='chart-modal',
            is_open=False,
            size='lg',
            scrollable=True
        )
    ])


@callback(
    [Output('metrics-container', 'children'),
     Output('heatmap-chart', 'figure'),
     Output('risk-pie-chart', 'figure'),
     Output('trend-chart', 'figure'),
     Output('status-chart', 'figure')],
    [Input('date-range', 'start_date'),
     Input('date-range', 'end_date'),
     Input('dept-filter', 'value'),
     Input('refresh-btn', 'n_clicks'),
     Input('interval-component', 'n_intervals')]
)
def update_dashboard(start_date, end_date, dept_filter, n_clicks, n):
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    dept_id = None if dept_filter == 'all' else dept_filter
    
    data = get_risk_summary((start_dt, end_dt), dept_id)
    trend_df = get_trend_data(6)
    
    metrics = [
        create_metric_card(data['total_issues'], '问题总数', '12%', True, 'primary'),
        create_metric_card(data['pending_rectification'], '待整改数', '8%', True, 'warning'),
        create_metric_card(data['overdue_plans'], '逾期整改', '5%', True, 'danger'),
        create_metric_card(f"{data['sampling_coverage']}%", '抽样覆盖率', '3%', False, 'success'),
        create_metric_card(data['missing_evidence'], '证据缺失', '2', True, 'danger'),
    ]
    
    return (
        metrics,
        create_heatmap(data),
        create_risk_pie_chart(data['risk_distribution']),
        create_trend_chart(trend_df),
        create_status_bar_chart(data['status_distribution'])
    )


@callback(
    [Output('chart-modal', 'is_open'),
     Output('chart-modal-header', 'children'),
     Output('chart-modal-body', 'children')],
    [Input('heatmap-chart', 'clickData'),
     Input('risk-pie-chart', 'clickData'),
     Input('trend-chart', 'clickData'),
     Input('status-chart', 'clickData'),
     Input('close-chart-modal', 'n_clicks')],
    [State('date-range', 'start_date'),
     State('date-range', 'end_date'),
     State('dept-filter', 'value'),
     State('chart-modal', 'is_open')],
    prevent_initial_call=True
)
def handle_chart_click(heatmap_click, pie_click, trend_click, status_click,
                       close_click, start_date, end_date, dept_filter, is_open):
    from dash import ctx
    
    triggered = ctx.triggered[0]['prop_id']
    
    if 'close-chart-modal' in triggered:
        return False, None, None
    
    status_display = {
        'pending': '待处理',
        'in_progress': '处理中',
        'verified': '已核实',
        'resolved': '已解决',
        'closed': '已关闭'
    }
    
    dept_id = None
    risk_level = None
    status = None
    modal_title = ''
    issues = []
    
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    date_range = (start_dt, end_dt)
    
    if 'heatmap-chart' in triggered and heatmap_click:
        points = heatmap_click['points'][0]
        cd = points.get('customdata')
        if cd:
            dept_id = cd[0]
            risk_level = cd[1]
            dept_name = cd[2]
            modal_title = f'{dept_name} - {risk_level.upper()} 级风险问题'
            issues = get_issues_by_filter(
                department_id=dept_id, risk_level=risk_level, date_range=date_range
            )
    elif 'risk-pie-chart' in triggered and pie_click:
        points = pie_click['points'][0]
        risk_level = points['label']
        modal_title = f'{risk_level.upper()} 级风险问题列表'
        dept_id = None if dept_filter == 'all' else dept_filter
        issues = get_issues_by_filter(
            department_id=dept_id, risk_level=risk_level, date_range=date_range
        )
    elif 'trend-chart' in triggered and trend_click:
        points = trend_click['points'][0]
        risk_level = points['curveNumber']
        risk_mapping = ['critical', 'high', 'medium', 'low']
        risk_level = risk_mapping[risk_level] if risk_level < 4 else None
        modal_title = f'{risk_level.upper()} 级风险趋势明细'
        dept_id = None if dept_filter == 'all' else dept_filter
        issues = get_issues_by_filter(
            department_id=dept_id, risk_level=risk_level, date_range=date_range
        )
    elif 'status-chart' in triggered and status_click:
        points = status_click['points'][0]
        status_cn = points['x']
        status_mapping = {'待处理': 'pending', '处理中': 'in_progress', 
                         '已核实': 'verified', '已解决': 'resolved', '已关闭': 'closed'}
        status = status_mapping.get(status_cn)
        modal_title = f'{status_cn} 问题列表'
        dept_id = None if dept_filter == 'all' else dept_filter
        issues = get_issues_by_filter(
            department_id=dept_id, status=status, date_range=date_range
        )
    
    if not issues:
        body = html.Div('暂无符合条件的问题', 
                       style={'padding': '40px', 'textAlign': 'center', 'color': '#666'})
        return True, modal_title, body
    
    issues_rows = []
    for issue in issues:
        issues_rows.append(html.Div([
            html.Div(f"#{issue['id']}", style={
                'flex': '0 0 60px',
                'fontFamily': 'var(--font-mono)',
                'fontSize': '12px',
                'color': '#666'
            }),
            html.Div([
                html.Div(issue['title'], style={'fontWeight': '500'}),
                html.Div([
                    html.Span(f"[{issue['department']}]", 
                             style={'fontSize': '12px', 'color': '#666', 'marginRight': '8px'}),
                    html.Span(issue['discovered_date'], 
                             style={'fontSize': '12px', 'color': '#666'})
                ], style={'marginTop': '2px'})
            ], style={'flex': '1'}),
            html.Div([
                html.Span(issue['risk_level'].upper(), 
                         className=f'risk-badge {issue["risk_level"]}',
                         style={'marginRight': '8px'}),
                html.Span(status_display.get(issue['status'], issue['status']),
                         className=f'status-badge {issue["status"]}')
            ], style={'flex': '0 0 180px', 'textAlign': 'right'}),
            html.Div([
                dcc.Link(
                    '🔍 查看详情',
                    href=f'/detail?issue_id={issue["id"]}',
                    className='btn btn-primary btn-sm',
                    style={'padding': '4px 12px', 'textDecoration': 'none'}
                )
            ], style={'flex': '0 0 100px', 'textAlign': 'right'})
        ], style={
            'display': 'flex',
            'alignItems': 'center',
            'padding': '12px',
            'borderBottom': '1px solid #e9ecef',
            'gap': '12px'
        }))
    
    body = html.Div([
        html.Div([
            html.Div('ID', style={'flex': '0 0 60px', 'fontWeight': '500', 'color': 'var(--primary)'}),
            html.Div('问题描述', style={'flex': '1', 'fontWeight': '500', 'color': 'var(--primary)'}),
            html.Div('状态', style={'flex': '0 0 180px', 'fontWeight': '500', 'color': 'var(--primary)', 'textAlign': 'right'}),
            html.Div('操作', style={'flex': '0 0 100px', 'fontWeight': '500', 'color': 'var(--primary)', 'textAlign': 'right'}),
        ], style={
            'display': 'flex',
            'alignItems': 'center',
            'padding': '10px 12px',
            'background': '#f8f9fa',
            'borderRadius': '4px 4px 0 0',
            'gap': '12px'
        }),
        *issues_rows
    ], style={
        'border': '1px solid #e9ecef',
        'borderRadius': '4px',
        'overflow': 'hidden'
    })
    
    return True, modal_title, body


layout = layout
