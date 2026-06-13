import dash_bootstrap_components as dbc
from dash import html

from views.components import (
    make_filter_bar,
    make_funnel_chart,
    make_fulfillment_comparison,
    make_comparison_chart,
    make_shortage_section,
    make_batch_detail_modal,
    make_shortage_detail_modal,
    make_sync_batch_panel,
)


def create_layout(regions):
    return dbc.Container(
        [
            dbc.Navbar(
                dbc.Container(
                    [
                        html.A(
                            dbc.Row(
                                [
                                    dbc.Col(
                                        html.Img(
                                            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20group%20buying%20funnel%20report%20dashboard%20icon%20minimalist&image_size=square_hd",
                                            height="40px",
                                        )
                                    ),
                                    dbc.Col(
                                        dbc.NavbarBrand(
                                            "社区团购预售团单漏斗报表",
                                            className="ms-2 fw-bold fs-5",
                                        )
                                    ),
                                ],
                                align="center",
                                className="g-0",
                            ),
                            href="#",
                            style={"textDecoration": "none"},
                        ),
                    ]
                ),
                color="dark",
                dark=True,
                className="mb-3",
            ),
            make_filter_bar(regions),
            dbc.Row(
                [
                    dbc.Col(make_funnel_chart(), width=12),
                ]
            ),
            dbc.Row(
                [
                    dbc.Col(make_fulfillment_comparison(), width=6),
                    dbc.Col(make_comparison_chart(), width=6),
                ]
            ),
            dbc.Row(
                [
                    dbc.Col(make_shortage_section(), width=12),
                ]
            ),
            dbc.Row(
                [
                    dbc.Col(make_sync_batch_panel(), width=12),
                ]
            ),
            make_batch_detail_modal(),
            make_shortage_detail_modal(),
            html.Div(id="dummy-output", style={"display": "none"}),
        ],
        fluid=True,
    )
