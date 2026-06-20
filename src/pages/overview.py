from __future__ import annotations

import streamlit as st
import polars as pl
from typing import Optional

from src.data.analytics import TicketAnalytics
from src.auth.permissions import permission_manager, UserRole, ROLE_LABELS
from src.ui.charts import (
    make_funnel_chart,
    make_timeline_chart,
    make_sponsor_chart,
    make_ticket_type_chart,
    make_gate_efficiency_chart,
    make_staff_chart,
    metric_card,
    style_dataframe,
)


def render_overview_page(event_id: Optional[str] = None) -> None:
    analytics = TicketAnalytics(event_id)
    role = permission_manager.get_current_role()

    st.markdown("## 🎯 核销总览看板")

    metrics = analytics.get_efficiency_metrics()
    if not metrics:
        st.info("暂无数据，请先生成模拟数据。")
        return

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        metric_card("📊 总出票数", metrics.get("总出票数", 0), help_text="所有渠道出票总数")
    with col2:
        metric_card("💰 已支付", metrics.get("已支付票数", 0), help_text="完成支付的有效票数")
    with col3:
        metric_card("✅ 已核销", metrics.get("已核销票数", 0), help_text="现场成功检票入场票数",
                   delta=str(metrics.get("核销率", "0%")))
    with col4:
        metric_card("↩️ 退票数", metrics.get("退票数", 0), help_text="已申请并完成退票数量",
                   delta=str(metrics.get("退票率", "0%")), delta_color="inverse")

    col5, col6, col7, col8 = st.columns(4)
    with col5:
        metric_card("⚠️ 检票失败", metrics.get("检票失败次数", 0), help_text="检票异常次数",
                   delta=str(metrics.get("失败率", "0%")), delta_color="inverse")
    with col6:
        metric_card("🚀 峰值吞吐", f"{metrics.get('峰值吞吐量(票/分钟)', 0)}/分钟",
                   help_text="每分钟最高检票数")
    with col7:
        first = metrics.get("首个入场时间", "-")
        if hasattr(first, 'strftime'):
            first = first.strftime("%m-%d %H:%M")
        metric_card("🕐 首检时间", first)
    with col8:
        last = metrics.get("最后入场时间", "-")
        if hasattr(last, 'strftime'):
            last = last.strftime("%m-%d %H:%M")
        metric_card("🕚 末检时间", last)

    st.divider()

    col_funnel, col_conclusion = st.columns([2, 1])
    with col_funnel:
        funnel_df = analytics.get_funnel_chart_data()
        st.plotly_chart(make_funnel_chart(funnel_df), use_container_width=True)

    with col_conclusion:
        st.markdown("### 📝 处理结论")
        conclusions = analytics.get_processing_conclusions(related_type="funnel")
        if conclusions.height > 0:
            for row in conclusions.iter_rows(named=True):
                with st.expander(f"✅ {row['conclusion_title']}", expanded=True):
                    st.caption(f"作者：{row.get('author', '-')} · 更新于 {row.get('updated_at', '-')}")
                    st.write(row["conclusion_content"])
                    if row.get("conclusion_type") == "recommendation":
                        st.success(f"**类型：建议**")
        else:
            st.info("暂无处理结论")

    st.divider()

    st.markdown("### ⏰ 入场时间分布")
    interval = st.selectbox(
        "时间粒度",
        options=["5minute", "15minute", "hour", "minute"],
        format_func=lambda x: {"5minute": "5分钟", "15minute": "15分钟", "hour": "1小时", "minute": "1分钟"}[x],
        index=0,
        key="overview_interval",
    )
    timeline_df = analytics.get_checkin_timeline(interval=interval)
    st.plotly_chart(make_timeline_chart(timeline_df, "检票入场时间分布"), use_container_width=True)

    st.divider()

    can_view_sponsor = permission_manager.can_view_sponsors(role)
    col_sponsor, col_ttype = st.columns(2)

    with col_sponsor:
        if can_view_sponsor:
            sponsor_df = analytics.get_sponsor_breakdown()
            st.plotly_chart(make_sponsor_chart(sponsor_df), use_container_width=True)
            with st.expander("📋 赞助商详细数据"):
                style_dataframe(sponsor_df)
        else:
            st.warning("🔒 您无权限查看赞助商数据")

    with col_ttype:
        tt_df = analytics.get_ticket_type_breakdown()
        st.plotly_chart(make_ticket_type_chart(tt_df), use_container_width=True)
        with st.expander("📋 票种详细数据"):
            if permission_manager.can_view_sensitive(role, "ticket_types", "price"):
                style_dataframe(tt_df)
            else:
                masked = tt_df.drop(["price", "total_revenue"]) if "price" in tt_df.columns else tt_df
                style_dataframe(masked)

    st.divider()

    can_view_gate = permission_manager.can_view_checkin_details(role)
    if can_view_gate:
        col_gate, col_staff = st.columns(2)
        with col_gate:
            gate_df = analytics.get_gate_efficiency()
            st.plotly_chart(make_gate_efficiency_chart(gate_df), use_container_width=True)
        with col_staff:
            staff_df = analytics.get_staff_performance()
            st.plotly_chart(make_staff_chart(staff_df), use_container_width=True)
    else:
        st.warning("🔒 您无权限查看检票口和人员绩效数据")
