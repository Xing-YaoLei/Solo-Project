from dash import dcc, html, dash_table, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
from datetime import date, timedelta

from app.dashboards.data_service import (
    get_prescription_summary, get_prescription_trend,
    get_photo_distribution, get_photo_quality_detail,
    get_pharmacist_funnel, get_expiry_ranking,
    get_member_changes, get_pharmacy_stats, get_batch_history,
)
from app.dashboards.charts import (
    create_trend_chart, create_amount_trend, create_photo_distribution_chart,
    create_photo_quality_pie, create_pharmacist_funnel, create_expiry_ranking_chart,
    create_member_change_chart, create_pharmacy_comparison, create_status_pie,
    create_kpi_card,
)


def build_management_layout():
    """只构建布局，不注册任何回调。组件ID统一加 mgmt- 前缀避免冲突。"""
    today = date.today()
    default_start = today - timedelta(days=30)

    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col(html.H3("药店连锁处方审核总览", className="text-primary"), width=8),
            dbc.Col([
                dbc.Row([
                    dbc.Col(dcc.DatePickerRange(
                        id="mgmt-date-range",
                        start_date=default_start,
                        end_date=today,
                        display_format="YYYY-MM-DD",
                        className="mb-2",
                    )),
                    dbc.Col(dbc.Button("刷新数据", id="mgmt-refresh-btn", color="primary", outline=True, className="mb-2")),
                ]),
            ], width=4),
        ]),
        html.Hr(),

        dbc.Row([
            dbc.Col(dcc.Graph(id="mgmt-kpi-total", figure=create_kpi_card(0, "处方总数", "#2563EB")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-approved", figure=create_kpi_card(0, "审核通过", "#10B981")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-rate", figure=create_kpi_card(0, "通过率", "#3B82F6", suffix="%")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-amount", figure=create_kpi_card(0, "总金额", "#8B5CF6", prefix="¥")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-insurance", figure=create_kpi_card(0, "医保支付", "#F59E0B", prefix="¥")), width=2),
            dbc.Col(dcc.Graph(id="mgmt-kpi-pending", figure=create_kpi_card(0, "待审核", "#EF4444")), width=2),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col(dcc.Graph(id="mgmt-trend-chart"), width=8),
            dbc.Col(dcc.Graph(id="mgmt-status-pie"), width=4),
        ], className="mb-4"),

        dbc.Row([
            dbc.Col([
                html.H5("分析区域", className="text-secondary mb-3"),
                dbc.Tabs([
                    dbc.Tab(label="处方照片分布", tab_id="photo"),
                    dbc.Tab(label="药师意见漏斗", tab_id="funnel"),
                    dbc.Tab(label="批号效期排行", tab_id="expiry"),
                    dbc.Tab(label="会员档案变化", tab_id="member"),
                    dbc.Tab(label="门店对比", tab_id="pharmacy"),
                    dbc.Tab(label="导入批次", tab_id="batch"),
                ], id="mgmt-analysis-tabs", active_tab="photo"),
                html.Br(),
                html.Div(id="mgmt-analysis-content"),
            ], width=12),
        ]),

        dcc.Store(id="mgmt-summary-store"),
    ], fluid=True)


def register_management_callbacks(app):
    """在 create_app 启动阶段调用，一次性注册管理层所有回调。"""

    @app.callback(
        Output("mgmt-summary-store", "data"),
        [Input("mgmt-date-range", "start_date"), Input("mgmt-date-range", "end_date"),
         Input("mgmt-refresh-btn", "n_clicks")],
        prevent_initial_call=False,
    )
    def _mgmt_update_summary(start_date, end_date, n_clicks):
        start = date.fromisoformat(start_date) if start_date else None
        end = date.fromisoformat(end_date) if end_date else None
        return get_prescription_summary(start, end)

    @app.callback(
        [Output("mgmt-kpi-total", "figure"), Output("mgmt-kpi-approved", "figure"),
         Output("mgmt-kpi-rate", "figure"), Output("mgmt-kpi-amount", "figure"),
         Output("mgmt-kpi-insurance", "figure"), Output("mgmt-kpi-pending", "figure"),
         Output("mgmt-trend-chart", "figure"), Output("mgmt-status-pie", "figure")],
        [Input("mgmt-summary-store", "data"),
         Input("mgmt-date-range", "start_date"), Input("mgmt-date-range", "end_date")],
    )
    def _mgmt_update_kpis(summary, start_date, end_date):
        if not summary:
            summary = get_prescription_summary()
        trend_df = get_prescription_trend(30)
        return (
            create_kpi_card(summary.get("total_prescriptions", 0), "处方总数", "#2563EB"),
            create_kpi_card(summary.get("approved", 0), "审核通过", "#10B981"),
            create_kpi_card(summary.get("approval_rate", 0), "通过率", "#3B82F6", suffix="%"),
            create_kpi_card(summary.get("total_amount", 0), "总金额", "#8B5CF6", prefix="¥"),
            create_kpi_card(summary.get("insurance_amount", 0), "医保支付", "#F59E0B", prefix="¥"),
            create_kpi_card(summary.get("pending_review", 0), "待审核", "#EF4444"),
            create_trend_chart(trend_df),
            create_status_pie(summary),
        )

    @app.callback(
        Output("mgmt-analysis-content", "children"),
        [Input("mgmt-analysis-tabs", "active_tab")],
    )
    def _mgmt_render_analysis_tab(tab_id):
        if tab_id == "photo":
            photo_df = get_photo_distribution()
            quality_df = get_photo_quality_detail()
            return dbc.Row([
                dbc.Col(dcc.Graph(figure=create_photo_distribution_chart(photo_df)), width=8),
                dbc.Col(dcc.Graph(figure=create_photo_quality_pie(quality_df)), width=4),
            ])
        elif tab_id == "funnel":
            funnel_df = get_pharmacist_funnel()
            return dbc.Row([
                dbc.Col(dcc.Graph(figure=create_pharmacist_funnel(funnel_df)), width=12),
            ])
        elif tab_id == "expiry":
            expiry_df = get_expiry_ranking(limit=20)
            return dbc.Row([
                dbc.Col(dcc.Graph(figure=create_expiry_ranking_chart(expiry_df)), width=12),
            ])
        elif tab_id == "member":
            member_df = get_member_changes(90)
            return dbc.Row([
                dbc.Col(dcc.Graph(figure=create_member_change_chart(member_df)), width=12),
            ])
        elif tab_id == "pharmacy":
            ph_df = get_pharmacy_stats()
            return dbc.Row([
                dbc.Col(dcc.Graph(figure=create_pharmacy_comparison(ph_df)), width=12),
            ])
        elif tab_id == "batch":
            batch_df = get_batch_history(50)
            if batch_df.empty:
                return html.Div("暂无导入批次记录", className="text-secondary p-4")
            display_cols = ["batch_no", "source_label", "status_label", "total_records",
                            "success_records", "failed_records", "file_name", "started_at"]
            return dash_table.DataTable(
                data=batch_df[display_cols].to_dict("records"),
                columns=[{"name": c, "id": c} for c in display_cols],
                page_size=15,
                style_table={"overflowX": "auto"},
                style_header={"backgroundColor": "#F3F4F6", "fontWeight": "bold"},
                style_cell={"padding": "10px", "textAlign": "left"},
            )
        return html.Div()
