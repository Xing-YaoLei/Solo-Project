import plotly.graph_objects as go
import polars as pl
from typing import List, Optional, Dict, Any
from data import FunnelStage


class FunnelChart:
    def __init__(self, stages: List[FunnelStage]):
        self.stages = stages
        self.colors = {
            "活动计划": "#1f77b4",
            "活动通知": "#2ca02c",
            "老人签到": "#ff7f0e",
            "活动完成": "#9467bd",
            "护理达标": "#17becf"
        }

    def create_funnel_figure(self, title: str = "康复活动漏斗") -> go.Figure:
        stage_names = [s.stage_name for s in self.stages]
        counts = [s.count for s in self.stages]
        rates = [s.rate for s in self.stages]
        
        fig = go.Figure(go.Funnel(
            y=stage_names,
            x=counts,
            textposition="inside",
            textinfo="value+percent initial",
            opacity=0.85,
            marker={
                "color": [self.colors.get(name, "#333") for name in stage_names],
                "line": {
                    "width": 2,
                    "color": "white"
                }
            },
            connector={
                "line": {
                    "color": "#d6d6d6",
                    "width": 2
                }
            }
        ))
        
        fig.update_layout(
            title={
                "text": title,
                "y": 0.95,
                "x": 0.5,
                "xanchor": "center",
                "yanchor": "top"
            },
            showlegend=False,
            height=500,
            margin={"l": 20, "r": 20, "t": 80, "b": 20}
        )
        
        return fig

    def create_detailed_funnel_table(self) -> pl.DataFrame:
        data = []
        prev_count = None
        
        for stage in self.stages:
            drop_count = prev_count - stage.count if prev_count is not None else 0
            drop_rate = (drop_count / prev_count * 100) if prev_count is not None and prev_count > 0 else 0
            
            data.append({
                "阶段": stage.stage_name,
                "人数": stage.count,
                "占比(%)": f"{stage.rate:.2f}%",
                "流失人数": drop_count,
                "流失率(%)": f"{drop_rate:.2f}%" if prev_count else "-",
                "说明": stage.notes
            })
            prev_count = stage.count
        
        return pl.DataFrame(data)

    def create_conversion_bar_chart(self) -> go.Figure:
        stage_names = [s.stage_name for s in self.stages[1:]]
        prev_counts = [self.stages[i].count for i in range(len(self.stages) - 1)]
        curr_counts = [s.count for s in self.stages[1:]]
        
        conversion_rates = []
        for prev, curr in zip(prev_counts, curr_counts):
            rate = (curr / prev * 100) if prev > 0 else 0
            conversion_rates.append(rate)
        
        fig = go.Figure(go.Bar(
            x=stage_names,
            y=conversion_rates,
            text=[f"{r:.1f}%" for r in conversion_rates],
            textposition="auto",
            marker={
                "color": ["#2ca02c" if r >= 80 else "#ff7f0e" if r >= 60 else "#d62728" for r in conversion_rates]
            }
        ))
        
        fig.update_layout(
            title="各阶段转化率",
            yaxis_title="转化率(%)",
            yaxis_range=[0, 100],
            height=350,
            margin={"l": 20, "r": 20, "t": 50, "b": 20}
        )
        
        return fig

    def get_summary_stats(self) -> Dict[str, Any]:
        if not self.stages:
            return {}
        
        total = self.stages[0].count
        final = self.stages[-1].count
        overall_rate = (final / total * 100) if total > 0 else 0
        
        drop_rates = []
        for i in range(1, len(self.stages)):
            prev = self.stages[i-1].count
            curr = self.stages[i].count
            if prev > 0:
                drop_rates.append((prev - curr) / prev * 100)
        
        max_drop_stage = ""
        max_drop_rate = 0
        if drop_rates:
            max_idx = drop_rates.index(max(drop_rates))
            max_drop_stage = self.stages[max_idx + 1].stage_name
            max_drop_rate = drop_rates[max_idx]
        
        return {
            "total_activities": total,
            "final_compliant": final,
            "overall_compliance_rate": round(overall_rate, 2),
            "max_drop_stage": max_drop_stage,
            "max_drop_rate": round(max_drop_rate, 2),
            "stage_count": len(self.stages)
        }
