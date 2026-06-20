import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from src.data.queries import Queries


GAP_COLORS = {
    "not_generated": "#EF4444",
    "not_sent": "#F59E0B",
    "not_checked_in": "#6366F1",
    "normal": "#10B981"
}

GAP_LABELS = {
    "not_generated": "🔴 未生成",
    "not_sent": "🟡 未发送",
    "not_checked_in": "🟣 已发未核",
    "normal": "🟢 正常核销"
}


def render_checkin_codes():
    st.markdown("## 🎫 签到码核销追踪")
    queries = Queries()

    gaps = queries.get_checkin_code_gaps()
    gaps_df = gaps.to_pandas()

    all_codes_sql = """
    SELECT
        cc.*,
        r.ticket_type,
        r.attendee_name,
        r.seat_id,
        r.sponsor_id,
        CASE
            WHEN cc.generated = false THEN 'not_generated'
            WHEN cc.sent = false THEN 'not_sent'
            WHEN cc.checked_in = false THEN 'not_checked_in'
            ELSE 'normal'
        END AS gap_type
    FROM checkin_codes cc
    LEFT JOIN registrations r ON cc.registration_id = r.registration_id
    """
    all_codes = queries.ddb.query(all_codes_sql).to_pandas()

    total = len(all_codes)
    normal = len(all_codes[all_codes["gap_type"] == "normal"])
    not_gen = len(all_codes[all_codes["gap_type"] == "not_generated"])
    not_sent = len(all_codes[all_codes["gap_type"] == "not_sent"])
    not_checked = len(all_codes[all_codes["gap_type"] == "not_checked_in"])

    st.markdown("### 🚨 数据缺口概览")
    st.info(
        "⚠️ 缺口数据单独染色展示，避免被平均值掩盖。"
        "点击下方分类可逐层展开查看明细。"
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("签到码总数", f"{total:,}")
    with col2:
        st.metric(
            "✅ 正常核销",
            f"{normal:,}",
            delta=f"{normal/total*100:.1f}%"
        )
    with col3:
        st.metric(
            "🔴 未生成",
            f"{not_gen:,}",
            delta=f"占 {not_gen/total*100:.1f}%",
            delta_color="inverse"
        )
    with col4:
        st.metric(
            "🟡 未发送",
            f"{not_sent:,}",
            delta=f"占 {not_sent/total*100:.1f}%",
            delta_color="inverse"
        )

    st.markdown("---")

    tab1, tab2, tab3 = st.tabs(["📊 按票种展开", "🏢 按赞助商展开", "📋 完整缺口清单"])

    with tab1:
        _render_by_ticket_type(all_codes, queries)

    with tab2:
        _render_by_sponsor(all_codes, queries)

    with tab3:
        _render_gap_detail(gaps_df, queries)

    st.markdown("---")
    st.markdown("### 📈 核销时段分布")

    time_dist_sql = """
    SELECT
        DATE_TRUNC('minute', checkin_time) AS checkin_minute,
        COUNT(*) AS count
    FROM checkin_codes
    WHERE checked_in = true
    GROUP BY checkin_minute
    ORDER BY checkin_minute
    """
    time_dist = queries.ddb.query(time_dist_sql).to_pandas()

    if len(time_dist) > 0:
        fig_time = px.area(
            time_dist,
            x="checkin_minute",
            y="count",
            color_discrete_sequence=["#3B82F6"],
            title="每分钟核销数量"
        )
        fig_time.update_layout(
            xaxis_title="时间",
            yaxis_title="核销数量",
            height=300,
            margin=dict(l=10, r=10, t=30, b=10)
        )
        st.plotly_chart(fig_time, use_container_width=True)

        with st.expander("📌 核销时段结论", expanded=True):
            peak_minute = time_dist.loc[time_dist["count"].idxmax()]
            st.success(
                f"高峰时段：{peak_minute['checkin_minute'].strftime('%H:%M')}，"
                f"单分钟核销 {peak_minute['count']} 人"
            )
            st.info(
                f"建议：在 {peak_minute['checkin_minute'].strftime('%H:%M')} 前后"
                f"15分钟增加临时通道，缓解入场压力。"
            )


def _render_by_ticket_type(all_codes_df: pd.DataFrame, queries: Queries):
    ticket_summary = all_codes_df.groupby(["ticket_type", "gap_type"]).agg(
        count=("checkin_code", "count")
    ).reset_index()

    ticket_totals = all_codes_df.groupby("ticket_type").agg(
        total=("checkin_code", "count")
    ).reset_index()

    ticket_summary = ticket_summary.merge(ticket_totals, on="ticket_type")
    ticket_summary["percentage"] = ticket_summary["count"] / ticket_summary["total"] * 100

    fig = go.Figure()

    gap_order = ["not_generated", "not_sent", "not_checked_in", "normal"]
    for gap in gap_order:
        subset = ticket_summary[ticket_summary["gap_type"] == gap]
        fig.add_trace(go.Bar(
            x=subset["ticket_type"],
            y=subset["count"],
            name=GAP_LABELS.get(gap, gap),
            marker_color=GAP_COLORS.get(gap, "#ccc"),
            text=subset["count"].astype(int).astype(str),
            textposition="inside",
            customdata=subset[["percentage"]].round(1),
            hovertemplate=(
                "票种: %{x}<br>"
                "数量: %{y}<br>"
                "占比: %{customdata[0]}%"
            )
        ))

    fig.update_layout(
        barmode="stack",
        xaxis_title="票种类型",
        yaxis_title="签到码数量",
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig, use_container_width=True)

    selected_ticket = st.selectbox(
        "🔍 选择票种查看明细",
        options=all_codes_df["ticket_type"].dropna().unique(),
        key="ticket_detail_select"
    )

    if selected_ticket:
        ticket_detail = all_codes_df[all_codes_df["ticket_type"] == selected_ticket].copy()
        st.markdown(f"#### {selected_ticket} - 共 {len(ticket_detail)} 个签到码")

        gap_filter = st.multiselect(
            "筛选状态",
            options=list(GAP_LABELS.keys()),
            default=list(GAP_LABELS.keys()),
            format_func=lambda x: GAP_LABELS.get(x, x),
            key=f"ticket_gap_filter_{selected_ticket}"
        )

        if gap_filter:
            ticket_detail = ticket_detail[ticket_detail["gap_type"].isin(gap_filter)]

        display_df = ticket_detail[[
            "checkin_code", "attendee_name", "ticket_type",
            "seat_id", "generated", "sent", "checked_in",
            "checkin_time", "gap_type"
        ]].copy()

        display_df = _style_gap_column(display_df)

        st.dataframe(
            display_df,
            use_container_width=True,
            height=300,
            hide_index=True,
            column_config={
                "generated": st.column_config.CheckboxColumn("已生成"),
                "sent": st.column_config.CheckboxColumn("已发送"),
                "checked_in": st.column_config.CheckboxColumn("已核销")
            }
        )


def _render_by_sponsor(all_codes_df: pd.DataFrame, queries: Queries):
    sponsor_codes = all_codes_df[all_codes_df["sponsor_id"].notna()].copy()

    if len(sponsor_codes) == 0:
        st.info("暂无赞助商签到码数据")
        return

    sponsor_summary = sponsor_codes.groupby(["sponsor_id", "gap_type"]).agg(
        count=("checkin_code", "count")
    ).reset_index()

    sponsor_totals = sponsor_codes.groupby("sponsor_id").agg(
        total=("checkin_code", "count")
    ).reset_index()

    sponsor_summary = sponsor_summary.merge(sponsor_totals, on="sponsor_id")
    sponsor_summary["percentage"] = sponsor_summary["count"] / sponsor_summary["total"] * 100

    fig = go.Figure()

    gap_order = ["not_generated", "not_sent", "not_checked_in", "normal"]
    for gap in gap_order:
        subset = sponsor_summary[sponsor_summary["gap_type"] == gap]
        fig.add_trace(go.Bar(
            x=subset["sponsor_id"],
            y=subset["count"],
            name=GAP_LABELS.get(gap, gap),
            marker_color=GAP_COLORS.get(gap, "#ccc"),
            text=subset["count"].astype(int).astype(str),
            textposition="inside"
        ))

    fig.update_layout(
        barmode="stack",
        xaxis_title="赞助商",
        yaxis_title="签到码数量",
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("#### 📋 赞助商签到码详情")
    sponsor_attendees = queries.get_sponsor_attendees().to_pandas()

    if len(sponsor_attendees) > 0:
        st.dataframe(
            sponsor_attendees,
            use_container_width=True,
            height=300,
            hide_index=True
        )


def _render_gap_detail(gaps_df: pd.DataFrame, queries: Queries):
    if len(gaps_df) == 0:
        st.success("🎉 所有签到码状态正常，无数据缺口！")
        return

    st.markdown(f"### ⚠️ 共发现 {len(gaps_df)} 个数据缺口")

    gap_type_filter = st.multiselect(
        "按缺口类型筛选",
        options=gaps_df["gap_type"].unique(),
        default=gaps_df["gap_type"].unique(),
        format_func=lambda x: GAP_LABELS.get(x, x),
        key="gap_type_filter"
    )

    if gap_type_filter:
        gaps_df = gaps_df[gaps_df["gap_type"].isin(gap_type_filter)]

    display_df = gaps_df[[
        "checkin_code", "registration_id", "attendee_name",
        "ticket_type", "seat_id", "gap_type"
    ]].copy()

    display_df = _style_gap_column(display_df)

    st.dataframe(
        display_df,
        use_container_width=True,
        height=400,
        hide_index=True
    )

    with st.expander("📝 缺口处理建议", expanded=True):
        st.markdown("""
        **🔴 未生成签到码**
        - 检查报名系统与票务平台的数据同步
        - 确认支付成功后是否触发签到码生成逻辑
        - 可能存在支付回调延迟或失败

        **🟡 未发送签到码**
        - 检查短信/邮件发送服务状态
        - 确认发送队列是否有积压
        - 检查联系方式格式是否正确

        **🟣 已发未核**
        - 可能是观众未到场
        - 也可能是签到设备故障或人工漏扫
        - 建议与现场工作人员核实
        """)


def _style_gap_column(df: pd.DataFrame) -> pd.DataFrame:
    def color_gap(val):
        colors = {
            "not_generated": "background-color: #FEE2E2; color: #991B1B",
            "not_sent": "background-color: #FEF3C7; color: #92400E",
            "not_checked_in": "background-color: #E0E7FF; color: #3730A3",
            "normal": "background-color: #D1FAE5; color: #065F46"
        }
        return colors.get(val, "")

    if "gap_type" in df.columns:
        df["状态"] = df["gap_type"].map(GAP_LABELS).fillna(df["gap_type"])
        df = df.drop(columns=["gap_type"])

    return df
