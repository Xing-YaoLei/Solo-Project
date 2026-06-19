from dash import html
import dash_bootstrap_components as dbc


def build_kpi_cards():
    return dbc.Row([
        dbc.Col(
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-house-door-fill me-2", style={"fontSize": "1.5rem", "color": "#0d6efd"}),
                        html.H6("活跃房源数", className="card-title mb-0 d-inline")
                    ], className="d-flex align-items-center mb-2"),
                    html.H3(id="kpi-total-properties", children="0", className="mb-0 text-primary"),
                    html.Small(id="kpi-total-properties-sub", className="text-muted")
                ])
            ], className="h-100"),
            md=3, sm=6, className="mb-3"
        ),
        dbc.Col(
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-percent me-2", style={"fontSize": "1.5rem", "color": "#198754"}),
                        html.H6("平均入住率", className="card-title mb-0 d-inline")
                    ], className="d-flex align-items-center mb-2"),
                    html.H3(id="kpi-occupancy-rate", children="0%", className="mb-0 text-success"),
                    html.Small(id="kpi-occupancy-rate-sub", className="text-muted")
                ])
            ], className="h-100"),
            md=3, sm=6, className="mb-3"
        ),
        dbc.Col(
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-calendar-check-fill me-2", style={"fontSize": "1.5rem", "color": "#fd7e14"}),
                        html.H6("已确认订单", className="card-title mb-0 d-inline")
                    ], className="d-flex align-items-center mb-2"),
                    html.H3(id="kpi-confirmed-orders", children="0", className="mb-0 text-warning"),
                    html.Small(id="kpi-confirmed-orders-sub", className="text-muted")
                ])
            ], className="h-100"),
            md=3, sm=6, className="mb-3"
        ),
        dbc.Col(
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.I(className="bi bi-exclamation-triangle-fill me-2", style={"fontSize": "1.5rem", "color": "#dc3545"}),
                        html.H6("房态冲突", className="card-title mb-0 d-inline")
                    ], className="d-flex align-items-center mb-2"),
                    html.H3(id="kpi-conflicts", children="0", className="mb-0 text-danger"),
                    html.Small(id="kpi-conflicts-sub", className="text-muted")
                ])
            ], className="h-100"),
            md=3, sm=6, className="mb-3"
        )
    ], className="mb-4")
