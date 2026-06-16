import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st
import polars as pl
from datetime import date, timedelta, datetime
import pandas as pd
import io
import json
import zipfile

from data_service import get_service
from data_models import (
    RISK_LEVELS, RISK_COLORS, calculate_training_completion_rule,
    PHYSICIANS, initialize_all_data
)
from database import get_db
from charts import (
    create_risk_monitor_chart,
    create_risk_distribution_chart,
    create_single_patient_trend,
    create_training_rate_chart,
    create_anomaly_summary_chart,
    create_heatmap_view
)


def auto_initialize_if_empty():
    db = get_db()
    conn = db.get_connection()
    try:
        result = conn.execute("SELECT COUNT(*) FROM patients").fetchone()
        if result[0] == 0:
            initialize_all_data()
            return True
    except Exception:
        initialize_all_data()
        return True
    return False


st.set_page_config(
    page_title="康复中心患者分级风险监测系统",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main .block-container {padding-top: 2rem;}
    .stMetric {background-color: #f8fafc; padding: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0;}
    .alert-warning {background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; border-left: 4px solid #f59e0b; margin: 0.5rem 0;}
    .alert-danger {background-color: #fee2e2; padding: 0.75rem; border-radius: 0.5rem; border-left: 4px solid #ef4444; margin: 0.5rem 0;}
    .alert-info {background-color: #dbeafe; padding: 0.75rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; margin: 0.5rem 0;}
    .alert-success {background-color: #dcfce7; padding: 0.75rem; border-radius: 0.5rem; border-left: 4px solid #22c55e; margin: 0.5rem 0;}
    div[data-testid="stMetricLabel"] p {font-size: 0.85rem; color: #64748b;}
    div[data-testid="stMetricValue"] {font-size: 1.75rem; font-weight: 700;}
</style>
""", unsafe_allow_html=True)


def render_alert(message: str, alert_type: str = "info"):
    classes = {
        "warning": "alert-warning",
        "danger": "alert-danger",
        "info": "alert-info",
        "success": "alert-success"
    }
    cls = classes.get(alert_type, "alert-info")
    st.markdown(f'<div class="{cls}">{message}</div>', unsafe_allow_html=True)


@st.cache_resource(show_spinner=False)
def get_cached_service():
    return get_service()


service = get_cached_service()


def render_sidebar_filters():
    with st.sidebar:
        st.header("🎛️ 监测参数设置")

        today = date.today()
        default_start = today - timedelta(days=60)

        st.subheader("📅 时间范围")
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("开始日期", default_start, key="start_date")
        with col2:
            end_date = st.date_input("结束日期", today, key="end_date")

        st.divider()
        st.subheader("🎚️ 风险筛选")

        risk_filter = st.multiselect(
            "风险等级",
            options=RISK_LEVELS,
            default=RISK_LEVELS,
            key="risk_filter"
        )

        diagnoses_list = service.get_diagnoses_list()
        diagnosis_filter = st.selectbox(
            "诊断类型",
            options=["全部"] + diagnoses_list,
            key="diagnosis_filter"
        )

        st.divider()
        st.subheader("👥 患者筛选")
        all_patients = service.get_all_patients()
        selected_patients = st.multiselect(
            "选择特定患者（留空=全部）",
            options=all_patients["patient_id"].to_list(),
            format_func=lambda x: f"{x} - {all_patients.filter(pl.col('patient_id') == x)['name'][0]}",
            key="patient_filter"
        )

        st.divider()
        st.subheader("📊 聚合方式")
        aggregate = st.selectbox(
            "趋势图聚合方式",
            options=["平均 (avg)", "最高 (max)", "最低 (min)"],
            index=0,
            key="aggregate_filter"
        )
        agg_map = {"平均 (avg)": "avg", "最高 (max)": "max", "最低 (min)": "min"}
        aggregate_mode = agg_map[aggregate]

        st.divider()
        st.subheader("🔄 数据刷新")
        if st.button("🔄 刷新数据", use_container_width=True, type="primary"):
            st.cache_data.clear()
            st.rerun()

        st.caption("注意：刷新时会同步标记收费表延迟、病历缺失和设备口径变化")

        diagnosis_param = None if diagnosis_filter == "全部" else diagnosis_filter

        return {
            "start_date": start_date,
            "end_date": end_date,
            "risk_filter": risk_filter,
            "diagnosis": diagnosis_param,
            "selected_patients": selected_patients if selected_patients else None,
            "aggregate": aggregate_mode
        }


def render_sync_status(filters):
    sync_status = service.get_sync_status()
    today = date.today()

    def to_date(val):
        if val is None:
            return None
        if hasattr(val, 'date'):
            return val.date()
        if hasattr(val, 'year') and hasattr(val, 'month') and hasattr(val, 'day'):
            return date(val.year, val.month, val.day)
        try:
            val_str = str(val)[:10]
            return date.fromisoformat(val_str)
        except (ValueError, TypeError):
            return None

    def calc_delay(val):
        d = to_date(val)
        if d is None:
            return 999
        return (today - d).days

    st.subheader("📡 数据同步状态")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        last_fee = to_date(sync_status.get("last_fee_table_sync"))
        fee_delay = calc_delay(sync_status.get("last_fee_table_sync"))
        fee_status = "正常" if fee_delay <= 1 else f"⚠️ 延迟 {fee_delay} 天"
        st.metric("收费表同步",
                  last_fee.strftime("%Y-%m-%d") if last_fee else "未知",
                  delta=fee_status,
                  delta_color="inverse" if fee_delay > 1 else "normal")

    with col2:
        last_med = to_date(sync_status.get("last_medical_record_sync"))
        med_delay = calc_delay(sync_status.get("last_medical_record_sync"))
        med_status = "正常" if med_delay <= 1 else f"⚠️ 延迟 {med_delay} 天"
        st.metric("病历系统同步",
                  last_med.strftime("%Y-%m-%d") if last_med else "未知",
                  delta=med_status,
                  delta_color="inverse" if med_delay > 1 else "normal")

    with col3:
        last_dev = to_date(sync_status.get("last_device_sync"))
        dev_delay = calc_delay(sync_status.get("last_device_sync"))
        dev_status = "正常" if dev_delay <= 3 else f"⚠️ {dev_delay} 天未同步"
        st.metric("康复设备同步",
                  last_dev.strftime("%Y-%m-%d") if last_dev else "未知",
                  delta=dev_status,
                  delta_color="inverse" if dev_delay > 3 else "normal")

    with col4:
        last_ins = to_date(sync_status.get("last_insurance_sync"))
        ins_delay = calc_delay(sync_status.get("last_insurance_sync"))
        ins_status = "正常" if ins_delay <= 2 else f"⚠️ 延迟 {ins_delay} 天"
        st.metric("医保系统同步",
                  last_ins.strftime("%Y-%m-%d") if last_ins else "未知",
                  delta=ins_status,
                  delta_color="inverse" if ins_delay > 2 else "normal")

    fee_delays = service.get_fee_delay_events(filters["start_date"], filters["end_date"])
    record_gaps = service.get_medical_record_gaps(filters["start_date"], filters["end_date"])
    device_changes = service.get_device_changes(filters["start_date"], filters["end_date"])

    if not fee_delays.is_empty() or not record_gaps.is_empty() or not device_changes.is_empty():
        st.markdown("---")
        st.markdown("**⚠️ 本周期内注意事项**")
        alerts_col1, alerts_col2, alerts_col3 = st.columns(3)

        with alerts_col1:
            if not fee_delays.is_empty():
                total_delay_days = fee_delays["delay_days"].sum()
                render_alert(
                    f"💰 收费表延迟 **{len(fee_delays)}** 次<br>累计延迟 **{total_delay_days}** 天<br>影响记录 **{fee_delays['affected_records'].sum()}** 条",
                    "warning"
                )
        with alerts_col2:
            if not record_gaps.is_empty():
                unresolved = record_gaps.filter(~pl.col("resolved")).height
                render_alert(
                    f"📋 病历系统缺失 **{len(record_gaps)}** 条<br>待处理 **{unresolved}** 条<br>涉及患者 **{record_gaps['patient_id'].n_unique()}** 人",
                    "danger"
                )
        with alerts_col3:
            if not device_changes.is_empty():
                affected = device_changes["affected_patients"].sum()
                render_alert(
                    f"🔧 康复设备口径变化 **{len(device_changes)}** 次<br>涉及 **{device_changes['device_id'].n_unique()}** 台设备<br>影响治疗 **{affected}** 人次",
                    "info"
                )


def render_overview_metrics(filters):
    patients = service.get_patient_summary(None, filters["diagnosis"])

    if filters["selected_patients"]:
        patients = patients.filter(pl.col("patient_id").is_in(filters["selected_patients"]))

    if filters["risk_filter"]:
        patients = patients.filter(pl.col("risk_level").is_in(filters["risk_filter"]))

    total = len(patients)
    high_risk = patients.filter(pl.col("risk_level").is_in(["高危", "中高危"])).height
    avg_score = round(patients["risk_score"].mean(), 1) if total > 0 else 0
    avg_training = round(patients["training_completion_rate"].mean(), 1) if total > 0 else 0

    m1, m2, m3, m4, m5 = st.columns(5)
    with m1:
        st.metric("在院患者总数", f"{total} 人")
    with m2:
        st.metric("高风险患者", f"{high_risk} 人", delta=f"{high_risk/total*100:.1f}%" if total > 0 else "0%")
    with m3:
        st.metric("平均风险评分", f"{avg_score}", delta=None)
    with m4:
        st.metric("平均训练完成率", f"{avg_training}%",
                  delta="优秀" if avg_training >= 90 else "良好" if avg_training >= 80 else "合格" if avg_training >= 70 else "待改进",
                  delta_color="normal" if avg_training >= 70 else "inverse")
    with m5:
        anomalies = service.get_anomaly_points(filters["start_date"], filters["end_date"], filters["selected_patients"])
        st.metric("周期内异常点", f"{len(anomalies)} 个",
                  delta=f"{anomalies['patient_id'].n_unique()} 人涉及")


def render_risk_monitor(filters):
    st.subheader("📈 康复中心患者分级风险监测图")

    trend = service.get_risk_trend(
        filters["start_date"], filters["end_date"],
        filters["selected_patients"], filters["aggregate"]
    )
    fee_delays = service.get_fee_delay_events(filters["start_date"], filters["end_date"])
    device_changes = service.get_device_changes(filters["start_date"], filters["end_date"])
    denial_periods = service.get_insurance_denial_periods(filters["start_date"], filters["end_date"])

    fig = create_risk_monitor_chart(trend, fee_delays, device_changes, denial_periods)
    st.plotly_chart(fig, use_container_width=True, config={"displaylogo": False})

    with st.expander("📖 图表说明与图例解读", expanded=False):
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            render_alert("<b>黄色阴影区</b><br>收费表延迟期间", "warning")
        with c2:
            render_alert("<b>紫色虚线</b><br>设备口径/校准变更", "info")
        with c3:
            render_alert("<b>红色阴影区</b><br>医保拒付高发期", "danger")
        with c4:
            render_alert("<b>黑色虚线</b><br>全体患者平均分走势", "success")

        st.markdown("""
        **风险评分区间：**
        - 🟢 0-20: 低危 | 🟡 20-40: 中低危 | 🟠 40-60: 中危 | 🔴 60-80: 中高危 | ⛔ 80-100: 高危

        **趋势异常判断提示：**
        - 收费表延迟期间分数可能异常偏高（延迟同步导致），标注时间后避免误判
        - 设备口径变化日需对比前后数据有效性
        - 医保拒付高峰期可能影响治疗计划执行，关注训练完成率
        """)


def render_risk_distribution_and_training(filters):
    col_left, col_right = st.columns([1, 1])

    with col_left:
        distribution = service.get_risk_level_distribution()
        fig_dist = create_risk_distribution_chart(distribution)
        st.plotly_chart(fig_dist, use_container_width=True, config={"displaylogo": False})

    with col_right:
        trend = service.get_risk_trend(
            filters["start_date"], filters["end_date"],
            filters["selected_patients"], "avg"
        )
        fig_training = create_training_rate_chart(trend)
        st.plotly_chart(fig_training, use_container_width=True, config={"displaylogo": False})


def render_insurance_analysis(filters):
    st.subheader("💰 医保拒付影响分析")

    denials = service.get_insurance_denials(filters["start_date"], filters["end_date"], None)
    denial_periods = service.get_insurance_denial_periods(filters["start_date"], filters["end_date"])

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("拒付总次数", f"{len(denials)} 次")
    with col2:
        total_amt = denials["denial_amount"].sum() if not denials.is_empty() else 0
        st.metric("拒付总金额", f"¥ {total_amt:,.2f}")
    with col3:
        affected = denials["patient_id"].n_unique() if not denials.is_empty() else 0
        st.metric("涉及患者", f"{affected} 人")
    with col4:
        appealed = denials.filter(pl.col("appealed")).height if not denials.is_empty() else 0
        appeal_rate = appealed / len(denials) * 100 if len(denials) > 0 else 0
        st.metric("申诉率", f"{appeal_rate:.1f}%", delta=f"{appealed}/{len(denials)}")

    if denial_periods:
        render_alert(
            f"⚠️ 检测到 **{len(denial_periods)}** 个医保拒付集中时段，可能对风险趋势产生影响",
            "warning"
        )

        st.markdown("**📅 医保拒付影响时间范围：**")
        for i, period in enumerate(denial_periods, 1):
            with st.container(border=True):
                pc1, pc2, pc3, pc4, pc5 = st.columns(5)
                with pc1:
                    st.markdown(f"**周期 {i}**")
                    st.markdown(f"📆 {period['start'].strftime('%Y-%m-%d')} ~ {period['end'].strftime('%Y-%m-%d')}")
                with pc2:
                    st.markdown("**持续天数**")
                    st.markdown(f"⏱️ {period['duration_days']} 天")
                with pc3:
                    st.markdown("**拒付次数**")
                    st.markdown(f"📋 {period['denial_count']} 次")
                with pc4:
                    st.markdown("**涉及患者**")
                    st.markdown(f"👥 {period['affected_patients']} 人")
                with pc5:
                    st.markdown("**涉及金额**")
                    st.markdown(f"💰 ¥ {period['total_amount']:,.2f}")

            st.info(
                f"💡 **分析建议：** 周期 {i} 期间的风险评分波动需结合医保拒付情况解读。"
                f"拒付可能导致治疗方案调整、患者心理压力增加，进而影响康复进度和风险评估。"
                f"建议对比拒付前后各 {min(7, period['duration_days'])} 天的训练完成率和风险评分变化。"
            )

    with st.expander("📋 拒付明细记录", expanded=False):
        if not denials.is_empty():
            display_cols = [
                "denial_date", "patient_name", "denial_code", "denial_reason",
                "denial_amount", "appealed", "appeal_result"
            ]
            display_renames = {
                "denial_date": "拒付日期", "patient_name": "患者姓名",
                "denial_code": "拒付编码", "denial_reason": "拒付原因",
                "denial_amount": "拒付金额", "appealed": "是否申诉",
                "appeal_result": "申诉结果"
            }
            df_display = denials.select(display_cols).rename(display_renames)
            st.dataframe(df_display.to_pandas(), use_container_width=True, hide_index=True)
        else:
            st.info("本周期内无医保拒付记录")


def render_patient_detail_view(filters):
    st.subheader("👤 单患者风险追踪与复盘")

    all_patients = service.get_all_patients()
    col_p1, col_p2 = st.columns([2, 1])

    with col_p1:
        selected_id = st.selectbox(
            "选择患者查看详细趋势",
            options=all_patients["patient_id"].to_list(),
            format_func=lambda x: f"{x} - {all_patients.filter(pl.col('patient_id') == x)['name'][0]} "
                                  f"[{all_patients.filter(pl.col('patient_id') == x)['risk_level'][0]}]",
            key="patient_detail_select"
        )

    if selected_id:
        patient_info = service.get_patient_summary().filter(pl.col("patient_id") == selected_id)
        if not patient_info.is_empty():
            info = patient_info.row(0, named=True)
            with col_p2:
                st.markdown(f"**姓名：** {info['name']}")
                st.markdown(f"**年龄/性别：** {info['age']}岁 / {info['gender']}")
                st.markdown(f"**诊断：** {info['primary_diagnosis']}")
                st.markdown(f"**主管医生：** {info['attending_physician']}")
                st.markdown(f"**入院日期：** {info['admission_date']}")

        detail_df = service.get_patient_risk_detail(selected_id, filters["start_date"], filters["end_date"])
        fee_delays = service.get_fee_delay_events(filters["start_date"], filters["end_date"])
        device_changes = service.get_device_changes(filters["start_date"], filters["end_date"])
        patient_name = info['name'] if not patient_info.is_empty() else selected_id

        fig_patient = create_single_patient_trend(detail_df, fee_delays, device_changes, patient_name)
        st.plotly_chart(fig_patient, use_container_width=True, config={"displaylogo": False})

        render_alert(
            "⭐ **异常点提示：** 图中红星标记为存在异常的日期点（收费延迟/病历缺失/设备校准/医保拒付）。"
            "将鼠标移至星标可查看具体异常类型。异常点下方关联复盘备注。",
            "info"
        )

        st.markdown("---")
        render_review_notes_section(selected_id, filters, detail_df)


def render_review_notes_section(patient_id: str, filters, detail_df):
    st.markdown("### 📝 复盘备注（关联异常点）")

    patient_notes = service.get_review_notes(
        patient_id=patient_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"]
    )

    anomaly_records = detail_df.filter(
        (~pl.col("fee_table_updated")) |
        (~pl.col("medical_record_complete")) |
        (~pl.col("device_calibration_current")) |
        (pl.col("insurance_denial"))
    )

    if not anomaly_records.is_empty():
        st.markdown(f"**本周期检测到 {len(anomaly_records)} 个异常点**")

        for row in anomaly_records.iter_rows(named=True):
            anomaly_types = []
            if not row["fee_table_updated"]:
                anomaly_types.append(("收费表延迟", "warning"))
            if not row["medical_record_complete"]:
                anomaly_types.append(("病历缺失", "danger"))
            if not row["device_calibration_current"]:
                anomaly_types.append(("设备口径变化", "info"))
            if row["insurance_denial"]:
                anomaly_types.append(("医保拒付", "danger"))

            related_note = None
            if not patient_notes.is_empty():
                note_match = patient_notes.filter(pl.col("related_record_id") == row["record_id"])
                if not note_match.is_empty():
                    related_note = note_match.row(0, named=True)

            with st.container(border=True):
                nc1, nc2 = st.columns([1, 3])

                with nc1:
                    st.markdown(f"**📅 {row['record_date'].strftime('%Y-%m-%d')}**")
                    st.markdown(f"**风险评分：** `{row['risk_score']}`")
                    badges_html = ""
                    for t, c in anomaly_types:
                        colors = {"warning": "#f59e0b", "danger": "#ef4444", "info": "#3b82f6"}
                        badges_html += f'<span style="background:{colors[c]};color:white;padding:2px 8px;border-radius:10px;font-size:12px;margin:2px;">{t}</span>'
                    st.markdown(badges_html, unsafe_allow_html=True)

                with nc2:
                    if related_note:
                        st.markdown(f"**✅ 已有复盘备注**")
                        st.markdown(f"**审核人：** {related_note['reviewer']} | **状态：** {'✅ 已解决' if related_note['resolved'] else '⏳ 处理中'}")
                        st.markdown(f"> 📝 {related_note['review_note']}")
                        st.markdown(f"**后续处理：** {related_note['follow_up_action']}")
                    else:
                        with st.expander(f"➕ 添加复盘备注 ({row['record_date'].strftime('%Y-%m-%d')})", expanded=False):
                            anomaly_str = "、".join([t for t, _ in anomaly_types])
                            with st.form(f"note_form_{row['record_id']}"):
                                f1, f2 = st.columns(2)
                                with f1:
                                    reviewer = st.selectbox("审核人", PHYSICIANS)
                                with f2:
                                    pass
                                desc = st.text_input("异常描述",
                                                     value=f"风险评分异常升高至{row['risk_score']}分",
                                                     disabled=True)
                                note = st.text_area("复盘备注", placeholder="请输入对该异常点的分析和说明...", height=80)
                                follow_up = st.text_input("后续处理措施", placeholder="持续监测、调整方案等...")
                                submitted = st.form_submit_button("💾 保存备注", type="primary")
                                if submitted and note:
                                    service.add_review_note(
                                        patient_id=patient_id,
                                        related_record_id=row["record_id"],
                                        note_date=row["record_date"],
                                        anomaly_type=anomaly_str,
                                        anomaly_description=desc,
                                        review_note=note,
                                        reviewer=reviewer,
                                        follow_up_action=follow_up
                                    )
                                    st.success("备注保存成功！")
                                    st.rerun()

    if not patient_notes.is_empty():
        with st.expander("📚 查看所有历史复盘备注", expanded=False):
            cols = ["note_date", "anomaly_type", "anomaly_description", "review_note",
                    "reviewer", "follow_up_action", "resolved"]
            renames = {
                "note_date": "日期", "anomaly_type": "异常类型",
                "anomaly_description": "异常描述", "review_note": "复盘备注",
                "reviewer": "审核人", "follow_up_action": "后续处理", "resolved": "已解决"
            }
            st.dataframe(patient_notes.select(cols).rename(renames).to_pandas(),
                         use_container_width=True, hide_index=True)


def render_common_views(filters):
    st.subheader("🔍 常用视图")

    tab1, tab2, tab3, tab4 = st.tabs(["📅 治疗日历", "⚙️ 器械状态", "📋 护理日志", "📊 异常统计"])

    with tab1:
        st.markdown("**治疗日历热力图 - 按治疗类型分布**")
        treatments = service.get_treatment_calendar(
            filters["start_date"], filters["end_date"],
            filters["selected_patients"]
        )
        fig_heatmap = create_heatmap_view(treatments, "每日治疗类型分布（次数）")
        st.plotly_chart(fig_heatmap, use_container_width=True, config={"displaylogo": False})

        with st.expander("📋 治疗明细列表", expanded=False):
            if not treatments.is_empty():
                status_filter = st.multiselect("治疗状态筛选",
                                               options=treatments["treatment_status"].unique().to_list(),
                                               default=treatments["treatment_status"].unique().to_list(),
                                               key="treat_status_filter")
                df_display = treatments
                if status_filter:
                    df_display = df_display.filter(pl.col("treatment_status").is_in(status_filter))
                cols = ["treatment_date", "patient_name", "treatment_type", "treatment_duration",
                        "therapist", "treatment_status", "device_id", "notes"]
                renames = {
                    "treatment_date": "日期", "patient_name": "患者",
                    "treatment_type": "治疗类型", "treatment_duration": "时长(分钟)",
                    "therapist": "治疗师", "treatment_status": "状态",
                    "device_id": "设备ID", "notes": "备注"
                }
                st.dataframe(df_display.select(cols).rename(renames).to_pandas(),
                             use_container_width=True, hide_index=True)

    with tab2:
        st.markdown("**康复设备利用率热力图**")
        devices = service.get_device_status(filters["start_date"], filters["end_date"])
        fig_device = create_heatmap_view(devices, "设备每日利用率 (%)")
        st.plotly_chart(fig_device, use_container_width=True, config={"displaylogo": False})

        st.markdown("---")
        st.markdown("**设备当前状态概览**")
        latest = service.get_latest_device_status()
        if not latest.is_empty():
            dcols = st.columns(len(DEVICE_TYPES := latest["device_name"].unique().to_list()))
            for idx, row in enumerate(latest.iter_rows(named=True)):
                with dcols[idx % len(dcols)]:
                    status_color = {
                        "正常运行": "#22c55e",
                        "维护中": "#f59e0b",
                        "校准中": "#3b82f6",
                        "故障": "#ef4444"
                    }.get(row["device_status"], "#9ca3af")
                    st.markdown(
                        f"""
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin:5px;">
                            <div style="font-weight:bold;font-size:14px;">{row['device_name']}</div>
                            <div style="font-size:12px;color:#64748b;">{row['device_id']}</div>
                            <div style="margin-top:8px;">
                                <span style="background:{status_color};color:white;padding:2px 10px;border-radius:10px;font-size:12px;">
                                    {row['device_status']}
                                </span>
                            </div>
                            <div style="margin-top:8px;font-size:13px;">
                                利用率: <b>{row['utilization_rate']}%</b>
                            </div>
                            <div style="font-size:12px;color:#64748b;">
                                {"⚠️ 校准到期 " if row['calibration_due'] else ""}
                                {"🔧 维护到期 " if row['maintenance_due'] else ""}
                                {"❌ 错误次数: " + str(row['error_count']) if row['error_count'] > 0 else ""}
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )

    with tab3:
        st.markdown("**护理记录班次统计**")
        nursing = service.get_nursing_logs(
            filters["start_date"], filters["end_date"],
            filters["selected_patients"]
        )
        fig_nursing = create_heatmap_view(nursing, "每日各班次护理记录数")
        st.plotly_chart(fig_nursing, use_container_width=True, config={"displaylogo": False})

        with st.expander("📋 护理记录明细", expanded=False):
            if not nursing.is_empty():
                shift_filter = st.multiselect("班次筛选", ["早班", "中班", "晚班"], default=["早班", "中班", "晚班"])
                df_n = nursing.filter(pl.col("shift").is_in(shift_filter)) if shift_filter else nursing
                cols = ["log_date", "patient_name", "shift", "nurse_name", "blood_pressure",
                        "heart_rate", "temperature", "oxygen_saturation", "pain_level", "notes"]
                renames = {
                    "log_date": "日期", "patient_name": "患者", "shift": "班次",
                    "nurse_name": "护士", "blood_pressure": "血压", "heart_rate": "心率",
                    "temperature": "体温", "oxygen_saturation": "血氧(%)",
                    "pain_level": "疼痛评分", "notes": "备注"
                }
                st.dataframe(df_n.select(cols).rename(renames).to_pandas(),
                             use_container_width=True, hide_index=True)

    with tab4:
        trend = service.get_risk_trend(
            filters["start_date"], filters["end_date"],
            filters["selected_patients"], "avg"
        )
        fig_anomaly = create_anomaly_summary_chart(trend)
        st.plotly_chart(fig_anomaly, use_container_width=True, config={"displaylogo": False})

        anomalies = service.get_anomaly_points(
            filters["start_date"], filters["end_date"], filters["selected_patients"]
        )
        with st.expander("⚠️ 异常点明细列表", expanded=True):
            if not anomalies.is_empty():
                cols = ["record_date", "patient_name", "risk_score", "anomaly_type",
                        "fee_table_updated", "medical_record_complete",
                        "device_calibration_current", "insurance_denial", "insurance_denial_amount"]
                renames = {
                    "record_date": "日期", "patient_name": "患者", "risk_score": "风险评分",
                    "anomaly_type": "异常类型", "fee_table_updated": "收费表已更新",
                    "medical_record_complete": "病历完整", "device_calibration_current": "设备校准正常",
                    "insurance_denial": "医保拒付", "insurance_denial_amount": "拒付金额"
                }
                st.dataframe(anomalies.select(cols).rename(renames).to_pandas(),
                             use_container_width=True, hide_index=True)


def render_download_section(filters):
    st.subheader("📥 数据下载中心")

    download_tabs = st.tabs([
        "风险趋势数据", "患者明细", "医保拒付分析", "异常事件汇总",
        "治疗日历", "设备状态", "护理日志", "复盘备注"
    ])

    training_rule = calculate_training_completion_rule()
    rule_text = json.dumps(training_rule, ensure_ascii=False, indent=2)

    def add_training_rule_readme(existing_files: dict) -> dict:
        readme = f"""# 训练完成率计算规则

{json.dumps(training_rule, ensure_ascii=False, indent=2)}

---
导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
时间范围: {filters['start_date']} ~ {filters['end_date']}
"""
        existing_files["TRAINING_COMPLETION_RULE.md"] = readme.encode("utf-8")
        return existing_files

    def create_zip_download(files: dict, filename: str, button_label: str):
        files = add_training_rule_readme(files)
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, data in files.items():
                zf.writestr(name, data)
        zip_buffer.seek(0)
        st.download_button(
            button_label,
            data=zip_buffer.getvalue(),
            file_name=filename,
            mime="application/zip",
            use_container_width=True,
            type="primary"
        )

    with download_tabs[0]:
        st.markdown("**患者分级风险趋势数据**")
        trend = service.get_risk_trend(
            filters["start_date"], filters["end_date"],
            filters["selected_patients"], filters["aggregate"]
        )
        if not trend.is_empty():
            csv_data = trend.write_csv()
            files = {"risk_trend.csv": csv_data.encode("utf-8")}
            create_zip_download(files, f"risk_trend_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载风险趋势数据 (ZIP, 含训练完成率规则)")

            st.dataframe(trend.to_pandas(), use_container_width=True, hide_index=True)

    with download_tabs[1]:
        st.markdown("**患者风险明细清单**")
        patients = service.get_patient_summary(None, filters["diagnosis"])
        if filters["selected_patients"]:
            patients = patients.filter(pl.col("patient_id").is_in(filters["selected_patients"]))
        if filters["risk_filter"]:
            patients = patients.filter(pl.col("risk_level").is_in(filters["risk_filter"]))

        if not patients.is_empty():
            csv_data = patients.write_csv()
            files = {"patient_risk_details.csv": csv_data.encode("utf-8")}
            create_zip_download(files, f"patient_risk_{date.today()}.zip",
                                "📥 下载患者明细 (ZIP)")
            st.dataframe(patients.to_pandas(), use_container_width=True, hide_index=True)

    with download_tabs[2]:
        st.markdown("**医保拒付分析报告**")
        denials = service.get_insurance_denials(filters["start_date"], filters["end_date"])
        periods = service.get_insurance_denial_periods(filters["start_date"], filters["end_date"])
        if not denials.is_empty():
            files = {
                "insurance_denials.csv": denials.write_csv().encode("utf-8"),
                "denial_periods.json": json.dumps(
                    [{**p, "start": str(p["start"]), "end": str(p["end"])} for p in periods],
                    ensure_ascii=False, indent=2
                ).encode("utf-8")
            }
            create_zip_download(files, f"insurance_analysis_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载医保拒付数据 (ZIP)")
            st.dataframe(denials.to_pandas(), use_container_width=True, hide_index=True)

    with download_tabs[3]:
        st.markdown("**异常事件汇总报告**")
        anomalies = service.get_anomaly_points(filters["start_date"], filters["end_date"], filters["selected_patients"])
        fee_delays = service.get_fee_delay_events(filters["start_date"], filters["end_date"])
        record_gaps = service.get_medical_record_gaps(filters["start_date"], filters["end_date"])
        device_changes = service.get_device_changes(filters["start_date"], filters["end_date"])

        files = {
            "anomaly_points.csv": anomalies.write_csv().encode("utf-8") if not anomalies.is_empty() else "无数据".encode(),
            "fee_table_delays.csv": fee_delays.write_csv().encode("utf-8") if not fee_delays.is_empty() else "无数据".encode(),
            "medical_record_gaps.csv": record_gaps.write_csv().encode("utf-8") if not record_gaps.is_empty() else "无数据".encode(),
            "device_calibration_changes.csv": device_changes.write_csv().encode("utf-8") if not device_changes.is_empty() else "无数据".encode()
        }
        create_zip_download(files, f"anomaly_report_{filters['start_date']}_{filters['end_date']}.zip",
                            "📥 下载异常事件汇总 (ZIP)")

    with download_tabs[4]:
        treatments = service.get_treatment_calendar(
            filters["start_date"], filters["end_date"], filters["selected_patients"]
        )
        if not treatments.is_empty():
            files = {"treatment_calendar.csv": treatments.write_csv().encode("utf-8")}
            create_zip_download(files, f"treatment_calendar_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载治疗日历 (ZIP)")

    with download_tabs[5]:
        devices = service.get_device_status(filters["start_date"], filters["end_date"])
        if not devices.is_empty():
            files = {"device_status.csv": devices.write_csv().encode("utf-8")}
            create_zip_download(files, f"device_status_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载设备状态 (ZIP)")

    with download_tabs[6]:
        nursing = service.get_nursing_logs(
            filters["start_date"], filters["end_date"], filters["selected_patients"]
        )
        if not nursing.is_empty():
            files = {"nursing_logs.csv": nursing.write_csv().encode("utf-8")}
            create_zip_download(files, f"nursing_logs_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载护理日志 (ZIP)")

    with download_tabs[7]:
        notes = service.get_review_notes(
            patient_id=filters["selected_patients"][0] if filters["selected_patients"] else None,
            start_date=filters["start_date"], end_date=filters["end_date"]
        )
        if not notes.is_empty():
            files = {"review_notes.csv": notes.write_csv().encode("utf-8")}
            create_zip_download(files, f"review_notes_{filters['start_date']}_{filters['end_date']}.zip",
                                "📥 下载复盘备注 (ZIP)")
        else:
            st.info("暂无复盘备注数据")

    with st.expander("📖 查看训练完成率计算规则详情", expanded=False):
        rule = calculate_training_completion_rule()
        st.markdown(f"#### {rule['规则说明']}")
        st.markdown(f"**计算公式：** `{rule['计算公式']}`")
        c1, c2 = st.columns(2)
        with c1:
            st.markdown("**定义说明：**")
            st.markdown(f"- 计划治疗项目数：{rule['计划治疗项目数定义']}")
            st.markdown(f"- 实际完成治疗项目数：{rule['实际完成治疗项目数定义']}")
        with c2:
            st.markdown("**考核标准：**")
            for s in rule['考核标准']:
                st.markdown(f"- {s}")
        st.markdown("**不计入的情况：**")
        for item in rule['不计入的情况']:
            st.markdown(f"- ❌ {item}")
        st.markdown("**数据来源：**")
        for item in rule['数据来源']:
            st.markdown(f"- 📊 {item}")
        st.markdown("**注意事项：**")
        for item in rule['注意事项']:
            st.markdown(f"- ⚠️ {item}")


def main():
    initialized = auto_initialize_if_empty()
    if initialized:
        st.success("✅ 首次启动，已自动初始化模拟数据！")

    st.title("🏥 康复中心患者分级风险监测系统")
    st.caption("工程选型: Streamlit + Polars + DuckDB + MinIO | 实时监测患者风险分级与异常事件")

    filters = render_sidebar_filters()

    if filters["start_date"] > filters["end_date"]:
        st.error("❌ 开始日期不能晚于结束日期！")
        return

    st.markdown("---")
    render_sync_status(filters)

    st.markdown("---")
    render_overview_metrics(filters)

    st.markdown("---")
    render_risk_monitor(filters)

    st.markdown("---")
    render_risk_distribution_and_training(filters)

    st.markdown("---")
    render_insurance_analysis(filters)

    st.markdown("---")
    render_patient_detail_view(filters)

    st.markdown("---")
    render_common_views(filters)

    st.markdown("---")
    render_download_section(filters)

    st.markdown("---")
    st.caption(
        "© 2025 康复中心患者分级风险监测系统 | 数据更新时间: "
        f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        " | 如有疑问请联系系统管理员"
    )


if __name__ == "__main__":
    main()
