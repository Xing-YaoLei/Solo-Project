"""
复诊风险总览页面
管理层视角 - 查看全局复诊风险情况
"""
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import polars as pl
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_processor import (
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    get_last_update_time,
    get_import_batches
)
from src.config import Config


def show_overview():
    """展示总览页面"""
    st.title("📊 复诊风险总览")

    try:
        last_update = get_last_update_time()
        if last_update:
            st.caption(f"最后更新时间: {last_update.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            st.caption("暂无数据更新记录")
    except Exception as e:
        st.warning(f"获取更新时间失败: {e}")

    role = st.session_state.current_role

    try:
        df = get_revisit_risk_overview()
    except Exception as e:
        st.error(f"加载数据失败: {e}")
        if st.button("重试", type="primary"):
            st.rerun()
        return

    if df.is_empty():
        st.warning("暂无数据，请先导入数据")
        return

    try:
        _show_key_metrics(df)
    except Exception as e:
        st.error(f"加载关键指标失败: {e}")

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        try:
            _show_risk_distribution(df)
        except Exception as e:
            st.error(f"加载风险分布失败: {e}")

    with col2:
        try:
            _show_status_distribution(df)
        except Exception as e:
            st.error(f"加载状态分布失败: {e}")

    st.markdown("---")

    try:
        _show_doctor_revisit_rate(role)
    except Exception as e:
        st.error(f"加载医生复诊率失败: {e}")

    st.markdown("---")

    try:
        _show_revisit_list(df, role)
    except Exception as e:
        st.error(f"加载复诊列表失败: {e}")

    st.markdown("---")

    try:
        _show_batch_history()
    except Exception as e:
        st.error(f"加载批次历史失败: {e}")


def _show_key_metrics(df: pl.DataFrame):
    """展示关键指标卡片"""
    total = len(df)
    completed = len(df.filter(pl.col("status") == "已完成"))
    pending = len(df.filter(pl.col("status") == "待复诊"))
    missed = len(df.filter(pl.col("status") == "爽约"))
    high_risk = len(df.filter(pl.col("risk_level") == "high"))

    revisit_rate = round(completed / total * 100, 2) if total > 0 else 0

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric("总预约数", total)

    with col2:
        st.metric("已完成", completed)

    with col3:
        st.metric("待复诊", pending)

    with col4:
        st.metric("爽约数", missed, delta=f"{round(missed/total*100, 1)}%" if total > 0 else None, delta_color="inverse")

    with col5:
        st.metric("复诊率", f"{revisit_rate}%")


def _show_risk_distribution(df: pl.DataFrame):
    """展示风险等级分布"""
    st.subheader("风险等级分布")

    risk_counts = df.group_by("risk_level").agg(
        pl.count().alias("count")
    ).sort("count", descending=True)

    risk_labels = {
        "high": "高风险",
        "medium": "中风险",
        "normal": "正常"
    }

    risk_counts = risk_counts.with_columns(
        pl.col("risk_level").replace(risk_labels).alias("risk_label")
    )

    colors = {"高风险": "#ff4b4b", "中风险": "#ffaa00", "正常": "#00cc66"}

    fig = px.pie(
        risk_counts.to_pandas(),
        values="count",
        names="risk_label",
        color="risk_label",
        color_discrete_map=colors,
        hole=0.4
    )
    fig.update_layout(height=300, showlegend=True)
    st.plotly_chart(fig, use_container_width=True)


def _show_status_distribution(df: pl.DataFrame):
    """展示预约状态分布"""
    st.subheader("预约状态分布")

    status_counts = df.group_by("status").agg(
        pl.count().alias("count")
    ).sort("count", descending=True)

    fig = px.bar(
        status_counts.to_pandas(),
        x="status",
        y="count",
        color="status",
        text="count"
    )
    fig.update_layout(
        height=300,
        showlegend=False,
        xaxis_title="状态",
        yaxis_title="数量"
    )
    st.plotly_chart(fig, use_container_width=True)


def _show_doctor_revisit_rate(role: str):
    """展示医生复诊率排行"""
    st.subheader("👨‍⚕️ 医生复诊率排行")

    rate_df = get_revisit_rate_by_doctor(current_user=st.session_state.current_user, role=role)

    if rate_df.is_empty():
        st.info("暂无数据")
        return

    fig = px.bar(
        rate_df.to_pandas(),
        x="doctor_name",
        y="revisit_rate",
        color="revisit_rate",
        text="revisit_rate",
        color_continuous_scale="RdYlGn",
        range_color=[60, 100]
    )
    fig.update_layout(
        height=350,
        xaxis_title="医生",
        yaxis_title="复诊率 (%)",
        coloraxis_showscale=False
    )
    fig.update_traces(texttemplate='%{text}%', textposition='outside')
    st.plotly_chart(fig, use_container_width=True)


def _show_revisit_list(df: pl.DataFrame, role: str):
    """展示复诊列表"""
    st.subheader("📋 复诊风险明细")

    col1, col2, col3 = st.columns(3)
    with col1:
        status_filter = st.multiselect(
            "状态筛选",
            options=df["status"].unique().to_list(),
            default=df["status"].unique().to_list(),
            key="overview_status_filter"
        )
    with col2:
        risk_filter = st.multiselect(
            "风险等级",
            options=["high", "medium", "normal"],
            default=["high", "medium", "normal"],
            format_func=lambda x: {"high": "高风险", "medium": "中风险", "normal": "正常"}[x],
            key="overview_risk_filter"
        )
    with col3:
        member_filter = st.multiselect(
            "会员等级",
            options=df["member_level"].unique().to_list(),
            default=df["member_level"].unique().to_list(),
            key="overview_member_filter"
        )

    filtered_df = df.filter(
        pl.col("status").is_in(status_filter) &
        pl.col("risk_level").is_in(risk_filter) &
        pl.col("member_level").is_in(member_filter)
    )

    st.write(f"共 {len(filtered_df)} 条记录")

    display_df = filtered_df.select([
        "appointment_id",
        "patient_name",
        "member_level",
        "appointment_date",
        "treatment_type",
        "status",
        "risk_level",
        "doctor_name",
        "next_appointment_date"
    ])

    display_df = display_df.with_columns(
        pl.col("risk_level").replace({
            "high": "🔴 高风险",
            "medium": "🟡 中风险",
            "normal": "🟢 正常"
        }).alias("risk_level")
    )

    st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        hide_index=True,
        column_config={
            "appointment_id": "预约ID",
            "patient_name": "患者姓名",
            "member_level": "会员等级",
            "appointment_date": "预约日期",
            "treatment_type": "治疗类型",
            "status": "状态",
            "risk_level": "风险等级",
            "doctor_name": "医生",
            "next_appointment_date": "下次复诊"
        }
    )


def _show_batch_history():
    """展示导入批次历史"""
    with st.expander("📦 数据导入批次记录"):
        batches = get_import_batches()
        if batches.is_empty():
            st.info("暂无批次记录")
        else:
            status_colors = {
                "success": "🟢 成功",
                "failed": "🔴 失败",
                "processing": "🟡 处理中"
            }

            display_batches = batches.with_columns(
                pl.col("status").replace(status_colors).alias("status_display")
            ).select([
                "batch_id",
                "source_system",
                "import_time",
                "record_count",
                "status_display",
                "remark"
            ])

            st.dataframe(
                display_batches.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config={
                    "batch_id": "批次ID",
                    "source_system": "来源系统",
                    "import_time": "导入时间",
                    "record_count": "记录数",
                    "status_display": "状态",
                    "remark": "备注"
                }
            )
