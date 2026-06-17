from typing import Optional, Dict, Any, Tuple
from datetime import date, timedelta
from dataclasses import dataclass

import polars as pl
import plotly.graph_objects as go
import plotly.express as px

from ..models.cleaning_schedule import CleaningScheduleModel
from ..models.payment_flow import PaymentFlowModel
from ..models.e_contract import EContractModel
from ..auth.permission import UserContext, DataFilter
from ..config import CAPACITY_RULES


@dataclass
class FunnelStage:
    name: str
    count: int
    description: str


class CleaningFunnelReport:
    def __init__(self, user: UserContext):
        self.user = user
        self.filter = DataFilter(user)
        self.schedule_model = CleaningScheduleModel()
        self.payment_model = PaymentFlowModel()
        self.contract_model = EContractModel()

    def _apply(self, df: pl.DataFrame) -> pl.DataFrame:
        return self.filter.apply_all(df)

    def build_funnel(
        self, start_date: date, end_date: date, region: Optional[str] = None
    ) -> Tuple[pl.DataFrame, go.Figure]:
        raw = self.schedule_model.get_funnel_data(start_date, end_date, region)
        data = self._apply(raw)

        if data.is_empty():
            return data, go.Figure()

        total = data["total_scheduled"].sum()
        reminder = data["reminder_sent"].sum()
        on_time = data["on_time"].sum()
        late = data["late"].sum()
        absent = data["absent"].sum()
        arrived = on_time + late
        completed = data["completed"].sum()
        cancelled = data["cancelled"].sum()

        stages = [
            FunnelStage("已排班", total, f"从 {start_date} 至 {end_date} 共 {total} 条保洁排班"),
            FunnelStage("已发送提醒", reminder, f"已向 {reminder} 位保洁员发送提醒"),
            FunnelStage("实际到场", arrived, f"准时 {on_time} 单 + 迟到 {late} 单，缺席 {absent} 单"),
            FunnelStage("完成服务", completed, f"已完成 {completed} 单，取消 {cancelled} 单"),
        ]

        names = [s.name for s in stages]
        values = [s.count for s in stages]
        texts = [f"{s.count}<br><span style='font-size:10px'>{s.description}</span>" for s in stages]

        fig = go.Figure(
            go.Funnel(
                x=values,
                y=names,
                text=texts,
                textposition="inside",
                texttemplate="%{text}",
                marker={
                    "color": ["#4F81BD", "#9CBB58", "#F79646", "#8064A2"],
                    "line": {"width": [2, 2, 2, 2], "color": ["white", "white", "white", "white"]},
                },
                connector={"line": {"color": "#AAAAAA", "dash": "dot", "width": 2}},
            )
        )
        fig.update_layout(
            title={
                "text": f"保洁排班漏斗 ({start_date} ~ {end_date})",
                "x": 0.5,
                "font": {"size": 16},
            },
            height=420,
            margin=dict(l=20, r=20, t=60, b=20),
        )
        return data, fig

    def build_arrival_rate_trend(
        self, start_date: date, end_date: date, region: Optional[str] = None, group_by: str = "date"
    ) -> Tuple[pl.DataFrame, go.Figure]:
        raw = self.schedule_model.get_arrival_rate(start_date, end_date, group_by, region)
        data = self._apply(raw)

        if data.is_empty():
            return data, go.Figure()

        x_col = "scheduled_date" if group_by in ["date", "region_date"] else (
            "region" if group_by == "region" else "cleaner_id"
        )

        fig = go.Figure()
        fig.add_trace(
            go.Scatter(
                x=data[x_col].to_list(),
                y=data["arrival_rate"].to_list(),
                name="到场率",
                mode="lines+markers",
                line=dict(color="#4F81BD", width=2),
                marker=dict(size=7),
                yaxis="y",
            )
        )
        fig.add_trace(
            go.Bar(
                x=data[x_col].to_list(),
                y=data["total"].to_list(),
                name="排班总数",
                marker_color="#9CBB58",
                opacity=0.6,
                yaxis="y2",
            )
        )
        fig.update_layout(
            title=f"到场率趋势 ({start_date} ~ {end_date})",
            xaxis_title="日期" if group_by in ["date", "region_date"] else x_col,
            yaxis=dict(title="到场率 (%)", range=[0, 105], side="left"),
            yaxis2=dict(title="排班数", overlaying="y", side="right"),
            height=380,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            barmode="overlay",
        )
        return data, fig

    def build_region_comparison(
        self, start_date: date, end_date: date
    ) -> Tuple[pl.DataFrame, go.Figure]:
        raw = self.schedule_model.get_arrival_rate(start_date, end_date, "region")
        data = self._apply(raw)

        if data.is_empty():
            return data, go.Figure()

        fig = px.bar(
            data.to_pandas(),
            x="region",
            y=["on_time_rate", "arrival_rate"],
            barmode="group",
            title=f"各区域到场率对比 ({start_date} ~ {end_date})",
            labels={"region": "区域", "value": "比率 (%)", "variable": "指标"},
            color_discrete_sequence=["#4F81BD", "#F79646"],
            height=380,
        )
        fig.update_yaxes(range=[0, 105])
        return data, fig

    def build_conflict_chart(self, target_date: date) -> Tuple[pl.DataFrame, go.Figure]:
        raw = self.schedule_model.get_time_conflicts(target_date)
        data = self._apply(raw)

        if data.is_empty():
            return data, go.Figure()

        rows = []
        for row in data.iter_rows(named=True):
            rows.append(
                {
                    "cleaner_id": row["cleaner_id"],
                    "task": f"{row['schedule_a']} ({row['apartment_a']})",
                    "start": f"{target_date} {row['a_start']}",
                    "end": f"{target_date} {row['a_end']}",
                    "region": row["region"],
                    "conflict_pair": row["schedule_b"],
                }
            )
            rows.append(
                {
                    "cleaner_id": row["cleaner_id"],
                    "task": f"{row['schedule_b']} ({row['apartment_b']})",
                    "start": f"{target_date} {row['b_start']}",
                    "end": f"{target_date} {row['b_end']}",
                    "region": row["region"],
                    "conflict_pair": row["schedule_a"],
                }
            )

        df = pl.DataFrame(rows)
        fig = px.timeline(
            df.to_pandas(),
            x_start="start",
            x_end="end",
            y="cleaner_id",
            color="conflict_pair",
            hover_data=["task", "region"],
            title=f"时段冲突 ({target_date}) - 点击跳转明细",
            height=380,
        )
        return data, fig

    def build_reminder_list(
        self, start_date: date, end_date: date, region: Optional[str] = None
    ) -> pl.DataFrame:
        raw = self.schedule_model.get_reminder_list(start_date, end_date, region)
        return self._apply(raw)

    def build_capacity_explanation(self, target_date: date, region: Optional[str] = None) -> Dict[str, Any]:
        raw = self.schedule_model.get_capacity_utilization(target_date, region)
        data = self._apply(raw)
        daily_max = CAPACITY_RULES["cleaner_daily_max"]

        overloaded = data.filter(pl.col("assigned_tasks") > daily_max) if "assigned_tasks" in data.columns else pl.DataFrame()
        avg_tasks = round(data["assigned_tasks"].mean(), 2) if not data.is_empty() and "assigned_tasks" in data.columns else 0.0
        total_cleaners = data["cleaner_id"].n_unique() if not data.is_empty() and "cleaner_id" in data.columns else 0

        return {
            "rules": CAPACITY_RULES,
            "target_date": target_date,
            "region": region or "全部区域",
            "total_cleaners_on_duty": total_cleaners,
            "avg_tasks_per_cleaner": avg_tasks,
            "overloaded_cleaners": len(overloaded),
            "max_daily_tasks": daily_max,
            "overloaded_detail": overloaded,
            "utilization_data": data,
            "explanation": (
                f"容量规则说明：每位保洁员每日最多 {daily_max} 单，"
                f"每周最多 {CAPACITY_RULES['cleaner_weekly_max']} 单；"
                f"单户保洁预估 {CAPACITY_RULES['apartment_cleaning_hours']} 小时；"
                f"高峰时段为 {', '.join(CAPACITY_RULES['peak_hours'])}。"
                f"本日共 {total_cleaners} 名保洁员在岗，人均 {avg_tasks} 单，"
                f"超员 {len(overloaded)} 人。"
            ),
        }

    def compare_metrics(
        self,
        metric: str,
        current_start: date,
        current_end: date,
        region: Optional[str] = None,
        compare_type: str = "mom",
    ) -> Dict[str, Any]:
        if compare_type == "yoy":
            return self.schedule_model.compare_yoy(metric, current_start, current_end, region)
        return self.schedule_model.compare_mom(metric, current_start, current_end, region)

    def get_schedule_detail(self, schedule_id: str) -> Optional[pl.DataFrame]:
        raw = self.schedule_model.get_schedule_detail(schedule_id)
        if raw is None:
            return None
        return self._apply(raw)
