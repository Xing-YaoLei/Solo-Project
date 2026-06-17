import dash
import dash_bootstrap_components as dbc
from dash import html, dcc

from layouts import amount_verify, payment_flow, contract_attach
from models.schema import init_db
from callbacks.amount_callbacks import *
from callbacks.payment_callbacks import *
from callbacks.contract_callbacks import *

app = dash.Dash(
    __name__,
    use_pages=True,
    pages_folder="",
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
)

app.title = "家装工地量房报价风险监测"

dash.register_page("amount_verify", path="/", name="金额校验总览", layout=amount_verify.layout)
dash.register_page("payment_flow", path="/payment-flow", name="支付流水与对账", layout=payment_flow.layout)
dash.register_page("contract_cycle", path="/contract-cycle", name="合同附件与回款周期", layout=contract_attach.layout)

navbar = dbc.Navbar(
    dbc.Container(
        [
            dbc.NavbarBrand("家装工地量房报价风险监测", className="ms-2", style={"fontWeight": "bold", "fontSize": "18px"}),
            dbc.Nav(
                [
                    dbc.NavLink(page["name"], href=page["path"], active="exact")
                    for page in dash.page_registry.values()
                ],
                navbar=True,
            ),
        ]
    ),
    color="#2c3e50",
    dark=True,
    className="mb-3",
)

app.layout = dbc.Container(
    [
        navbar,
        dash.page_container,
    ],
    fluid=True,
)

server = app.server

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=8050)
