import dash
from dash import html, dcc
import dash_bootstrap_components as dbc

from data.loader import load_contracts, load_projects


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
            html.H4("合同附件与回款周期复盘", className="mb-3"),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            html.Label("项目筛选"),
                            dcc.Dropdown(
                                id="cycle-project-selector",
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
                        dcc.Graph(id="payment-cycle-trend"),
                        width=6,
                    ),
                    dbc.Col(
                        dcc.Graph(id="paid-ratio-chart"),
                        width=6,
                    ),
                ],
                className="mb-4",
            ),
            html.H5("合同附件与异常解释", className="mb-2"),
            html.Div(id="contract-attachment-table"),
            dbc.Row(
                [
                    dbc.Col(
                        dcc.Graph(id="cycle-improvement-chart"),
                        width=12,
                    ),
                ],
                className="mt-4",
            ),
        ],
        className="p-4",
    )
