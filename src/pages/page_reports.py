import streamlit as st
import polars as pl
from datetime import datetime, timedelta
import plotly.graph_objects as go
import plotly.express as px

from src.utils.analyzer import risk_analyzer
from src.utils.ui_components import (
    render_delay_banner,
    plot_line_chart,
    plot_bar_chart,
    plot_funnel,
    styled_dataframe,
    render_metric_card,
)

from config.settings import REGIONS, DOC_TYPES


def _render_yoy_mom_card(title: str, current: float, previous: float,
                         suffix: str = "", is_good_when_up: bool = True):
    if previous > 0:
        change_rate = (current - previous) / previous * 100
    else:
        change_rate = 100 if current > 0 else 0

    sign = "+" if change_rate >= 0 else ""
    delta = f"{sign}{round(change_rate, 2)}% 环比"
    delta_color = "normal" if (is_good_when_up and change_rate >= 0) or (not is_good_when_up and change_rate <= 0) else "inverse"

    st.metric(
        label=title,
        value=f"{round(current, 2)}{suffix}",
        delta=delta,
        delta_color=delta_color,
    )


def render_reports():
    st.title("📈 多维报表分析")
    st.caption("按内容转化、日期、区域多维度对比分析，支持同环比")

    date_range = st.session_state.get("date_range")
    if not date_range:
        default_end = datetime(2026, 6, 20)
        default_start = default_end - timedelta(days=30)
        date_range = (default_start, default_end)

    delay_info = risk_analyzer.get_sync_delay_info()
    render_delay_banner(delay_info)

    tab1, tab2, tab3, tab4 = st.tabs([
        "🎯 内容转化分析",
        "📅 日期趋势对比",
        "🌍 区域对比分析",
        "📆 发布排期同环比",
    ])

    with tab1:
        st.markdown("### 内容转化漏斗")
        st.caption("从提交到归档的全链路转化率分析")

        funnel = risk_analyzer.get_content_conversion_funnel(date_range)

        col_left, col_right = st.columns([1, 1])

        with col_left:
            plot_funnel(
                funnel,
                "stage",
                "count",
                title="文书转化漏斗",
            )

        with col_right:
            st.markdown("#### 转化详情")
            funnel_display = funnel.rename({
                "stage": "阶段",
                "count": "数量",
                "conversion_rate": "转化率(%)",
            })
            styled_dataframe(funnel_display, height=300)

            stage_rate = []
            stages = funnel.to_dicts()
            for i in range(1, len(stages)):
                prev = stages[i - 1]["count"]
                curr = stages[i]["count"]
                rate = round(curr / prev * 100, 2) if prev > 0 else 0
                stage_rate.append({
                    "阶段": f"{stages[i-1]['stage']}→{stages[i]['stage']}",
                    "留存率(%)": rate,
                })

            if stage_rate:
                st.markdown("#### 阶段留存率")
                rate_df = pl.DataFrame(stage_rate)
                styled_dataframe(rate_df, height=180)

        st.markdown("---")
        st.markdown("### 按文书类型的转化对比")

        doc_type_df = risk_analyzer.get_doc_type_comparison(date_range)
        if not doc_type_df.is_empty():
            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=doc_type_df["doc_type"].to_list(),
                y=doc_type_df["total_docs"].to_list(),
                name="提交数",
                marker_color="#3b82f6",
            ))
            fig.add_trace(go.Bar(
                x=doc_type_df["doc_type"].to_list(),
                y=doc_type_df["publish_count"].to_list(),
                name="发布数",
                marker_color="#22c55e",
            ))

            fig.update_layout(
                title="各文书类型提交 vs 发布对比",
                barmode="group",
                height=350,
                margin=dict(l=0, r=0, t=40, b=0),
            )
            st.plotly_chart(fig, use_container_width=True)

    with tab2:
        st.markdown("### 日期趋势对比")
        st.caption("支持日/周/月粒度的趋势分析与同环比")

        col1, col2 = st.columns(2)
        with col1:
            period = st.selectbox(
                "时间粒度",
                ["日", "周", "月"],
                index=0,
                key="date_period",
            )
        with col2:
            compare_type = st.selectbox(
                "对比方式",
                ["环比", "同比"],
                index=0,
                key="date_compare",
            )

        daily_trend = risk_analyzer.get_daily_trend(90)

        if period == "日":
            trend_df = daily_trend
            x_col = "date"
        elif period == "周":
            trend_df = daily_trend.with_columns(
                pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d")
                .dt.truncate("1w")
                .alias("week")
            ).group_by("week").agg(
                pl.sum("submit_count").alias("submit_count"),
                pl.sum("return_count").alias("return_count"),
                pl.sum("publish_count").alias("publish_count"),
                pl.sum("total_risk_words").alias("total_risk_words"),
            ).sort("week")
            x_col = "week"
        else:
            trend_df = daily_trend.with_columns(
                pl.col("date").str.strptime(pl.Date, format="%Y-%m-%d")
                .dt.truncate("1mo")
                .alias("month")
            ).group_by("month").agg(
                pl.sum("submit_count").alias("submit_count"),
                pl.sum("return_count").alias("return_count"),
                pl.sum("publish_count").alias("publish_count"),
                pl.sum("total_risk_words").alias("total_risk_words"),
            ).sort("month")
            x_col = "month"

        metrics = st.multiselect(
            "选择指标",
            ["提交数", "退回数", "发布数"],
            default=["提交数", "退回数", "发布数"],
            key="report_trend_metrics",
        )

        metric_map = {
            "提交数": "submit_count",
            "退回数": "return_count",
            "发布数": "publish_count",
        }
        y_cols = [metric_map[m] for m in metrics if m in metric_map]

        plot_line_chart(
            trend_df,
            x_col,
            y_cols,
            title=f"按{period}度趋势",
            y_title="数量",
            delay_annotations=risk_analyzer.get_delay_annotations() or None,
        )

        st.markdown("#### 环比指标汇总")
        yoy_mom = risk_analyzer.get_review_yoy_mom(date_range[0], date_range[1])

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            _render_yoy_mom_card(
                "提交数环比",
                yoy_mom["total"].current_value,
                yoy_mom["total"].previous_value,
                " 份",
                is_good_when_up=True,
            )
        with col2:
            _render_yoy_mom_card(
                "退回数环比",
                yoy_mom["return_count"].current_value,
                yoy_mom["return_count"].previous_value,
                " 份",
                is_good_when_up=False,
            )
        with col3:
            _render_yoy_mom_card(
                "发布数环比",
                yoy_mom["publish_count"].current_value,
                yoy_mom["publish_count"].previous_value,
                " 份",
                is_good_when_up=True,
            )
        with col4:
            _render_yoy_mom_card(
                "高风险文书环比",
                yoy_mom["high_risk"].current_value,
                yoy_mom["high_risk"].previous_value,
                " 份",
                is_good_when_up=False,
            )

    with tab3:
        st.markdown("### 区域对比分析")
        st.caption("各区域的文书归档指标横向对比")

        region_df = risk_analyzer.get_region_comparison(date_range)

        if not region_df.is_empty():
            metric_to_show = st.selectbox(
                "选择对比指标",
                ["提交总数", "退回数", "退回率", "发布数", "发布率", "平均风险词数"],
                index=2,
                key="region_metric",
            )

            metric_map = {
                "提交总数": "total_docs",
                "退回数": "return_count",
                "退回率": "return_rate",
                "发布数": "publish_count",
                "发布率": "publish_rate",
                "平均风险词数": "avg_risk_words",
            }
            metric_col = metric_map[metric_to_show]

            fig = px.bar(
                region_df.to_pandas(),
                x="region",
                y=metric_col,
                color=metric_col,
                color_continuous_scale="RdYlGn_r" if "return" in metric_col or "risk" in metric_col else "RdYlGn",
                title=f"各区域{metric_to_show}对比",
            )
            fig.update_layout(
                height=350,
                margin=dict(l=0, r=0, t=40, b=0),
            )
            st.plotly_chart(fig, use_container_width=True)

            st.markdown("#### 区域详细数据")
            region_display = region_df.rename({
                "region": "区域",
                "total_docs": "提交总数",
                "return_count": "退回数",
                "return_rate": "退回率(%)",
                "publish_count": "发布数",
                "publish_rate": "发布率(%)",
                "avg_risk_words": "平均风险词数",
                "avg_review_rounds": "平均审核轮次",
            })
            styled_dataframe(region_display, height=300)

    with tab4:
        st.markdown("### 发布排期同环比")
        st.caption("审核意见与发布排期的同环比分析")

        schedule_df = risk_analyzer.get_publish_schedule_comparison(30)

        if not schedule_df.is_empty():
            col_left, col_right = st.columns([2, 1])

            with col_left:
                plot_line_chart(
                    schedule_df,
                    "date",
                    ["scheduled_count", "published_count"],
                    title="近30天发布排期 vs 实际发布",
                    y_title="数量",
                    delay_annotations=risk_analyzer.get_delay_annotations() or None,
                )

            with col_right:
                total_scheduled = schedule_df["scheduled_count"].sum()
                total_published = schedule_df["published_count"].sum()
                publish_rate = round(total_published / total_scheduled * 100, 2) if total_scheduled > 0 else 0

                st.markdown("#### 发布完成情况")
                st.metric("排期总数", f"{total_scheduled} 份")
                st.metric("实际发布", f"{total_published} 份")
                st.metric("发布完成率", f"{publish_rate}%")

            st.markdown("---")
            st.markdown("#### 审核意见同环比")

            review_yoy = risk_analyzer.get_review_yoy_mom(date_range[0], date_range[1])

            col1, col2, col3 = st.columns(3)

            with col1:
                st.markdown("**审核通过情况**")
                _render_yoy_mom_card(
                    "通过数",
                    review_yoy["publish_count"].current_value,
                    review_yoy["publish_count"].previous_value,
                    " 份",
                    is_good_when_up=True,
                )
                _render_yoy_mom_card(
                    "通过率",
                    review_yoy["publish_rate"].current_value,
                    review_yoy["publish_rate"].previous_value,
                    "%",
                    is_good_when_up=True,
                )

            with col2:
                st.markdown("**审核退回情况**")
                _render_yoy_mom_card(
                    "退回数",
                    review_yoy["return_count"].current_value,
                    review_yoy["return_count"].previous_value,
                    " 份",
                    is_good_when_up=False,
                )
                _render_yoy_mom_card(
                    "退回率",
                    review_yoy["return_rate"].current_value,
                    review_yoy["return_rate"].previous_value,
                    "%",
                    is_good_when_up=False,
                )

            with col3:
                st.markdown("**风险指标**")
                _render_yoy_mom_card(
                    "高风险文书",
                    review_yoy["high_risk"].current_value,
                    review_yoy["high_risk"].previous_value,
                    " 份",
                    is_good_when_up=False,
                )
                _render_yoy_mom_card(
                    "总提交量",
                    review_yoy["total"].current_value,
                    review_yoy["total"].previous_value,
                    " 份",
                    is_good_when_up=True,
                )

            st.info(
                "💡 **说明：** 环比数据基于上一相同长度周期计算。"
                "收款流水数据存在延迟时，近期发布相关指标可能不完整，请注意甄别。"
            )
        else:
            st.info("暂无发布排期数据")
