"""
数据分析页面
包含治疗计划分布、随访任务漏斗、影像附件排行、收费明细变化
支持图表加载失败时的重试机制
"""
import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time

from src.data_processor import (
    get_treatment_plan_distribution,
    get_followup_funnel,
    get_imaging_ranking,
    get_charge_trend,
    get_last_update_time
)


def show_analytics():
    """展示数据分析页面"""
    st.title("📈 数据分析")

    last_update = get_last_update_time()
    if last_update:
        st.caption(f"最后更新时间: {last_update.strftime('%Y-%m-%d %H:%M:%S')}")

    tab1, tab2, tab3, tab4 = st.tabs([
        "🔹 治疗计划分布",
        "🔸 随访任务漏斗",
        "📷 影像附件排行",
        "💰 收费明细变化"
    ])

    with tab1:
        _show_treatment_plans()

    with tab2:
        _show_followup_funnel()

    with tab3:
        _show_imaging_ranking()

    with tab4:
        _show_charge_trend()


def _show_treatment_plans():
    """展示治疗计划分布 - 带加载失败重试机制"""
    st.subheader("治疗计划分布")

    if "treatment_plan_retry" not in st.session_state:
        st.session_state.treatment_plan_retry = 0

    if "treatment_plan_error" not in st.session_state:
        st.session_state.treatment_plan_error = False

    update_time = get_last_update_time("治疗计划")

    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.write("按治疗类型统计的计划数量和完成率")
    with col2:
        if update_time:
            st.caption(f"最近更新: {update_time.strftime('%m-%d %H:%M')}")
    with col3:
        if st.button("🔄 重试加载", key="retry_plans", use_container_width=True):
            st.session_state.treatment_plan_retry += 1
            st.session_state.treatment_plan_error = False
            st.rerun()

    try:
        df = get_treatment_plan_distribution()

        if df.is_empty():
            st.warning("暂无治疗计划数据")
            st.session_state.treatment_plan_error = True
            return

        st.session_state.treatment_plan_error = False

        col1, col2 = st.columns(2)

        with col1:
            fig = px.bar(
                df.to_pandas(),
                x="treatment_type",
                y="plan_count",
                color="plan_count",
                color_continuous_scale="Blues",
                text="plan_count",
                title="治疗类型分布"
            )
            fig.update_layout(
                height=400,
                xaxis_title="治疗类型",
                yaxis_title="计划数量",
                coloraxis_showscale=False
            )
            fig.update_traces(textposition='outside')
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            fig = px.bar(
                df.to_pandas(),
                x="treatment_type",
                y="completion_rate",
                color="completion_rate",
                color_continuous_scale="RdYlGn",
                range_color=[50, 100],
                text="completion_rate",
                title="治疗计划完成率"
            )
            fig.update_layout(
                height=400,
                xaxis_title="治疗类型",
                yaxis_title="完成率 (%)",
                coloraxis_showscale=False
            )
            fig.update_traces(texttemplate='%{text}%', textposition='outside')
            st.plotly_chart(fig, use_container_width=True)

        st.markdown("---")

        st.markdown("**详细数据**")
        display_df = df.select([
            "treatment_type",
            "plan_count",
            "total_sessions",
            "completed_sessions",
            "completion_rate"
        ])
        st.dataframe(
            display_df.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "treatment_type": "治疗类型",
                "plan_count": "计划数",
                "total_sessions": "总疗程",
                "completed_sessions": "已完成",
                "completion_rate": "完成率(%)"
            }
        )

    except Exception as e:
        st.session_state.treatment_plan_error = True
        _show_error_state("治疗计划图表", str(e), update_time)


def _show_followup_funnel():
    """展示随访任务漏斗"""
    st.subheader("随访任务漏斗")

    try:
        df = get_followup_funnel()

        if df.is_empty():
            st.warning("暂无随访任务数据")
            return

        status_order = ["待处理", "进行中", "已完成", "已取消"]
        df_sorted = df.with_columns(
            pl.col("task_status").cast(pl.Categorical)
        ).sort("task_status")

        funnel_data = []
        for status in status_order:
            row = df.filter(pl.col("task_status") == status)
            if not row.is_empty():
                funnel_data.append({
                    "status": status,
                    "count": row["task_count"][0]
                })

        if not funnel_data:
            st.warning("数据格式异常")
            return

        fig = go.Figure(go.Funnel(
            y=[item["status"] for item in funnel_data],
            x=[item["count"] for item in funnel_data],
            textinfo="value+percent initial",
            marker={"color": ["#636efa", "#1f77b4", "#00cc96", "#ef553b"]},
            connector={"line": {"color": "lightgrey", "dash": "solid"}}
        ))

        fig.update_layout(
            title="随访任务转化漏斗",
            height=450
        )

        st.plotly_chart(fig, use_container_width=True)

        st.markdown("---")

        col1, col2, col3 = st.columns(3)

        total_tasks = sum(item["count"] for item in funnel_data)
        completed = next((item["count"] for item in funnel_data if item["status"] == "已完成"), 0)
        pending = next((item["count"] for item in funnel_data if item["status"] == "待处理"), 0)

        completion_rate = round(completed / total_tasks * 100, 2) if total_tasks > 0 else 0

        with col1:
            st.metric("总任务数", total_tasks)
        with col2:
            st.metric("已完成", completed)
        with col3:
            st.metric("完成率", f"{completion_rate}%")

    except Exception as e:
        st.error(f"加载随访任务数据失败: {e}")


def _show_imaging_ranking():
    """展示影像附件排行 - 接入MinIO真实对象存储数据"""
    st.subheader("影像附件排行")

    try:
        result = get_imaging_ranking()
        df = result["data"]
        minio_available = result["minio_available"]
        minio_stats = result["minio_stats"]
        source = result["source"]

        if df.is_empty():
            st.warning("暂无影像数据")
            return

        if minio_available:
            st.success(f"✅ 对象存储已连接 (MinIO) - 数据来源: 影像系统 + 对象存储")
            if minio_stats:
                st.caption(f"对象存储中共有 {minio_stats['total_files']} 个影像文件")
        else:
            st.warning("⚠️ 对象存储未连接 - 当前仅展示影像系统记录数据")
            st.caption("提示: 配置MinIO后可查看真实对象存储统计")

        col1, col2 = st.columns(2)

        with col1:
            fig = px.bar(
                df.to_pandas(),
                x="image_type",
                y="image_count",
                color="image_count",
                color_continuous_scale="Purples",
                text="image_count",
                title="影像类型数量排行"
            )
            fig.update_layout(
                height=400,
                xaxis_title="影像类型",
                yaxis_title="数量",
                coloraxis_showscale=False
            )
            fig.update_traces(textposition='outside')
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            df_size = df.with_columns(
                (pl.col("total_size") / 1024 / 1024).round(2).alias("size_mb")
            )
            fig = px.pie(
                df_size.to_pandas(),
                values="size_mb",
                names="image_type",
                title="影像存储空间占比",
                hole=0.4
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

        st.markdown("---")

        display_df = df.select([
            "image_type",
            "image_count",
            "total_size",
            "avg_size"
        ]).with_columns([
            (pl.col("total_size") / 1024 / 1024).round(2).alias("总大小(MB)"),
            (pl.col("avg_size") / 1024 / 1024).round(2).alias("平均大小(MB)")
        ]).drop(["total_size", "avg_size"])

        st.dataframe(
            display_df.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "image_type": "影像类型",
                "image_count": "数量"
            }
        )

        if minio_available and minio_stats:
            st.markdown("---")
            with st.expander("📦 对象存储详细统计"):
                st.markdown(f"**存储桶**: `clinic-attachments`")
                st.markdown(f"**文件总数**: {minio_stats['total_files']}")

                if minio_stats.get("by_type"):
                    st.markdown("**按目录分类统计:**")
                    for folder, stats in minio_stats["by_type"].items():
                        st.text(f"  {folder}/ : {stats['count']} 个文件")

    except Exception as e:
        st.error(f"加载影像数据失败: {e}")


def _show_charge_trend():
    """展示收费明细变化"""
    st.subheader("收费明细变化")

    col1, col2 = st.columns([1, 4])
    with col1:
        days = st.selectbox(
            "时间范围",
            options=[7, 14, 30, 60, 90],
            index=2,
            format_func=lambda x: f"最近{x}天"
        )

    try:
        df = get_charge_trend(days=days)

        if df.is_empty():
            st.warning("暂无收费数据")
            return

        col1, col2, col3, col4 = st.columns(4)

        total_amount = round(df["total_amount"].sum(), 2)
        total_count = df["charge_count"].sum()
        avg_amount = round(df["avg_amount"].mean(), 2)
        max_amount = round(df["total_amount"].max(), 2)

        with col1:
            st.metric("总收费金额", f"¥{total_amount:,.2f}")
        with col2:
            st.metric("收费笔数", total_count)
        with col3:
            st.metric("平均金额", f"¥{avg_amount:,.2f}")
        with col4:
            st.metric("单日最高", f"¥{max_amount:,.2f}")

        st.markdown("---")

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=df["charge_date"].to_list(),
            y=df["total_amount"].to_list(),
            mode='lines+markers',
            name='收费金额',
            yaxis='y',
            line=dict(color='#1f77b4', width=2),
            marker=dict(size=6)
        ))

        fig.add_trace(go.Bar(
            x=df["charge_date"].to_list(),
            y=df["charge_count"].to_list(),
            name='收费笔数',
            yaxis='y2',
            marker_color='rgba(255, 127, 14, 0.6)',
            width=0.6
        ))

        fig.update_layout(
            title=f"最近{days}天收费趋势",
            height=450,
            xaxis_title="日期",
            yaxis=dict(
                title="收费金额 (元)",
                side="left"
            ),
            yaxis2=dict(
                title="收费笔数",
                side="right",
                overlaying="y"
            ),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            hovermode="x unified"
        )

        st.plotly_chart(fig, use_container_width=True)

        st.markdown("---")

        st.markdown("**每日收费明细**")
        display_df = df.select([
            "charge_date",
            "charge_count",
            "total_amount",
            "avg_amount"
        ]).sort("charge_date", descending=True)

        st.dataframe(
            display_df.to_pandas(),
            use_container_width=True,
            hide_index=True,
            column_config={
                "charge_date": "日期",
                "charge_count": "笔数",
                "total_amount": "总金额(元)",
                "avg_amount": "平均金额(元)"
            }
        )

    except Exception as e:
        st.error(f"加载收费数据失败: {e}")


def _show_error_state(chart_name: str, error_msg: str, update_time):
    """显示图表加载失败状态"""
    st.error(f"❌ {chart_name}加载失败")

    col1, col2 = st.columns(2)
    with col1:
        if update_time:
            st.info(f"📅 最近更新时间: {update_time.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            st.info("📅 暂无更新记录")

    with col2:
        st.code(error_msg, language=None)

    st.markdown("---")

    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("🔄 重新加载", type="primary", use_container_width=True, key="retry_chart_main"):
            st.session_state.treatment_plan_retry += 1
            st.session_state.treatment_plan_error = False
            st.rerun()

    st.caption("提示: 如果问题持续存在，请联系系统管理员检查数据源")
