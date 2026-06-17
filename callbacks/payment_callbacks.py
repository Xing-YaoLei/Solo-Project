from dash import Input, Output, callback
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import dash_table, html

from data.loader import load_payment_records, load_reconciliation_results
from config import RECONCILIATION_STATUS_COLORS


@callback(
    [
        Output("payment-timeline-chart", "figure"),
        Output("reconciliation-diff-chart", "figure"),
        Output("gap-amount-chart", "figure"),
        Output("reconciliation-detail-table", "children"),
    ],
    [
        Input("payment-project-selector", "value"),
        Input("payment-status-filter", "value"),
        Input("payment-gap-filter", "value"),
    ],
)
def update_payment_flow(selected_project, status_filter, gap_filter):
    pid = None if selected_project == "all" else selected_project

    payments_df = load_payment_records(pid)
    recon_df = load_reconciliation_results(pid)

    filtered_project_ids = None
    if not recon_df.empty:
        if status_filter != "all":
            recon_df = recon_df[recon_df["status"] == status_filter]
        if gap_filter != "all":
            recon_df = recon_df[recon_df["gap_flag"] == int(gap_filter)]
        filtered_project_ids = set(recon_df["project_id"].unique()) if not recon_df.empty else None

    display_payments = payments_df
    if filtered_project_ids and not payments_df.empty:
        display_payments = payments_df[payments_df["project_id"].isin(filtered_project_ids)]

    if not display_payments.empty and "payment_date" in display_payments.columns:
        display_payments = display_payments.sort_values("payment_date")
        timeline_fig = go.Figure()
        timeline_fig.add_trace(
            go.Scatter(
                x=display_payments["payment_date"],
                y=display_payments["amount"].cumsum(),
                mode="lines+markers",
                name="累计支付",
                line=dict(color="#3498db", width=2),
            )
        )
        timeline_fig.add_trace(
            go.Bar(
                x=display_payments["payment_date"],
                y=display_payments["amount"],
                name="单笔支付",
                marker_color="#2ecc71",
                opacity=0.6,
            )
        )

        if not recon_df.empty and len(display_payments) > 0:
            gap_payments_projects = set()
            gap_recon = recon_df[recon_df["gap_flag"] == 1]
            if not gap_recon.empty:
                gap_payments_projects = set(gap_recon["project_id"].unique())
            for pid_val in gap_payments_projects:
                proj_payments = display_payments[display_payments["project_id"] == pid_val]
                if not proj_payments.empty:
                    last_date = proj_payments["payment_date"].max()
                    last_cum = proj_payments["amount"].cumsum().iloc[-1]
                    timeline_fig.add_annotation(
                        x=last_date,
                        y=last_cum,
                        text="⚠缺口",
                        showarrow=True,
                        arrowhead=2,
                        ax=0,
                        ay=-40,
                        font=dict(color="red", size=12),
                    )

        filter_title = ""
        if status_filter != "all" or gap_filter != "all":
            filters = []
            if status_filter != "all":
                filters.append(f"状态={status_filter}")
            if gap_filter != "all":
                filters.append(f"缺口={'有' if gap_filter == '1' else '无'}")
            filter_title = f"（筛选: {', '.join(filters)}）"

        timeline_fig.update_layout(
            title=f"支付流水时间线{filter_title}",
            xaxis_title="日期",
            yaxis_title="金额（元）",
            height=350,
            barmode="overlay",
        )
    else:
        timeline_fig = go.Figure()
        filter_hint = ""
        if status_filter != "all" or gap_filter != "all":
            filter_hint = "（当前筛选条件下无数据）"
        timeline_fig.update_layout(title=f"支付流水时间线{filter_hint}", height=350)

    if not recon_df.empty:
        diff_by_status = recon_df.groupby("status").agg(
            count=("id", "count"), total_diff=("diff_amount", "sum")
        ).reset_index()

        colors = [
            RECONCILIATION_STATUS_COLORS.get(s, "#95a5a6")
            for s in diff_by_status["status"]
        ]
        diff_fig = go.Figure(
            data=[
                go.Bar(
                    x=diff_by_status["status"],
                    y=diff_by_status["total_diff"],
                    marker_color=colors,
                    text=diff_by_status["total_diff"].apply(lambda x: f"¥{x:,.2f}"),
                    textposition="auto",
                )
            ]
        )
        diff_fig.update_layout(
            title="对账差异汇总",
            yaxis_title="差额（元）",
            height=350,
        )

        gap_df = recon_df[recon_df["gap_flag"] == 1]
        if not gap_df.empty:
            gap_fig = go.Figure(
                data=[
                    go.Waterfall(
                        x=gap_df["id"].astype(str).tolist(),
                        y=gap_df["diff_amount"].tolist(),
                        text=gap_df["diff_amount"].apply(lambda x: f"¥{x:,.2f}").tolist(),
                        textposition="outside",
                        increasing=dict(marker=dict(color="#e74c3c")),
                        decreasing=dict(marker=dict(color="#2ecc71")),
                        totals=dict(marker=dict(color="#3498db")),
                    )
                ]
            )
            gap_fig.update_layout(
                title="缺口金额瀑布图",
                yaxis_title="差额（元）",
                height=350,
            )
        else:
            gap_fig = go.Figure()
            gap_fig.update_layout(title="缺口金额瀑布图（无缺口）", height=350)
    else:
        diff_fig = go.Figure()
        diff_fig.update_layout(title="对账差异汇总（暂无数据）", height=350)
        gap_fig = go.Figure()
        gap_fig.update_layout(title="缺口金额瀑布图（暂无数据）", height=350)

    if not recon_df.empty:
        display_df = recon_df.copy()
        numeric_cols = display_df.select_dtypes(include=["number"]).columns
        display_df[numeric_cols] = display_df[numeric_cols].round(2)
        detail_table = dash_table.DataTable(
            data=display_df.to_dict("records"),
            columns=[{"name": c, "id": c} for c in display_df.columns],
            style_data_conditional=[
                {
                    "if": {"filter_query": "{gap_flag} = 1"},
                    "backgroundColor": "#ffe0e0",
                    "fontWeight": "bold",
                }
            ],
            page_size=15,
            style_table={"overflowX": "auto"},
        )
        table_component = detail_table
    else:
        table_component = html.Div("暂无对账明细数据", className="text-muted")

    return timeline_fig, diff_fig, gap_fig, table_component
