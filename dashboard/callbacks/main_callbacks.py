import io
import json
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import dash
import dash_bootstrap_components as dbc
from dash import Input, Output, State, callback_context, dcc, html, dash_table, no_update

from etl import (
    DataQuerier,
    DataTransformer,
    FunnelAnalyzer,
    AnomalyDetector,
    MetricsCalculator,
)


def register_callbacks(app):
    @app.callback(
        Output("data-store", "data"),
        Output("anomaly-store", "data"),
        Output("alert-container", "children"),
        Input("start-date-picker", "date"),
        Input("end-date-picker", "date"),
        Input("btn-manual-refresh", "n_clicks"),
        Input("auto-refresh-interval", "n_intervals"),
        State("data-store", "data"),
        prevent_initial_call=False,
    )
    def load_all_data(start_date, end_date, n_clicks, n_intervals, current_data):
        ctx = callback_context
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0] if ctx.triggered else None

        alerts = []

        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        except (ValueError, TypeError):
            return dash.no_update, dash.no_update, dash.no_update

        try:
            with DataQuerier() as querier:
                appointments_df = querier.get_cleaning_appointments(start_dt, end_dt)
                payments_df = querier.get_payment_details(start_dt, end_dt, cleaning_only=True)
                patients_df = querier.get_patient_details(
                    appointments_df["patient_id"].unique().tolist() if not appointments_df.empty else []
                )
                images_df = querier.get_image_attachments(start_dt, end_dt, cleaning_only=True)
                anomalies_df = querier.get_anomalies_with_remarks(start_dt, end_dt)
                no_show_df = querier.get_no_show_trend(start_dt, end_dt)

                transformer = DataTransformer()
                appointments_clean = transformer.clean_appointments(appointments_df)
                payments_clean = transformer.clean_payments(payments_df)

                appointments_merged = transformer.merge_appointments_payments(
                    appointments_clean, payments_clean
                )
                appointments_full = transformer.add_patient_metrics(
                    appointments_merged, patients_df
                )

                if trigger_id == "btn-manual-refresh":
                    alerts.append(
                        dbc.Alert(
                            [
                                html.I(className="fas fa-check-circle me-2"),
                                f"数据刷新成功！处理预约 {len(appointments_full)} 条，收费 {len(payments_clean)} 条",
                            ],
                            color="success",
                            dismissable=True,
                            duration=5000,
                        )
                    )

                if not anomalies_df.empty:
                    unresolved = anomalies_df[anomalies_df["is_resolved"] == False]
                    if len(unresolved) > 0:
                        alerts.append(
                            dbc.Alert(
                                [
                                    html.I(className="fas fa-exclamation-triangle me-2"),
                                    f"检测到 {len(unresolved)} 条未处理异常，请及时关注！",
                                ],
                                color="warning",
                                dismissable=True,
                            )
                        )

                data_store = {
                    "appointments": appointments_full.to_dict("records"),
                    "payments": payments_clean.to_dict("records"),
                    "patients": patients_df.to_dict("records"),
                    "images": images_df.to_dict("records"),
                    "no_show": no_show_df.to_dict("records"),
                    "funnel_data": transformer.calculate_funnel_stages(appointments_full),
                    "start_date": start_date,
                    "end_date": end_date,
                    "last_refresh": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }

                anomaly_store = {
                    "anomalies": anomalies_df.to_dict("records"),
                    "last_refresh": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }

                return data_store, anomaly_store, alerts

        except Exception as e:
            alerts.append(
                dbc.Alert(
                    [
                        html.I(className="fas fa-times-circle me-2"),
                        f"数据加载失败: {str(e)}",
                    ],
                    color="danger",
                    dismissable=True,
                )
            )
            return dash.no_update, dash.no_update, alerts

    @app.callback(
        Output("funnel-chart", "figure"),
        Input("data-store", "data"),
    )
    def update_funnel_chart(data_store):
        if not data_store or "funnel_data" not in data_store:
            return FunnelAnalyzer.create_funnel_chart([])

        stages = data_store["funnel_data"]
        return FunnelAnalyzer.create_funnel_chart(stages)

    @app.callback(
        Output("kpi-total-value", "children"),
        Output("kpi-completed-value", "children"),
        Output("kpi-completion-rate-value", "children"),
        Output("kpi-no-show-value", "children"),
        Output("kpi-no-show-rate-value", "children"),
        Output("kpi-revenue-value", "children"),
        Output("kpi-total-change", "children"),
        Output("kpi-completed-change", "children"),
        Output("kpi-completion-rate-change", "children"),
        Output("kpi-no-show-change", "children"),
        Output("kpi-no-show-rate-change", "children"),
        Output("kpi-revenue-change", "children"),
        Input("data-store", "data"),
    )
    def update_kpis(data_store):
        if not data_store or "appointments" not in data_store:
            return ["0"] * 6 + ["--"] * 6

        appointments_df = pd.DataFrame(data_store["appointments"])
        payments_df = pd.DataFrame(data_store.get("payments", []))

        calculator = MetricsCalculator()
        kpis = calculator.calculate_kpis(appointments_df, payments_df)

        start_date = data_store.get("start_date")
        end_date = data_store.get("end_date")

        prev_text = "环比数据需要更多历史数据"

        return [
            f"{kpis['total_appointments']:,}",
            f"{kpis['completed_count']:,}",
            f"{kpis['completion_rate']:.1f}",
            f"{kpis['no_show_count']:,}",
            f"{kpis['no_show_rate']:.1f}",
            f"{kpis['total_revenue']:,.2f}",
            prev_text,
            prev_text,
            prev_text,
            prev_text,
            prev_text,
            prev_text,
        ]

    @app.callback(
        Output("trend-chart", "figure"),
        Input("data-store", "data"),
        Input("group-by-selector", "value"),
    )
    def update_trend_chart(data_store, group_by):
        if not data_store or "appointments" not in data_store:
            return FunnelAnalyzer.create_trend_chart(pd.DataFrame())

        appointments_df = pd.DataFrame(data_store["appointments"])
        return FunnelAnalyzer.create_trend_chart(appointments_df, group_by=group_by)

    @app.callback(
        Output("anomaly-summary-chart", "figure"),
        Input("anomaly-store", "data"),
    )
    def update_anomaly_summary(anomaly_store):
        if not anomaly_store or "anomalies" not in anomaly_store:
            return FunnelAnalyzer.create_anomaly_summary_table(pd.DataFrame())

        anomalies_df = pd.DataFrame(anomaly_store["anomalies"])
        return FunnelAnalyzer.create_anomaly_summary_table(anomalies_df)

    @app.callback(
        Output("anomaly-table", "data"),
        Output("anomaly-count-badge", "children"),
        Input("anomaly-store", "data"),
    )
    def update_anomaly_table(anomaly_store):
        if not anomaly_store or "anomalies" not in anomaly_store:
            return [], "0"

        anomalies_df = pd.DataFrame(anomaly_store["anomalies"])
        anomalies_df["detected_at"] = pd.to_datetime(anomalies_df["detected_at"]).dt.strftime("%Y-%m-%d %H:%M:%S")
        anomalies_df["is_resolved"] = anomalies_df["is_resolved"].map({True: "已处理", False: "待处理"})
        anomalies_df["severity"] = anomalies_df["severity"].map({"error": "严重", "warning": "警告", "info": "信息"})

        return anomalies_df.to_dict("records"), str(len(anomalies_df))

    @app.callback(
        Output("no-show-trend-chart", "figure"),
        Output("no-show-impact-periods", "children"),
        Input("data-store", "data"),
    )
    def update_no_show_analysis(data_store):
        if not data_store or "no_show" not in data_store:
            empty_fig = FunnelAnalyzer.create_no_show_trend_chart(pd.DataFrame(), [])
            return empty_fig, html.P("暂无爽约数据", className="text-muted")

        no_show_df = pd.DataFrame(data_store["no_show"])

        if no_show_df.empty:
            empty_fig = FunnelAnalyzer.create_no_show_trend_chart(pd.DataFrame(), [])
            return empty_fig, html.P("暂无爽约数据", className="text-muted")

        transformer = DataTransformer()
        impact_periods = transformer.detect_no_show_impact_periods(no_show_df)

        fig = FunnelAnalyzer.create_no_show_trend_chart(no_show_df, impact_periods)

        if impact_periods:
            period_alerts = []
            for period in impact_periods:
                period_alerts.append(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H6(
                                    [
                                        html.I(className="fas fa-clock me-2 text-warning"),
                                        f"异常影响期: {period['start_date']} ~ {period['end_date']}",
                                    ],
                                    className="text-warning mb-2",
                                ),
                                dbc.Row(
                                    [
                                        dbc.Col(
                                            html.Small(
                                                f"爽约数: {period['no_show_count']} 人",
                                                className="text-light",
                                            )
                                        ),
                                        dbc.Col(
                                            html.Small(
                                                f"总预约: {period['total_appointments']} 人",
                                                className="text-light",
                                            )
                                        ),
                                        dbc.Col(
                                            html.Small(
                                                f"爽约率: {period['no_show_rate']}%",
                                                className="text-danger",
                                            )
                                        ),
                                        dbc.Col(
                                            html.Small(
                                                f"偏离均值: +{period['deviation_from_mean']}%",
                                                className="text-warning",
                                            )
                                        ),
                                    ]
                                ),
                            ]
                        ),
                        className="bg-dark border-warning mb-2",
                    )
                )

            return fig, html.Div(
                [
                    html.H6(
                        [
                            html.I(className="fas fa-exclamation-triangle me-2 text-warning"),
                            f"检测到 {len(impact_periods)} 个爽约异常影响期，建议重点关注：",
                        ],
                        className="text-light mb-3",
                    ),
                    html.Div(period_alerts),
                ]
            )

        return fig, html.P("✅ 未检测到显著的爽约率异常波动", className="text-success")

    @app.callback(
        Output("images-stats-chart", "figure"),
        Output("images-type-chart", "figure"),
        Output("images-table", "data"),
        Output("images-count-badge", "children"),
        Output("missing-images-alert", "children"),
        Input("data-store", "data"),
        Input("image-type-filter", "value"),
        Input("image-upload-filter", "value"),
        Input("image-category-filter", "value"),
    )
    def update_images_view(data_store, type_filter, upload_filter, category_filter):
        if not data_store or "images" not in data_store:
            empty_fig = go.Figure()
            return empty_fig, empty_fig, [], "0", html.P("暂无影像数据", className="text-muted")

        images_df = pd.DataFrame(data_store["images"])
        appointments_df = pd.DataFrame(data_store.get("appointments", []))

        filtered = images_df.copy()

        if type_filter != "all" and "image_type" in filtered.columns:
            type_map = {"xray": "X光片", "ct": "CT", "intraoral": "口内照片", "facial": "面部照片"}
            filtered = filtered[filtered["image_type"] == type_map.get(type_filter, type_filter)]

        if category_filter != "all" and "image_category" in filtered.columns:
            cat_map = {"pre": "术前", "intra": "术中", "post": "术后"}
            filtered = filtered[filtered["image_category"] == cat_map.get(category_filter, category_filter)]

        if upload_filter != "all":
            if upload_filter == "uploaded":
                filtered = filtered[filtered["file_name"].notna() & (filtered["file_name"] != "")]
            else:
                filtered = filtered[filtered["file_name"].isna() | (filtered["file_name"] == "")]

        stats_fig = go.Figure()
        if "upload_date" in filtered.columns:
            filtered["upload_date"] = pd.to_datetime(filtered["upload_date"])
            daily = filtered.groupby(filtered["upload_date"].dt.date).size().reset_index(name="count")
            stats_fig.add_trace(
                go.Bar(
                    x=daily["upload_date"],
                    y=daily["count"],
                    marker_color="#06b6d4",
                )
            )
            stats_fig.update_layout(
                title="每日影像上传数量",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=250,
            )

        type_fig = go.Figure()
        if "image_type" in filtered.columns:
            type_counts = filtered["image_type"].value_counts().reset_index()
            type_counts.columns = ["type", "count"]
            type_fig.add_trace(
                go.Pie(
                    labels=type_counts["type"],
                    values=type_counts["count"],
                    hole=0.5,
                    marker=dict(colors=["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]),
                )
            )
            type_fig.update_layout(
                title="影像类型分布",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=250,
            )

        table_data = filtered.to_dict("records")

        missing_count = 0
        missing_alert = html.P("✅ 所有已完成预约均有影像记录", className="text-success")

        if not appointments_df.empty and appointments_df["status"].isin(["已完成"]).any():
            completed = appointments_df[appointments_df["status"] == "已完成"]
            completed_with_images = completed[
                completed["appointment_no"].isin(images_df["appointment_no"].unique())
            ]
            missing_count = len(completed) - len(completed_with_images)

            if missing_count > 0:
                missing_alert = dbc.Alert(
                    [
                        html.I(className="fas fa-exclamation-circle me-2"),
                        f"发现 {missing_count} 条已完成预约缺少影像记录，请及时核对！",
                    ],
                    color="warning",
                )

        return stats_fig, type_fig, table_data, str(len(filtered)), missing_alert

    @app.callback(
        Output("payments-trend-chart", "figure"),
        Output("payments-item-chart", "figure"),
        Output("payments-table", "data"),
        Output("payments-count-badge", "children"),
        Output("kpi-payment-total", "children"),
        Output("kpi-payment-count", "children"),
        Output("kpi-payment-avg", "children"),
        Output("kpi-discount-total", "children"),
        Input("data-store", "data"),
    )
    def update_payments_view(data_store):
        if not data_store or "payments" not in data_store:
            empty_fig = go.Figure()
            return empty_fig, empty_fig, [], "0", "0", "0", "0", "0"

        payments_df = pd.DataFrame(data_store["payments"])
        anomaly_store = dash.callback_context.states.get("anomaly-store", {}).get("data", {})
        anomaly_payment_ids = []

        if anomaly_store and "anomalies" in anomaly_store:
            anomaly_df = pd.DataFrame(anomaly_store["anomalies"])
            if "payment_id" in anomaly_df.columns:
                anomaly_payment_ids = anomaly_df["payment_id"].dropna().unique().tolist()

        payments_df["has_anomaly"] = payments_df["id"].apply(
            lambda x: "有异常" if x in anomaly_payment_ids else "正常"
        )
        payments_df["actions"] = "📝 查看/备注"

        trend_fig = go.Figure()
        if "payment_date" in payments_df.columns:
            payments_df["payment_date"] = pd.to_datetime(payments_df["payment_date"])
            daily = payments_df.groupby(payments_df["payment_date"].dt.date).agg(
                {"actual_amount": "sum", "id": "count"}
            ).reset_index()
            trend_fig.add_trace(
                go.Scatter(
                    x=daily["payment_date"],
                    y=daily["actual_amount"],
                    mode="lines+markers",
                    name="收费金额",
                    yaxis="y",
                    line=dict(color="#10b981", width=2),
                )
            )
            trend_fig.add_trace(
                go.Scatter(
                    x=daily["payment_date"],
                    y=daily["id"],
                    mode="lines+markers",
                    name="收费笔数",
                    yaxis="y2",
                    line=dict(color="#6366f1", width=2),
                )
            )
            trend_fig.update_layout(
                title="收费趋势",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                yaxis=dict(title="金额(元)", side="left"),
                yaxis2=dict(title="笔数", side="right", overlaying="y"),
                margin=dict(l=10, r=10, t=40, b=10),
                height=300,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )

        item_fig = go.Figure()
        if "item_name" in payments_df.columns:
            item_counts = (
                payments_df.groupby("item_name")["actual_amount"]
                .sum()
                .sort_values(ascending=False)
                .head(10)
                .reset_index()
            )
            item_fig.add_trace(
                go.Bar(
                    y=item_counts["item_name"],
                    x=item_counts["actual_amount"],
                    orientation="h",
                    marker_color="#8b5cf6",
                )
            )
            item_fig.update_layout(
                title="收费项目分布(Top10)",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=300,
                yaxis=dict(autorange="reversed"),
            )

        total_amount = payments_df["actual_amount"].sum()
        total_count = len(payments_df)
        avg_amount = total_amount / total_count if total_count > 0 else 0
        total_discount = payments_df["discount_amount"].sum()

        return (
            trend_fig,
            item_fig,
            payments_df.to_dict("records"),
            str(total_count),
            f"{total_amount:,.2f}",
            f"{total_count:,}",
            f"{avg_amount:,.2f}",
            f"{total_discount:,.2f}",
        )

    @app.callback(
        Output("remark-section", "style"),
        Output("remarks-history-section", "style"),
        Output("payment-remarks-history", "children"),
        Input("payments-table", "selected_rows"),
        State("payments-table", "data"),
        State("anomaly-store", "data"),
    )
    def show_payment_remark_section(selected_rows, table_data, anomaly_store):
        if not selected_rows or not table_data:
            return {"display": "none"}, {"display": "none"}, ""

        selected_payment = table_data[selected_rows[0]]
        payment_id = selected_payment["id"]

        history_remarks = []
        if anomaly_store and "anomalies" in anomaly_store:
            anomaly_df = pd.DataFrame(anomaly_store["anomalies"])
            payment_anomalies = anomaly_df[anomaly_df["payment_id"] == payment_id]

            for _, row in payment_anomalies.iterrows():
                if pd.notna(row.get("remark_content")):
                    history_remarks.append(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.H6(
                                        [
                                            html.I(className="fas fa-user me-2"),
                                            row.get("remark_author", "未知"),
                                            html.Small(
                                                f" · {row.get('remark_time', '')}",
                                                className="text-muted ms-2",
                                            ),
                                        ],
                                        className="text-info mb-2",
                                    ),
                                    html.P(row["remark_content"], className="text-light mb-0"),
                                    html.Small(
                                        f"关联异常: {row.get('anomaly_type', '')} - {row.get('description', '')[:50]}...",
                                        className="text-warning",
                                    ),
                                ]
                            ),
                            className="bg-dark border-info mb-2",
                        )
                    )

        if not history_remarks:
            history_remarks.append(
                html.P("该收费记录暂无历史备注", className="text-muted")
            )

        return (
            {"display": "block"},
            {"display": "block"},
            html.Div(history_remarks),
        )

    @app.callback(
        Output("remark-save-status", "children"),
        Input("btn-save-remark", "n_clicks"),
        State("payments-table", "selected_rows"),
        State("payments-table", "data"),
        State("remark-author", "value"),
        State("remark-content", "value"),
        prevent_initial_call=True,
    )
    def save_payment_remark(n_clicks, selected_rows, table_data, author, content):
        if not n_clicks or not selected_rows or not author or not content:
            return dash.no_update

        selected_payment = table_data[selected_rows[0]]
        payment_id = selected_payment["id"]

        try:
            with DataQuerier() as querier:
                querier.save_payment_remark(
                    payment_id=payment_id,
                    author=author,
                    content=content,
                )

            return dbc.Alert(
                [
                    html.I(className="fas fa-check-circle me-2"),
                    "备注保存成功！",
                ],
                color="success",
                dismissable=True,
                duration=3000,
            )
        except Exception as e:
            return dbc.Alert(
                [
                    html.I(className="fas fa-times-circle me-2"),
                    f"备注保存失败: {str(e)}",
                ],
                color="danger",
                dismissable=True,
            )

    @app.callback(
        Output("patient-gender-chart", "figure"),
        Output("patient-age-chart", "figure"),
        Output("patient-visit-chart", "figure"),
        Output("patients-table", "data"),
        Output("patients-count-badge", "children"),
        Output("kpi-patient-total", "children"),
        Output("kpi-patient-new", "children"),
        Output("kpi-patient-return", "children"),
        Output("kpi-patient-avg-visits", "children"),
        Input("data-store", "data"),
        Input("patient-search-input", "value"),
        Input("patient-age-filter", "value"),
        Input("patient-visit-filter", "value"),
    )
    def update_patients_view(data_store, search, age_filter, visit_filter):
        if not data_store or "patients" not in data_store:
            empty_fig = go.Figure()
            return empty_fig, empty_fig, empty_fig, [], "0", "0", "0", "0", "0"

        patients_df = pd.DataFrame(data_store["patients"])
        appointments_df = pd.DataFrame(data_store.get("appointments", []))
        payments_df = pd.DataFrame(data_store.get("payments", []))

        if not patients_df.empty and not payments_df.empty:
            patient_spending = (
                payments_df.groupby("patient_id")["actual_amount"].sum().reset_index()
            )
            patients_df = patients_df.merge(
                patient_spending, on="patient_id", how="left"
            )
            patients_df["total_spent"] = patients_df["actual_amount"].fillna(0)

        transformer = DataTransformer()
        revisit_info = transformer.calculate_revisit_rate(appointments_df)

        patients_df["revisit_rate"] = revisit_info["revisit_rate"]
        patients_df["is_active"] = patients_df["is_active"].map({True: "活跃", False: "不活跃"})
        patients_df["actions"] = "📋 查看详情"

        filtered = patients_df.copy()

        if search:
            search = search.lower()
            filtered = filtered[
                filtered["patient_id"].astype(str).str.lower().str.contains(search)
                | filtered["name"].astype(str).str.lower().str.contains(search)
            ]

        if age_filter != "all" and "age" in filtered.columns:
            if age_filter == "0-17":
                filtered = filtered[filtered["age"] < 18]
            elif age_filter == "18-29":
                filtered = filtered[(filtered["age"] >= 18) & (filtered["age"] < 30)]
            elif age_filter == "30-44":
                filtered = filtered[(filtered["age"] >= 30) & (filtered["age"] < 45)]
            elif age_filter == "45-59":
                filtered = filtered[(filtered["age"] >= 45) & (filtered["age"] < 60)]
            elif age_filter == "60+":
                filtered = filtered[filtered["age"] >= 60]

        if visit_filter != "all" and "total_visits" in filtered.columns:
            if visit_filter == "1":
                filtered = filtered[filtered["total_visits"] == 1]
            elif visit_filter == "2-3":
                filtered = filtered[(filtered["total_visits"] >= 2) & (filtered["total_visits"] <= 3)]
            elif visit_filter == "4+":
                filtered = filtered[filtered["total_visits"] >= 4]

        gender_fig = go.Figure()
        if "gender" in filtered.columns:
            gender_counts = filtered["gender"].value_counts().reset_index()
            gender_counts.columns = ["gender", "count"]
            gender_fig.add_trace(
                go.Pie(
                    labels=gender_counts["gender"],
                    values=gender_counts["count"],
                    hole=0.5,
                    marker=dict(colors=["#ec4899", "#3b82f6", "#6b7280"]),
                )
            )
            gender_fig.update_layout(
                title="性别分布",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=250,
            )

        age_fig = go.Figure()
        if "age" in filtered.columns:
            calculator = MetricsCalculator()
            age_dist = calculator.calculate_age_distribution(
                filtered.merge(appointments_df[["patient_id"]].drop_duplicates(), on="patient_id")
            )
            if not age_dist.empty:
                age_fig.add_trace(
                    go.Bar(
                        x=age_dist["age_group"],
                        y=age_dist["count"],
                        marker_color="#06b6d4",
                    )
                )
                age_fig.update_layout(
                    title="年龄分布",
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font_color="#e5e7eb",
                    margin=dict(l=10, r=10, t=40, b=10),
                    height=250,
                )

        visit_fig = go.Figure()
        if "total_visits" in filtered.columns:
            def visit_group(v):
                if v == 1:
                    return "初诊(1次)"
                elif v <= 3:
                    return "复诊(2-3次)"
                else:
                    return "高频(4次以上)"

            filtered["visit_group"] = filtered["total_visits"].apply(visit_group)
            visit_counts = filtered["visit_group"].value_counts().reset_index()
            visit_counts.columns = ["group", "count"]
            visit_fig.add_trace(
                go.Pie(
                    labels=visit_counts["group"],
                    values=visit_counts["count"],
                    hole=0.5,
                    marker=dict(colors=["#10b981", "#6366f1", "#f59e0b"]),
                )
            )
            visit_fig.update_layout(
                title="就诊次数分布",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=250,
            )

        total_patients = len(filtered)
        new_patients = len(filtered[filtered["total_visits"] == 1]) if "total_visits" in filtered.columns else 0
        return_patients = total_patients - new_patients
        avg_visits = filtered["total_visits"].mean() if "total_visits" in filtered.columns else 0

        return (
            gender_fig,
            age_fig,
            visit_fig,
            filtered.to_dict("records"),
            str(total_patients),
            f"{total_patients:,}",
            f"{new_patients:,}",
            f"{return_patients:,}",
            f"{avg_visits:.1f}",
        )

    @app.callback(
        Output("patient-history-card", "style"),
        Output("patient-history-detail", "children"),
        Input("patients-table", "selected_rows"),
        State("patients-table", "data"),
        State("data-store", "data"),
    )
    def show_patient_history(selected_rows, table_data, data_store):
        if not selected_rows or not table_data:
            return {"display": "none"}, ""

        selected_patient = table_data[selected_rows[0]]
        patient_id = selected_patient["patient_id"]

        appointments_df = pd.DataFrame(data_store.get("appointments", []))
        patient_appts = appointments_df[appointments_df["patient_id"] == patient_id].copy()

        if patient_appts.empty:
            return {"display": "block"}, html.P("该患者暂无就诊记录", className="text-muted")

        patient_appts["appointment_date"] = pd.to_datetime(patient_appts["appointment_date"]).dt.strftime("%Y-%m-%d")

        status_colors = {
            "已预约": "badge-info",
            "已确认": "badge-primary",
            "已到院": "badge-secondary",
            "已完成": "badge-success",
            "爽约": "badge-danger",
            "已取消": "badge-warning",
        }

        history_cards = []
        for _, row in patient_appts.iterrows():
            status_badge = dbc.Badge(
                row["status"],
                color=status_colors.get(row["status"], "secondary"),
                className="ms-2",
            )
            history_cards.append(
                dbc.Card(
                    dbc.CardBody(
                        [
                            html.H6(
                                [
                                    html.I(className="fas fa-calendar-check me-2 text-info"),
                                    row["appointment_date"],
                                    html.Small(
                                        f" · {row.get('appointment_time', '')}",
                                        className="text-muted ms-2",
                                    ),
                                    status_badge,
                                ],
                                className="text-light mb-2",
                            ),
                            dbc.Row(
                                [
                                    dbc.Col(
                                        html.Small(
                                            f"项目: {row.get('service_item', '洁牙')}",
                                            className="text-light",
                                        ),
                                        md=4,
                                    ),
                                    dbc.Col(
                                        html.Small(
                                            f"医生: {row.get('doctor', '未分配')}",
                                            className="text-light",
                                        ),
                                        md=4,
                                    ),
                                    dbc.Col(
                                        html.Small(
                                            f"金额: ¥{row.get('paid_amount', 0):,.2f}",
                                            className="text-success",
                                        ),
                                        md=4,
                                    ),
                                ]
                            ),
                        ]
                    ),
                    className="bg-dark border-secondary mb-2",
                )
            )

        return (
            {"display": "block"},
            html.Div(
                [
                    html.H6(
                        [
                            html.I(className="fas fa-user me-2"),
                            f"{selected_patient.get('name', '未知')} ({patient_id}) 的就诊历史",
                        ],
                        className="text-light mb-3",
                    ),
                    html.Div(history_cards),
                ]
            ),
        )

    @app.callback(
        Output("review-status-chart", "figure"),
        Output("review-type-chart", "figure"),
        Output("review-trend-chart", "figure"),
        Output("review-table", "data"),
        Output("review-count-badge", "children"),
        Input("anomaly-store", "data"),
        Input("review-anomaly-type", "value"),
        Input("review-severity", "value"),
        Input("review-status", "value"),
        Input("review-has-remark", "value"),
    )
    def update_review_view(anomaly_store, type_filter, severity_filter, status_filter, remark_filter):
        if not anomaly_store or "anomalies" not in anomaly_store:
            empty_fig = go.Figure()
            return empty_fig, empty_fig, empty_fig, [], "0"

        anomalies_df = pd.DataFrame(anomaly_store["anomalies"])

        filtered = anomalies_df.copy()

        if type_filter != "all":
            filtered = filtered[filtered["anomaly_type"] == type_filter]

        if severity_filter != "all":
            filtered = filtered[filtered["severity"] == severity_filter]

        if status_filter != "all":
            if status_filter == "resolved":
                filtered = filtered[filtered["is_resolved"] == True]
            else:
                filtered = filtered[filtered["is_resolved"] == False]

        if remark_filter != "all":
            has_remark = filtered["remark_content"].notna() & (filtered["remark_content"] != "")
            if remark_filter == "yes":
                filtered = filtered[has_remark]
            else:
                filtered = filtered[~has_remark]

        status_fig = go.Figure()
        status_counts = filtered["is_resolved"].value_counts().reset_index()
        status_counts.columns = ["status", "count"]
        status_counts["status"] = status_counts["status"].map({True: "已处理", False: "待处理"})
        status_fig.add_trace(
            go.Pie(
                labels=status_counts["status"],
                values=status_counts["count"],
                hole=0.5,
                marker=dict(colors=["#10b981", "#ef4444"]),
            )
        )
        status_fig.update_layout(
            title="处理状态",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#e5e7eb",
            margin=dict(l=10, r=10, t=40, b=10),
            height=250,
        )

        type_fig = go.Figure()
        type_counts = filtered["anomaly_type"].value_counts().reset_index()
        type_counts.columns = ["type", "count"]
        type_fig.add_trace(
            go.Bar(
                y=type_counts["type"],
                x=type_counts["count"],
                orientation="h",
                marker=dict(
                    color=[
                        "#ef4444" if t == "预约表延迟"
                        else "#f59e0b" if t == "收费记录缺失"
                        else "#8b5cf6" if t == "HIS口径变化"
                        else "#6366f1" if t == "数据不一致"
                        else "#06b6d4"
                        for t in type_counts["type"]
                    ]
                ),
            )
        )
        type_fig.update_layout(
            title="异常类型分布",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#e5e7eb",
            margin=dict(l=10, r=10, t=40, b=10),
            height=250,
            yaxis=dict(autorange="reversed"),
        )

        trend_fig = go.Figure()
        if "detected_at" in filtered.columns:
            filtered["detected_date"] = pd.to_datetime(filtered["detected_at"]).dt.date
            daily = filtered.groupby("detected_date").size().reset_index(name="count")
            trend_fig.add_trace(
                go.Scatter(
                    x=daily["detected_date"],
                    y=daily["count"],
                    mode="lines+markers",
                    line=dict(color="#ef4444", width=2),
                )
            )
            trend_fig.update_layout(
                title="异常检测趋势",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#e5e7eb",
                margin=dict(l=10, r=10, t=40, b=10),
                height=250,
            )

        table_df = filtered.copy()
        table_df["detected_at"] = pd.to_datetime(table_df["detected_at"]).dt.strftime("%Y-%m-%d %H:%M:%S")
        table_df["is_resolved"] = table_df["is_resolved"].map({True: "已处理", False: "待处理"})
        table_df["severity"] = table_df["severity"].map({"error": "严重", "warning": "警告", "info": "信息"})
        table_df["remark_time"] = pd.to_datetime(table_df["remark_time"]).dt.strftime("%Y-%m-%d %H:%M:%S") if "remark_time" in table_df.columns else ""
        table_df["data_snapshot"] = "🔍 查看详情"

        return (
            status_fig,
            type_fig,
            trend_fig,
            table_df.to_dict("records"),
            str(len(filtered)),
        )

    @app.callback(
        Output("review-detail-card", "style"),
        Output("review-history-card", "style"),
        Output("review-detail-content", "children"),
        Output("review-history-remarks", "children"),
        Output("review-remark-section", "style"),
        Input("review-table", "selected_rows"),
        State("review-table", "data"),
        State("anomaly-store", "data"),
    )
    def show_review_detail(selected_rows, table_data, anomaly_store):
        if not selected_rows or not table_data:
            return (
                {"display": "none"},
                {"display": "none"},
                "",
                "",
                {"display": "none"},
            )

        selected = table_data[selected_rows[0]]
        anomaly_id = selected["id"]

        detail_content = dbc.Card(
            dbc.CardBody(
                [
                    dbc.Row(
                        [
                            dbc.Col(
                                [
                                    html.Label("异常类型", className="text-muted small"),
                                    html.H6(selected["anomaly_type"], className="text-white"),
                                ],
                                md=3,
                            ),
                            dbc.Col(
                                [
                                    html.Label("严重程度", className="text-muted small"),
                                    html.H6(
                                        selected["severity"],
                                        className="text-danger" if selected["severity"] == "严重" else "text-warning",
                                    ),
                                ],
                                md=3,
                            ),
                            dbc.Col(
                                [
                                    html.Label("检测时间", className="text-muted small"),
                                    html.H6(selected["detected_at"], className="text-white"),
                                ],
                                md=3,
                            ),
                            dbc.Col(
                                [
                                    html.Label("状态", className="text-muted small"),
                                    html.H6(
                                        selected["is_resolved"],
                                        className="text-success" if selected["is_resolved"] == "已处理" else "text-warning",
                                    ),
                                ],
                                md=3,
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Hr(className="my-3"),
                    html.Label("异常描述", className="text-muted small"),
                    html.P(selected["description"], className="text-white"),
                    html.Hr(className="my-3"),
                    html.Label("数据快照", className="text-muted small"),
                    html.Pre(
                        json.dumps(selected.get("data_snapshot", {}), indent=2, ensure_ascii=False),
                        className="bg-dark text-success p-3 rounded small",
                        style={"maxHeight": "200px", "overflowY": "auto"},
                    ),
                ]
            ),
            className="bg-dark border-info",
        )

        history_remarks = []
        if anomaly_store and "anomalies" in anomaly_store:
            anomaly_df = pd.DataFrame(anomaly_store["anomalies"])
            anomaly_record = anomaly_df[anomaly_df["id"] == anomaly_id]

            if not anomaly_record.empty and pd.notna(anomaly_record.iloc[0].get("remark_content")):
                row = anomaly_record.iloc[0]
                history_remarks.append(
                    dbc.Card(
                        dbc.CardBody(
                            [
                                html.H6(
                                    [
                                        html.I(className="fas fa-user me-2 text-info"),
                                        row.get("remark_author", "未知"),
                                        html.Small(
                                            f" · {row.get('remark_time', '')}",
                                            className="text-muted ms-2",
                                        ),
                                    ],
                                    className="text-info mb-2",
                                ),
                                html.P(row["remark_content"], className="text-light mb-0"),
                            ]
                        ),
                        className="bg-dark border-info mb-2",
                    )
                )

        if not history_remarks:
            history_remarks.append(
                html.P("该异常点暂无历史复盘记录", className="text-muted")
            )

        return (
            {"display": "block"},
            {"display": "block"},
            detail_content,
            html.Div(history_remarks),
            {"display": "block"},
        )

    @app.callback(
        Output("review-save-status", "children"),
        Input("btn-save-review", "n_clicks"),
        State("review-table", "selected_rows"),
        State("review-table", "data"),
        State("review-remark-author", "value"),
        State("review-remark-content", "value"),
        prevent_initial_call=True,
    )
    def save_review_remark(n_clicks, selected_rows, table_data, author, content):
        if not n_clicks or not selected_rows or not author or not content:
            return dash.no_update

        selected = table_data[selected_rows[0]]
        anomaly_id = selected["id"]

        try:
            with DataQuerier() as querier:
                querier.save_anomaly_remark(
                    anomaly_id=anomaly_id,
                    author=author,
                    content=content,
                    is_review_note=True,
                )

            return dbc.Alert(
                [
                    html.I(className="fas fa-check-circle me-2"),
                    "复盘备注保存成功！",
                ],
                color="success",
                dismissable=True,
                duration=3000,
            )
        except Exception as e:
            return dbc.Alert(
                [
                    html.I(className="fas fa-times-circle me-2"),
                    f"复盘备注保存失败: {str(e)}",
                ],
                color="danger",
                dismissable=True,
            )

    @app.callback(
        Output("download-excel", "data"),
        Input("btn-export-data", "n_clicks"),
        State("data-store", "data"),
        prevent_initial_call=True,
    )
    def export_data(n_clicks, data_store):
        if not n_clicks or not data_store:
            return dash.no_update

        try:
            appointments_df = pd.DataFrame(data_store.get("appointments", []))
            payments_df = pd.DataFrame(data_store.get("payments", []))

            transformer = DataTransformer()
            revisit_info = transformer.calculate_revisit_rate(appointments_df)
            data_sheets = transformer.get_download_data(appointments_df, payments_df, revisit_info)

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                for sheet_name, df in data_sheets.items():
                    df.to_excel(writer, sheet_name=sheet_name, index=False)

            output.seek(0)
            filename = f"洁牙预约报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

            return dcc.send_bytes(output.getvalue(), filename)

        except Exception as e:
            return dash.no_update
