import dash
from dash import dcc, html, Input, Output, State, callback, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from datetime import datetime, timedelta

from utils.data_service import get_checklist_tree
from app.config import Config

dash.register_page(__name__, path='/checklist')

RISK_COLORS = Config.RISK_COLORS


def create_progress_bar(progress):
    if progress >= 80:
        bar_class = ''
    elif progress >= 50:
        bar_class = 'warning'
    else:
        bar_class = 'danger'
    
    return html.Div([
        html.Div(className='progress-bar', children=[
            html.Div(
                className=f'progress-fill {bar_class}',
                style={'width': f'{progress}%'}
            )
        ]),
        html.Span(f'{progress}%', style={'fontSize': '12px', 'marginLeft': '8px', 'color': '#666'})
    ], style={'display': 'flex', 'alignItems': 'center', 'gap': '8px', 'width': '150px'})


def create_tree_item(item, level=0, is_category=False):
    item_index = item['id']
    
    if is_category:
        items_count = len(item.get('items', []))
        total_issues = item.get('total_issues', 0)
        completion_rate = item.get('completion_rate', 100)
        
        header = html.Div([
            html.Span('📁', style={'fontSize': '18px'}),
            html.Div([
                html.Div(item['name'], style={'fontWeight': '600', 'color': 'var(--primary)'}),
                html.Div(item['description'], style={'fontSize': '12px', 'color': '#666', 'marginTop': '2px'})
            ], style={'flex': '1'}),
            html.Div([
                html.Span(f'{items_count}项检查', className='status-badge pending', 
                         style={'marginRight': '8px'}),
                html.Span(f'{total_issues}个问题', className='risk-badge high',
                         style={'marginRight': '8px'}),
                create_progress_bar(completion_rate)
            ], style={'display': 'flex', 'alignItems': 'center'})
        ], className='tree-item-content')
        
        children = html.Div(
            [create_tree_item(sub_item, level + 1) for sub_item in item.get('items', [])],
            className='tree-children',
            id={'type': 'tree-children', 'index': item_index},
            style={'display': 'none'}
        )
        
        return html.Div([
            html.Div([
                html.Span('+', className='tree-toggle', id={'type': 'tree-toggle', 'index': item_index}),
                header
            ], className='tree-item'),
            children
        ], style={'marginBottom': '8px'})
    else:
        subitems_count = len(item.get('subitems', []))
        issue_count = item.get('issue_count', 0)
        completion_rate = item.get('completion_rate', 100)
        risk_level = item.get('risk_level', 'medium')
        
        header = html.Div([
            html.Span('📋', style={'fontSize': '16px'}),
            html.Div([
                html.Div([
                    html.Span(f"[{item['item_code']}]", style={
                        'fontFamily': 'var(--font-mono)', 
                        'fontSize': '12px', 
                        'color': '#666',
                        'marginRight': '8px'
                    }),
                    html.Span(item['title'], style={'fontWeight': '500'}),
                    html.Span(risk_level.upper(), className=f'risk-badge {risk_level}',
                             style={'marginLeft': '8px'})
                ]),
                html.Div(item['description'], style={'fontSize': '12px', 'color': '#666', 'marginTop': '2px'})
            ], style={'flex': '1'}),
            html.Div([
                html.Span(f'{subitems_count}子项', className='status-badge verified',
                         style={'marginRight': '8px'}),
                html.Span(f'{issue_count}问题', className='risk-badge high',
                         style={'marginRight': '8px'}),
                create_progress_bar(completion_rate),
                html.Button(
                    '查看问题',
                    id={'type': 'view-issues', 'index': item_index},
                    className='btn btn-outline btn-sm',
                    style={'marginLeft': '12px'}
                )
            ], style={'display': 'flex', 'alignItems': 'center'})
        ], className='tree-item-content')
        
        children = html.Div([
            html.Div([
                html.Div([
                    html.Div('子项名称', style={'flex': '1', 'fontWeight': '500'}),
                    html.Div('检查方法', style={'flex': '1', 'fontWeight': '500'}),
                    html.Div('证据要求', style={'flex': '1', 'fontWeight': '500'}),
                ], style={'display': 'flex', 'padding': '10px 12px', 'background': '#f8f9fa', 'borderRadius': '4px 4px 0 0'}),
                *[
                    html.Div([
                        html.Div(f'• {subitem["title"]}', style={'flex': '1', 'fontSize': '13px'}),
                        html.Div(subitem['check_method'], style={'flex': '1', 'fontSize': '13px', 'color': '#666'}),
                        html.Div(subitem['evidence_requirement'], style={'flex': '1', 'fontSize': '13px', 'color': '#666'}),
                    ], style={'display': 'flex', 'padding': '10px 12px', 'borderBottom': '1px solid #f1f3f5'})
                    for subitem in item.get('subitems', [])
                ]
            ], style={'border': '1px solid #e9ecef', 'borderRadius': '4px', 'overflow': 'hidden', 'marginTop': '8px'})
        ], className='tree-children', id={'type': 'tree-children', 'index': item_index}, style={'display': 'none'})
        
        return html.Div([
            html.Div([
                html.Span('+', className='tree-toggle', id={'type': 'tree-toggle', 'index': item_index}) if subitems_count > 0 else html.Span('', className='tree-toggle'),
                header
            ], className='tree-item'),
            children
        ], style={'marginBottom': '8px'})


def create_category_summary_chart(categories):
    names = [cat['name'] for cat in categories]
    issues = [cat['total_issues'] for cat in categories]
    completion = [cat['completion_rate'] for cat in categories]
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name='问题数量',
        x=names,
        y=issues,
        yaxis='y',
        marker=dict(color='rgba(214, 40, 40, 0.7)', line=dict(color='rgb(214, 40, 40)', width=1)),
        text=issues,
        textposition='auto',
        hovertemplate='<b>%{x}</b><br>问题数量: %{y}<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        name='完成率',
        x=names,
        y=completion,
        yaxis='y2',
        mode='lines+markers',
        line=dict(color='rgb(45, 106, 79)', width=3),
        marker=dict(size=8),
        text=[f'{c}%' for c in completion],
        textposition='top center',
        hovertemplate='<b>%{x}</b><br>完成率: %{y}%<extra></extra>'
    ))
    
    fig.update_layout(
        xaxis=dict(title='制度分类'),
        yaxis=dict(title='问题数量', side='left'),
        yaxis2=dict(title='完成率 (%)', side='right', overlaying='y', range=[0, 100]),
        legend=dict(orientation='h', y=1.1),
        margin=dict(l=0, r=0, t=40, b=0),
        height=350,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig


def layout():
    return html.Div([
        html.H2('检查清单管理', className='page-title'),
        html.P('制度条目分层展开，从制度分类→检查项→子项逐级查看，支持问题标记和完成度追踪', className='page-subtitle'),
        
        html.Div([
            html.Div([
                html.Span('制度分类:', className='filter-label'),
                dcc.Dropdown(
                    id='category-filter',
                    options=[{'label': '全部分类', 'value': 'all'}] + [
                        {'label': cat, 'value': idx + 1}
                        for idx, cat in enumerate([
                            '财务管理制度', '采购管理制度', '销售管理制度',
                            '人事管理制度', '信息安全制度'
                        ])
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '180px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Span('风险等级:', className='filter-label'),
                dcc.Dropdown(
                    id='risk-filter',
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
                html.Span('状态:', className='filter-label'),
                dcc.Dropdown(
                    id='status-filter',
                    options=[
                        {'label': '全部状态', 'value': 'all'},
                        {'label': '待处理', 'value': 'pending'},
                        {'label': '处理中', 'value': 'in_progress'},
                        {'label': '已完成', 'value': 'completed'},
                    ],
                    value='all',
                    clearable=False,
                    style={'width': '150px'}
                )
            ], className='filter-item'),
            html.Div([
                html.Button('📂 全部展开', id='expand-all', className='btn btn-outline btn-sm', n_clicks=0),
                html.Button('📁 全部折叠', id='collapse-all', className='btn btn-outline btn-sm', n_clicks=0, style={'marginLeft': '8px'}),
            ], className='filter-item', style={'marginLeft': 'auto'})
        ], className='filter-bar'),
        
        html.Div([
            html.Div([
                html.H3('各分类检查完成情况', className='chart-title'),
                dcc.Graph(id='category-summary-chart', config={'displayModeBar': False})
            ], className='chart-card')
        ], style={'marginBottom': '24px'}),
        
        html.Div([
            html.H3('检查清单详情', className='chart-title'),
            html.Div(id='checklist-tree', style={'marginTop': '16px'})
        ], className='chart-card'),
        
        html.Div([
            dbc.Modal([
                dbc.ModalHeader(dbc.ModalTitle('检查项问题列表')),
                dbc.ModalBody(id='issues-modal-body'),
                dbc.ModalFooter(
                    dbc.Button('关闭', id='close-issues-modal', className='btn btn-outline')
                ),
            ], id='issues-modal', size='lg', is_open=False),
        ])
    ])


@callback(
    [Output('checklist-tree', 'children'),
     Output('category-summary-chart', 'figure')],
    [Input('category-filter', 'value'),
     Input('risk-filter', 'value'),
     Input('status-filter', 'value')]
)
def update_checklist(category_filter, risk_filter, status_filter):
    category_id = None if category_filter == 'all' else category_filter
    tree_data = get_checklist_tree(category_id)
    
    if risk_filter != 'all':
        for cat in tree_data:
            cat['items'] = [item for item in cat['items'] if item['risk_level'] == risk_filter]
            cat['total_issues'] = sum(i['issue_count'] for i in cat['items'])
            cat['completion_rate'] = round(
                sum(i['completion_rate'] * i['issue_count'] for i in cat['items']) / cat['total_issues']
                if cat['total_issues'] > 0 else 100, 1
            )
    
    tree_elements = []
    for cat in tree_data:
        tree_elements.append(create_tree_item(cat, is_category=True))
    
    return tree_elements, create_category_summary_chart(tree_data)


@callback(
    Output('issues-modal', 'is_open'),
    Output('issues-modal-body', 'children'),
    [Input({'type': 'view-issues', 'index': dash.ALL}, 'n_clicks'),
     Input('close-issues-modal', 'n_clicks')],
    State('issues-modal', 'is_open'),
    prevent_initial_call=True
)
def toggle_issues_modal(n_clicks, close_click, is_open):
    triggered = ctx.triggered[0]
    
    if 'close-issues-modal' in triggered['prop_id']:
        return False, None
    
    if 'view-issues' in triggered['prop_id']:
        import json
        prop_id = json.loads(triggered['prop_id'].split('.')[0])
        item_id = prop_id['index']
        
        from utils.data_service import get_checklist_tree
        all_data = get_checklist_tree()
        
        target_item = None
        for cat in all_data:
            for item in cat['items']:
                if item['id'] == item_id:
                    target_item = item
                    break
            if target_item:
                break
        
        if target_item:
            body = html.Div([
                html.Div([
                    html.Strong('检查项：'),
                    f"[{target_item['item_code']}] {target_item['title']}"
                ], style={'marginBottom': '12px'}),
                html.Div([
                    html.Strong('描述：'),
                    target_item['description']
                ], style={'marginBottom': '12px'}),
                html.Div([
                    html.Strong('风险等级：'),
                    html.Span(target_item['risk_level'].upper(), 
                             className=f'risk-badge {target_item["risk_level"]}')
                ], style={'marginBottom': '20px'}),
                html.Hr(),
                html.H5(f'相关问题 ({target_item["issue_count"]}个)'),
                html.Div([
                    html.Div([
                        html.Div('待开发：具体问题列表将在此处展示', 
                                style={'padding': '20px', 'textAlign': 'center', 'color': '#666'})
                    ], className='table-container')
                ])
            ])
            return True, body
    
    return is_open, None


@callback(
    Output({'type': 'tree-children', 'index': dash.ALL}, 'style'),
    [Input('expand-all', 'n_clicks'),
     Input('collapse-all', 'n_clicks'),
     Input({'type': 'tree-toggle', 'index': dash.ALL}, 'n_clicks')],
    State({'type': 'tree-children', 'index': dash.ALL}, 'style'),
    prevent_initial_call=True
)
def toggle_trees(expand_clicks, collapse_clicks, toggle_clicks, current_styles):
    triggered = ctx.triggered[0]
    prop_id = triggered['prop_id']
    
    if 'expand-all' in prop_id:
        return [{'display': 'block'}] * len(current_styles)
    elif 'collapse-all' in prop_id:
        return [{'display': 'none'}] * len(current_styles)
    else:
        import json
        try:
            parts = prop_id.split('.')
            if len(parts) >= 1:
                trigger_obj = json.loads(parts[0])
                trigger_index = trigger_obj.get('index')
                
                outputs = []
                state_list = ctx.states_list
                if state_list:
                    for state in state_list[0]:
                        try:
                            state_obj = json.loads(state['id'])
                            state_index = state_obj.get('index')
                            if state_index == trigger_index:
                                style = state.get('value', {})
                                if style and style.get('display') == 'none':
                                    outputs.append({'display': 'block'})
                                else:
                                    outputs.append({'display': 'none'})
                            else:
                                outputs.append(state.get('value', {'display': 'none'}))
                        except (json.JSONDecodeError, TypeError):
                            outputs.append(state.get('value', {'display': 'none'}))
                    return outputs
        except (json.JSONDecodeError, TypeError, KeyError, IndexError):
            pass
        return current_styles if current_styles else []


layout = layout
