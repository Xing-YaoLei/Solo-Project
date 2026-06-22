"""
趋势总览看板 - 展示证据归档变化趋势
按问题复发、日期和区域比较
"""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import polars as pl

from src.components.common import (
    get_common_filters, show_kpi_cards, show_data_table,
    format_number, format_percent, get_growth_delta
)
from src.data.data_querier import DataQuerier
from src.utils.trend_analyzer import TrendAnalyzer


def show():
    st.title("📈 证据归档趋势总览")
    st.markdown("观察合规审计证据归档的变化趋势，按问题复发、日期和区域比较")

    filters = get_common_filters(key_prefix="dashboard")

    querier = DataQuerier()

    archive_df = querier.get_evidence_archive(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    issue_df = querier.get_issue_records(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    permission_df = querier.get_permission_logs(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    querier.close()

    show_summary_kpis(archive_df, issue_df, permission_df)

    tab1, tab2, tab3 = st.tabs(["📅 日期趋势", "🌍 区域比较", "🔄 问题复发分析"])

    with tab1:
        show_date_trend(archive_df, issue_df, permission_df)

    with tab2:
        show_region_comparison(archive_df, issue_df, permission_df)

    with tab3:
        show_reoccurrence_analysis(issue_df)


def show_summary_kpis(archive_df: pl.DataFrame, issue_df: pl.DataFrame,
                      permission_df: pl.DataFrame) -> None:
    st.subheader("📊 核心指标概览")

    total_archive = len(archive_df)
    total_issues = len(issue_df)
    violation_count = permission_df.filter(pl.col("is_violation") == True).height if "is_violation" in permission_df.columns else 0
    reoccurrence_count = issue_df.filter(pl.col("is_reoccurrence") == True).height if "is_reoccurrence" in issue_df.columns else 0

    archive_yoy = None
    if len(archive_df) > 0 and "archive_date" in archive_df.columns:
        try:
            yoy_df = TrendAnalyzer.calculate_yoy(archive_df, "archive_date", "archive_id", "month")
            if len(yoy_df) > 0:
                latest = yoy_df.sort("period", descending=True)[0]
                archive_yoy = latest["growth_rate"]
        except Exception:
            pass

    kpis = [
        {
            "label": "证据归档总数",
            "value": format_number(total_archive),
            "delta": f"{archive_yoy:.2f}%" if archive_yoy is not None else None,
            "delta_color": "normal" if (archive_yoy is None or archive_yoy < 0) else "inverse"
        },
        {
            "label": "问题记录总数",
            "value": format_number(total_issues),
            "delta": None
        },
        {
            "label": "权限越权次数",
            "value": format_number(violation_count),
            "delta": None
        },
        {
            "label": "问题复发数",
            "value": format_number(reoccurrence_count),
            "delta": f"{(reoccurrence_count/total_issues*100):.2f}%" if total_issues > 0 else None,
            "delta_color": "inverse"
        }
    ]

    show_kpi_cards(kpis)
    st.divider()


def show_date_trend(archive_df: pl.DataFrame, issue_df: pl.DataFrame,
                   permission_df: pl.DataFrame) -> None:
    st.subheader("📅 日期趋势分析")

    col1, col2 = st.columns(2)

    with col1:
        period = st.selectbox(
            "时间粒度",
            options=["日", "周", "月", "季"],
            index=2,
            key="trend_period"
        )
        period_map = {"日": "day", "周": "week", "月": "month", "季": "quarter"}

    with col2:
        compare_type = st.radio(
            "对比方式",
            options=["同比", "环比"],
            index=0,
            horizontal=True,
            key="trend_compare"
        )
        compare_map = {"同比": "yoy", "环比": "mom"}

    if len(archive_df) > 0 and "archive_date" in archive_df.columns:
        try:
            trend_df = TrendAnalyzer.calculate_period_over_period(
                archive_df, "archive_date", "archive_id",
                period_map[period], compare_map[compare_type]
            )

            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=trend_df["period"].to_list(),
                y=trend_df["current_value"].to_list(),
                name="当期归档数",
                marker_color="#1f77b4"
            ))

            if "compare_value" in trend_df.columns:
                fig.add_trace(go.Scatter(
                    x=trend_df["period"].to_list(),
                    y=trend_df["compare_value"].to_list(),
                    name=f"{compare_type}值",
                    mode="lines+markers",
                    line=dict(color="#ff7f0e", width=2),
                    yaxis="y1"
                ))

            if "growth_rate" in trend_df.columns:
                fig.add_trace(go.Scatter(
                    x=trend_df["period"].to_list(),
                    y=trend_df["growth_rate"].to_list(),
                    name=f"{compare_type}增长率(%)",
                    mode="lines+markers",
                    line=dict(color="#2ca02c", width=2, dash="dash"),
                    yaxis="y2"
                ))

            fig.update_layout(
                title=f"证据归档{compare_type}趋势",
                xaxis_title="时间",
                yaxis_title="归档数量",
                yaxis2=dict(
                    title="增长率(%)",
                    overlaying="y",
                    side="right",
                    gridcolor="lightgrey"
                ),
                barmode="group",
                hovermode="x unified",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                height=500
            )

            st.plotly_chart(fig, use_container_width=True)

            st.markdown("**趋势数据明细**")
            show_data_table(trend_df, height=300, key="trend_table")

        except Exception as e:
            st.warning(f"趋势计算异常: {str(e)}")

    col3, col4 = st.columns(2)

    with col3:
        if len(issue_df) > 0 and "found_date" in issue_df.columns:
            issue_trend = issue_df.with_columns([
                pl.col("found_date").cast(pl.Datetime).dt.strftime("%Y-%m").alias("month")
            ]).group_by("month").agg([
                pl.count().alias("问题数量")
            ]).sort("month")

            fig2 = px.line(
                issue_trend.to_pandas(),
                x="month",
                y="问题数量",
                title="问题发现趋势",
                markers=True
            )
            fig2.update_traces(line_color="#d62728")
            st.plotly_chart(fig2, use_container_width=True)

    with col4:
        if len(permission_df) > 0 and "operation_time" in permission_df.columns:
            violation_trend = permission_df.filter(
                pl.col("is_violation") == True
            ).with_columns([
                pl.col("operation_time").cast(pl.Datetime).dt.strftime("%Y-%m").alias("month")
            ]).group_by("month").agg([
                pl.count().alias("越权次数")
            ]).sort("month")

            fig3 = px.bar(
                violation_trend.to_pandas(),
                x="month",
                y="越权次数",
                title="权限越权趋势",
                color="越权次数",
                color_continuous_scale="Reds"
            )
            st.plotly_chart(fig3, use_container_width=True)


def show_region_comparison(archive_df: pl.DataFrame, issue_df: pl.DataFrame,
                          permission_df: pl.DataFrame) -> None:
    st.subheader("🌍 区域比较分析")

    col1, col2 = st.columns(2)

    with col1:
        compare_metric = st.selectbox(
            "比较指标",
            options=["证据归档数", "问题数", "越权次数", "复发率"],
            index=0,
            key="region_metric"
        )

    with col2:
        top_n = st.slider("显示区域数量", min_value=5, max_value=20, value=10, key="region_top_n")

    if compare_metric == "证据归档数" and len(archive_df) > 0 and "region_name" in archive_df.columns:
        region_data = TrendAnalyzer.group_by_region(archive_df, "archive_id")
        y_col = "total"
        title = "各区域证据归档数对比"
        color_scale = "Blues"

    elif compare_metric == "问题数" and len(issue_df) > 0 and "region_name" in issue_df.columns:
        region_data = TrendAnalyzer.group_by_region(issue_df, "issue_id")
        y_col = "total"
        title = "各区域问题数对比"
        color_scale = "Oranges"

    elif compare_metric == "越权次数" and len(permission_df) > 0 and "region_name" in permission_df.columns:
        violation_df = permission_df.filter(pl.col("is_violation") == True)
        region_data = TrendAnalyzer.group_by_region(violation_df, "log_id")
        y_col = "total"
        title = "各区域越权次数对比"
        color_scale = "Reds"

    elif compare_metric == "复发率" and len(issue_df) > 0 and "region_name" in issue_df.columns:
        region_data = issue_df.group_by("region_name").agg([
            pl.count().alias("total_issues"),
            (pl.col("is_reoccurrence") == True).sum().alias("reoccurred"),
            ((pl.col("is_reoccurrence") == True).sum() / pl.count() * 100).round(2).alias("reoccurrence_rate")
        ]).sort("reoccurrence_rate", descending=True).head(top_n)
        y_col = "reoccurrence_rate"
        title = "各区域问题复发率对比(%)"
        color_scale = "reds"
    else:
        st.info("暂无数据")
        return

    region_data = region_data.head(top_n)

    fig = px.bar(
        region_data.to_pandas(),
        x="region_name",
        y=y_col,
        title=title,
        color=y_col,
        color_continuous_scale=color_scale,
        text_auto=True
    )
    fig.update_layout(xaxis_title="区域", yaxis_title="数量", height=500)
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("**区域数据明细**")
    show_data_table(region_data, height=300, key="region_table")

    if len(archive_df) > 0 and "archive_date" in archive_df.columns:
        st.markdown("**区域趋势对比**")
        region_period_df = TrendAnalyzer.group_by_region_and_period(
            archive_df, "archive_date", "archive_id", "region_name", "month"
        )

        fig_line = px.line(
            region_period_df.to_pandas(),
            x="period",
            y="total",
            color="region_name",
            title="各区域证据归档月度趋势",
            markers=True
        )
        fig_line.update_layout(height=500)
        st.plotly_chart(fig_line, use_container_width=True)


def show_reoccurrence_analysis(issue_df: pl.DataFrame) -> None:
    st.subheader("🔄 问题复发分析")

    if len(issue_df) == 0 or "is_reoccurrence" not in issue_df.columns:
        st.info("暂无问题复发数据")
        return

    reoccurrence_stats = TrendAnalyzer.calculate_reoccurrence_rate(issue_df)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "总问题数",
            format_number(reoccurrence_stats["total_issues"]),
        )

    with col2:
        st.metric(
            "复发问题数",
            format_number(reoccurrence_stats["reoccurred_issues"]),
        )

    with col3:
        st.metric(
            "复发率",
            format_percent(reoccurrence_stats["reoccurrence_rate"]),
            delta_color="inverse"
        )

    st.divider()

    col4, col5 = st.columns(2)

    with col4:
        severity_df = pl.DataFrame(reoccurrence_stats["by_severity"])
        if len(severity_df) > 0:
            fig = px.bar(
                severity_df.to_pandas(),
                x="severity",
                y=["total", "reoccurred"],
                title="各严重级别问题复发情况",
                barmode="group",
                color_discrete_map={"total": "#1f77b4", "reoccurred": "#d62728"}
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    with col5:
        reoccurrence_df = issue_df.filter(pl.col("is_reoccurrence") == True)
        if len(reoccurrence_df) > 0 and "found_date" in reoccurrence_df.columns:
            reoccur_trend = reoccurrence_df.with_columns([
                pl.col("found_date").cast(pl.Datetime).dt.strftime("%Y-%m").alias("month")
            ]).group_by("month").agg([
                pl.count().alias("复发数量"),
                pl.col("recurrence_count").sum().alias("累计复发次数")
            ]).sort("month")

            fig2 = go.Figure()
            fig2.add_trace(go.Bar(
                x=reoccur_trend["month"].to_list(),
                y=reoccur_trend["复发数量"].to_list(),
                name="月度复发数",
                marker_color="#d62728"
            ))
            fig2.add_trace(go.Scatter(
                x=reoccur_trend["month"].to_list(),
                y=reoccur_trend["累计复发次数"].to_list(),
                name="累计复发次数",
                mode="lines+markers",
                line=dict(color="#ff7f0e", width=2),
                yaxis="y2"
            ))
            fig2.update_layout(
                title="问题复发趋势",
                yaxis2=dict(title="累计次数", overlaying="y", side="right"),
                height=400
            )
            st.plotly_chart(fig2, use_container_width=True)

    st.markdown("**复发问题清单**")
    reoccur_detail = issue_df.filter(pl.col("is_reoccurrence") == True).select([
        "issue_no", "title", "severity", "status", "region_name",
        "found_date", "handler", "recurrence_count", "original_issue_id"
    ])
    show_data_table(reoccur_detail, height=400, key="reoccurrence_table")
