from dash import Input, Output, callback, html
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import dash_table

from data.reconciler import compute_amount_summary
from data.loader import load_reconciliation_results, load_field_comparison
from config import RECONCILIATION_STATUS_COLORS


@callback(
    [
        Output("amount-verify-pie", "figure"),
        Output("amount-verify-bar", "figure"),
        Output("field-comparison-table", "children"),
    ],
    Input("overview-project-selector", "value"),
)
def update_amount_verify(selected_project):
    pid = None if selected_project == "all" else selected_project
    summary = compute_amount_summary(pid)
    recon_df = load_reconciliation_results(pid)
    comparison_df = load_field_comparison(pid)

    labels = ["匹配", "金额不一致", "内部缺失", "设计导出缺失"]
    values = [
        summary["matched_items"],
        summary["mismatched_items"],
        summary["missing_internal"],
        summary["missing_design"],
    ]
    colors = [
        RECONCILIATION_STATUS_COLORS["matched"],
        RECONCILIATION_STATUS_COLORS["mismatched"],
        RECONCILIATION_STATUS_COLORS["missing_internal"],
        RECONCILIATION_STATUS_COLORS["missing_design"],
    ]

    pie_fig = go.Figure(
        data=[
            go.Pie(
                labels=labels,
                values=values,
                marker=dict(colors=colors),
                hole=0.4,
                textinfo="label+percent+value",
            )
        ]
    )
    pie_fig.update_layout(title="对账状态分布", height=350)

    if not recon_df.empty:
        status_groups = recon_df.groupby("status")["diff_amount"].sum().reset_index()
        status_groups.columns = ["status", "diff_amount"]
        bar_colors = [RECONCILIATION_STATUS_COLORS.get(s, "#95a5a6") for s in status_groups["status"]]
        bar_fig = go.Figure(
            data=[
                go.Bar(
                    x=status_groups["status"],
                    y=status_groups["diff_amount"],
                    marker_color=bar_colors,
                    text=status_groups["diff_amount"].apply(lambda x: f"¥{x:,.2f}"),
                    textposition="auto",
                )
            ]
        )
        bar_fig.update_layout(
            title="各状态差额分布（缺口标注）",
            yaxis_title="差额（元）",
            height=350,
        )

        gap_items = recon_df[recon_df["gap_flag"] == 1]
        if not gap_items.empty:
            for _, row in gap_items.iterrows():
                bar_fig.add_annotation(
                    x=row["status"],
                    y=row["diff_amount"],
                    text="⚠缺口",
                    showarrow=True,
                    arrowhead=2,
                    font=dict(color="red", size=12),
                )
    else:
        bar_fig = go.Figure()
        bar_fig.update_layout(title="各状态差额分布（暂无数据）", height=350)

    if not comparison_df.empty:
        comparison_df_display = comparison_df.copy()
        numeric_cols = comparison_df_display.select_dtypes(include=["number"]).columns
        comparison_df_display[numeric_cols] = comparison_df_display[numeric_cols].round(2)
        table = dash_table.DataTable(
            data=comparison_df_display.to_dict("records"),
            columns=[{"name": c, "id": c} for c in comparison_df_display.columns],
            style_data_conditional=[
                {
                    "if": {"filter_query": "{field_mismatch} ne '一致'"},
                    "backgroundColor": "#ffe0e0",
                }
            ],
            page_size=10,
            style_table={"overflowX": "auto"},
        )
        table_component = html.Div(
            [
                html.H5("设计软件与内部记录口径对照", className="mb-2"),
                table,
            ]
        )
    else:
        table_component = html.Div("暂无口径对照数据", className="text-muted")

    return pie_fig, bar_fig, table_component
