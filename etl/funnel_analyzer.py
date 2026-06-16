import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class FunnelAnalyzer:
    @staticmethod
    def create_funnel_chart(
        stages: List[Dict[str, any]],
        title: str = "洁牙预约转化漏斗",
    ) -> go.Figure:
        if not stages:
            fig = go.Figure()
            fig.update_layout(title=title, annotations=[
                dict(
                    text="暂无数据",
                    showarrow=False,
                    font=dict(size=20, color="gray"),
                )
            ])
            return fig

        labels = [s["stage"] for s in stages]
        values = [s["count"] for s in stages]
        colors = [s["color"] for s in stages]
        conversions = [round(s["conversion"] * 100, 1) for s in stages]
        step_conversions = [round(s["step_conversion"] * 100, 1) for s in stages]

        fig = go.Figure(
            go.Funnel(
                y=labels,
                x=values,
                textposition="inside",
                textinfo="value+percent initial",
                opacity=0.85,
                marker=dict(color=colors),
                connector={"line": {"color": "lightgray", "dash": "dot", "width": 2}},
            )
        )

        for i, stage in enumerate(stages):
            if i > 0:
                fig.add_annotation(
                    x=stage["count"] + max(values) * 0.05,
                    y=i,
                    text=f"阶段转化: {step_conversions[i]}%",
                    showarrow=False,
                    font=dict(size=12, color="#6b7280"),
                    xanchor="left",
                )

        fig.update_layout(
            title=dict(text=title, font=dict(size=18)),
            yaxis=dict(
                tickfont=dict(size=14),
                automargin=True,
            ),
            xaxis=dict(title="人数"),
            showlegend=False,
            margin=dict(l=10, r=150, t=60, b=10),
            height=400,
        )

        return fig

    @staticmethod
    def create_trend_chart(
        appointments_df: pd.DataFrame,
        group_by: str = "week",
        title: str = "洁牙预约趋势",
    ) -> go.Figure:
        if appointments_df.empty:
            fig = go.Figure()
            fig.update_layout(title=title)
            return fig

        df = appointments_df.copy()
        df["appointment_date"] = pd.to_datetime(df["appointment_date"])

        if group_by == "week":
            df["period"] = df["appointment_date"].dt.isocalendar().week.astype(str) + "-" + df["appointment_date"].dt.isocalendar().year.astype(str)
            df["period_date"] = df["appointment_date"] - pd.to_timedelta(df["appointment_date"].dt.weekday, unit="D")
        elif group_by == "month":
            df["period"] = df["appointment_date"].dt.strftime("%Y-%m")
            df["period_date"] = df["appointment_date"].dt.to_period("M").dt.to_timestamp()
        else:
            df["period"] = df["appointment_date"].dt.strftime("%Y-%m-%d")
            df["period_date"] = df["appointment_date"]

        status_order = ["已预约", "已确认", "已到院", "已完成", "爽约", "已取消"]
        status_colors = {
            "已预约": "#6366f1",
            "已确认": "#8b5cf6",
            "已到院": "#06b6d4",
            "已完成": "#10b981",
            "爽约": "#ef4444",
            "已取消": "#f59e0b",
        }

        grouped = (
            df.groupby(["period_date", "status"])
            .size()
            .unstack(fill_value=0)
            .reset_index()
        )

        for col in status_order:
            if col not in grouped.columns:
                grouped[col] = 0

        grouped = grouped.sort_values("period_date")

        fig = go.Figure()

        for status in status_order:
            if status in grouped.columns:
                fig.add_trace(
                    go.Scatter(
                        x=grouped["period_date"],
                        y=grouped[status],
                        mode="lines+markers",
                        name=status,
                        line=dict(color=status_colors.get(status, "#6b7280"), width=2),
                        marker=dict(size=6),
                        stackgroup=None if status != "已完成" else None,
                    )
                )

        fig.update_layout(
            title=dict(text=title, font=dict(size=18)),
            xaxis=dict(title="日期", tickangle=-45),
            yaxis=dict(title="预约人数"),
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            height=400,
            margin=dict(l=10, r=10, t=60, b=10),
        )

        return fig

    @staticmethod
    def create_no_show_trend_chart(
        no_show_df: pd.DataFrame,
        impact_periods: List[Dict[str, any]],
        title: str = "爽约率走势分析",
    ) -> go.Figure:
        if no_show_df.empty:
            fig = go.Figure()
            fig.update_layout(title=title)
            return fig

        df = no_show_df.copy()
        df["period"] = pd.to_datetime(df["period"])
        df["no_show_rate"] = (df["no_show_count"] / df["total_appointments"] * 100).round(2)
        mean_rate = df["no_show_rate"].mean()

        fig = go.Figure()

        fig.add_trace(
            go.Scatter(
                x=df["period"],
                y=df["no_show_rate"],
                mode="lines+markers",
                name="爽约率(%)",
                line=dict(color="#ef4444", width=2),
                marker=dict(size=8, color="#ef4444"),
                hovertemplate="%{x|%Y-%m-%d}<br>爽约率: %{y}%<br>爽约数: %{customdata[0]}<br>总预约: %{customdata[1]}",
                customdata=df[["no_show_count", "total_appointments"]].values,
            )
        )

        fig.add_trace(
            go.Scatter(
                x=df["period"],
                y=[mean_rate] * len(df),
                mode="lines",
                name=f"平均({mean_rate:.1f}%)",
                line=dict(color="#6b7280", width=1, dash="dash"),
            )
        )

        for period in impact_periods:
            start_date = datetime.strptime(period["start_date"], "%Y-%m-%d")
            end_date = datetime.strptime(period["end_date"], "%Y-%m-%d")

            fig.add_vrect(
                x0=start_date,
                x1=end_date,
                fillcolor="rgba(239, 68, 68, 0.1)",
                layer="below",
                line_width=0,
            )

            mid_date = start_date + (end_date - start_date) / 2
            fig.add_annotation(
                x=mid_date,
                y=max(df["no_show_rate"]) * 1.1,
                text=f"⚠️ 异常影响期<br>{period['no_show_rate']}%",
                showarrow=True,
                arrowhead=1,
                ax=0,
                ay=-30,
                font=dict(size=10, color="#ef4444"),
                bgcolor="rgba(255,255,255,0.9)",
            )

        fig.update_layout(
            title=dict(text=title, font=dict(size=18)),
            xaxis=dict(title="日期", tickangle=-45),
            yaxis=dict(title="爽约率(%)", ticksuffix="%"),
            hovermode="x unified",
            height=400,
            margin=dict(l=10, r=10, t=60, b=10),
            showlegend=True,
        )

        return fig

    @staticmethod
    def create_anomaly_summary_table(
        anomalies_df: pd.DataFrame,
        title: str = "异常检测概览",
    ) -> go.Figure:
        if anomalies_df.empty:
            fig = go.Figure()
            fig.update_layout(
                title=title,
                annotations=[
                    dict(
                        text="✅ 暂无异常",
                        showarrow=False,
                        font=dict(size=18, color="#10b981"),
                    )
                ],
            )
            return fig

        type_counts = anomalies_df["anomaly_type"].value_counts().reset_index()
        type_counts.columns = ["异常类型", "数量"]

        severity_order = {"error": 0, "warning": 1, "info": 2}
        anomalies_df["severity_order"] = anomalies_df["severity"].map(severity_order)
        anomalies_df = anomalies_df.sort_values(
            ["severity_order", "detected_at"], ascending=[True, False]
        )

        fig = make_subplots(
            rows=1,
            cols=2,
            subplot_titles=("异常类型分布", "最近异常记录"),
            specs=[[{"type": "pie"}, {"type": "table"}]],
            column_widths=[0.4, 0.6],
        )

        color_map = {
            "预约表延迟": "#ef4444",
            "收费记录缺失": "#f59e0b",
            "HIS口径变化": "#8b5cf6",
            "数据不一致": "#6366f1",
            "金额异常": "#06b6d4",
        }

        fig.add_trace(
            go.Pie(
                labels=type_counts["异常类型"],
                values=type_counts["数量"],
                marker=dict(
                    colors=[color_map.get(t, "#6b7280") for t in type_counts["异常类型"]]
                ),
                textinfo="label+percent",
                showlegend=True,
            ),
            row=1,
            col=1,
        )

        recent = anomalies_df.head(10).copy()
        recent["detected_at"] = pd.to_datetime(recent["detected_at"]).dt.strftime("%Y-%m-%d %H:%M")

        severity_colors = {
            "error": "#fee2e2",
            "warning": "#fef3c7",
            "info": "#dbeafe",
        }
        fill_colors = [
            [[severity_colors.get(s, "#f3f4f6")] * 10 for s in recent["severity"]]
        ][0]

        fig.add_trace(
            go.Table(
                header=dict(
                    values=["类型", "严重程度", "检测时间", "描述"],
                    fill_color="#374151",
                    font=dict(color="white", size=12),
                    align="left",
                ),
                cells=dict(
                    values=[
                        recent["anomaly_type"],
                        recent["severity"],
                        recent["detected_at"],
                        recent["description"].str[:30] + "...",
                    ],
                    fill_color=[fill_colors],
                    align="left",
                    font=dict(size=11),
                    height=30,
                ),
            ),
            row=1,
            col=2,
        )

        fig.update_layout(
            title=dict(text=title, font=dict(size=18)),
            height=400,
            margin=dict(l=10, r=10, t=60, b=10),
        )

        return fig
