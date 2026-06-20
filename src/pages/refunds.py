import streamlit as st
import pandas as pd
from datetime import datetime
from src.data.queries import Queries


REFUND_STATUS_COLORS = {
    "completed": "background-color: #D1FAE5; color: #065F46",
    "disputed": "background-color: #FEE2E2; color: #991B1B",
    "processing": "background-color: #FEF3C7; color: #92400E",
    "rejected": "background-color: #E5E7EB; color: #374151"
}

REFUND_STATUS_LABELS = {
    "completed": "✅ 已完成",
    "disputed": "🔴 争议中",
    "processing": "🟡 处理中",
    "rejected": "⬜ 已拒绝"
}


def render_refunds():
    st.markdown("## 💸 退票争议管理")
    queries = Queries()

    refunds = queries.get_refund_list()
    refunds_df = refunds.to_pandas()

    if len(refunds_df) == 0:
        st.info("暂无退票记录")
        return

    total_refunds = len(refunds_df)
    disputed = len(refunds_df[refunds_df["refund_status"] == "disputed"])
    completed = len(refunds_df[refunds_df["refund_status"] == "completed"])
    total_amount = refunds_df["refund_amount"].sum()

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("退票总数", f"{total_refunds} 笔")
    with col2:
        st.metric(
            "争议中",
            f"{disputed} 笔",
            delta=f"占 {disputed/total_refunds*100:.1f}%",
            delta_color="inverse"
        )
    with col3:
        st.metric("已完成", f"{completed} 笔")
    with col4:
        st.metric("退票总金额", f"¥{total_amount:,.2f}")

    st.markdown("---")

    status_filter = st.multiselect(
        "按状态筛选",
        options=refunds_df["refund_status"].unique(),
        default=refunds_df["refund_status"].unique(),
        format_func=lambda x: REFUND_STATUS_LABELS.get(x, x),
        key="refund_status_filter"
    )

    if status_filter:
        refunds_df = refunds_df[refunds_df["refund_status"].isin(status_filter)]

    st.markdown("### 📋 退票清单")

    for _, refund in refunds_df.iterrows():
        status_color = REFUND_STATUS_COLORS.get(refund["refund_status"], "")
        status_label = REFUND_STATUS_LABELS.get(refund["refund_status"], refund["refund_status"])

        with st.expander(
            f"{status_label}  |  {refund['refund_id']}  |  "
            f"{refund['attendee_name']}  |  ¥{refund['refund_amount']:.2f}  |  "
            f"{refund['refund_reason']}",
            expanded=(refund["refund_status"] == "disputed")
        ):
            col_info, col_notes = st.columns([1, 1])

            with col_info:
                st.markdown("#### 📄 退票详情")
                st.markdown(f"- **退票ID**: {refund['refund_id']}")
                st.markdown(f"- **报名ID**: {refund['registration_id']}")
                st.markdown(f"- **持票人**: {refund['attendee_name']}")
                st.markdown(f"- **票种**: {refund['ticket_type']}")
                st.markdown(f"- **退票金额**: ¥{refund['refund_amount']:.2f}")
                st.markdown(f"- **退票原因**: {refund['refund_reason']}")
                st.markdown(f"- **申请时间**: {refund['request_time']}")
                if refund["resolved_time"]:
                    st.markdown(f"- **解决时间**: {refund['resolved_time']}")
                st.markdown(f"- **备注数**: {refund['note_count']} 条")

                st.markdown("#### 🔗 追溯到票务平台原始记录")
                st.caption(
                    f"支付流水: https://ticket-platform.example.com/payment/{refund['registration_id']}\n\n"
                    f"退票记录: https://ticket-platform.example.com/refund/{refund['refund_id']}"
                )

            with col_notes:
                st.markdown("#### 📝 处理备注")

                notes = queries.get_refund_notes(refund["refund_id"]).to_pandas()

                if len(notes) > 0:
                    for _, note in notes.iterrows():
                        note_bg = "#D1FAE5" if note["is_resolution"] else "#F3F4F6"
                        note_border = "border-left: 4px solid #10B981;" if note["is_resolution"] else "border-left: 4px solid #9CA3AF;"
                        st.markdown(
                            f"""
                            <div style="padding: 10px; margin: 5px 0; background: {note_bg};
                                {note_border} border-radius: 4px;">
                                <div style="font-size: 0.9em; color: #6B7280; margin-bottom: 4px;">
                                    {note['created_by']} · {note['created_at']}
                                    {'✅ 结论' if note['is_resolution'] else ''}
                                </div>
                                <div>{note['note_content']}</div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )
                else:
                    st.info("暂无备注")

                st.markdown("---")

                with st.form(f"note_form_{refund['refund_id']}"):
                    new_note = st.text_area(
                        "新增备注",
                        placeholder="输入处理备注...",
                        height=80,
                        key=f"note_text_{refund['refund_id']}"
                    )
                    is_resolution = st.checkbox(
                        "标记为处理结论",
                        key=f"is_resolution_{refund['refund_id']}"
                    )
                    operator = st.text_input(
                        "操作人",
                        value="当前用户",
                        key=f"operator_{refund['refund_id']}"
                    )

                    submitted = st.form_submit_button("提交备注")
                    if submitted and new_note.strip():
                        note_id = queries.add_refund_note(
                            refund["refund_id"],
                            new_note.strip(),
                            operator,
                            is_resolution
                        )
                        st.success(f"备注已添加！ID: {note_id[:8]}...")
                        st.rerun()

    st.markdown("---")
    st.markdown("### 📊 退票原因分布")

    reason_counts = refunds_df["refund_reason"].value_counts().reset_index()
    reason_counts.columns = ["原因", "数量"]

    import plotly.express as px
    fig = px.bar(
        reason_counts,
        x="原因",
        y="数量",
        color="数量",
        color_continuous_scale="Reds",
        title="退票原因统计"
    )
    fig.update_layout(height=300)
    st.plotly_chart(fig, use_container_width=True)

    with st.expander("💡 退票争议复盘结论", expanded=True):
        disputed_count = len(refunds_df[refunds_df["refund_status"] == "disputed"])
        if disputed_count > 0:
            st.error(
                f"⚠️ 当前有 {disputed_count} 笔退票争议待处理。"
                f"建议优先处理金额较大或时间较久的争议单，避免用户投诉升级。"
            )
        else:
            st.success("✅ 所有退票均已处理，暂无争议。")

        top_reason = reason_counts.iloc[0]["原因"] if len(reason_counts) > 0 else "无"
        st.info(
            f"📌 主要退票原因：{top_reason}。"
            f"建议在下一次活动中针对该原因优化购票规则或活动说明。"
        )
