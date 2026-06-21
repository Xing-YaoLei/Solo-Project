import dash
from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc
from datetime import datetime, timedelta


def get_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("🚴 跑腿订单风险监测系统", className="text-primary"),
                html.P("本地跑腿即时下单风险监测与复盘分析平台", className="text-muted")
            ], width=9),
            dbc.Col([
                html.Div([
                    html.Small("数据更新时间:", className="text-muted"),
                    html.Div(id='last-update-time', className="text-success font-weight-bold")
                ], className="text-right")
            ], width=3)
        ]),
        
        html.Hr(),
        
        dcc.Tabs(id='main-tabs', value='overview', children=[
            dcc.Tab(label='📊 总览指标', value='overview'),
            dcc.Tab(label='📍 订单地址分析', value='order-map'),
            dcc.Tab(label='🛤️ 骑手轨迹分析', value='trajectory'),
            dcc.Tab(label='💰 补贴规则分析', value='subsidy'),
            dcc.Tab(label='⚠️ 预警阈值配置', value='thresholds'),
            dcc.Tab(label='📋 拒单复盘分析', value='review'),
        ]),
        
        html.Div(id='tab-content'),
        
        dcc.Interval(
            id='interval-component',
            interval=60 * 1000,
            n_intervals=0
        ),
        
        dcc.Store(id='filtered-data-store'),
        dcc.Store(id='date-range-store'),
    ], fluid=True)


def get_overview_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.Label("选择时间范围:"),
                dcc.Dropdown(
                    id='time-range-dropdown',
                    options=[
                        {'label': '今日', 'value': 'today'},
                        {'label': '昨日', 'value': 'yesterday'},
                        {'label': '近7天', 'value': '7days'},
                        {'label': '近30天', 'value': '30days'},
                        {'label': '自定义', 'value': 'custom'}
                    ],
                    value='today',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label("开始日期:"),
                dcc.DatePickerSingle(
                    id='start-date-picker',
                    date=(datetime.now() - timedelta(days=7)).date(),
                    display_format='YYYY-MM-DD',
                    disabled=True
                )
            ], width=3),
            dbc.Col([
                html.Label("结束日期:"),
                dcc.DatePickerSingle(
                    id='end-date-picker',
                    date=datetime.now().date(),
                    display_format='YYYY-MM-DD',
                    disabled=True
                )
            ], width=3),
            dbc.Col([
                html.Label(" "),
                html.Button(
                    '🔄 刷新数据',
                    id='refresh-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        html.H4("📈 核心指标 (第一层)", className="text-info"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("总订单量", className="card-title"),
                        html.H2(id='total-orders', className="text-primary"),
                        html.P(id='total-orders-change', className="text-success small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("完成订单", className="card-title"),
                        html.H2(id='completed-orders', className="text-success"),
                        html.P(id='completion-rate', className="text-success small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("取消订单", className="card-title"),
                        html.H2(id='cancelled-orders', className="text-warning"),
                        html.P(id='cancel-rate', className="text-warning small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("风险订单", className="card-title"),
                        html.H2(id='risk-orders', className="text-danger"),
                        html.P(id='risk-rate', className="text-danger small")
                    ])
                ], color="light")
            ], width=3)
        ]),
        
        html.Br(),
        
        html.H4("💰 财务指标 (第二层)", className="text-info"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("总交易额", className="card-title"),
                        html.H3(id='total-revenue', className="text-primary"),
                        html.P("元", className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("总补贴金额", className="card-title"),
                        html.H3(id='total-subsidy', className="text-warning"),
                        html.P(id='subsidy-per-order', className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("拒单赔付总额", className="card-title"),
                        html.H3(id='total-compensation', className="text-danger"),
                        html.P(id='compensation-per-rejection', className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("客单价", className="card-title"),
                        html.H3(id='avg-order-value', className="text-info"),
                        html.P("元/单", className="text-muted small")
                    ])
                ], color="light")
            ], width=3)
        ]),
        
        html.Br(),
        
        html.H4("⚡ 运营效率指标 (第三层)", className="text-info"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("平均配送时长", className="card-title"),
                        html.H3(id='avg-delivery-time', className="text-primary"),
                        html.P("分钟", className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("配送时长P95", className="card-title"),
                        html.H3(id='delivery-p95', className="text-warning"),
                        html.P("分钟", className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("拒单率", className="card-title"),
                        html.H3(id='rejection-rate', className="text-danger"),
                        html.P(id='rejection-count', className="text-muted small")
                    ])
                ], color="light")
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("预警数量", className="card-title"),
                        html.H3(id='alert-count', className="text-danger"),
                        html.P(id='unhandled-alerts', className="text-muted small")
                    ])
                ], color="light")
            ], width=3)
        ]),
        
        html.Br(),
        
        html.H4("📊 趋势分析 (第四层)", className="text-info"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("订单量趋势"),
                    dbc.CardBody([
                        dcc.Graph(id='order-trend-chart')
                    ])
                ])
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("配送时长分布"),
                    dbc.CardBody([
                        dcc.Graph(id='delivery-time-chart')
                    ])
                ])
            ], width=6)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("订单类型分布"),
                    dbc.CardBody([
                        dcc.Graph(id='order-type-chart')
                    ])
                ])
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("24小时订单分布"),
                    dbc.CardBody([
                        dcc.Graph(id='hourly-distribution-chart')
                    ])
                ])
            ], width=6)
        ]),
        
        html.Br(),
        
        html.H4("⚠️ 实时预警", className="text-info"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        dash_table.DataTable(
                            id='alerts-table',
                            columns=[
                                {'name': '时间', 'id': 'alert_time'},
                                {'name': '级别', 'id': 'alert_level'},
                                {'name': '类型', 'id': 'alert_type'},
                                {'name': '消息', 'id': 'alert_message'},
                                {'name': '状态', 'id': 'is_handled'}
                            ],
                            page_size=10,
                            style_table={'overflowX': 'auto'},
                            style_header={
                                'backgroundColor': 'rgb(230, 230, 230)',
                                'fontWeight': 'bold'
                            },
                            style_data_conditional=[
                                {
                                    'if': {'filter_query': '{alert_level} = "critical"'},
                                    'backgroundColor': '#ffebee',
                                    'color': 'crimson'
                                },
                                {
                                    'if': {'filter_query': '{alert_level} = "warning"'},
                                    'backgroundColor': '#fff8e1',
                                    'color': '#ff8f00'
                                }
                            ]
                        )
                    ])
                ])
            ], width=12)
        ])
    ])


def get_order_map_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.Label("订单状态:"),
                dcc.Dropdown(
                    id='order-status-filter',
                    options=[
                        {'label': '全部', 'value': 'all'},
                        {'label': '已完成', 'value': 'delivered'},
                        {'label': '已取消', 'value': 'cancelled'},
                        {'label': '风险订单', 'value': 'risk'}
                    ],
                    value='all',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label("订单类型:"),
                dcc.Dropdown(
                    id='order-type-filter',
                    options=[
                        {'label': '全部', 'value': 'all'},
                        {'label': '餐饮外卖', 'value': 'food_delivery'},
                        {'label': '快递', 'value': 'express_delivery'},
                        {'label': '其他', 'value': 'other'}
                    ],
                    value='all',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label("地图类型:"),
                dcc.Dropdown(
                    id='map-type-filter',
                    options=[
                        {'label': '散点图', 'value': 'scatter'},
                        {'label': '热力图', 'value': 'heatmap'},
                        {'label': '密度图', 'value': 'density'}
                    ],
                    value='scatter',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label(" "),
                html.Button(
                    '🔄 刷新地图',
                    id='refresh-map-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📍 订单地址分布地图"),
                    dbc.CardBody([
                        dcc.Graph(id='order-address-map', style={'height': '600px'})
                    ])
                ])
            ], width=12)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📋 订单详情列表"),
                    dbc.CardBody([
                        dash_table.DataTable(
                            id='order-detail-table',
                            columns=[
                                {'name': '订单号', 'id': 'order_no'},
                                {'name': '类型', 'id': 'order_type'},
                                {'name': '状态', 'id': 'order_status'},
                                {'name': '取货地址', 'id': 'pickup_address'},
                                {'name': '送货地址', 'id': 'delivery_address'},
                                {'name': '距离(km)', 'id': 'distance_km'},
                                {'name': '金额(元)', 'id': 'actual_amount'},
                                {'name': '创建时间', 'id': 'create_time'}
                            ],
                            page_size=15,
                            style_table={'overflowX': 'auto'},
                            style_header={
                                'backgroundColor': 'rgb(230, 230, 230)',
                                'fontWeight': 'bold'
                            }
                        )
                    ])
                ])
            ], width=12)
        ])
    ])


def get_trajectory_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.Label("骑手ID:"),
                dcc.Input(
                    id='rider-id-input',
                    type='text',
                    placeholder='输入骑手ID',
                    className='form-control'
                )
            ], width=3),
            dbc.Col([
                html.Label("订单ID:"),
                dcc.Input(
                    id='traj-order-id-input',
                    type='text',
                    placeholder='输入订单ID',
                    className='form-control'
                )
            ], width=3),
            dbc.Col([
                html.Label("时间范围:"),
                dcc.Dropdown(
                    id='traj-time-range',
                    options=[
                        {'label': '近1小时', 'value': '1h'},
                        {'label': '近3小时', 'value': '3h'},
                        {'label': '近6小时', 'value': '6h'},
                        {'label': '近24小时', 'value': '24h'}
                    ],
                    value='3h',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label(" "),
                html.Button(
                    '🔍 查询轨迹',
                    id='search-trajectory-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("🛤️ 骑手轨迹地图"),
                    dbc.CardBody([
                        dcc.Graph(id='trajectory-map', style={'height': '500px'})
                    ])
                ])
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📊 骑手运行指标"),
                    dbc.CardBody([
                        html.Div(id='rider-metrics'),
                        html.Hr(),
                        html.H6("速度变化曲线"),
                        dcc.Graph(id='speed-chart', style={'height': '200px'})
                    ])
                ])
            ], width=4)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📋 轨迹点详情"),
                    dbc.CardBody([
                        dash_table.DataTable(
                            id='trajectory-detail-table',
                            columns=[
                                {'name': '时间', 'id': 'record_time'},
                                {'name': '经度', 'id': 'lng'},
                                {'name': '纬度', 'id': 'lat'},
                                {'name': '速度(km/h)', 'id': 'speed_kmh'},
                                {'name': '方向', 'id': 'heading'},
                                {'name': '精度(m)', 'id': 'accuracy_m'}
                            ],
                            page_size=10,
                            style_table={'overflowX': 'auto'},
                            style_header={
                                'backgroundColor': 'rgb(230, 230, 230)',
                                'fontWeight': 'bold'
                            }
                        )
                    ])
                ])
            ], width=12)
        ])
    ])


def get_subsidy_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.Label("补贴类型:"),
                dcc.Dropdown(
                    id='subsidy-type-filter',
                    options=[
                        {'label': '全部', 'value': 'all'},
                        {'label': '新用户补贴', 'value': 'new_user'},
                        {'label': '高峰时段补贴', 'value': 'peak_hour'},
                        {'label': '距离补贴', 'value': 'distance'},
                        {'label': '恶劣天气补贴', 'value': 'bad_weather'}
                    ],
                    value='all',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label("时间范围:"),
                dcc.Dropdown(
                    id='subsidy-time-range',
                    options=[
                        {'label': '今日', 'value': 'today'},
                        {'label': '近7天', 'value': '7days'},
                        {'label': '近30天', 'value': '30days'}
                    ],
                    value='7days',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label(" "),
                html.Button(
                    '🔄 刷新数据',
                    id='refresh-subsidy-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("补贴总金额", className="card-title"),
                        html.H2(id='subsidy-total-amount', className="text-warning"),
                        html.P("元", className="text-muted")
                    ])
                ])
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("补贴订单数", className="card-title"),
                        html.H2(id='subsidy-order-count', className="text-primary"),
                        html.P("单", className="text-muted")
                    ])
                ])
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("单均补贴", className="card-title"),
                        html.H2(id='subsidy-avg-per-order', className="text-info"),
                        html.P("元/单", className="text-muted")
                    ])
                ])
            ], width=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5("补贴占营收比", className="card-title"),
                        html.H2(id='subsidy-ratio', className="text-danger"),
                        html.P("%", className="text-muted")
                    ])
                ])
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📈 补贴金额趋势"),
                    dbc.CardBody([
                        dcc.Graph(id='subsidy-trend-chart')
                    ])
                ])
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("🍰 补贴类型分布"),
                    dbc.CardBody([
                        dcc.Graph(id='subsidy-type-chart')
                    ])
                ])
            ], width=6)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📋 补贴规则列表"),
                    dbc.CardBody([
                        dash_table.DataTable(
                            id='subsidy-rules-table',
                            columns=[
                                {'name': '规则名称', 'id': 'rule_name'},
                                {'name': '类型', 'id': 'rule_type'},
                                {'name': '生效时间', 'id': 'effective_start'},
                                {'name': '失效时间', 'id': 'effective_end'},
                                {'name': '单笔最高(元)', 'id': 'max_subsidy_per_order'},
                                {'name': '每日限额(元)', 'id': 'daily_quota'},
                                {'name': '已使用(元)', 'id': 'used_amount'},
                                {'name': '状态', 'id': 'is_active'}
                            ],
                            page_size=10,
                            style_table={'overflowX': 'auto'},
                            style_header={
                                'backgroundColor': 'rgb(230, 230, 230)',
                                'fontWeight': 'bold'
                            }
                        ])
                    ])
                ])
            ], width=12)
        ])
    ])


def get_thresholds_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H4("⚠️ 预警阈值配置"),
                html.P("业务人员可在此配置各项预警指标的阈值", className="text-muted")
            ], width=9),
            dbc.Col([
                html.Button(
                    '➕ 新增阈值',
                    id='add-threshold-btn',
                    className='btn btn-success btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Card([
            dbc.CardHeader("🔧 阈值配置列表"),
            dbc.CardBody([
                dash_table.DataTable(
                    id='thresholds-table',
                    columns=[
                        {'name': '指标编码', 'id': 'metric_code', 'editable': False},
                        {'name': '指标名称', 'id': 'metric_name', 'editable': True},
                        {'name': '类别', 'id': 'metric_category', 'editable': True},
                        {'name': '预警级别', 'id': 'warning_level', 'editable': True,
                         'presentation': 'dropdown'},
                        {'name': '操作符', 'id': 'operator', 'editable': True,
                         'presentation': 'dropdown'},
                        {'name': '阈值', 'id': 'threshold_value', 'editable': True},
                        {'name': '单位', 'id': 'unit', 'editable': True},
                        {'name': '描述', 'id': 'description', 'editable': True},
                        {'name': '状态', 'id': 'is_active', 'editable': True,
                         'presentation': 'dropdown'},
                        {'name': '更新时间', 'id': 'updated_at', 'editable': False}
                    ],
                    data=[],
                    editable=True,
                    row_deletable=True,
                    page_size=15,
                    style_table={'overflowX': 'auto'},
                    style_header={
                        'backgroundColor': 'rgb(230, 230, 230)',
                        'fontWeight': 'bold'
                    },
                    dropdown={
                        'warning_level': {
                            'options': [
                                {'label': '信息', 'value': 'info'},
                                {'label': '警告', 'value': 'warning'},
                                {'label': '严重', 'value': 'critical'}
                            ]
                        },
                        'operator': {
                            'options': [
                                {'label': '>', 'value': '>'},
                                {'label': '>=', 'value': '>='},
                                {'label': '<', 'value': '<'},
                                {'label': '<=', 'value': '<='},
                                {'label': '==', 'value': '=='},
                                {'label': '!=', 'value': '!='}
                            ]
                        },
                        'is_active': {
                            'options': [
                                {'label': '启用', 'value': True},
                                {'label': '禁用', 'value': False}
                            ]
                        }
                    }
                )
            ])
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                html.Button(
                    '💾 保存修改',
                    id='save-thresholds-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Div(id='threshold-save-status', className='mt-3')
    ])


def get_review_layout():
    return html.Div([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.Label("复盘类型:"),
                dcc.Dropdown(
                    id='review-type-dropdown',
                    options=[
                        {'label': '日报', 'value': 'daily'},
                        {'label': '周报', 'value': 'weekly'},
                        {'label': '骑手复盘', 'value': 'rider'}
                    ],
                    value='daily',
                    clearable=False
                )
            ], width=3),
            dbc.Col([
                html.Label("骑手ID:"),
                dcc.Input(
                    id='review-rider-id',
                    type='text',
                    placeholder='复盘类型选"骑手复盘"时填写',
                    className='form-control',
                    disabled=True
                )
            ], width=3),
            dbc.Col([
                html.Label("开始日期:"),
                dcc.DatePickerSingle(
                    id='review-start-date',
                    date=(datetime.now() - timedelta(days=7)).date(),
                    display_format='YYYY-MM-DD'
                )
            ], width=3),
            dbc.Col([
                html.Label("结束日期:"),
                dcc.DatePickerSingle(
                    id='review-end-date',
                    date=datetime.now().date(),
                    display_format='YYYY-MM-DD'
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                html.Button(
                    '📊 生成复盘材料',
                    id='generate-review-btn',
                    className='btn btn-primary btn-block',
                    n_clicks=0
                )
            ], width=3),
            dbc.Col([
                html.Button(
                    '📋 查看历史复盘',
                    id='view-history-review-btn',
                    className='btn btn-secondary btn-block',
                    n_clicks=0
                )
            ], width=3)
        ]),
        
        html.Br(),
        
        html.Div(id='review-content'),
        
        html.Br(),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("📚 历史复盘记录"),
                    dbc.CardBody([
                        dash_table.DataTable(
                            id='review-history-table',
                            columns=[
                                {'name': '复盘ID', 'id': 'review_id'},
                                {'name': '类型', 'id': 'review_type'},
                                {'name': '骑手ID', 'id': 'rider_id'},
                                {'name': '开始日期', 'id': 'start_date'},
                                {'name': '结束日期', 'id': 'end_date'},
                                {'name': '总订单', 'id': 'total_orders'},
                                {'name': '拒单数', 'id': 'rejection_count'},
                                {'name': '拒单率', 'id': 'rejection_rate'},
                                {'name': '赔付总额', 'id': 'total_compensation'},
                                {'name': '创建时间', 'id': 'created_at'}
                            ],
                            page_size=10,
                            style_table={'overflowX': 'auto'},
                            style_header={
                                'backgroundColor': 'rgb(230, 230, 230)',
                                'fontWeight': 'bold'
                            },
                            row_selectable='single'
                        )
                    ])
                ])
            ], width=12)
        ])
    ])
