"""
复诊率明细页面
一线人员视角 - 只查看自己负责范围内的复诊率明细
支持爽约注释、状态变更功能
"""
import streamlit as st
import polars as pl
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_processor import (
    get_revisit_risk_overview,
    get_revisit_rate_by_doctor,
    add_appointment_note,
    update_appointment_status,
    get_appointment_notes,
    get_last_update_time,
    PermissionDeniedError
)
from src.config import Config


def show_details():
    """展示明细页面"""
    role = st.session_state.current_role
    current_user = st.session_state.current_user

    if role == "frontline":
        st.title("📋 我的复诊明细")
        st.info(f"仅展示 **{current_user}** 负责的会员复诊数据")
        try:
            df = get_revisit_risk_overview(doctor_filter=current_user, current_user=current_user, role=role)
        except PermissionDeniedError as e:
            st.error(f"权限错误: {e}")
            return
    else:
        st.title("📋 复诊率明细")
        st.info("管理层可查看所有医生的明细数据")
        df = get_revisit_risk_overview()

    last_update = get_last_update_time()
    if last_update:
        st.caption(f"最后更新时间: {last_update.strftime('%Y-%m-%d %H:%M:%S')}")

    if df.is_empty():
        st.warning("暂无数据")
        return

    _show_personal_metrics(df, role, current_user)

    st.markdown("---")

    _show_revisit_details(df, role, current_user)

    st.markdown("---")

    _show_detail_actions(role, current_user)


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

        col1, col2, col3, col4, col5 = st.columns(5)

        with col1:
            st.metric("总预约数", total)
        with col2:
            st.metric("复诊率", f"{revisit_rate}%")
        with col3:
            st.metric("待复诊", pending)
        with col4:
            st.metric("爽约数", missed, delta_color="inverse")
        with col5:
            st.metric("高风险", high_risk, delta_color="inverse")

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


def _show_revisit_details(df: pl.DataFrame, role: str, current_user: str):
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
            index=0,
            key="detail_doctor_filter"
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
        },
        key="detail_dataframe"
    )

    if event.selection.rows:
        selected_idx = event.selection.rows[0]
        if selected_idx < len(filtered_df):
            selected_row = filtered_df[selected_idx]
            st.session_state.selected_appointment = selected_row["appointment_id"][0]
            st.session_state.selected_patient = selected_row["patient_name"][0]
            st.session_state.selected_status = selected_row["status"][0]
            st.session_state.selected_risk = selected_row["risk_level"][0]


def _show_detail_actions(role: str, current_user: str):
    """展示详情操作区域 - 注释和状态变更"""
    st.subheader("📝 预约详情与操作")

    if "selected_appointment" not in st.session_state or not st.session_state.selected_appointment:
        st.info("请在上方列表中选择一条预约记录进行操作")
        return

    appointment_id = st.session_state.selected_appointment
    patient_name = st.session_state.selected_patient
    status = st.session_state.selected_status

    with st.container(border=True):
        col_info, col_status = st.columns([2, 1])
        with col_info:
            st.markdown(f"**患者**: {patient_name}")
            st.markdown(f"**预约ID**: {appointment_id}")
        with col_status:
            status_color = "🔴" if status == "爽约" else "🟡" if status == "待复诊" else "🟢"
            st.markdown(f"**当前状态**: {status_color} {status}")

    tab1, tab2 = st.tabs(["注释记录", "状态变更"])

    with tab1:
        _show_notes_tab(appointment_id, current_user)

    with tab2:
        _show_status_tab(appointment_id, status, current_user)


def _show_notes_tab(appointment_id: str, current_user: str):
    """注释标签页"""
    try:
        notes = get_appointment_notes(appointment_id)
    except Exception as e:
        st.error(f"加载注释失败: {e}")
        return

    if not notes.is_empty():
        st.markdown("**历史注释:**")
        for row in notes.iter_rows(named=True):
            with st.chat_message(name=row["created_by"], avatar="👤"):
                st.markdown(f"*{row['created_at']}*")
                st.write(row["note_text"])
    else:
        st.info("暂无注释记录")

    st.markdown("---")
    st.markdown("**添加新注释:**")

    note_text = st.text_area(
        "注释内容",
        placeholder="请输入爽约原因、跟进情况或其他备注信息...",
        height=80,
        key="new_note_input"
    )

    col1, col2, col3 = st.columns([1, 1, 3])
    with col1:
        update_risk = st.checkbox("标记高风险", value=True, key="note_update_risk")
    with col2:
        if st.button("提交注释", type="primary", key="submit_note_btn"):
            if not note_text or not note_text.strip():
                st.warning("请输入注释内容")
            else:
                result = add_appointment_note(
                    appointment_id,
                    note_text.strip(),
                    current_user,
                    update_risk=update_risk,
                    new_risk_level="high" if update_risk else None
                )
                if result.get("success"):
                    msg = result["message"]
                    if result.get("risk_updated"):
                        msg += "（风险等级已更新为高风险）"
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(result.get("message", "注释添加失败"))


def _show_status_tab(appointment_id: str, current_status: str, current_user: str):
    """状态变更标签页"""
    st.markdown(f"**当前状态**: {current_status}")

    valid_transitions = {
        "待复诊": ["已完成", "爽约", "已取消"],
        "爽约": ["待复诊", "已完成", "已取消"],
        "已完成": ["待复诊"],
        "已取消": ["待复诊"],
        "进行中": ["已完成", "已取消"]
    }

    available_statuses = valid_transitions.get(current_status, [])

    if not available_statuses:
        st.info("当前状态不支持变更")
        return

    st.markdown("**可变更为:**")

    new_status = st.selectbox(
        "目标状态",
        options=available_statuses,
        key="status_change_select"
    )

    note_text = st.text_area(
        "变更说明（可选）",
        placeholder="请输入状态变更的原因或说明...",
        height=60,
        key="status_change_note"
    )

    status_info = {
        "已完成": ("🟢", "正常"),
        "待复诊": ("🟡", "保持原等级"),
        "爽约": ("🔴", "自动标记为高风险"),
        "已取消": ("⚪", "保持原等级"),
        "进行中": ("🔵", "保持原等级")
    }

    if new_status in status_info:
        icon, risk_info = status_info[new_status]
        st.caption(f"{icon} 变更后风险等级: {risk_info}")

    if st.button("确认变更", type="primary", key="confirm_status_change"):
        result = update_appointment_status(
            appointment_id,
            new_status,
            current_user,
            note_text if note_text.strip() else None
        )
        if result.get("success"):
            st.success(result["message"])
            st.session_state.selected_status = new_status
            st.rerun()
        else:
            st.error(result.get("message", "状态变更失败"))
