from datetime import date, timedelta
import dash_bootstrap_components as dbc
from dash import dcc, html
from data.queries import DataQueryService


def _load_initial_data():
    with DataQueryService() as svc:
        configs = svc.get_threshold_config()
        threshold_data = {}
        for c in configs:
            threshold_data[c['config_key']] = c['config_value']

        versions = svc.get_caliber_versions()
        caliber_versions = {}
        active_version = 'v1.0'
        for v in versions:
            if v['is_active']:
                active_version = v['version_code']
            caliber_versions[v['version_code']] = {
                'name': v['version_name'],
                'description': v['description'],
                'formula': v['definition_formula'],
                'change_reason': v['change_reason'],
                'effective_date': v['effective_date'].isoformat() if v['effective_date'] else '',
                'is_active': v['is_active']
            }

        caliber_data = {
            'active': active_version,
            'versions': caliber_versions
        }

    return threshold_data, caliber_data


def create_header():
    return dbc.NavbarSimple(
        children=[
            dbc.NavItem(dbc.NavLink("数据概览", href="#overview", id="nav-overview")),
            dbc.NavItem(dbc.NavLink("车辆档案", href="#vehicles", id="nav-vehicles")),
            dbc.NavItem(dbc.NavLink("诊断结果", href="#diagnosis", id="nav-diagnosis")),
            dbc.NavItem(dbc.NavLink("工单项目", href="#orders", id="nav-orders")),
            dbc.NavItem(dbc.NavLink("返修分析", href="#rework", id="nav-rework")),
            dbc.NavItem(dbc.NavLink("配件复盘", href="#parts", id="nav-parts")),
            dbc.NavItem(dbc.NavLink("阈值配置", href="#thresholds", id="nav-thresholds")),
        ],
        brand="汽车维修预约进厂趋势看板",
        brand_href="#",
        color="primary",
        dark=True,
        className="mb-4",
    )


def create_date_filter():
    end_date = date.today()
    start_date = end_date - timedelta(days=90)
    return dbc.Card(
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("时间范围选择", className="fw-bold"),
                    dcc.DatePickerRange(
                        id='date-range-picker',
                        start_date=start_date,
                        end_date=end_date,
                        display_format='YYYY-MM-DD',
                        className="mt-2"
                    ),
                ], width=4),
                dbc.Col([
                    html.Label("快速选择", className="fw-bold"),
                    dbc.ButtonGroup([
                        dbc.Button("近7天", id="btn-7d", color="secondary", size="sm", className="mt-2"),
                        dbc.Button("近30天", id="btn-30d", color="secondary", size="sm", className="mt-2"),
                        dbc.Button("近90天", id="btn-90d", color="primary", size="sm", className="mt-2"),
                    ]),
                ], width=4),
                dbc.Col([
                    html.Label("数据刷新", className="fw-bold"),
                    html.Div([
                        dbc.Button("刷新数据", id="btn-refresh", color="success", size="sm", className="mt-2"),
                        dcc.Interval(
                            id='interval-component',
                            interval=5 * 60 * 1000,
                            n_intervals=0
                        )
                    ]),
                ], width=4),
            ])
        ]),
        className="mb-4"
    )


def create_kpi_cards():
    return dbc.Row([
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H6("预约进厂量", className="card-subtitle text-muted"),
                html.H3(id="kpi-appointments", className="card-title mt-2 text-primary"),
                html.P(id="kpi-appointments-trend", className="card-text small text-success"),
            ])
        ], className="shadow-sm"), width=3),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H6("预约到店率", className="card-subtitle text-muted"),
                html.H3(id="kpi-arrival-rate", className="card-title mt-2 text-info"),
                html.P(id="kpi-arrival-trend", className="card-text small text-success"),
            ])
        ], className="shadow-sm"), width=3),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H6("返修率", className="card-subtitle text-muted"),
                html.H3(id="kpi-rework-rate", className="card-title mt-2 text-warning"),
                html.P(id="kpi-rework-trend", className="card-text small"),
            ])
        ], className="shadow-sm"), width=3),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H6("配件缺货率", className="card-subtitle text-muted"),
                html.H3(id="kpi-shortage-rate", className="card-title mt-2 text-danger"),
                html.P(id="kpi-shortage-trend", className="card-text small"),
            ])
        ], className="shadow-sm"), width=3),
    ], className="mb-4")


def create_overview_tab():
    return dbc.Card([
        dbc.CardHeader([
            html.H5("预约进厂趋势", className="mb-0"),
        ]),
        dbc.CardBody([
            dcc.Graph(id='appointment-trend-chart', style={'height': '400px'}),
        ]),
    ], className="mb-4")


def create_vehicles_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("车辆档案分析", className="mb-0"), width=6),
                dbc.Col(
                    dbc.Button("查看明细", id="btn-vehicle-detail", color="link", size="sm"),
                    width=6, className="text-end"
                ),
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.H6("品牌分布", className="text-center"),
                    dcc.Graph(id='vehicle-brand-chart', style={'height': '350px'}),
                ], width=6),
                dbc.Col([
                    html.H6("车龄分布", className="text-center"),
                    dcc.Graph(id='vehicle-age-chart', style={'height': '350px'}),
                ], width=6),
            ]),
            html.Hr(),
            html.Div(id='vehicle-detail-section', style={'display': 'none'}, children=[
                html.H6("车辆明细表"),
                html.Div(id='vehicle-detail-table'),
            ]),
        ]),
    ], className="mb-4")


def create_diagnosis_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("诊断结果分析", className="mb-0"), width=6),
                dbc.Col(
                    dbc.Button("查看明细", id="btn-diagnosis-detail", color="link", size="sm"),
                    width=6, className="text-end"
                ),
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.H6("故障类别分布", className="text-center"),
                    dcc.Graph(id='diagnosis-category-chart', style={'height': '350px'}),
                ], width=6),
                dbc.Col([
                    html.H6("严重程度分布", className="text-center"),
                    dcc.Graph(id='diagnosis-severity-chart', style={'height': '350px'}),
                ], width=6),
            ]),
            html.Hr(),
            html.Div(id='diagnosis-detail-section', style={'display': 'none'}, children=[
                html.H6("诊断明细表"),
                html.Div(id='diagnosis-detail-table'),
            ]),
        ]),
    ], className="mb-4")


def create_insurance_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("保险材料分析", className="mb-0"), width=6),
                dbc.Col([
                    html.Span(id='insurance-kpi', className="text-muted"),
                    dbc.Button("查看明细", id="btn-insurance-detail", color="link", size="sm", className="ms-3"),
                ], width=6, className="text-end"),
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.H6("保险公司分布", className="text-center"),
                    dcc.Graph(id='insurance-company-chart', style={'height': '350px'}),
                ], width=4),
                dbc.Col([
                    html.H6("损伤类型分布", className="text-center"),
                    dcc.Graph(id='insurance-damage-chart', style={'height': '350px'}),
                ], width=4),
                dbc.Col([
                    html.H6("理赔状态分布", className="text-center"),
                    dcc.Graph(id='insurance-status-chart', style={'height': '350px'}),
                ], width=4),
            ]),
            html.Hr(),
            html.Div(id='insurance-detail-section', style={'display': 'none'}, children=[
                html.H6("保险材料明细表"),
                html.Div(id='insurance-detail-table'),
            ]),
        ]),
    ], className="mb-4")


def create_orders_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("工单项目分析", className="mb-0"), width=6),
                dbc.Col(
                    dbc.Button("查看明细", id="btn-order-detail", color="link", size="sm"),
                    width=6, className="text-end"
                ),
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.H6("工单类型分布", className="text-center"),
                    dcc.Graph(id='order-type-chart', style={'height': '350px'}),
                ], width=6),
                dbc.Col([
                    html.H6("项目金额排行", className="text-center"),
                    dcc.Graph(id='order-amount-chart', style={'height': '350px'}),
                ], width=6),
            ]),
            html.Hr(),
            html.Div(id='order-detail-section', style={'display': 'none'}, children=[
                html.H6("工单明细表"),
                html.Div(id='order-detail-table'),
            ]),
        ]),
    ], className="mb-4")


def create_rework_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("返修率分析", className="mb-0"), width=8),
                dbc.Col([
                    html.Label("口径版本:", className="small me-2"),
                    dcc.Dropdown(
                        id='caliber-version-selector',
                        options=[
                            {'label': 'v1.0 - 基础口径', 'value': 'v1.0'},
                            {'label': 'v1.1 - 扩大口径', 'value': 'v1.1'},
                        ],
                        value='v1.0',
                        clearable=False,
                        className="d-inline-block",
                        style={'width': '200px'}
                    ),
                ], width=4, className="text-end"),
            ])
        ]),
        dbc.CardBody([
            dbc.Alert(
                id='caliber-info-alert',
                color="info",
                is_open=True,
                className="mb-3"
            ),
            dbc.Row([
                dbc.Col([
                    html.H6("返修率趋势", className="text-center"),
                    dcc.Graph(id='rework-trend-chart', style={'height': '350px'}),
                ], width=7),
                dbc.Col([
                    html.H6("返修原因分布", className="text-center"),
                    dcc.Graph(id='rework-reason-chart', style={'height': '350px'}),
                ], width=5),
            ]),
            html.Hr(),
            html.H6("口径版本对比"),
            dcc.Graph(id='caliber-compare-chart', style={'height': '300px'}),
            html.Hr(),
            html.H6("返修工单明细"),
            html.Div(id='rework-detail-table'),
        ]),
    ], className="mb-4")


def create_parts_tab():
    return dbc.Card([
        dbc.CardHeader([
            dbc.Row([
                dbc.Col(html.H5("配件缺货复盘", className="mb-0"), width=6),
                dbc.Col(
                    dbc.Button("生成复盘材料", id="btn-generate-review", color="primary", size="sm"),
                    width=6, className="text-end"
                ),
            ])
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.H6("缺货配件排行 TOP 10", className="text-center"),
                    dcc.Graph(id='parts-shortage-chart', style={'height': '350px'}),
                ], width=6),
                dbc.Col([
                    html.H6("缺货与返修关联", className="text-center"),
                    dcc.Graph(id='parts-rework-correlation-chart', style={'height': '350px'}),
                ], width=6),
            ]),
            html.Hr(),
            dbc.Card([
                dbc.CardHeader("复盘材料列表"),
                dbc.CardBody(id='review-materials-list'),
            ], className="mb-3"),
            html.Hr(),
            html.H6("缺货配件明细"),
            html.Div(id='parts-shortage-table'),
        ]),
    ], className="mb-4")


def create_thresholds_tab():
    return dbc.Card([
        dbc.CardHeader(html.H5("阈值配置", className="mb-0")),
        dbc.CardBody([
            html.P(
                "以下阈值支持业务人员自行调整，修改后即时生效。点击数值即可编辑。",
                className="text-muted small mb-3"
            ),
            dbc.Row(id='threshold-config-cards', className="g-3"),
        ]),
    ], className="mb-4")


def create_main_layout():
    try:
        threshold_data, caliber_data = _load_initial_data()
    except Exception as e:
        print(f"Warning: Failed to load initial data from DB: {e}")
        threshold_data = {
            'rework_rate_warning': '5',
            'rework_rate_critical': '8',
            'parts_shortage_rate': '3',
            'appointment_fill_rate': '85',
            'rework_window_days': '30',
            'safe_stock_days': '7',
        }
        caliber_data = {
            'active': 'v1.0',
            'versions': {
                'v1.0': {
                    'name': '基础口径',
                    'description': '同一车辆30天内同故障二次进厂计为返修',
                    'formula': '返修率 = 返修工单数 / 总工单数 × 100%',
                    'effective_date': '2024-01-01',
                    'change_reason': '初始版本',
                    'is_active': True,
                },
                'v1.1': {
                    'name': '扩大口径',
                    'description': '同一车辆60天内同类故障二次进厂计为返修，包含配件质量问题',
                    'formula': '返修率 = 返修工单数(60天同类故障) / 总工单数 × 100%',
                    'effective_date': '2024-06-01',
                    'change_reason': '扩大返修判定窗口，细化故障分类',
                    'is_active': False,
                },
            }
        }

    return dbc.Container([
        dcc.Store(id='threshold-store', data=threshold_data),
        dcc.Store(id='caliber-store', data=caliber_data),
        dbc.Toast(
            id="threshold-toast",
            header="操作成功",
            is_open=False,
            duration=3000,
            style={"position": "fixed", "top": 66, "right": 10, "width": 350, "zIndex": 9999},
        ),
        dbc.Toast(
            id="review-toast",
            header="复盘材料已生成",
            is_open=False,
            duration=3000,
            style={"position": "fixed", "top": 120, "right": 10, "width": 350, "zIndex": 9999},
        ),
        create_header(),
        create_date_filter(),
        create_kpi_cards(),

        dbc.Tabs([
            dbc.Tab(create_overview_tab(), label="数据概览", tab_id="overview"),
            dbc.Tab(create_vehicles_tab(), label="车辆档案", tab_id="vehicles"),
            dbc.Tab(create_diagnosis_tab(), label="诊断结果", tab_id="diagnosis"),
            dbc.Tab(create_insurance_tab(), label="保险材料", tab_id="insurance"),
            dbc.Tab(create_orders_tab(), label="工单项目", tab_id="orders"),
            dbc.Tab(create_rework_tab(), label="返修分析", tab_id="rework"),
            dbc.Tab(create_parts_tab(), label="配件复盘", tab_id="parts"),
            dbc.Tab(create_thresholds_tab(), label="阈值配置", tab_id="thresholds"),
        ], id="main-tabs", active_tab="overview"),

        html.Footer([
            html.P("汽车维修预约进厂趋势看板 · 数据每5分钟自动刷新",
                   className="text-center text-muted small mt-4")
        ]),
    ], fluid=True, className="py-3")
