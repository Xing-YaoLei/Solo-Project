from dash import dcc, html
import dash_bootstrap_components as dbc

NAV_ITEMS = [
    {"label": "入住评估趋势", "value": "trend"},
    {"label": "老人档案视图", "value": "elder"},
    {"label": "护理等级分析", "value": "care_level"},
    {"label": "用药清单管理", "value": "medication"},
    {"label": "口径差异表", "value": "conflict"},
]


def build_sidebar():
    return html.Div(
        [
            html.H4("养老护理看板", className="text-white p-3"),
            html.Hr(className="bg-light"),
            dbc.Nav(
                [
                    dbc.NavLink(
                        item["label"],
                        href=f"#{item['value']}",
                        id=f"nav-{item['value']}",
                        className="text-white",
                        n_clicks=0,
                    )
                    for item in NAV_ITEMS
                ],
                vertical=True,
                pills=True,
            ),
            html.Hr(className="bg-light mt-4"),
            html.Div(
                [
                    html.Label("数据刷新状态", className="text-white-50 small"),
                    html.Div(id="sync-status-display", className="mt-2"),
                    html.Hr(className="bg-light mt-3"),
                    dbc.Button(
                        "刷新数据",
                        id="btn-refresh-all",
                        color="primary",
                        className="w-100 mt-2",
                        size="sm",
                    ),
                    html.Div(id="refresh-result", className="mt-2 small text-white"),
                ],
                className="p-3",
            ),
            html.Hr(className="bg-light"),
            html.Div(
                [
                    html.Div(
                        [
                            html.Label("已保存视图", className="text-white-50 small"),
                        ],
                    ),
                    html.Div(
                        id="saved-views-list",
                        className="mt-2 overflow-auto",
                        style={"maxHeight": "280px"},
                    ),
                ],
                className="p-3",
            ),
        ],
        className="bg-dark vh-100 position-fixed overflow-y-auto",
        style={"width": "240px", "left": "0", "top": "0"},
    )


def build_header():
    return dbc.Navbar(
        [
            dbc.Container(
                [
                    dbc.NavbarBrand("养老护理入住评估趋势看板", className="ms-3"),
                    dbc.Nav(
                        [
                            dbc.DropdownMenu(
                                [
                                    dbc.DropdownMenuItem(
                                        "下载评估报告", id="btn-export-report"
                                    ),
                                    dbc.DropdownMenuItem(
                                        "下载口径差异表", id="btn-export-conflict"
                                    ),
                                    dbc.DropdownMenuItem(
                                        "导出护理达标规则", id="btn-export-rules"
                                    ),
                                ],
                                nav=True,
                                in_navbar=True,
                                label="数据导出",
                            ),
                            dcc.Download(id="download-report"),
                            dcc.Download(id="download-conflict"),
                            dcc.Download(id="download-rules"),
                        ],
                        className="ms-auto",
                    ),
                ],
                fluid=True,
            )
        ],
        color="primary",
        dark=True,
        sticky="top",
        style={"marginLeft": "240px"},
    )


def build_anomaly_alert():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.I(className="bi bi-exclamation-triangle-fill me-2"),
                    "异常检测标记",
                ],
                className="bg-warning text-dark",
            ),
            dbc.CardBody(
                [
                    dbc.Row(
                        [
                            dbc.Col(
                                dbc.Card(
                                    [
                                        dbc.CardBody(
                                            [
                                                html.H5(
                                                    id="alert-access-delay",
                                                    className="card-title text-warning",
                                                ),
                                                html.P(
                                                    "门禁记录延迟数",
                                                    className="card-text small",
                                                ),
                                            ]
                                        )
                                    ],
                                    className="border-warning",
                                ),
                                width=4,
                            ),
                            dbc.Col(
                                dbc.Card(
                                    [
                                        dbc.CardBody(
                                            [
                                                html.H5(
                                                    id="alert-care-missing",
                                                    className="card-title text-danger",
                                                ),
                                                html.P(
                                                    "护理终端缺失数",
                                                    className="card-text small",
                                                ),
                                            ]
                                        )
                                    ],
                                    className="border-danger",
                                ),
                                width=4,
                            ),
                            dbc.Col(
                                dbc.Card(
                                    [
                                        dbc.CardBody(
                                            [
                                                html.H5(
                                                    id="alert-caliber-change",
                                                    className="card-title text-info",
                                                ),
                                                html.P(
                                                    "收费系统口径变更",
                                                    className="card-text small",
                                                ),
                                            ]
                                        )
                                    ],
                                    className="border-info",
                                ),
                                width=4,
                            ),
                        ]
                    )
                ]
            ),
        ],
        className="mb-4",
    )


def build_trend_section():
    return html.Div(
        id="trend",
        children=[
            html.H3("入住评估趋势", className="mb-3"),
            build_anomaly_alert(),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader("时间范围筛选"),
                                    dbc.CardBody(
                                        [
                                            dbc.Row(
                                                [
                                                    dbc.Col(
                                                        [
                                                            html.Label(
                                                                "开始日期",
                                                                className="small",
                                                            ),
                                                            dcc.DatePickerSingle(
                                                                id="filter-start-date",
                                                                display_format="YYYY-MM-DD",
                                                                className="w-100",
                                                            ),
                                                        ],
                                                        width=6,
                                                    ),
                                                    dbc.Col(
                                                        [
                                                            html.Label(
                                                                "结束日期",
                                                                className="small",
                                                            ),
                                                            dcc.DatePickerSingle(
                                                                id="filter-end-date",
                                                                display_format="YYYY-MM-DD",
                                                                className="w-100",
                                                            ),
                                                        ],
                                                        width=6,
                                                    ),
                                                ]
                                            ),
                                            html.Hr(),
                                            html.Label("护理等级筛选", className="small"),
                                            dcc.Dropdown(
                                                id="filter-care-level",
                                                options=[
                                                    {"label": "全部", "value": None},
                                                    {"label": "自理", "value": "自理"},
                                                    {"label": "半自理", "value": "半自理"},
                                                    {"label": "全护理", "value": "全护理"},
                                                    {"label": "特护", "value": "特护"},
                                                ],
                                                value=None,
                                                clearable=False,
                                            ),
                                        ]
                                    ),
                                ]
                            )
                        ],
                        width=3,
                    ),
                    dbc.Col(
                        [
                            dcc.Graph(id="assessment-trend-graph"),
                            html.Div(
                                id="fall-impact-notes",
                                className="mt-2 text-muted small",
                            ),
                        ],
                        width=9,
                    ),
                ],
                className="mb-4",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dcc.Graph(id="care-level-distribution-graph"),
                        ],
                        width=6,
                    ),
                    dbc.Col(
                        [
                            dcc.Graph(id="assessment-score-boxplot"),
                        ],
                        width=6,
                    ),
                ]
            ),
        ],
        className="mb-5",
    )


def build_elder_section():
    return html.Div(
        id="elder",
        children=[
            html.Hr(),
            html.H3("老人档案视图", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader("选择老人"),
                                    dbc.CardBody(
                                        [
                                            dcc.Dropdown(
                                                id="elder-selector",
                                                placeholder="输入姓名或编号搜索...",
                                                searchable=True,
                                            ),
                                            html.Hr(),
                                            html.Button(
                                                "保存为常用视图",
                                                id="btn-save-view",
                                                className="btn btn-outline-primary btn-sm w-100",
                                            ),
                                        ]
                                    ),
                                ]
                            )
                        ],
                        width=3,
                    ),
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader("老人基本档案"),
                                    dbc.CardBody(
                                        id="elder-profile-display",
                                        children=[
                                            html.P(
                                                "请选择一位老人查看档案",
                                                className="text-muted",
                                            )
                                        ],
                                    ),
                                ]
                            )
                        ],
                        width=9,
                    ),
                ],
                className="mb-4",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            "护理等级评估历史",
                                            html.Span(
                                                id="elder-care-badge",
                                                className="badge bg-primary ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        [dcc.Graph(id="elder-assessment-history")]
                                    ),
                                ]
                            )
                        ],
                        width=6,
                    ),
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader("用药清单"),
                                    dbc.CardBody(
                                        id="elder-medication-display",
                                        children=[
                                            html.P(
                                                "暂无用药信息",
                                                className="text-muted",
                                            )
                                        ],
                                    ),
                                ]
                            )
                        ],
                        width=6,
                    ),
                ],
                className="mb-4",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            "复盘备注",
                                            dbc.Button(
                                                "添加备注",
                                                id="btn-add-note",
                                                size="sm",
                                                color="outline-secondary",
                                                className="float-end",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        id="elder-review-notes",
                                        children=[
                                            html.P(
                                                "暂无复盘备注",
                                                className="text-muted",
                                            )
                                        ],
                                    ),
                                ]
                            )
                        ],
                        width=12,
                    )
                ]
            ),
            dbc.Modal(
                [
                    dbc.ModalHeader(dbc.ModalTitle("添加复盘备注")),
                    dbc.ModalBody(
                        [
                            dbc.Label("备注类型"),
                            dcc.Dropdown(
                                id="note-type",
                                options=[
                                    {"label": "常规评估", "value": "常规评估"},
                                    {"label": "跌倒事件", "value": "跌倒事件"},
                                    {"label": "护理调整", "value": "护理调整"},
                                    {"label": "其他", "value": "其他"},
                                ],
                                className="mb-3",
                            ),
                            dbc.Label("备注内容"),
                            dbc.Textarea(
                                id="note-content",
                                rows=5,
                                placeholder="请输入复盘备注内容...",
                            ),
                        ]
                    ),
                    dbc.ModalFooter(
                        [
                            dbc.Button("取消", id="btn-cancel-note", color="secondary"),
                            dbc.Button("保存", id="btn-save-note", color="primary"),
                        ]
                    ),
                ],
                id="note-modal",
                is_open=False,
            ),
            dbc.Modal(
                [
                    dbc.ModalHeader(dbc.ModalTitle("保存为常用视图")),
                    dbc.ModalBody(
                        [
                            html.Div(
                                [
                                    html.Strong("将保存以下内容的快照："),
                                    html.Ul(
                                        [
                                            html.Li("老人档案（基本信息、紧急联系人等）"),
                                            html.Li("护理等级评估历史"),
                                            html.Li("用药清单"),
                                            html.Li("复盘备注"),
                                        ],
                                        className="mt-2 mb-3",
                                    ),
                                ]
                            ),
                            dbc.Label("视图名称（可选）"),
                            dbc.Input(
                                id="save-view-name",
                                type="text",
                                placeholder="默认使用老人姓名",
                            ),
                            html.Small(
                                "若该老人已有已保存视图，将覆盖更新并刷新快照时间。",
                                className="text-muted mt-2 d-block",
                            ),
                        ]
                    ),
                    dbc.ModalFooter(
                        [
                            dbc.Button(
                                "取消", id="btn-cancel-save-view", color="secondary"
                            ),
                            dbc.Button(
                                "确认保存", id="btn-confirm-save-view", color="primary"
                            ),
                        ]
                    ),
                ],
                id="save-view-modal",
                is_open=False,
            ),
            dbc.Modal(
                [
                    dbc.ModalHeader(
                        [
                            dbc.ModalTitle(id="restore-view-title"),
                            dbc.Button(
                                id="btn-download-restored-view",
                                color="outline-primary",
                                size="sm",
                                className="ms-2",
                            ),
                        ]
                    ),
                    dbc.ModalBody(
                        [
                            dcc.Download(id="download-restored-view"),
                            dbc.Tabs(
                                [
                                    dbc.Tab(
                                        label="📄 老人档案",
                                        tab_id="tab-restore-profile",
                                        children=[
                                            html.Div(
                                                id="restore-profile-body",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                    dbc.Tab(
                                        label="📊 护理等级",
                                        tab_id="tab-restore-care",
                                        children=[
                                            dcc.Graph(
                                                id="restore-care-graph",
                                                className="mt-3",
                                            ),
                                        ],
                                    ),
                                    dbc.Tab(
                                        label="💊 用药清单",
                                        tab_id="tab-restore-medication",
                                        children=[
                                            html.Div(
                                                id="restore-medication-body",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                    dbc.Tab(
                                        label="📝 复盘备注",
                                        tab_id="tab-restore-notes",
                                        children=[
                                            html.Div(
                                                id="restore-notes-body",
                                                className="mt-3",
                                            )
                                        ],
                                    ),
                                ],
                                id="restore-tabs",
                                active_tab="tab-restore-profile",
                            ),
                        ]
                    ),
                    dbc.ModalFooter(
                        [
                            dbc.Button(
                                "恢复到当前选择",
                                id="btn-apply-restore",
                                color="success",
                            ),
                            dbc.Button(
                                "删除此视图",
                                id="btn-delete-restore",
                                color="danger",
                                outline=True,
                            ),
                            dbc.Button(
                                "关闭",
                                id="btn-close-restore",
                                color="secondary",
                            ),
                        ]
                    ),
                ],
                id="restore-view-modal",
                is_open=False,
                size="xl",
            ),
            dcc.Store(id="active-view-id"),
        ],
        className="mb-5",
    )


def build_care_level_section():
    return html.Div(
        id="care_level",
        children=[
            html.Hr(),
            html.H3("护理等级分析", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        [dcc.Graph(id="care-level-trend")],
                        width=8,
                    ),
                    dbc.Col(
                        [
                            dbc.Card(
                                [
                                    dbc.CardHeader("护理等级统计"),
                                    dbc.CardBody(
                                        id="care-level-stats",
                                        children=[
                                            html.P("加载中...", className="text-muted")
                                        ],
                                    ),
                                ]
                            )
                        ],
                        width=4,
                    ),
                ]
            ),
        ],
        className="mb-5",
    )


def build_medication_section():
    return html.Div(
        id="medication",
        children=[
            html.Hr(),
            html.H3("用药清单管理", className="mb-3"),
            dbc.Card(
                [
                    dbc.CardBody(
                        [
                            dcc.Dropdown(
                                id="medication-elder-filter",
                                placeholder="按老人筛选（可选）",
                                searchable=True,
                                className="mb-3",
                            ),
                            html.Div(id="medication-table-container"),
                        ]
                    )
                ]
            ),
        ],
        className="mb-5",
    )


def build_conflict_section():
    return html.Div(
        id="conflict",
        children=[
            html.Hr(),
            html.H3("护理终端与收费系统口径差异表", className="mb-3"),
            dbc.Alert(
                [
                    html.I(className="bi bi-info-circle-fill me-2"),
                    "本表保留所有口径冲突记录，不做自动覆盖，需人工核实后处理。",
                ],
                color="info",
                className="mb-3",
                dismissable=True,
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dcc.DatePickerRange(
                                id="conflict-date-range",
                                display_format="YYYY-MM-DD",
                            ),
                        ],
                        width=6,
                    ),
                    dbc.Col(
                        [
                            dbc.Switch(
                                id="conflict-only-unresolved",
                                label="仅显示未解决",
                                value=True,
                                className="mt-3",
                            ),
                        ],
                        width=6,
                    ),
                ],
                className="mb-3",
            ),
            html.Div(id="conflict-table-container"),
        ],
        className="mb-5",
    )


def build_main_layout():
    return html.Div(
        [
            dcc.Store(id="dashboard-store"),
            dcc.Interval(
                id="interval-component",
                interval=5 * 60 * 1000,
                n_intervals=0,
            ),
            build_sidebar(),
            html.Div(
                [
                    build_header(),
                    dbc.Container(
                        [
                            build_trend_section(),
                            build_elder_section(),
                            build_care_level_section(),
                            build_medication_section(),
                            build_conflict_section(),
                        ],
                        fluid=True,
                        className="mt-4 p-4",
                    ),
                ],
                style={"marginLeft": "240px"},
            ),
        ]
    )
