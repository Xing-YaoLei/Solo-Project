import logging
from datetime import datetime, timedelta
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from dash import Input, Output, State, dash_table, html, dcc, callback_context
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc

from app.utils.database import SessionLocal
from app.models.schema import (
    AdmissionAssessment, AccessRecord, CareTerminalRecord,
    BillingRecord, FallIncident, DataSyncStatus, ElderProfile
)
from app.services.data_processor import (
    clean_assessment_data, get_fall_impact_periods,
    aggregate_assessment_trend
)

logger = logging.getLogger(__name__)

COLOR_MAP = {
    "自理": "#28a745",
    "半自理": "#ffc107",
    "全护理": "#fd7e14",
    "特护": "#dc3545",
}


def register_trend_callbacks(app):
    @app.callback(
        Output("alert-access-delay", "children"),
        Output("alert-care-missing", "children"),
        Output("alert-caliber-change", "children"),
        Output("sync-status-display", "children"),
        Input("interval-component", "n_intervals"),
        Input("btn-refresh-all", "n_clicks"),
    )
    def update_anomaly_alerts(n_intervals, refresh_clicks):
        db = SessionLocal()
        try:
            delay_cutoff = datetime.now() - timedelta(hours=48)
            delay_count = db.query(AccessRecord).filter(
                AccessRecord.access_time >= delay_cutoff,
                AccessRecord.is_delayed == True
            ).count()

            missing_cutoff = datetime.now().date() - timedelta(days=7)
            missing_count = db.query(CareTerminalRecord).filter(
                CareTerminalRecord.record_date >= missing_cutoff,
                CareTerminalRecord.is_missing == True
            ).count()

            caliber_cutoff = datetime.now().date() - timedelta(days=30)
            caliber_count = db.query(BillingRecord).filter(
                BillingRecord.billing_date >= caliber_cutoff,
                BillingRecord.caliber_changed == True
            ).count()

            sync_status = db.query(DataSyncStatus).all()
            status_rows = []
            for s in sync_status:
                color = "text-success" if s.sync_status == "已同步" else "text-warning"
                status_rows.append(
                    html.Div(
                        [
                            html.Span(f"{s.system_name}: ", className="text-white-50 small"),
                            html.Span(s.sync_status, className=f"{color} small fw-bold"),
                            html.Span(f" ({s.current_delay_seconds})", className="text-white-50 small ms-1"),
                        ],
                        className="mb-1",
                    )
                )

            return (
                str(delay_count),
                str(missing_count),
                str(caliber_count),
                html.Div(status_rows),
            )
        except Exception as e:
            logger.error(f"更新异常警报失败: {e}")
            return "0", "0", "0", html.Div([])
        finally:
            db.close()

    @app.callback(
        Output("refresh-result", "children"),
        Input("btn-refresh-all", "n_clicks"),
        prevent_initial_call=True,
    )
    def handle_refresh(n_clicks):
        if not n_clicks:
            raise PreventUpdate
        try:
            from app.tasks.sync_tasks import sync_all_systems
            result = sync_all_systems()
            return f"刷新任务已启动: {list(result.keys())}"
        except Exception as e:
            logger.error(f"刷新失败: {e}")
            return f"刷新失败: {str(e)}"

    @app.callback(
        Output("assessment-trend-graph", "figure"),
        Output("fall-impact-notes", "children"),
        Input("filter-start-date", "date"),
        Input("filter-end-date", "date"),
        Input("filter-care-level", "value"),
        Input("interval-component", "n_intervals"),
    )
    def update_trend_graph(start_date, end_date, care_level, n_intervals):
        db = SessionLocal()
        try:
            query = db.query(AdmissionAssessment)
            if start_date:
                query = query.filter(AdmissionAssessment.assessment_date >= start_date)
            if end_date:
                query = query.filter(AdmissionAssessment.assessment_date <= end_date)
            if care_level:
                query = query.filter(AdmissionAssessment.care_level == care_level)
            records = query.all()

            if not records:
                return go.Figure(), "暂无数据"

            df = pd.DataFrame([{
                "assessment_date": r.assessment_date,
                "elder_id": r.elder_id,
                "care_level": r.care_level,
                "care_score": float(r.care_score) if r.care_score else 0,
            } for r in records])

            df = clean_assessment_data(df)

            daily_avg = df.groupby(df["assessment_date"].dt.date).agg({
                "care_score": "mean",
                "elder_id": "nunique",
            }).reset_index()
            daily_avg.columns = ["date", "avg_score", "elder_count"]
            daily_avg["date"] = pd.to_datetime(daily_avg["date"])

            fig = go.Figure()

            fig.add_trace(go.Scatter(
                x=daily_avg["date"],
                y=daily_avg["avg_score"],
                mode="lines+markers",
                name="平均护理评分",
                line=dict(color="#0d6efd", width=2),
                yaxis="y",
            ))

            fig.add_trace(go.Bar(
                x=daily_avg["date"],
                y=daily_avg["elder_count"],
                name="评估人数",
                opacity=0.3,
                marker_color="#6c757d",
                yaxis="y2",
            ))

            fall_df = get_fall_impact_periods()
            if not fall_df.empty:
                for _, fall in fall_df.iterrows():
                    if fall["impact_start"] and fall["impact_end"]:
                        fig.add_vrect(
                            x0=fall["impact_start"],
                            x1=fall["impact_end"],
                            fillcolor="rgba(220, 53, 69, 0.1)",
                            line_width=0,
                            layer="below",
                        )
                        fig.add_vline(
                            x=fall["fall_time"],
                            line_dash="dash",
                            line_color="red",
                            annotation_text=f"跌倒({fall['injury_level']})",
                            annotation_position="top left",
                        )

            fig.update_layout(
                title="入住评估趋势",
                xaxis_title="日期",
                yaxis=dict(title="平均护理评分", range=[0, 100]),
                yaxis2=dict(title="评估人数", overlaying="y", side="right"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                hovermode="x unified",
                height=450,
            )

            fall_notes = []
            if not fall_df.empty:
                fall_notes.append(html.Strong("跌倒事件影响范围标注: "))
                for _, fall in fall_df.iterrows():
                    if fall["impact_start"] and fall["impact_end"]:
                        fall_notes.append(
                            html.Span(
                                f"[{fall['fall_time'].strftime('%Y-%m-%d %H:%M')} "
                                f"影响至 {fall['impact_end'].strftime('%Y-%m-%d')} ({fall['injury_level']})] ",
                                className="text-danger me-2",
                            )
                        )

            return fig, html.Div(fall_notes) if fall_notes else ""
        except Exception as e:
            logger.error(f"更新趋势图失败: {e}")
            return go.Figure(), f"加载失败: {str(e)}"
        finally:
            db.close()

    @app.callback(
        Output("care-level-distribution-graph", "figure"),
        Input("filter-start-date", "date"),
        Input("filter-end-date", "date"),
        Input("filter-care-level", "value"),
    )
    def update_care_level_distribution(start_date, end_date, care_level):
        db = SessionLocal()
        try:
            query = db.query(AdmissionAssessment)
            if start_date:
                query = query.filter(AdmissionAssessment.assessment_date >= start_date)
            if end_date:
                query = query.filter(AdmissionAssessment.assessment_date <= end_date)
            records = query.all()

            if not records:
                return go.Figure()

            df = pd.DataFrame([{
                "assessment_date": r.assessment_date,
                "care_level": r.care_level,
                "elder_id": r.elder_id,
            } for r in records])

            latest = df.sort_values("assessment_date").groupby("elder_id").tail(1)
            level_counts = latest["care_level"].value_counts().reset_index()
            level_counts.columns = ["护理等级", "人数"]

            fig = px.pie(
                level_counts,
                names="护理等级",
                values="人数",
                color="护理等级",
                color_discrete_map=COLOR_MAP,
                title="当前在住老人护理等级分布",
                hole=0.4,
            )
            fig.update_layout(height=350)
            return fig
        except Exception as e:
            logger.error(f"更新护理等级分布失败: {e}")
            return go.Figure()
        finally:
            db.close()

    @app.callback(
        Output("assessment-score-boxplot", "figure"),
        Input("filter-start-date", "date"),
        Input("filter-end-date", "date"),
    )
    def update_score_boxplot(start_date, end_date):
        db = SessionLocal()
        try:
            query = db.query(AdmissionAssessment)
            if start_date:
                query = query.filter(AdmissionAssessment.assessment_date >= start_date)
            if end_date:
                query = query.filter(AdmissionAssessment.assessment_date <= end_date)
            records = query.all()

            if not records:
                return go.Figure()

            df = pd.DataFrame([{
                "护理等级": r.care_level,
                "护理评分": float(r.care_score) if r.care_score else 0,
            } for r in records])

            fig = px.box(
                df,
                x="护理等级",
                y="护理评分",
                color="护理等级",
                color_discrete_map=COLOR_MAP,
                title="各护理等级评分分布",
                category_orders={"护理等级": list(COLOR_MAP.keys())},
            )
            fig.update_layout(height=350, showlegend=False)
            return fig
        except Exception as e:
            logger.error(f"更新箱线图失败: {e}")
            return go.Figure()
        finally:
            db.close()

    @app.callback(
        Output("care-level-trend", "figure"),
        Input("interval-component", "n_intervals"),
    )
    def update_care_level_trend(n):
        db = SessionLocal()
        try:
            records = db.query(AdmissionAssessment).all()
            if not records:
                return go.Figure()

            df = pd.DataFrame([{
                "date": r.assessment_date,
                "level": r.care_level,
                "elder_id": r.elder_id,
            } for r in records])
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values(["elder_id", "date"])

            monthly_counts = df.groupby([
                df["date"].dt.to_period("M").astype(str),
                "level"
            ]).size().unstack(fill_value=0).reset_index()

            fig = go.Figure()
            for level in ["自理", "半自理", "全护理", "特护"]:
                if level in monthly_counts.columns:
                    fig.add_trace(go.Bar(
                        x=monthly_counts["date"],
                        y=monthly_counts[level],
                        name=level,
                        marker_color=COLOR_MAP.get(level),
                    ))

            fig.update_layout(
                title="月度护理等级变化趋势",
                barmode="stack",
                xaxis_title="月份",
                yaxis_title="人数",
                height=400,
            )
            return fig
        except Exception as e:
            logger.error(f"更新护理等级趋势失败: {e}")
            return go.Figure()
        finally:
            db.close()

    @app.callback(
        Output("care-level-stats", "children"),
        Input("interval-component", "n_intervals"),
    )
    def update_care_level_stats(n):
        db = SessionLocal()
        try:
            elders = db.query(ElderProfile).filter(
                ElderProfile.current_status == "在住"
            ).all()
            if not elders:
                return html.P("暂无数据", className="text-muted")

            elder_ids = [e.id for e in elders]
            latest_assessments = []
            for eid in elder_ids:
                a = db.query(AdmissionAssessment).filter(
                    AdmissionAssessment.elder_id == eid
                ).order_by(AdmissionAssessment.assessment_date.desc()).first()
                if a:
                    latest_assessments.append(a)

            if not latest_assessments:
                return html.P("暂无评估数据", className="text-muted")

            level_counts = {}
            for a in latest_assessments:
                level_counts[a.care_level] = level_counts.get(a.care_level, 0) + 1

            stats = []
            for level in ["自理", "半自理", "全护理", "特护"]:
                count = level_counts.get(level, 0)
                pct = count / len(latest_assessments) * 100 if latest_assessments else 0
                stats.append(
                    html.Div(
                        [
                            html.Span(level, className="me-2"),
                            html.Span(
                                f"{count}人 ({pct:.1f}%)",
                                className="float-end",
                                style={"color": COLOR_MAP.get(level, "#333")},
                            ),
                            dbc.Progress(
                                value=pct,
                                color=level.lower() if level != "半自理" else "warning",
                                className="mt-1 mb-2",
                                style={"height": "6px"},
                            ),
                        ]
                    )
                )

            return html.Div(stats)
        except Exception as e:
            logger.error(f"更新护理统计失败: {e}")
            return html.P(f"加载失败: {str(e)}", className="text-danger")
        finally:
            db.close()
