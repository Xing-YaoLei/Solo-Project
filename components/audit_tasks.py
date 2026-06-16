import dash
from dash import dcc, html, dash_table, Input, Output, State, callback
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime

from data.data_processor import data_processor
from utils.style_config import *
from utils.helpers import *


def get_audit_tasks_layout():
    start_date, end_date = get_date_range(30)

    return html.Div([
        html.Div([
            html.H3('处方不清任务管理', style={'margin': 0, 'fontWeight': '600'}),
            html.P('处方不清自动生成任务，复盘时展示处理结论，重点追踪回访完成',
                   style={'margin': '5px 0 0 0', 'color': COLORS['text_light']})
        ], style=HEADER_STYLE),

        html.Div([
            dcc.DatePickerRange(
                id='task-date-range',
                start_date=start_date,
                end_date=end_date,
                display_format='YYYY-MM-DD',
                style={'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='task-store-filter',
                options=[{'label': '全部门店', 'value': 'all'}] +
                        [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                         for _, row in data_processor.loader.get_stores().iterrows()],
                value='all',
                placeholder='选择门店',
                style={'width': '200px', 'display': 'inline-block', 'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='task-status-filter',
                options=[
                    {'label': '全部状态', 'value': 'all'},
                    {'label': '待处理', 'value': '待处理'},
                    {'label': '处理中', 'value': '处理中'},
                    {'label': '已完成', 'value': '已完成'},
                ],
                value='all',
                placeholder='任务状态',
                style={'width': '150px', 'display': 'inline-block'}
            ),
            html.Button('导出报告', id='export-report-btn', n_clicks=0,
                        style={'padding': '8px 20px', 'backgroundColor': COLORS['success'],
                               'color': 'white', 'border': 'none', 'borderRadius': '4px',
                               'cursor': 'pointer', 'marginLeft': '10px'})
        ], style={'marginBottom': '20px', 'display': 'flex', 'alignItems': 'center'}),

        html.Div(id='task-metric-cards',
                 style={'display': 'grid', 'gridTemplateColumns': 'repeat(4, 1fr)', 'gap': '15px', 'marginBottom': '20px'}),

        html.Div([
            html.Div([
                html.H5('任务状态分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='task-status-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('任务原因分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='task-reason-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.H5('处方照片提供率排行', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div([
                dcc.RadioItems(
                    id='photo-mode-toggle',
                    options=[
                        {'label': '绝对值', 'value': 'absolute'},
                        {'label': '占比', 'value': 'percentage'}
                    ],
                    value='absolute',
                    style={'display': 'flex', 'gap': '20px', 'marginBottom': '15px'}
                ),
                dcc.Graph(id='photo-ranking-chart', style={'height': '400px'})
            ])
        ], style=CARD_STYLE),

        html.Div([
            html.H5('任务明细及处理结论', style={'marginBottom': '15px', 'fontWeight': '600'}),
            html.Div('点击任务可查看详情及处理结论，复盘时重点关注回访状态',
                     style={'marginBottom': '10px', 'color': COLORS['text_light'], 'fontSize': '13px'}),
            dash_table.DataTable(
                id='task-detail-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{任务状态} = "待处理"'}, 'backgroundColor': '#FFEBEE'},
                    {'if': {'filter_query': '{回访状态} = "待回访"'}, 'backgroundColor': '#FFF3E0'},
                    {'if': {'filter_query': '{回访状态} = "已完成"'}, 'backgroundColor': '#E8F5E9'},
                ],
                page_size=15,
                row_selectable='single',
                active_cell={'row': 0, 'column': 0},
            )
        ], style=CARD_STYLE),

        html.Div(id='task-conclusion-detail', style={'marginTop': '20px'}),
    ])


@callback(
    Output('task-metric-cards', 'children'),
    Output('task-status-chart', 'figure'),
    Output('task-reason-chart', 'figure'),
    Output('task-detail-table', 'data'),
    Output('task-detail-table', 'columns'),
    Input('task-date-range', 'start_date'),
    Input('task-date-range', 'end_date'),
    Input('task-store-filter', 'value'),
    Input('task-status-filter', 'value')
)
def update_audit_tasks(start_date, end_date, store_id, task_status):
    store_filter = None if store_id == 'all' else store_id
    status_filter = None if task_status == 'all' else task_status

    task_data = data_processor.get_task_with_conclusions(start_date, end_date, store_filter, status_filter)
    metrics = data_processor.get_overview_metrics(start_date, end_date, store_filter)

    metric_cards = [
        html.Div([
            html.Div('待处理任务', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['pending_tasks']:,}", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['danger']}),
            html.Div([
                html.Span('需回访: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['followup_needed']} 个", style={'fontSize': '12px', 'color': COLORS['warning'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["danger"]}'}),

        html.Div([
            html.Div('处理中任务', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{len(task_data[task_data['task_status'] == '处理中']) if not task_data.empty else 0:,}",
                     style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['warning']}),
            html.Div([
                html.Span('平均处理时长: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{task_data['processing_time_hours'].mean().round(1) if not task_data.empty else 0} 小时",
                          style={'fontSize': '12px', 'color': COLORS['primary'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["warning"]}'}),

        html.Div([
            html.Div('已完成任务', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{len(task_data[task_data['task_status'] == '已完成']) if not task_data.empty else 0:,}",
                     style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['success']}),
            html.Div([
                html.Span('完成率: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['task_completion_rate']}%", style={'fontSize': '12px', 'color': COLORS['success'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["success"]}'}),

        html.Div([
            html.Div('回访完成', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['followup_completed']:,}",
                     style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['info']}),
            html.Div([
                html.Span('回访完成率: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['followup_rate']}%", style={'fontSize': '12px', 'color': COLORS['info'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["info"]}'}),
    ]

    status_fig = go.Figure()
    reason_fig = go.Figure()
    table_data = []
    table_columns = []

    if not task_data.empty:
        status_summary = task_data.groupby(['task_status', 'followup_status']).size().reset_index(name='count')

        status_fig = px.bar(
            status_summary,
            x='task_status',
            y='count',
            color='followup_status',
            color_discrete_map=FOLLOWUP_STATUS_COLORS,
            title='任务及回访状态分布'
        )
        status_fig.update_layout(
            barmode='stack',
            xaxis_title='任务状态',
            yaxis_title='任务数量',
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

        reason_summary = task_data.groupby('task_reason').size().reset_index(name='count')
        reason_summary = reason_summary.sort_values('count', ascending=False)

        reason_fig = px.bar(
            reason_summary,
            x='count',
            y='task_reason',
            orientation='h',
            color='count',
            color_continuous_scale='Reds',
            title='处方不清原因分布'
        )
        reason_fig.update_layout(
            xaxis_title='任务数量',
            yaxis_title='',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

        display_cols = ['task_no', 'prescription_no', 'store_name', 'name', 'phone',
                        'task_reason', 'task_status', 'followup_status',
                        'assigned_to', 'handling_conclusion', 'created_at']
        display_data = task_data[display_cols].copy()
        display_data.columns = ['任务编号', '处方编号', '门店', '会员姓名', '联系电话',
                                '不清原因', '任务状态', '回访状态', '处理人',
                                '处理结论', '创建时间']
        display_data['创建时间'] = display_data['创建时间'].apply(format_datetime)
        display_data['处理结论'] = display_data['处理结论'].fillna('-')
        display_data = display_data.sort_values('创建时间', ascending=False)

        table_data = safe_df_to_records(display_data)
        table_columns = [
            {'name': col, 'id': col, 'selectable': True}
            for col in display_data.columns
        ]

    return metric_cards, status_fig, reason_fig, table_data, table_columns


@callback(
    Output('photo-ranking-chart', 'figure'),
    Input('photo-mode-toggle', 'value'),
    State('task-store-filter', 'value')
)
def update_photo_ranking(mode, store_id):
    store_filter = None if store_id == 'all' else store_id
    photo_data = data_processor.get_prescription_photo_stats(store_id=store_filter, mode=mode)

    fig = go.Figure()
    if not photo_data.empty:
        if mode == 'absolute':
            fig = go.Figure()
            fig.add_trace(go.Bar(
                y=photo_data['store_name'],
                x=photo_data['with_photo'],
                name='有照片',
                orientation='h',
                marker_color=COLORS['success']
            ))
            fig.add_trace(go.Bar(
                y=photo_data['store_name'],
                x=photo_data['no_photo'],
                name='无照片',
                orientation='h',
                marker_color=COLORS['danger']
            ))
            fig.update_layout(
                barmode='stack',
                xaxis_title='处方数量',
                yaxis_title='',
                title='各门店处方照片提供情况（绝对值）',
                legend=dict(orientation='h', y=1.1),
                margin=dict(l=0, r=0, t=30, b=0),
                plot_bgcolor='white'
            )
        else:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                y=photo_data['store_name'],
                x=photo_data['with_photo'],
                name='有照片占比',
                orientation='h',
                marker_color=COLORS['success'],
                text=photo_data['with_photo'].apply(lambda x: f'{x:.1f}%'),
                textposition='inside'
            ))
            fig.add_trace(go.Bar(
                y=photo_data['store_name'],
                x=photo_data['no_photo'],
                name='无照片占比',
                orientation='h',
                marker_color=COLORS['danger'],
                text=photo_data['no_photo'].apply(lambda x: f'{x:.1f}%'),
                textposition='inside'
            ))
            fig.update_layout(
                barmode='stack',
                xaxis_title='占比(%)',
                xaxis_range=[0, 100],
                yaxis_title='',
                title='各门店处方照片提供率（占比）',
                legend=dict(orientation='h', y=1.1),
                margin=dict(l=0, r=0, t=30, b=0),
                plot_bgcolor='white'
            )

    return fig


@callback(
    Output('task-conclusion-detail', 'children'),
    Input('task-detail-table', 'active_cell'),
    State('task-detail-table', 'data')
)
def show_task_conclusion(active_cell, table_data):
    if not active_cell or not table_data:
        return html.Div()

    row_data = table_data[active_cell['row']]
    task_no = row_data['任务编号']
    prescription_no = row_data['处方编号']

    tasks = data_processor.get_task_with_conclusions()
    task = tasks[tasks['task_no'] == task_no]

    if task.empty:
        return html.Div()

    task_info = task.iloc[0]

    return html.Div([
        html.H5(f'任务详情 - {task_no}', style={'marginBottom': '15px', 'fontWeight': '600'}),

        html.Div([
            html.Div([
                html.Div([
                    html.Label('任务编号:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(task_info.get('task_no', '-'))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('处方编号:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(task_info.get('prescription_no', '-'))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('会员姓名:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(f"{task_info.get('name', '-')} ({task_info.get('phone', '-')})")
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('不清原因:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(task_info.get('task_reason', '-'))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('任务状态:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Span(task_info.get('task_status', '-'),
                              style={'padding': '4px 12px', 'borderRadius': '12px',
                                     'backgroundColor': TASK_STATUS_COLORS.get(task_info.get('task_status'), COLORS['gray']) + '20',
                                     'color': TASK_STATUS_COLORS.get(task_info.get('task_status'), COLORS['gray']),
                                     'fontWeight': '500'})
                ], style={'marginBottom': '10px'}),
            ], style={'flex': 1, 'marginRight': '30px'}),

            html.Div([
                html.Div([
                    html.Label('回访状态:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Span(task_info.get('followup_status', '-'),
                              style={'padding': '4px 12px', 'borderRadius': '12px',
                                     'backgroundColor': FOLLOWUP_STATUS_COLORS.get(task_info.get('followup_status'), COLORS['gray']) + '20',
                                     'color': FOLLOWUP_STATUS_COLORS.get(task_info.get('followup_status'), COLORS['gray']),
                                     'fontWeight': '500'})
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('处理人:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(task_info.get('assigned_to', '-'))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('创建时间:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(format_datetime(task_info.get('created_at')))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('完成时间:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(format_datetime(task_info.get('completed_time')))
                ], style={'marginBottom': '10px'}),
                html.Div([
                    html.Label('处理时长:', style={'fontWeight': '500', 'color': COLORS['text_light']}),
                    html.Div(f"{task_info.get('processing_time_hours', '-')} 小时")
                ], style={'marginBottom': '10px'}),
            ], style={'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px', 'padding': '15px',
                  'backgroundColor': COLORS['light'], 'borderRadius': '8px'}),

        html.Div([
            html.Div([
                html.H6('处理结论', style={'marginBottom': '10px', 'fontWeight': '600'}),
                html.Div(task_info.get('handling_conclusion', '暂无处理结论'),
                         style={'padding': '15px', 'backgroundColor': '#F5F9FF',
                                'borderRadius': '8px', 'borderLeft': f'4px solid {COLORS["primary"]}',
                                'minHeight': '60px'})
            ], style={'marginBottom': '15px'}),

            html.Div([
                html.H6('复盘结论', style={'marginBottom': '10px', 'fontWeight': '600'}),
                html.Div(task_info.get('review_conclusion', '暂无复盘结论'),
                         style={'padding': '15px', 'backgroundColor': '#F5FFF5',
                                'borderRadius': '8px', 'borderLeft': f'4px solid {COLORS["success"]}',
                                'minHeight': '60px'})
            ], style={'marginBottom': '15px'}),

            html.Div([
                html.H6('回访结果', style={'marginBottom': '10px', 'fontWeight': '600'}),
                html.Div(task_info.get('followup_result', '暂无回访结果'),
                         style={'padding': '15px', 'backgroundColor': '#FFFDF5',
                                'borderRadius': '8px', 'borderLeft': f'4px solid {COLORS["warning"]}',
                                'minHeight': '60px'})
            ]),
        ])
    ], style=CARD_STYLE)
