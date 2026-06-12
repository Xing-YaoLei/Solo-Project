import dash_table
import plotly.graph_objects as go
import plotly.express as px

_LAYOUT_COMMON = dict(
    template="plotly_white",
    font=dict(family="Microsoft YaHei, sans-serif"),
    margin=dict(l=60, r=30, t=50, b=60),
)


def _rating_color(rating):
    if rating >= 4:
        return "#2ecc71"
    elif rating >= 3:
        return "#f1c40f"
    else:
        return "#e74c3c"


def create_supplier_rating_chart(df):
    df_sorted = df.sort_values("rating", ascending=True)
    colors = [_rating_color(r) for r in df_sorted["rating"]]
    fig = go.Figure(go.Bar(
        x=df_sorted["rating"],
        y=df_sorted["supplier_name"],
        orientation="h",
        marker_color=colors,
        text=df_sorted["rating"],
        textposition="auto",
    ))
    fig.update_layout(
        title="供应商评分排行",
        xaxis_title="评分",
        yaxis_title="供应商",
        xaxis=dict(range=[0, 5]),
        **_LAYOUT_COMMON,
    )
    return fig


def create_supplier_lead_time_chart(df):
    avg_lead_time = df["lead_time_days"].mean()
    fig = go.Figure(go.Bar(
        x=df["supplier_name"],
        y=df["lead_time_days"],
        marker_color="steelblue",
    ))
    fig.add_hline(
        y=avg_lead_time,
        line_dash="dash",
        line_color="red",
        annotation_text=f"平均: {avg_lead_time:.1f}天",
    )
    fig.update_layout(
        title="供应商交货周期",
        xaxis_title="供应商",
        yaxis_title="交货天数",
        **_LAYOUT_COMMON,
    )
    return fig


def create_supplier_detail_table(df):
    columns = [
        {"name": "供应商编码", "id": "supplier_code"},
        {"name": "供应商名称", "id": "supplier_name"},
        {"name": "联系人", "id": "contact_person"},
        {"name": "联系电话", "id": "contact_phone"},
        {"name": "交货天数", "id": "lead_time_days"},
        {"name": "评分", "id": "rating"},
        {"name": "物料类别", "id": "material_category"},
    ]
    style_data_conditional = [
        {
            "if": {"filter_query": "{rating} >= 4"},
            "backgroundColor": "#d5f5e3",
            "color": "#27ae60",
        },
        {
            "if": {"filter_query": "{rating} >= 3 && {rating} < 4"},
            "backgroundColor": "#fdebd0",
            "color": "#e67e22",
        },
        {
            "if": {"filter_query": "{rating} < 3"},
            "backgroundColor": "#fadbd8",
            "color": "#e74c3c",
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
