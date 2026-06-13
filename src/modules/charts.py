"""
图表生成模块：充值流水、评价标签、项目卡项、消课率等可视化
"""
import logging
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple

import polars as pl
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

from src.data import duckdb_manager
from src.modules.risk_engine import RiskEngine

logger = logging.getLogger(__name__)


class ChartGenerator:
    """图表生成器：为Streamlit界面提供各类图表"""

    COLORS = {
        "primary": "#6366F1",
        "success": "#10B981",
        "warning": "#F59E0B",
        "danger": "#EF4444",
        "info": "#3B82F6",
        "secondary": "#8B5CF6",
        "neutral": "#6B7280",
    }

    TREND_LINE_COLOR = "#F87171"
    DELAY_MARKER_COLOR = "#FBBF24"

    def __init__(self, threshold_config=None):
        self.risk_engine = RiskEngine(threshold_config)

    # ========== 充值流水图表 ==========

    def get_recharge_trend_chart(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        granularity: str = "day",
    ) -> go.Figure:
        """充值流水趋势图：含消费流水对比，标注点评延迟时段"""
        params = []
        sql = """
            SELECT
                transaction_date,
                transaction_type,
                amount,
                payment_method
            FROM cashier_transactions
            WHERE transaction_type IN ('RECHARGE', 'CONSUMPTION', 'PRODUCT')
        """
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND CAST(transaction_date AS DATE) >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND CAST(transaction_date AS DATE) <= ?"
            params.append(date_to)

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无充值流水数据")
            return fig

        if granularity == "day":
            df = df.with_columns(pl.col("transaction_date").dt.truncate("1d").alias("date_bucket"))
        elif granularity == "week":
            df = df.with_columns(pl.col("transaction_date").dt.truncate("1w").alias("date_bucket"))
        else:
            df = df.with_columns(pl.col("transaction_date").dt.truncate("1mo").alias("date_bucket"))

        pivot = df.group_by(["date_bucket", "transaction_type"]).agg(
            pl.col("amount").sum().alias("total_amount")
        ).pivot(
            index="date_bucket", columns="transaction_type", values="total_amount"
        ).sort("date_bucket")

        for col in ["RECHARGE", "CONSUMPTION", "PRODUCT"]:
            if col not in pivot.columns:
                pivot = pivot.with_columns(pl.lit(0.0).alias(col))
            pivot = pivot.with_columns(pl.col(col).fill_null(0.0))

        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=pivot["date_bucket"].to_list(),
            y=pivot["RECHARGE"].to_list(),
            name="充值金额",
            marker_color=self.COLORS["primary"],
            opacity=0.85,
        ))

        fig.add_trace(go.Bar(
            x=pivot["date_bucket"].to_list(),
            y=pivot["CONSUMPTION"].to_list(),
            name="项目消费",
            marker_color=self.COLORS["success"],
            opacity=0.85,
        ))

        fig.add_trace(go.Bar(
            x=pivot["date_bucket"].to_list(),
            y=pivot["PRODUCT"].to_list(),
            name="产品消费",
            marker_color=self.COLORS["info"],
            opacity=0.85,
        ))

        recharge_values = pivot["RECHARGE"].to_list()
        if len(recharge_values) >= 2:
            fig.add_trace(go.Scatter(
                x=pivot["date_bucket"].to_list(),
                y=recharge_values,
                mode="lines",
                name="充值趋势",
                line=dict(color=self.TREND_LINE_COLOR, width=2, dash="dash"),
            ))

        delay_periods = self._get_delayed_review_periods(date_from, date_to, granularity)
        if delay_periods:
            for i, (start, count, max_delay) in enumerate(delay_periods):
                fig.add_annotation(
                    x=start,
                    y=max(recharge_values) * 1.1 if recharge_values else 100,
                    text=f"⚠️{count}条延迟点评<br>({max_delay:.0f}h)",
                    showarrow=True,
                    arrowhead=2,
                    ax=0,
                    ay=-40,
                    bgcolor="rgba(251,191,36,0.2)",
                    bordercolor=self.DELAY_MARKER_COLOR,
                    font=dict(color="#92400E", size=10),
                )

        period_label = {"day": "日", "week": "周", "month": "月"}.get(granularity, "日")
        fig.update_layout(
            title=dict(text=f"充值与消费流水趋势（按{period_label}）", font=dict(size=16)),
            barmode="group",
            xaxis_title="日期",
            yaxis_title="金额（元）",
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            height=380,
            margin=dict(l=40, r=20, t=80, b=40),
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    def _get_delayed_review_periods(
        self, date_from: Optional[date], date_to: Optional[date], granularity: str
    ) -> List[Tuple[date, int, float]]:
        """获取存在点评延迟的时间段"""
        params = []
        sql = """
            SELECT service_date, COUNT(*) as cnt, MAX(delay_hours) as max_delay
            FROM reviews
            WHERE is_delayed = TRUE
        """
        if date_from:
            sql += " AND service_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND service_date <= ?"
            params.append(date_to)
        sql += " GROUP BY service_date HAVING cnt >= 3 ORDER BY service_date"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            return []

        if granularity == "week":
            df = df.with_columns(pl.col("service_date").dt.truncate("1w").alias("bucket"))
        elif granularity == "month":
            df = df.with_columns(pl.col("service_date").dt.truncate("1mo").alias("bucket"))
        else:
            df = df.with_columns(pl.col("service_date").alias("bucket"))

        grouped = df.group_by("bucket").agg([
            pl.col("cnt").sum().alias("total_delayed"),
            pl.col("max_delay").max().alias("max_hours"),
        ])
        return [
            (row["bucket"], int(row["total_delayed"]), float(row["max_hours"]))
            for row in grouped.iter_rows(named=True)
        ]

    def get_payment_method_distribution(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> go.Figure:
        """支付方式分布图"""
        params = []
        sql = """
            SELECT payment_method, SUM(amount) as total_amount, COUNT(*) as count
            FROM cashier_transactions
            WHERE amount > 0
        """
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND CAST(transaction_date AS DATE) >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND CAST(transaction_date AS DATE) <= ?"
            params.append(date_to)
        sql += " GROUP BY payment_method ORDER BY total_amount DESC"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无支付数据")
            return fig

        label_map = {
            "WECHAT": "微信支付", "ALIPAY": "支付宝", "CASH": "现金",
            "CARD": "银行卡", "MEMBER_CARD": "储值卡",
        }
        df = df.with_columns(
            pl.col("payment_method").replace(label_map).alias("method_label")
        )

        colors = [self.COLORS["primary"], self.COLORS["success"], self.COLORS["warning"],
                  self.COLORS["info"], self.COLORS["secondary"], self.COLORS["neutral"]]
        fig = px.pie(
            df.to_pandas(),
            values="total_amount",
            names="method_label",
            hole=0.45,
            color_discrete_sequence=colors,
        )
        fig.update_traces(
            textposition="inside",
            textinfo="label+percent",
            marker=dict(line=dict(color="white", width=2)),
        )
        fig.update_layout(
            title=dict(text="支付方式分布", font=dict(size=16)),
            height=380,
            legend=dict(orientation="h", yanchor="bottom", y=-0.1),
            margin=dict(l=20, r=20, t=60, b=20),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    # ========== 评价标签图表 ==========

    def get_rating_distribution_chart(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> go.Figure:
        """评分分布图"""
        params = []
        sql = "SELECT rating, COUNT(*) as count FROM reviews WHERE rating IS NOT NULL"
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND service_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND service_date <= ?"
            params.append(date_to)
        sql += " GROUP BY rating ORDER BY rating DESC"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无评价数据")
            return fig

        colors_map = {
            5: self.COLORS["success"], 4: self.COLORS["info"], 3: self.COLORS["warning"],
            2: self.COLORS["danger"], 1: self.COLORS["danger"],
        }
        bar_colors = [colors_map.get(int(r), self.COLORS["neutral"]) for r in df["rating"].to_list()]

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=df["rating"].to_list(),
            y=df["count"].to_list(),
            marker_color=bar_colors,
            text=df["count"].to_list(),
            textposition="outside",
            width=0.5,
        ))
        fig.update_layout(
            title=dict(text="评价星级分布", font=dict(size=16)),
            xaxis_title="星级",
            yaxis_title="评价数量",
            xaxis=dict(tickvals=[1, 2, 3, 4, 5], ticktext=["1星", "2星", "3星", "4星", "5星"]),
            height=380,
            margin=dict(l=40, r=20, t=60, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    def get_review_tags_chart(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        top_n: int = 15,
    ) -> go.Figure:
        """评价标签词云/条形图"""
        params = []
        sql = "SELECT tags, rating FROM reviews WHERE tags IS NOT NULL AND tags != ''"
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND service_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND service_date <= ?"
            params.append(date_to)

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无标签数据")
            return fig

        tag_counts: Dict[str, Dict[str, int]] = {}
        for row in df.iter_rows(named=True):
            raw_tags = row["tags"] or ""
            rating = int(row["rating"]) if row["rating"] else 5
            for sep in [",", "，", ";", "；", "、", "|"]:
                raw_tags = raw_tags.replace(sep, "|")
            for tag in raw_tags.split("|"):
                tag = tag.strip()
                if not tag or len(tag) > 10:
                    continue
                if tag not in tag_counts:
                    tag_counts[tag] = {"positive": 0, "negative": 0, "total": 0}
                tag_counts[tag]["total"] += 1
                if rating >= 4:
                    tag_counts[tag]["positive"] += 1
                else:
                    tag_counts[tag]["negative"] += 1

        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1]["total"], reverse=True)[:top_n]
        if not sorted_tags:
            fig = go.Figure()
            fig.update_layout(title="暂无有效标签")
            return fig

        tags = [t[0] for t in sorted_tags]
        positives = [t[1]["positive"] for t in sorted_tags]
        negatives = [t[1]["negative"] for t in sorted_tags]

        fig = go.Figure()
        fig.add_trace(go.Bar(
            y=tags,
            x=positives,
            name="好评提及",
            orientation="h",
            marker_color=self.COLORS["success"],
        ))
        fig.add_trace(go.Bar(
            y=tags,
            x=negatives,
            name="差评提及",
            orientation="h",
            marker_color=self.COLORS["danger"],
        ))
        fig.update_layout(
            title=dict(text="评价关键词 TOP %d" % top_n, font=dict(size=16)),
            barmode="stack",
            xaxis_title="提及次数",
            yaxis=dict(autorange="reversed"),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            height=380,
            margin=dict(l=80, r=20, t=60, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    def get_review_delay_timeline(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> go.Figure:
        """点评延迟标注时间轴"""
        params = []
        sql = """
            SELECT service_date, review_submit_date, sync_date, delay_hours, rating, review_id
            FROM reviews
            WHERE delay_hours > 0
        """
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND service_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND service_date <= ?"
            params.append(date_to)
        sql += " ORDER BY service_date DESC LIMIT 200"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无延迟点评记录")
            return fig

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=df["service_date"].to_list(),
            y=df["delay_hours"].to_list(),
            mode="markers",
            marker=dict(
                size=10,
                color=df["rating"].to_list(),
                colorscale=[
                    (0.0, self.COLORS["danger"]),
                    (0.5, self.COLORS["warning"]),
                    (1.0, self.COLORS["success"]),
                ],
                cmin=1, cmax=5,
                showscale=True,
                colorbar=dict(title="评分", tickvals=[1, 2, 3, 4, 5]),
            ),
            text=[
                f"延迟{h:.1f}h<br>评分:{r}星"
                for h, r in zip(df["delay_hours"].to_list(), df["rating"].to_list())
            ],
            hoverinfo="text+x",
            name="延迟点评",
        ))

        threshold = self.risk_engine.thresholds.review_delay_hours
        fig.add_hline(
            y=threshold,
            line_dash="dash",
            line_color=self.COLORS["warning"],
            annotation_text=f"阈值: {threshold}小时",
            annotation_position="bottom right",
        )

        fig.update_layout(
            title=dict(text="点评延迟分布（颜色=评分）", font=dict(size=16)),
            xaxis_title="服务日期",
            yaxis_title="延迟时长（小时）",
            height=380,
            margin=dict(l=40, r=20, t=60, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    # ========== 项目卡项图表 ==========

    def get_course_consumption_chart(
        self,
        store_id: Optional[str] = None,
        top_n: int = 10,
    ) -> go.Figure:
        """项目卡项消课率对比图"""
        sql = """
            SELECT course_name,
                   SUM(total_sessions) as total,
                   SUM(used_sessions) as used,
                   SUM(remaining_sessions) as remaining
            FROM course_items
        """
        params = []
        if store_id:
            sql += " WHERE store_id = ?"
            params.append(store_id)
        sql += " GROUP BY course_name ORDER BY total DESC"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无卡项数据")
            return fig

        df = df.head(top_n).with_columns([
            pl.when(pl.col("total") > 0)
            .then((pl.col("used") / pl.col("total") * 100).round(1))
            .otherwise(0.0)
            .alias("rate"),
        ])

        fig = go.Figure()
        fig.add_trace(go.Bar(
            y=df["course_name"].to_list(),
            x=df["used"].to_list(),
            name="已用次数",
            orientation="h",
            marker_color=self.COLORS["primary"],
        ))
        fig.add_trace(go.Bar(
            y=df["course_name"].to_list(),
            x=df["remaining"].to_list(),
            name="剩余次数",
            orientation="h",
            marker_color=self.COLORS["warning"],
        ))

        threshold = self.risk_engine.thresholds.low_course_consumption_rate * 100
        fig.add_vline(
            x=0,
            line_dash="dash",
            line_color="gray",
        )

        fig.update_layout(
            title=dict(text=f"项目卡项消课对比 TOP {top_n}", font=dict(size=16)),
            barmode="stack",
            xaxis_title="次数",
            yaxis=dict(autorange="reversed"),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            height=380,
            margin=dict(l=140, r=20, t=60, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    def get_course_consumption_rate_gauge(
        self,
        store_id: Optional[str] = None,
    ) -> go.Figure:
        """整体消课率仪表盘"""
        sql = """
            SELECT SUM(total_sessions) as total, SUM(used_sessions) as used
            FROM course_items
        """
        params = []
        if store_id:
            sql += " WHERE store_id = ?"
            params.append(store_id)
        df = duckdb_manager.query(sql, params)

        total = int(df["total"][0]) if df.height > 0 and df["total"][0] else 0
        used = int(df["used"][0]) if df.height > 0 and df["used"][0] else 0
        rate = (used / total * 100) if total > 0 else 0.0
        threshold = self.risk_engine.thresholds.low_course_consumption_rate * 100

        if rate >= threshold * 1.5:
            color = self.COLORS["success"]
        elif rate >= threshold:
            color = self.COLORS["warning"]
        else:
            color = self.COLORS["danger"]

        fig = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=rate,
            domain={"x": [0, 1], "y": [0, 1]},
            number={"suffix": "%", "font": {"size": 40}},
            delta={"reference": threshold, "increasing": {"color": color}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1, "tickcolor": "darkblue"},
                "bar": {"color": color},
                "steps": [
                    {"range": [0, threshold], "color": "rgba(239,68,68,0.15)"},
                    {"range": [threshold, threshold * 1.5], "color": "rgba(245,158,11,0.15)"},
                    {"range": [threshold * 1.5, 100], "color": "rgba(16,185,129,0.15)"},
                ],
                "threshold": {
                    "line": {"color": self.COLORS["warning"], "width": 3},
                    "thickness": 0.8,
                    "value": threshold,
                },
            },
            title={"text": f"整体消课率<br><span style='font-size:0.8em;color:gray'>阈值: {threshold:.0f}%</span>"},
        ))
        fig.update_layout(
            height=300,
            margin=dict(l=20, r=20, t=30, b=20),
            paper_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    # ========== 耗材异常图表 ==========

    def get_material_abnormality_chart(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        top_n: int = 10,
    ) -> go.Figure:
        """耗材异常用量排名图"""
        params = []
        sql = """
            SELECT material_name,
                   COUNT(*) as usage_count,
                   SUM(CASE WHEN is_abnormal THEN 1 ELSE 0 END) as abnormal_count,
                   AVG(CASE WHEN usage_ratio IS NOT NULL THEN usage_ratio
                        ELSE usage_quantity / NULLIF(standard_usage_quantity, 0) END) as avg_ratio
            FROM material_usage
            WHERE 1=1
        """
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND transaction_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND transaction_date <= ?"
            params.append(date_to)
        sql += " GROUP BY material_name HAVING abnormal_count > 0 ORDER BY abnormal_count DESC"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无耗材异常数据")
            return fig

        df = df.head(top_n)

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=df["material_name"].to_list(),
            y=df["abnormal_count"].to_list(),
            text=[f"{r:.1f}x" for r in df["avg_ratio"].to_list()],
            textposition="outside",
            marker_color=[
                self.COLORS["danger"] if c >= 5 else self.COLORS["warning"]
                for c in df["abnormal_count"].to_list()
            ],
            name="异常次数",
        ))
        fig.update_layout(
            title=dict(text=f"耗材异常排名 TOP {top_n}（标注=平均超标倍数）", font=dict(size=16)),
            xaxis_title="耗材名称",
            xaxis_tickangle=-30,
            yaxis_title="异常次数",
            height=380,
            margin=dict(l=40, r=20, t=60, b=80),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    # ========== 预警汇总图表 ==========

    def get_alert_summary_chart(self, store_id: Optional[str] = None) -> go.Figure:
        """预警类型汇总图"""
        sql = "SELECT alert_type, alert_level, COUNT(*) as cnt FROM risk_alerts WHERE 1=1"
        params = []
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        sql += " GROUP BY alert_type, alert_level"

        df = duckdb_manager.query(sql, params)
        if df.height == 0:
            fig = go.Figure()
            fig.update_layout(title="暂无预警数据")
            return fig

        type_map = {
            "MATERIAL_ABNORMAL": "耗材异常",
            "LOW_CONSUMPTION_RATE": "消课率低",
            "OVERDUE_VISIT": "逾期未回访",
            "NEGATIVE_REVIEW_RATIO": "差评率高",
            "HIGH_NEGATIVE_REVIEW": "严重差评",
        }
        df = df.with_columns(pl.col("alert_type").replace(type_map).alias("type_cn"))

        fig = px.bar(
            df.to_pandas(),
            x="type_cn",
            y="cnt",
            color="alert_level",
            color_discrete_map={
                "HIGH": self.COLORS["danger"],
                "MEDIUM": self.COLORS["warning"],
                "LOW": self.COLORS["info"],
            },
            barmode="stack",
            text_auto=True,
        )
        fig.update_layout(
            title=dict(text="预警类型分布", font=dict(size=16)),
            xaxis_title="预警类型",
            yaxis_title="预警数量",
            legend_title="预警等级",
            height=380,
            margin=dict(l=40, r=20, t=60, b=40),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        return fig

    def get_core_metrics_cards(
        self,
        store_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> Dict[str, Any]:
        """获取核心指标卡片数据"""
        metrics = {
            "total_recharge": 0.0, "total_consumption": 0.0,
            "avg_rating": 0.0, "review_count": 0,
            "consumption_rate": 0.0, "pending_alerts": 0,
            "delayed_reviews": 0,
        }

        params = []
        sql = """
            SELECT
                SUM(CASE WHEN transaction_type = 'RECHARGE' THEN amount ELSE 0 END) as recharge,
                SUM(CASE WHEN transaction_type IN ('CONSUMPTION','PRODUCT') THEN amount ELSE 0 END) as consumption
            FROM cashier_transactions WHERE 1=1
        """
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND CAST(transaction_date AS DATE) >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND CAST(transaction_date AS DATE) <= ?"
            params.append(date_to)
        cash_df = duckdb_manager.query(sql, params)
        if cash_df.height > 0:
            metrics["total_recharge"] = float(cash_df["recharge"][0] or 0)
            metrics["total_consumption"] = float(cash_df["consumption"][0] or 0)

        params2 = []
        sql2 = "SELECT AVG(rating) as avg_r, COUNT(*) as cnt, SUM(CASE WHEN is_delayed THEN 1 ELSE 0 END) as delayed FROM reviews WHERE rating IS NOT NULL"
        if store_id:
            sql2 += " AND store_id = ?"
            params2.append(store_id)
        if date_from:
            sql2 += " AND service_date >= ?"
            params2.append(date_from)
        if date_to:
            sql2 += " AND service_date <= ?"
            params2.append(date_to)
        review_df = duckdb_manager.query(sql2, params2)
        if review_df.height > 0:
            metrics["avg_rating"] = float(review_df["avg_r"][0] or 0)
            metrics["review_count"] = int(review_df["cnt"][0] or 0)
            metrics["delayed_reviews"] = int(review_df["delayed"][0] or 0)

        params3 = []
        sql3 = "SELECT SUM(total_sessions) as t, SUM(used_sessions) as u FROM course_items"
        if store_id:
            sql3 += " WHERE store_id = ?"
            params3.append(store_id)
        course_df = duckdb_manager.query(sql3, params3)
        if course_df.height > 0:
            t = course_df["t"][0] or 0
            u = course_df["u"][0] or 0
            metrics["consumption_rate"] = (u / t * 100) if t > 0 else 0.0

        params4 = []
        sql4 = "SELECT COUNT(*) as cnt FROM risk_alerts WHERE is_resolved = FALSE"
        if store_id:
            sql4 += " AND store_id = ?"
            params4.append(store_id)
        alert_df = duckdb_manager.query(sql4, params4)
        if alert_df.height > 0:
            metrics["pending_alerts"] = int(alert_df["cnt"][0] or 0)

        return metrics
