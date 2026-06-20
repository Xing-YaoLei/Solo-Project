import io
from datetime import datetime
import pandas as pd
from dash import Input, Output, State, callback, ctx, html, dash_table, dcc
import dash_bootstrap_components as dbc

from app.dashboard.charts import (
    create_funnel_chart,
    create_checkin_efficiency_chart,
    create_ticket_type_chart,
    create_anomaly_table,
    create_gate_records_table,
    create_ticket_rules_table,
    create_raw_samples_table,
)
from app.utils.data_service import DataService


def _format_number(num):
    if num >= 10000:
        return f"{num/10000:.1f}万"
    return str(num)


def _normalise_list(val):
    if val is None:
        return None
    if isinstance(val, list):
        return val if len(val) > 0 else None
    return [val]


def register_callbacks(app):

    @app.callback(
        [
            Output("activity-selector", "options"),
            Output("activity-selector", "value"),
        ],
        Input("activity-selector", "id"),
    )
    def init_activity_selector(_):
        service = DataService()
        try:
            activities = service.get_activities()
            options = [{"label": a["name"], "value": a["id"]} for a in activities]
            default_value = options[0]["value"] if options else None
            return options, default_value
        finally:
            service.close()

    @app.callback(
        [
            Output("kpi-sponsors", "children"),
            Output("kpi-registrations", "children"),
            Output("kpi-payments", "children"),
            Output("kpi-checkins", "children"),
            Output("funnel-chart", "figure"),
            Output("checkin-efficiency-chart", "figure"),
            Output("ticket-type-chart", "figure"),
            Output("sponsor-table", "data"),
            Output("anomaly-table-container", "children"),
            Output("anomaly-count", "children"),
            Output("last-update-time", "children"),
            Output("ticket-type-filter", "options"),
            Output("sponsor-level-filter", "options"),
        ],
        [
            Input("activity-selector", "value"),
            Input("apply-filter-btn", "n_clicks"),
            Input("reset-filter-btn", "n_clicks"),
        ],
        [
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
            State("sponsor-level-filter", "value"),
        ],
        prevent_initial_call=False,
    )
    def update_dashboard(
        activity_id, apply_clicks, reset_clicks,
        start_date, end_date,
        ticket_types, sponsor_levels,
    ):
        triggered = ctx.triggered_id
        tt_ids = None
        sl_lvls = None
        sd = start_date
        ed = end_date

        if triggered == "reset-filter-btn":
            sd = None
            ed = None
            tt_ids = None
            sl_lvls = None
        else:
            tt_ids = _normalise_list(ticket_types)
            sl_lvls = _normalise_list(sponsor_levels)

        service = DataService()
        try:
            funnel_data = service.get_funnel_data(
                activity_id=activity_id,
                start_date=sd,
                end_date=ed,
                ticket_type_ids=tt_ids,
                sponsor_levels=sl_lvls,
            )
            sponsor_df = service.get_sponsor_list(
                activity_id=activity_id,
                start_date=sd,
                end_date=ed,
                ticket_type_ids=tt_ids,
                sponsor_levels=sl_lvls,
            )
            anomaly_df = service.get_anomaly_records(activity_id=activity_id, is_resolved=False)
            ticket_type_df = service.get_ticket_types(
                activity_id=activity_id,
                start_date=sd,
                end_date=ed,
                sponsor_levels=sl_lvls,
                ticket_type_ids=tt_ids,
            )
            efficiency_df = service.get_checkin_efficiency(
                activity_id=activity_id,
                start_date=sd,
                end_date=ed,
                ticket_type_ids=tt_ids,
                sponsor_levels=sl_lvls,
            )

            if not funnel_data.empty:
                sponsor_count = int(funnel_data.iloc[0]["count"])
                reg_count = int(funnel_data.iloc[1]["count"])
                pay_count = int(funnel_data.iloc[2]["count"])
                checkin_count = int(funnel_data.iloc[3]["count"])
            else:
                sponsor_count = 0
                reg_count = 0
                pay_count = 0
                checkin_count = 0

            funnel_fig = create_funnel_chart(funnel_data)
            efficiency_fig = create_checkin_efficiency_chart(efficiency_df)
            ticket_type_fig = create_ticket_type_chart(ticket_type_df)

            if not sponsor_df.empty:
                sponsor_display = sponsor_df.copy()
                usage_pct = (sponsor_display["usage_rate"] * 100).round(1).astype(str) + "%"
                checkin_pct = (sponsor_display["checkin_rate"] * 100).round(1).astype(str) + "%"
                sponsor_display = sponsor_display.assign(使用率=usage_pct, 核销率=checkin_pct)
                sponsor_data = sponsor_display.to_dict("records")
            else:
                sponsor_data = []

            anomaly_table = create_anomaly_table(anomaly_df)

            anomaly_count = f"{len(anomaly_df)} 项异常"

            update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            tt_options = []
            if not ticket_type_df.empty:
                for _, t in ticket_type_df.iterrows():
                    label = t["name"]
                    if t.get("sold_quantity"):
                        label += f" (销量:{t['sold_quantity']})"
                    tt_options.append({"label": label, "value": t["id"]})

            sponsor_levels_list = sponsor_df["sponsor_level"].unique().tolist() if not sponsor_df.empty else []
            sl_options = [{"label": lvl, "value": lvl} for lvl in sponsor_levels_list]

            return (
                _format_number(sponsor_count),
                _format_number(reg_count),
                _format_number(pay_count),
                _format_number(checkin_count),
                funnel_fig,
                efficiency_fig,
                ticket_type_fig,
                sponsor_data,
                anomaly_table,
                anomaly_count,
                update_time,
                tt_options,
                sl_options,
            )
        finally:
            service.close()

    @app.callback(
        [
            Output("drilldown-container", "style"),
            Output("selected-sponsor-id", "data"),
            Output("sponsor-table", "selected_rows"),
        ],
        [
            Input("sponsor-table", "selected_rows"),
            Input("close-drilldown-btn", "n_clicks"),
        ],
        [
            State("sponsor-table", "data"),
        ],
        prevent_initial_call=True,
    )
    def toggle_drilldown(selected_rows, close_clicks, table_data):
        triggered = ctx.triggered_id

        if triggered == "close-drilldown-btn":
            return {"display": "none"}, None, []

        if triggered == "sponsor-table":
            if selected_rows and len(selected_rows) > 0:
                idx = selected_rows[0]
                if table_data and len(table_data) > idx:
                    sponsor_id = table_data[idx].get("id")
                    return {"display": "block"}, sponsor_id, selected_rows

        return {"display": "none"}, None, []

    @app.callback(
        Output("gate-records-content", "children"),
        [
            Input("selected-sponsor-id", "data"),
            Input("apply-filter-btn", "n_clicks"),
            Input("reset-filter-btn", "n_clicks"),
        ],
        [
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
        ],
        prevent_initial_call=True,
    )
    def update_gate_records(sponsor_id, apply_clicks, reset_clicks,
                            start_date, end_date, ticket_types):
        if not sponsor_id:
            return html.Div("请选择赞助商", className="text-center text-muted py-4")

        triggered = ctx.triggered_id
        tt_ids = None
        sd = start_date
        ed = end_date
        if triggered == "reset-filter-btn":
            sd = None
            ed = None
            tt_ids = None
        else:
            tt_ids = _normalise_list(ticket_types)

        service = DataService()
        try:
            gate_records = service.get_gate_records_by_sponsor(
                sponsor_id,
                start_date=sd,
                end_date=ed,
                ticket_type_ids=tt_ids,
            )
            if gate_records.empty:
                return html.Div(
                    [
                        html.I(className="fas fa-inbox fa-3x text-muted mb-3"),
                        html.H6("暂无核销记录", className="text-muted"),
                        html.P(
                            "该赞助商当前筛选条件下没有核销入场数据",
                            className="small text-muted mb-0",
                        ),
                    ],
                    className="text-center py-5",
                )
            return create_gate_records_table(gate_records)
        finally:
            service.close()

    @app.callback(
        Output("ticket-rules-content", "children"),
        [
            Input("selected-sponsor-id", "data"),
            Input("apply-filter-btn", "n_clicks"),
            Input("reset-filter-btn", "n_clicks"),
        ],
        [
            State("activity-selector", "value"),
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
            State("sponsor-level-filter", "value"),
        ],
        prevent_initial_call=True,
    )
    def update_ticket_rules(sponsor_id, apply_clicks, reset_clicks,
                            activity_id, start_date, end_date,
                            ticket_types, sponsor_levels):
        if not sponsor_id:
            return html.Div("请选择赞助商", className="text-center text-muted py-4")

        triggered = ctx.triggered_id
        sl_lvls = None
        tt_ids = None
        sd = start_date
        ed = end_date
        if triggered == "reset-filter-btn":
            sd = None
            ed = None
            tt_ids = None
            sl_lvls = None
        else:
            tt_ids = _normalise_list(ticket_types)
            sl_lvls = _normalise_list(sponsor_levels)

        service = DataService()
        try:
            ticket_types = service.get_ticket_types(
                activity_id=activity_id,
                start_date=sd,
                end_date=ed,
                sponsor_levels=sl_lvls,
                ticket_type_ids=tt_ids,
            )
            if ticket_types.empty:
                return html.Div(
                    [
                        html.I(className="fas fa-inbox fa-3x text-muted mb-3"),
                        html.H6("暂无票种数据", className="text-muted"),
                        html.P(
                            "当前筛选条件下没有匹配的票种规则",
                            className="small text-muted mb-0",
                        ),
                    ],
                    className="text-center py-5",
                )
            return create_ticket_rules_table(ticket_types)
        finally:
            service.close()

    @app.callback(
        Output("raw-samples-content", "children"),
        [
            Input("selected-sponsor-id", "data"),
            Input("apply-filter-btn", "n_clicks"),
            Input("reset-filter-btn", "n_clicks"),
        ],
        [
            State("activity-selector", "value"),
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
            State("sponsor-level-filter", "value"),
        ],
        prevent_initial_call=True,
    )
    def update_raw_samples(sponsor_id, apply_clicks, reset_clicks,
                           activity_id, start_date, end_date,
                           ticket_types, sponsor_levels):
        if not sponsor_id:
            return html.Div("请选择赞助商", className="text-center text-muted py-4")

        triggered = ctx.triggered_id
        tt_ids = None
        sl_lvls = None
        sd = start_date
        ed = end_date
        if triggered == "reset-filter-btn":
            sd = None
            ed = None
            tt_ids = None
            sl_lvls = None
        else:
            tt_ids = _normalise_list(ticket_types)
            sl_lvls = _normalise_list(sponsor_levels)

        service = DataService()
        try:
            samples = service.get_raw_samples(
                activity_id=activity_id,
                sponsor_id=sponsor_id,
                start_date=sd,
                end_date=ed,
                ticket_type_ids=tt_ids,
                sponsor_levels=sl_lvls,
                limit=100,
            )
            if samples.empty:
                return html.Div(
                    [
                        html.I(className="fas fa-inbox fa-3x text-muted mb-3"),
                        html.H6("暂无原始样本", className="text-muted"),
                        html.P(
                            "该赞助商当前筛选条件下没有匹配的订单样本",
                            className="small text-muted mb-0",
                        ),
                    ],
                    className="text-center py-5",
                )
            return create_raw_samples_table(samples)
        finally:
            service.close()

    @app.callback(
        [
            Output("remark-modal", "is_open"),
            Output("remark-list", "children"),
            Output("funnel-remark-count", "children"),
            Output("remark-input", "value"),
        ],
        [
            Input("funnel-remark-btn", "n_clicks"),
            Input("close-remark-modal", "n_clicks"),
            Input("add-remark-btn", "n_clicks"),
        ],
        [
            State("remark-modal", "is_open"),
            State("remark-input", "value"),
            State("remark-author", "value"),
            State("activity-selector", "value"),
        ],
        prevent_initial_call=False,
    )
    def toggle_remark_modal(
        open_clicks, close_clicks, add_clicks,
        is_open, remark_content, author, activity_id,
    ):
        service = DataService()
        try:
            triggered = ctx.triggered_id
            new_remark_value = remark_content

            if triggered == "add-remark-btn" and remark_content:
                created_by = author or "匿名"
                service.add_remark(
                    target_type="chart",
                    target_id="funnel_chart",
                    content=remark_content,
                    created_by=created_by,
                )
                new_remark_value = ""

            remarks = service.get_remarks("chart", "funnel_chart")
            remark_count = f"{len(remarks)} 条备注"

            if remarks.empty:
                remark_list = html.Div(
                    "暂无备注",
                    className="text-center text-muted py-3",
                )
            else:
                remark_items = []
                for _, r in remarks.iterrows():
                    remark_items.append(
                        dbc.Card(
                            dbc.CardBody(
                                [
                                    html.Div(
                                        [
                                            html.Strong(r["created_by"]),
                                            html.Small(
                                                f" · {r['created_at']}",
                                                className="text-muted ms-2",
                                            ),
                                        ],
                                        className="mb-1",
                                    ),
                                    html.P(r["content"], className="mb-0 small"),
                                ]
                            ),
                            className="mb-2",
                        )
                    )
                remark_list = html.Div(remark_items)

            if triggered == "funnel-remark-btn":
                return True, remark_list, remark_count, remark_content or ""
            elif triggered == "close-remark-modal":
                return False, remark_list, remark_count, remark_content or ""
            elif triggered == "add-remark-btn":
                return True, remark_list, remark_count, new_remark_value
            else:
                return is_open, remark_list, remark_count, remark_content or ""

        finally:
            service.close()

    @app.callback(
        [
            Output("export-modal", "is_open"),
            Output("export-filters-info", "children"),
        ],
        [
            Input("export-btn", "n_clicks"),
            Input("close-export-modal", "n_clicks"),
            Input("confirm-export-btn", "n_clicks"),
        ],
        [
            State("export-modal", "is_open"),
            State("activity-selector", "value"),
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
            State("sponsor-level-filter", "value"),
        ],
        prevent_initial_call=True,
    )
    def toggle_export_modal(
        export_clicks, close_clicks, confirm_clicks,
        is_open, activity_id, start_date, end_date,
        ticket_types, sponsor_levels,
    ):
        triggered = ctx.triggered_id

        if triggered == "close-export-modal":
            return False, ""

        if triggered == "confirm-export-btn":
            return False, ""

        if triggered == "export-btn":
            service = DataService()
            try:
                activities = service.get_activities()
                activity_name = next(
                    (a["name"] for a in activities if a["id"] == activity_id),
                    "全部活动",
                )

                tt_ids = _normalise_list(ticket_types)
                sl_lvls = _normalise_list(sponsor_levels)

                tt_names = []
                if tt_ids:
                    tt_df = service.get_ticket_types(activity_id=activity_id)
                    for tt_id in tt_ids:
                        match = tt_df[tt_df["id"] == tt_id]
                        if not match.empty:
                            tt_names.append(match.iloc[0]["name"])

            finally:
                service.close()

            items = [
                html.Li(f"活动：{activity_name}"),
                html.Li(f"日期范围：{start_date or '不限'} 至 {end_date or '不限'}"),
            ]
            if tt_names:
                items.append(html.Li(f"票种：{'、'.join(tt_names)}"))
            else:
                items.append(html.Li("票种：全部"))
            if sl_lvls:
                items.append(html.Li(f"赞助级别：{'、'.join(sl_lvls)}"))
            else:
                items.append(html.Li("赞助级别：全部"))
            items.append(html.Li(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"))

            filter_info = html.Div(
                [
                    html.H6("当前筛选口径：", className="text-primary mb-2"),
                    html.Ul(items, className="mb-0 small"),
                ]
            )
            return True, filter_info

        return is_open, ""

    @app.callback(
        Output("download-excel", "data"),
        Input("confirm-export-btn", "n_clicks"),
        [
            State("activity-selector", "value"),
            State("date-range", "start_date"),
            State("date-range", "end_date"),
            State("ticket-type-filter", "value"),
            State("sponsor-level-filter", "value"),
            State("export-format", "value"),
            State("export-content", "value"),
        ],
        prevent_initial_call=True,
    )
    def export_report(
        n_clicks, activity_id, start_date, end_date,
        ticket_types, sponsor_levels,
        export_format, export_content,
    ):
        tt_ids = _normalise_list(ticket_types)
        sl_lvls = _normalise_list(sponsor_levels)

        service = DataService()
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"票务漏斗报表_{timestamp}"

            activities = service.get_activities()
            activity_name = next(
                (a["name"] for a in activities if a["id"] == activity_id),
                "全部活动",
            )

            tt_names = []
            if tt_ids:
                tt_all = service.get_ticket_types(activity_id=activity_id)
                for tt_id in tt_ids:
                    match = tt_all[tt_all["id"] == tt_id]
                    if not match.empty:
                        tt_names.append(match.iloc[0]["name"])

            data_frames = {}

            filter_lines = [
                f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                f"活动：{activity_name}（ID: {activity_id or '全部'}）",
                f"日期范围：{start_date or '不限'} 至 {end_date or '不限'}",
                f"票种：{'、'.join(tt_names) if tt_names else '全部'}",
                f"赞助级别：{'、'.join(sl_lvls) if sl_lvls else '全部'}",
                "统计口径：团队例会专用口径 · 赞助 → 报名 → 支付 → 核销",
            ]
            summary_data = {
                "项目": ["筛选口径与说明"],
                "内容": ["\n".join(filter_lines)],
            }
            data_frames["报表信息"] = pd.DataFrame(summary_data)

            if "funnel" in export_content:
                funnel_data = service.get_funnel_data(
                    activity_id=activity_id,
                    start_date=start_date,
                    end_date=end_date,
                    ticket_type_ids=tt_ids,
                    sponsor_levels=sl_lvls,
                )
                if not funnel_data.empty:
                    data_frames["漏斗转化"] = funnel_data

            if "efficiency" in export_content:
                efficiency_data = service.get_checkin_efficiency(
                    activity_id=activity_id,
                    start_date=start_date,
                    end_date=end_date,
                    ticket_type_ids=tt_ids,
                    sponsor_levels=sl_lvls,
                )
                if not efficiency_data.empty:
                    data_frames["核销效率"] = efficiency_data

            if "sponsors" in export_content:
                sponsor_data = service.get_sponsor_list(
                    activity_id=activity_id,
                    start_date=start_date,
                    end_date=end_date,
                    ticket_type_ids=tt_ids,
                    sponsor_levels=sl_lvls,
                )
                if not sponsor_data.empty:
                    data_frames["赞助清单"] = sponsor_data

            if "ticket_types" in export_content:
                ticket_type_data = service.get_ticket_types(
                    activity_id=activity_id,
                    start_date=start_date,
                    end_date=end_date,
                    sponsor_levels=sl_lvls,
                    ticket_type_ids=tt_ids,
                )
                if not ticket_type_data.empty:
                    data_frames["票种分析"] = ticket_type_data

            if "anomalies" in export_content:
                anomaly_data = service.get_anomaly_records(activity_id=activity_id)
                if not anomaly_data.empty:
                    data_frames["异常清单"] = anomaly_data

            if export_format == "xlsx":
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine="openpyxl") as writer:
                    for sheet_name, df in data_frames.items():
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                output.seek(0)
                return dcc.send_bytes(output.getvalue(), f"{filename}.xlsx")
            else:
                if data_frames:
                    combined = pd.concat(
                        [df.assign(来源=name) for name, df in data_frames.items()],
                        ignore_index=True,
                    )
                    return dcc.send_data_frame(combined.to_csv, f"{filename}.csv")
                return None

        finally:
            service.close()

    @app.callback(
        [
            Output("sync-data-btn", "children"),
            Output("sync-data-btn", "disabled"),
            Output("sync-status", "children"),
            Output("sync-status-interval", "disabled"),
        ],
        [
            Input("sync-data-btn", "n_clicks"),
            Input("sync-status-interval", "n_intervals"),
        ],
        prevent_initial_call=True,
    )
    def sync_data(n_clicks, n_intervals):
        triggered = ctx.triggered_id

        if triggered == "sync-data-btn":
            try:
                from app.tasks.sync_tasks import sync_all_data
                sync_all_data.delay()
                return (
                    [html.I(className="fas fa-spinner fa-spin me-2"), "同步中..."],
                    True,
                    "数据同步任务已启动...",
                    False,
                )
            except Exception as e:
                return (
                    [html.I(className="fas fa-sync-alt me-2"), "同步数据"],
                    False,
                    f"同步启动失败: {str(e)}",
                    True,
                )

        return (
            [html.I(className="fas fa-sync-alt me-2"), "同步数据"],
            False,
            "",
            True,
        )
