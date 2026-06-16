import dash
from dash import dcc, html, dash_table, Input, Output, State, callback
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime, timedelta

from data.data_processor import data_processor
from utils.style_config import *
from utils.helpers import *


def get_overview_layout():
    start_date, end_date = get_date_range(30)

    return html.Div([
        html.Div([
            html.H3('处方审核风险监测总览', style={'margin': 0, 'fontWeight': '600'}),
            html.P(f'数据范围: {format_date(start_date)} 至 {format_date(end_date)}',
                   style={'margin': '5px 0 0 0', 'color': COLORS['text_light']})
        ], style=HEADER_STYLE),

        html.Div([
            dcc.DatePickerRange(
                id='overview-date-range',
                start_date=start_date,
                end_date=end_date,
                display_format='YYYY-MM-DD',
                style={'marginRight': '20px'}
            ),
            dcc.Dropdown(
                id='overview-store-filter',
                options=[{'label': '全部门店', 'value': 'all'}] +
                        [{'label': f"{row['store_code']} - {row['store_name']}", 'value': row['store_id']}
                         for _, row in data_processor.loader.get_stores().iterrows()],
                value='all',
                placeholder='选择门店',
                style={'width': '200px', 'display': 'inline-block', 'marginRight': '20px'}
            ),
            html.Button('刷新数据', id='overview-refresh-btn', n_clicks=0,
                        style={'padding': '8px 20px', 'backgroundColor': COLORS['primary'],
                               'color': 'white', 'border': 'none', 'borderRadius': '4px', 'cursor': 'pointer'})
        ], style={'marginBottom': '20px', 'display': 'flex', 'alignItems': 'center'}),

        html.Div(id='overview-metric-cards', style={'display': 'grid', 'gridTemplateColumns': 'repeat(4, 1fr)', 'gap': '15px', 'marginBottom': '20px'}),

        html.Div([
            html.Div([
                html.H5('处方审核趋势', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Dropdown(
                    id='trend-freq',
                    options=[
                        {'label': '按日', 'value': 'D'},
                        {'label': '按周', 'value': 'W'},
                        {'label': '按月', 'value': 'M'}
                    ],
                    value='D',
                    style={'width': '120px', 'marginBottom': '10px'}
                ),
                dcc.Graph(id='prescription-trend-chart', style={'height': '400px'})
            ], style=CARD_STYLE),
        ], style={'marginBottom': '20px'}),

        html.Div([
            html.Div([
                html.H5('处方不清原因分布', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='unclear-reason-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1, 'marginRight': '15px'}),

            html.Div([
                html.H5('门店处方审核对比', style={'marginBottom': '15px', 'fontWeight': '600'}),
                dcc.Graph(id='store-compare-chart', style={'height': '350px'})
            ], style={**CARD_STYLE, 'flex': 1}),
        ], style={'display': 'flex', 'marginBottom': '20px'}),

        html.Div([
            html.H5('处方药品排行 TOP 10', style={'marginBottom': '15px', 'fontWeight': '600'}),
            dcc.Graph(id='drug-ranking-chart', style={'height': '400px'})
        ], style=CARD_STYLE),

        html.Div([
            html.H5('门店审核指标详情', style={'marginBottom': '15px', 'fontWeight': '600'}),
            dash_table.DataTable(
                id='store-detail-table',
                style_table=TABLE_STYLE,
                style_header={'backgroundColor': COLORS['light'], 'fontWeight': 'bold'},
                style_cell={'padding': '10px', 'textAlign': 'left'},
                style_data_conditional=[
                    {
                        'if': {'filter_query': '{unclear_rate} > 15'},
                        'backgroundColor': '#FFEBEE',
                        'color': COLORS['danger']
                    }
                ],
                page_size=10,
                row_selectable='single',
            )
        ], style=CARD_STYLE),
    ])


@callback(
    Output('overview-metric-cards', 'children'),
    Output('prescription-trend-chart', 'figure'),
    Output('unclear-reason-chart', 'figure'),
    Output('store-compare-chart', 'figure'),
    Output('drug-ranking-chart', 'figure'),
    Output('store-detail-table', 'data'),
    Output('store-detail-table', 'columns'),
    Input('overview-refresh-btn', 'n_clicks'),
    Input('trend-freq', 'value'),
    State('overview-date-range', 'start_date'),
    State('overview-date-range', 'end_date'),
    State('overview-store-filter', 'value')
)
def update_overview(n_clicks, freq, start_date, end_date, store_id):
    store_filter = None if store_id == 'all' else store_id

    metrics = data_processor.get_overview_metrics(start_date, end_date, store_filter)
    trend_data = data_processor.get_prescription_trend(start_date, end_date, store_filter, freq)
    unclear_dist = data_processor.get_unclear_reason_distribution(start_date, end_date, store_filter)
    store_data = data_processor.get_prescription_by_store(start_date, end_date)
    drug_ranking = data_processor.get_drug_ranking(start_date, end_date, store_filter, 10)

    metric_cards = [
        html.Div([
            html.Div('处方总数', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['total_prescriptions']:,}", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['primary']}),
            html.Div([
                html.Span('处方不清: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['unclear_prescriptions']:,} ({metrics['unclear_rate']}%)", style={'fontSize': '12px', 'color': COLORS['danger'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style=METRIC_CARD_STYLE),

        html.Div([
            html.Div('审核通过率', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['pass_rate']}%", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['success']}),
            html.Div([
                html.Span('审核任务: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['total_tasks']:,} 个", style={'fontSize': '12px', 'color': COLORS['primary'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["success"]}'}),

        html.Div([
            html.Div('待处理任务', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['pending_tasks']:,}", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['warning']}),
            html.Div([
                html.Span('完成率: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['task_completion_rate']}%", style={'fontSize': '12px', 'color': COLORS['success'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["warning"]}'}),

        html.Div([
            html.Div('回访完成率', style={'fontSize': '14px', 'color': COLORS['text_light'], 'marginBottom': '8px'}),
            html.Div(f"{metrics['followup_rate']}%", style={'fontSize': '32px', 'fontWeight': 'bold', 'color': COLORS['info']}),
            html.Div([
                html.Span('已完成/需回访: ', style={'fontSize': '12px', 'color': COLORS['text_light']}),
                html.Span(f"{metrics['followup_completed']}/{metrics['followup_needed']}", style={'fontSize': '12px', 'color': COLORS['info'], 'fontWeight': '500'})
            ], style={'marginTop': '8px'})
        ], style={**METRIC_CARD_STYLE, 'borderLeft': f'4px solid {COLORS["info"]}'}),
    ]

    trend_fig = go.Figure()
    if not trend_data.empty:
        trend_fig.add_trace(go.Bar(
            x=trend_data['date'],
            y=trend_data['total'],
            name='处方总数',
            marker_color=COLORS['primary'],
            opacity=0.7
        ))
        if '已通过' in trend_data.columns:
            trend_fig.add_trace(go.Bar(
                x=trend_data['date'],
                y=trend_data['已通过'],
                name='审核通过',
                marker_color=COLORS['success'],
                opacity=0.7
            ))
        trend_fig.add_trace(go.Scatter(
            x=trend_data['date'],
            y=trend_data['unclear_rate'],
            name='不清率(%)',
            yaxis='y2',
            mode='lines+markers',
            line=dict(color=COLORS['danger'], width=2),
            marker=dict(color=COLORS['danger'], size=6)
        ))
        trend_fig.update_layout(
            barmode='group',
            yaxis2=dict(title='不清率(%)', overlaying='y', side='right', range=[0, 100]),
            yaxis=dict(title='处方数量'),
            legend=dict(orientation='h', y=1.1),
            hovermode='x unified',
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    reason_fig = go.Figure()
    if not unclear_dist.empty:
        reason_fig = px.pie(
            unclear_dist,
            values='count',
            names='reason',
            title='',
            color_discrete_sequence=CHART_COLORS,
            hole=0.4
        )
        reason_fig.update_traces(
            textinfo='percent+label',
            textposition='outside',
            pull=[0.1 if i == 0 else 0 for i in range(len(unclear_dist))]
        )
        reason_fig.update_layout(showlegend=False, margin=dict(l=0, r=0, t=0, b=0))

    store_fig = go.Figure()
    if not store_data.empty:
        store_fig.add_trace(go.Bar(
            x=store_data['store_name'],
            y=store_data['total'],
            name='处方总数',
            marker_color=COLORS['primary']
        ))
        store_fig.add_trace(go.Scatter(
            x=store_data['store_name'],
            y=store_data['unclear_rate'],
            name='不清率(%)',
            yaxis='y2',
            mode='lines+markers',
            line=dict(color=COLORS['danger'], width=2),
            marker=dict(size=8)
        ))
        store_fig.update_layout(
            yaxis2=dict(title='不清率(%)', overlaying='y', side='right', range=[0, 100]),
            yaxis=dict(title='处方数量'),
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    drug_fig = go.Figure()
    if not drug_ranking.empty:
        drug_fig = px.bar(
            drug_ranking.sort_values('prescription_count', ascending=True),
            y='drug_name',
            x='prescription_count',
            orientation='h',
            color='category',
            color_discrete_sequence=CHART_COLORS,
            text='prescription_count',
            hover_data=['total_quantity', 'total_amount']
        )
        drug_fig.update_traces(textposition='outside')
        drug_fig.update_layout(
            xaxis_title='处方数量',
            yaxis_title='',
            legend=dict(orientation='h', y=1.1),
            margin=dict(l=0, r=0, t=30, b=0),
            plot_bgcolor='white'
        )

    table_data = []
    table_columns = []
    if not store_data.empty:
        display_cols = ['store_code', 'store_name', 'total', 'unclear', 'unclear_rate', 'passed', 'pass_rate']
        display_data = store_data[display_cols].copy()
        display_data.columns = ['门店编码', '门店名称', '处方总数', '不清处方数', '不清率(%)', '通过数', '通过率(%)']
        table_data = safe_df_to_records(display_data)
        table_columns = generate_table_columns(display_data)

    return metric_cards, trend_fig, reason_fig, store_fig, drug_fig, table_data, table_columns
