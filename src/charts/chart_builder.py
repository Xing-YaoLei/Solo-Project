import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import polars as pl
from typing import Optional, List
from datetime import date


class ChartBuilder:
    @staticmethod
    def funnel_chart(df: pl.DataFrame, title: str = "投诉漏斗") -> go.Figure:
        stages = ["总投诉", "处理中", "已关闭"]

        if len(df) == 0:
            values = [0, 0, 0]
        else:
            total = df.select(pl.sum("count")).item()
            processing = df.filter(pl.col("status") == "处理中").select(pl.sum("count")).item() or 0
            closed = df.filter(pl.col("status") == "已关闭").select(pl.sum("count")).item() or 0
            values = [total, processing, closed]

        fig = go.Figure(go.Funnel(
            y=stages,
            x=values,
            textinfo="value+percent initial",
            marker={"color": ["#3498db", "#f39c12", "#2ecc71"]},
            textposition="inside"
        ))

        fig.update_layout(
            title=title,
            height=400,
            margin=dict(l=20, r=20, t=40, b=20)
        )

        return fig

    @staticmethod
    def daily_trend_chart(df: pl.DataFrame, title: str = "每日投诉趋势") -> go.Figure:
        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=df["complaint_date"].to_list(),
            y=df["total_count"].to_list(),
            name="总投诉",
            marker_color="#3498db"
        ))

        fig.add_trace(go.Bar(
            x=df["complaint_date"].to_list(),
            y=df["closed_count"].to_list(),
            name="已关闭",
            marker_color="#2ecc71"
        ))

        fig.add_trace(go.Scatter(
            x=df["complaint_date"].to_list(),
            y=df["processing_count"].to_list(),
            name="处理中",
            mode="lines+markers",
            line=dict(color="#f39c12", width=2),
            yaxis="y2"
        ))

        fig.update_layout(
            title=title,
            barmode="group",
            xaxis_title="日期",
            yaxis_title="投诉数量",
            yaxis2=dict(
                title="处理中数量",
                overlaying="y",
                side="right"
            ),
            height=400,
            legend=dict(orientation="h", y=-0.2),
            margin=dict(l=20, r=20, t=40, b=60)
        )

        return fig

    @staticmethod
    def region_comparison_chart(df: pl.DataFrame, title: str = "各区域投诉对比") -> go.Figure:
        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=df["region"].to_list(),
            y=df["total_count"].to_list(),
            name="总投诉",
            marker_color="#3498db"
        ))

        fig.add_trace(go.Bar(
            x=df["region"].to_list(),
            y=df["closed_count"].to_list(),
            name="已关闭",
            marker_color="#2ecc71"
        ))

        fig.add_trace(go.Scatter(
            x=df["region"].to_list(),
            y=df["avg_close_hours"].to_list(),
            name="平均关闭时长(小时)",
            mode="lines+markers",
            line=dict(color="#e74c3c", width=2),
            yaxis="y2"
        ))

        fig.update_layout(
            title=title,
            barmode="group",
            xaxis_title="区域",
            yaxis_title="投诉数量",
            yaxis2=dict(
                title="平均关闭时长(小时)",
                overlaying="y",
                side="right"
            ),
            height=400,
            legend=dict(orientation="h", y=-0.2),
            margin=dict(l=20, r=20, t=40, b=60)
        )

        return fig

    @staticmethod
    def close_hours_distribution_chart(df: pl.DataFrame, title: str = "关闭时长分布") -> go.Figure:
        fig = go.Figure(go.Pie(
            labels=df["close_duration"].to_list(),
            values=df["count"].to_list(),
            hole=0.4,
            marker_colors=["#2ecc71", "#3498db", "#f39c12", "#e67e22", "#e74c3c"]
        ))

        fig.update_layout(
            title=title,
            height=400,
            margin=dict(l=20, r=20, t=40, b=20)
        )

        return fig

    @staticmethod
    def tag_distribution_chart(df: pl.DataFrame, title: str = "问题标签分布") -> go.Figure:
        fig = go.Figure(go.Bar(
            x=df["tag"].to_list(),
            y=df["count"].to_list(),
            marker_color="#3498db",
            text=df["count"].to_list(),
            textposition="outside"
        ))

        fig.update_layout(
            title=title,
            xaxis_title="问题标签",
            yaxis_title="投诉数量",
            height=400,
            margin=dict(l=20, r=20, t=40, b=80),
            xaxis_tickangle=-45
        )

        return fig

    @staticmethod
    def followup_result_chart(df: pl.DataFrame, title: str = "回访结果分布") -> go.Figure:
        fig = go.Figure(go.Bar(
            x=df["followup_result"].to_list(),
            y=df["count"].to_list(),
            marker_color=["#2ecc71", "#3498db", "#e74c3c", "#95a5a6", "#f39c12"],
            text=df["count"].to_list(),
            textposition="outside"
        ))

        fig.update_layout(
            title=title,
            xaxis_title="回访结果",
            yaxis_title="数量",
            height=350,
            margin=dict(l=20, r=20, t=40, b=20)
        )

        return fig

    @staticmethod
    def responsibility_chart(df: pl.DataFrame, title: str = "责任归属分布") -> go.Figure:
        fig = go.Figure(go.Bar(
            y=df["responsibility"].to_list(),
            x=df["count"].to_list(),
            orientation="h",
            marker_color="#9b59b6",
            text=df["count"].to_list(),
            textposition="outside"
        ))

        fig.update_layout(
            title=title,
            xaxis_title="投诉数量",
            yaxis_title="责任部门",
            height=400,
            margin=dict(l=120, r=20, t=40, b=20)
        )

        return fig

    @staticmethod
    def yoy_comparison_chart(current_df: pl.DataFrame, previous_df: pl.DataFrame,
                             title: str = "同比对比") -> go.Figure:
        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=current_df["complaint_date"].to_list(),
            y=current_df["total_count"].to_list(),
            name="本期",
            mode="lines+markers",
            line=dict(color="#3498db", width=2)
        ))

        prev_dates = []
        for d in previous_df["complaint_date"].to_list():
            prev_dates.append(d)

        fig.add_trace(go.Scatter(
            x=prev_dates,
            y=previous_df["total_count"].to_list(),
            name="同期",
            mode="lines+markers",
            line=dict(color="#95a5a6", width=2, dash="dash")
        ))

        fig.update_layout(
            title=title,
            xaxis_title="日期",
            yaxis_title="投诉数量",
            height=350,
            legend=dict(orientation="h", y=-0.2),
            margin=dict(l=20, r=20, t=40, b=60)
        )

        return fig

    @staticmethod
    def pipeline_steps_chart(steps_info: list, run_results: list = None) -> go.Figure:
        step_names = [s["name"] for s in steps_info]
        statuses = ["未执行"] * len(step_names)
        durations = [0] * len(step_names)

        if run_results:
            result_map = {r["step_id"]: r for r in run_results}
            for i, step in enumerate(steps_info):
                if step["id"] in result_map:
                    statuses[i] = result_map[step["id"]].get("status", "未知")
                    durations[i] = result_map[step["id"]].get("duration", 0)

        color_map = {
            "success": "#2ecc71",
            "failed": "#e74c3c",
            "running": "#f39c12",
            "未执行": "#95a5a6"
        }

        colors = [color_map.get(s, "#95a5a6") for s in statuses]

        fig = go.Figure(go.Funnel(
            y=step_names,
            x=[100, 80, 60],
            textinfo="text",
            text=[f"{s}<br>{d:.1f}s" if d > 0 else s for s, d in zip(statuses, durations)],
            marker={"color": colors}
        ))

        fig.update_layout(
            title="取数链路进度",
            height=300,
            margin=dict(l=20, r=20, t=40, b=20)
        )

        return fig
