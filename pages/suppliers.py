import dash
from dash import dcc, html, Input, Output, State, callback, ctx, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from datetime import datetime

from utils.data_service import get_supplier_ranking, get_supplier_risk_distribution
from app.config import Config

dash.register_page(__name__, path='/suppliers')

RISK_COLORS = Config.RISK_COLORS


def create_ranking_chart(data, mode):
    names = [d['supplier_name'] for d in data]
    if mode == 'percentage':
        values = [d['percentage'] for d in data]
        text_format = [f'{v:.1f}%' for v in values]
        x_title = '占比 (%)'
    else:
        values = [d['total_amount'] for d in data]
        text_format = [f'¥{v:,.0f}' for v in values]
        x_title = '交易金额 (元)'
    
    risk_colors = []
    for d in data:
        risk_colors.append(RISK_COLORS.get(d['risk_level'], '#6c757d'))
    
    fig = go.Figure(data=[go.Bar(
        y=names,
        x=values,
        orientation='h',
        marker=dict(
            color=risk_colors,
            line=dict(color='white', width=1)
        ),
        text=text_format,
        textposition='auto',
        hovertemplate='<b>%{y}</b><br>' +
                     f'{x_title}: ' + '%{text}<br>' +
                     '风险等级: %{customdata[0]}<br>' +
                     '交易笔数: %{customdata[1]}<br>' +
                     '问题数量: %{customdata[2]}<extra></extra>',
        customdata=[[
            d['risk_level'].upper(),
            d['transaction_count'],
            d['issue_count']
        ] for d in data]
    )])
    
    fig.update_layout(
        yaxis=dict(autorange='reversed'),
        xaxis_title=x_title,
        margin=dict(l=200, r=40, t=20, b=40),
        height=max(400, len(data) * 35 + 80),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        transition=dict(duration=500, easing='cubic-in-out')
    )
    
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef')
    
    return fig


def create_risk_radar_chart(distribution_data):
    categories = list(distribution_data['risk_distribution'].keys())
    values = list(distribution_data['risk_distribution'].values())
    
    fig = go.Figure(data=go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        fillcolor='rgba(30, 58, 95, 0.3)',
        line=dict(color='#1e3a5f', width=2),
        marker=dict(size=8, color='#1e3a5f'),
        hovertemplate='<b>%{theta}</b><br>问题数量: %{r}<extra></extra>'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                showticklabels=True,
                gridcolor='#e9ecef'
            ),
            angularaxis=dict(
                gridcolor='#e9ecef'
            ),
            bgcolor='rgba(0,0,0,0)'
        ),
        margin=dict(l=40, r=40, t=40, b=40),
        height=350,
        paper_bgcolor='rgba(0,0,0,0)',
        showlegend=False
    )
    
    return fig


def create_risk_scatter_chart(data):
    fig = go.Figure()
    
    risk_order = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
    
    for risk in ['low', 'medium', 'high', 'critical']:
        filtered = [d for d in data if d['risk_level'] == risk]
        if filtered:
            fig.add_trace(go.Scatter(
                x=[d['total_amount'] for d in filtered],
                y=[d['issue_count'] for d in filtered],
                mode='markers',
                marker=dict(
                    color=RISK_COLORS[risk],
                    size=[max(10, min(30, d['transaction_count'] * 2)) for d in filtered],
                    line=dict(color='white', width=1),
                    opacity=0.8
                ),
                name=risk.upper(),
                text=[d['supplier_name'] for d in filtered],
                hovertemplate='<b>%{text}</b><br>' +
                             '交易金额: ¥%{x:,.0f}<br>' +
                             '问题数量: %{y}<br>' +
                             f'风险等级: {risk.upper()}<extra></extra>'
            ))
    
    fig.update_layout(
        xaxis_title='交易金额 (元)',
        yaxis_title='问题数量',
        legend_title='风险等级',
        margin=dict(l=0, r=0, t=20, b=40),
        height=350,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        hovermode='closest'
    )
    
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef', type='log')
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='#e9ecef')
    
    return fig


def layout():
    return html.Div([
        html.H2('供应商分析', className='page-title'),
        html.P('分析供应商材料提交情况，支持按绝对值和占比两种模式查看，避免仅以规模论风险', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('展示方式:', className='filter-label'),
                html.Div([
                    html.Button(
                        '📊 绝对值',
                        id='mode-absolute',
                        className='btn btn-outline btn-sm active',
                        n_clicks=0
                    ),
                    html.Button(
                        '📈 占比',
                        id='mode-percentage',
                        className='btn btn-outline btn-sm',
                        n_clicks=0
                    ),
                ], className='btn-group')
            ], className='filter-item'),
            html.Div([
                html.Span('风险等级:', className='filter-label'),
                dcc.Dropdown(
                    id='supplier-risk-filter',
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
                html.Span('显示数量:', className='filter-label'),
                dcc.Dropdown(
                    id='supplier-limit',
                    options=[
                        {'label': 'Top 10', 'value': 10},
                        {'label': 'Top 20', 'value': 20},
                        {'label': 'Top 50', 'value': 50},
                        {'label': '全部', 'value': 100},
                    ],
                    value=10,
                    clearable=False,
                    style={'width': '120px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Button('📥 导出供应商报告', id='export-supplier-report', 
                           className='btn btn-primary btn-sm'),
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div([
            html.Div(id='mode-indicator', style={'gridColumn': 'span 4'})
        ], className='metrics-grid', style={'marginBottom': '24px'}),
        
        html.Div([
            html.Div([
                html.H3([
                    html.Span(id='chart-title'),
                    html.Span(id='chart-subtitle', 
                             style={'fontSize': '13px', 'color': '#666', 'marginLeft': '10px', 'fontWeight': 'normal'})
                ], className='chart-title'),
                dcc.Graph(id='supplier-ranking-chart', config={'displayModeBar': False})
            ], className='chart-card', style={'gridColumn': 'span 2'})
        ], className='chart-row'),
        
        html.Div([
            html.Div([
                html.H3('供应商风险分布 (点击柱状图查看详情)', className='chart-title'),
                dcc.Graph(id='supplier-radar-chart', config={'displayModeBar': False})
            ], className='chart-card'),
            html.Div([
                html.H3('金额 vs 问题数量散点图', className='chart-title'),
                dcc.Graph(id='supplier-scatter-chart', config={'displayModeBar': False})
            ], className='chart-card'),
        ], className='chart-row'),
        
        html.Div([
            html.H3('供应商详情列表', className='chart-title'),
            html.Div(id='supplier-table-container', style={'marginTop': '16px'})
        ], className='chart-card'),
        
        html.Div([
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('供应商详情')),
                dbc.ModalBody(id='supplier-detail-body'),
                dbc.ModalFooter(
                    dbc.Button('关闭', id='close-supplier-modal', className='btn btn-outline')
                ),
            ], id='supplier-modal', size='lg', is_open=False),
        ]),
        
        dcc.Store(id='current-mode', data='absolute'),
        dcc.Store(id='selected-supplier-id', data=None)
    ])


@callback(
    [Output('current-mode', 'data'),
     Output('mode-absolute', 'className'),
     Output('mode-percentage', 'className')],
    [Input('mode-absolute', 'n_clicks'),
     Input('mode-percentage', 'n_clicks')],
    prevent_initial_call=True
)
def switch_mode(abs_clicks, pct_clicks):
    triggered = ctx.triggered[0]
    if 'mode-absolute' in triggered['prop_id']:
        return 'absolute', 'btn btn-outline btn-sm active', 'btn btn-outline btn-sm'
    else:
        return 'percentage', 'btn btn-outline btn-sm', 'btn btn-outline btn-sm active'


@callback(
    [Output('mode-indicator', 'children'),
     Output('chart-title', 'children'),
     Output('chart-subtitle', 'children'),
     Output('supplier-ranking-chart', 'figure'),
     Output('supplier-scatter-chart', 'figure'),
     Output('supplier-table-container', 'children')],
    [Input('current-mode', 'data'),
     Input('supplier-risk-filter', 'value'),
     Input('supplier-limit', 'value')]
)
def update_supplier_data(mode, risk_filter, limit):
    data = get_supplier_ranking(mode=mode, limit=limit)
    all_data = get_supplier_ranking(mode='absolute', limit=100)
    
    if risk_filter != 'all':
        data = [d for d in data if d['risk_level'] == risk_filter]
        all_data = [d for d in all_data if d['risk_level'] == risk_filter]
    
    mode_text = '绝对值' if mode == 'absolute' else '占比'
    indicator = html.Div([
        html.Span('当前展示模式:', style={'fontSize': '13px', 'color': '#666', 'marginRight': '8px'}),
        html.Span(mode_text, 
                 style={'fontSize': '14px', 'fontWeight': '600', 'color': '#1e3a5f'}),
        html.Span(' (点击上方按钮切换)', style={'fontSize': '12px', 'color': '#999', 'marginLeft': '8px'})
    ])
    
    chart_title = f'供应商材料排行榜 - {mode_text}'
    chart_subtitle = f'共 {len(data)} 家供应商'
    
    table_columns = [
        {'name': '排名', 'id': 'rank'},
        {'name': '供应商名称', 'id': 'supplier_name'},
        {'name': '风险等级', 'id': 'risk_level'},
        {'name': '交易笔数', 'id': 'transaction_count'},
        {'name': '交易金额' if mode == 'absolute' else '金额占比', 'id': 'amount'},
        {'name': '问题数量', 'id': 'issue_count'},
        {'name': '操作', 'id': 'action'}
    ]
    
    table_data = []
    for idx, d in enumerate(data):
        amount_display = f"¥{d['total_amount']:,.2f}" if mode == 'absolute' else f"{d['percentage']:.2f}%"
        risk_level = d['risk_level']
        
        table_data.append({
            'rank': idx + 1,
            'supplier_name': d['supplier_name'],
            'risk_level': risk_level.upper(),
            'transaction_count': d['transaction_count'],
            'amount': amount_display,
            'issue_count': d['issue_count'],
            'action': '查看详情',
            'supplier_id': d['supplier_id']
        })
    
    risk_colors = Config.RISK_COLORS
    
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
            'if': {'column_id': 'issue_count', 'filter_query': '{issue_count} > 0'},
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
        id='supplier-datatable'
    )
    
    return (
        indicator,
        chart_title,
        chart_subtitle,
        create_ranking_chart(data, mode),
        create_risk_scatter_chart(all_data),
        table
    )


@callback(
    Output('supplier-radar-chart', 'figure'),
    [Input('supplier-ranking-chart', 'clickData'),
     Input('supplier-risk-filter', 'value')]
)
def update_radar_chart(click_data, risk_filter):
    if click_data and 'points' in click_data and len(click_data['points']) > 0:
        supplier_name = click_data['points'][0]['y']
        data = get_supplier_ranking(mode='absolute', limit=100)
        supplier = next((s for s in data if s['supplier_name'] == supplier_name), None)
        
        if supplier:
            distribution = get_supplier_risk_distribution(supplier['supplier_id'])
            return create_risk_radar_chart(distribution)
    
    data = get_supplier_ranking(mode='absolute', limit=100)
    if data:
        distribution = get_supplier_risk_distribution(data[0]['supplier_id'])
        return create_risk_radar_chart(distribution)
    
    return go.Figure()


@callback(
    Output('supplier-modal', 'is_open'),
    Output('supplier-detail-body', 'children'),
    Output('selected-supplier-id', 'data'),
    [Input('supplier-datatable', 'active_cell'),
     Input('close-supplier-modal', 'n_clicks')],
    [State('supplier-datatable', 'data'),
     State('supplier-modal', 'is_open')],
    prevent_initial_call=True
)
def toggle_supplier_modal(active_cell, close_click, table_data, is_open):
    import json
    
    triggered = ctx.triggered[0]
    
    if 'close-supplier-modal' in triggered['prop_id']:
        return False, None, None
    
    if 'supplier-datatable.active_cell' in triggered['prop_id'] and active_cell:
        if active_cell.get('column_id') == 'action':
            row = active_cell.get('row')
            if row is not None and row < len(table_data):
                supplier_id = table_data[row]['supplier_id']
                
                all_suppliers = get_supplier_ranking(mode='absolute', limit=100)
                supplier = next((s for s in all_suppliers if s['supplier_id'] == supplier_id), None)
                
                if supplier:
                    distribution = get_supplier_risk_distribution(supplier_id)
                    
                    body = html.Div([
                        html.Div([
                            html.Div([
                                html.Strong('供应商名称：'), supplier['supplier_name']
                            ], style={'marginBottom': '8px', 'fontSize': '16px'}),
                            html.Div([
                                html.Strong('风险等级：'),
                                html.Span(supplier['risk_level'].upper(), 
                                         className=f'risk-badge {supplier["risk_level"]}',
                                         style={'marginLeft': '8px'})
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('交易笔数：'), f"{supplier['transaction_count']} 笔"
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('累计交易金额：'), f"¥{supplier['total_amount']:,.2f}"
                            ], style={'marginBottom': '8px'}),
                            html.Div([
                                html.Strong('发现问题数：'), 
                                html.Span(f"{supplier['issue_count']} 个",
                                         style={'color': '#d62828', 'fontWeight': '600'})
                            ], style={'marginBottom': '8px'}),
                        ], style={'padding': '16px', 'background': '#f8f9fa', 'borderRadius': '6px', 'marginBottom': '16px'}),
                        
                        html.H5('问题类型分布'),
                        html.Div([
                            html.Div([
                                html.Div(cat, style={'fontWeight': '500', 'flex': '1'}),
                                html.Div([
                                    html.Div(
                                        style={
                                            'width': f"{max(10, count * 20)}px",
                                            'height': '20px',
                                            'background': '#1e3a5f',
                                            'borderRadius': '4px',
                                            'marginRight': '8px'
                                        }
                                    ),
                                    html.Span(f'{count}个', style={'fontSize': '12px', 'color': '#666'})
                                ], style={'display': 'flex', 'alignItems': 'center'})
                            ], style={'display': 'flex', 'alignItems': 'center', 'padding': '8px 0', 'borderBottom': '1px solid #f1f3f5'})
                            for cat, count in distribution['risk_distribution'].items()
                        ], style={'marginBottom': '16px'})
                    ])
                    return True, body, supplier_id
    
    return is_open, None, None


layout = layout
