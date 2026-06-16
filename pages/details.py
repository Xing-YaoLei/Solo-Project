"""
复诊率明细页面
一线人员视角 - 只查看自己负责范围内的复诊率明细
支持爽约注释功能
"""
import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from src.data_processor import (
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    add_appointment_note,
    get_appointment_notes,
    get_last_update_time
)
from src.config import Config


def show_details():
    """展示明细页面"""
    st.title("📋 复诊率明细")

    last_update = get_last_update_time()
    if last_update:
        st.caption(f"最后更新时间: {last_update.strftime('%Y-%m-%d %H:%M:%S')}")

    role = st.session_state.current_role
    current_user = st.session_state.current_user

    if role == "frontline":
        st.info(f"您当前查看的是: **{current_user}** 负责的患者明细")
        df = get_revisit_risk_overview(doctor_filter=current_user)
    else:
        st.info("管理层可查看所有医生的明细")
        df = get_revisit_risk_overview()

    if df.is_empty():
        st.warning("暂无数据")
        return

    _show_personal_metrics(df, role, current_user)

    st.markdown("---")

    _show_revisit_details(df, role)

    st.markdown("---")

    _show_note_section()


def _show_personal_metrics(df: pl.DataFrame, role: str, current_user: str):
    """展示个人/团队指标"""
    if role == "frontline":
        st.subheader("我的复诊指标")

        total = len(df)
        completed = len(df.filter(pl.col("status") == "已完成"))
        pending = len(df.filter(pl.col("status") == "待复诊"))
        missed = len(df.filter(pl.col("status") == "爽约"))
        high_risk = len(df.filter(pl.col("risk_level") == "high"))

        revisit_rate = round(completed / total * 100, 2) if total > 0 else 0

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric("总患者数", total)
        with col2:
            st.metric("复诊率", f"{revisit_rate}%")
        with col3:
            st.metric("待复诊", pending)
        with col4:
            st.metric("爽约数", missed, delta_color="inverse")

    else:
        st.subheader("团队复诊指标")

        rate_df = get_revisit_rate_by_doctor()
        if not rate_df.is_empty():
            avg_rate = round(rate_df["revisit_rate"].mean(), 2)
            total_patients = rate_df["total_appointments"].sum()

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("总预约数", total_patients)
            with col2:
                st.metric("平均复诊率", f"{avg_rate}%")
            with col3:
                st.metric("医生数量", len(rate_df))


def _show_revisit_details(df: pl.DataFrame, role: str):
    """展示复诊明细列表"""
    st.subheader("患者复诊明细")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        status_filter = st.multiselect(
            "状态",
            options=df["status"].unique().to_list(),
            default=df["status"].unique().to_list(),
            key="detail_status"
        )
    with col2:
        risk_filter = st.multiselect(
            "风险等级",
            options=["high", "medium", "normal"],
            default=["high", "medium", "normal"],
            format_func=lambda x: {"high": "高风险", "medium": "中风险", "normal": "正常"}[x],
            key="detail_risk"
        )
    with col3:
        treatment_filter = st.multiselect(
            "治疗类型",
            options=df["treatment_type"].unique().to_list(),
            default=df["treatment_type"].unique().to_list(),
            key="detail_treatment"
        )
    with col4:
        member_filter = st.multiselect(
            "会员等级",
            options=df["member_level"].unique().to_list(),
            default=df["member_level"].unique().to_list(),
            key="detail_member"
        )

    filtered_df = df.filter(
        pl.col("status").is_in(status_filter) &
        pl.col("risk_level").is_in(risk_filter) &
        pl.col("treatment_type").is_in(treatment_filter) &
        pl.col("member_level").is_in(member_filter)
    )

    if role != "frontline":
        doctor_list = filtered_df["responsible_doctor"].unique().to_list()
        selected_doctor = st.selectbox(
            "按医生筛选",
            options=["全部"] + doctor_list,
            index=0
        )
        if selected_doctor != "全部":
            filtered_df = filtered_df.filter(pl.col("responsible_doctor") == selected_doctor)

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

    event = st.dataframe(
        display_df.to_pandas(),
        use_container_width=True,
        hide_index=True,
        on_select="rerun",
        selection_mode="single-row",
        column_config={
            "appointment_id": "预约ID",
            "patient_name": "患者姓名",
            "member_level": "会员等级",
            "appointment_date": "预约日期",
            "treatment_type": "治疗类型",
            "status": "状态",
            "risk_level": "风险等级",
            "doctor_name": "主治医生",
            "next_appointment_date": "下次复诊"
        }
    )

    if event.selection.rows:
        selected_idx = event.selection.rows[0]
        selected_row = filtered_df[selected_idx]
        st.session_state.selected_appointment = selected_row["appointment_id"][0]
        st.session_state.selected_patient = selected_row["patient_name"][0]
        st.session_state.selected_status = selected_row["status"][0]


def _show_note_section():
    """展示注释区域"""
    st.subheader("📝 爽约注释")

    if "selected_appointment" not in st.session_state:
        st.info("请在上方列表中选择一条预约记录查看注释")
        return

    appointment_id = st.session_state.selected_appointment
    patient_name = st.session_state.selected_patient
    status = st.session_state.selected_status

    st.info(f"已选择: **{patient_name}** (预约ID: {appointment_id}) - 状态: {status}")

    notes = get_appointment_notes(appointment_id)

    if not notes.is_empty():
        st.markdown("**历史注释:**")
        for row in notes.iter_rows(named=True):
            with st.chat_message(name=row["created_by"]):
                st.markdown(f"*{row['created_at']}*")
                st.write(row["note_text"])
    else:
        st.info("暂无注释记录")

    st.markdown("---")

    st.markdown("**添加注释:**")
    note_text = st.text_area(
        "注释内容",
        placeholder="请输入爽约原因或备注信息...",
        height=100,
        key="note_input"
    )

    col1, col2 = st.columns([1, 5])
    with col1:
        if st.button("提交注释", type="primary"):
            if note_text.strip():
                success = add_appointment_note(
                    appointment_id,
                    note_text.strip(),
                    st.session_state.current_user
                )
                if success:
                    st.success("注释添加成功！")
                    st.rerun()
                else:
                    st.error("注释添加失败，请重试")
            else:
                st.warning("请输入注释内容")
