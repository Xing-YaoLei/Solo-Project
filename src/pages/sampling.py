"""
抽样记录明细 - 用于解释口径，支持跳回原始记录
"""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import polars as pl

from src.components.common import (
    get_common_filters, show_data_table, show_sync_trail,
    format_number, format_percent
)
from src.data.data_querier import DataQuerier
from src.utils.sampling_engine import SamplingEngine

if "selected_sampling" not in st.session_state:
    st.session_state.selected_sampling = None
if "sampling_view_mode" not in st.session_state:
    st.session_state.sampling_view_mode = "list"
if "original_record_view" not in st.session_state:
    st.session_state.original_record_view = None


def show():
    st.title("🎯 抽样记录明细")
    st.markdown("抽样记录用于解释口径，抽样记录明细能跳回原始记录")

    filters = get_common_filters(key_prefix="sampling")

    querier = DataQuerier()

    if st.session_state.sampling_view_mode == "list":
        show_sampling_list(querier, filters)
    elif st.session_state.sampling_view_mode == "detail":
        show_sampling_detail(querier)
    elif st.session_state.sampling_view_mode == "original":
        show_original_record_detail(querier)

    querier.close()


def show_sampling_list(querier: DataQuerier, filters: dict) -> None:
    sampling_df = querier.get_sampling_records(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    archive_df = querier.get_evidence_archive(
        start_date=filters.get("start_date"),
        end_date=filters.get("end_date"),
        region_id=filters.get("region_id")
    )

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("抽样记录总数", format_number(len(sampling_df)))

    with col2:
        total_population = sampling_df["population_size"].sum() if len(sampling_df) > 0 else 0
        st.metric("累计抽样总体", format_number(total_population))

    with col3:
        total_sample = sampling_df["sample_size"].sum() if len(sampling_df) > 0 else 0
        st.metric("累计抽取样本", format_number(total_sample))

    with col4:
        avg_rate = (total_sample / total_population * 100) if total_population > 0 else 0
        st.metric("平均抽样比例", format_percent(avg_rate))

    st.divider()

    show_sampling_statistics(sampling_df)

    st.divider()

    st.markdown("### 📋 抽样记录列表 - 点击行查看抽样详情和原始记录")

    if len(sampling_df) == 0:
        st.info("暂无抽样记录")
        return

    display_df = sampling_df.select([
        "sampling_id", "sampling_no", "sampling_method", "sampling_criteria",
        "population_size", "sample_size", "confidence_level", "margin_of_error",
        "region_name", "sampled_by", "sampled_at", "remark"
    ]).with_columns([
        (pl.col("sample_size") / pl.col("population_size") * 100).round(2).alias("抽样比例(%)"),
        (pl.col("confidence_level") * 100).round(0).cast(pl.Int64).alias("置信水平(%)"),
        (pl.col("margin_of_error") * 100).round(2).alias("边际误差(%)")
    ])

    method_names = {
        "random": "简单随机抽样",
        "stratified": "分层抽样",
        "systematic": "系统抽样",
        "cluster": "整群抽样",
        "weighted": "加权抽样",
        "filtered": "过滤抽样"
    }
    display_df = display_df.with_columns([
        pl.col("sampling_method").replace(method_names).alias("抽样方法")
    ])

    event = st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        height=500,
        key="sampling_table",
        on_select="rerun",
        selection_mode="single-row"
    )

    if event and event.selection and event.selection.rows:
        selected_row = event.selection.rows[0]
        st.session_state.selected_sampling = {
            "sampling_id": display_df["sampling_id"][selected_row],
            "sampling_no": display_df["sampling_no"][selected_row],
            "original_record_refs": sampling_df["original_record_refs"][selected_row] if "original_record_refs" in sampling_df.columns else None,
            "related_archive_ids": sampling_df["related_archive_ids"][selected_row] if "related_archive_ids" in sampling_df.columns else None
        }
        st.session_state.sampling_view_mode = "detail"
        st.rerun()


def show_sampling_statistics(sampling_df: pl.DataFrame) -> None:
    st.markdown("### 📊 抽样统计分析")

    col1, col2 = st.columns(2)

    with col1:
        if "sampling_method" in sampling_df.columns:
            method_stats = sampling_df.group_by("sampling_method").agg([
                pl.count().alias("抽样次数"),
                pl.col("population_size").sum().alias("总体总数"),
                pl.col("sample_size").sum().alias("样本总数")
            ]).sort("抽样次数", descending=True)

            method_names = {
                "random": "简单随机抽样",
                "stratified": "分层抽样",
                "systematic": "系统抽样",
                "cluster": "整群抽样",
                "weighted": "加权抽样",
                "filtered": "过滤抽样"
            }
            method_stats = method_stats.with_columns([
                pl.col("sampling_method").replace(method_names).alias("抽样方法")
            ])

            fig = px.pie(
                method_stats.to_pandas(),
                values="抽样次数",
                names="抽样方法",
                title="抽样方法分布",
                hole=0.4
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if "region_name" in sampling_df.columns:
            region_stats = sampling_df.group_by("region_name").agg([
                pl.count().alias("抽样次数"),
                pl.col("sample_size").sum().alias("样本总数")
            ]).sort("样本总数", descending=True)

            fig2 = px.bar(
                region_stats.to_pandas(),
                x="region_name",
                y="样本总数",
                title="各区域样本量分布",
                color="抽样次数",
                text_auto=True
            )
            fig2.update_layout(height=450)
            st.plotly_chart(fig2, use_container_width=True)

    if "sampled_at" in sampling_df.columns:
        trend_df = sampling_df.with_columns([
            pl.col("sampled_at").cast(pl.Datetime).dt.strftime("%Y-%m").alias("month")
        ]).group_by("month").agg([
            pl.count().alias("抽样次数"),
            pl.col("sample_size").sum().alias("样本量")
        ]).sort("month")

        fig3 = go.Figure()
        fig3.add_trace(go.Bar(
            x=trend_df["month"].to_list(),
            y=trend_df["样本量"].to_list(),
            name="样本量",
            marker_color="#1f77b4"
        ))
        fig3.add_trace(go.Scatter(
            x=trend_df["month"].to_list(),
            y=trend_df["抽样次数"].to_list(),
            name="抽样次数",
            mode="lines+markers",
            line=dict(color="#ff7f0e", width=2),
            yaxis="y2"
        ))
        fig3.update_layout(
            title="抽样趋势",
            yaxis2=dict(title="抽样次数", overlaying="y", side="right"),
            height=400
        )
        st.plotly_chart(fig3, use_container_width=True)


def show_sampling_detail(querier: DataQuerier) -> None:
    selection = st.session_state.selected_sampling
    sampling_id = selection.get("sampling_id")

    st.subheader(f"🎯 抽样详情 - {selection.get('sampling_no', '')}")

    if st.button("← 返回抽样列表", key="back_to_sampling_list"):
        st.session_state.sampling_view_mode = "list"
        st.session_state.selected_sampling = None
        st.session_state.original_record_view = None
        st.rerun()

    st.divider()

    sampling_df = querier.get_sampling_records()
    sampling_detail = sampling_df.filter(pl.col("sampling_id") == sampling_id)

    if len(sampling_detail) == 0:
        st.error("未找到该抽样记录")
        return

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**抽样基本信息**")
        method_names = {
            "random": "简单随机抽样",
            "stratified": "分层抽样",
            "systematic": "系统抽样",
            "cluster": "整群抽样",
            "weighted": "加权抽样",
            "filtered": "过滤抽样"
        }
        method_name = method_names.get(sampling_detail["sampling_method"][0], sampling_detail["sampling_method"][0])

        info_df = pl.DataFrame([
            {"字段": "抽样ID", "值": str(sampling_detail["sampling_id"][0])},
            {"字段": "抽样编号", "值": str(sampling_detail["sampling_no"][0])},
            {"字段": "抽样方法", "值": method_name},
            {"字段": "抽样标准", "值": str(sampling_detail["sampling_criteria"][0])},
            {"字段": "区域", "值": str(sampling_detail["region_name"][0])},
            {"字段": "抽样人", "值": str(sampling_detail["sampled_by"][0])},
            {"字段": "抽样时间", "值": str(sampling_detail["sampled_at"][0])},
        ])
        st.dataframe(info_df.to_pandas(), use_container_width=True, hide_index=True)

    with col2:
        st.markdown("**抽样参数**")
        sample_size = sampling_detail["sample_size"][0]
        population_size = sampling_detail["population_size"][0]
        sampling_rate = (sample_size / population_size * 100) if population_size > 0 else 0

        param_df = pl.DataFrame([
            {"字段": "总体数量", "值": format_number(population_size)},
            {"字段": "样本数量", "值": format_number(sample_size)},
            {"字段": "抽样比例", "值": format_percent(sampling_rate)},
            {"字段": "置信水平", "值": format_percent(sampling_detail["confidence_level"][0] * 100)},
            {"字段": "边际误差", "值": f"±{sampling_detail['margin_of_error'][0] * 100:.2f}%"},
            {"字段": "备注", "值": str(sampling_detail["remark"][0] or "")},
        ])
        st.dataframe(param_df.to_pandas(), use_container_width=True, hide_index=True)

    st.divider()

    st.markdown("### 📖 抽样口径解释")
    explanation = SamplingEngine.get_sample_explanation(
        type('obj', (object,), {
            'sampling_method': sampling_detail["sampling_method"][0],
            'sampling_criteria': sampling_detail["sampling_criteria"][0],
            'population_size': population_size,
            'sample_size': sample_size,
            'confidence_level': sampling_detail["confidence_level"][0],
            'margin_of_error': sampling_detail["margin_of_error"][0],
            'sampling_id': sampling_id
        })()
    )
    st.info(explanation)

    with st.expander("📚 抽样方法说明", expanded=False):
        st.markdown("""
        **简单随机抽样**: 从总体中完全随机地抽取样本，每个个体被抽中的概率相等。适用于总体分布均匀的情况。

        **分层抽样**: 将总体按照某些特征分成若干层次，然后从每个层次中独立地进行抽样。可以提高样本的代表性。

        **系统抽样**: 按照固定的间隔从总体中抽取样本。操作简便，但需要注意周期性偏差。

        **整群抽样**: 将总体分成若干群，随机抽取部分群，对选中的群进行全面调查。适用于群间差异小的情况。

        **加权抽样**: 根据重要性给不同个体赋予不同权重，权重高的个体被抽中的概率更大。

        **过滤抽样**: 先按照特定条件筛选总体，再从筛选结果中抽样。适用于需要聚焦特定子集的场景。
        """)

    st.divider()

    st.markdown("### 🔗 关联证据归档")
    related_archive_ids = selection.get("related_archive_ids") or sampling_detail["related_archive_ids"][0]
    if related_archive_ids:
        archive_ids = str(related_archive_ids).split(",") if isinstance(related_archive_ids, str) else []
        if archive_ids:
            archive_df = querier.get_evidence_archive()
            related_archives = archive_df.filter(pl.col("archive_id").is_in(archive_ids))
            if len(related_archives) > 0:
                show_data_table(related_archives, height=200, key="sampling_related_archives")
            else:
                st.info("未找到关联的证据归档")
        else:
            st.info("未关联证据归档")
    else:
        st.info("未关联证据归档")

    st.divider()

    st.markdown("### 📋 样本记录 - 点击查看原始记录")
    original_refs = selection.get("original_record_refs") or sampling_detail["original_record_refs"][0]

    if original_refs:
        ref_list = str(original_refs).split(",") if isinstance(original_refs, str) else []
        st.metric("样本记录数", format_number(len(ref_list)))

        sample_records = []
        for ref in ref_list:
            ref_parts = ref.split(":") if ":" in ref else [ref, ""]
            source_table = ref_parts[0] if len(ref_parts) > 1 else "unknown"
            source_id = ref_parts[-1]

            archive_df = querier.get_evidence_archive()
            matching = archive_df.filter(
                (pl.col("source_id") == source_id) | (pl.col("archive_id") == source_id)
            )
            if len(matching) > 0:
                record = matching.to_dicts()[0]
                record["_ref_key"] = ref
                record["_source_table"] = source_table
                record["_source_id"] = source_id
                sample_records.append(record)

        if sample_records:
            sample_df = pl.DataFrame(sample_records).select([
                "_ref_key", "archive_id", "title", "evidence_type",
                "region_name", "archive_date", "archived_by", "_source_table", "_source_id"
            ])

            event = st.dataframe(
                sample_df.to_pandas(),
                use_container_width=True,
                height=400,
                key="sample_records_table",
                on_select="rerun",
                selection_mode="single-row"
            )

            if event and event.selection and event.selection.rows:
                selected_idx = event.selection.rows[0]
                st.session_state.original_record_view = {
                    "source_table": sample_df["_source_table"][selected_idx],
                    "source_id": sample_df["_source_id"][selected_idx],
                    "archive_id": sample_df["archive_id"][selected_idx],
                    "ref_key": sample_df["_ref_key"][selected_idx]
                }
                st.session_state.sampling_view_mode = "original"
                st.rerun()
        else:
            st.info("未找到样本记录详情")
    else:
        st.info("该抽样记录未关联原始记录引用")


def show_original_record_detail(querier: DataQuerier) -> None:
    record_view = st.session_state.original_record_view
    selection = st.session_state.selected_sampling

    st.subheader(f"📄 原始记录详情 - {record_view.get('ref_key', '')}")
    st.info(f"来源表: {record_view.get('source_table', '')} | 来源ID: {record_view.get('source_id', '')}")

    col_back1, col_back2 = st.columns(2)
    with col_back1:
        if st.button("← 返回抽样详情", key="back_to_sampling_detail"):
            st.session_state.sampling_view_mode = "detail"
            st.session_state.original_record_view = None
            st.rerun()
    with col_back2:
        if st.button("←← 返回抽样列表", key="back_to_sampling_from_original"):
            st.session_state.sampling_view_mode = "list"
            st.session_state.selected_sampling = None
            st.session_state.original_record_view = None
            st.rerun()

    st.divider()

    source_table = record_view.get("source_table")
    source_id = record_view.get("source_id")
    archive_id = record_view.get("archive_id")

    source_table_mapping = {
        "audit_workpaper": "audit_workpapers",
        "audit_workpapers": "audit_workpapers",
        "permission_log": "permission_logs",
        "permission_logs": "permission_logs",
        "mail_material": "mail_materials",
        "mail_materials": "mail_materials",
        "evidence_archive": "evidence_archive"
    }

    actual_table = source_table_mapping.get(source_table, source_table)

    original_record = querier.get_original_record(actual_table, source_id)

    if original_record:
        st.markdown("### 📝 原始记录内容")
        record_df = pl.DataFrame([
            {"字段": k, "值": str(v) if v is not None else ""}
            for k, v in original_record.items()
        ])
        st.dataframe(record_df.to_pandas(), use_container_width=True, hide_index=True, height=500)

        sync_id = original_record.get("sync_id")
        if sync_id:
            st.divider()
            show_sync_trail(sync_id, "该记录的同步审计链路")
    else:
        st.warning(f"未找到原始记录 (表: {actual_table}, ID: {source_id})")

    st.divider()
    st.markdown("### 🔗 关联证据归档")

    if archive_id:
        archive_df = querier.get_evidence_archive()
        archive_detail = archive_df.filter(pl.col("archive_id") == archive_id)
        if len(archive_detail) > 0:
            show_data_table(archive_detail, height=200, key="original_related_archive")

            st.markdown("### 📎 关联附件")
            attachments_df = querier.get_evidence_attachments(archive_id=archive_id)
            if len(attachments_df) > 0:
                show_data_table(attachments_df, height=200, key="original_attachments")
            else:
                st.info("暂无附件")

            st.markdown("### ❗ 关联问题记录")
            issue_df = querier.get_issue_records()
            related_issues = issue_df.filter(pl.col("related_archive_id") == archive_id)
            if len(related_issues) > 0:
                show_data_table(related_issues.select([
                    "issue_no", "title", "severity", "status", "found_date", "handler"
                ]), height=200, key="original_related_issues")
            else:
                st.info("暂无关联问题记录")
        else:
            st.info("未找到关联的证据归档")
    else:
        st.info("未关联证据归档")

    st.divider()
    st.markdown("### 🎯 口径偏差排查")
    st.info("""
    通过对比原始记录与抽样记录，可以排查以下口径偏差：
    1. **数据完整性**: 检查原始记录是否完整，关键字段是否缺失
    2. **抽样准确性**: 验证抽样条件是否正确应用到该记录
    3. **时间一致性**: 确认记录时间是否在抽样时间范围内
    4. **区域匹配**: 检查记录所属区域是否与抽样区域一致
    5. **数据质量**: 排查是否存在数据录入错误或格式问题
    """)

    with st.expander("🔍 偏差排查工具", expanded=False):
        st.text_input("偏差说明", placeholder="请输入发现的偏差说明...")
        st.selectbox("偏差类型", [
            "数据缺失",
            "抽样条件错误",
            "时间范围不符",
            "区域不匹配",
            "数据质量问题",
            "其他"
        ])
        st.text_area("处理建议", placeholder="请输入处理建议...")
        if st.button("提交偏差记录", key="submit_deviation"):
            st.success("偏差记录已提交！")
