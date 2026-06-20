import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from src.data.queries import Queries


def render_overview():
    st.markdown("## 📊 核销总览")
    queries = Queries()

    stats = queries.get_overview_stats().row(0, named=True)
    efficiency = queries.get_checkin_efficiency_hourly()
    cumulative = queries.get_checkin_efficiency_cumulative()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "报名总数",
            f"{stats['total_registrations']:,}",
            delta=f"已确认 {stats['confirmed_registrations']:,}",
            delta_color="normal"
        )

    with col2:
        checkin_rate = (stats['checked_in_count'] / stats['total_codes'] * 100) if stats['total_codes'] > 0 else 0
        st.metric(
            "签到核销率",
            f"{checkin_rate:.1f}%",
            delta=f"{stats['checked_in_count']:,} / {stats['total_codes']:,}",
            delta_color="normal"
        )

    with col3:
        st.metric(
            "支付成功",
            f"{stats['successful_payments']:,} 笔",
            delta=f"成功率 {stats['successful_payments']/stats['total_registrations']*100:.1f}%"
        )

    with col4:
        st.metric(
            "退票争议",
            f"{stats['disputed_refunds']:,} 笔",
            delta=f"共 {stats['total_refunds']:,} 笔退票",
            delta_color="inverse"
        )

    st.markdown("---")

    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.markdown("### 📈 核销效率趋势")
        fig_eff = go.Figure()

        eff_data = efficiency.to_pandas()
        if len(eff_data) > 0:
            fig_eff.add_trace(go.Bar(
                x=eff_data["checkin_hour"],
                y=eff_data["checkin_count"],
                name="每小时核销数",
                marker_color="#3B82F6",
                opacity=0.7
            ))

            cum_data = cumulative.to_pandas()
            fig_eff.add_trace(go.Scatter(
                x=cum_data["checkin_hour"],
                y=cum_data["cumulative_pct"],
                name="累计核销率",
                yaxis="y2",
                mode="lines+markers",
                line=dict(color="#10B981", width=3),
                marker=dict(size=6)
            ))

            fig_eff.update_layout(
                xaxis_title="时间",
                yaxis_title="核销数量",
                yaxis2=dict(
                    title="累计核销率(%)",
                    overlaying="y",
                    side="right",
                    range=[0, 100]
                ),
                hovermode="x unified",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                height=400,
                margin=dict(l=10, r=10, t=10, b=10)
            )

        st.plotly_chart(fig_eff, use_container_width=True)

        with st.expander("📋 查看结论与备注", expanded=True):
            if checkin_rate < 80:
                st.error(
                    f"⚠️ 核销率仅 {checkin_rate:.1f}%，低于预期 85% 目标。"
                    f"建议排查签到码发放和现场入口效率问题。"
                )
            elif checkin_rate < 90:
                st.warning(
                    f"📌 核销率 {checkin_rate:.1f}%，接近目标值。"
                    f"需关注晚到观众和入口高峰时段排队情况。"
                )
            else:
                st.success(
                    f"✅ 核销率 {checkin_rate:.1f}%，表现优秀。"
                    f"现场组织有序，可继续保持。"
                )

            if len(eff_data) > 0:
                peak_hour = eff_data.loc[eff_data["checkin_count"].idxmax()]
                peak_time = peak_hour["checkin_hour"]
                peak_str = peak_time.strftime('%H:%M') if hasattr(peak_time, 'strftime') else str(peak_time)
                st.info(
                    f"⏰ 核销高峰：{peak_str} 时段，"
                    f"单小时核销 {peak_hour['checkin_count']} 人。"
                )

    with col_right:
        st.markdown("### 🎫 票种分布")
        ticket_sql = """
        SELECT ticket_type, COUNT(*) as count
        FROM registrations
        WHERE status = 'confirmed'
        GROUP BY ticket_type
        ORDER BY count DESC
        """
        ticket_dist = queries.ddb.query(ticket_sql).to_pandas()

        fig_pie = px.pie(
            ticket_dist,
            values="count",
            names="ticket_type",
            hole=0.5,
            color_discrete_sequence=["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]
        )
        fig_pie.update_layout(
            showlegend=True,
            height=300,
            margin=dict(l=10, r=10, t=10, b=10)
        )
        st.plotly_chart(fig_pie, use_container_width=True)

        st.markdown("### 🏢 赞助商概览")
        st.metric("赞助商数量", f"{stats['sponsor_count']} 家")

        sponsor_sql = """
        SELECT sponsor_level, COUNT(*) as count
        FROM sponsors
        GROUP BY sponsor_level
        ORDER BY count DESC
        """
        sponsor_levels = queries.ddb.query(sponsor_sql).to_pandas()
        for _, row in sponsor_levels.iterrows():
            st.caption(f"{row['sponsor_level']}级：{row['count']} 家")

    st.markdown("---")

    st.markdown("### 🔍 风险速览")
    risk_col1, risk_col2, risk_col3 = st.columns(3)

    with risk_col1:
        gap_sql = """
        SELECT COUNT(*) as gap_count
        FROM checkin_codes
        WHERE generated = false OR sent = false
        """
        gap_count = queries.ddb.query(gap_sql).row(0, named=True)["gap_count"]
        st.metric(
            "签到码缺口",
            f"{gap_count:,}",
            delta="需重点关注",
            delta_color="inverse"
        )

    with risk_col2:
        no_checkin_sql = """
        SELECT COUNT(*) as count
        FROM checkin_codes
        WHERE generated = true AND sent = true AND checked_in = false
        """
        no_checkin = queries.ddb.query(no_checkin_sql).row(0, named=True)["count"]
        st.metric(
            "已发未核",
            f"{no_checkin:,}",
            delta="疑似未到场"
        )

    with risk_col3:
        sponsor_gap_sql = """
        SELECT COUNT(*) as count
        FROM registrations r
        JOIN sponsors s ON r.sponsor_id = s.sponsor_id
        LEFT JOIN checkin_codes cc ON r.registration_id = cc.registration_id
        WHERE r.status = 'confirmed' AND (cc.checked_in = false OR cc.checked_in IS NULL)
        """
        sponsor_gap = queries.ddb.query(sponsor_gap_sql).row(0, named=True)["count"]
        st.metric(
            "赞助票未核",
            f"{sponsor_gap:,}",
            delta="建议回访",
            delta_color="inverse"
        )
