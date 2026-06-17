import dash
from dash import html, dcc
import dash_bootstrap_components as dbc
from dash import dash_table

from data.loader import load_payment_records, load_reconciliation_results, load_projects
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

    return html.Div(
        [
            html.H4("支付流水与对账差异", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            html.Label("项目筛选"),
                            dcc.Dropdown(
                                id="payment-project-selector",
                                options=project_options,
                                value="all",
                                clearable=False,
                            ),
                        ],
                        width=3,
                    ),
                    dbc.Col(
                        [
                            html.Label("对账状态"),
                            dcc.Dropdown(
                                id="payment-status-filter",
                                options=[
                                    {"label": "全部", "value": "all"},
                                    {"label": "匹配", "value": "matched"},
                                    {"label": "不一致", "value": "mismatched"},
                                    {"label": "内部缺失", "value": "missing_internal"},
                                    {"label": "设计缺失", "value": "missing_design"},
                                ],
                                value="all",
                                clearable=False,
                            ),
                        ],
                        width=3,
                    ),
                    dbc.Col(
                        [
                            html.Label("缺口标记"),
                            dcc.Dropdown(
                                id="payment-gap-filter",
                                options=[
                                    {"label": "全部", "value": "all"},
                                    {"label": "有缺口", "value": "1"},
                                    {"label": "无缺口", "value": "0"},
                                ],
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
                        dcc.Graph(id="payment-timeline-chart"),
                        width=12,
                    ),
                ],
                className="mb-4",
            ),
            dbc.Row(
                [
                    dbc.Col(
                        dcc.Graph(id="reconciliation-diff-chart"),
                        width=6,
                    ),
                    dbc.Col(
                        dcc.Graph(id="gap-amount-chart"),
                        width=6,
                    ),
                ],
                className="mb-4",
            ),
            html.H5("对账差异明细", className="mb-2"),
            html.Div(id="reconciliation-detail-table"),
        ],
        className="p-4",
    )
