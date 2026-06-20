from __future__ import annotations

import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

import streamlit as st
import polars as pl

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole, ROLE_LABELS
from src.ui.charts import style_dataframe, metric_card, status_badge, safe_drop_columns, safe_select_columns
from src.data.database import db


STATUS_LABELS = {
    "pending": ("待处理", "warning"),
    "processing": ("处理中", "warning"),
    "resolved": ("已解决", "success"),
    "rejected": ("已拒绝", "neutral"),
    "closed": ("已关闭", "neutral"),
}

TASK_STATUS_LABELS = {
    "pending": ("待执行", "warning"),
    "in_progress": ("进行中", "warning"),
    "completed": ("已完成", "success"),
    "cancelled": ("已取消", "error"),
}

PRIORITY_LABELS = {
    "high": ("高", "error"),
    "normal": ("中", "warning"),
    "low": ("低", "success"),
}


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def render_disputes_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    if not permission_manager.can_view_disputes(role):
        st.error("🔒 您无权限查看退票争议数据")
        return

    st.markdown("## ⚖️ 退票争议管理")
    st.caption("退票争议审核、任务分派、处理结论记录，关联票种核销原始数据")

    disputes_df = analytics.get_refund_disputes()
    tasks_sql = f"""
    SELECT
        nt.task_id, nt.dispute_id, nt.ticket_id,
        nt.task_type, nt.task_content, nt.priority,
        nt.assigned_to, nt.task_status, nt.due_date,
        nt.created_by, nt.created_at, nt.updated_at, nt.completed_at,
        COUNT(rd.dispute_id) as dispute_exists
    FROM notes_tasks nt
    LEFT JOIN refund_disputes rd ON nt.dispute_id = rd.dispute_id
    {f"WHERE nt.event_id = '{event_id}'" if event_id else ""}
    GROUP BY nt.task_id, nt.dispute_id, nt.ticket_id, nt.task_type, nt.task_content,
             nt.priority, nt.assigned_to, nt.task_status, nt.due_date,
             nt.created_by, nt.created_at, nt.updated_at, nt.completed_at
    ORDER BY nt.created_at DESC
    """
    tasks_df = db.query_to_df(tasks_sql)

    c1, c2, c3, c4, c5 = st.columns(5)
    total = disputes_df.height
    pending = disputes_df.filter(pl.col("dispute_status") == "pending").height if total else 0
    processing = disputes_df.filter(pl.col("dispute_status") == "processing").height if total else 0
    resolved = disputes_df.filter(pl.col("dispute_status") == "resolved").height if total else 0
    rejected = disputes_df.filter(pl.col("dispute_status") == "rejected").height if total else 0
    c1.metric("争议总数", total)
    c2.metric("⏳ 待处理", pending)
    c3.metric("🔄 处理中", processing)
    c4.metric("✅ 已解决", resolved)
    c5.metric("⛔ 已拒绝", rejected)

    if total > 0:
        total_amount = float(disputes_df["ticket_price"].sum() or 0)
        st.caption(f"涉及票款总额：¥{total_amount:,.2f}")

    st.divider()

    tab_list, tab_create, tab_tasks = st.tabs(["📋 争议列表", "➕ 新建争议", "📝 任务看板"])

    with tab_list:
        st.markdown("### 争议列表")
        sf1, sf2 = st.columns(2)
        with sf1:
            status_filter = st.multiselect(
                "按状态筛选",
                ["pending", "processing", "resolved", "rejected", "closed"],
                format_func=lambda x: STATUS_LABELS.get(x, (x, "neutral"))[0],
                default=[],
                key="disp_status_filter",
            )
        with sf2:
            assigned_filter = st.multiselect(
                "按处理人筛选",
                options=disputes_df["assigned_to"].drop_nulls().unique().to_list()
                if disputes_df.height > 0 else [],
                default=[],
                key="disp_assigned_filter",
            )

        display_df = disputes_df
        if status_filter:
            display_df = display_df.filter(pl.col("dispute_status").is_in(status_filter))
        if assigned_filter:
            display_df = display_df.filter(pl.col("assigned_to").is_in(assigned_filter))

        display_df = display_df.with_columns(
            pl.col("dispute_status").map_elements(
                lambda x: status_badge(*STATUS_LABELS.get(x, (x, "neutral"))),
                return_dtype=str,
            ).alias("状态"),
        )

        masked = permission_manager.mask_sensitive_data(display_df, "refund_disputes", role)
        show_cols = [c for c in [
            "状态", "dispute_type", "dispute_reason", "applicant_name",
            "assigned_to", "filed_time", "deadline", "related_tasks",
            "conclusion", "dispute_id", "ticket_id",
        ] if c in masked.columns]
        display_final = safe_drop_columns(
            masked.select(show_cols).rename({
                "dispute_type": "争议类型",
                "dispute_reason": "争议原因",
                "applicant_name": "申请人",
                "assigned_to": "处理人",
                "filed_time": "申请时间",
                "deadline": "截止时间",
                "related_tasks": "关联任务数",
                "conclusion": "处理结论",
            }),
            ["dispute_id", "ticket_id"],
        )

        style_dataframe(display_final, height=380)

        st.markdown("---")
        if masked.height > 0:
            st.markdown("### 🧾 争议详情")
            disp_options = [
                (r.get("dispute_id", ""), f"{STATUS_LABELS.get(r.get('dispute_status'), (r.get('dispute_status'), 'n'))[0]} | {r.get('争议类型') or r.get('dispute_type')} | {r.get('applicant_name', '?')} | {r.get('filed_time', '?')}")
                for r in masked.iter_rows(named=True)
            ]
            disp_opts_valid = [(id_, lbl) for id_, lbl in disp_options if id_]
            if disp_opts_valid:
                disp_idx = st.selectbox(
                    "选择争议查看详情",
                    range(len(disp_opts_valid)),
                    format_func=lambda i: disp_opts_valid[i][1],
                    key="disp_detail_sel",
                )
                disp_id = disp_opts_valid[disp_idx][0]
                _render_dispute_detail(disp_id, role, event_id)

    with tab_create:
        _render_create_dispute_form(event_id, role)

    with tab_tasks:
        _render_tasks_board(tasks_df, disputes_df, role, event_id)

    st.divider()
    st.markdown("### 📊 处理结论库（所有图表通用）")
    _render_conclusions_panel(event_id, role)


def _render_dispute_detail(dispute_id: str, role: UserRole, event_id: Optional[str]) -> None:
    sql = f"""
    SELECT rd.*, t.ticket_code, t.attendee_name, t.seat_info, t.final_price as ticket_price,
           t.ticket_status, t.payment_status, t.refund_status, t.purchase_time,
           o.order_id, o.buyer_name, o.final_amount, o.order_status, o.order_source,
           p.payment_method, p.transaction_id, p.payment_time, p.refund_amount, p.refund_time
    FROM refund_disputes rd
    LEFT JOIN tickets t ON rd.ticket_id = t.ticket_id
    LEFT JOIN orders o ON rd.order_id = o.order_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE rd.dispute_id = '{dispute_id}'
    LIMIT 1
    """
    detail = db.query_to_df(sql)
    if detail.height == 0:
        st.warning("未找到该争议详情")
        return

    d = detail.row(0, named=True)

    status_label, status_type = STATUS_LABELS.get(d.get("dispute_status"), (d.get("dispute_status", ""), "neutral"))

    c_stat, c_type, c_dl = st.columns(3)
    c_stat.markdown(f"**当前状态**：{status_badge(status_label, status_type)}", unsafe_allow_html=True)
    c_type.markdown(f"**争议类型**：{d.get('dispute_type') or '-'}")
    c_dl.markdown(f"**处理截止**：{d.get('deadline') or '-'}")

    left, right = st.columns(2)
    with left:
        st.markdown("#### 👤 申请信息")
        if permission_manager.can_view_sensitive(role, "refund_disputes", "applicant_name"):
            st.markdown(f"- **申请人**：{d.get('applicant_name')}")
            st.markdown(f"- **联系方式**：{d.get('applicant_contact')}")
        else:
            st.markdown("- **申请人/联系方式**：🔒 无权限")
        st.markdown(f"- **申请时间**：{d.get('filed_time')}")
        st.markdown(f"- **处理人**：{d.get('assigned_to') or '未分派'}")

        st.markdown("#### 🎟️ 关联票务")
        if permission_manager.can_view_sensitive(role, "tickets", "ticket_code"):
            st.markdown(f"- **票码**：`{d.get('ticket_code')}`")
        else:
            st.markdown("- **票码**：🔒 无权限")
        st.markdown(f"- **持票人**：{d.get('attendee_name') or '-'}")
        st.markdown(f"- **票款金额**：¥{d.get('ticket_price') or 0}")
        st.markdown(f"- **座位**：{d.get('seat_info') or '-'}")
        st.markdown(f"- **票据状态**：{d.get('ticket_status')}")
        st.markdown(f"- **退票状态**：{d.get('refund_status')}")

    with right:
        st.markdown("#### 📝 争议原因")
        st.info(d.get("dispute_reason") or "未填写")

        st.markdown("#### 💰 支付/退款信息")
        if permission_manager.can_view_sensitive(role, "payments", "transaction_id"):
            st.markdown(f"- **支付方式**：{d.get('payment_method') or '-'}")
            st.markdown(f"- **交易号**：`{d.get('transaction_id') or '-'}`")
            st.markdown(f"- **支付时间**：{d.get('payment_time') or '-'}")
        else:
            st.markdown("- **交易流水**：🔒 无权限（需票务权限）")
        refund = d.get("refund_amount") or 0
        if refund:
            st.success(f"- **已退款**：¥{refund} ({d.get('refund_time') or '-'})")
        else:
            st.warning("- 暂无退款记录")

    st.markdown("---")
    st.markdown("#### ✅ 处理记录与结论")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**解决方案**")
        st.success(d.get("resolution") or "暂未录入解决方案")
    with col2:
        st.markdown("**最终结论**")
        if d.get("conclusion"):
            st.info(d["conclusion"])
        else:
            st.warning("暂无处理结论")

    st.markdown("---")
    st.markdown("#### 🎯 关联核销记录（用于判断是否入场）")
    ticket_id = d.get("ticket_id")
    if ticket_id:
        gate_sql = f"""
        SELECT record_id, gate_name, check_in_time, check_out_time, check_status, fail_reason,
               staff_id, device_info, raw_payload
        FROM gate_records
        WHERE ticket_id = '{ticket_id}'
        ORDER BY check_in_time DESC
        LIMIT 20
        """
        gate_recs = db.query_to_df(gate_sql)
        if gate_recs.height == 0:
            st.info("该票无闸机核销记录，可能未入场")
        else:
            success_count = gate_recs.filter(pl.col("check_status") == "success").height
            if success_count > 0:
                st.error(f"⚠️ 检测到该票存在 {success_count} 条成功核销记录！（需与用户核实）")
            else:
                st.info(f"共 {gate_recs.height} 条闸机记录，无成功入场记录")

            gate_display = gate_recs.with_columns(
                pl.col("check_status").map_elements(
                    lambda x: status_badge(*STATUS_LABELS.get(x, (x, "neutral")) if x in STATUS_LABELS else (x, "success" if x == "success" else "error")),
                    return_dtype=str,
                ).alias("结果")
            )
            style_dataframe(
                safe_drop_columns(gate_display, ["device_info", "raw_payload"]),
                height=220,
            )

    with st.expander("📋 更新争议状态或结论", expanded=False):
        new_status = st.selectbox(
            "更新状态",
            ["pending", "processing", "resolved", "rejected", "closed"],
            format_func=lambda x: STATUS_LABELS.get(x, (x, "n"))[0],
            index=max(0, list(STATUS_LABELS.keys()).index(d.get("dispute_status", "pending")) if d.get("dispute_status") in STATUS_LABELS else 0),
            key="disp_upd_status",
        )
        new_assignee = st.text_input("处理人", value=d.get("assigned_to") or "", key="disp_upd_assignee")
        new_resolution = st.text_area("解决方案", value=d.get("resolution") or "", height=100, key="disp_upd_res")
        new_conclusion = st.text_area("最终结论", value=d.get("conclusion") or "", height=120, key="disp_upd_con")
        if st.button("💾 保存更新", type="primary", key="save_dispute_upd"):
            now = datetime.now()
            resolution_time_sql = ", resolution_time = ?" if new_status in ["resolved", "rejected", "closed"] and not d.get("resolution_time") else ""
            params = [new_status, new_assignee, new_resolution, new_conclusion, now]
            if resolution_time_sql:
                params.insert(-1, now)
            params.append(dispute_id)
            update_sql = f"""
            UPDATE refund_disputes
            SET dispute_status = ?, assigned_to = ?, resolution = ?, conclusion = ?, updated_at = CURRENT_TIMESTAMP
            {resolution_time_sql}
            WHERE dispute_id = ?
            """
            db.execute(update_sql, tuple(params))
            st.success("✅ 更新成功！")
            st.rerun()


def _render_create_dispute_form(event_id: Optional[str], role: UserRole) -> None:
    st.markdown("### ➕ 新建退票争议")
    st.info("用户或客服发起退票争议时，填写以下信息后系统会自动分派相关任务")

    with st.form("create_dispute_form", clear_on_submit=False):
        c1, c2 = st.columns(2)
        with c1:
            disp_type = st.selectbox("争议类型", [
                "退票审核争议", "核销状态不符", "重复扣款", "票种差异", "入场受限", "座位不符", "其他"
            ])
            disp_ticket = st.text_input("票码或Ticket ID", help="可扫描二维码获取")
            applicant_name = st.text_input("申请人姓名")
            applicant_contact = st.text_input("申请人联系方式")
        with c2:
            disp_reason = st.text_area("争议原因详述", height=160,
                                       placeholder="请详细描述争议情况，包括时间、场景、用户诉求等")
            disp_assignee = st.selectbox("分派处理人", [
                "票务组-王专员", "客服组-李主管", "财务组-张经理", "现场组-赵主管", "待分派"
            ])
            deadline_days = st.number_input("处理期限（天）", min_value=1, max_value=30, value=3)

        submitted = st.form_submit_button("📤 提交争议并生成任务", type="primary", use_container_width=True)

        if submitted:
            if not disp_reason or not disp_ticket:
                st.error("请填写票码和争议原因")
                return

            tkt_sql = f"SELECT ticket_id, order_id, event_id FROM tickets WHERE ticket_code = ? OR ticket_id = ? LIMIT 1"
            tkt_res = db.query_to_df(tkt_sql, (disp_ticket, disp_ticket))
            if tkt_res.height == 0:
                st.error("找不到对应的门票记录，请核对票码/Ticket ID")
                return
            tkt = tkt_res.row(0, named=True)

            disp_id = _new_id("DSP")
            filed = datetime.now()
            deadline = filed + timedelta(days=deadline_days)
            use_event = event_id or tkt["event_id"]

            insert_sql = """
            INSERT INTO refund_disputes (
                dispute_id, ticket_id, order_id, event_id,
                dispute_type, dispute_reason, applicant_name, applicant_contact,
                dispute_status, filed_time, assigned_to, deadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            """
            db.execute(insert_sql, (
                disp_id, tkt["ticket_id"], tkt["order_id"], use_event,
                disp_type, disp_reason, applicant_name, applicant_contact,
                filed, disp_assignee if disp_assignee != "待分派" else None, deadline,
            ))

            task_templates = [
                ("verification", "核实票务核销记录", "核查闸机原始记录与系统状态是否一致", "high"),
                ("payment_check", "核对支付与退款流水", "调取支付网关原始流水，核实金额与时间", "high"),
                ("customer_contact", "联系用户了解详情", "电话沟通用户，记录争议细节与诉求", "normal"),
                ("document", "整理争议材料归档", "将所有相关证据整理归档，以备审计", "low"),
            ]
            current_user = permission_manager.get_current_user()
            created_by = current_user.get("display_name") if current_user else "系统"

            for t_type, t_content, t_detail, priority in task_templates:
                tid = _new_id("TSK")
                task_sql = """
                INSERT INTO notes_tasks (
                    task_id, dispute_id, ticket_id, event_id,
                    task_type, task_content, priority, assigned_to,
                    task_status, due_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
                """
                db.execute(task_sql, (
                    tid, disp_id, tkt["ticket_id"], use_event,
                    t_type, f"{t_content}：{t_detail}", priority,
                    disp_assignee if disp_assignee != "待分派" else None, deadline, created_by,
                ))

            st.success(f"✅ 争议已提交！ID={disp_id}，已自动生成4条关联任务。")
            st.rerun()


def _render_tasks_board(
    tasks_df: pl.DataFrame,
    disputes_df: pl.DataFrame,
    role: UserRole,
    event_id: Optional[str],
) -> None:
    st.markdown("### 📝 任务看板")

    if tasks_df.height == 0:
        st.info("暂无任务，新建争议时将自动生成处理任务。")
        return

    pending_n = tasks_df.filter(pl.col("task_status") == "pending").height
    progress_n = tasks_df.filter(pl.col("task_status") == "in_progress").height
    done_n = tasks_df.filter(pl.col("task_status") == "completed").height
    high_n = tasks_df.filter(pl.col("priority") == "high").height

    cc1, cc2, cc3, cc4 = st.columns(4)
    cc1.metric("⏳ 待执行", pending_n)
    cc2.metric("🔄 进行中", progress_n)
    cc3.metric("✅ 已完成", done_n)
    cc4.metric("🔥 高优先级", high_n, delta_color="inverse")

    st.divider()

    board_col1, board_col2, board_col3 = st.columns(3)
    status_columns = [
        ("pending", board_col1, "⏳ 待执行"),
        ("in_progress", board_col2, "🔄 进行中"),
        ("completed", board_col3, "✅ 已完成"),
    ]

    for key_status, col, title in status_columns:
        with col:
            st.markdown(f"#### {title}")
            subset = tasks_df.filter(pl.col("task_status") == key_status)
            if subset.height == 0:
                st.caption("暂无任务")
                continue

            for task in subset.iter_rows(named=True):
                p_label, p_type = PRIORITY_LABELS.get(task.get("priority"), (task.get("priority", ""), "neutral"))
                s_label, s_type = TASK_STATUS_LABELS.get(task.get("task_status"), (task.get("task_status", ""), "neutral"))

                with st.container(border=True):
                    lc, rc = st.columns([5, 1])
                    lc.markdown(f"**{task.get('task_content')[:60]}{'...' if len(str(task.get('task_content', ''))) > 60 else ''}**")
                    rc.markdown(f"{status_badge(p_label, p_type)}", unsafe_allow_html=True)

                    st.caption(f"📌 {task.get('task_type')} · 👤 {task.get('assigned_to') or '未分派'} · ⏰ {str(task.get('due_date'))[:16] if task.get('due_date') else '无截止'}")

                    with st.expander("📝 任务详情 & 操作", expanded=False):
                        st.markdown(f"**完整任务描述**：{task.get('task_content')}")
                        st.markdown(f"- **任务ID**：`{task.get('task_id')}`")
                        st.markdown(f"- **关联争议**：`{task.get('dispute_id')}`")
                        st.markdown(f"- **创建人**：{task.get('created_by')}")
                        st.markdown(f"- **创建时间**：{task.get('created_at')}")
                        if task.get("completed_at"):
                            st.markdown(f"- **完成时间**：{task.get('completed_at')}")

                        if task.get("task_status") != "completed":
                            upd_status = st.selectbox(
                                "更新状态",
                                ["pending", "in_progress", "completed", "cancelled"],
                                format_func=lambda x: TASK_STATUS_LABELS.get(x, (x, "n"))[0],
                                index=0,
                                key=f"upd_tsk_{task.get('task_id')}",
                            )
                            if st.button("💾 更新", key=f"btn_tsk_{task.get('task_id')}"):
                                now = datetime.now()
                                complete_sql = ", completed_at = ?" if upd_status == "completed" else ""
                                params = [upd_status, now]
                                if complete_sql:
                                    params.insert(-1, now)
                                params.append(task.get("task_id"))
                                update_sql = f"""
                                UPDATE notes_tasks
                                SET task_status = ?, updated_at = CURRENT_TIMESTAMP
                                {complete_sql}
                                WHERE task_id = ?
                                """
                                db.execute(update_sql, tuple(params))
                                st.success("✅ 任务状态已更新")
                                st.rerun()

    st.divider()
    st.markdown("### 📋 所有任务（表格视图）")
    with st.expander("展开表格视图", expanded=False):
        tasks_display = tasks_df.with_columns(
            pl.col("priority").map_elements(
                lambda x: status_badge(*PRIORITY_LABELS.get(x, (x, "neutral"))),
                return_dtype=str,
            ).alias("优先级"),
            pl.col("task_status").map_elements(
                lambda x: status_badge(*TASK_STATUS_LABELS.get(x, (x, "neutral"))),
                return_dtype=str,
            ).alias("任务状态"),
        )
        keep_cols = [c for c in [
            "任务状态", "优先级", "task_type", "task_content",
            "assigned_to", "due_date", "created_by", "created_at",
            "dispute_id", "task_id",
        ] if c in tasks_display.columns]
        rename_map = {
            "task_type": "任务类型",
            "task_content": "任务内容",
            "assigned_to": "负责人",
            "due_date": "截止日期",
            "created_by": "创建人",
            "created_at": "创建时间",
            "dispute_id": "关联争议",
        }
        final_df = safe_drop_columns(
            tasks_display.select(keep_cols).rename(rename_map),
            ["task_id"],
        )
        style_dataframe(final_df)


def _render_conclusions_panel(event_id: Optional[str], role: UserRole) -> None:
    analytics = TicketAnalytics(event_id)
    all_conclusions = analytics.get_processing_conclusions()
    if all_conclusions.height > 0:
        n_by_type = {
            rt: all_conclusions.filter(pl.col("related_type") == rt).height
            for rt in all_conclusions["related_type"].unique().to_list()
        }
        cols = st.columns(max(1, len(n_by_type)))
        for i, (rtype, n) in enumerate(n_by_type.items()):
            cols[i].metric(f"📌 {rtype}类结论", n)

        for row in all_conclusions.iter_rows(named=True):
            c_type = {
                "analysis": ("📊 分析结论", "info"),
                "recommendation": ("💡 建议", "success"),
                "summary": ("📋 总结", "warning"),
            }.get(row.get("conclusion_type"), ("📝 结论", "neutral"))

            with st.container(border=True):
                hc1, hc2 = st.columns([8, 2])
                hc1.markdown(f"**{c_type[0]}：{row.get('conclusion_title')}**")
                hc2.caption(f"关联：{row.get('related_type')} · {row.get('author', '-')}")
                st.markdown(f"> {row.get('conclusion_content')}")
                st.caption(f"更新于：{row.get('updated_at')}")
    else:
        st.caption("暂无处理结论")

    with st.expander("➕ 新增处理结论", expanded=False):
        with st.form("add_conclusion_form"):
            t1, t2 = st.columns(2)
            with t1:
                c_title = st.text_input("结论标题")
                c_related = st.selectbox("关联图表/模块", ["funnel", "efficiency", "sponsor", "refund", "checkin", "general"])
            with t2:
                c_ctype = st.selectbox("结论类型", ["analysis", "recommendation", "summary"],
                                       format_func=lambda x: {"analysis": "分析结论", "recommendation": "建议", "summary": "总结"}[x])
                c_author = st.text_input("作者", value=permission_manager.get_current_user().get("display_name", "") if permission_manager.get_current_user() else "")
            c_content = st.text_area("结论内容", height=100, help="该内容将显示在对应图表旁")
            if st.form_submit_button("💾 保存结论", type="primary"):
                if not c_title or not c_content:
                    st.error("请填写标题和内容")
                else:
                    cid = _new_id("CNC")
                    now = datetime.now()
                    sql = """
                    INSERT INTO processing_conclusions (
                        conclusion_id, event_id, related_type, conclusion_title,
                        conclusion_content, conclusion_type, author, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    db.execute(sql, (cid, event_id, c_related, c_title, c_content, c_ctype, c_author, now, now))
                    st.success("✅ 处理结论已保存")
                    st.rerun()
