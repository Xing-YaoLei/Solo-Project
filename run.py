from dash import Input, Output, State, callback, html, dcc, ctx
import dash_bootstrap_components as dbc

from app import app
from app.layouts import create_app_layout
from app.callbacks import dashboard_callbacks, detail_callbacks, export_callbacks
from models import init_db
from data import get_work_orders_df, get_work_order_by_id


app.layout = create_app_layout()


@callback(
    [
        Output("dashboard-page", "style"),
        Output("detail-page", "style"),
        Output("selected-order-id", "data"),
    ],
    [
        Input("work-orders-table", "selected_rows"),
        Input("btn-back-to-dashboard", "n_clicks"),
    ],
    [
        State("work-orders-table", "data"),
        State("selected-order-id", "data"),
    ],
    prevent_initial_call=True
)
def toggle_pages(selected_rows, back_clicks, table_data, current_order_id):
    trigger_id = ctx.triggered_id

    if trigger_id == "btn-back-to-dashboard":
        return {"display": "block"}, {"display": "none"}, current_order_id

    if trigger_id == "work-orders-table" and selected_rows and table_data:
        row_idx = selected_rows[0]
        if row_idx < len(table_data):
            order_no = table_data[row_idx]["order_no"]
            orders_df = get_work_orders_df()
            if not orders_df.empty:
                order = orders_df[orders_df["order_no"] == order_no]
                if not order.empty:
                    order_id = order.iloc[0]["id"]
                    return {"display": "none"}, {"display": "block"}, order_id

    return {"display": "block"}, {"display": "none"}, current_order_id


@callback(
    Output("work-orders-table", "selected_rows"),
    [Input("btn-back-to-dashboard", "n_clicks")],
    prevent_initial_call=True
)
def clear_selection(back_clicks):
    return []


if __name__ == "__main__":
    init_db()
    from config import DEBUG, PORT
    app.run_server(debug=DEBUG, port=PORT, host="0.0.0.0")
