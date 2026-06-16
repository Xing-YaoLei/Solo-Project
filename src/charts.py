import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import polars as pl
from datetime import date, timedelta
from typing import List, Dict, Optional, Tuple

from data_models import RISK_LEVELS, RISK_COLORS


def create_risk_monitor_chart(trend_df: pl.DataFrame,
                              fee_delay_df: pl.DataFrame,
                              device_change_df: pl.DataFrame,
                              denial_periods: List[Dict],
                              title: str = "康复中心患者分级风险监测图") -> go.Figure:
    fig = go.Figure()

    if not trend_df.is_empty():
        dates = trend_df["record_date"].to_list()
        score_avg = trend_df["score_avg"].to_list()
        score_high = trend_df["score_high"].to_list()
        score_mid_high = trend_df["score_mid_high"].to_list()
        score_mid = trend_df["score_mid"].to_list()
        score_mid_low = trend_df["score_mid_low"].to_list()
        score_low = trend_df["score_low"].to_list()
        patient_count = trend_df["patient_count"].to_list()

        fig.add_trace(go.Scatter(
            x=dates, y=score_high,
            mode='lines+markers',
            name='高危',
            line=dict(color=RISK_COLORS["高危"], width=3),
            marker=dict(size=6),
            hovertemplate='<b>%{x}</b><br>高危平均: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=score_mid_high,
            mode='lines+markers',
            name='中高危',
            line=dict(color=RISK_COLORS["中高危"], width=2.5),
            marker=dict(size=5),
            hovertemplate='<b>%{x}</b><br>中高危平均: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=score_mid,
            mode='lines+markers',
            name='中危',
            line=dict(color=RISK_COLORS["中危"], width=2),
            marker=dict(size=5),
            hovertemplate='<b>%{x}</b><br>中危平均: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=score_mid_low,
            mode='lines+markers',
            name='中低危',
            line=dict(color=RISK_COLORS["中低危"], width=2),
            marker=dict(size=5),
            hovertemplate='<b>%{x}</b><br>中低危平均: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=score_low,
            mode='lines+markers',
            name='低危',
            line=dict(color=RISK_COLORS["低危"], width=2),
            marker=dict(size=5),
            hovertemplate='<b>%{x}</b><br>低危平均: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=score_avg,
            mode='lines',
            name='总体平均',
            line=dict(color='black', width=3, dash='dash'),
            hovertemplate='<b>%{x}</b><br>总体平均: %{y:.1f}<br>在院患者: %{customdata}人<extra></extra>',
            customdata=patient_count
        ))

    fee_delay_shapes = []
    fee_delay_annotations = []
    if not fee_delay_df.is_empty():
        for row in fee_delay_df.iter_rows(named=True):
            delay_date = row["expected_date"]
            sync_date = row["sync_date"]
            delay_days = row["delay_days"]
            fig.add_vrect(
                x0=delay_date, x1=sync_date,
                fillcolor="rgba(255, 200, 50, 0.25)",
                line=dict(color="#f59e0b", width=2),
                layer="below",
                row=1, col=1
            )
            fig.add_annotation(
                x=delay_date, y=1.02, yref="paper",
                text=f"⚠️ 收费表延迟{delay_days}天",
                showarrow=True,
                arrowhead=3,
                ax=0, ay=25,
                font=dict(color="#f59e0b", size=11, family="SimHei"),
                bordercolor="#f59e0b",
                borderwidth=1,
                borderpad=3,
                bgcolor="rgba(255,255,255,0.95)"
            )

    if not device_change_df.is_empty():
        for row in device_change_df.iter_rows(named=True):
            change_date = row["change_date"]
            device_name = row["device_name"]
            old_v = row["old_version"]
            new_v = row["new_version"]
            fig.add_vline(
                x=change_date,
                line=dict(color="#8b5cf6", width=2, dash="dashdot"),
                layer="above"
            )
            fig.add_annotation(
                x=change_date, y=0.02, yref="paper",
                text=f"🔧 {device_name}<br>{old_v}→{new_v}",
                showarrow=True,
                arrowhead=3,
                ax=0, ay=-35,
                font=dict(color="#8b5cf6", size=10, family="SimHei"),
                bordercolor="#8b5cf6",
                borderwidth=1,
                borderpad=3,
                bgcolor="rgba(255,255,255,0.95)"
            )

    for period in denial_periods:
        fig.add_vrect(
            x0=period["start"], x1=period["end"],
            fillcolor="rgba(239, 68, 68, 0.15)",
            line=dict(color="#ef4444", width=2, dash="dash"),
            layer="below"
        )
        mid_date = period["start"] + (period["end"] - period["start"]) / 2
        fig.add_annotation(
            x=mid_date, y=0.98, yref="paper",
            text=f"💰 医保拒付高峰期<br>{period['start'].strftime('%m/%d')}-{period['end'].strftime('%m/%d')}",
            showarrow=False,
            font=dict(color="#ef4444", size=11, family="SimHei"),
            bordercolor="#ef4444",
            borderwidth=1,
            borderpad=4,
            bgcolor="rgba(255,240,240,0.95)"
        )

    fig.add_hrect(y0=80, y1=100, fillcolor="rgba(239,68,68,0.08)", layer="below", line_width=0)
    fig.add_hrect(y0=60, y1=80, fillcolor="rgba(249,115,22,0.08)", layer="below", line_width=0)
    fig.add_hrect(y0=40, y1=60, fillcolor="rgba(245,158,11,0.08)", layer="below", line_width=0)
    fig.add_hrect(y0=20, y1=40, fillcolor="rgba(132,204,22,0.08)", layer="below", line_width=0)
    fig.add_hrect(y0=0, y1=20, fillcolor="rgba(16,185,129,0.08)", layer="below", line_width=0)

    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=20, family="SimHei", color="#1f2937"),
            x=0.5, xanchor="center",
            pad=dict(t=20, b=15)
        ),
        xaxis_title="日期",
        yaxis_title="风险评分 (0-100)",
        hovermode="x unified",
        template="plotly_white",
        height=650,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.08,
            xanchor="center",
            x=0.5,
            font=dict(family="SimHei", size=11)
        ),
        xaxis=dict(
            gridcolor="#e5e7eb",
            showgrid=True,
            tickfont=dict(family="SimHei", size=11)
        ),
        yaxis=dict(
            range=[0, 105],
            gridcolor="#e5e7eb",
            showgrid=True,
            tickfont=dict(family="SimHei", size=11),
            dtick=20
        ),
        margin=dict(l=60, r=40, t=120, b=60),
        plot_bgcolor="rgba(250,250,250,0.5)"
    )

    return fig


def create_risk_distribution_chart(distribution: Dict) -> go.Figure:
    levels = list(distribution.keys())
    counts = list(distribution.values())
    colors = [RISK_COLORS.get(level, "#9ca3af") for level in levels]

    fig = go.Figure(data=[go.Bar(
        x=levels, y=counts,
        marker_color=colors,
        text=counts,
        textposition="outside",
        textfont=dict(family="SimHei", size=13),
        hovertemplate="<b>%{x}</b><br>患者数: %{y}<extra></extra>"
    )])

    fig.update_layout(
        title=dict(
            text="患者风险等级分布",
            font=dict(size=16, family="SimHei", color="#1f2937")
        ),
        xaxis=dict(
            title="风险等级",
            tickfont=dict(family="SimHei", size=12)
        ),
        yaxis=dict(
            title="患者数",
            gridcolor="#e5e7eb",
            tickfont=dict(family="SimHei", size=11)
        ),
        template="plotly_white",
        height=400,
        bargap=0.35,
        margin=dict(l=50, r=30, t=60, b=50),
        plot_bgcolor="rgba(250,250,250,0.5)"
    )

    return fig


def create_heatmap_view(view_df: pl.DataFrame, title: str,
                        value_col: str = None) -> go.Figure:
    if view_df.is_empty():
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=16))
        fig.update_layout(height=400, title=title)
        return fig

    try:
        if "treatment_date" in view_df.columns:
            pivot = view_df.group_by(["treatment_date", "treatment_type"]).agg(
                pl.count("treatment_id").alias("count")
            ).pivot(
                index="treatment_date",
                columns="treatment_type",
                values="count"
            ).fill_null(0)
            x_col = "treatment_date"
        elif "status_date" in view_df.columns:
            pivot = view_df.group_by(["status_date", "device_name"]).agg(
                pl.mean("utilization_rate").alias("util")
            ).pivot(
                index="status_date",
                columns="device_name",
                values="util"
            ).fill_null(0)
            x_col = "status_date"
        elif "log_date" in view_df.columns:
            pivot = view_df.group_by(["log_date", "shift"]).agg(
                pl.count("log_id").alias("count")
            ).pivot(
                index="log_date",
                columns="shift",
                values="count"
            ).fill_null(0)
            x_col = "log_date"
        else:
            pivot = view_df
            x_col = pivot.columns[0]

        x_values = pivot[x_col].to_list()
        y_values = [c for c in pivot.columns if c != x_col]

        z_data = []
        for col in y_values:
            z_data.append(pivot[col].to_list())

        fig = go.Figure(data=go.Heatmap(
            z=z_data,
            x=[str(d) for d in x_values],
            y=y_values,
            colorscale="YlOrRd",
            hoverongaps=False,
            hovertemplate='<b>%{x}</b><br>%{y}: %{z:.1f}<extra></extra>'
        ))

        fig.update_layout(
            title=dict(text=title, font=dict(size=16, family="SimHei")),
            xaxis=dict(tickfont=dict(family="SimHei", size=10), tickangle=45),
            yaxis=dict(tickfont=dict(family="SimHei", size=11)),
            height=450,
            template="plotly_white",
            margin=dict(l=100, r=30, t=60, b=80)
        )

        return fig
    except Exception as e:
        fig = go.Figure()
        fig.add_annotation(
            text=f"图表生成错误: {str(e)}",
            showarrow=False, font=dict(size=14, color="red")
        )
        fig.update_layout(height=400, title=title)
        return fig


def create_single_patient_trend(detail_df: pl.DataFrame,
                                fee_delay_df: pl.DataFrame,
                                device_change_df: pl.DataFrame,
                                patient_name: str) -> go.Figure:
    fig = go.Figure()

    if not detail_df.is_empty():
        dates = detail_df["record_date"].to_list()
        scores = detail_df["risk_score"].to_list()
        training_rates = detail_df["training_completion_rate"].to_list()

        colors = []
        for lvl in detail_df["risk_level"].to_list():
            colors.append(RISK_COLORS.get(lvl, "#9ca3af"))

        fig.add_trace(go.Bar(
            x=dates, y=scores,
            name="风险评分",
            marker_color=colors,
            marker_line=dict(color="white", width=0.5),
            opacity=0.75,
            hovertemplate='<b>%{x}</b><br>风险评分: %{y:.1f}<extra></extra>'
        ))

        fig.add_trace(go.Scatter(
            x=dates, y=training_rates,
            mode="lines+markers",
            name="训练完成率 (%)",
            yaxis="y2",
            line=dict(color="#2563eb", width=2.5),
            marker=dict(size=7, symbol="diamond"),
            hovertemplate='<b>%{x}</b><br>训练完成率: %{y:.1f}%<extra></extra>'
        ))

        anomaly_mask = (
            (~detail_df["fee_table_updated"].to_list()) |
            (~detail_df["medical_record_complete"].to_list()) |
            (~detail_df["device_calibration_current"].to_list()) |
            (detail_df["insurance_denial"].to_list())
        )

        if any(anomaly_mask):
            anomaly_dates = [d for d, m in zip(dates, anomaly_mask) if m]
            anomaly_scores = [s for s, m in zip(scores, anomaly_mask) if m]
            anomaly_types = []
            for row in detail_df.filter(pl.lit(anomaly_mask)).iter_rows(named=True):
                types = []
                if not row["fee_table_updated"]:
                    types.append("收费延迟")
                if not row["medical_record_complete"]:
                    types.append("病历缺失")
                if not row["device_calibration_current"]:
                    types.append("设备校准")
                if row["insurance_denial"]:
                    types.append("医保拒付")
                anomaly_types.append("<br>".join(types) if types else "异常")

            fig.add_trace(go.Scatter(
                x=anomaly_dates, y=anomaly_scores,
                mode="markers",
                name="异常点",
                marker=dict(
                    symbol="star",
                    size=14,
                    color="#dc2626",
                    line=dict(color="#fff", width=2)
                ),
                text=anomaly_types,
                hovertemplate='<b>%{x}</b><br>评分: %{y:.1f}<br>%{text}<extra></extra>'
            ))

    if not fee_delay_df.is_empty():
        for row in fee_delay_df.iter_rows(named=True):
            fig.add_vrect(
                x0=row["expected_date"], x1=row["sync_date"],
                fillcolor="rgba(245,158,11,0.2)",
                line=dict(color="#f59e0b", width=1.5),
                layer="below"
            )

    if not device_change_df.is_empty():
        for row in device_change_df.iter_rows(named=True):
            fig.add_vline(
                x=row["change_date"],
                line=dict(color="#8b5cf6", width=2, dash="dashdot")
            )

    fig.add_hrect(y0=80, y1=100, fillcolor="rgba(239,68,68,0.06)", layer="below", line_width=0)
    fig.add_hrect(y0=60, y1=80, fillcolor="rgba(249,115,22,0.06)", layer="below", line_width=0)
    fig.add_hrect(y0=40, y1=60, fillcolor="rgba(245,158,11,0.06)", layer="below", line_width=0)
    fig.add_hrect(y0=20, y1=40, fillcolor="rgba(132,204,22,0.06)", layer="below", line_width=0)
    fig.add_hrect(y0=0, y1=20, fillcolor="rgba(16,185,129,0.06)", layer="below", line_width=0)

    fig.update_layout(
        title=dict(
            text=f"患者 {patient_name} - 风险趋势与训练完成率",
            font=dict(size=17, family="SimHei", color="#1f2937"),
            x=0.5
        ),
        xaxis=dict(title="日期", tickangle=0, tickfont=dict(family="SimHei")),
        yaxis=dict(
            title="风险评分",
            range=[0, 105],
            gridcolor="#e5e7eb",
            tickfont=dict(family="SimHei")
        ),
        yaxis2=dict(
            title="训练完成率 (%)",
            range=[0, 105],
            gridcolor="rgba(37,99,235,0.1)",
            overlaying="y",
            side="right",
            tickfont=dict(color="#2563eb", family="SimHei"),
            title_font=dict(color="#2563eb", family="SimHei")
        ),
        hovermode="x unified",
        template="plotly_white",
        height=550,
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02,
            xanchor="center", x=0.5,
            font=dict(family="SimHei", size=11)
        ),
        barmode="overlay",
        margin=dict(l=60, r=60, t=100, b=60),
        plot_bgcolor="rgba(250,250,250,0.5)"
    )

    return fig


def create_training_rate_chart(trend_df: pl.DataFrame) -> go.Figure:
    fig = go.Figure()

    if not trend_df.is_empty():
        dates = trend_df["record_date"].to_list()
        rates = trend_df["training_rate"].to_list()

        fig.add_trace(go.Scatter(
            x=dates, y=rates,
            mode="lines+markers",
            fill="tozeroy",
            name="平均训练完成率",
            line=dict(color="#2563eb", width=2.5),
            marker=dict(size=6),
            fillcolor="rgba(37,99,235,0.15)",
            hovertemplate='<b>%{x}</b><br>训练完成率: %{y:.1f}%<extra></extra>'
        ))

        fig.add_hline(
            y=90, line=dict(color="#10b981", width=2, dash="dash"),
            annotation_text="优秀线 (90%)",
            annotation_position="right"
        )
        fig.add_hline(
            y=70, line=dict(color="#ef4444", width=2, dash="dash"),
            annotation_text="合格线 (70%)",
            annotation_position="right"
        )

    fig.update_layout(
        title=dict(text="全体患者训练完成率趋势", font=dict(size=16, family="SimHei")),
        xaxis=dict(title="日期", tickfont=dict(family="SimHei")),
        yaxis=dict(
            title="完成率 (%)",
            range=[0, 105],
            gridcolor="#e5e7eb",
            tickfont=dict(family="SimHei")
        ),
        template="plotly_white",
        height=380,
        margin=dict(l=60, r=30, t=60, b=50),
        plot_bgcolor="rgba(250,250,250,0.5)"
    )

    return fig


def create_anomaly_summary_chart(trend_df: pl.DataFrame) -> go.Figure:
    fig = go.Figure()

    if not trend_df.is_empty():
        dates = trend_df["record_date"].to_list()

        fig.add_trace(go.Bar(
            x=dates, y=trend_df["fee_delay_count"].to_list(),
            name="收费表延迟",
            marker_color="#f59e0b"
        ))
        fig.add_trace(go.Bar(
            x=dates, y=trend_df["record_gap_count"].to_list(),
            name="病历缺失",
            marker_color="#3b82f6"
        ))
        fig.add_trace(go.Bar(
            x=dates, y=trend_df["device_change_count"].to_list(),
            name="设备口径变化",
            marker_color="#8b5cf6"
        ))
        fig.add_trace(go.Bar(
            x=dates, y=trend_df["insurance_denial_count"].to_list(),
            name="医保拒付",
            marker_color="#ef4444"
        ))

    fig.update_layout(
        title=dict(text="每日异常事件统计", font=dict(size=16, family="SimHei")),
        xaxis=dict(title="日期", tickfont=dict(family="SimHei")),
        yaxis=dict(title="异常记录数", gridcolor="#e5e7eb", tickfont=dict(family="SimHei")),
        barmode="stack",
        template="plotly_white",
        height=400,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5,
                    font=dict(family="SimHei")),
        margin=dict(l=50, r=30, t=80, b=50),
        plot_bgcolor="rgba(250,250,250,0.5)"
    )

    return fig
