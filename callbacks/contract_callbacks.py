from datetime import datetime

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

    sorted_cycles = []
    if cycles:
        sorted_cycles = sorted(
            cycles,
            key=lambda c: c.get("sort_date") or datetime.max,
        )
        contract_nos = [c["contract_no"] for c in sorted_cycles]
        days_to_first = [c["days_to_first"] or 0 for c in sorted_cycles]
        days_to_last = [c["days_to_last"] or 0 for c in sorted_cycles]

        trend_fig = go.Figure()
        trend_fig.add_trace(
            go.Bar(
                name="首笔回款天数",
                x=contract_nos,
                y=days_to_first,
                marker_color="#3498db",
                text=[f"{d}天" for d in days_to_first],
                textposition="auto",
            )
        )
        trend_fig.add_trace(
            go.Bar(
                name="末笔回款天数",
                x=contract_nos,
                y=days_to_last,
                marker_color="#e74c3c",
                text=[f"{d}天" for d in days_to_last],
                textposition="auto",
            )
        )
        trend_fig.update_layout(
            title="回款周期趋势（按合同/回款时间排序）",
            barmode="group",
            yaxis_title="天数",
            height=350,
        )

        paid_ratios = [c["paid_ratio"] * 100 for c in sorted_cycles]
        contract_amounts = [c["contract_amount"] for c in sorted_cycles]
        paid_amounts = [c["paid_amount"] for c in sorted_cycles]

        ratio_fig = go.Figure()
        ratio_fig.add_trace(
            go.Bar(
                name="合同金额",
                x=contract_nos,
                y=contract_amounts,
                marker_color="#3498db",
                text=[f"¥{a:,.0f}" for a in contract_amounts],
                textposition="auto",
            )
        )
        ratio_fig.add_trace(
            go.Bar(
                name="已回款金额",
                x=contract_nos,
                y=paid_amounts,
                marker_color="#2ecc71",
                text=[f"¥{a:,.0f}" for a in paid_amounts],
                textposition="auto",
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
                text=[f"{r:.1f}%" for r in paid_ratios],
                textposition="top center",
            )
        )
        ratio_fig.update_layout(
            title="回款率分析（按合同/回款时间排序）",
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

    if sorted_cycles and len(sorted_cycles) >= 2:
        labels = []
        for c in sorted_cycles:
            sd = c.get("signed_date")
            date_tag = sd.strftime("%Y-%m") if sd else "—"
            labels.append(f"{c['contract_no']}\n({date_tag}签)")

        first_days = [c["days_to_first"] or 0 for c in sorted_cycles]
        last_days = [c["days_to_last"] or 0 for c in sorted_cycles]

        improvement_fig = go.Figure()
        improvement_fig.add_trace(
            go.Scatter(
                x=labels,
                y=first_days,
                mode="lines+markers+text",
                name="首笔回款天数",
                text=[f"{d}天" for d in first_days],
                textposition="top center",
                line=dict(color="#2ecc71", width=3),
                marker=dict(size=12, symbol="circle"),
            )
        )
        improvement_fig.add_trace(
            go.Scatter(
                x=labels,
                y=last_days,
                mode="lines+markers+text",
                name="末笔回款天数",
                text=[f"{d}天" for d in last_days],
                textposition="bottom center",
                line=dict(color="#3498db", width=2, dash="dash"),
                marker=dict(size=10, symbol="diamond"),
            )
        )
        improvement_fig.update_layout(
            title="回款周期改善趋势（按合同签署时间，左早→右晚）",
            yaxis_title="天数（相对于合同签署日）",
            height=400,
            hovermode="x unified",
        )

        total_improve_first = first_days[-1] - first_days[0]
        total_improve_last = last_days[-1] - last_days[0]

        for i in range(1, len(sorted_cycles)):
            diff_first = first_days[i] - first_days[i - 1]
            x_mid = labels[i]
            y_mid = (first_days[i] + first_days[i - 1]) / 2

            if diff_first < 0:
                label_txt = f"↓ 改善{abs(diff_first)}天 ✓"
                clr = "#2ecc71"
            elif diff_first > 0:
                label_txt = f"↑ 恶化{diff_first}天 ✗"
                clr = "#e74c3c"
            else:
                label_txt = "持平"
                clr = "#7f8c8d"

            improvement_fig.add_annotation(
                x=x_mid,
                y=first_days[i] + 3,
                text=label_txt,
                showarrow=False,
                font=dict(color=clr, size=12, family="Arial Bold"),
                bgcolor="white",
                bordercolor=clr,
                borderwidth=1,
                borderpad=2,
                opacity=0.95,
            )

        def _summary_text(diff, name):
            if diff < 0:
                return f"{name}整体改善{abs(diff)}天 ✓"
            elif diff > 0:
                return f"{name}整体恶化{diff}天 ✗"
            return f"{name}持平"

        summary_lines = []
        summary_lines.append(_summary_text(total_improve_first, "首笔"))
        summary_lines.append(_summary_text(total_improve_last, "末笔"))
        overall_y = max(first_days + last_days) + 10
        improvement_fig.add_annotation(
            x=labels[-1],
            y=overall_y,
            text="<br>".join(summary_lines),
            showarrow=False,
            align="right",
            xanchor="right",
            font=dict(size=13),
            bgcolor="#f8f9fa",
            bordercolor="#343a40",
            borderwidth=1,
            borderpad=6,
        )
    else:
        improvement_fig = go.Figure()
        improvement_fig.update_layout(
            title="回款周期改善趋势（需至少2个合同，按签署时间排序）", height=400
        )

    return trend_fig, ratio_fig, table_component, improvement_fig
