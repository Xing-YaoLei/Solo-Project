"""
同步链路审计 - 展示可审计的同步节点
"""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import polars as pl

from src.components.common import (
    get_common_filters, show_data_table, show_sync_trail,
    format_number, format_percent
)
from src.data.data_querier import DataQuerier
from src.data.sync_pipeline import SyncOrchestrator


def show():
    st.title("🔄 同步链路审计")
    st.markdown("审计底稿、权限日志、邮件材料的同步过程拆成可审计的节点")

    querier = DataQuerier()
    orchestrator = SyncOrchestrator()

    col1, col2 = st.columns(2)

    with col1:
        date_range = st.date_input(
            "同步日期范围",
            value=(datetime.now() - timedelta(days=30), datetime.now()),
            key="sync_date_range"
        )
        start_date = datetime.combine(date_range[0], datetime.min.time()) if len(date_range) > 0 else None
        end_date = datetime.combine(date_range[1], datetime.max.time()) if len(date_range) > 1 else None

    with col2:
        status_filter = st.selectbox(
            "同步状态",
            options=["全部", "completed", "running", "failed", "pending", "skipped"],
            index=0,
            key="sync_status_filter"
        )

    sync_nodes_df = querier.get_sync_nodes()
    if len(sync_nodes_df) > 0 and "started_at" in sync_nodes_df.columns:
        if start_date:
            sync_nodes_df = sync_nodes_df.filter(pl.col("started_at") >= start_date)
        if end_date:
            sync_nodes_df = sync_nodes_df.filter(pl.col("started_at") <= end_date)
        if status_filter != "全部":
            sync_nodes_df = sync_nodes_df.filter(pl.col("status") == status_filter)

    show_sync_summary(sync_nodes_df)

    st.divider()

    tab1, tab2, tab3 = st.tabs(["📊 同步概览", "🔗 同步链路详情", "📈 同步趋势"])

    with tab1:
        show_sync_overview(sync_nodes_df)

    with tab2:
        show_sync_chain_detail(sync_nodes_df, orchestrator)

    with tab3:
        show_sync_trend(sync_nodes_df)

    querier.close()
    orchestrator.close()


def show_sync_summary(sync_nodes_df: pl.DataFrame) -> None:
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        total_syncs = len(sync_nodes_df)
        st.metric("同步节点总数", format_number(total_syncs))

    with col2:
        success_count = sync_nodes_df.filter(pl.col("status") == "completed").height
        success_rate = (success_count / total_syncs * 100) if total_syncs > 0 else 0
        st.metric("成功数", format_number(success_count), format_percent(success_rate))

    with col3:
        failed_count = sync_nodes_df.filter(pl.col("status") == "failed").height
        st.metric("失败数", format_number(failed_count),
                  delta=format_percent(failed_count / total_syncs * 100) if total_syncs > 0 else None,
                  delta_color="inverse")

    with col4:
        total_records = sync_nodes_df["record_count"].sum() if len(sync_nodes_df) > 0 else 0
        st.metric("同步记录总数", format_number(total_records))


def show_sync_overview(sync_nodes_df: pl.DataFrame) -> None:
    st.subheader("📊 同步节点概览")

    if len(sync_nodes_df) == 0:
        st.info("暂无同步记录")
        return

    col1, col2 = st.columns(2)

    with col1:
        if "node_type" in sync_nodes_df.columns:
            type_stats = sync_nodes_df.group_by("node_type").agg([
                pl.count().alias("节点数"),
                pl.col("record_count").sum().alias("同步记录数")
            ]).sort("节点数", descending=True)

            node_type_names = {
                "extract": "数据提取",
                "transform": "数据转换",
                "validate": "数据校验",
                "load": "数据加载",
                "archive": "数据归档"
            }
            type_stats = type_stats.with_columns([
                pl.col("node_type").replace(node_type_names).alias("节点类型")
            ])

            fig = px.bar(
                type_stats.to_pandas(),
                x="节点类型",
                y=["节点数", "同步记录数"],
                title="各节点类型统计",
                barmode="group",
                text_auto=True
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if "status" in sync_nodes_df.columns:
            status_stats = sync_nodes_df.group_by("status").agg([
                pl.count().alias("数量"),
                pl.col("record_count").sum().alias("同步记录数")
            ])

            status_names = {
                "pending": "等待中",
                "running": "运行中",
                "completed": "已完成",
                "failed": "失败",
                "skipped": "已跳过"
            }
            status_stats = status_stats.with_columns([
                pl.col("status").replace(status_names).alias("状态")
            ])

            fig2 = px.pie(
                status_stats.to_pandas(),
                values="数量",
                names="状态",
                title="同步状态分布",
                hole=0.4,
                color="状态",
                color_discrete_map={
                    "等待中": "#ffc107",
                    "运行中": "#17a2b8",
                    "已完成": "#28a745",
                    "失败": "#dc3545",
                    "已跳过": "#6c757d"
                }
            )
            fig2.update_layout(height=450)
            st.plotly_chart(fig2, use_container_width=True)

    if "operator" in sync_nodes_df.columns:
        operator_stats = sync_nodes_df.group_by("operator").agg([
            pl.count().alias("操作次数"),
            pl.col("record_count").sum().alias("同步记录数")
        ]).sort("同步记录数", descending=True).head(10)

        fig3 = px.bar(
            operator_stats.to_pandas(),
            x="operator",
            y="同步记录数",
            title="操作人员同步量排行",
            color="操作次数",
            text_auto=True
        )
        fig3.update_layout(height=400, xaxis_title="操作人员")
        st.plotly_chart(fig3, use_container_width=True)

    st.markdown("### 📋 同步节点列表")
    display_df = sync_nodes_df.clone()
    if "node_type" in display_df.columns:
        display_df = display_df.with_columns([
            pl.col("node_type").replace(node_type_names).alias("节点类型"),
            pl.col("status").replace(status_names).alias("状态")
        ])

    show_data_table(
        display_df.select([
            "sync_id", "节点类型", "node_name", "source_system", "target_system",
            "状态", "record_count", "operator", "batch_no", "started_at", "completed_at"
        ]),
        height=400,
        key="sync_nodes_table"
    )


def show_sync_chain_detail(sync_nodes_df: pl.DataFrame, orchestrator: SyncOrchestrator) -> None:
    st.subheader("🔗 同步链路详情")

    if len(sync_nodes_df) == 0:
        st.info("暂无同步记录")
        return

    batch_nos = sync_nodes_df["batch_no"].unique().sort(descending=True).to_list()

    col1, col2 = st.columns(2)
    with col1:
        selected_batch = st.selectbox(
            "选择同步批次",
            options=batch_nos,
            format_func=lambda x: f"批次 {x}",
            key="batch_select"
        )

    with col2:
        batch_nodes = sync_nodes_df.filter(pl.col("batch_no") == selected_batch)
        if len(batch_nodes) > 0:
            batch_status = orchestrator.validate_sync_chain(selected_batch)
            status_color = "🟢" if batch_status["validation_passed"] else "🔴"
            st.metric(
                f"{status_color} 批次校验结果",
                "通过" if batch_status["validation_passed"] else "失败",
                delta=f"{batch_status['total_nodes']} 个节点"
            )

    if selected_batch:
        batch_nodes = sync_nodes_df.filter(pl.col("batch_no") == selected_batch).sort("started_at")

        st.markdown("### 📍 同步链路流程")

        node_type_names = {
            "extract": "📥 数据提取",
            "transform": "🔄 数据转换",
            "validate": "✅ 数据校验",
            "load": "📤 数据加载",
            "archive": "📦 数据归档"
        }

        status_icons = {
            "completed": "✅",
            "running": "🔄",
            "failed": "❌",
            "pending": "⏳",
            "skipped": "⏭️"
        }

        if len(batch_nodes) > 0:
            first_sync_id = batch_nodes["sync_id"][0]
            chain_nodes = orchestrator.get_sync_chain(first_sync_id)

            if chain_nodes:
                cols = st.columns(len(chain_nodes))
                for i, (col, node) in enumerate(zip(cols, chain_nodes)):
                    with col:
                        node_type = node["node_type"]
                        status = node["status"]
                        icon = status_icons.get(status, "⚪")
                        type_name = node_type_names.get(node_type, node_type)

                        st.markdown(f"### {icon} {type_name}")
                        st.markdown(f"**{node['node_name']}**")
                        st.caption(f"状态: {status}")
                        st.caption(f"记录数: {node['record_count']}")

                        if node["duration_seconds"]:
                            st.caption(f"耗时: {node['duration_seconds']:.1f}s")

                        if node["status"] == "failed":
                            st.error(f"错误: {node.get('error_message', '未知错误')}")

                        if i < len(chain_nodes) - 1:
                            st.markdown("⬇️")

                sync_times = []
                for node in chain_nodes:
                    if node["started_at"] and node["completed_at"]:
                        sync_times.append({
                            "节点": node_type_names.get(node["node_type"], node["node_type"]),
                            "开始时间": node["started_at"],
                            "结束时间": node["completed_at"],
                            "耗时(秒)": node["duration_seconds"]
                        })

                if sync_times:
                    st.markdown("### ⏱️ 同步耗时分析")
                    time_df = pl.DataFrame(sync_times)
                    fig = px.bar(
                        time_df.to_pandas(),
                        x="节点",
                        y="耗时(秒)",
                        title="各节点耗时",
                        color="耗时(秒)",
                        color_continuous_scale="Blues",
                        text_auto=True
                    )
                    st.plotly_chart(fig, use_container_width=True)

        st.divider()

        st.markdown("### 📋 批次同步明细")

        data_sources = {
            "audit_workpapers": "审计底稿",
            "permission_logs": "权限日志",
            "mail_materials": "邮件材料"
        }

        for source_table, source_name in data_sources.items():
            st.markdown(f"#### {source_name}")
            try:
                related_data = orchestrator.get_related_records_by_sync(first_sync_id) if 'first_sync_id' in locals() else {}
                source_df = related_data.get(source_table, pl.DataFrame())

                if len(source_df) > 0:
                    col_a, col_b = st.columns(2)
                    with col_a:
                        st.metric(f"{source_name}同步数", format_number(len(source_df)))
                    with col_b:
                        if "region_id" in source_df.columns:
                            region_count = source_df["region_id"].n_unique()
                            st.metric("覆盖区域数", format_number(region_count))

                    show_data_table(source_df, height=250, key=f"sync_{source_table}")
                else:
                    st.info(f"该批次无{source_name}数据")
            except Exception as e:
                st.info(f"该批次无{source_name}数据")

        if 'first_sync_id' in locals():
            show_sync_trail(first_sync_id, "完整审计轨迹")


def show_sync_trend(sync_nodes_df: pl.DataFrame) -> None:
    st.subheader("📈 同步趋势分析")

    if len(sync_nodes_df) == 0 or "started_at" not in sync_nodes_df.columns:
        st.info("暂无同步记录")
        return

    col1, col2 = st.columns(2)

    with col1:
        period = st.selectbox(
            "时间粒度",
            options=["日", "周", "月"],
            index=0,
            key="sync_trend_period"
        )
        period_format = {"日": "%Y-%m-%d", "周": "%Y-%W", "月": "%Y-%m"}

    with col2:
        metric = st.selectbox(
            "分析指标",
            options=["同步节点数", "同步记录数", "成功率"],
            index=0,
            key="sync_trend_metric"
        )

    trend_df = sync_nodes_df.with_columns([
        pl.col("started_at").cast(pl.Datetime).dt.strftime(period_format[period]).alias("period")
    ])

    if metric == "同步节点数":
        agg_df = trend_df.group_by("period").agg([
            pl.count().alias("数量")
        ]).sort("period")
        title = "同步节点数趋势"
        y_col = "数量"

    elif metric == "同步记录数":
        agg_df = trend_df.group_by("period").agg([
            pl.col("record_count").sum().alias("数量")
        ]).sort("period")
        title = "同步记录数趋势"
        y_col = "数量"

    else:
        agg_df = trend_df.group_by("period").agg([
            pl.count().alias("总数"),
            (pl.col("status") == "completed").sum().alias("成功数"),
            ((pl.col("status") == "completed").sum() / pl.count() * 100).round(2).alias("成功率")
        ]).sort("period")
        title = "同步成功率趋势(%)"
        y_col = "成功率"

    fig = px.line(
        agg_df.to_pandas(),
        x="period",
        y=y_col,
        title=title,
        markers=True
    )
    fig.update_traces(line_color="#1f77b4", line_width=3)
    fig.update_layout(height=500)
    st.plotly_chart(fig, use_container_width=True)

    if "node_type" in sync_nodes_df.columns:
        st.markdown("### 📊 各节点类型趋势")
        node_type_names = {
            "extract": "数据提取",
            "transform": "数据转换",
            "validate": "数据校验",
            "load": "数据加载",
            "archive": "数据归档"
        }

        by_type_df = trend_df.with_columns([
            pl.col("node_type").replace(node_type_names).alias("节点类型")
        ]).group_by(["period", "节点类型"]).agg([
            pl.count().alias("节点数")
        ]).sort("period")

        fig2 = px.line(
            by_type_df.to_pandas(),
            x="period",
            y="节点数",
            color="节点类型",
            title="各节点类型同步趋势",
            markers=True
        )
        fig2.update_layout(height=500)
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("### 📋 趋势数据明细")
    show_data_table(agg_df, height=300, key="sync_trend_table")
