import dash_bootstrap_components as dbc
from dash import dcc, html, dash_table


class ImagesView:
    @property
    def layout(self):
        return dbc.Container(
            [
                html.H3(
                    [html.I(className="fas fa-images me-2 text-info"), "影像附件视图"],
                    className="mb-4 text-white",
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-filter me-2"),
                                            "筛选条件",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dbc.Row(
                                            [
                                                dbc.Col(
                                                    [
                                                        html.Label("影像类型", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="image-type-filter",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "X光片", "value": "xray"},
                                                                {"label": "CT", "value": "ct"},
                                                                {"label": "口内照片", "value": "intraoral"},
                                                                {"label": "面部照片", "value": "facial"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("上传状态", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="image-upload-filter",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "已上传", "value": "uploaded"},
                                                                {"label": "未上传", "value": "missing"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=4,
                                                ),
                                                dbc.Col(
                                                    [
                                                        html.Label("影像分类", className="text-light small mb-1"),
                                                        dcc.Dropdown(
                                                            id="image-category-filter",
                                                            options=[
                                                                {"label": "全部", "value": "all"},
                                                                {"label": "术前", "value": "pre"},
                                                                {"label": "术中", "value": "intra"},
                                                                {"label": "术后", "value": "post"},
                                                            ],
                                                            value="all",
                                                            clearable=False,
                                                            className="bg-dark",
                                                        ),
                                                    ],
                                                    md=4,
                                                ),
                                            ]
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 mb-4",
                            ),
                            lg=12,
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-chart-bar me-2"),
                                            "影像上传统计",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="images-stats-chart",
                                            style={"height": "300px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 h-100",
                            ),
                            lg=6,
                            className="mb-4",
                        ),
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-chart-pie me-2"),
                                            "影像类型分布",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dcc.Graph(
                                            id="images-type-chart",
                                            style={"height": "300px"},
                                            config={"displayModeBar": False},
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0 h-100",
                            ),
                            lg=6,
                            className="mb-4",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-list me-2"),
                                            "影像附件明细",
                                            dbc.Badge(
                                                id="images-count-badge",
                                                color="info",
                                                className="ms-2",
                                            ),
                                        ]
                                    ),
                                    dbc.CardBody(
                                        dash_table.DataTable(
                                            id="images-table",
                                            columns=[
                                                {
                                                    "name": "影像编号",
                                                    "id": "image_no",
                                                },
                                                {
                                                    "name": "患者ID",
                                                    "id": "patient_id",
                                                },
                                                {
                                                    "name": "关联预约",
                                                    "id": "appointment_no",
                                                },
                                                {
                                                    "name": "影像类型",
                                                    "id": "image_type",
                                                },
                                                {
                                                    "name": "分类",
                                                    "id": "image_category",
                                                },
                                                {
                                                    "name": "文件名",
                                                    "id": "file_name",
                                                },
                                                {
                                                    "name": "大小(KB)",
                                                    "id": "file_size",
                                                    "type": "numeric",
                                                },
                                                {
                                                    "name": "上传时间",
                                                    "id": "upload_date",
                                                    "type": "datetime",
                                                },
                                                {
                                                    "name": "描述",
                                                    "id": "description",
                                                },
                                            ],
                                            style_table={"overflowX": "auto"},
                                            style_header={
                                                "backgroundColor": "#374151",
                                                "color": "white",
                                                "fontWeight": "bold",
                                                "fontSize": "12px",
                                            },
                                            style_cell={
                                                "backgroundColor": "#1f2937",
                                                "color": "#e5e7eb",
                                                "fontSize": "11px",
                                                "padding": "8px",
                                                "textAlign": "left",
                                                "whiteSpace": "normal",
                                                "height": "auto",
                                            },
                                            style_data_conditional=[
                                                {
                                                    "if": {
                                                        "filter_query": '{file_name} is blank or {file_name} = ""'
                                                    },
                                                    "backgroundColor": "#7f1d1d",
                                                    "color": "#fecaca",
                                                },
                                            ],
                                            page_size=15,
                                            sort_action="native",
                                            sort_mode="multi",
                                            filter_action="native",
                                            row_selectable="single",
                                            selected_rows=[],
                                        )
                                    ),
                                ],
                                className="bg-secondary border-0",
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            dbc.Card(
                                [
                                    dbc.CardHeader(
                                        [
                                            html.I(className="fas fa-exclamation-circle me-2 text-warning"),
                                            "影像缺失预警",
                                        ]
                                    ),
                                    dbc.CardBody(
                                        html.Div(id="missing-images-alert"),
                                    ),
                                ],
                                className="bg-secondary border-0",
                            ),
                            lg=12,
                            className="mb-4",
                        ),
                    ]
                ),
            ],
            fluid=True,
        )
