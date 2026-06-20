import plotly.graph_objects as go
import plotly.express as px
import pandas as pd


def create_funnel_chart(funnel_data):
    if funnel_data is None or funnel_data.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=20),
        )
        return fig

    fig = go.Figure(go.Funnel(
        y=funnel_data["stage"],
        x=funnel_data["count"],
        textinfo="value+percent initial",
        textposition="inside",
        marker=dict(
            color=funnel_data["color"],
        ),
        connector=dict(
            fillcolor="white",
            line=dict(width=1, color="#d0d0d0"),
        ),
    ))

    fig.update_layout(
        margin=dict(l=20, r=20, t=20, b=20),
        hovermode="y unified",
        plot_bgcolor="white",
        paper_bgcolor="white",
    )

    return fig


def create_checkin_efficiency_chart(efficiency_data):
    if efficiency_data is None or efficiency_data.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无核销数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=20),
        )
        return fig

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=efficiency_data["check_in_hour"],
        y=efficiency_data["count"],
        marker_color="#FFA15A",
        text=efficiency_data["count"],
        textposition="outside",
    ))

    fig.update_layout(
        xaxis=dict(
            title="小时",
            tickmode="array",
            tickvals=list(range(0, 24)),
        ),
        yaxis=dict(title="核销人数"),
        margin=dict(l=40, r=20, t=20, b=40),
        plot_bgcolor="white",
        paper_bgcolor="white",
        bargap=0.2,
    )

    fig.update_xaxes(showgrid=True, gridcolor="#f0f0f0")
    fig.update_yaxes(showgrid=True, gridcolor="#f0f0f0")

    return fig


def create_ticket_type_chart(ticket_type_data):
    if ticket_type_data is None or ticket_type_data.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="暂无票种数据",
            xref="paper", yref="paper",
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=20),
        )
        return fig

    fig = go.Figure()

    fig.add_trace(go.Bar(
        name="已售",
        x=ticket_type_data["name"],
        y=ticket_type_data["sold_quantity"],
        marker_color="#636EFA",
    ))

    fig.add_trace(go.Bar(
        name="已核销",
        x=ticket_type_data["name"],
        y=ticket_type_data["checked_quantity"],
        marker_color="#00CC96",
    ))

    fig.update_layout(
        barmode="group",
        xaxis=dict(title="票种"),
        yaxis=dict(title="数量"),
        margin=dict(l=40, r=20, t=20, b=40),
        legend=dict(orientation="h", y=-0.15),
        plot_bgcolor="white",
        paper_bgcolor="white",
    )

    fig.update_xaxes(showgrid=True, gridcolor="#f0f0f0")
    fig.update_yaxes(showgrid=True, gridcolor="#f0f0f0")

    return fig


def create_gate_records_table(gate_records_data):
    if gate_records_data is None or gate_records_data.empty:
        return html.Div("暂无核销记录", className="text-center text-muted py-4")

    from dash import dash_table

    style_data_conditional = []

    if "is_disputed" in gate_records_data.columns:
        style_data_conditional.append(
            {
                "if": {"filter_query": "{is_disputed} = true"},
                "backgroundColor": "#fff5f5",
                "color": "#c53030",
            }
        )

    display_cols = [
        "ticket_code", "order_no", "customer_name",
        "ticket_type", "gate_no", "check_in_time"
    ]
    display_cols = [c for c in display_cols if c in gate_records_data.columns]

    table = dash_table.DataTable(
        data=gate_records_data.to_dict("records"),
        columns=[{"name": col, "id": col} for col in display_cols],
        style_data_conditional=style_data_conditional,
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#f8f9fa",
            "fontWeight": "bold",
        },
        style_cell={
            "textAlign": "left",
            "padding": "8px",
            "fontSize": "13px",
        },
        page_size=10,
        sort_action="native",
        filter_action="native",
    )

    return table


def create_sponsor_table(sponsor_data):
    from dash import dash_table, html

    if sponsor_data is None or sponsor_data.empty:
        return html.Div("暂无赞助数据", className="text-center text-muted py-4")

    display_data = sponsor_data.copy()
    display_data["使用率"] = (display_data["usage_rate"] * 100).round(1).astype(str) + "%"
    display_data["核销率"] = (display_data["checkin_rate"] * 100).round(1).astype(str) + "%"

    columns = [
        {"name": "赞助商名称", "id": "name"},
        {"name": "赞助级别", "id": "sponsor_level"},
        {"name": "分配票数", "id": "allocated_tickets"},
        {"name": "已使用", "id": "used_tickets"},
        {"name": "已核销", "id": "checked_tickets"},
        {"name": "使用率", "id": "使用率"},
        {"name": "核销率", "id": "核销率"},
    ]

    table = dash_table.DataTable(
        data=display_data.to_dict("records"),
        columns=columns,
        row_selectable="single",
        selected_rows=[],
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#f8f9fa",
            "fontWeight": "bold",
        },
        style_cell={
            "textAlign": "left",
            "padding": "10px",
            "fontSize": "13px",
        },
        style_data_conditional=[
            {
                "if": {"row_index": "odd"},
                "backgroundColor": "#fafafa",
            },
            {
                "if": {"state": "selected"},
                "backgroundColor": "#e3f2fd",
                "border": "1px solid #2196f3",
            },
        ],
        style_as_list_view=True,
        page_size=10,
        sort_action="native",
    )

    return table


def create_anomaly_table(anomaly_data):
    from dash import dash_table, html

    if anomaly_data is None or anomaly_data.empty:
        return html.Div("暂无异常数据", className="text-center text-muted py-4")

    severity_colors = {
        "error": "#ff6b6b",
        "warning": "#ffd93d",
        "info": "#74c0fc",
    }

    style_data_conditional = []
    for severity, color in severity_colors.items():
        style_data_conditional.append({
            "if": {"filter_query": f"{{severity}} = '{severity}'"},
            "backgroundColor": f"{color}20",
        })

    table = dash_table.DataTable(
        data=anomaly_data.to_dict("records"),
        columns=[
            {"name": "类型", "id": "anomaly_type"},
            {"name": "严重程度", "id": "severity"},
            {"name": "描述", "id": "description"},
            {"name": "检测时间", "id": "detected_time"},
            {"name": "状态", "id": "is_resolved"},
        ],
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#f8f9fa",
            "fontWeight": "bold",
        },
        style_cell={
            "textAlign": "left",
            "padding": "8px",
            "fontSize": "12px",
        },
        style_data_conditional=style_data_conditional,
        page_size=10,
        sort_action="native",
    )

    return table


def create_raw_samples_table(samples_data):
    from dash import dash_table, html

    if samples_data is None or samples_data.empty:
        return html.Div("暂无样本数据", className="text-center text-muted py-4")

    style_data_conditional = []

    if "is_disputed" in samples_data.columns:
        style_data_conditional.append(
            {
                "if": {"filter_query": "{is_disputed} = true"},
                "backgroundColor": "#fff5f5",
                "color": "#c53030",
            }
        )

    display_cols = [
        "order_no", "customer_name", "customer_phone",
        "ticket_type", "sponsor", "quantity", "total_amount",
        "status", "has_checked", "register_time"
    ]
    display_cols = [c for c in display_cols if c in samples_data.columns]

    table = dash_table.DataTable(
        data=samples_data.to_dict("records"),
        columns=[{"name": col, "id": col} for col in display_cols],
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#f8f9fa",
            "fontWeight": "bold",
        },
        style_cell={
            "textAlign": "left",
            "padding": "8px",
            "fontSize": "12px",
        },
        style_data_conditional=style_data_conditional,
        page_size=20,
        sort_action="native",
        filter_action="native",
    )

    return table


def create_ticket_rules_table(ticket_type_data):
    from dash import dash_table, html

    if ticket_type_data is None or ticket_type_data.empty:
        return html.Div("暂无票种规则", className="text-center text-muted py-4")

    display_data = ticket_type_data.copy()
    display_data["售出率"] = (display_data["sell_rate"] * 100).round(1).astype(str) + "%"
    display_data["核销率"] = (display_data["checkin_rate"] * 100).round(1).astype(str) + "%"
    display_data["可退票"] = display_data["is_refundable"].map({True: "是", False: "否"})

    table = dash_table.DataTable(
        data=display_data.to_dict("records"),
        columns=[
            {"name": "票种名称", "id": "name"},
            {"name": "分类", "id": "category"},
            {"name": "单价", "id": "price"},
            {"name": "总票数", "id": "total_quantity"},
            {"name": "已售", "id": "sold_quantity"},
            {"name": "已核销", "id": "checked_quantity"},
            {"name": "售出率", "id": "售出率"},
            {"name": "核销率", "id": "核销率"},
            {"name": "可退票", "id": "可退票"},
            {"name": "说明", "id": "description"},
        ],
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#f8f9fa",
            "fontWeight": "bold",
        },
        style_cell={
            "textAlign": "left",
            "padding": "8px",
            "fontSize": "12px",
        },
        page_size=10,
        sort_action="native",
    )

    return table
