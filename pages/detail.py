import dash
from dash import dcc, html, Input, Output, State, callback, ctx, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

from utils.data_service import get_issue_detail, update_issue_status
from app.config import Config

dash.register_page(__name__, path='/detail')

RISK_COLORS = Config.RISK_COLORS
STATUS_COLORS = Config.STATUS_COLORS


def create_timeline(detail_data):
    timeline_items = []
    
    timeline_items.append({
        'time': detail_data['discovered_date'],
        'title': '问题发现',
        'content': f"发现问题：{detail_data['title']}",
        'type': 'warning'
    })
    
    for sr in detail_data['sampling_records']:
        timeline_items.append({
            'time': sr['sampled_at'],
            'title': f'抽样检查 - {sr["sample_no"]}',
            'content': f"结果：{sr['result']}，{sr.get('notes', '无备注')}",
            'type': 'info' if sr['result'] == '符合' else ('warning' if sr['result'] == '待核实' else 'danger')
        })
    
    for ev in detail_data['evidences']:
        if ev.get('email_sent_at'):
            timeline_items.append({
                'time': ev['email_sent_at'],
                'title': f'邮件证据 - {ev["type"]}',
                'content': f"主题：{ev.get('email_subject', '无主题')}，发件人：{ev.get('email_sender', '未知')}",
                'type': 'success'
            })
    
    if detail_data['rectification_plan']:
        plan = detail_data['rectification_plan']
        if plan['start_date']:
            timeline_items.append({
                'time': plan['start_date'],
                'title': '整改启动',
                'content': f"整改计划：{plan['title']}，责任人：{plan['owner']}",
                'type': 'info'
            })
        
        if plan['actual_end_date']:
            timeline_items.append({
                'time': plan['actual_end_date'],
                'title': '整改完成',
                'content': f"整改进度：{plan['progress']}%，状态：{plan['status']}",
                'type': 'success'
            })
    
    for task in detail_data['note_tasks']:
        if task['due_date']:
            timeline_items.append({
                'time': task['due_date'],
                'title': f'备注任务{"截止" if task["status"] != "closed" else "完成"}',
                'content': f"{task['title']}，责任人：{task['assignee']}，状态：{task['status']}",
                'type': 'danger' if task['status'] != 'closed' else 'success'
            })
    
    timeline_items.sort(key=lambda x: x['time'])
    
    timeline_html = []
    for item in timeline_items:
        dot_class = {'success': 'success', 'warning': 'warning', 'danger': 'danger', 'info': ''}.get(item['type'], '')
        
        timeline_html.append(html.Div([
            html.Div(className=f'timeline-dot {dot_class}'),
            html.Div([
                html.Div(item['title'], className='timeline-title'),
                html.Div(item['time'], className='timeline-time'),
                html.Div(item['content'], style={'fontSize': '13px', 'color': '#495057'})
            ], className='timeline-content')
        ], className='timeline-item'))
    
    return html.Div(timeline_html, style={'marginTop': '20px'})


def layout(**kwargs):
    issue_id = kwargs.get('issue_id', 1)
    try:
        issue_id = int(issue_id)
    except (ValueError, TypeError):
        issue_id = 1
    
    return html.Div([
        html.H2('问题明细追溯', className='page-title'),
        html.P('从汇总数据逐层钻取，查看完整证据链，包括权限日志、ERP凭证和邮件原始记录', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('问题ID:', className='filter-label'),
                dcc.Input(
                    id='issue-id-input',
                    type='number',
                    placeholder='输入问题ID',
                    value=issue_id,
                    style={'padding': '6px 10px', 'borderRadius': '4px', 'border': '1px solid #ced4da'}
                ),
            ], className='filter-item'),
            html.Div([
                html.Button('🔍 查询', id='query-issue-btn', className='btn btn-primary btn-sm'),
            ], className='filter-item'),
            html.Div([
                dcc.Link('← 返回看板', href='/', className='btn btn-outline btn-sm')
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div(id='detail-content'),
        
        html.Div([
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('处理问题')),
                dbc.ModalBody([
                    html.Div([
                        dbc.Label('状态'),
                        dcc.Dropdown(
                            id='update-status',
                            options=[
                                {'label': '待处理', 'value': 'pending'},
                                {'label': '处理中', 'value': 'in_progress'},
                                {'label': '已核实', 'value': 'verified'},
                                {'label': '已解决', 'value': 'resolved'},
                                {'label': '已关闭', 'value': 'closed'},
                            ],
                            value='pending',
                            clearable=False
                        ),
                    ], style={'marginBottom': '12px'}),
                    html.Div([
                        dbc.Label('处理结论'),
                        dbc.Textarea(id='update-conclusion', placeholder='请输入处理结论...', rows=4),
                    ]),
                ]),
                dbc.ModalFooter([
                    dbc.Button('取消', id='cancel-update-modal', className='btn btn-outline'),
                    dbc.Button('确认更新', id='confirm-update', className='btn btn-primary'),
                ]),
            ], id='update-modal', is_open=False),
            
            dbc.Alert(
                id='update-notification',
                is_open=False,
                duration=4000,
                style={'position': 'fixed', 'top': '20px', 'right': '20px', 'zIndex': '9999'}
            ),
        ]),
        
        dcc.Store(id='current-issue-id', data=None)
    ])


@callback(
    Output('detail-content', 'children'),
    Output('current-issue-id', 'data'),
    [Input('query-issue-btn', 'n_clicks'),
     Input('issue-id-input', 'value')],
    prevent_initial_call=False
)
def load_issue_detail(n_clicks, issue_id):
    if not issue_id:
        return html.Div(
            '请输入问题ID进行查询',
            style={'padding': '60px', 'textAlign': 'center', 'color': '#666'}
        ), None
    
    detail = get_issue_detail(int(issue_id))
    
    if not detail:
        return html.Div(
            f'未找到问题ID为 {issue_id} 的记录',
            style={'padding': '60px', 'textAlign': 'center', 'color': '#d62828'}
        ), None
    
    status_display = {
        'pending': '待处理',
        'in_progress': '处理中',
        'verified': '已核实',
        'resolved': '已解决',
        'closed': '已关闭'
    }
    
    content = html.Div([
        html.Div([
            html.Div([
                html.Div([
                    html.Span(f"问题 #{detail['id']}", style={
                        'fontFamily': 'var(--font-mono)',
                        'fontSize': '13px',
                        'color': '#666'
                    }),
                    html.H3(detail['title'], style={'margin': '8px 0'}),
                    html.Div([
                        html.Span(detail['risk_level'].upper(), 
                                 className=f'risk-badge {detail["risk_level"]}',
                                 style={'marginRight': '8px'}),
                        html.Span(status_display.get(detail['status'], detail['status']), 
                                 className=f'status-badge {detail["status"]}',
                                 style={'marginRight': '8px'}),
                        html.Span(f"📅 发现于 {detail['discovered_date']}", 
                                 style={'fontSize': '12px', 'color': '#666'}),
                        html.Span(f"👤 责任人：{detail['assignee']} ({detail['assignee_email']})", 
                                 style={'fontSize': '12px', 'color': '#666', 'marginLeft': '16px'})
                    ])
                ], style={'flex': '1'}),
                html.Div([
                    html.Button(
                        '✏️ 处理问题',
                        id='open-update-modal',
                        className='btn btn-primary'
                    )
                ])
            ], style={'display': 'flex', 'alignItems': 'flex-start', 'gap': '16px'})
        ], className='chart-card', style={'marginBottom': '24px'}),
        
        html.Div([
            html.Div([
                html.H4('问题描述', style={'fontSize': '16px', 'marginBottom': '12px'}),
                html.Div(detail['description'], style={
                    'padding': '16px',
                    'background': '#f8f9fa',
                    'borderRadius': '6px',
                    'lineHeight': '1.8'
                })
            ], className='chart-card', style={'gridColumn': 'span 2'}),
            
            html.Div([
                html.H4('检查项信息', style={'fontSize': '16px', 'marginBottom': '12px'}),
                html.Div([
                    html.Div([
                        html.Strong('检查项编号：'),
                        detail['checklist_item']['code']
                    ], style={'marginBottom': '6px'}),
                    html.Div([
                        html.Strong('检查项名称：'),
                        detail['checklist_item']['title']
                    ], style={'marginBottom': '6px'}),
                    html.Div([
                        html.Strong('检查项描述：'),
                        detail['checklist_item']['description']
                    ], style={'marginBottom': '6px'}),
                    html.Div([
                        html.Strong('所属部门：'),
                        detail['department']
                    ], style={'marginBottom': '6px'}),
                    html.Div([
                        html.Strong('证据完整：'),
                        html.Span('✅ 是' if detail['has_evidence'] else '❌ 否',
                                 style={'color': '#2d6a4f' if detail['has_evidence'] else '#d62828'})
                    ], style={'marginBottom': '6px'}),
                    html.Hr(),
                    html.H5('处理结论', style={'fontSize': '14px', 'marginBottom': '8px'}),
                    html.Div(
                        detail['conclusion'] if detail['conclusion'] else '暂无处理结论',
                        style={'color': '#666', 'fontStyle': 'italic' if not detail['conclusion'] else 'normal'}
                    )
                ], style={'padding': '16px', 'background': '#f8f9fa', 'borderRadius': '6px'})
            ], className='chart-card', style={'gridColumn': 'span 1'}),
        ], className='chart-row'),
        
        html.Div([
            html.H3('📊 完整事件时间线', className='chart-title'),
            create_timeline(detail)
        ], className='chart-card', style={'marginBottom': '24px'}),
        
        html.Div([
            html.Div([
                html.H3('🎯 抽样记录', className='chart-title'),
                html.Div([
                    html.Div([
                        html.Div([
                            html.Strong('抽样编号'),
                            html.Strong('抽样时间'),
                            html.Strong('抽样人'),
                            html.Strong('结果'),
                            html.Strong('关联数据'),
                        ], style={'display': 'grid', 'gridTemplateColumns': '1.5fr 1.5fr 1fr 1fr 2fr', 
                                 'padding': '10px 12px', 'background': '#f8f9fa', 
                                 'fontWeight': '600', 'color': '#1e3a5f', 'borderRadius': '4px 4px 0 0'}),
                        *[
                            html.Div([
                                html.Div(sr['sample_no'], style={'fontFamily': 'var(--font-mono)', 'fontSize': '12px'}),
                                html.Div(sr['sampled_at'], style={'fontSize': '12px', 'color': '#666'}),
                                html.Div(sr['sampled_by']),
                                html.Div(
                                    html.Span(sr['result'], 
                                             className=f'status-badge {"verified" if sr["result"] == "符合" else ("pending" if sr["result"] == "待核实" else "overdue")}')
                                ),
                                html.Div([
                                    html.Div([
                                        html.Strong('ERP：'), sr.get('transaction_no', '-'),
                                        html.Span(f" (¥{sr.get('transaction_amount', 0):,.2f})", 
                                                 style={'fontFamily': 'var(--font-mono)', 'fontSize': '11px', 'color': '#666'})
                                    ]) if sr.get('transaction_no') else html.Div('无ERP关联'),
                                    html.Div([
                                        html.Strong('权限：'), sr.get('permission_action', '-'),
                                        html.Span(f" - {sr.get('permission_resource', '')}", 
                                                 style={'fontSize': '11px', 'color': '#666'})
                                    ]) if sr.get('permission_action') else html.Div('无权限日志关联'),
                                ], style={'fontSize': '12px'})
                            ], style={'display': 'grid', 'gridTemplateColumns': '1.5fr 1.5fr 1fr 1fr 2fr',
                                     'padding': '10px 12px', 'borderBottom': '1px solid #f1f3f5',
                                     'alignItems': 'center'})
                            for sr in detail['sampling_records']
                        ]
                    ], style={'border': '1px solid #e9ecef', 'borderRadius': '6px', 'overflow': 'hidden'})
                ])
            ], className='chart-card')
        ], style={'marginBottom': '24px'}),
        
        html.Div([
            html.H3('📧 邮件证据', className='chart-title'),
            html.Div([
                html.Div(
                [
                    html.Div([
                        html.Div([
                            html.Strong(ev.get('email_sender', '未知发件人'), 
                                      className='email-sender'),
                            html.Span(ev.get('email_sent_at', ''), 
                                     className='email-date')
                        ], className='email-header'),
                        html.Div(ev.get('email_subject', '无主题'), className='email-subject'),
                        html.Div([
                            html.Span(f"类型: {ev['type']}", 
                                     style={'fontSize': '11px', 'color': '#666', 'marginRight': '12px'}),
                            html.Span(f"描述: {ev['description']}", 
                                     style={'fontSize': '11px', 'color': '#666'})
                        ]),
                        html.Details([
                            html.Summary('查看邮件正文', style={'cursor': 'pointer', 'color': '#1e3a5f'}),
                            html.Div(ev.get('email_body', '无正文内容'), 
                                    className='email-body',
                                    style={'marginTop': '12px', 'padding': '12px', 
                                          'background': '#f8f9fa', 'borderRadius': '4px'})
                        ], style={'marginTop': '8px'})
                    ], className='email-card')
                    for ev in detail['evidences'] if ev.get('email_subject')
                ] + (
                    [html.Div('暂无邮件证据', 
                            style={'padding': '40px', 'textAlign': 'center', 'color': '#666'})]
                    if not any(ev.get('email_subject') for ev in detail['evidences']) 
                    else []
                )
            )
            ])
        ], className='chart-card', style={'marginBottom': '24px'}),
        
        html.Div([
            html.Div([
                html.H3('📋 其他证据', className='chart-title'),
                html.Div(
                    [
                        html.Div([
                            html.Span('📄', style={'marginRight': '8px'}),
                            html.Strong(f"{ev['type'].upper()}: "),
                            ev['description']
                        ])
                        for ev in detail['evidences'] if not ev.get('email_subject')
                    ] + (
                        [html.Div('暂无其他证据', 
                                style={'padding': '20px', 'textAlign': 'center', 'color': '#666'})]
                        if not any(not ev.get('email_subject') for ev in detail['evidences']) 
                        else []
                    ),
                    style={
                    'padding': '16px',
                    'background': '#f8f9fa',
                    'borderRadius': '6px'
                })
            ], className='chart-card', style={'gridColumn': 'span 1'}),
            
            html.Div([
                html.H3('📝 备注任务', className='chart-title'),
                html.Div(
                    [
                        html.Div([
                            html.Div([
                                html.Strong(task['title']),
                                html.Span(task['status'], 
                                         className=f'status-badge {task["status"]}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '4px'}),
                            html.Div([
                                html.Span(f"👤 {task['assignee']}", 
                                         style={'fontSize': '12px', 'color': '#666', 'marginRight': '16px'}),
                                html.Span(f"📅 截止: {task['due_date']}", 
                                         style={'fontSize': '12px', 'color': '#666'}),
                            ], style={'marginBottom': '4px'}),
                            html.Div(task['description'], style={'fontSize': '12px', 'color': '#666'})
                        ], style={'padding': '12px', 'borderLeft': '3px solid #f77f00',
                                 'background': '#fff8e1', 'borderRadius': '4px',
                                 'marginBottom': '8px'})
                        for task in detail['note_tasks']
                    ] + (
                        [html.Div('暂无备注任务', 
                                style={'padding': '20px', 'textAlign': 'center', 'color': '#666'})]
                        if not detail['note_tasks'] 
                        else []
                    )
                )
            ], className='chart-card', style={'gridColumn': 'span 1'}),
            
            html.Div([
                html.H3('✅ 整改计划', className='chart-title'),
                html.Div([
                    (html.Div([
                        html.Div([
                            html.Strong(detail['rectification_plan']['title']),
                            html.Span(detail['rectification_plan']['status'], 
                                     className=f'status-badge {detail["rectification_plan"]["status"]}',
                                     style={'marginLeft': '8px'})
                        ], style={'marginBottom': '8px'}),
                        html.Div([
                            html.Strong('责任人：'), detail['rectification_plan']['owner']
                        ], style={'marginBottom': '4px', 'fontSize': '13px'}),
                        html.Div([
                            html.Strong('计划周期：'),
                            f"{detail['rectification_plan']['start_date']} ~ {detail['rectification_plan']['end_date']}"
                        ], style={'marginBottom': '4px', 'fontSize': '13px'}),
                        html.Div([
                            html.Strong('实际完成：'),
                            detail['rectification_plan'].get('actual_end_date', '未完成')
                        ], style={'marginBottom': '8px', 'fontSize': '13px'}),
                        html.Div([
                            html.Div(className='progress-bar', style={'height': '10px'}, children=[
                                html.Div(
                                    className='progress-fill',
                                    style={'width': f"{detail['rectification_plan']['progress']}%"}
                                )
                            ]),
                            html.Div(f"进度: {detail['rectification_plan']['progress']}%",
                                    style={'fontSize': '12px', 'marginTop': '4px', 'textAlign': 'right'})
                        ], style={'marginBottom': '12px'}),
                        html.Div(detail['rectification_plan']['description'], 
                                style={'fontSize': '12px', 'color': '#666', 'padding': '8px',
                                      'background': '#f8f9fa', 'borderRadius': '4px'})
                    ], style={'padding': '16px', 'background': '#e8f5e9', 'borderLeft': '3px solid #2d6a4f',
                             'borderRadius': '4px'}))
                    if detail['rectification_plan'] else 
                    html.Div('暂无整改计划', 
                            style={'padding': '20px', 'textAlign': 'center', 'color': '#666'})
                ])
            ], className='chart-card', style={'gridColumn': 'span 1'}),
        ], className='chart-row')
    ])
    
    return content, issue_id


@callback(
    Output('update-modal', 'is_open'),
    Input('open-update-modal', 'n_clicks'),
    Input('cancel-update-modal', 'n_clicks'),
    State('update-modal', 'is_open'),
    prevent_initial_call=True
)
def toggle_update_modal(open_click, cancel_click, is_open):
    return not is_open


@callback(
    Output('update-notification', 'is_open'),
    Output('update-notification', 'children'),
    Output('update-notification', 'color'),
    Input('confirm-update', 'n_clicks'),
    [State('current-issue-id', 'data'),
     State('update-status', 'value'),
     State('update-conclusion', 'value')],
    prevent_initial_call=True
)
def confirm_update(n_clicks, issue_id, status, conclusion):
    if not issue_id:
        return True, '❌ 请先选择问题', 'danger'
    
    result = update_issue_status(int(issue_id), status, conclusion)
    
    if result.get('success'):
        return True, '✅ 状态更新成功！', 'success'
    else:
        return True, f'❌ 更新失败: {result.get("message")}', 'danger'


layout = layout
