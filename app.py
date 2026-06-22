import dash
from dash import dcc, html, Input, Output, State, callback
import dash_bootstrap_components as dbc
from datetime import datetime, timedelta
import os

from app.config import Config

app = dash.Dash(
    __name__,
    use_pages=True,
    suppress_callback_exceptions=True,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap'
    ],
    meta_tags=[
        {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}
    ]
)

app.title = '合规审计风险监测看板'
app.config.suppress_callback_exceptions = True

server = app.server

NAV_ITEMS = [
    {'path': '/', 'label': '风险监测', 'icon': '📊'},
    {'path': '/checklist', 'label': '检查清单', 'icon': '📋'},
    {'path': '/sampling', 'label': '抽样分析', 'icon': '🎯'},
    {'path': '/rectification', 'label': '整改追踪', 'icon': '✅'},
    {'path': '/suppliers', 'label': '供应商分析', 'icon': '🏢'},
]


def create_sidebar():
    return html.Div([
        html.Div([
            html.H1('合规审计'),
            html.P('风险监测看板')
        ], className='sidebar-header'),
        html.Nav([
            html.Div(
                [
                    html.Span(item['icon'], className='nav-item-icon'),
                    html.Span(item['label'])
                ],
                id=f'nav-{item["path"].replace("/", "")}',
                className='nav-item',
                **{'data-path': item['path']}
            ) for item in NAV_ITEMS
        ], className='sidebar-nav'),
        html.Div([
            html.Div(f'系统版本: v1.0.0'),
            html.Div(f'© 2024 内审部')
        ], className='sidebar-footer')
    ], className='sidebar')


def create_top_header():
    return html.Div([
        html.Div([
            html.Span('首页', className='breadcrumb'),
            html.Span(' / ', className='breadcrumb'),
            html.Span(id='current-page', className='breadcrumb current')
        ], className='breadcrumb'),
        html.Div([
            dcc.Upload(
                id='upload-data',
                children=html.Button([
                    html.Span('📤 ', style={'marginRight': '6px'}),
                    '数据导入'
                ], className='btn btn-outline btn-sm'),
                multiple=True
            ),
            html.Div([
                html.Div('ZS', className='user-avatar'),
                html.Div('张审计')
            ], className='user-info')
        ], className='header-actions')
    ], className='top-header')


app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    html.Div([
        create_sidebar(),
        html.Div([
            create_top_header(),
            html.Div(
                dash.page_container,
                className='content-wrapper',
                id='page-content'
            )
        ], className='main-content')
    ], className='app-container'),
    html.Div(id='upload-notification'),
    html.Div(id='hidden-div', style={'display': 'none'})
])


@callback(
    Output('url', 'pathname'),
    [Input(f'nav-{item["path"].replace("/", "")}', 'n_clicks') for item in NAV_ITEMS],
    State('url', 'pathname'),
    prevent_initial_call=True
)
def navigate(*args):
    ctx = dash.callback_context
    if not ctx.triggered:
        return args[-1]
    
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    path_map = {f'nav-{item["path"].replace("/", "")}': item['path'] for item in NAV_ITEMS}
    return path_map.get(button_id, args[-1])


@callback(
    Output('current-page', 'children'),
    Input('url', 'pathname')
)
def update_current_page(pathname):
    path_to_label = {item['path']: item['label'] for item in NAV_ITEMS}
    return path_to_label.get(pathname, '风险监测')


@callback(
    [Output(f'nav-{item["path"].replace("/", "")}', 'className') for item in NAV_ITEMS],
    Input('url', 'pathname')
)
def update_active_nav(pathname):
    classes = []
    for item in NAV_ITEMS:
        base_class = 'nav-item'
        if item['path'] == pathname:
            base_class += ' active'
        classes.append(base_class)
    return classes


@callback(
    Output('upload-notification', 'children'),
    Input('upload-data', 'contents'),
    State('upload-data', 'filename'),
    prevent_initial_call=True
)
def handle_upload(contents, filenames):
    if not contents:
        return None
    
    import base64
    import os
    from tasks.celery_app import import_permission_log, import_erp_data
    
    notifications = []
    
    for content, filename in zip(contents, filenames):
        try:
            content_type, content_string = content.split(',')
            decoded = base64.b64decode(content_string)
            
            upload_dir = './data/import'
            os.makedirs(upload_dir, exist_ok=True)
            filepath = os.path.join(upload_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(decoded)
            
            if 'permission' in filename.lower() or '权限' in filename:
                task = import_permission_log.delay(filepath)
                notifications.append(
                    dbc.Alert(
                        f'✅ 权限日志 "{filename}" 已提交导入，任务ID: {task.id}',
                        color='success',
                        dismissable=True,
                        duration=5000
                    )
                )
            elif 'erp' in filename.lower() or 'ERP' in filename:
                task = import_erp_data.delay(filepath)
                notifications.append(
                    dbc.Alert(
                        f'✅ ERP数据 "{filename}" 已提交导入，任务ID: {task.id}',
                        color='success',
                        dismissable=True,
                        duration=5000
                    )
                )
            else:
                notifications.append(
                    dbc.Alert(
                        f'✅ 文件 "{filename}" 已上传',
                        color='info',
                        dismissable=True,
                        duration=5000
                    )
                )
        except Exception as e:
            notifications.append(
                dbc.Alert(
                    f'❌ 文件 "{filename}" 上传失败: {str(e)}',
                    color='danger',
                    dismissable=True,
                    duration=5000
                )
            )
    
    return html.Div(notifications, style={
        'position': 'fixed', 'top': '20px', 'right': '20px', 'zIndex': '9999', 'width': '400px'
    })


if __name__ == '__main__':
    from utils.init_data import initialize_all
    import os
    
    if not os.path.exists('audit_compliance.db'):
        initialize_all()
    
    app.run(debug=Config.DASH_DEBUG, host='0.0.0.0', port=8050)
