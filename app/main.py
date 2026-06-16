import dash
from dash import dcc, html, Input, Output, State, callback, ALL
import dash_bootstrap_components as dbc
from datetime import datetime

from components.overview_dashboard import get_overview_layout
from components.drill_down import get_drilldown_layout
from components.audit_tasks import get_audit_tasks_layout
from components.followup_tracking import get_followup_layout
from utils.style_config import *
from config import Config

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    meta_tags=[{'name': 'viewport', 'content': 'width=device-width, initial-scale=1.0'}]
)

app.title = '药店连锁处方审核风险监测系统'

nav_items = [
    {'name': '风险总览', 'icon': '📊', 'value': 'overview'},
    {'name': '深度复盘', 'icon': '🔍', 'value': 'drilldown'},
    {'name': '任务管理', 'icon': '📋', 'value': 'tasks'},
    {'name': '回访追踪', 'icon': '📞', 'value': 'followup'},
]

sidebar = html.Div([
    html.Div([
        html.H2('💊 处方审核', style={'color': 'white', 'marginBottom': '5px', 'fontSize': '22px'}),
        html.P('风险监测系统', style={'color': '#B0BEC5', 'margin': 0, 'fontSize': '14px'}),
    ], style={'padding': '20px 15px', 'borderBottom': '1px solid #455A64', 'marginBottom': '20px'}),

    html.Div([
        html.Div(
            id={'type': 'nav-item', 'index': item['value']},
            children=[
                html.Span(item['icon'], style={'marginRight': '12px', 'fontSize': '18px'}),
                html.Span(item['name'], style={'fontSize': '15px', 'fontWeight': '500'})
            ],
            style={
                'padding': '14px 18px',
                'margin': '5px 0',
                'borderRadius': '8px',
                'cursor': 'pointer',
                'display': 'flex',
                'alignItems': 'center',
                'backgroundColor': COLORS['primary'] if item['value'] == 'overview' else 'transparent',
                'color': 'white',
                'transition': 'all 0.2s'
            },
            n_clicks=0
        ) for item in nav_items
    ]),

    html.Div([
        html.Div([
            html.Div('数据来源', style={'fontSize': '12px', 'color': '#90A4AE', 'marginBottom': '8px'}),
            html.Div([
                html.Span('🏪', style={'marginRight': '8px'}),
                html.Span('收银系统', style={'fontSize': '13px'})
            ], style={'marginBottom': '5px'}),
            html.Div([
                html.Span('🏥', style={'marginRight': '8px'}),
                html.Span('医保接口', style={'fontSize': '13px'})
            ]),
        ], style={'padding': '20px', 'borderTop': '1px solid #455A64', 'marginTop': '20px'})
    ], style={'position': 'absolute', 'bottom': 0, 'left': 0, 'right': 0})
], style=SIDEBAR_STYLE)

content = html.Div([
    dcc.Location(id='url', refresh=False),
    html.Div(id='page-content')
], style=CONTENT_STYLE)

app.layout = html.Div([sidebar, content])


@callback(
    Output('page-content', 'children'),
    Input({'type': 'nav-item', 'index': ALL}, 'n_clicks'),
    State({'type': 'nav-item', 'index': ALL}, 'id'),
    prevent_initial_call=False
)
def display_page(n_clicks, ids):
    ctx = dash.callback_context

    if not ctx.triggered:
        return get_overview_layout()

    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    import json
    button_info = json.loads(button_id)
    page_value = button_info['index']

    if page_value == 'overview':
        return get_overview_layout()
    elif page_value == 'drilldown':
        return get_drilldown_layout()
    elif page_value == 'tasks':
        return get_audit_tasks_layout()
    elif page_value == 'followup':
        return get_followup_layout()

    return get_overview_layout()


@callback(
    Output({'type': 'nav-item', 'index': ALL}, 'style'),
    Input({'type': 'nav-item', 'index': ALL}, 'n_clicks'),
    State({'type': 'nav-item', 'index': ALL}, 'id'),
    prevent_initial_call=False
)
def update_nav_style(n_clicks, ids):
    ctx = dash.callback_context
    import json

    if n_clicks is None or all(c is None for c in n_clicks):
        active_page = 'overview'
    else:
        if not ctx.triggered:
            active_page = 'overview'
        else:
            button_id = ctx.triggered[0]['prop_id'].split('.')[0]
            try:
                button_info = json.loads(button_id)
                active_page = button_info['index']
            except:
                active_page = 'overview'

    active_style = {
        'padding': '14px 18px',
        'margin': '5px 0',
        'borderRadius': '8px',
        'cursor': 'pointer',
        'display': 'flex',
        'alignItems': 'center',
        'backgroundColor': COLORS['primary'],
        'color': 'white',
        'transition': 'all 0.2s'
    }

    inactive_style = {
        'padding': '14px 18px',
        'margin': '5px 0',
        'borderRadius': '8px',
        'cursor': 'pointer',
        'display': 'flex',
        'alignItems': 'center',
        'backgroundColor': 'transparent',
        'color': 'white',
        'transition': 'all 0.2s'
    }

    return [active_style if item_id['index'] == active_page else inactive_style for item_id in ids]
