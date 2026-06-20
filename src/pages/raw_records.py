from __future__ import annotations

import json
import streamlit as st
import polars as pl
from datetime import datetime, timedelta
from typing import Optional

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole
from src.ui.charts import style_dataframe, status_badge, metric_card
from src.data.database import db


def render_raw_records_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    if not permission_manager.can_view_raw_records(role):
        st.error("🔒 您无权限查看闸机原始记录（含敏感调试数据）")
        return

    st.markdown("## 📦 闸机原始记录")
    st.caption("最底层原始闸机数据，含设备信息、扫描Payload、完整票码、失败日志，用于故障排查与审计")

    total_sql = f"""
    SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN check_status='success' THEN 1 END) as success,
        COUNT(CASE WHEN check_status!='success' THEN 1 END) as fail,
        COUNT(DISTINCT gate_id) as gates,
        COUNT(DISTINCT staff_id) as staff,
        COUNT(DISTINCT ticket_code) as unique_tickets
    FROM gate_records
    {f"WHERE event_id = '{event_id}'" if event_id else ""}
    """
    stats = db.query_to_df(total_sql)
    if stats.height > 0:
        s = stats.row(0, named=True)
        c1, c2, c3, c4, c5, c6 = st.columns(6)
        c1.metric("总记录数", s.get("total", 0))
        c2.metric("成功核销", s.get("success", 0))
        c3.metric("失败/异常", s.get("fail", 0),
                  delta_color="inverse")
        c4.metric("涉及闸口", s.get("gates", 0))
        c5.metric("涉及人员", s.get("staff", 0))
        c6.metric("唯一票码", s.get("unique_tickets", 0))

    st.divider()

    with st.expander("🔎 高级筛选条件", expanded=True):
        fc1, fc2 = st.columns(2)
        with fc1:
            code_search = st.text_input("票码搜索（精确/模糊）", "", key="raw_code_search")
            ticket_id_search = st.text_input("Ticket ID精确搜索", "", key="raw_ticketid")

            gate_options_sql = f"""
            SELECT DISTINCT gate_name FROM gate_records
            {f"WHERE event_id = '{event_id}'" if event_id else ""}
            ORDER BY gate_name
            """
            gate_opts = ["全部"] + db.query_to_df(gate_options_sql)["gate_name"].to_list()
            sel_gate = st.selectbox("检票口", gate_opts, key="raw_gate")

        with fc2:
            status_opts = ["全部", "success", "duplicate", "invalid_code", "expired", "wrong_event", "blacklisted"]
            sel_status = st.selectbox("检票结果状态", status_opts, key="raw_status")

            today = datetime.now()
            d1, d2 = st.date_input(
                "检票时间范围",
                value=(today - timedelta(days=60), today),
                key="raw_date_range",
            )

            device_filter = st.checkbox("仅显示含调试信息的记录", value=False, key="raw_device_only")

        btn_cols = st.columns([1, 5])
        with btn_cols[0]:
            apply_btn = st.button("🔍 应用筛选", type="primary", use_container_width=True)
        with btn_cols[1]:
            limit = st.slider("最多显示记录数", 100, 5000, 1000, 100, key="raw_limit")

    conditions = []
    params = []
    if event_id:
        conditions.append("event_id = ?")
        params.append(event_id)
    if code_search:
        if len(code_search) >= 6:
            conditions.append("ticket_code = ?")
            params.append(code_search)
        else:
            conditions.append("ticket_code LIKE ?")
            params.append(f"%{code_search}%")
    if ticket_id_search:
        conditions.append("ticket_id = ?")
        params.append(ticket_id_search)
    if sel_gate != "全部":
        conditions.append("gate_name = ?")
        params.append(sel_gate)
    if sel_status != "全部":
        conditions.append("check_status = ?")
        params.append(sel_status)
    if isinstance(d1, datetime) or hasattr(d1, 'year'):
        start_dt = datetime.combine(d1, datetime.min.time())
        conditions.append("check_in_time >= ?")
        params.append(start_dt)
    if isinstance(d2, datetime) or hasattr(d2, 'year'):
        end_dt = datetime.combine(d2, datetime.max.time())
        conditions.append("check_in_time <= ?")
        params.append(end_dt)
    if device_filter:
        conditions.append("raw_payload IS NOT NULL")

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    query_sql = f"""
    SELECT
        record_id,
        ticket_id,
        ticket_code,
        gate_id,
        gate_name,
        staff_id,
        check_in_time,
        check_out_time,
        check_status,
        fail_reason,
        device_info,
        raw_payload
    FROM gate_records
    {where}
    ORDER BY check_in_time DESC
    LIMIT {int(limit)}
    """
    raw_df = db.query_to_df(query_sql, tuple(params) if params else None)

    st.divider()
    st.caption(f"查询匹配到 {raw_df.height} 条记录（LIMIT {limit}）")

    if raw_df.height == 0:
        st.info("没有匹配的闸机记录，试试放宽筛选条件。")
        return

    display = permission_manager.mask_sensitive_data(raw_df, "gate_records", role)
    display = display.with_columns(
        pl.col("check_status").map_elements(
            lambda x: status_badge(x, "success" if x == "success" else "error"),
            return_dtype=str,
        ).alias("结果标识")
    )

    main_cols = [c for c in ["check_in_time", "gate_name", "staff_id", "ticket_id",
                              "ticket_code", "结果标识", "check_status", "fail_reason",
                              "check_out_time", "record_id"] if c in display.columns]
    style_dataframe(display.select(main_cols).drop(["check_status", "record_id"], errors="ignore"), height=480)

    st.divider()
    st.markdown("### 🧾 记录详情")

    opt_preview = [
        (r.get("record_id", ""), f"{r.get('check_in_time', '?')} | {r.get('gate_name', '?')} | {r.get('check_status', '?')} | {str(r.get('ticket_code', ''))[-8:]}")
        for r in raw_df.head(200).iter_rows(named=True)
    ]
    valid_opts = [(rid, label) for rid, label in opt_preview if rid]
    if valid_opts:
        sel_idx = st.selectbox(
            "选择一条记录查看完整原始数据",
            range(len(valid_opts)),
            format_func=lambda i: valid_opts[i][1],
            key="raw_detail_sel",
        )
        sel_record_id = valid_opts[sel_idx][0]
        detail_row = raw_df.filter(pl.col("record_id") == sel_record_id)

        if detail_row.height > 0:
            row = detail_row.row(0, named=True)
            left, right = st.columns(2)

            with left:
                st.markdown("#### 基础信息")
                st.markdown(f"- **记录ID**：`{row.get('record_id')}`")
                st.markdown(f"- **票ID**：`{row.get('ticket_id')}`")
                if permission_manager.can_view_sensitive(role, "gate_records", "ticket_code"):
                    st.markdown(f"- **完整票码**：`{row.get('ticket_code')}`")
                else:
                    st.markdown(f"- **票码**：`***`")
                st.markdown(f"- **检票口**：{row.get('gate_name')} ({row.get('gate_id')})")
                st.markdown(f"- **检票员ID**：`{row.get('staff_id')}`")
                st.markdown(f"- **检票时间**：{row.get('check_in_time')}")
                if row.get("check_out_time"):
                    st.markdown(f"- **出场时间**：{row.get('check_out_time')}")
                stype = "success" if row.get("check_status") == "success" else "error"
                st.markdown(f"- **结果**：{status_badge(row.get('check_status'), stype)}", unsafe_allow_html=True)
                if row.get("fail_reason"):
                    st.error(f"失败说明：{row.get('fail_reason')}")

            with right:
                st.markdown("#### 原始JSON数据")
                raw_tabs = st.tabs(["📦 扫描Payload", "🖥️ 设备信息"])
                with raw_tabs[0]:
                    if row.get("raw_payload"):
                        try:
                            rp = json.loads(row["raw_payload"]) if isinstance(row["raw_payload"], str) else row["raw_payload"]
                            st.json(rp)
                        except Exception as e:
                            st.code(row["raw_payload"])
                    else:
                        st.info("无扫描Payload数据")

                with raw_tabs[1]:
                    if row.get("device_info"):
                        try:
                            dev = json.loads(row["device_info"]) if isinstance(row["device_info"], str) else row["device_info"]
                            st.json(dev)
                        except Exception:
                            st.code(row["device_info"])
                    else:
                        st.info("无设备信息数据")

            st.markdown("---")
            st.markdown("#### 🔗 同票所有记录（检查重复检票）")
            if row.get("ticket_id"):
                same_ticket = analytics.get_raw_gate_records(ticket_id=row["ticket_id"], limit=50)
                if same_ticket.height > 1:
                    st.warning(f"⚠️ 该票有 {same_ticket.height} 条记录，存在重复检票嫌疑！")
                same_display = same_ticket.with_columns(
                    pl.col("check_status").map_elements(
                        lambda x: status_badge(x, "success" if x == "success" else "error"),
                        return_dtype=str,
                    ).alias("检票结果")
                )
                style_dataframe(same_display.drop(["device_info", "raw_payload"], errors="ignore"), height=250)
