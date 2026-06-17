import dash
from dash import html, dcc
import dash_bootstrap_components as dbc

from data.reconciler import compute_amount_summary
from data.loader import load_projects
from config import RECONCILIATION_STATUS_COLORS


def layout():
    projects_df = load_projects()
    project_options = (
        [{"label": "全部项目", "value": "all"}]
        + [
            {"label": row["name"], "value": row["id"]}
            for _, row in projects_df.iterrows()
        ]
        if not projects_df.empty
        else [{"label": "全部项目", "value": "all"}]
    )

    summary = compute_amount_summary()

    return html.Div(
        [
            html.H4("金额校验总览", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("对账总项数"),
                                dbc.CardBody(
                                    html.H3(str(summary["total_items"]), className="card-title")
                                ),
                            ],
                            color="info",
                            inverse=True,
                        ),
                        width=2,
                    ),
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("匹配项"),
                                dbc.CardBody(
                                    html.H3(str(summary["matched_items"]), className="card-title")
                                ),
                            ],
                            color="success",
                            inverse=True,
                        ),
                        width=2,
                    ),
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("金额不一致"),
                                dbc.CardBody(
                                    html.H3(str(summary["mismatched_items"]), className="card-title")
                                ),
                            ],
                            color="danger",
                            inverse=True,
                        ),
                        width=2,
                    ),
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("内部缺失"),
                                dbc.CardBody(
                                    html.H3(str(summary["missing_internal"]), className="card-title")
                                ),
                            ],
                            color="warning",
                            inverse=True,
                        ),
                        width=2,
                    ),
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("设计导出缺失"),
                                dbc.CardBody(
                                    html.H3(str(summary["missing_design"]), className="card-title")
                                ),
                            ],
                            color="secondary",
                            inverse=True,
                        ),
                        width=2,
                    ),
                    dbc.Col(
                        dbc.Card(
                            [
                                dbc.CardHeader("缺口总额"),
                                dbc.CardBody(
                                    html.H3(f"¥{summary['total_gap']:,.2f}", className="card-title")
                                ),
                            ],
                            color="danger",
                            inverse=True,
                        ),
                        width=2,
                    ),
                ],
                className="mb-4",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            html.Label("选择项目"),
                            dcc.Dropdown(
                                id="overview-project-selector",
                                options=project_options,
                                value="all",
                                clearable=False,
                            ),
                        ],
                        width=3,
                    ),
                ],
                className="mb-3",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        dcc.Graph(id="amount-verify-pie"),
                        width=4,
                    ),
                    dbc.Col(
                        dcc.Graph(id="amount-verify-bar"),
                        width=8,
                    ),
                ],
            ),
            dbc.Row(
                [
                    dbc.Col(
                        html.Div(id="field-comparison-table"),
                        width=12,
                    ),
                ],
                className="mt-4",
            ),
        ],
        className="p-4",
    )
