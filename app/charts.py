import plotly.graph_objects as go
from dash import dcc, html


def build_conflict_trend_chart(data: list[dict], caliber: dict) -> dcc.Graph:
    if not data:
        fig = go.Figure()
        fig.add_annotation(text="暂无冲突数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=16))
        fig.update_layout(title="冲突检测趋势", height=350)
        return dcc.Graph(figure=fig)

    dates = [d["date"] for d in data]
    counts = [d["conflict_count"] for d in data]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=dates,
        y=counts,
        mode="lines+markers",
        name="冲突数",
        line=dict(color="#e74c3c", width=2),
        marker=dict(size=6),
        fill="tozeroy",
        fillcolor="rgba(231,76,60,0.1)",
    ))

    fig.update_layout(
        title=dict(text="冲突检测趋势", font=dict(size=16)),
        xaxis_title="日期",
        yaxis_title="冲突对数",
        template="plotly_white",
        height=350,
        hovermode="x unified",
        annotations=[
            dict(
                text=f"口径: {caliber.get('冲突数', '')}",
                xref="paper", yref="paper", x=1.0, y=-0.15,
                showarrow=False, font=dict(size=10, color="#888"),
            ),
        ],
    )
    return dcc.Graph(figure=fig)


def build_reschedule_composition_chart(data: list[dict], caliber: dict) -> dcc.Graph:
    if not data:
        fig = go.Figure()
        fig.add_annotation(text="暂无改约数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=16))
        fig.update_layout(title="改约记录构成", height=350)
        return dcc.Graph(figure=fig)

    reasons = [d["reason"] or "未注明" for d in data]
    counts = [d["count"] for d in data]

    fig = go.Figure()
    fig.add_trace(go.Pie(
        labels=reasons,
        values=counts,
        hole=0.4,
        textinfo="label+percent+value",
        textposition="outside",
        marker=dict(
            colors=["#3498db", "#e67e22", "#2ecc71", "#9b59b6", "#1abc9c", "#f39c12"],
            line=dict(color="white", width=2),
        ),
    ))

    fig.update_layout(
        title=dict(text="改约记录构成", font=dict(size=16)),
        template="plotly_white",
        height=350,
        annotations=[
            dict(
                text=f"口径: {caliber.get('改约构成', '')}",
                xref="paper", yref="paper", x=1.0, y=-0.15,
                showarrow=False, font=dict(size=10, color="#888"),
            ),
        ],
    )
    return dcc.Graph(figure=fig)


def build_attendance_detail_chart(data: list[dict], daily_rates: list[dict], caliber: dict) -> html.Div:
    if not data:
        fig = go.Figure()
        fig.add_annotation(text="暂无到场数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=16))
        fig.update_layout(title="到场状态明细", height=400)
        return html.Div([dcc.Graph(figure=fig)])

    df_like = data
    dates_set = sorted(set(d["date"] for d in df_like))
    statuses = ["arrived", "not_arrived", "late"]
    status_labels = {"arrived": "到场", "not_arrived": "未到场", "late": "迟到"}
    status_colors = {"arrived": "#2ecc71", "not_arrived": "#e74c3c", "late": "#f39c12"}

    status_by_date = {}
    for d in df_like:
        key = (str(d["date"]), d["attendance_status"])
        status_by_date[key] = d["count"]

    fig = go.Figure()
    for status in statuses:
        values = [status_by_date.get((str(dt), status), 0) for dt in dates_set]
        fig.add_trace(go.Bar(
            name=status_labels.get(status, status),
            x=dates_set,
            y=values,
            marker_color=status_colors.get(status, "#95a5a6"),
        ))

    fig.update_layout(
        barmode="stack",
        title=dict(text="到场状态明细", font=dict(size=16)),
        xaxis_title="日期",
        yaxis_title="人数",
        template="plotly_white",
        height=400,
        hovermode="x unified",
    )

    rate_fig = go.Figure()
    if daily_rates:
        rate_dates = [str(d["date"]) for d in daily_rates]
        rate_values = [d["attendance_rate"] for d in daily_rates]
        rate_fig.add_trace(go.Scatter(
            x=rate_dates,
            y=rate_values,
            mode="lines+markers+text",
            name="到场率(%)",
            line=dict(color="#2ecc71", width=2),
            marker=dict(size=6),
            text=[f"{v:.1f}%" for v in rate_values],
            textposition="top center",
        ))

    rate_fig.update_layout(
        title=dict(text="到场率趋势", font=dict(size=16)),
        xaxis_title="日期",
        yaxis_title="到场率(%)",
        template="plotly_white",
        height=300,
        yaxis=dict(ticksuffix="%"),
        annotations=[
            dict(
                text=f"口径: {caliber.get('到场率', '')}",
                xref="paper", yref="paper", x=1.0, y=-0.18,
                showarrow=False, font=dict(size=10, color="#888"),
            ),
        ],
    )

    return html.Div([
        dcc.Graph(figure=fig),
        dcc.Graph(figure=rate_fig),
    ])


def build_anomaly_reminder_chart(data: list[dict], breakdown: list[dict], caliber: dict) -> html.Div:
    anomaly_table_rows = []
    for record in data:
        anomaly_table_rows.append(html.Tr([
            html.Td(str(record.get("customer_name", ""))),
            html.Td(str(record.get("service_item", ""))),
            html.Td(str(record.get("appointment_time", ""))),
            html.Td(str(record.get("anomaly_reason", ""))),
            html.Td(str(record.get("reschedule_count", 0))),
            html.Td(str(record.get("attendance_status", ""))),
        ]))

    table_component = html.Table(
        [
            html.Thead(html.Tr([
                html.Th("顾客"),
                html.Th("服务项目"),
                html.Th("预约时间"),
                html.Th("异常原因"),
                html.Th("改约次数"),
                html.Th("到场状态"),
            ])),
            html.Tbody(anomaly_table_rows) if anomaly_table_rows else html.Tbody([html.Tr(html.Td("暂无异常记录", colSpan=6))]),
        ],
        style={"width": "100%", "borderCollapse": "collapse", "fontSize": "13px"},
    )

    breakdown_chart = dcc.Graph()
    if breakdown:
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=[b["reason"] for b in breakdown],
            y=[b["count"] for b in breakdown],
            marker_color="#e74c3c",
        ))
        fig.update_layout(
            title="异常原因分布",
            template="plotly_white",
            height=250,
            xaxis_title="异常原因",
            yaxis_title="数量",
        )
        breakdown_chart = dcc.Graph(figure=fig)

    return html.Div([
        html.H4("提醒名单异常标注", style={"fontSize": "16px", "marginBottom": "8px"}),
        html.P(f"口径: {caliber.get('异常标注', '')}", style={"fontSize": "11px", "color": "#888", "marginBottom": "8px"}),
        breakdown_chart,
        html.Div(table_component, style={"maxHeight": "300px", "overflowY": "auto", "marginTop": "12px"}),
    ])
