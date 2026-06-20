from __future__ import annotations

import json
import streamlit as st
import polars as pl
from typing import Optional

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole, ROLE_LABELS
from src.ui.charts import make_sponsor_chart, style_dataframe, status_badge, metric_card
from src.data.database import db


def render_sponsors_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    if not permission_manager.can_view_sponsors(role):
        st.error("🔒 您无权限查看赞助商清单数据")
        return

    st.markdown("## 🏢 赞助清单分析")
    st.caption("从赞助商维度下钻：赞助分配 → 出票核销 → 具体票务明细")

    sponsor_df = analytics.get_sponsor_breakdown()
    if sponsor_df.height == 0:
        st.info("暂无赞助商数据")
        return

    col1, col2, col3 = st.columns(3)
    with col1:
        metric_card("赞助商总数", sponsor_df.height)
    with col2:
        total_alloc = int(sponsor_df["allocated_tickets"].sum() or 0)
        metric_card("总分配票数", total_alloc)
    with col3:
        total_used = int(sponsor_df["checked_in_count"].sum() or 0)
        overall_rate = round((total_used / total_alloc * 100) if total_alloc > 0 else 0, 2)
        metric_card("整体利用率", f"{overall_rate}%", delta=f"已核销{total_used}张")

    st.plotly_chart(make_sponsor_chart(sponsor_df), use_container_width=True)

    st.divider()
    st.markdown("### 📋 赞助商明细列表")

    level_filter = st.multiselect(
        "筛选赞助级别",
        options=sponsor_df["sponsor_level"].unique().to_list(),
        default=[],
    )
    display_df = sponsor_df
    if level_filter:
        display_df = display_df.filter(pl.col("sponsor_level").is_in(level_filter))

    if not permission_manager.can_view_sensitive(role, "sponsors", "contact_person"):
        for col in ["contact_person", "contact_phone"]:
            if col in display_df.columns:
                display_df = display_df.drop(col)

    event_display_df = display_df.with_columns(
        pl.col("sponsor_level").map_elements(
            lambda x: status_badge(x, "info" if x and "钻石" in x else "warning" if x and "金" in x else "neutral"),
            return_dtype=str,
        ).alias("赞助级别"),
        pl.concat_str([
            pl.col("utilization_rate").cast(str), pl.lit("%")
        ]).alias("利用率"),
    )

    rename_map = {
        "sponsor_name": "赞助商",
        "allocated_tickets": "分配票数",
        "actual_issued": "实际出票",
        "paid_count": "已支付",
        "refunded_count": "退票数",
        "checked_in_count": "已核销",
        "utilization_rate": "_利用率数值",
    }
    keep_cols = ["赞助商", "赞助级别", "分配票数", "实际出票", "已支付", "退票数", "已核销", "利用率", "sponsor_id"]
    for old, new in rename_map.items():
        if old in event_display_df.columns:
            event_display_df = event_display_df.rename({old: new})
    existing = [c for c in keep_cols if c in event_display_df.columns]
    event_display_df = event_display_df.select(existing)

    st.dataframe(
        event_display_df.drop(["sponsor_id"] if "sponsor_id" in event_display_df.columns else []).to_pandas(),
        use_container_width=True,
        height=350,
        hide_index=True,
    )

    st.divider()
    st.markdown("### 🔍 赞助商下钻：查看其关联票务")

    sponsor_options = [(row["sponsor_name"], row["sponsor_id"]) for row in sponsor_df.iter_rows(named=True)]
    display_names = [f"{name} ({sid[-6:]})" for name, sid in sponsor_options]
    if "selected_sponsor_idx" not in st.session_state:
        st.session_state.selected_sponsor_idx = 0
    idx = st.selectbox(
        "选择赞助商查看票务明细",
        range(len(display_names)),
        format_func=lambda i: display_names[i],
        key="sponsor_drilldown",
    )
    selected_sponsor_id = sponsor_options[idx][1]
    selected_sponsor_name = sponsor_options[idx][0]

    st.markdown(f"#### 🎟️ {selected_sponsor_name} - 关联票种分析")

    sql = f"""
    SELECT
        tt.type_name as 票种,
        tt.price as 单价,
        tt.total_quantity as 发行总量,
        COUNT(DISTINCT t.ticket_id) as 出票数,
        COUNT(DISTINCT CASE WHEN t.payment_status='paid' THEN t.ticket_id END) as 已支付,
        COUNT(DISTINCT CASE WHEN t.ticket_status='refunded' THEN t.ticket_id END) as 退票数,
        COUNT(DISTINCT g.ticket_id) as 已核销,
        ROUND(CASE WHEN COUNT(DISTINCT t.ticket_id) > 0
            THEN COUNT(DISTINCT g.ticket_id)*100.0/COUNT(DISTINCT t.ticket_id) ELSE 0 END, 2) as 核销率
    FROM ticket_types tt
    LEFT JOIN tickets t ON tt.ticket_type_id = t.ticket_type_id AND t.sponsor_id = '{selected_sponsor_id}'
    LEFT JOIN gate_records g ON t.ticket_id = g.ticket_id AND g.check_status = 'success'
    WHERE tt.sponsor_id = '{selected_sponsor_id}' {f"AND tt.event_id = '{event_id}'" if event_id else ""}
    GROUP BY tt.type_name, tt.price, tt.total_quantity
    ORDER BY 核销率 DESC
    """
    tt_breakdown = db.query_to_df(sql)
    style_dataframe(tt_breakdown, height=250)

    st.markdown(f"#### 🎫 {selected_sponsor_name} - 具体门票列表")
    tickets_sql = f"""
    SELECT
        t.ticket_id,
        t.ticket_code,
        tt.type_name as 票种,
        t.attendee_name as 持票人,
        t.seat_info as 座位,
        t.final_price as 金额,
        t.payment_status as 支付状态,
        t.ticket_status as 票据状态,
        t.refund_status as 退票状态,
        t.purchase_time as 购买时间,
        CASE WHEN g.ticket_id IS NOT NULL THEN '已核销' ELSE '未核销' END as 核销状态,
        g.check_in_time as 核销时间,
        g.gate_name as 检票口
    FROM tickets t
    LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
    LEFT JOIN (
        SELECT ticket_id, MAX(check_in_time) as check_in_time, MAX(gate_name) as gate_name
        FROM gate_records WHERE check_status='success' {f"AND event_id='{event_id}'" if event_id else ""}
        GROUP BY ticket_id
    ) g ON t.ticket_id = g.ticket_id
    WHERE t.sponsor_id = '{selected_sponsor_id}' {f"AND t.event_id = '{event_id}'" if event_id else ""}
    ORDER BY t.purchase_time DESC
    LIMIT 500
    """
    sponsor_tickets = db.query_to_df(tickets_sql)
    masked_tickets = permission_manager.mask_sensitive_data(sponsor_tickets, "tickets", role)

    show_raw = st.checkbox("显示原始票码（需要权限）", value=False)
    if not permission_manager.can_view_sensitive(role, "tickets", "ticket_code"):
        show_raw = False

    display_tickets = masked_tickets
    if not show_raw and "ticket_code" in display_tickets.columns:
        display_tickets = display_tickets.drop(["ticket_code"])

    style_dataframe(display_tickets.drop(["ticket_id"] if "ticket_id" in display_tickets.columns else []), height=400)

    if display_tickets.height > 0:
        st.markdown("---")
        st.markdown("#### 🔬 继续下钻：选择票查看闸机原始记录")

        tkt_options = [
            (row.get("ticket_id", ""), f"{row.get('持票人', '?')} - {str(row.get('核销状态', ''))}")
            for row in display_tickets.iter_rows(named=True)
        ]
        valid_options = [(tid, label) for tid, label in tkt_options if tid]
        if valid_options:
            ticket_idx = st.selectbox(
                "选择门票",
                range(len(valid_options)),
                format_func=lambda i: valid_options[i][1],
                key=f"sponsor_ticket_{idx}",
            )
            selected_ticket_id = valid_options[ticket_idx][0]

            raw_records = analytics.get_raw_gate_records(ticket_id=selected_ticket_id, limit=50)
            if raw_records.height > 0:
                st.warning(f"⚠️ 该票共有 {raw_records.height} 条闸机记录，可能存在重复检票")
                for rec in raw_records.iter_rows(named=True):
                    status_type = "success" if rec.get("check_status") == "success" else "error"
                    with st.expander(
                        f"🕒 {rec.get('check_in_time')} | {rec.get('gate_name')} | {rec.get('check_status')}"
                    ):
                        st.markdown(f"- **检票口ID**：{rec.get('gate_id')}")
                        st.markdown(f"- **检票状态**：{status_badge(rec.get('check_status'), status_type)}", unsafe_allow_html=True)
                        if rec.get("fail_reason"):
                            st.markdown(f"- **失败原因**：`{rec.get('fail_reason')}`")
                        if rec.get("check_out_time"):
                            st.markdown(f"- **出场时间**：{rec.get('check_out_time')}")
                        if rec.get("raw_payload"):
                            try:
                                payload = json.loads(rec["raw_payload"]) if isinstance(rec["raw_payload"], str) else rec["raw_payload"]
                                with st.expander("📦 原始扫描Payload（调试用）"):
                                    st.json(payload)
                            except Exception:
                                pass
            else:
                st.info("该票暂无闸机记录")
