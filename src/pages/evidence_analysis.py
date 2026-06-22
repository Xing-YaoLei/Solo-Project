"""
证据附件和通报模板分析 - 支持同环比
"""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import polars as pl

from src.components.common import (
    get_common_filters, show_data_table, show_sync_trail,
    format_number, format_percent, get_growth_delta
)
from src.data.data_querier import DataQuerier
from src.utils.trend_analyzer import TrendAnalyzer


def show():
    st.title("📋 证据附件与通报模板分析")
    st.markdown("证据附件和通报模板支持同环比分析")

    filters = get_common_filters(key_prefix="evidence")

    tab1, tab2 = st.tabs(["📎 证据附件分析", "📄 通报模板分析"])

    with tab1:
        show_evidence_attachments(filters)

    with tab2:
        show_notification_templates(filters)


def show_evidence_attachments(filters: dict) -> None:
    st.subheader("📎 证据附件同环比分析")

    querier = DataQuerier()

    archive_df = querier.get_evidence_archive(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    attachments_df = querier.get_evidence_attachments()

    querier.close()

    if len(archive_df) > 0 and len(attachments_df) > 0:
        archive_with_attach = archive_df.join(
            attachments_df.group_by("archive_id").agg([
                pl.count().alias("attachment_count"),
                pl.col("file_size").sum().alias("total_file_size")
            ]),
            left_on="archive_id",
            right_on="archive_id",
            how="left"
        ).with_columns([
            pl.col("attachment_count").fill_null(0).alias("attachment_count"),
            pl.col("total_file_size").fill_null(0).alias("total_file_size")
        ])
    else:
        archive_with_attach = archive_df.with_columns([
            pl.lit(0).alias("attachment_count"),
            pl.lit(0).alias("total_file_size")
        ])

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_archives = len(archive_df)
        st.metric("证据归档总数", format_number(total_archives))

    with col2:
        total_attachments = len(attachments_df)
        st.metric("附件总数", format_number(total_attachments))

    with col3:
        archives_with_attach = archive_with_attach.filter(pl.col("attachment_count") > 0).height
        attach_rate = (archives_with_attach / total_archives * 100) if total_archives > 0 else 0
        st.metric("附件覆盖率", format_percent(attach_rate))

    with col4:
        total_size = attachments_df["file_size"].sum() if len(attachments_df) > 0 else 0
        st.metric("总存储量", format_file_size(total_size))

    st.divider()

    show_attachment_trend(archive_with_attach, attachments_df)

    st.divider()

    show_attachment_analysis(archive_with_attach, attachments_df)


def show_attachment_trend(archive_with_attach: pl.DataFrame, attachments_df: pl.DataFrame) -> None:
    st.markdown("### 📈 同环比趋势分析")

    col1, col2, col3 = st.columns(3)

    with col1:
        period = st.selectbox(
            "时间粒度",
            options=["日", "周", "月", "季"],
            index=2,
            key="attach_period"
        )
        period_map = {"日": "day", "周": "week", "月": "month", "季": "quarter"}

    with col2:
        compare_type = st.radio(
            "对比方式",
            options=["同比", "环比"],
            index=0,
            horizontal=True,
            key="attach_compare"
        )
        compare_map = {"同比": "yoy", "环比": "mom"}

    with col3:
        analysis_metric = st.selectbox(
            "分析指标",
            options=["附件数量", "归档数量", "平均附件数", "存储量"],
            index=0,
            key="attach_metric"
        )

    if len(archive_with_attach) > 0 and "archive_date" in archive_with_attach.columns:
        try:
            if analysis_metric == "附件数量":
                value_col = "attachment_count"
                agg_func = "sum"
                title = f"附件数量{compare_type}趋势"
            elif analysis_metric == "归档数量":
                value_col = "archive_id"
                agg_func = "count"
                title = f"归档数量{compare_type}趋势"
            elif analysis_metric == "平均附件数":
                value_col = "attachment_count"
                agg_func = "mean"
                title = f"平均每归档附件数{compare_type}趋势"
            else:
                value_col = "total_file_size"
                agg_func = "sum"
                title = f"存储量{compare_type}趋势"

            if agg_func == "count":
                trend_data = archive_with_attach.with_columns([
                    pl.col("archive_date").cast(pl.Datetime).alias("date_col")
                ])
                trend_df = TrendAnalyzer.calculate_period_over_period(
                    trend_data, "date_col", value_col,
                    period_map[period], compare_map[compare_type]
                )
            else:
                trend_data = archive_with_attach.with_columns([
                    pl.col("archive_date").cast(pl.Datetime).alias("date_col"),
                    pl.col(value_col).alias("metric_value")
                ])

                period_format = {"day": "%Y-%m-%d", "week": "%Y-%W", "month": "%Y-%m", "quarter": "%Y-Q%q"}
                grouped = trend_data.with_columns([
                    pl.col("date_col").dt.strftime(period_format[period_map[period]]).alias("period")
                ]).group_by("period").agg([
                    getattr(pl.col("metric_value"), agg_func)().alias("current_value"),
                    pl.col("date_col").min().alias("period_start")
                ]).sort("period")

                from dateutil.relativedelta import relativedelta
                if compare_map[compare_type] == "mom":
                    offset_map = {
                        "day": lambda d: d - relativedelta(days=1),
                        "week": lambda d: d - relativedelta(weeks=1),
                        "month": lambda d: d - relativedelta(months=1),
                        "quarter": lambda d: d - relativedelta(months=3)
                    }
                else:
                    offset_map = {
                        "day": lambda d: d - relativedelta(years=1),
                        "week": lambda d: d - relativedelta(years=1),
                        "month": lambda d: d - relativedelta(years=1),
                        "quarter": lambda d: d - relativedelta(years=1)
                    }

                offset_func = offset_map[period_map[period]]
                grouped = grouped.with_columns([
                    pl.col("period_start").map_elements(offset_func, return_dtype=pl.Datetime).alias("compare_period_start")
                ])

                compare_values = []
                for row in grouped.iter_rows(named=True):
                    compare_start = row["compare_period_start"]
                    if compare_start is None:
                        compare_values.append(None)
                        continue
                    compare_period = compare_start.strftime(period_format[period_map[period]])
                    compare_row = grouped.filter(pl.col("period") == compare_period)
                    compare_values.append(compare_row["current_value"][0] if len(compare_row) > 0 else None)

                trend_df = grouped.with_columns([
                    pl.Series("compare_value", compare_values)
                ]).with_columns([
                    ((pl.col("current_value") - pl.col("compare_value")) / pl.col("compare_value") * 100)
                    .round(2).alias("growth_rate"),
                    (pl.col("current_value") - pl.col("compare_value")).alias("absolute_change")
                ]).select([
                    "period", "period_start", "current_value", "compare_value", "growth_rate", "absolute_change"
                ])

            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=trend_df["period"].to_list(),
                y=trend_df["current_value"].to_list(),
                name="当期值",
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
                title=title,
                xaxis_title="时间",
                yaxis_title=analysis_metric,
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

            st.markdown("**同环比数据明细**")
            display_df = trend_df.clone()
            if analysis_metric == "存储量":
                display_df = display_df.with_columns([
                    pl.col("current_value").map_elements(lambda x: format_file_size(x) if x else "-", return_dtype=pl.Utf8).alias("当期值"),
                    pl.col("compare_value").map_elements(lambda x: format_file_size(x) if x else "-", return_dtype=pl.Utf8).alias(f"{compare_type}值"),
                ])
            show_data_table(display_df, height=300, key="attach_trend_table")

        except Exception as e:
            st.warning(f"趋势计算异常: {str(e)}")


def show_attachment_analysis(archive_with_attach: pl.DataFrame, attachments_df: pl.DataFrame) -> None:
    st.markdown("### 📊 附件类型分析")

    col1, col2 = st.columns(2)

    with col1:
        if len(attachments_df) > 0 and "file_type" in attachments_df.columns:
            type_stats = attachments_df.group_by("file_type").agg([
                pl.count().alias("数量"),
                pl.col("file_size").sum().alias("总大小")
            ]).sort("数量", descending=True)

            fig = px.pie(
                type_stats.to_pandas(),
                values="数量",
                names="file_type",
                title="附件类型分布",
                hole=0.4
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if len(attachments_df) > 0 and "archive_id" in attachments_df.columns:
            archive_type_stats = attachments_df.join(
                archive_with_attach.select(["archive_id", "evidence_type"]),
                on="archive_id",
                how="left"
            ).group_by("evidence_type").agg([
                pl.count().alias("附件数量")
            ]).sort("附件数量", descending=True)

            fig2 = px.bar(
                archive_type_stats.to_pandas(),
                x="evidence_type",
                y="附件数量",
                title="各证据类型附件数",
                color="evidence_type",
                text_auto=True
            )
            fig2.update_layout(height=450)
            st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### 📋 附件明细列表")
    if len(attachments_df) > 0:
        attach_detail = attachments_df.join(
            archive_with_attach.select(["archive_id", "title", "evidence_type", "region_name"]),
            on="archive_id",
            how="left"
        ).select([
            "attachment_id", "archive_id", "title", "evidence_type",
            "file_name", "file_type", "file_size", "region_name",
            "uploaded_by", "uploaded_at"
        ]).with_columns([
            pl.col("file_size").map_elements(format_file_size, return_dtype=pl.Utf8).alias("文件大小")
        ])
        show_data_table(attach_detail, height=400, key="attach_detail_table")


def show_notification_templates(filters: dict) -> None:
    st.subheader("📄 通报模板同环比分析")

    querier = DataQuerier()

    templates_df = querier.get_notification_templates(
        region_id=filters.get("region_id")
    )

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

    querier.close()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("模板总数", format_number(len(templates_df)))

    with col2:
        template_types = templates_df["template_type"].n_unique() if len(templates_df) > 0 else 0
        st.metric("模板类型数", format_number(template_types))

    with col3:
        active_templates = templates_df["template_name"].n_unique() if len(templates_df) > 0 else 0
        st.metric("活跃模板数", format_number(active_templates))

    with col4:
        regions = templates_df["region_id"].n_unique() if len(templates_df) > 0 else 0
        st.metric("覆盖区域数", format_number(regions))

    st.divider()

    show_template_trend(templates_df, issue_df, filters)

    st.divider()

    show_template_analysis(templates_df)


def show_template_trend(templates_df: pl.DataFrame, issue_df: pl.DataFrame, filters: dict) -> None:
    st.markdown("### 📈 模板使用同环比分析")

    col1, col2 = st.columns(2)

    with col1:
        period = st.selectbox(
            "时间粒度",
            options=["日", "周", "月", "季"],
            index=2,
            key="template_period"
        )
        period_map = {"日": "day", "周": "week", "月": "month", "季": "quarter"}

    with col2:
        compare_type = st.radio(
            "对比方式",
            options=["同比", "环比"],
            index=0,
            horizontal=True,
            key="template_compare"
        )
        compare_map = {"同比": "yoy", "环比": "mom"}

    template_usage = templates_df.with_columns([
        pl.col("created_at").cast(pl.Datetime).alias("date_col")
    ])

    if len(template_usage) > 0 and "date_col" in template_usage.columns:
        try:
            trend_df = TrendAnalyzer.calculate_period_over_period(
                template_usage, "date_col", "template_id",
                period_map[period], compare_map[compare_type]
            )

            fig = go.Figure()

            fig.add_trace(go.Bar(
                x=trend_df["period"].to_list(),
                y=trend_df["current_value"].to_list(),
                name="当期新增模板数",
                marker_color="#9467bd"
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
                title=f"通报模板新增{compare_type}趋势",
                xaxis_title="时间",
                yaxis_title="新增模板数",
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

            st.markdown("**同环比数据明细**")
            show_data_table(trend_df, height=300, key="template_trend_table")

        except Exception as e:
            st.warning(f"趋势计算异常: {str(e)}")


def show_template_analysis(templates_df: pl.DataFrame) -> None:
    st.markdown("### 📊 模板类型分析")

    col1, col2 = st.columns(2)

    with col1:
        if len(templates_df) > 0 and "template_type" in templates_df.columns:
            type_stats = templates_df.group_by("template_type").agg([
                pl.count().alias("数量"),
                pl.col("template_name").n_unique().alias("模板名称数")
            ]).sort("数量", descending=True)

            fig = px.bar(
                type_stats.to_pandas(),
                x="template_type",
                y=["数量", "模板名称数"],
                title="模板类型分布",
                barmode="group",
                text_auto=True
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if len(templates_df) > 0 and "version" in templates_df.columns:
            version_stats = templates_df.group_by("template_name").agg([
                pl.count().alias("版本数"),
                pl.col("version").max().alias("最新版本"),
                pl.col("created_at").max().alias("最后更新时间")
            ]).sort("版本数", descending=True).head(10)

            fig2 = px.bar(
                version_stats.to_pandas(),
                x="template_name",
                y="版本数",
                title="模板版本迭代排行",
                color="版本数",
                color_continuous_scale="Purples",
                text_auto=True
            )
            fig2.update_layout(height=450, xaxis_tickangle=-45)
            st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### 📋 模板明细列表")
    if len(templates_df) > 0:
        show_data_table(
            templates_df.select([
                "template_id", "template_name", "template_type", "version",
                "subject", "region_name", "created_by", "created_at", "updated_at"
            ]),
            height=400,
            key="template_detail_table"
        )


def format_file_size(size_bytes: float) -> str:
    if size_bytes is None or size_bytes == 0:
        return "0 B"
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"


import math
