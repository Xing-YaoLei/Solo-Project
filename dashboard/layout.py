import io
import pandas as pd
from datetime import datetime, timedelta, date
from dash import dcc, html, Input, Output, State, callback, ctx, dash_table
import dash_bootstrap_components as dbc
import logging

from dashboard.app import app
from dashboard.components import (
    create_kpi_cards, create_daily_trend_chart, create_anomaly_scatter_chart,
    create_status_pie_chart, create_return_rate_funnel, create_anomaly_table,
    create_treatment_plan_component, create_follow_up_component, create_imaging_component
)
from data.queries import (
    get_cleaning_appointments, get_follow_up_tasks, get_imaging_records,
    get_treatment_plans, get_his_sync_logs, calculate_return_visit_rate,
    aggregate_daily_stats, detect_no_show_impact_periods, get_sync_delay_annotations
)
from config.settings import Config

logger = logging.getLogger(__name__)

try:
    from celery_tasks.tasks import run_full_monitoring_cycle
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    logger.warning("Celery tasks not available, running in data-only mode")


def _build_header_right():
    children = []
    if Config.DEMO_MODE:
        children.append(dbc.Badge("📌 演示模式", color="warning", className="me-3 py-2 px-3 fs-6"))
    children.append(
        dbc.ButtonGroup([
            dbc.Button(
                "🔄 刷新数据", id="refresh-btn", color="light", outline=True,
                className="me-2", size="sm"
            ),
            dbc.Button(
                "📥 导出Excel", id="export-btn", color="success",
                className="me-2", size="sm"
            ),
            dcc.Download(id="download-excel"),
            dbc.DropdownMenu([
                dbc.DropdownMenuItem("最近7天", id="range-7d"),
                dbc.DropdownMenuItem("最近30天", id="range-30d"),
                dbc.DropdownMenuItem("最近90天", id="range-90d"),
                dbc.DropdownMenuItem(divider=True),
                dbc.DropdownMenuItem("自定义范围...", id="range-custom")
            ], label="📅 时间范围", color="secondary", size="sm", className="me-2"),
            dbc.DropdownMenu([
                dbc.DropdownMenuItem(
                    [html.Span("🟠 HIS延迟异常 ", className="me-2"), dbc.Badge("阈值60分", color="warning", pill=True)],
                    id="filter-his-delay"
                ),
                dbc.DropdownMenuItem(
                    [html.Span("🟢 影像缺失 ", className="me-2"), dbc.Badge("近7天", color="info", pill=True)],
                    id="filter-imaging"
                ),
                dbc.DropdownMenuItem(
                    [html.Span("🟣 收费口径变化 ", className="me-2"), dbc.Badge("版本标记", color="secondary", pill=True)],
                    id="filter-caliber"
                ),
                dbc.DropdownMenuItem(divider=True),
                dbc.DropdownMenuItem("显示全部", id="filter-all")
            ], label="🔍 异常筛选", color="secondary", size="sm")
        ])
    )
    return html.Div(children, className="d-flex align-items-center ms-auto")


header = dbc.Navbar([
    dbc.Container([
        dbc.Row([
            dbc.Col([
                html.H3("🦷 口腔诊所洁牙预约风险监测看板", className="text-white mb-0"),
                html.Small("Cleaning Appointment Risk Monitoring Dashboard", className="text-white-50")
            ])
        ], align="center")
    ], fluid=True),
    dbc.Container([
        _build_header_right()
    ], fluid=True)
], color="primary", dark=True, className="mb-4 shadow")


date_range_row = dbc.Row([
    dbc.Col([
        dbc.Card([
            dbc.CardBody([
                dbc.Row([
                    dbc.Col([
                        html.Label("开始日期:", className="fw-bold"),
                        dcc.DatePickerSingle(
                            id="start-date-picker",
                            date=date.today() - timedelta(days=30),
                            display_format="YYYY-MM-DD",
                            className="ms-2"
                        )
                    ], width="auto"),
                    dbc.Col([
                        html.Label("结束日期:", className="fw-bold"),
                        dcc.DatePickerSingle(
                            id="end-date-picker",
                            date=date.today(),
                            display_format="YYYY-MM-DD",
                            className="ms-2"
                        )
                    ], width="auto"),
                    dbc.Col([
                        html.Div(id="range-display", className="text-muted mt-2")
                    ]),
                    dbc.Col([
                        dbc.Alert([
                            html.Strong("标注说明: "),
                            html.Span("⬛ 竖虚线 = HIS同步延迟时点", className="me-3"),
                            html.Span("🟥 背景高亮 = 爽约率异常时段", className="me-3"),
                            html.Span("📝 异常点与复盘说明在下表关联显示")
                        ], color="info", className="mb-0 py-2", dismissable=True)
                    ])
                ], align="center")
            ])
        ], className="shadow-sm border-0")
    ])
], className="mb-4")


kpi_section = html.Div(id="kpi-cards-section")


main_charts_section = dbc.Row([
    dbc.Col([
        dbc.Card([
            dbc.CardHeader([
                html.H5("📈 每日洁牙预约趋势", className="mb-0"),
                html.Small("含HIS延迟标注、爽约异常时段高亮", className="text-muted")
            ]),
            dbc.CardBody([
                dcc.Graph(id="daily-trend-chart", config={"displaylogo": False})
            ])
        ], className="shadow-sm border-0 h-100")
    ], width=12),
], className="mb-4")


row2 = dbc.Row([
    dbc.Col([
        dbc.Card([
            dbc.CardHeader(html.H5("🎯 异常点患者分布", className="mb-0")),
            dbc.CardBody([
                dcc.Graph(id="anomaly-scatter-chart", config={"displaylogo": False})
            ])
        ], className="shadow-sm border-0 h-100")
    ], width=8),
    dbc.Col([
        dbc.Card([
            dbc.CardHeader(html.H5("📊 预约状态构成", className="mb-0")),
            dbc.CardBody([
                dcc.Graph(id="status-pie-chart", config={"displaylogo": False})
            ])
        ], className="shadow-sm border-0 mb-3"),
        dbc.Card([
            dbc.CardHeader(html.H5("🔁 复诊率漏斗", className="mb-0")),
            dbc.CardBody([
                dcc.Graph(id="return-funnel-chart", config={"displaylogo": False})
            ])
        ], className="shadow-sm border-0 h-100")
    ], width=4)
], className="mb-4")


anomaly_section = dbc.Card([
    dbc.CardHeader([
        html.H5("⚠️ 异常明细表（复盘说明与异常点关联）", className="mb-0"),
        html.Small("HIS延迟、影像缺失、收费口径变化统一展示，不复盘信息不分离", className="text-muted")
    ]),
    dbc.CardBody([
        html.Div(id="no-show-periods-summary", className="mb-3"),
        html.Div(id="anomaly-table-container")
    ])
], className="shadow-sm border-0 mb-4")


tabs_section = dbc.Card([
    dbc.CardHeader(
        dbc.Tabs([
            dbc.Tab(label="💊 治疗计划", tab_id="tab-treatment"),
            dbc.Tab(label="📞 随访任务", tab_id="tab-followup"),
            dbc.Tab(label="🖼️ 影像附件", tab_id="tab-imaging")
        ], id="view-tabs", active_tab="tab-treatment")
    ),
    dbc.CardBody([
        html.Div(id="tab-content")
    ])
], className="shadow-sm border-0 mb-4")


footer = dbc.Row([
    dbc.Col([
        html.Hr(),
        html.Div([
            html.Small(
                f"复诊率计算规则: 复诊率 = (180天内复诊或完成随访人数 / 已过180天随访期洁牙人数) × 100%  |  "
                f"HIS延迟阈值: {Config.HIS_DELAY_THRESHOLD_MINUTES}分钟  |  "
                f"爽约影响阈值: {Config.NO_SHOW_IMPACT_THRESHOLD * 100:.0f}%"
                , className="text-muted"
            )
        ], className="text-center")
    ])
])


refresh_interval = dcc.Interval(
    id="auto-refresh-interval",
    interval=Config.CACHE_TIMEOUT * 1000,
    n_intervals=0
)


hidden_store = html.Div([
    dcc.Store(id="appointments-store"),
    dcc.Store(id="daily-store"),
    dcc.Store(id="return-summary-store"),
    dcc.Store(id="followups-store"),
    dcc.Store(id="imaging-store"),
    dcc.Store(id="plans-store"),
    dcc.Store(id="current-filter", data="all")
])


app.layout = html.Div([
    header,
    dbc.Container([
        date_range_row,
        kpi_section,
        main_charts_section,
        row2,
        anomaly_section,
        tabs_section,
        footer
    ], fluid=True),
    refresh_interval,
    hidden_store
])


@app.callback(
    [Output("start-date-picker", "date"),
     Output("end-date-picker", "date")],
    [Input("range-7d", "n_clicks"),
     Input("range-30d", "n_clicks"),
     Input("range-90d", "n_clicks")],
    prevent_initial_call=True
)
def update_date_range(n7, n30, n90):
    trigger = ctx.triggered_id
    today = date.today()
    if trigger == "range-7d":
        return today - timedelta(days=7), today
    elif trigger == "range-30d":
        return today - timedelta(days=30), today
    elif trigger == "range-90d":
        return today - timedelta(days=90), today
    return today - timedelta(days=30), today


@app.callback(
    Output("range-display", "children"),
    [Input("start-date-picker", "date"),
     Input("end-date-picker", "date")]
)
def update_range_display(start, end):
    if start and end:
        days = (pd.Timestamp(end) - pd.Timestamp(start)).days + 1
        return f"当前范围: {start} 至 {end} （共 {days} 天）"
    return ""


@app.callback(
    Output("current-filter", "data"),
    [Input("filter-his-delay", "n_clicks"),
     Input("filter-imaging", "n_clicks"),
     Input("filter-caliber", "n_clicks"),
     Input("filter-all", "n_clicks")],
    prevent_initial_call=True
)
def update_filter(n1, n2, n3, n4):
    trigger = ctx.triggered_id
    mapping = {
        "filter-his-delay": "HIS_DELAY",
        "filter-imaging": "IMAGING_MISSING",
        "filter-caliber": "BILLING_CALIBER",
        "filter-all": "all"
    }
    return mapping.get(trigger, "all")


@app.callback(
    [Output("appointments-store", "data"),
     Output("daily-store", "data"),
     Output("return-summary-store", "data"),
     Output("followups-store", "data"),
     Output("imaging-store", "data"),
     Output("plans-store", "data")],
    [Input("refresh-btn", "n_clicks"),
     Input("auto-refresh-interval", "n_intervals"),
     Input("start-date-picker", "date"),
     Input("end-date-picker", "date")]
)
def load_all_data(n_refresh, n_interval, start_date, end_date):
    try:
        triggered_by = ctx.triggered_id if hasattr(ctx, 'triggered_id') else (ctx.triggered[0]['prop_id'].split('.')[0] if ctx.triggered else None)

        if not Config.DEMO_MODE and CELERY_AVAILABLE and triggered_by == "refresh-btn":
            try:
                result = run_full_monitoring_cycle.delay()
                logger.info(f"Manual refresh triggered full monitoring cycle: {result.id}")
            except Exception as e:
                logger.error(f"Failed to trigger monitoring cycle: {e}")

        if Config.DEMO_MODE:
            from data.demo_data import (
                generate_demo_appointments, generate_demo_followups,
                generate_demo_imaging, generate_demo_plans, generate_demo_sync_logs
            )
            from data.queries import (
                calculate_return_visit_rate, aggregate_daily_stats,
                detect_no_show_impact_periods, get_sync_delay_annotations
            )

            df_appt = generate_demo_appointments(days_back=Config.DEMO_DATA_DAYS)

            if start_date:
                df_appt = df_appt[df_appt["appointment_date"] >= pd.Timestamp(start_date)]
            if end_date:
                df_appt = df_appt[df_appt["appointment_date"] <= pd.Timestamp(end_date)]

            if df_appt.empty:
                return {}, {}, {}, {}, {}, {}

            appt_ids = df_appt["id"].unique().tolist()
            patient_ids = df_appt["patient_id"].unique().tolist()

            df_followups = generate_demo_followups(df_appt)
            df_imaging = generate_demo_imaging(df_appt)
            df_plans = generate_demo_plans(df_appt)

            df_return, return_summary = calculate_return_visit_rate(
                df_appt, df_followups, window_days=Config.FOLLOW_UP_DAYS
            )
            return_summary["details"] = df_return.to_dict("records") if not df_return.empty else []

            df_daily = aggregate_daily_stats(df_appt)

            df_sync = generate_demo_sync_logs(limit=200)
            sync_anns = get_sync_delay_annotations(df_sync, threshold_minutes=Config.HIS_DELAY_THRESHOLD_MINUTES)
            no_show_periods = detect_no_show_impact_periods(
                df_daily,
                threshold_rate=Config.NO_SHOW_IMPACT_THRESHOLD * 100
            )
        else:
            df_appt = get_cleaning_appointments(
                start_date=pd.Timestamp(start_date).date() if start_date else None,
                end_date=pd.Timestamp(end_date).date() if end_date else None
            )

            if df_appt.empty:
                return {}, {}, {}, {}, {}, {}

            appt_ids = df_appt["id"].unique().tolist() if not df_appt.empty else []
            patient_ids = df_appt["patient_id"].unique().tolist() if not df_appt.empty else []

            df_followups = get_follow_up_tasks(
                appointment_ids=appt_ids if appt_ids else None,
                start_date=pd.Timestamp(start_date).date() if start_date else None
            )
            df_imaging = get_imaging_records(
                appointment_ids=appt_ids if appt_ids else None
            )
            df_plans = get_treatment_plans(
                patient_ids=patient_ids if patient_ids else None,
                start_date=pd.Timestamp(start_date).date() if start_date else None
            )

            df_return, return_summary = calculate_return_visit_rate(
                df_appt, df_followups, window_days=Config.FOLLOW_UP_DAYS
            )
            return_summary["details"] = df_return.to_dict("records") if not df_return.empty else []

            df_daily = aggregate_daily_stats(df_appt)

            df_sync = get_his_sync_logs(limit=200)
            sync_anns = get_sync_delay_annotations(df_sync, threshold_minutes=Config.HIS_DELAY_THRESHOLD_MINUTES)
            no_show_periods = detect_no_show_impact_periods(
                df_daily,
                threshold_rate=Config.NO_SHOW_IMPACT_THRESHOLD * 100
            )

        daily_data = df_daily.to_dict("records") if not df_daily.empty else []
        for item in daily_data:
            if "date" in item and isinstance(item["date"], pd.Timestamp):
                item["date"] = item["date"].isoformat()

        daily_data_with_meta = {
            "records": daily_data,
            "no_show_periods": no_show_periods,
            "sync_annotations": [
                {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in a.items()}
                for a in sync_anns
            ]
        }

        for col in df_appt.select_dtypes(include=["datetime64"]).columns:
            df_appt[col] = df_appt[col].dt.strftime("%Y-%m-%d %H:%M:%S").where(df_appt[col].notna(), None)
        for col in df_appt.select_dtypes(include=["datetimetz"]).columns:
            df_appt[col] = df_appt[col].dt.strftime("%Y-%m-%d %H:%M:%S").where(df_appt[col].notna(), None)

        if not df_followups.empty:
            for col in df_followups.select_dtypes(include=["datetime64"]).columns:
                df_followups[col] = df_followups[col].dt.strftime("%Y-%m-%d %H:%M:%S").where(df_followups[col].notna(), None)

        if not df_imaging.empty:
            for col in df_imaging.select_dtypes(include=["datetime64"]).columns:
                df_imaging[col] = df_imaging[col].dt.strftime("%Y-%m-%d").where(df_imaging[col].notna(), None)

        if not df_plans.empty:
            for col in df_plans.select_dtypes(include=["datetime64"]).columns:
                df_plans[col] = df_plans[col].dt.strftime("%Y-%m-%d").where(df_plans[col].notna(), None)

        return (
            df_appt.to_dict("records"),
            daily_data_with_meta,
            return_summary,
            df_followups.to_dict("records") if not df_followups.empty else [],
            df_imaging.to_dict("records") if not df_imaging.empty else [],
            df_plans.to_dict("records") if not df_plans.empty else []
        )

    except Exception as e:
        print(f"Data load error: {e}")
        import traceback
        traceback.print_exc()
        return {}, {}, {}, {}, {}, {}


@app.callback(
    [Output("kpi-cards-section", "children"),
     Output("daily-trend-chart", "figure"),
     Output("anomaly-scatter-chart", "figure"),
     Output("status-pie-chart", "figure"),
     Output("return-funnel-chart", "figure"),
     Output("anomaly-table-container", "children"),
     Output("no-show-periods-summary", "children")],
    [Input("appointments-store", "data"),
     Input("daily-store", "data"),
     Input("return-summary-store", "data"),
     Input("current-filter", "data")]
)
def update_main_visuals(appt_data, daily_data, return_summary, current_filter):
    from dashboard.components import (
        create_kpi_cards, create_daily_trend_chart, create_anomaly_scatter_chart,
        create_status_pie_chart, create_return_rate_funnel, create_anomaly_table,
        create_no_show_periods_summary, get_empty_fig
    )

    df_appt = pd.DataFrame(appt_data) if appt_data else pd.DataFrame()
    if not df_appt.empty and "appointment_date" in df_appt.columns:
        df_appt["appointment_date"] = pd.to_datetime(df_appt["appointment_date"])

    if not df_appt.empty and current_filter and current_filter != "all":
        df_appt = df_appt[df_appt["anomaly_types"].apply(
            lambda x: isinstance(x, list) and current_filter in x
        )]

    df_daily = pd.DataFrame()
    no_show_periods = []
    sync_anns = []
    if daily_data and isinstance(daily_data, dict):
        df_daily = pd.DataFrame(daily_data.get("records", []))
        no_show_periods = daily_data.get("no_show_periods", [])
        sync_anns = daily_data.get("sync_annotations", [])
    elif daily_data and isinstance(daily_data, list):
        df_daily = pd.DataFrame(daily_data)

    if not isinstance(return_summary, dict):
        return_summary = {
            "total_cleanings": 0, "eligible_for_return": 0,
            "returned_count": 0, "return_rate": 0, "window_days": 180,
            "details": []
        }

    df_return = pd.DataFrame(return_summary.get("details", []))

    kpi = create_kpi_cards(df_daily, return_summary)
    trend_fig = create_daily_trend_chart(df_daily, no_show_periods, sync_anns)
    scatter_fig = create_anomaly_scatter_chart(df_appt)
    pie_fig = create_status_pie_chart(df_appt)
    funnel_fig = create_return_rate_funnel(df_return, return_summary)
    anomaly_table = create_anomaly_table(df_appt)
    no_show_summary = create_no_show_periods_summary(no_show_periods)

    return kpi, trend_fig, scatter_fig, pie_fig, funnel_fig, anomaly_table, no_show_summary


@app.callback(
    Output("tab-content", "children"),
    [Input("view-tabs", "active_tab"),
     Input("plans-store", "data"),
     Input("followups-store", "data"),
     Input("imaging-store", "data")]
)
def render_tab_content(active_tab, plans_data, followups_data, imaging_data):
    if active_tab == "tab-treatment":
        df = pd.DataFrame(plans_data) if plans_data else pd.DataFrame()
        return create_treatment_plan_component(df)
    elif active_tab == "tab-followup":
        df = pd.DataFrame(followups_data) if followups_data else pd.DataFrame()
        return create_follow_up_component(df)
    elif active_tab == "tab-imaging":
        df = pd.DataFrame(imaging_data) if imaging_data else pd.DataFrame()
        return create_imaging_component(df)
    return html.Div("请选择视图")


@app.callback(
    Output("download-excel", "data"),
    Input("export-btn", "n_clicks"),
    [State("appointments-store", "data"),
     State("daily-store", "data"),
     State("return-summary-store", "data"),
     State("plans-store", "data"),
     State("followups-store", "data"),
     State("imaging-store", "data"),
     State("start-date-picker", "date"),
     State("end-date-picker", "date")],
    prevent_initial_call=True
)
def export_to_excel(n_clicks, appt_data, daily_data, return_summary,
                    plans_data, followups_data, imaging_data,
                    start_date, end_date):
    if not n_clicks:
        return None

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        wb = writer.book

        header_format = wb.add_format({
            "bold": True, "bg_color": "#4472C4", "font_color": "white",
            "border": 1, "align": "center", "valign": "vcenter"
        })
        rule_format = wb.add_format({
            "bold": True, "bg_color": "#FFF2CC", "font_color": "#7F6000",
            "border": 1, "text_wrap": True
        })

        df_appt = pd.DataFrame(appt_data) if appt_data else pd.DataFrame()
        if not df_appt.empty:
            export_cols = [c for c in [
                "appointment_no", "appointment_date", "patient_name", "patient_number",
                "doctor_name", "procedure_type", "status",
                "has_his_delay", "sync_delay_minutes",
                "has_imaging_missing", "has_billing_caliber", "caliber_changed",
                "billing_amount", "plan_status", "review_note", "anomaly_flag"
            ] if c in df_appt.columns]
            df_export = df_appt[export_cols].copy()
            df_export.columns = [
                "预约号", "预约日期", "患者姓名", "患者编号",
                "医生", "项目类型", "状态",
                "是否HIS延迟", "同步延迟(分)",
                "是否影像缺失", "是否收费口径变化", "口径变更标记",
                "收费金额", "治疗计划状态", "复盘说明", "异常类型"
            ]
            df_export.to_excel(writer, sheet_name="洁牙预约明细", index=False, startrow=1)
            ws = writer.sheets["洁牙预约明细"]
            for col_num, value in enumerate(df_export.columns.values):
                ws.write(0, col_num, value, header_format)
            ws.set_column("A:P", 15)

        if isinstance(daily_data, dict) and daily_data.get("records"):
            df_daily = pd.DataFrame(daily_data["records"])
            if not df_daily.empty:
                daily_cols = [c for c in [
                    "date_str", "total_appointments", "completed_count", "no_show_count",
                    "no_show_rate", "his_delay_count", "imaging_missing_count",
                    "caliber_change_count", "total_billing", "completion_rate"
                ] if c in df_daily.columns]
                df_daily_export = df_daily[daily_cols].copy()
                df_daily_export.columns = [
                    "日期", "总预约数", "完成数", "爽约数",
                    "爽约率(%)", "HIS延迟数", "影像缺失数",
                    "收费口径变化数", "总收费(元)", "完成率(%)"
                ]
                df_daily_export.to_excel(writer, sheet_name="每日统计", index=False, startrow=1)
                ws = writer.sheets["每日统计"]
                for col_num, value in enumerate(df_daily_export.columns.values):
                    ws.write(0, col_num, value, header_format)

            if daily_data.get("no_show_periods"):
                df_periods = pd.DataFrame(daily_data["no_show_periods"])
                df_periods.columns = [
                    "起始日期", "结束日期", "持续天数",
                    "平均爽约率(%)", "爽约总数", "预约总数"
                ]
                df_periods.to_excel(writer, sheet_name="爽约影响时段", index=False, startrow=1)
                ws = writer.sheets["爽约影响时段"]
                for col_num, value in enumerate(df_periods.columns.values):
                    ws.write(0, col_num, value, header_format)
                ws.set_column("A:F", 18)

        df_return_details = None
        if isinstance(return_summary, dict):
            details = return_summary.get("details", [])
            if details:
                df_return_details = pd.DataFrame(details)

            rules_data = [
                ["复诊率计算规则说明", ""],
                ["", ""],
                ["1. 随访窗口期", f"{return_summary.get('window_days', 180)} 天（洁牙术后 {return_summary.get('window_days', 180)} 天内）"],
                ["2. 合格样本定义", "洁牙预约日期距数据导出日已超过随访窗口期的记录"],
                ["3. 复诊判定标准（满足任一即视为复诊）", ""],
                ["   a. 同期就诊记录", "同一患者在窗口期内有新的非爽约洁牙或治疗预约记录"],
                ["   b. 随访完成记录", "同一患者关联的随访任务状态为 completed"],
                ["4. 计算公式", "复诊率 = (复诊人数 / 合格样本数) × 100%"],
                ["5. 本次统计结果", ""],
                ["   洁牙总人数", str(return_summary.get("total_cleanings", 0))],
                ["   合格样本数(已过窗口期)", str(return_summary.get("eligible_for_return", 0))],
                ["   复诊人数", str(return_summary.get("returned_count", 0))],
                ["   计算复诊率", f"{return_summary.get('return_rate', 0):.2f}%"],
                ["   统计时间", return_summary.get("calculation_time", "")],
                ["", ""],
                ["说明", "未到窗口期的预约暂不计入复诊率分母，避免复诊率被低估"]
            ]
            df_rules = pd.DataFrame(rules_data, columns=["项目", "内容"])
            df_rules.to_excel(writer, sheet_name="复诊率计算规则", index=False, header=False)
            ws = writer.sheets["复诊率计算规则"]
            ws.set_column("A:A", 35)
            ws.set_column("B:B", 60)
            ws.set_row(0, None, rule_format)
            for i in range(1, len(df_rules)):
                ws.write(i, 0, rules_data[i][0])
                ws.write(i, 1, rules_data[i][1])

        if df_return_details is not None and not df_return_details.empty:
            return_cols = [c for c in [
                "appointment_no", "patient_name", "appointment_date",
                "followup_window_end", "is_eligible", "not_eligible_reason",
                "followup_tasks_count", "followup_completed",
                "return_visits_count", "has_returned"
            ] if c in df_return_details.columns]
            df_ret_export = df_return_details[return_cols].copy()
            df_ret_export.columns = [
                "预约号", "患者", "洁牙日期", "随访窗口截止",
                "是否合格样本", "不合格原因",
                "随访任务数", "随访是否完成",
                "期内复诊次数", "是否复诊"
            ]
            df_ret_export.to_excel(writer, sheet_name="复诊率明细", index=False, startrow=1)
            ws = writer.sheets["复诊率明细"]
            for col_num, value in enumerate(df_ret_export.columns.values):
                ws.write(0, col_num, value, header_format)
            ws.set_column("A:J", 18)

        df_followups = pd.DataFrame(followups_data) if followups_data else pd.DataFrame()
        if not df_followups.empty:
            df_followups.to_excel(writer, sheet_name="随访任务", index=False, startrow=1)
            ws = writer.sheets["随访任务"]
            for col_num, value in enumerate(df_followups.columns.values):
                ws.write(0, col_num, value, header_format)

        df_imaging = pd.DataFrame(imaging_data) if imaging_data else pd.DataFrame()
        if not df_imaging.empty:
            df_imaging.to_excel(writer, sheet_name="影像附件", index=False, startrow=1)
            ws = writer.sheets["影像附件"]
            for col_num, value in enumerate(df_imaging.columns.values):
                ws.write(0, col_num, value, header_format)

        df_plans = pd.DataFrame(plans_data) if plans_data else pd.DataFrame()
        if not df_plans.empty:
            df_plans.to_excel(writer, sheet_name="治疗计划", index=False, startrow=1)
            ws = writer.sheets["治疗计划"]
            for col_num, value in enumerate(df_plans.columns.values):
                ws.write(0, col_num, value, header_format)

    output.seek(0)
    filename = f"洁牙预约风险监测_{start_date}_{end_date}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return dcc.send_bytes(output.getvalue(), filename=filename)
