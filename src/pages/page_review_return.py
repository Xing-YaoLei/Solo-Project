import streamlit as st
import polars as pl
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go

from src.utils.analyzer import risk_analyzer
from src.utils.ui_components import (
    render_delay_banner,
    plot_line_chart,
    plot_bar_chart,
    styled_dataframe,
    render_metric_card,
)

from config.settings import REGIONS, DOC_TYPES


def render_review_return():
    st.title("📋 审核退回追踪")
    st.caption("从宏观趋势下钻到具体样本，追踪审核退回全链路")

    date_range = st.session_state.get("date_range")
    if not date_range:
        default_end = datetime(2026, 6, 20)
        default_start = default_end - timedelta(days=30)
        date_range = (default_start, default_end)

    delay_info = risk_analyzer.get_sync_delay_info()
    render_delay_banner(delay_info)

    st.markdown("### 🔍 筛选条件")

    col1, col2, col3 = st.columns(3)
    with col1:
        selected_region = st.selectbox(
            "选择区域",
            ["全部"] + REGIONS,
            index=0,
            key="return_region_filter",
        )
    with col2:
        selected_doc_type = st.selectbox(
            "文书类型",
            ["全部"] + DOC_TYPES,
            index=0,
            key="return_doctype_filter",
        )
    with col3:
        view_mode = st.radio(
            "查看维度",
            ["按区域", "按文书类型", "按律师"],
            horizontal=True,
        )

    st.markdown("---")

    overview = risk_analyzer.get_overview_stats(date_range)
    yoy_mom = risk_analyzer.get_review_yoy_mom(date_range[0], date_range[1])

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        render_metric_card(
            "退回文书数",
            overview.get("returned_count", 0),
            " 份",
            yoy_result=yoy_mom.get("return_count"),
            help_text="选定时间段内审核退回的文书数量",
        )
    with col2:
        render_metric_card(
            "退回率",
            overview.get("return_rate", 0),
            "%",
            yoy_result=yoy_mom.get("return_rate"),
            help_text="退回文书占提交总数的比例",
        )
    with col3:
        render_metric_card(
            "高风险文书",
            overview.get("high_risk_count", 0),
            " 份",
            yoy_result=yoy_mom.get("high_risk"),
            help_text="风险词命中超过阈值的文书数",
        )
    with col4:
        render_metric_card(
            "平均审核轮次",
            overview.get("avg_review_rounds", 0),
            " 轮",
            help_text="每份文书平均需要几轮审核",
        )

    st.markdown("---")

    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.markdown("### 📈 退回趋势")
        daily_trend = risk_analyzer.get_daily_trend(30)
        delay_annotations = risk_analyzer.get_delay_annotations()
        plot_line_chart(
            daily_trend,
            "date",
            ["return_count", "submit_count"],
            title="近30天退回趋势",
            y_title="数量",
            delay_annotations=delay_annotations if delay_annotations else None,
        )

    with col_right:
        st.markdown("### ⚠️ 风险词分布")
        risk_words_df = risk_analyzer.get_risk_word_distribution(date_range)
        if not risk_words_df.is_empty():
            fig = px.bar(
                risk_words_df.head(10).to_pandas(),
                x="count",
                y="word",
                orientation="h",
                title="Top 10 风险词",
                color="count",
                color_continuous_scale="Reds",
            )
            fig.update_layout(
                margin=dict(l=0, r=0, t=40, b=0),
                height=300,
                showlegend=False,
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无风险词数据")

    st.markdown("---")

    st.markdown("### 📊 退回分布分析")

    if view_mode == "按区域":
        region_df = risk_analyzer.get_region_comparison(date_range)
        plot_bar_chart(
            region_df,
            "region",
            "return_rate",
            title="各区域退回率",
        )

        st.markdown("#### 📋 区域详细数据")

        region_display = region_df.select([
            "region", "total_docs", "return_count", "return_rate",
            "avg_risk_words", "avg_review_rounds"
        ])
        region_display = region_display.rename({
            "region": "区域",
            "total_docs": "提交总数",
            "return_count": "退回数",
            "return_rate": "退回率(%)",
            "avg_risk_words": "平均风险词数",
            "avg_review_rounds": "平均审核轮次",
        })
        styled_dataframe(region_display, height=250)

    elif view_mode == "按文书类型":
        doc_type_df = risk_analyzer.get_doc_type_comparison(date_range)
        plot_bar_chart(
            doc_type_df,
            "doc_type",
            "return_rate",
            title="各文书类型退回率",
        )

        st.markdown("#### 📋 文书类型详细数据")
        type_display = doc_type_df.select([
            "doc_type", "total_docs", "return_count", "return_rate",
            "avg_risk_words"
        ])
        type_display = type_display.rename({
            "doc_type": "文书类型",
            "total_docs": "提交总数",
            "return_count": "退回数",
            "return_rate": "退回率(%)",
            "avg_risk_words": "平均风险词数",
        })
        styled_dataframe(type_display, height=250)

    else:
        case_docs = risk_analyzer.loader.get_table("case_docs")
        if case_docs is not None:
            lawyer_df = case_docs.group_by("lawyer").agg(
                pl.len().alias("total_docs"),
                pl.when(pl.col("status") == "已退回").then(1).otherwise(0).sum().alias("return_count"),
                pl.mean("risk_word_count").alias("avg_risk_words"),
            ).with_columns(
                (pl.col("return_count") / pl.col("total_docs") * 100).round(2).alias("return_rate")
            ).sort("return_count", descending=True).head(20)

            plot_bar_chart(
                lawyer_df,
                "lawyer",
                "return_count",
                title="律师退回文书数 Top 20",
            )

            st.markdown("#### 📋 律师详细数据")
            lawyer_display = lawyer_df.select([
                "lawyer", "total_docs", "return_count", "return_rate", "avg_risk_words"
            ])
            lawyer_display = lawyer_display.rename({
                "lawyer": "律师",
                "total_docs": "提交总数",
                "return_count": "退回数",
                "return_rate": "退回率(%)",
                "avg_risk_words": "平均风险词数",
            })
            styled_dataframe(lawyer_display, height=300)

    st.markdown("---")
    st.markdown("### 📝 退回样本明细")
    st.caption("点击表格中的文书可下钻查看互动记录明细")

    region_param = None if selected_region == "全部" else selected_region
    doctype_param = None if selected_doc_type == "全部" else selected_doc_type

    samples = risk_analyzer.get_returned_samples(
        region=region_param,
        doc_type=doctype_param,
        limit=50,
    )

    if not samples.is_empty():
        display_cols = [
            "case_id", "doc_id", "doc_type", "region",
            "lawyer", "risk_word_count", "risk_words",
            "return_count", "review_date", "comments"
        ]
        available_cols = [c for c in display_cols if c in samples.columns]

        display_df = samples.select(available_cols)
        display_df = display_df.rename({
            "case_id": "案件编号",
            "doc_id": "文书编号",
            "doc_type": "文书类型",
            "region": "区域",
            "lawyer": "律师",
            "risk_word_count": "风险词数",
            "risk_words": "命中风险词",
            "return_count": "退回次数",
            "review_date": "最后审核日期",
            "comments": "审核意见摘要",
        })

        event = st.dataframe(
            display_df.to_pandas(),
            use_container_width=True,
            height=400,
            hide_index=True,
            on_select="rerun",
            selection_mode="single-row",
        )

        selected_rows = event.selection.get("rows", [])
        if selected_rows:
            selected_idx = selected_rows[0]
            selected_row = samples.row(selected_idx, named=True)

            st.markdown("---")
            st.markdown(f"### 📄 文书详情 - {selected_row['doc_id']}")

            col1, col2, col3 = st.columns(3)
            with col1:
                st.info(f"**案件编号**：{selected_row['case_id']}")
                st.info(f"**文书类型**：{selected_row['doc_type']}")
            with col2:
                st.info(f"**所属区域**：{selected_row['region']}")
                st.info(f"**负责律师**：{selected_row['lawyer']}")
            with col3:
                st.warning(f"**退回次数**：{selected_row['return_count']} 次")
                st.warning(f"**风险词数**：{selected_row['risk_word_count']} 个")

            st.markdown("#### 🔤 命中风险词")
            risk_words_list = selected_row['risk_words'].split(',') if selected_row['risk_words'] else []
            if risk_words_list:
                display_words = risk_words_list[:8]
                word_cols = st.columns(len(display_words))
                for i, word in enumerate(display_words):
                    with word_cols[i]:
                        st.markdown(
                            f"<span style='background-color:#fee2e2;color:#dc2626;"
                            f"padding:4px 12px;border-radius:12px;font-size:12px;"
                            f"font-weight:bold;'>{word}</span>",
                            unsafe_allow_html=True,
                        )

            st.markdown("#### 📝 最近审核意见")
            st.info(selected_row.get('comments', '暂无'))

            if st.button("🔍 查看完整互动记录", type="primary"):
                st.session_state["selected_doc_id"] = selected_row['doc_id']
                st.session_state["current_page"] = "📝 互动记录明细"
                st.rerun()

    else:
        st.info("暂无退回样本数据")
