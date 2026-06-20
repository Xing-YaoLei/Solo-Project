from __future__ import annotations

import json
import streamlit as st
import polars as pl
from typing import Optional

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole
from src.ui.charts import (
    make_timeline_chart,
    make_gate_efficiency_chart,
    make_staff_chart,
    style_dataframe,
    metric_card,
    status_badge,
    safe_drop_columns,
    safe_select_columns,
)
from src.data.database import db


def render_checkin_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    if not permission_manager.can_view_checkin_details(role):
        st.error("🔒 您无权限查看核销记录明细数据")
        return

    st.markdown("## 🚪 核销记录明细")
    st.caption("从核销记录维度下钻：检票口效率 → 人员绩效 → 单票核销 → 原始记录")

    st.markdown("### 📊 核销效率核心指标")
    gate_df = analytics.get_gate_efficiency()
    staff_df = analytics.get_staff_performance()

    c1, c2, c3, c4 = st.columns(4)
    total_success = int(gate_df["success_count"].sum() or 0) if gate_df.height > 0 else 0
    total_fail = int(gate_df["fail_count"].sum() or 0) if gate_df.height > 0 else 0
    total = total_success + total_fail
    fail_rate = round((total_fail / total * 100) if total > 0 else 0, 2)
    active_gates = gate_df.height if gate_df.height > 0 else 0
    active_staff = staff_df.filter(pl.col("total_scans") > 0).height if staff_df.height > 0 else 0

    c1.metric("✅ 总成功核销", total_success)
    c2.metric("❌ 失败次数", total_fail, delta=f"{fail_rate}%", delta_color="inverse")
    c3.metric("🚪 活跃检票口", active_gates)
    c4.metric("👥 在岗人员", active_staff)

    st.divider()

    col_tl, col_ge = st.columns(2)
    with col_tl:
        interval = st.selectbox(
            "时间粒度",
            ["5minute", "15minute", "hour", "minute"],
            format_func=lambda x: {"5minute": "5分钟", "15minute": "15分钟", "hour": "1小时", "minute": "1分钟"}[x],
            index=1,
            key="checkin_interval",
        )
        timeline = analytics.get_checkin_timeline(interval=interval)
        st.plotly_chart(make_timeline_chart(timeline, "分时段核销吞吐量"), use_container_width=True)

    with col_ge:
        st.plotly_chart(make_gate_efficiency_chart(gate_df), use_container_width=True)

    st.divider()

    col_st, col_filter = st.columns([2, 1])
    with col_st:
        st.plotly_chart(make_staff_chart(staff_df), use_container_width=True)

    with col_filter:
        st.markdown("#### 🔎 筛选条件")
        gate_options = ["全部"] + (gate_df["gate_name"].to_list() if gate_df.height > 0 else [])
        selected_gate = st.selectbox("检票口", gate_options, key="filter_gate")

        staff_names = ["全部"] + (staff_df["staff_name"].to_list() if staff_df.height > 0 else [])
        selected_staff = st.selectbox("检票员", staff_names, key="filter_staff")

        status_options = ["全部", "success", "duplicate", "invalid_code", "expired", "wrong_event", "blacklisted"]
        selected_status = st.selectbox("检票结果", status_options, key="filter_status")

        search_code = st.text_input("搜索票码（模糊）", "", key="filter_code")

    st.divider()
    st.markdown("### 📋 核销记录列表")

    sql_conditions = []
    params = []
    if event_id:
        sql_conditions.append("g.event_id = ?")
        params.append(event_id)
    if selected_gate != "全部":
        sql_conditions.append("g.gate_name = ?")
        params.append(selected_gate)
    if selected_staff != "全部":
        sql_conditions.append("s.staff_name = ?")
        params.append(selected_staff)
    if selected_status != "全部":
        sql_conditions.append("g.check_status = ?")
        params.append(selected_status)
    if search_code:
        sql_conditions.append("g.ticket_code LIKE ?")
        params.append(f"%{search_code}%")

    where_clause = f"WHERE {' AND '.join(sql_conditions)}" if sql_conditions else ""

    records_sql = f"""
    SELECT
        g.record_id,
        g.ticket_id,
        g.ticket_code,
        g.gate_name as 检票口,
        s.staff_name as 检票员,
        tt.type_name as 票种,
        t.attendee_name as 持票人,
        sp.sponsor_name as 赞助商,
        g.check_in_time as 检票时间,
        g.check_status as 状态,
        g.fail_reason as 失败原因,
        CASE WHEN g.check_out_time IS NOT NULL THEN '是' ELSE '否' END as 已出场,
        g.check_out_time as 出场时间
    FROM gate_records g
    LEFT JOIN tickets t ON g.ticket_id = t.ticket_id
    LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
    LEFT JOIN sponsors sp ON t.sponsor_id = sp.sponsor_id
    LEFT JOIN staff s ON g.staff_id = s.staff_id
    {where_clause}
    ORDER BY g.check_in_time DESC
    LIMIT 2000
    """
    records = db.query_to_df(records_sql, tuple(params) if params else None)

    st.caption(f"共匹配到 {records.height} 条记录（最多显示2000条）")

    if records.height == 0:
        st.info("没有符合条件的记录")
        return

    masked = permission_manager.mask_sensitive_data(records, "gate_records", role)
    masked = permission_manager.mask_sensitive_data(masked, "tickets", role)
    display = masked.with_columns(
        pl.col("状态").map_elements(
            lambda x: status_badge(x, "success" if x == "success" else "error"),
            return_dtype=str,
        ).alias("检票结果")
    )

    show_code = st.checkbox("显示完整票码（需权限）", value=False, key="checkin_show_code")
    if not permission_manager.can_view_sensitive(role, "gate_records", "ticket_code"):
        show_code = False

    cols_keep = ["检票时间", "检票口", "检票员", "票种", "持票人", "赞助商", "检票结果", "失败原因", "已出场", "出场时间", "record_id", "ticket_id"]
    if show_code and "ticket_code" in display.columns:
        cols_keep.insert(1, "ticket_code")
    final_df = safe_select_columns(display, cols_keep)

    st.dataframe(
        safe_drop_columns(final_df, ["record_id", "ticket_id"]).to_pandas(),
        use_container_width=True,
        height=450,
        hide_index=True,
    )

    st.divider()
    st.markdown("### 🔬 下钻：查看单条记录详情及原始数据")

    rec_options = [
        (row.get("record_id", ""), f"{row.get('检票时间', '?')} | {row.get('检票口', '?')} | {row.get('检票员', '?')} | {row.get('状态', '?')}")
        for row in records.iter_rows(named=True)
    ]
    valid_recs = [(rid, label) for rid, label in rec_options if rid]

    if valid_recs:
        rec_idx = st.selectbox(
            "选择一条核销记录查看详情",
            range(min(500, len(valid_recs))),
            format_func=lambda i: valid_recs[i][1],
            key="checkin_rec_detail",
        )
        sel_record_id = valid_recs[rec_idx][0]

        detail_sql = f"""
        SELECT
            g.*,
            t.order_id,
            t.ticket_status as 票据状态,
            t.payment_status as 支付状态,
            t.seat_info as 座位,
            tt.type_name as 票种,
            tt.price as 原价,
            t.final_price as 实付,
            o.order_source,
            o.sales_channel,
            s.staff_name,
            s.staff_role,
            s.assigned_gate
        FROM gate_records g
        LEFT JOIN tickets t ON g.ticket_id = t.ticket_id
        LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
        LEFT JOIN orders o ON t.order_id = o.order_id
        LEFT JOIN staff s ON g.staff_id = s.staff_id
        WHERE g.record_id = '{sel_record_id}'
        LIMIT 1
        """
        detail = db.query_to_df(detail_sql)

        if detail.height > 0:
            d = detail.row(0, named=True)
            with st.expander("📋 核销记录完整详情", expanded=True):
                c1, c2, c3 = st.columns(3)
                stype = "success" if d.get("check_status") == "success" else "error"
                c1.markdown(f"**检票结果**：{status_badge(d.get('check_status'), stype)}", unsafe_allow_html=True)
                c2.markdown(f"**检票时间**：{d.get('check_in_time')}")
                c3.markdown(f"**检票口**：{d.get('gate_name')} ({d.get('gate_id')})")
                cc1, cc2, cc3 = st.columns(3)
                cc1.markdown(f"**检票员**：{d.get('staff_name')} ({d.get('staff_role')})")
                cc2.markdown(f"**检票员分配口**：{d.get('assigned_gate')}")
                if d.get("check_out_time"):
                    cc3.markdown(f"**出场时间**：{d.get('check_out_time')}")

                st.markdown("---")
                st.markdown("**关联票务信息**：")
                t1, t2, t3, t4 = st.columns(4)
                t1.markdown(f"**票种**：{d.get('票种')}")
                t2.markdown(f"**原价**：¥{d.get('原价')}")
                t3.markdown(f"**实付**：¥{d.get('实付')}")
                t4.markdown(f"**座位**：{d.get('座位') or '-'}")
                t5, t6, t7 = st.columns(3)
                t5.markdown(f"**订单来源**：{d.get('order_source')}")
                t6.markdown(f"**销售渠道**：{d.get('sales_channel')}")
                t7.markdown(f"**票据状态**：{d.get('票据状态')}")

                if d.get("fail_reason"):
                    st.markdown("---")
                    st.error(f"❌ 失败原因：{d['fail_reason']}")

                with st.expander("📦 原始设备与扫描数据", expanded=False):
                    p1, p2 = st.columns(2)
                    if d.get("device_info"):
                        try:
                            dev = json.loads(d["device_info"]) if isinstance(d["device_info"], str) else d["device_info"]
                            p1.markdown("**设备信息**：")
                            p1.json(dev)
                        except Exception:
                            pass
                    if d.get("raw_payload"):
                        try:
                            rp = json.loads(d["raw_payload"]) if isinstance(d["raw_payload"], str) else d["raw_payload"]
                            p2.markdown("**扫描Payload**：")
                            p2.json(rp)
                        except Exception:
                            pass

                st.markdown("---")
                ticket_id = d.get("ticket_id")
                if ticket_id:
                    st.markdown(f"**该票所有闸机记录**（可能存在重复检票）：")
                    all_recs = analytics.get_raw_gate_records(ticket_id=ticket_id, limit=20)
                    style_dataframe(all_recs, height=200)
