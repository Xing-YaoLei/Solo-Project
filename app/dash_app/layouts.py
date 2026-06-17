import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table, ctx
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import os
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, current_user, logout_user

from app.config import config
from app.database import get_session
from app.models import User
from app.report_service import ReportDataService
from app.auth import is_manager, is_frontline
from app.tasks import (
    import_crm_properties_task,
    import_crm_tenants_task,
    import_contracts_task,
    import_meter_readings_task,
    import_repair_records_task,
)


login_manager = LoginManager()


class LoginUser(UserMixin):
    def __init__(self, user):
        self.user = user
        self.id = user.id
        self.username = user.username
        self.real_name = user.real_name
        self.role = user.role

    def get_id(self):
        return str(self.user.id)


@login_manager.user_loader
def load_user(user_id):
    with get_session() as session:
        user = session.query(User).filter(User.id == int(user_id)).first()
        if user:
            return LoginUser(user)
    return None


def get_current_dash_user():
    if current_user.is_authenticated:
        return current_user.user
    return None


STATUS_LABELS = {
    'draft': '草稿',
    'pending_review': '待审核',
    'published': '已发布',
    'offline': '已下架',
}


def create_login_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                html.Div([
                    html.H2('长租公寓房源上架漏斗报表', className='text-center mb-4',
                            style={'color': '#2c3e50', 'fontWeight': 'bold'}),
                    html.Hr(),
                    dbc.Card([
                        dbc.CardBody([
                            html.H4('用户登录', className='card-title text-center mb-4'),
                            dbc.Form([
                                dbc.Label('用户名'),
                                dbc.Input(id='login-username', type='text', placeholder='请输入用户名',
                                          className='mb-3'),
                                dbc.Label('密码'),
                                dbc.Input(id='login-password', type='password', placeholder='请输入密码',
                                          className='mb-3'),
                                dbc.Button('登录', id='login-btn', color='primary', size='lg',
                                           className='w-100 mt-3'),
                                html.Div(id='login-message', className='mt-3 text-center'),
                            ]),
                        ]),
                    ], className='shadow'),
                    html.Div('默认账号: admin / admin123 (管理层)  frontline / front123 (一线)',
                             className='text-center text-muted mt-3 small'),
                ], className='mt-5 p-4 bg-white rounded shadow-sm',
                    style={'maxWidth': '500px', 'margin': '0 auto'}),
            ], width=12),
        ], className='justify-content-center align-items-center',
            style={'minHeight': '100vh', 'backgroundColor': '#f5f7fa'}),
    ], fluid=True)


def create_navbar():
    user = get_current_dash_user()
    role_text = '管理层' if is_manager(user) else '一线运营'
    return dbc.NavbarSimple([
        dbc.NavItem(dbc.NavLink(f'{user.real_name or user.username} ({role_text})', disabled=True)),
        dbc.NavItem(dbc.Button('退出登录', id='logout-btn', color='link', size='sm')),
    ], brand='长租公寓房源上架漏斗报表', brand_href='#', color='primary', dark=True, fluid=True)


def create_kpi_card(title, value, subtitle=None, color='primary', icon='📊'):
    return dbc.Card([
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Div(icon, style={'fontSize': '2.5rem'}),
                ], width=3, className='text-center'),
                dbc.Col([
                    html.H6(title, className='text-muted mb-1'),
                    html.H3(value, className=f'text-{color} mb-0', style={'fontWeight': 'bold'}),
                    html.Small(subtitle, className='text-muted') if subtitle else None,
                ], width=9),
            ], align='center'),
        ]),
    ], className='shadow-sm h-100')


def create_overview_tab():
    return [
        html.H4('📈 核心指标总览', className='mb-4 mt-3',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col(create_kpi_card('房源总数', '--', '全部在管房源', 'primary', '🏠'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('已上架房源', '--', '发布状态', 'success', '✅'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('上架率', '--%', '已发布/总数', 'info', '📊'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('出租率', '--%', '活跃合同/房源', 'warning', '🏡'), width=3, className='mb-4'),
        ], id='overview-kpi-row'),
        dbc.Row([
            dbc.Col(create_kpi_card('活跃合同数', '--', '履行中合同', 'success', '📄'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('逾期合同数', '--', '租金逾期', 'danger', '⚠️'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('逾期总金额', '--元', '累计逾期', 'danger', '💰'), width=3, className='mb-4'),
            dbc.Col(create_kpi_card('本月维修工单', '--', '新增维修', 'secondary', '🔧'), width=3, className='mb-4'),
        ], id='overview-kpi-row-2'),

        html.H4('🏗️ 房源上架漏斗', className='mb-4 mt-4',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='listing-funnel-chart'),
            ], width=6),
            dbc.Col([
                dcc.Graph(id='listing-by-district-chart'),
            ], width=6),
        ], className='mb-4'),
    ]


def create_analytics_tab():
    return [
        html.H4('📷 房源照片分布', className='mb-4 mt-3',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='photo-distribution-chart'),
            ], width=6),
            dbc.Col([
                dcc.Graph(id='photo-box-chart'),
            ], width=6),
        ], className='mb-4'),

        html.Hr(),
        html.H4('👤 租客档案漏斗', className='mb-4 mt-4',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='tenant-funnel-chart'),
            ], width=7),
            dbc.Col([
                dcc.Graph(id='tenant-conversion-chart'),
            ], width=5),
        ], className='mb-4'),

        html.Hr(),
        html.H4('📋 合同版本排行', className='mb-4 mt-4',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='contract-version-chart'),
            ], width=7),
            dbc.Col([
                dash_table.DataTable(
                    id='contract-version-table',
                    columns=[
                        {'name': '版本号', 'id': 'contract_version'},
                        {'name': '使用数', 'id': 'usage_count'},
                        {'name': '逾期数', 'id': 'overdue_count'},
                        {'name': '平均租金', 'id': 'avg_rent'},
                    ],
                    page_size=10,
                    style_table={'overflowX': 'auto'},
                    style_header={'backgroundColor': '#3498db', 'color': 'white', 'fontWeight': 'bold'},
                    style_cell={'textAlign': 'center', 'padding': '10px'},
                    style_data_conditional=[{'if': {'row_index': 'odd'}, 'backgroundColor': '#f8f9fa'}],
                ),
            ], width=5),
        ], className='mb-4'),

        html.Hr(),
        html.H4('🔧 维修记录变化趋势', className='mb-4 mt-4',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='repair-trend-chart'),
            ], width=7),
            dbc.Col([
                dcc.Graph(id='repair-type-chart'),
            ], width=5),
        ], className='mb-4'),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id='repair-status-chart'),
            ], width=12),
        ]),
    ]


def create_overdue_tab():
    return [
        html.H4('⚠️ 租金逾期管理', className='mb-4 mt-3',
                style={'color': '#e74c3c', 'borderLeft': '4px solid #e74c3c', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Label('合同编号搜索'),
                        dcc.Dropdown(id='overdue-contract-select', placeholder='选择合同查看详情与注释',
                                     className='mb-3'),
                    ]),
                ]),
            ], width=12),
        ], className='mb-4'),
        dbc.Row([
            dbc.Col([
                dash_table.DataTable(
                    id='overdue-table',
                    columns=[
                        {'name': '合同编号', 'id': 'contract_no'},
                        {'name': '项目', 'id': 'project_name'},
                        {'name': '房号', 'id': 'unit_no'},
                        {'name': '租客', 'id': 'tenant_name'},
                        {'name': '联系电话', 'id': 'tenant_phone'},
                        {'name': '月租金(元)', 'id': 'monthly_rent'},
                        {'name': '逾期天数', 'id': 'overdue_days'},
                        {'name': '逾期金额(元)', 'id': 'overdue_amount'},
                    ],
                    page_size=15,
                    row_selectable='single',
                    selected_rows=[],
                    style_table={'overflowX': 'auto'},
                    style_header={'backgroundColor': '#e74c3c', 'color': 'white', 'fontWeight': 'bold'},
                    style_cell={'textAlign': 'center', 'padding': '8px'},
                    style_data_conditional=[
                        {
                            'if': {'filter_query': '{overdue_days} >= 30'},
                            'backgroundColor': '#ffe0e0',
                            'color': '#c0392b',
                            'fontWeight': 'bold',
                        },
                        {
                            'if': {'filter_query': '{overdue_days} >= 15 && {overdue_days} < 30'},
                            'backgroundColor': '#fff3cd',
                        },
                    ],
                ),
            ], width=12),
        ], className='mb-4'),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('📝 添加逾期注释')]),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                dbc.Label('注释类型'),
                                dcc.Dropdown(
                                    id='note-type',
                                    options=[
                                        {'label': '备注', 'value': 'remark'},
                                        {'label': '催缴记录', 'value': 'collection'},
                                        {'label': '协商结果', 'value': 'negotiation'},
                                        {'label': '法律通知', 'value': 'legal'},
                                        {'label': '已解决', 'value': 'resolved'},
                                    ],
                                    value='remark',
                                    className='mb-3',
                                ),
                            ], width=4),
                            dbc.Col([
                                dbc.Label('注释内容'),
                                dbc.Textarea(id='note-content', placeholder='请输入注释内容...',
                                             className='mb-3', rows=3),
                            ], width=6),
                            dbc.Col([
                                dbc.Label('操作'),
                                dbc.Button('提交注释', id='submit-note-btn', color='danger',
                                           className='w-100 mt-4'),
                            ], width=2, className='d-flex align-items-end'),
                        ]),
                        html.Div(id='note-submit-result', className='mt-2'),
                    ]),
                ]),
            ], width=12),
        ], className='mb-4'),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('📋 历史注释记录')]),
                    dbc.CardBody(id='note-history-container', children=[
                        html.Div('请选择上方表格中的合同查看注释记录',
                                 className='text-muted text-center py-4'),
                    ]),
                ]),
            ], width=12),
        ]),
    ]


def create_detail_tab():
    return [
        html.H4('🏡 出租率明细', className='mb-4 mt-3',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dbc.Label('项目筛选'),
                dcc.Dropdown(id='detail-project-filter', multi=True,
                             placeholder='选择项目（可多选）', className='mb-3'),
            ], width=4),
            dbc.Col([
                dbc.Label('区域筛选'),
                dcc.Dropdown(id='detail-district-filter', multi=True,
                             placeholder='选择区域（可多选）', className='mb-3'),
            ], width=4),
            dbc.Col([
                dbc.Label('出租状态'),
                dcc.Dropdown(
                    id='detail-status-filter',
                    options=[
                        {'label': '全部', 'value': 'all'},
                        {'label': '已出租', 'value': '已出租'},
                        {'label': '空闲', 'value': '空闲'},
                    ],
                    value='all',
                    className='mb-3',
                ),
            ], width=4),
        ]),
        dbc.Row([
            dbc.Col([
                dash_table.DataTable(
                    id='occupancy-detail-table',
                    columns=[
                        {'name': '房源编号', 'id': 'property_id'},
                        {'name': '项目名称', 'id': 'project_name'},
                        {'name': '区域', 'id': 'district'},
                        {'name': '楼栋', 'id': 'building'},
                        {'name': '房号', 'id': 'unit_no'},
                        {'name': '户型', 'id': 'room_type'},
                        {'name': '面积(㎡)', 'id': 'area'},
                        {'name': '上架状态', 'id': 'listing_status'},
                        {'name': '出租状态', 'id': 'occupancy_status'},
                        {'name': '合同编号', 'id': 'contract_no'},
                        {'name': '月租金(元)', 'id': 'monthly_rent'},
                        {'name': '租约起', 'id': 'start_date'},
                        {'name': '租约止', 'id': 'end_date'},
                        {'name': '租客姓名', 'id': 'tenant_name'},
                        {'name': '联系电话', 'id': 'tenant_phone'},
                    ],
                    page_size=20,
                    filter_action='native',
                    sort_action='native',
                    sort_mode='multi',
                    export_format='xlsx',
                    style_table={'overflowX': 'auto'},
                    style_header={'backgroundColor': '#3498db', 'color': 'white', 'fontWeight': 'bold'},
                    style_cell={'textAlign': 'center', 'padding': '8px', 'fontSize': '12px'},
                    style_data_conditional=[
                        {
                            'if': {'filter_query': '{occupancy_status} = "已出租"'},
                            'backgroundColor': '#d4edda',
                        },
                        {
                            'if': {'filter_query': '{occupancy_status} = "空闲"'},
                            'backgroundColor': '#f8d7da',
                        },
                    ],
                ),
            ], width=12),
        ]),
        dbc.Row([
            dbc.Col([
                html.Div(id='detail-summary', className='mt-4 p-3 bg-light rounded'),
            ], width=12),
        ]),
    ]


def create_import_tab():
    return [
        html.H4('📥 数据导入（批次追踪）', className='mb-4 mt-3',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('1️⃣ CRM房源数据')]),
                    dbc.CardBody([
                        dcc.Upload(
                            id='upload-crm-property',
                            children=html.Div(['拖拽或点击选择文件 (支持 xlsx, csv)']),
                            style={
                                'width': '100%', 'height': '80px', 'lineHeight': '80px',
                                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '8px',
                                'textAlign': 'center', 'margin': '5px', 'cursor': 'pointer',
                                'backgroundColor': '#f0f8ff',
                            },
                            multiple=False,
                        ),
                        html.Div(id='crm-prop-upload-status', className='mt-2 small'),
                    ]),
                ]),
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('2️⃣ CRM租客档案')]),
                    dbc.CardBody([
                        dcc.Upload(
                            id='upload-crm-tenant',
                            children=html.Div(['拖拽或点击选择文件 (支持 xlsx, csv)']),
                            style={
                                'width': '100%', 'height': '80px', 'lineHeight': '80px',
                                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '8px',
                                'textAlign': 'center', 'margin': '5px', 'cursor': 'pointer',
                                'backgroundColor': '#f0fff0',
                            },
                            multiple=False,
                        ),
                        html.Div(id='crm-tenant-upload-status', className='mt-2 small'),
                    ]),
                ]),
            ], width=6),
        ], className='mb-4'),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('3️⃣ 电子合同（合并至房源/租客）')]),
                    dbc.CardBody([
                        dcc.Upload(
                            id='upload-contract',
                            children=html.Div(['拖拽或点击选择文件']),
                            style={
                                'width': '100%', 'height': '80px', 'lineHeight': '80px',
                                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '8px',
                                'textAlign': 'center', 'margin': '5px', 'cursor': 'pointer',
                                'backgroundColor': '#fff8dc',
                            },
                            multiple=False,
                        ),
                        html.Div(id='contract-upload-status', className='mt-2 small'),
                    ]),
                ]),
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('4️⃣ 抄表表格')]),
                    dbc.CardBody([
                        dcc.Upload(
                            id='upload-meter',
                            children=html.Div(['拖拽或点击选择文件']),
                            style={
                                'width': '100%', 'height': '80px', 'lineHeight': '80px',
                                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '8px',
                                'textAlign': 'center', 'margin': '5px', 'cursor': 'pointer',
                                'backgroundColor': '#f5f5dc',
                            },
                            multiple=False,
                        ),
                        html.Div(id='meter-upload-status', className='mt-2 small'),
                    ]),
                ]),
            ], width=6),
        ], className='mb-4'),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([html.Strong('5️⃣ 维修记录')]),
                    dbc.CardBody([
                        dcc.Upload(
                            id='upload-repair',
                            children=html.Div(['拖拽或点击选择文件']),
                            style={
                                'width': '100%', 'height': '80px', 'lineHeight': '80px',
                                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '8px',
                                'textAlign': 'center', 'margin': '5px', 'cursor': 'pointer',
                                'backgroundColor': '#ffe4e1',
                            },
                            multiple=False,
                        ),
                        html.Div(id='repair-upload-status', className='mt-2 small'),
                    ]),
                ]),
            ], width=12),
        ], className='mb-4'),

        html.Hr(),
        html.H4('📜 导入批次历史', className='mb-4 mt-4',
                style={'color': '#2c3e50', 'borderLeft': '4px solid #3498db', 'paddingLeft': '12px'}),
        dash_table.DataTable(
            id='batch-history-table',
            columns=[
                {'name': '批次号', 'id': 'batch_no'},
                {'name': '类型', 'id': 'batch_type'},
                {'name': '源文件', 'id': 'source_file'},
                {'name': '总数', 'id': 'total'},
                {'name': '成功', 'id': 'success'},
                {'name': '失败', 'id': 'failed'},
                {'name': '状态', 'id': 'status'},
                {'name': '错误信息', 'id': 'error'},
                {'name': '开始时间', 'id': 'started_at'},
                {'name': '完成时间', 'id': 'completed_at'},
            ],
            page_size=15,
            sort_action='native',
            style_table={'overflowX': 'auto'},
            style_header={'backgroundColor': '#2c3e50', 'color': 'white', 'fontWeight': 'bold'},
            style_cell={'textAlign': 'center', 'padding': '8px', 'fontSize': '12px'},
            style_data_conditional=[
                {'if': {'column_id': 'status', 'filter_query': '{status} = "completed"'},
                 'color': '#27ae60', 'fontWeight': 'bold'},
                {'if': {'column_id': 'status', 'filter_query': '{status} = "failed"'},
                 'color': '#e74c3c', 'fontWeight': 'bold'},
                {'if': {'column_id': 'status', 'filter_query': '{status} = "processing"'},
                 'color': '#f39c12', 'fontWeight': 'bold'},
            ],
        ),
        dcc.Interval(id='refresh-batch-interval', interval=5000, n_intervals=0),
    ]


def create_main_layout():
    user = get_current_dash_user()
    is_mgr = is_manager(user)

    tabs = []
    if is_mgr:
        tabs.append(dcc.Tab(label='📊 总览', value='overview'))
        tabs.append(dcc.Tab(label='📈 分析区', value='analytics'))
        tabs.append(dcc.Tab(label='⚠️ 租金逾期', value='overdue'))
        tabs.append(dcc.Tab(label='🏡 出租率明细', value='detail'))
        tabs.append(dcc.Tab(label='📥 数据导入', value='import'))
    else:
        tabs.append(dcc.Tab(label='🏡 出租率明细', value='detail'))
        tabs.append(dcc.Tab(label='⚠️ 租金逾期', value='overdue'))

    return dbc.Container([
        create_navbar(),
        html.Div(id='user-storage', style={'display': 'none'}),
        dcc.Store(id='refresh-trigger', data=0),
        dcc.Tabs(id='main-tabs', value='overview' if is_mgr else 'detail',
                 children=tabs, className='mt-4 custom-tabs'),
        html.Div(id='tab-content', className='mt-4'),
    ], fluid=True, style={'backgroundColor': '#f5f7fa', 'minHeight': '100vh', 'paddingBottom': '40px'})
