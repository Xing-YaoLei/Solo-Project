from dash import Input, Output, callback, State
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import dash_table, html

from data.loader import load_contracts, load_reconciliation_results
from data.reconciler import compute_payment_cycle


@callback(
    [
        Output("payment-cycle-trend", "figure"),
        Output("paid-ratio-chart", "figure"),
        Output("contract-attachment-table", "children"),
        Output("cycle-improvement-chart", "figure"),
    ],
    Input("cycle-project-selector", "value"),
)
def update_contract_cycle(selected_project):
    pid = None if selected_project == "all" else selected_project
    contracts_df = load_contracts(pid)
    cycles = compute_payment_cycle(pid)
    recon_df = load_reconciliation_results(pid)

    if cycles:
        contract_nos = [c["contract_no"] for c in cycles]
        days_to_first = [c["days_to_first"] or 0 for c in cycles]
        days_to_last = [c["days_to_last"] or 0 for c in cycles]

        trend_fig = go.Figure()
        trend_fig.add_trace(
            go.Bar(
                name="首笔回款天数",
                x=contract_nos,
                y=days_to_first,
                marker_color="#3498db",
            )
        )
        trend_fig.add_trace(
            go.Bar(
                name="末笔回款天数",
                x=contract_nos,
                y=days_to_last,
                marker_color="#e74c3c",
            )
        )
        trend_fig.update_layout(
            title="回款周期趋势",
            barmode="group",
            yaxis_title="天数",
            height=350,
        )

        paid_ratios = [c["paid_ratio"] * 100 for c in cycles]
        contract_amounts = [c["contract_amount"] for c in cycles]
        paid_amounts = [c["paid_amount"] for c in cycles]

        ratio_fig = go.Figure()
        ratio_fig.add_trace(
            go.Bar(
                name="合同金额",
                x=contract_nos,
                y=contract_amounts,
                marker_color="#3498db",
            )
        )
        ratio_fig.add_trace(
            go.Bar(
                name="已回款金额",
                x=contract_nos,
                y=paid_amounts,
                marker_color="#2ecc71",
            )
        )
        ratio_fig.add_trace(
            go.Scatter(
                name="回款率(%)",
                x=contract_nos,
                y=paid_ratios,
                yaxis="y2",
                mode="lines+markers",
                line=dict(color="#f39c12", width=2),
            )
        )
        ratio_fig.update_layout(
            title="回款率分析",
            yaxis=dict(title="金额（元）"),
            yaxis2=dict(title="回款率(%)", overlaying="y", side="right", range=[0, 120]),
            barmode="group",
            height=350,
        )
    else:
        trend_fig = go.Figure()
        trend_fig.update_layout(title="回款周期趋势（暂无数据）", height=350)
        ratio_fig = go.Figure()
        ratio_fig.update_layout(title="回款率分析（暂无数据）", height=350)

    if not contracts_df.empty:
        display_contracts = contracts_df.copy()

        anomalous_project_ids = set()
        anomalous_details = {}
        if not recon_df.empty:
            gap_items = recon_df[recon_df["gap_flag"] == 1]
            for _, row in gap_items.iterrows():
                pid = row.get("project_id")
                if pid:
                    anomalous_project_ids.add(pid)
                    if pid not in anomalous_details:
                        anomalous_details[pid] = []
                    diff = row.get("diff_amount", 0)
                    status = row.get("status", "")
                    anomalous_details[pid].append(f"{status}: ¥{diff:,.2f}")

        def _get_anomaly_mark(row):
            pid = row.get("project_id")
            if pid in anomalous_project_ids:
                details = "; ".join(anomalous_details.get(pid, []))
                return f"⚠ 存在差额 ({details})"
            return "正常"

        display_contracts["异常标记"] = display_contracts.apply(_get_anomaly_mark, axis=1)
        numeric_cols = display_contracts.select_dtypes(include=["number"]).columns
        display_contracts[numeric_cols] = display_contracts[numeric_cols].round(2)

        table_cols = [
            "contract_no",
            "total_amount",
            "signed_date",
            "attachment_path",
            "remarks",
            "version",
            "异常标记",
        ]
        available_cols = [c for c in table_cols if c in display_contracts.columns]

        contract_table = dash_table.DataTable(
            data=display_contracts[available_cols].to_dict("records"),
            columns=[{"name": c, "id": c} for c in available_cols],
            style_data_conditional=[
                {
                    "if": {"filter_query": "{异常标记} contains '差额'"},
                    "backgroundColor": "#ffe0e0",
                    "fontWeight": "bold",
                }
            ],
            page_size=10,
            style_table={"overflowX": "auto"},
        )
        table_component = html.Div(
            [
                html.P(
                    "合同附件可用于解释对账差异中的异常点，点击合同编号可查看附件详情",
                    className="text-muted mb-2",
                ),
                contract_table,
            ]
        )
    else:
        table_component = html.Div("暂无合同数据", className="text-muted")

    if cycles and len(cycles) >= 2:
        sorted_cycles = sorted(cycles, key=lambda x: x.get("days_to_first") or 9999)
        labels = [c["contract_no"] for c in sorted_cycles]
        first_days = [c["days_to_first"] or 0 for c in sorted_cycles]

        improvement_fig = go.Figure()
        improvement_fig.add_trace(
            go.Scatter(
                x=labels,
                y=first_days,
                mode="lines+markers+text",
                text=[f"{d}天" for d in first_days],
                textposition="top center",
                line=dict(color="#2ecc71", width=3),
                marker=dict(size=10),
            )
        )
        improvement_fig.update_layout(
            title="回款周期改善趋势（首笔回款天数）",
            yaxis_title="天数",
            height=400,
        )

        if len(first_days) >= 2:
            trend_diff = first_days[-1] - first_days[0]
            if trend_diff < 0:
                improvement_fig.add_annotation(
                    x=labels[-1],
                    y=first_days[-1],
                    text=f"改善 {abs(trend_diff)} 天 ✓",
                    showarrow=True,
                    arrowhead=2,
                    font=dict(color="green", size=14),
                )
            else:
                improvement_fig.add_annotation(
                    x=labels[-1],
                    y=first_days[-1],
                    text=f"恶化 {trend_diff} 天 ✗",
                    showarrow=True,
                    arrowhead=2,
                    font=dict(color="red", size=14),
                )
    else:
        improvement_fig = go.Figure()
        improvement_fig.update_layout(
            title="回款周期改善趋势（需至少2个合同）", height=400
        )

    return trend_fig, ratio_fig, table_component, improvement_fig
