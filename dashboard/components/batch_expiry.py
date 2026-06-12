from datetime import date

import dash_table
import plotly.graph_objects as go
import plotly.express as px

_LAYOUT_COMMON = dict(
    template="plotly_white",
    font=dict(family="Microsoft YaHei, sans-serif"),
    margin=dict(l=60, r=30, t=50, b=60),
)

_STATUS_COLORS = {
    "active": "#2ecc71",
    "near_expiry": "#e67e22",
    "expired": "#e74c3c",
}


def create_batch_expiry_timeline(df):
    fig = go.Figure()
    for i, row in df.iterrows():
        color = _STATUS_COLORS.get(row["status"], "#95a5a6")
        fig.add_trace(go.Bar(
            x=[(row["expiry_date"] - row["received_date"]).days],
            y=[row["batch_no"]],
            base=[row["received_date"]],
            orientation="h",
            marker_color=color,
            name=row["status"],
            showlegend=False,
            hovertext=(
                f"批次: {row['batch_no']}<br>"
                f"物料: {row['material_name']}<br>"
                f"状态: {row['status']}<br>"
                f"接收: {row['received_date']}<br>"
                f"到期: {row['expiry_date']}"
            ),
            hoverinfo="text",
        ))
    today = date.today()
    fig.add_shape(
        type="line",
        x0=today,
        x1=today,
        y0=-0.5,
        y1=len(df) - 0.5,
        line=dict(color="black", width=2, dash="dot"),
    )
    fig.add_annotation(
        x=today,
        y=len(df) - 0.5,
        text="今天",
        showarrow=True,
        arrowhead=2,
    )
    for status_name, status_color in _STATUS_COLORS.items():
        fig.add_trace(go.Bar(
            x=[None],
            y=[None],
            marker_color=status_color,
            name=status_name,
        ))
    fig.update_layout(
        title="批次到期时间线",
        xaxis_title="日期",
        yaxis_title="批次号",
        barmode="overlay",
        **_LAYOUT_COMMON,
    )
    return fig


def create_expiry_distribution_chart(df):
    fig = px.histogram(df, x="days_to_expiry", nbins=30)
    fig.add_vline(
        x=7, line_dash="dash", line_color="red",
        annotation_text="7天(紧急)",
    )
    fig.add_vline(
        x=30, line_dash="dash", line_color="orange",
        annotation_text="30天(预警)",
    )
    fig.update_layout(
        title="到期天数分布",
        xaxis_title="距到期天数",
        yaxis_title="批次数量",
        **_LAYOUT_COMMON,
    )
    return fig


def create_batch_detail_table(df):
    columns = [
        {"name": "批次号", "id": "batch_no"},
        {"name": "物料名称", "id": "material_name"},
        {"name": "生产日期", "id": "production_date"},
        {"name": "到期日期", "id": "expiry_date"},
        {"name": "距到期天数", "id": "days_to_expiry"},
        {"name": "当前数量", "id": "current_qty"},
        {"name": "状态", "id": "status"},
    ]
    style_data_conditional = [
        {
            "if": {"filter_query": "{status} = 'expired'"},
            "backgroundColor": "#d5d8dc",
            "color": "#2c3e50",
        },
        {
            "if": {"filter_query": "{status} = 'near_expiry'"},
            "backgroundColor": "#fdebd0",
            "color": "#e67e22",
        },
        {
            "if": {"filter_query": "{status} = 'active'"},
            "backgroundColor": "#d5f5e3",
            "color": "#27ae60",
        },
    ]
    return dash_table.DataTable(
        columns=columns,
        data=df.to_dict("records"),
        style_data_conditional=style_data_conditional,
        page_size=20,
        style_table={"overflowX": "auto"},
        style_header={"backgroundColor": "#f0f0f0", "fontWeight": "bold"},
    )
