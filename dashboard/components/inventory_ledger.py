import dash_table
import plotly.graph_objects as go
import plotly.express as px

_LAYOUT_COMMON = dict(
    template="plotly_white",
    font=dict(family="Microsoft YaHei, sans-serif"),
    margin=dict(l=60, r=30, t=50, b=60),
)


def create_inventory_overview_chart(df):
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df["material_name"],
        y=df["stock_qty"],
        name="当前库存",
        marker_color="steelblue",
    ))
    fig.add_trace(go.Bar(
        x=df["material_name"],
        y=df["safety_stock"],
        name="安全库存",
        marker_color="coral",
    ))
    for i, row in df.iterrows():
        fig.add_shape(
            type="line",
            x0=i - 0.4,
            x1=i + 0.4,
            y0=row["safety_stock"],
            y1=row["safety_stock"],
            line=dict(color="red", width=2, dash="dash"),
        )
    fig.update_layout(
        barmode="group",
        title="物料库存概览",
        xaxis_title="物料名称",
        yaxis_title="数量",
        **_LAYOUT_COMMON,
    )
    return fig


def create_inventory_trend_chart(df):
    hover_cols = ["stock_qty"]
    if "batch_no" in df.columns:
        hover_cols.append("batch_no")
    if "unit" in df.columns:
        hover_cols.append("unit")
    fig = px.line(
        df,
        x="snapshot_date",
        y="stock_qty",
        color="material_name",
        markers=True,
        hover_data=hover_cols,
    )
    fig.update_layout(
        title="库存变动趋势",
        xaxis_title="日期",
        yaxis_title="库存数量",
        **_LAYOUT_COMMON,
    )
    return fig


def create_inventory_detail_table(df):
    columns = [
        {"name": "门店编码", "id": "store_code"},
        {"name": "物料编码", "id": "material_code"},
        {"name": "物料名称", "id": "material_name"},
        {"name": "批次号", "id": "batch_no"},
        {"name": "库存数量", "id": "stock_qty"},
        {"name": "单位", "id": "unit"},
        {"name": "安全库存", "id": "safety_stock"},
        {"name": "快照日期", "id": "snapshot_date"},
    ]
    style_data_conditional = [
        {
            "if": {
                "filter_query": "{stock_qty} < {safety_stock}",
            },
            "backgroundColor": "#ffcccc",
            "color": "#cc0000",
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
