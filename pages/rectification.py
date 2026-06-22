import dash
from dash import dcc, html, Input, Output, State, callback, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timedelta

from utils.data_service import get_rectification_plans, get_note_tasks, update_issue_status, create_note_task
from app.config import Config

dash.register_page(__name__, path='/rectification')

RISK_COLORS = Config.RISK_COLORS
STATUS_COLORS = Config.STATUS_COLORS


def create_gantt_chart(plans):
    if not plans:
        return go.Figure()
    
    fig = go.Figure()
    
    today = datetime.now().date()
    
    for i, plan in enumerate(reversed(plans)):
        start_date = datetime.strptime(plan['start_date'], '%Y-%m-%d').date() if plan['start_date'] else today
        end_date = datetime.strptime(plan['end_date'], '%Y-%m-%d').date() if plan['end_date'] else today
        actual_end = datetime.strptime(plan['actual_end_date'], '%Y-%m-%d').date() if plan['actual_end_date'] else None
        
        duration = (end_date - start_date).days
        progress = plan['progress']
        
        if plan['status'] == 'closed' or plan['progress'] == 100:
            bar_color = '#2d6a4f'
        elif plan['is_overdue']:
            bar_color = '#d62828'
        elif plan['status'] == 'in_progress':
            bar_color = '#0077b6'
        else:
            bar_color = '#6c757d'
        
        fig.add_trace(go.Bar(
            y=[plan['title'][:30] + '...' if len(plan['title']) > 30 else plan['title']],
            x=[duration],
            orientation='h',
            marker=dict(color='rgba(200, 200, 200, 0.3)', line=dict(color='#ccc', width=1)),
            showlegend=False,
            hoverinfo='none'
        ))
        
        progress_duration = duration * progress / 100
        fig.add_trace(go.Bar(
            y=[plan['title'][:30] + '...' if len(plan['title']) > 30 else plan['title']],
            x=[progress_duration],
            orientation='h',
            marker=dict(color=bar_color, line=dict(color=bar_color, width=1)),
            name=plan['status'],
            showlegend=False,
            hovertemplate=f'<b>{plan["title"]}</b><br>' +
                         f'进度: {progress}%<br>' +
                         f'状态: {plan["status"]}<br>' +
                         f'计划: {plan["start_date"]} ~ {plan["end_date"]}<br>' +
                         f'责任人: {plan["owner"]}<extra></extra>'
        ))
        
        if plan['is_overdue']:
            fig.add_annotation(
                x=duration + 1,
                y=i,
                text='⚠️ 逾期',
                showarrow=False,
                font=dict(color='#d62828', size=11),
                xanchor='left'
            )
    
    fig.update_layout(
        barmode='overlay',
        height=max(400, len(plans) * 30 + 100),
        margin=dict(l=200, r=80, t=20, b=40),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(
            title='工期 (天)',
            showgrid=True,
            gridcolor='#e9ecef',
            zeroline=True,
            zerolinecolor='#ccc'
        ),
        yaxis=dict(
            automargin=True
        ),
        bargap=0.3
    )
    
    return fig


def create_progress_distribution_chart(plans):
    statuses = ['pending', 'in_progress', 'completed', 'overdue']
    status_names = {
        'pending': '待开始',
        'in_progress': '进行中',
        'completed': '已完成',
        'overdue': '已逾期'
    }
    
    counts = {s: 0 for s in statuses}
    for plan in plans:
        if plan['is_overdue']:
            counts['overdue'] += 1
        elif plan['progress'] == 100 or plan['status'] == 'closed':
            counts['completed'] += 1
        elif plan['status'] == 'in_progress' or plan['progress'] > 0:
            counts['in_progress'] += 1
        else:
            counts['pending'] += 1
    
    colors = ['#6c757d', '#0077b6', '#2d6a4f', '#d62828']
    
    fig = go.Figure(data=[go.Bar(
        x=[status_names[s] for s in statuses],
        y=[counts[s] for s in statuses],
        marker=dict(color=colors, line=dict(color='white', width=1)),
        text=[counts[s] for s in statuses],
        textposition='auto',
        hovertemplate='<b>%{x}</b><br>数量: %{y}<extra></extra>'
    )])
    
    fig.update_layout(
        xaxis_title='整改进度',
        yaxis_title='计划数量',
        margin=dict(l=0, r=0, t=20, b=0),
        height=280,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig


def layout():
    return html.Div([
        html.H2('整改追踪', className='page-title'),
        html.P('管理整改计划，追踪任务进度，自动识别证据缺失并生成备注任务', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('状态:', className='filter-label'),
                dcc.Dropdown(
                    id='rect-status-filter',
                    options=[
                        {'label': '全部状态', 'value': 'all'},
                        {'label': '待开始', 'value': 'pending'},
                        {'label': '进行中', 'value': 'in_progress'},
                        {'label': '已完成', 'value': 'verified'},
                        {'label': '已关闭', 'value': 'closed'},
                        {'label': '已逾期', 'value': 'overdue'},
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '150px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Span('风险等级:', className='filter-label'),
                dcc.Dropdown(
                    id='rect-risk-filter',
                    options=[
                        {'label': '全部等级', 'value': 'all'},
                        {'label': '严重', 'value': 'critical'},
                        {'label': '高', 'value': 'high'},
                        {'label': '中', 'value': 'medium'},
                        {'label': '低', 'value': 'low'},
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '150px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Button('➕ 创建整改计划', id='create-plan-btn', 
                           className='btn btn-primary btn-sm'),
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div(id='rect-metrics', className='metrics-grid'),
        
        html.Div([
            html.Div([
                html.H3('⚠️ 证据缺失任务', className='chart-title'),
                html.Div(id='missing-evidence-alerts', style={'maxHeight': '300px', 'overflowY': 'auto'})
            ], className='chart-card'),
            html.Div([
                html.H3('整改进度分布', className='chart-title'),
                dcc.Graph(id='progress-dist-chart', config={'displayModeBar': False})
            ], className='chart-card'),
        ], className='chart-row'),
        
        html.Div([
            html.H3('整改计划甘特图', className='chart-title'),
            dcc.Graph(id='gantt-chart', config={'displayModeBar': False})
        ], className='chart-card', style={'marginBottom': '24px'}),
        
        html.Div([
            html.H3('整改计划列表', className='chart-title'),
            html.Div(id='rect-plan-table', style={'marginTop': '16px'})
        ], className='chart-card'),
        
        html.Div([
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('整改计划详情')),
                dbc.ModalBody(id='plan-detail-body'),
                dbc.ModalFooter([
                    dbc.Button('生成备注任务', id='create-note-task-btn', 
                              className='btn btn-warning', color='warning'),
                    dbc.Button('关闭', id='close-plan-modal', className='btn btn-outline')
                ]),
            ], id='plan-modal', size='lg', is_open=False),
            
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('创建备注任务')),
                dbc.ModalBody([
                    html.Div([
                        dbc.Label('任务标题'),
                        dbc.Input(id='note-title', placeholder='请输入任务标题'),
                    ], style={'marginBottom': '12px'}),
                    html.Div([
                        dbc.Label('任务描述'),
                        dbc.Textarea(id='note-description', placeholder='请描述需要补充的证据材料', rows=4),
                    ], style={'marginBottom': '12px'}),
                    html.Div([
                        dbc.Label('责任人'),
                        dcc.Dropdown(
                            id='note-assignee',
                            options=[
                                {'label': '张三', 'value': 1},
                                {'label': '李四', 'value': 2},
                                {'label': '王五', 'value': 3},
                                {'label': '赵六', 'value': 4},
                            ],
                            value=1,
                            clearable=False
                        ),
                    ], style={'marginBottom': '12px'}),
                    html.Div([
                        dbc.Label('截止日期'),
                        dcc.DatePickerSingle(
                            id='note-due-date',
                            date=(datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
                            display_format='YYYY-MM-DD'
                        ),
                    ]),
                ]),
                dbc.ModalFooter([
                    dbc.Button('取消', id='cancel-note-modal', className='btn btn-outline'),
                    dbc.Button('确认创建', id='confirm-create-note', className='btn btn-primary'),
                ]),
            ], id='note-task-modal', is_open=False),
            
            dbc.Alert(
                id='note-task-notification',
                is_open=False,
                duration=4000,
                color='success',
                style={'position': 'fixed', 'top': '20px', 'right': '20px', 'zIndex': '9999'}
            ),
        ]),
        
        dcc.Store(id='selected-plan-id', data=None)
    ])


@callback(
    [Output('rect-metrics', 'children'),
     Output('gantt-chart', 'figure'),
     Output('progress-dist-chart', 'figure'),
     Output('rect-plan-table', 'children'),
     Output('missing-evidence-alerts', 'children')],
    [Input('rect-status-filter', 'value'),
     Input('rect-risk-filter', 'value')]
)
def update_rectification_data(status_filter, risk_filter):
    plans = get_rectification_plans()
    tasks = get_note_tasks()
    
    if status_filter != 'all':
        if status_filter == 'overdue':
            plans = [p for p in plans if p['is_overdue']]
        else:
            plans = [p for p in plans if p['status'] == status_filter]
    
    if risk_filter != 'all':
        plans = [p for p in plans if p['risk_level'] == risk_filter]
        tasks = [t for t in tasks if t['risk_level'] == risk_filter]
    
    pending = sum(1 for p in plans if p['status'] in ['pending', 'in_progress'])
    overdue = sum(1 for p in plans if p['is_overdue'])
    completed = sum(1 for p in plans if p['status'] == 'closed' or p['progress'] == 100)
    missing_evidence = len([t for t in tasks if t['status'] != 'closed'])
    
    avg_progress = round(sum(p['progress'] for p in plans) / len(plans), 1) if plans else 0
    
    metrics = [
        html.Div([
            html.Div(f'{len(plans)}', className='metric-value'),
            html.Div('整改计划总数', className='metric-label'),
        ], className='metric-card primary fade-in-up'),
        html.Div([
            html.Div(f'{pending}', className='metric-value'),
            html.Div('待完成', className='metric-label'),
        ], className='metric-card warning fade-in-up'),
        html.Div([
            html.Div(f'{overdue}', className='metric-value'),
            html.Div('已逾期', className='metric-label'),
        ], className='metric-card danger fade-in-up'),
        html.Div([
            html.Div(f'{completed}', className='metric-value'),
            html.Div('已完成', className='metric-label'),
        ], className='metric-card success fade-in-up'),
        html.Div([
            html.Div(f'{avg_progress}%', className='metric-value'),
            html.Div('平均进度', className='metric-label'),
        ], className='metric-card info fade-in-up'),
    ]
    
    alert_tasks = [t for t in tasks if t['status'] != 'closed']
    if alert_tasks:
        alerts = []
        for t in alert_tasks[:5]:
            alerts.append(html.Div([
                html.Div([
                    html.Strong(t['title']),
                    html.Span(t['risk_level'].upper(), 
                             className=f'risk-badge {t["risk_level"]}',
                             style={'marginLeft': '8px'}),
                    html.Span('逾期' if t['is_overdue'] else '待处理',
                             className=f'status-badge {"overdue" if t["is_overdue"] else "pending"}',
                             style={'marginLeft': '8px'}),
                ], style={'marginBottom': '4px'}),
                html.Div([
                    html.Span(f'👤 {t["assignee"]}', style={'fontSize': '12px', 'color': '#666', 'marginRight': '16px'}),
                    html.Span(f'📅 截止: {t["due_date"]}', style={'fontSize': '12px', 'color': '#666'}),
                ]),
                html.Div(t['description'], style={'fontSize': '12px', 'color': '#666', 'marginTop': '4px'})
            ], style={
                'padding': '12px', 
                'background': '#fff8e1', 
                'borderLeft': '4px solid #f77f00',
                'borderRadius': '4px',
                'marginBottom': '8px'
            }, className='pulse' if t['is_overdue'] else ''))
        alerts_html = html.Div(alerts)
    else:
        alerts_html = html.Div('✅ 暂无证据缺失任务', 
                              style={'padding': '40px', 'textAlign': 'center', 'color': '#666'})
    
    table_columns = [
        {'name': '计划名称', 'id': 'title'},
        {'name': '关联问题', 'id': 'issue_title'},
        {'name': '风险等级', 'id': 'risk_level'},
        {'name': '部门', 'id': 'department'},
        {'name': '责任人', 'id': 'owner'},
        {'name': '计划时间', 'id': 'period'},
        {'name': '进度', 'id': 'progress'},
        {'name': '状态', 'id': 'status'},
        {'name': '操作', 'id': 'action'}
    ]
    
    table_data = []
    for p in plans:
        period = f"{p['start_date']} ~ {p['end_date']}" if p['start_date'] else '-'
        status_display = '已逾期' if p['is_overdue'] else p['status']
        
        table_data.append({
            'title': p['title'],
            'issue_title': p['issue_title'],
            'risk_level': p['risk_level'].upper(),
            'department': p['department'],
            'owner': p['owner'],
            'period': period,
            'progress': f'{p["progress"]}%',
            'progress_value': p['progress'],
            'status': status_display,
            'is_overdue': p['is_overdue'],
            'action': '详情',
            'plan_id': p['id'],
            'issue_id': p['issue_id']
        })
    
    risk_colors = Config.RISK_COLORS
    status_colors = Config.STATUS_COLORS
    
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
            'if': {'column_id': 'status', 'filter_query': '{is_overdue} eq true'},
            'color': '#d62828',
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'status', 'filter_query': '{status} eq "pending"'},
            'color': status_colors.get('pending', '#6c757d'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'status', 'filter_query': '{status} eq "in_progress"'},
            'color': status_colors.get('in_progress', '#0077b6'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'status', 'filter_query': '{status} eq "verified"'},
            'color': status_colors.get('verified', '#2d6a4f'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'status', 'filter_query': '{status} eq "resolved"'},
            'color': status_colors.get('resolved', '#2d6a4f'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'status', 'filter_query': '{status} eq "closed"'},
            'color': status_colors.get('closed', '#6c757d'),
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'progress', 'filter_query': '{progress_value} >= 80'},
            'color': '#2d6a4f',
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'progress', 'filter_query': '{progress_value} >= 50 && {progress_value} < 80'},
            'color': '#f77f00',
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'progress', 'filter_query': '{progress_value} < 50'},
            'color': '#d62828',
            'fontWeight': '600'
        },
        {
            'if': {'column_id': 'action'},
            'color': '#1e3a5f',
            'textDecoration': 'underline',
            'cursor': 'pointer'
        }
    ]
    
    from dash import dash_table
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
        sort_action='native',
        filter_action='native',
        id='rectification-datatable'
    )
    
    return (
        metrics,
        create_gantt_chart(plans),
        create_progress_distribution_chart(plans),
        table,
        alerts_html
    )


@callback(
    Output('plan-modal', 'is_open'),
    Output('plan-detail-body', 'children'),
    Output('selected-plan-id', 'data'),
    [Input('rectification-datatable', 'active_cell'),
     Input('close-plan-modal', 'n_clicks')],
    [State('rectification-datatable', 'data'),
     State('plan-modal', 'is_open')],
    prevent_initial_call=True
)
def toggle_plan_modal(active_cell, close_click, table_data, is_open):
    import json
    
    triggered = ctx.triggered[0]
    
    if 'close-plan-modal' in triggered['prop_id']:
        return False, None, None
    
    if 'rectification-datatable.active_cell' in triggered['prop_id'] and active_cell:
        if active_cell.get('column_id') == 'action':
            row = active_cell.get('row')
            if row is not None and row < len(table_data):
                plan_id = table_data[row]['plan_id']
                
                plans = get_rectification_plans()
                plan = next((p for p in plans if p['id'] == plan_id), None)
                
                if plan:
                    body = html.Div([
                        html.Div([
                            html.Div([
                                html.Strong('计划名称：'), plan['title']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('关联问题：'), plan['issue_title']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('风险等级：'),
                                html.Span(plan['risk_level'].upper(), 
                                         className=f'risk-badge {plan["risk_level"]}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('状态：'),
                                html.Span('已逾期' if plan['is_overdue'] else plan['status'], 
                                         className=f'status-badge {"overdue" if plan["is_overdue"] else plan["status"]}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('责任人：'), plan['owner']
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('计划周期：'),
                                f"{plan['start_date']} ~ {plan['end_date']}" if plan['start_date'] else '-'
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('实际完成：'),
                                plan['actual_end_date'] if plan['actual_end_date'] else '未完成'
                            ], style={'marginBottom': '8px'}),
                        ], style={'padding': '16px', 'background': '#f8f9fa', 'borderRadius': '6px', 'marginBottom': '16px'}),
                        
                        html.H5('整改描述'),
                        html.Div(plan['description'], style={'padding': '12px', 'background': 'white', 
                                                              'border': '1px solid #e9ecef', 'borderRadius': '4px',
                                                              'marginBottom': '16px'}),
                        
                        html.H5('整改进度'),
                        html.Div([
                            html.Div(className='progress-bar', style={'height': '20px'}, children=[
                                html.Div(
                                    className=f'progress-fill {"danger" if plan["is_overdue"] else ""}',
                                    style={'width': f'{plan["progress"]}%'}
                                )
                            ]),
                            html.Div(f'当前进度: {plan["progress"]}%', 
                                    style={'marginTop': '8px', 'textAlign': 'center', 'fontWeight': '500'})
                        ], style={'marginBottom': '16px'}),
                        
                        html.Div([
                            dcc.Link(
                                '🔗 查看问题详情',
                                href=f'/detail?issue_id={plan["issue_id"]}',
                                className='btn btn-primary',
                                style={'textDecoration': 'none'}
                            )
                        ])
                    ])
                    return True, body, plan_id
    
    return is_open, None, None


@callback(
    Output('note-task-modal', 'is_open'),
    Input('create-note-task-btn', 'n_clicks'),
    Input('cancel-note-modal', 'n_clicks'),
    State('note-task-modal', 'is_open'),
    prevent_initial_call=True
)
def toggle_note_modal(create_click, cancel_click, is_open):
    return not is_open


@callback(
    Output('note-task-notification', 'is_open'),
    Output('note-task-notification', 'children'),
    Input('confirm-create-note', 'n_clicks'),
    [State('selected-plan-id', 'data'),
     State('note-title', 'value'),
     State('note-description', 'value'),
     State('note-assignee', 'value'),
     State('note-due-date', 'date')],
    prevent_initial_call=True
)
def confirm_create_note(n_clicks, plan_id, title, description, assignee, due_date):
    if not plan_id or not title:
        return True, '❌ 请填写完整的任务信息'
    
    plans = get_rectification_plans()
    plan = next((p for p in plans if p['id'] == plan_id), None)
    
    if not plan:
        return True, '❌ 未找到对应的整改计划'
    
    result = create_note_task(
        issue_id=plan['issue_id'],
        title=title,
        description=description,
        assignee_id=assignee,
        due_date=datetime.strptime(due_date, '%Y-%m-%d'),
        created_by=1
    )
    
    if result.get('success'):
        return True, f'✅ 备注任务创建成功！任务ID: {result.get("task_id")}'
    else:
        return True, f'❌ 创建失败: {result.get("message")}'


layout = layout
