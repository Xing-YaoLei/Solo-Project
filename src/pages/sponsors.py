import streamlit as st
import plotly.graph_objects as go
import pandas as pd
import json
from src.data.queries import Queries


def render_sponsors():
    st.markdown("## 🏢 赞助清单核销追踪")
    queries = Queries()

    sponsor_list = queries.get_sponsor_list()
    sponsors_df = sponsor_list.to_pandas()

    if len(sponsors_df) == 0:
        st.info("暂无赞助商数据")
        return

    total_allocated = sponsors_df["allocated_tickets"].sum()
    total_used = sponsors_df["used_tickets"].sum()
    total_checked = sponsors_df["checked_in_count"].sum()

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("赞助总配额", f"{total_allocated} 张")
    with col2:
        st.metric(
            "已使用",
            f"{total_used} 张",
            delta=f"使用率 {total_used/total_allocated*100:.1f}%"
        )
    with col3:
        st.metric(
            "已核销",
            f"{total_checked} 张",
            delta=f"核销率 {total_checked/total_used*100:.1f}%" if total_used > 0 else "0%",
            delta_color="normal"
        )

    st.markdown("---")

    st.markdown("### 📊 赞助商核销对比")

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=sponsors_df["sponsor_name"],
        y=sponsors_df["allocated_tickets"],
        name="配额",
        marker_color="#E5E7EB",
        text=sponsors_df["allocated_tickets"],
        textposition="inside"
    ))

    fig.add_trace(go.Bar(
        x=sponsors_df["sponsor_name"],
        y=sponsors_df["used_tickets"],
        name="已使用",
        marker_color="#3B82F6",
        text=sponsors_df["used_tickets"],
        textposition="inside"
    ))

    fig.add_trace(go.Bar(
        x=sponsors_df["sponsor_name"],
        y=sponsors_df["checked_in_count"],
        name="已核销",
        marker_color="#10B981",
        text=sponsors_df["checked_in_count"],
        textposition="inside"
    ))

    fig.update_layout(
        barmode="group",
        xaxis_title="赞助商",
        yaxis_title="票数",
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.markdown("### 📋 赞助详情清单")

    for _, sponsor in sponsors_df.iterrows():
        with st.expander(
            f"[{sponsor['sponsor_level']}] {sponsor['sponsor_name']}  |  "
            f"配额 {sponsor['allocated_tickets']} / 已用 {sponsor['used_tickets']} / "
            f"已核 {sponsor['checked_in_count']}",
            expanded=False
        ):
            attendees = queries.get_sponsor_attendees(sponsor["sponsor_id"]).to_pandas()

            if len(attendees) == 0:
                st.info("暂无参会人员")
                continue

            rate = sponsor['checked_in_count'] / sponsor['used_tickets'] * 100 if sponsor['used_tickets'] > 0 else 0
            if rate < 60:
                st.error(
                    f"⚠️ 核销率仅 {rate:.1f}%，低于预期。建议联系赞助商对接人确认到场情况。"
                )
            elif rate < 80:
                st.warning(f"📌 核销率 {rate:.1f}%，需关注未到场人员。")
            else:
                st.success(f"✅ 核销率 {rate:.1f}%，表现良好。")

            display_df = attendees[[
                "registration_id", "attendee_name", "email",
                "ticket_type", "seat_id", "status",
                "checkin_code", "checked_in", "checkin_time"
            ]].copy()

            display_df["checked_in"] = display_df["checked_in"].fillna(False).map({
                True: "✅ 已核销",
                False: "❌ 未核销"
            })

            st.dataframe(
                display_df,
                use_container_width=True,
                height=250,
                hide_index=True,
                column_config={
                    "registration_id": st.column_config.TextColumn("报名ID"),
                    "attendee_name": st.column_config.TextColumn("姓名"),
                    "email": st.column_config.TextColumn("邮箱"),
                    "ticket_type": st.column_config.TextColumn("票种"),
                    "seat_id": st.column_config.TextColumn("座位"),
                    "status": st.column_config.TextColumn("状态"),
                    "checkin_code": st.column_config.TextColumn("签到码"),
                    "checked_in": st.column_config.TextColumn("核销状态"),
                    "checkin_time": st.column_config.TextColumn("核销时间")
                }
            )

            st.markdown("#### 🔗 追溯到票务平台原始记录")

            reg_ids = attendees["registration_id"].tolist()
            _render_sponsor_platform_links(queries, reg_ids)


def _render_sponsor_platform_links(queries: Queries, registration_ids: list):
    if not registration_ids:
        st.caption("暂无关联的平台原始记录")
        return

    all_links = []
    for reg_id in registration_ids:
        try:
            links = queries.get_platform_links_for_registration(reg_id).to_pandas()
            if len(links) > 0:
                all_links.append(links)
        except Exception:
            continue

    if not all_links:
        st.caption("暂无关联的平台原始记录（导入数据后自动生成）")
        return

    combined = pd.concat(all_links, ignore_index=True)
    combined = combined.drop_duplicates(subset=["record_id"])

    grouped = combined.groupby("platform_name")

    for platform_name, group in grouped:
        with st.expander(f"📊 {platform_name} — {len(group)} 条记录", expanded=False):
            for _, link in group.iterrows():
                source_label = "报名" if link["source_type"] == "registration" else "支付"
                url = link["platform_url"]
                record_id = link["platform_record_id"]

                if url and url.strip():
                    st.markdown(f"- [{source_label}记录: {link['source_id']}]({url})  `{record_id}`")
                else:
                    st.markdown(f"- **{source_label}记录**: {link['source_id']} — `{record_id}`")

            with st.expander("🔬 查看 JSON Payload", expanded=False):
                for _, link in group.iterrows():
                    st.markdown(f"**{link['source_type']} / {link['source_id']}**")
                    try:
                        payload = json.loads(link["raw_payload"])
                        st.json(payload)
                    except Exception:
                        st.code(str(link["raw_payload"]), language="json")
                    st.markdown("---")
