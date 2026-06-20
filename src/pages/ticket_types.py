from __future__ import annotations

import json
import streamlit as st
import polars as pl
from typing import Optional

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole
from src.ui.charts import make_ticket_type_chart, style_dataframe, metric_card, status_badge, safe_drop_columns, safe_select_columns
from src.data.database import db


def render_ticket_types_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    if not permission_manager.can_view_ticket_types(role):
        st.error("🔒 您无权限查看票种规则数据")
        return

    st.markdown("## 💎 票种规则与核销")
    st.caption("从票种维度下钻：规则配置 → 销售情况 → 核销明细 → 闸机原始记录")

    tt_df = analytics.get_ticket_type_breakdown()
    if tt_df.height == 0:
        st.info("暂无票种数据")
        return

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        metric_card("票种总数", tt_df.height)
    with col2:
        total_qty = int(tt_df["total_quantity"].sum() or 0)
        metric_card("设计容量", total_qty)
    with col3:
        total_paid = int(tt_df["paid_count"].sum() or 0)
        metric_card("已销售", total_paid)
    with col4:
        total_rev = float(tt_df["total_revenue"].sum() or 0)
        metric_card("总收入", f"¥{total_rev:,.0f}")

    st.plotly_chart(make_ticket_type_chart(tt_df), use_container_width=True)

    st.divider()
    st.markdown("### 📋 票种规则列表")

    display_tt = tt_df.clone()
    if not permission_manager.can_view_sensitive(role, "ticket_types", "price"):
        display_tt = safe_drop_columns(display_tt, ["price", "total_revenue"])

    display_tt = display_tt.with_columns(
        pl.concat_str([pl.col("redemption_rate").cast(str), pl.lit("%")]).alias("核销率%"),
    )

    rename_map = {
        "type_name": "票种名称",
        "price": "单价(元)",
        "sponsor_name": "关联赞助商",
        "total_quantity": "发行量",
        "issued_count": "出票数",
        "paid_count": "已支付",
        "refunded_count": "退票数",
        "checked_in_count": "已核销",
        "total_revenue": "实际收入(元)",
    }
    for old, new in rename_map.items():
        if old in display_tt.columns:
            display_tt = display_tt.rename({old: new})

    cols_to_show = [c for c in ["票种名称", "关联赞助商", "单价(元)", "发行量", "出票数", "已支付", "退票数", "已核销", "核销率%", "实际收入(元)", "ticket_type_id"] if c in display_tt.columns]
    style_dataframe(safe_drop_columns(display_tt.select(cols_to_show), ["ticket_type_id"]), height=300)

    st.divider()
    st.markdown("### 🔍 票种下钻：销售与核销明细")

    tt_options = [(row["type_name"], row["ticket_type_id"], row.get("sponsor_name")) for row in tt_df.iter_rows(named=True)]
    tt_display = [f"{name} {('[' + sponsor + ']') if sponsor else ''} ({tid[-6:]})" for name, tid, sponsor in tt_options]
    tt_idx = st.selectbox(
        "选择票种查看明细",
        range(len(tt_display)),
        format_func=lambda i: tt_display[i],
        key="tt_drilldown",
    )
    selected_tt_id = tt_options[tt_idx][1]
    selected_tt_name = tt_options[tt_idx][0]

    rules_sql = f"""
    SELECT * FROM ticket_types WHERE ticket_type_id = '{selected_tt_id}'
    """
    tt_detail = db.query_to_df(rules_sql)
    if tt_detail.height > 0:
        tt_row = tt_detail.row(0, named=True)
        with st.expander("📜 票种规则配置", expanded=True):
            r1, r2, r3 = st.columns(3)
            r1.markdown(f"**票种名称**：{tt_row.get('type_name')}")
            r2.markdown(f"**价格**：¥{tt_row.get('price')}")
            r3.markdown(f"**单订单最大**：{tt_row.get('max_per_order')}张")
            r4, r5 = st.columns(2)
            r4.markdown(f"**销售开始**：{tt_row.get('sale_start_time')}")
            r5.markdown(f"**销售截止**：{tt_row.get('sale_end_time')}")
            if tt_row.get("description"):
                st.markdown(f"**描述**：{tt_row['description']}")
            if tt_row.get("validation_rules"):
                try:
                    rules = json.loads(tt_row["validation_rules"]) if isinstance(tt_row["validation_rules"], str) else tt_row["validation_rules"]
                    st.markdown("**核销规则**：")
                    st.json(rules)
                except Exception:
                    pass

    st.markdown(f"#### 📊 {selected_tt_name} - 渠道销售分布")
    channel_sql = f"""
    SELECT
        o.sales_channel as 销售渠道,
        o.order_source as 来源平台,
        COUNT(DISTINCT o.order_id) as 订单数,
        COUNT(DISTINCT t.ticket_id) as 票数,
        ROUND(SUM(CASE WHEN t.payment_status='paid' THEN t.final_price ELSE 0 END), 2) as 收入,
        COUNT(DISTINCT CASE WHEN t.ticket_status='refunded' THEN t.ticket_id END) as 退票数
    FROM tickets t
    LEFT JOIN orders o ON t.order_id = o.order_id
    WHERE t.ticket_type_id = '{selected_tt_id}' {f"AND t.event_id='{event_id}'" if event_id else ""}
    GROUP BY o.sales_channel, o.order_source
    ORDER BY 票数 DESC
    """
    channel_df = db.query_to_df(channel_sql)
    style_dataframe(channel_df, height=220)

    st.markdown(f"#### 🎫 {selected_tt_name} - 具体门票列表")
    tickets_sql = f"""
    SELECT
        t.ticket_id,
        t.ticket_code,
        t.attendee_name as 持票人,
        t.seat_info as 座位,
        o.buyer_name as 购票人,
        t.final_price as 实付金额,
        o.sales_channel as 渠道,
        t.payment_status as 支付状态,
        t.ticket_status as 票据状态,
        t.refund_status as 退票状态,
        t.purchase_time as 购买时间,
        CASE WHEN g.ticket_id IS NOT NULL THEN '已核销' ELSE '未核销' END as 核销状态,
        g.check_in_time as 核销时间,
        g.gate_name as 检票口,
        g.staff_id as 检票员
    FROM tickets t
    LEFT JOIN orders o ON t.order_id = o.order_id
    LEFT JOIN (
        SELECT ticket_id, MAX(check_in_time) as check_in_time, MAX(gate_name) as gate_name, MAX(staff_id) as staff_id
        FROM gate_records WHERE check_status='success' {f"AND event_id='{event_id}'" if event_id else ""}
        GROUP BY ticket_id
    ) g ON t.ticket_id = g.ticket_id
    WHERE t.ticket_type_id = '{selected_tt_id}' {f"AND t.event_id='{event_id}'" if event_id else ""}
    ORDER BY t.purchase_time DESC
    LIMIT 500
    """
    tt_tickets = db.query_to_df(tickets_sql)
    masked = permission_manager.mask_sensitive_data(tt_tickets, "tickets", role)
    masked = permission_manager.mask_sensitive_data(masked, "orders", role)

    status_filter = st.multiselect(
        "按核销状态筛选",
        ["已核销", "未核销"],
        default=[],
        key=f"tt_status_filter_{tt_idx}",
    )
    filtered = masked
    if status_filter:
        filtered = filtered.filter(pl.col("核销状态").is_in(status_filter))

    show_raw = st.checkbox("显示原始票码（需权限）", value=False, key=f"tt_raw_code_{tt_idx}")
    if not permission_manager.can_view_sensitive(role, "tickets", "ticket_code"):
        show_raw = False

    display = filtered
    if not show_raw:
        display = safe_drop_columns(display, ["ticket_code"])
    display = safe_drop_columns(display, ["ticket_id"])
    style_dataframe(display, height=380)

    if filtered.height > 0:
        st.divider()
        st.markdown("#### 🔬 继续下钻：选择门票查看闸机原始记录")

        tkt_options = [
            (row.get("ticket_id", ""), f"{row.get('持票人', '?') or '匿名'} | {row.get('核销状态', '')} | {str(row.get('座位', ''))}")
            for row in filtered.iter_rows(named=True)
        ]
        valid = [(tid, label) for tid, label in tkt_options if tid]
        if valid:
            tkt_idx = st.selectbox(
                "选择门票查看闸机记录",
                range(len(valid)),
                format_func=lambda i: valid[i][1],
                key=f"tt_ticket_{tt_idx}",
            )
            sel_ticket_id = valid[tkt_idx][0]

            raw = analytics.get_raw_gate_records(ticket_id=sel_ticket_id, limit=50)
            if raw.height > 0:
                st.warning(f"⚠️ 该票共有 {raw.height} 条闸机记录（含成功/失败）")
                for rec in raw.iter_rows(named=True):
                    status_type = "success" if rec.get("check_status") == "success" else "error"
                    with st.expander(
                        f"🕒 {rec.get('check_in_time')} | {rec.get('gate_name', '?')} | {rec.get('check_status', '?')}"
                    ):
                        c1, c2 = st.columns(2)
                        c1.markdown(f"- **检票口ID**：{rec.get('gate_id')}")
                        c1.markdown(f"- **检票员ID**：{rec.get('staff_id')}")
                        c2.markdown(f"- **状态**：{status_badge(rec.get('check_status'), status_type)}", unsafe_allow_html=True)
                        if rec.get("fail_reason"):
                            st.markdown(f"- **失败原因**：`{rec.get('fail_reason')}`")
                        if rec.get("check_out_time"):
                            st.markdown(f"- **出场时间**：{rec.get('check_out_time')}")
                        if rec.get("device_info") or rec.get("raw_payload"):
                            left, right = st.columns(2)
                            if rec.get("device_info"):
                                try:
                                    dev = json.loads(rec["device_info"]) if isinstance(rec["device_info"], str) else rec["device_info"]
                                    with left.expander("🖥️ 设备信息"):
                                        st.json(dev)
                                except Exception:
                                    pass
                            if rec.get("raw_payload"):
                                try:
                                    rp = json.loads(rec["raw_payload"]) if isinstance(rec["raw_payload"], str) else rec["raw_payload"]
                                    with right.expander("📦 原始扫描数据"):
                                        st.json(rp)
                                except Exception:
                                    pass
            else:
                st.info("该票暂无闸机记录")
