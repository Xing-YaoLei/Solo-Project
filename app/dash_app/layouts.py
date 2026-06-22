from datetime import date, timedelta

import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table


def build_navbar(user):
    role_label = {
        "management": "管理层",
        "frontline": "一线审计",
        "admin": "系统管理员",
    }.get(user.role.value, "未知角色")

    return dbc.NavbarSimple(
        children=[
            dbc.NavItem(
                dbc.NavLink(
                    f"{user.full_name or user.username} ({role_label})",
                    href="#",
                    disabled=True,
                    className="text-white",
                )
            ),
            dbc.NavItem(
                dbc.NavLink("数据导入", href="/import", className="text-white")
            ),
            dbc.NavItem(
                dbc.NavLink("批次记录", href="/batches", className="text-white")
            ),
            dbc.NavItem(
                dbc.NavLink("退出登录", href="/logout", className="text-white")
            ),
        ],
        brand="合规审计制度检查看板",
        brand_href="/",
        color="primary",
        dark=True,
        className="mb-4",
        fluid=True,
    )


def build_filters():
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    return dbc.Card(
        dbc.CardBody(
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Label("开始日期"),
                            dcc.DatePickerSingle(
                                id="filter-start-date",
                                date=thirty_days_ago.isoformat(),
                                display_format="YYYY-MM-DD",
                                className="w-100",
                            ),
                        ],
                        md=2,
                    ),
                    dbc.Col(
                        [
                            dbc.Label("结束日期"),
                            dcc.DatePickerSingle(
                                id="filter-end-date",
                                date=today.isoformat(),
                                display_format="YYYY-MM-DD",
                                className="w-100",
                            ),
                        ],
                        md=2,
                    ),
                    dbc.Col(
                        [
                            dbc.Label("部门"),
                            dcc.Dropdown(
                                id="filter-department",
                                options=[
                                    {"label": "全部", "value": ""},
                                    {"label": "财务部", "value": "财务部"},
                                    {"label": "人事部", "value": "人事部"},
                                    {"label": "采购部", "value": "采购部"},
                                    {"label": "技术部", "value": "技术部"},
                                    {"label": "合规部", "value": "合规部"},
                                    {"label": "运营部", "value": "运营部"},
                                    {"label": "销售部", "value": "销售部"},
                                ],
                                value="",
                                clearable=False,
                            ),
                        ],
                        md=3,
                    ),
                    dbc.Col(
                        [
                            dbc.Label(" "),
                            dbc.Button(
                                "刷新数据",
                                id="btn-refresh",
                                color="primary",
                                className="w-100",
                            ),
                        ],
                        md=2,
                    ),
                ],
                className="g-3 align-items-end",
            )
        ),
        className="mb-4",
    )


def build_kpi_cards():
    return dbc.Row(
        [
            dbc.Col(
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.H5("抽样总数", className="card-title text-muted small"),
                            html.H2(id="kpi-total", className="text-primary"),
                        ]
                    ),
                    className="h-100",
                ),
                md=3,
            ),
            dbc.Col(
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.H5("已完成", className="card-title text-muted small"),
                            html.H2(id="kpi-completed", className="text-success"),
                        ]
                    ),
                    className="h-100",
                ),
                md=3,
            ),
            dbc.Col(
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.H5("高风险", className="card-title text-muted small"),
                            html.H2(id="kpi-high-risk", className="text-danger"),
                        ]
                    ),
                    className="h-100",
                ),
                md=3,
            ),
            dbc.Col(
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.H5("证据缺失", className="card-title text-muted small"),
                            html.H2(id="kpi-evidence-missing", className="text-warning"),
                        ]
                    ),
                    className="h-100",
                ),
                md=3,
            ),
        ],
        className="mb-4 g-3",
    )


def build_analysis_section():
    return html.Div(
        [
            html.H4("分析区域", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("检查清单分布", className="card-title"),
                                    dcc.Graph(id="chart-checklist-dist", style={"height": "380px"}),
                                ]
                            )
                        ),
                        md=6,
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("抽样记录漏斗", className="card-title"),
                                    dcc.Graph(id="chart-funnel", style={"height": "380px"}),
                                ]
                            )
                        ),
                        md=6,
                    ),
                ],
                className="mb-4 g-3",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("整改计划排行", className="card-title"),
                                    dcc.Graph(id="chart-rectification", style={"height": "380px"}),
                                ]
                            )
                        ),
                        md=6,
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("风险等级变化", className="card-title"),
                                    dcc.Graph(id="chart-risk-change", style={"height": "380px"}),
                                ]
                            )
                        ),
                        md=6,
                    ),
                ],
                className="mb-4 g-3",
            ),
        ]
    )


def build_sampling_table_section():
    return dbc.Card(
        dbc.CardBody(
            [
                html.Div(
                    [
                        html.H5("抽样记录明细", className="card-title d-inline-block"),
                        dbc.Button(
                            "查看/添加注释",
                            id="btn-open-comment",
                            color="outline-primary",
                            size="sm",
                            className="float-end",
                            disabled=True,
                        ),
                    ],
                    className="mb-3",
                ),
                dash_table.DataTable(
                    id="table-samples",
                    columns=[
                        {"name": "抽样编号", "id": "sample_code"},
                        {"name": "部门", "id": "department"},
                        {"name": "状态", "id": "status"},
                        {"name": "风险等级", "id": "risk_level"},
                        {"name": "是否有证据", "id": "has_evidence"},
                        {"name": "审计日期", "id": "audit_date"},
                    ],
                    page_size=10,
                    row_selectable="single",
                    selected_rows=[],
                    style_table={"overflowX": "auto"},
                    style_header={
                        "backgroundColor": "rgb(230, 230, 230)",
                        "fontWeight": "bold",
                    },
                    style_cell={"textAlign": "left", "padding": "10px"},
                ),
            ]
        ),
        className="mb-4",
    )


def build_comment_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("抽样记录详情与注释")),
            dbc.ModalBody(
                [
                    html.Div(id="modal-sample-info", className="mb-3"),
                    html.H6("已有注释"),
                    html.Div(id="modal-comments-list", className="mb-3"),
                    html.Hr(),
                    html.H6("添加新注释"),
                    dbc.Textarea(
                        id="comment-content",
                        placeholder="请输入注释内容...",
                        className="mb-2",
                        rows=4,
                    ),
                    dbc.Checklist(
                        options=[
                            {"label": "标记为证据缺失", "value": "evidence_missing"},
                        ],
                        id="comment-evidence-missing",
                        switch=True,
                        className="mb-2",
                    ),
                ]
            ),
            dbc.ModalFooter(
                [
                    dbc.Button("取消", id="btn-close-modal", color="secondary"),
                    dbc.Button("提交注释", id="btn-submit-comment", color="primary"),
                ]
            ),
        ],
        id="modal-comment",
        size="lg",
        is_open=False,
    )


def build_import_layout():
    return html.Div(
        [
            html.H4("数据导入", className="mb-4"),
            dbc.Row(
                [
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("邮件材料导入", className="card-title"),
                                    dcc.Upload(
                                        id="upload-email",
                                        children=html.Div(
                                            ["拖拽或点击选择 Excel/CSV 文件 (含subject, sender, body等列)"]
                                        ),
                                        style={
                                            "width": "100%",
                                            "height": "80px",
                                            "lineHeight": "80px",
                                            "borderWidth": "1px",
                                            "borderStyle": "dashed",
                                            "borderRadius": "5px",
                                            "textAlign": "center",
                                            "margin": "10px 0",
                                        },
                                        multiple=False,
                                    ),
                                    html.Div(id="upload-email-status"),
                                ]
                            )
                        ),
                        md=4,
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("权限日志导入", className="card-title"),
                                    dcc.Upload(
                                        id="upload-permission",
                                        children=html.Div(
                                            ["拖拽或点击选择 Excel/CSV 文件 (含user, action, time等列)"]
                                        ),
                                        style={
                                            "width": "100%",
                                            "height": "80px",
                                            "lineHeight": "80px",
                                            "borderWidth": "1px",
                                            "borderStyle": "dashed",
                                            "borderRadius": "5px",
                                            "textAlign": "center",
                                            "margin": "10px 0",
                                        },
                                        multiple=False,
                                    ),
                                    html.Div(id="upload-permission-status"),
                                ]
                            )
                        ),
                        md=4,
                    ),
                    dbc.Col(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H5("审计底稿导入", className="card-title"),
                                    dcc.Upload(
                                        id="upload-workpaper",
                                        children=html.Div(
                                            ["拖拽或点击选择 Excel/CSV 文件 (含title, finding, dept等列)"]
                                        ),
                                        style={
                                            "width": "100%",
                                            "height": "80px",
                                            "lineHeight": "80px",
                                            "borderWidth": "1px",
                                            "borderStyle": "dashed",
                                            "borderRadius": "5px",
                                            "textAlign": "center",
                                            "margin": "10px 0",
                                        },
                                        multiple=False,
                                    ),
                                    html.Div(id="upload-workpaper-status"),
                                ]
                            )
                        ),
                        md=4,
                    ),
                ],
                className="mb-4 g-3",
            ),
            dbc.Card(
                dbc.CardBody(
                    [
                        html.H5("合并生成抽样记录", className="card-title"),
                        dbc.Button(
                            "运行合并流水线",
                            id="btn-run-merge",
                            color="success",
                            className="me-2",
                        ),
                        html.Span(id="merge-status"),
                    ]
                )
            ),
        ]
    )


def build_batches_layout():
    return html.Div(
        [
            html.H4("导入批次记录", className="mb-4"),
            dbc.Card(
                dbc.CardBody(
                    dash_table.DataTable(
                        id="table-batches",
                        columns=[
                            {"name": "批次号", "id": "batch_number"},
                            {"name": "数据类型", "id": "source_type"},
                            {"name": "状态", "id": "status"},
                            {"name": "总记录数", "id": "total_records"},
                            {"name": "成功", "id": "success_records"},
                            {"name": "失败", "id": "failed_records"},
                            {"name": "开始时间", "id": "started_at"},
                            {"name": "完成时间", "id": "completed_at"},
                        ],
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_header={
                            "backgroundColor": "rgb(230, 230, 230)",
                            "fontWeight": "bold",
                        },
                        style_cell={"textAlign": "left", "padding": "10px"},
                    )
                )
            ),
        ]
    )


def build_overview_layout():
    return html.Div(
        [
            build_filters(),
            build_kpi_cards(),
            build_analysis_section(),
            build_sampling_table_section(),
            build_comment_modal(),
        ]
    )
