from dash import html, dcc, dash_table, Input, Output, State
import dash_bootstrap_components as dbc


def create_trend_layout():
    return html.Div([
        dbc.Row([
            dbc.Col([
                dbc.Label("门店"),
                dbc.Select(id="trend-store-filter", placeholder="选择门店"),
            ], width=4),
            dbc.Col([
                dbc.Label("物料"),
                dbc.Select(id="trend-material-filter", placeholder="选择物料"),
            ], width=4),
            dbc.Col([
                dbc.Label("日期范围"),
                dcc.DatePickerRange(id="trend-date-range"),
            ], width=4),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="trend-inventory-chart"),
            ], width=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="trend-usage-chart"),
            ], width=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="trend-turnover-chart"),
            ], width=12),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                dcc.Graph(id="trend-expiry-chart"),
            ], width=12),
        ], className="mb-4"),

        dcc.Store(id="trend-store"),
    ])
