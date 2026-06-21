from dash import html, dcc
import dash_bootstrap_components as dbc


def build_funnel_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("即时下单转化漏斗"),
                    dbc.CardBody([
                        dcc.Graph(id="funnel-chart", style={"height": "500px"}),
                    ]),
                ]),
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("漏斗指标"),
                    dbc.CardBody([
                        html.Div(id="funnel-metrics"),
                    ]),
                ]),
                html.Br(),
                dbc.Card([
                    dbc.CardHeader("流失原因分布"),
                    dbc.CardBody([
                        dcc.Graph(id="dropoff-reason-chart", style={"height": "250px"}),
                    ]),
                ]),
            ], width=4),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("漏斗明细"),
            dbc.CardBody([
                dbc.Table(id="funnel-detail-table", striped=True, bordered=True, hover=True, responsive=True),
            ]),
        ]),
    ], fluid=True)


def build_orders_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Label("订单状态"),
                dcc.Dropdown(
                    id="order-status-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "已完成", "value": "completed"},
                        {"label": "进行中", "value": "in_progress"},
                        {"label": "已拒单", "value": "rejected"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=3),
            dbc.Col([
                dbc.Label("支付状态"),
                dcc.Dropdown(
                    id="payment-status-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "已完成", "value": "completed"},
                        {"label": "待支付", "value": "pending"},
                        {"label": "流水缺失", "value": "missing"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=3),
            dbc.Col([
                dbc.Label("地图版本"),
                dcc.Dropdown(
                    id="map-version-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "v1", "value": "v1"},
                        {"label": "v1.1", "value": "v1.1"},
                        {"label": "v2.0", "value": "v2.0"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=3),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("订单地址分布"),
                    dbc.CardBody([
                        dcc.Graph(id="orders-map", style={"height": "500px"}),
                    ]),
                ]),
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("订单统计"),
                    dbc.CardBody([
                        html.Div(id="orders-stats"),
                    ]),
                ]),
            ], width=4),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("订单列表"),
            dbc.CardBody([
                dbc.Table(id="orders-table", striped=True, bordered=True, hover=True, responsive=True),
            ]),
        ]),
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("订单详情")),
            dbc.ModalBody(id="order-detail-body"),
            dbc.ModalFooter([
                dbc.Button("关闭", id="btn-close-order-detail", color="secondary", n_clicks=0),
            ]),
        ], id="order-detail-modal", is_open=False, size="lg"),
    ], fluid=True)


def build_tracks_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Label("选择骑手"),
                dcc.Dropdown(id="rider-dropdown", placeholder="选择骑手"),
            ], width=4),
            dbc.Col([
                dbc.Label("选择订单"),
                dcc.Dropdown(id="track-order-dropdown", placeholder="选择订单"),
            ], width=4),
            dbc.Col([
                html.Br(),
                dbc.Button("显示异常点", id="btn-toggle-anomalies", color="warning", outline=True, active=False),
            ], width="auto"),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("骑手轨迹地图"),
                    dbc.CardBody([
                        dcc.Graph(id="track-map", style={"height": "550px"}),
                    ]),
                ]),
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("轨迹统计"),
                    dbc.CardBody([
                        html.Div(id="track-stats"),
                    ]),
                ]),
                html.Br(),
                dbc.Card([
                    dbc.CardHeader("异常点列表"),
                    dbc.CardBody([
                        dbc.Table(id="anomaly-points-table", striped=True, bordered=True, hover=True, responsive=True, size="sm"),
                    ]),
                ]),
            ], width=4),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("轨迹明细"),
            dbc.CardBody([
                dbc.Table(id="track-detail-table", striped=True, bordered=True, hover=True, responsive=True, size="sm"),
            ]),
        ]),
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("轨迹异常点备注")),
            dbc.ModalBody([
                dbc.Label("备注内容"),
                dbc.Textarea(id="track-anomaly-note-input", rows=4, placeholder="请输入对该异常点的判断和备注..."),
                html.Br(),
                dbc.Label("判断标签"),
                dcc.Dropdown(
                    id="track-anomaly-judgment",
                    options=[
                        {"label": "定位漂移", "value": "gps_drift"},
                        {"label": "骑手停留", "value": "stopped"},
                        {"label": "路线偏离", "value": "detour"},
                        {"label": "信号异常", "value": "signal_error"},
                        {"label": "正常波动", "value": "normal"},
                        {"label": "待确认", "value": "pending"},
                    ],
                    value="pending",
                ),
            ]),
            dbc.ModalFooter([
                dbc.Button("取消", id="btn-cancel-track-note", color="secondary", n_clicks=0),
                dbc.Button("保存备注", id="btn-save-track-note", color="primary", n_clicks=0),
            ]),
        ], id="track-anomaly-modal", is_open=False),
    ], fluid=True)


def build_subsidy_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("补贴规则列表"),
                    dbc.CardBody([
                        dbc.Table(id="subsidy-rules-table", striped=True, bordered=True, hover=True, responsive=True),
                    ]),
                ]),
            ], width=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("补贴金额分布"),
                    dbc.CardBody([
                        dcc.Graph(id="subsidy-distribution-chart", style={"height": "300px"}),
                    ]),
                ]),
                html.Br(),
                dbc.Card([
                    dbc.CardHeader("赔付成本计算规则"),
                    dbc.CardBody([
                        html.Div(id="compensation-rules"),
                    ]),
                ]),
            ], width=6),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("补贴订单明细"),
            dbc.CardBody([
                dbc.Table(id="subsidy-orders-table", striped=True, bordered=True, hover=True, responsive=True),
            ]),
        ]),
    ], fluid=True)


def build_anomaly_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Label("异常类型"),
                dcc.Dropdown(
                    id="anomaly-type-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "系统延迟", "value": "system_delay"},
                        {"label": "支付流水缺失", "value": "payment_missing"},
                        {"label": "地图口径变化", "value": "map_calibration_change"},
                        {"label": "骑手拒单趋势", "value": "rider_reject_spike"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=4),
            dbc.Col([
                dbc.Label("处理状态"),
                dcc.Dropdown(
                    id="anomaly-resolved-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "未处理", "value": "unresolved"},
                        {"label": "已处理", "value": "resolved"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=4),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("异常趋势"),
                    dbc.CardBody([
                        dcc.Graph(id="anomaly-trend-chart", style={"height": "350px"}),
                    ]),
                ]),
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("异常类型统计"),
                    dbc.CardBody([
                        dcc.Graph(id="anomaly-type-chart", style={"height": "350px"}),
                    ]),
                ]),
            ], width=4),
        ]),
        html.Br(),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        "拒单趋势影响区间",
                        dbc.Badge("高亮", color="danger", className="ms-2", pill=True),
                    ]),
                    dbc.CardBody([
                        dcc.Graph(id="reject-trend-chart", style={"height": "300px"}),
                    ]),
                ]),
            ], width=12),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("异常记录列表"),
            dbc.CardBody([
                dbc.Table(id="anomalies-table", striped=True, bordered=True, hover=True, responsive=True),
            ]),
        ]),
        dbc.Modal([
            dbc.ModalHeader(dbc.ModalTitle("异常详情与处理")),
            dbc.ModalBody(id="anomaly-detail-body"),
            dbc.ModalFooter([
                dbc.Button("关闭", id="btn-close-anomaly-detail", color="secondary", n_clicks=0),
            ]),
        ], id="anomaly-detail-modal", is_open=False, size="lg"),
    ], fluid=True)


def build_review_layout():
    return dbc.Container([
        dbc.Row([
            dbc.Col([
                dbc.Label("备注类型"),
                dcc.Dropdown(
                    id="review-type-filter",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "订单备注", "value": "order"},
                        {"label": "异常备注", "value": "anomaly"},
                        {"label": "轨迹异常备注", "value": "track"},
                    ],
                    value="all",
                    multi=False,
                ),
            ], width=4),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("复盘备注时间线"),
                    dbc.CardBody([
                        html.Div(id="review-timeline"),
                    ]),
                ]),
            ], width=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("新增复盘备注"),
                    dbc.CardBody([
                        dbc.Label("订单号"),
                        dcc.Dropdown(id="review-order-dropdown", placeholder="选择订单"),
                        html.Br(),
                        dbc.Label("备注类型"),
                        dcc.Dropdown(
                            id="new-review-type",
                            options=[
                                {"label": "常规复盘", "value": "general"},
                                {"label": "异常分析", "value": "anomaly_analysis"},
                                {"label": "赔付确认", "value": "compensation"},
                                {"label": "改进建议", "value": "improvement"},
                            ],
                            value="general",
                        ),
                        html.Br(),
                        dbc.Label("判断标签"),
                        dcc.Dropdown(
                            id="new-review-judgment",
                            options=[
                                {"label": "系统问题", "value": "system_issue"},
                                {"label": "骑手问题", "value": "rider_issue"},
                                {"label": "用户问题", "value": "user_issue"},
                                {"label": "外部因素", "value": "external"},
                                {"label": "综合因素", "value": "mixed"},
                            ],
                            value="mixed",
                        ),
                        html.Br(),
                        dbc.Label("备注内容"),
                        dbc.Textarea(id="new-review-content", rows=5, placeholder="输入复盘备注内容..."),
                        html.Br(),
                        dbc.Label("作者"),
                        dbc.Input(id="new-review-author", value="analyst"),
                        html.Br(),
                        dbc.Button("提交备注", id="btn-submit-review", color="primary", n_clicks=0),
                    ]),
                ]),
            ], width=4),
        ]),
        html.Br(),
        dbc.Card([
            dbc.CardHeader("历史备注列表"),
            dbc.CardBody([
                dbc.Table(id="review-notes-table", striped=True, bordered=True, hover=True, responsive=True),
            ]),
        ]),
    ], fluid=True)
