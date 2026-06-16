import dash
from dash import dcc, html, dash_table, Input, Output, State, callback
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime

from data.data_processor import data_processor
from utils.style_config import *
from utils.helpers import *


def get_followup_layout():
    start_date, end_date = get_date_range(90)

    return html.Div([
        html.Div([
            html.H3('回访完成率追踪', style={'margin': 0, 'fontWeight': '600'}),
            html.P('重点监控回访完成情况，确保处方不清问题闭环处理',
                   style={'margin': '5px 0 0 0', 'color': COLORS['text_light']})
        ], style=HEADER_STYLE),

        html.Div([
            dcc.DatePickerRange(
                id='followup-date-range',
                start_date=start_date,
                end_date=end_date,
                display_format='YYYY-MM-DD',
                style={'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='followup-store-filter',
                options=[{'label': '全部门店', 'value': 'all'}] +
                        [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                         for _, row in data_processor.loader.get_stores().iterrows()],
                value='all',
                placeholder='选择门店',
                style={'width': '200px', 'display': 'inline-block'}
            ),
        ], style={'marginBottom': '20px', 'display': 'flex', 'alignItems': 'center'}),

        html.Div(id='followup-metric-cards',
                 style={'display': 'grid', 'gridTemplateColumns': 'repeat(5, 1fr)', 'gap': '15px', 'marginBottom': '20px'}),

        html.Div([
            html.Div([
                html.H5('回访完成趋势', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Dropdown(
                    id='followup-trend-type',
                    options=[
                        {'label': '按日', 'value': 'D'},
                        {'label': '按周', 'value': 'W'},
                        {'label': '按月', 'value': 'M'}
                    ],
                    value='D',
                    style={'width': '120px', 'marginBottom': '10px'}
                ),
                dcc.Graph(id='followup-trend-chart', style={'height': '400px'})
            ], style={**CARD_STYLE, 'flex': 1.5, 'marginRight': '15px'}),

            html.Div([
                html.H5('门店回访完成率排名', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='followup-store-ranking-chart', style={'height': '400px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.Div([
                html.H5('回访渠道分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='followup-channel-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('联系结果分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='followup-contact-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('客服人员绩效', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='followup-operator-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.H5('待回访任务清单', style={'marginBottom': '15px', 'fontWeight': '600'}),
            dash_table.DataTable(
                id='pending-followup-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{回访类型} = "处方不清回访"'},
                     'backgroundColor': '#FFF3E0', 'color': COLORS['warning']},
                ],
                page_size=10,
            )
        ], style=CARD_STYLE),

        html.Div([
            html.H5('回访记录明细', style={'marginBottom': '15px', 'fontWeight': '600'}),
            dash_table.DataTable(
                id='followup-detail-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {'if': {'filter_query': '{回访状态} = "已完成"'},
                     'backgroundColor': '#E8F5E9'},
                    {'if': {'filter_query': '{回访状态} != "已完成"'},
                     'backgroundColor': '#FFF3E0'},
                ],
                page_size=15,
            )
        ], style=CARD_STYLE),
    ])


@callback(
    Output('followup-metric-cards', 'children'),
    Output('followup-trend-chart', 'figure'),
    Output('followup-store-ranking-chart', 'figure'),
    Output('followup-channel-chart', 'figure'),
    Output('followup-contact-chart', 'figure'),
    Output('followup-operator-chart', 'figure'),
    Output('pending-followup-table', 'data'),
    Output('pending-followup-table', 'columns'),
    Output('followup-detail-table', 'data'),
    Output('followup-detail-table', 'columns'),
    Input('followup-date-range', 'start_date'),
    Input('followup-date-range', 'end_date'),
    Input('followup-store-filter', 'value'),
    Input('followup-trend-type', 'value')
)
def update_followup_tracking(start_date, end_date, store_id, trend_freq):
    store_filter = None if store_id == 'all' else store_id

    metrics = data_processor.get_overview_metrics(start_date, end_date, store_filter)
    followup_data = data_processor.loader.get_followup_records(store_filter)
    daily_perf = data_processor.get_followup_performance(start_date, end_date, store_filter)
    operator_perf = data_processor.get_followup_by_operator(start_date, end_date, store_filter)
    tasks = data_processor.get_task_with_conclusions(start_date, end_date, store_filter)
    stores = data_processor.loader.get_stores()

    if not followup_data.empty:
        followup_data['followup_date'] = pd.to_datetime(followup_data['followup_time']).dt.date
        if start_date:
            followup_data = followup_data[followup_data['followup_date'] >= pd.to_datetime(start_date).date()]
        if end_date:
            followup_data = followup_data[followup_data['followup_date'] <= pd.to_datetime(end_date).date()]

    total_followups = len(followup_data) if not followup_data.empty else 0
    completed = len(followup_data[followup_data['followup_status'] == '已完成']) if not followup_data.empty else 0
    pending = len(followup_data[followup_data['followup_status'] != '已完成']) if not followup_data.empty else 0
    contact_success = len(followup_data[followup_data['contact_result'] == '成功联系']) if not followup_data.empty else 0
    contact_rate = (contact_success / total_followups * 100) if total_followups > 0 else 0

    metric_cards = [
        html.Div([
            html.Div('需回访总数', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['followup_needed']:,}", style={'fontSize': '28px', 'fontWeight': 'bold', 'color': COLORS['primary']}),
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["primary"]}'}),

        html.Div([
            html.Div('已完成回访', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['followup_completed']:,}", style={'fontSize': '28px', 'fontWeight': 'bold', 'color': COLORS['success']}),
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["success"]}'}),

        html.Div([
            html.Div('回访完成率', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['followup_rate']}%", style={'fontSize': '28px', 'fontWeight': 'bold', 'color': COLORS['info']}),
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["info"]}'}),

        html.Div([
            html.Div('联系成功率', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{contact_rate:.1f}%", style={'fontSize': '28px', 'fontWeight': 'bold', 'color': COLORS['secondary']}),
            html.Div([
                html.Span('成功/总数: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{contact_success}/{total_followups}", style={'fontSize': '12px', 'color': COLORS['secondary'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["secondary"]}'}),

        html.Div([
            html.Div('待处理回访', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{pending:,}", style={'fontSize': '28px', 'fontWeight': 'bold', 'color': COLORS['danger']}),
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["danger"]}'}),
    ]

    trend_fig = go.Figure()
    if not daily_perf.empty:
        daily_perf['date'] = pd.to_datetime(daily_perf['date'])
        if trend_freq != 'D':
            daily_perf['date'] = daily_perf['date'].dt.to_period(trend_freq).dt.to_timestamp()
            daily_perf = daily_perf.groupby('date').agg({
                'total_followups': 'sum',
                'completed': 'sum',
                'contacted': 'sum'
            }).reset_index()
            daily_perf['completion_rate'] = (daily_perf['completed'] / daily_perf['total_followups'] * 100).round(2)

        trend_fig = go.Figure()
        trend_fig.add_trace(go.Bar(
            x=daily_perf['date'],
            y=daily_perf['total_followups'],
            name='回访总数',
            marker_color=COLORS['primary'],
            opacity=0.7
        ))
        trend_fig.add_trace(go.Bar(
            x=daily_perf['date'],
            y=daily_perf['completed'],
            name='已完成',
            marker_color=COLORS['success'],
            opacity=0.7
        ))
        trend_fig.add_trace(go.Scatter(
            x=daily_perf['date'],
            y=daily_perf['completion_rate'],
            name='完成率(%)',
            yaxis='y2',
            mode='lines+markers',
            line=dict(color=COLORS['danger'], width=2),
            marker=dict(size=6)
        ))
        trend_fig.update_layout(
            barmode='group',
            yaxis2=dict(title='完成率(%)', overlaying='y', side='right', range=[0, 100]),
            yaxis=dict(title='回访数量'),
            legend=dict(orientation='h', y=1.1),
            hovermode='x unified',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    store_ranking_fig = go.Figure()
    if not tasks.empty and not stores.empty:
        store_followup = tasks.groupby('store_id').agg({
            'followup_needed': 'sum',
            'followup_status': lambda x: (x == '已完成').sum()
        }).reset_index()
        store_followup.columns = ['store_id', 'total', 'completed']
        store_followup = store_followup.merge(stores[['store_id', 'store_name']], on='store_id', how='left')
        store_followup['completion_rate'] = (store_followup['completed'] / store_followup['total'] * 100).round(2)
        store_followup = store_followup.sort_values('completion_rate', ascending=True)

        store_ranking_fig = go.Figure()
        store_ranking_fig.add_trace(go.Bar(
            y=store_followup['store_name'],
            x=store_followup['completion_rate'],
            orientation='h',
            text=store_followup['completion_rate'].apply(lambda x: f'{x:.1f}%'),
            textposition='auto',
            marker=dict(
                color=store_followup['completion_rate'],
                colorscale='RdYlGn',
                cmin=0,
                cmax=100
            )
        ))
        store_ranking_fig.update_layout(
            xaxis_title='回访完成率(%)',
            xaxis_range=[0, 100],
            yaxis_title='',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    channel_fig = go.Figure()
    if not followup_data.empty:
        channel_dist = followup_data.groupby(['followup_channel', 'followup_status']).size().reset_index(name='count')
        channel_fig = px.bar(
            channel_dist,
            x='followup_channel',
            y='count',
            color='followup_status',
            color_discrete_map=FOLLOWUP_STATUS_COLORS,
            title='回访渠道分布'
        )
        channel_fig.update_layout(
            barmode='stack',
            xaxis_title='',
            yaxis_title='数量',
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    contact_fig = go.Figure()
    if not followup_data.empty:
        contact_dist = followup_data.groupby('contact_result').size().reset_index(name='count')
        contact_fig = px.pie(
            contact_dist,
            values='count',
            names='contact_result',
            color_discrete_sequence=CHART_COLORS,
            title='联系结果分布',
            hole=0.4
        )
        contact_fig.update_traces(textinfo='percent+label', textposition='outside')
        contact_fig.update_layout(showlegend=False, margin=dict(l=0, r=0, t=30, b=0))

    operator_fig = go.Figure()
    if not operator_perf.empty:
        operator_perf = operator_perf.sort_values('completion_rate', ascending=True)
        operator_fig = go.Figure()
        operator_fig.add_trace(go.Bar(
            y=operator_perf['operator'],
            x=operator_perf['completion_rate'],
            orientation='h',
            text=operator_perf['completion_rate'].apply(lambda x: f'{x:.1f}%'),
            textposition='auto',
            marker_color=COLORS['primary']
        ))
        operator_fig.update_layout(
            xaxis_title='完成率(%)',
            xaxis_range=[0, 100],
            yaxis_title='',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    pending_table_data = []
    pending_table_columns = []
    detail_table_data = []
    detail_table_columns = []

    if not tasks.empty:
        pending_tasks = tasks[
            (tasks['followup_needed'] == True) &
            (tasks['followup_status'] != '已完成') &
            (tasks['followup_status'] != '无需回访')
        ]
        if not pending_tasks.empty and not stores.empty:
            pending_cols = ['task_no', 'prescription_no', 'store_name', 'task_reason',
                            'assigned_to', 'created_at', 'followup_status']
            pending_col_mapping = {
                'task_no': '任务编号', 'prescription_no': '处方编号', 'store_name': '门店',
                'task_reason': '不清原因', 'assigned_to': '处理人', 'created_at': '创建时间',
                'followup_status': '回访状态'
            }
            available_pending_cols = [col for col in pending_cols if col in pending_tasks.columns]
            pending_display = pd.DataFrame()
            if len(available_pending_cols) >= 5:
                pending_display = pending_tasks[available_pending_cols].copy()
                if 'created_at' in pending_display.columns:
                    pending_display['created_at'] = pending_display['created_at'].apply(format_datetime)
                if 'created_at' in pending_display.columns:
                    pending_display = pending_display.sort_values('created_at')
                pending_display = pending_display.rename(columns=pending_col_mapping)
            if not pending_display.empty:
                pending_table_data = safe_df_to_records(pending_display)
                pending_table_columns = [
                    {'name': col, 'id': col, 'selectable': True}
                    for col in pending_display.columns
                ]

    if not followup_data.empty:
        members = data_processor.loader.get_members()
        if not members.empty:
            followup_data = followup_data.merge(
                members[['member_id', 'name', 'phone']],
                on='member_id', how='left'
            )
        if not stores.empty:
            followup_data = followup_data.merge(
                stores[['store_id', 'store_name']],
                on='store_id', how='left'
            )

        detail_cols = ['followup_time', 'store_name', 'name', 'phone',
                       'followup_type', 'followup_channel', 'contact_result',
                       'followup_content', 'member_feedback', 'followup_status', 'followup_operator']
        if all(col in followup_data.columns for col in detail_cols):
            detail_display = followup_data[detail_cols].copy()
            detail_display.columns = ['回访时间', '门店', '会员姓名', '联系电话',
                                      '回访类型', '回访渠道', '联系结果',
                                      '回访内容', '会员反馈', '回访状态', '回访人']
            detail_display['回访时间'] = detail_display['回访时间'].apply(format_datetime)
            detail_display['会员反馈'] = detail_display['会员反馈'].fillna('-')
            detail_display = detail_display.sort_values('回访时间', ascending=False)
            detail_table_data = safe_df_to_records(detail_display)
            detail_table_columns = [
                {'name': col, 'id': col, 'selectable': True}
                for col in detail_display.columns
            ]

    return (metric_cards, trend_fig, store_ranking_fig, channel_fig,
            contact_fig, operator_fig, pending_table_data, pending_table_columns,
            detail_table_data, detail_table_columns)
