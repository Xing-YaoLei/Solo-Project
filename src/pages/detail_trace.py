import streamlit as st
import pandas as pd
import json
from src.data.queries import Queries


def render_detail_trace():
    st.markdown("## 🔍 报名明细追溯")
    queries = Queries()

    st.info(
        "输入报名ID查看完整记录链路：报名表 → 支付流水 → 签到码 → 座位 → 退票记录，"
        "所有平台原始记录从 platform_raw_records 表统一读取，支持大麦网、猫眼、微信小程序、官方自研等多平台。"
    )

    reg_id = st.text_input(
        "输入报名ID",
        placeholder="例如：REG202606001",
        key="detail_reg_id"
    )

    if not reg_id.strip():
        return

    try:
        detail = queries.get_registration_detail(reg_id.strip()).to_pandas()

        if len(detail) == 0:
            st.warning("未找到该报名ID的记录")
            return

        row = detail.iloc[0]

        platform_links = queries.get_platform_links_for_registration(reg_id.strip()).to_pandas()

        reg_platform = platform_links[platform_links["source_type"] == "registration"]
        pay_platform = platform_links[platform_links["source_type"] == "payment"]

        platform_name = reg_platform.iloc[0]["platform_name"] if len(reg_platform) > 0 else (row.get("platform_code", "未知"))
        platform_url = reg_platform.iloc[0]["platform_url"] if len(reg_platform) > 0 else ""
        platform_record_id = reg_platform.iloc[0]["platform_record_id"] if len(reg_platform) > 0 else ""

        st.markdown("### 📋 基本信息")
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("报名ID", row["registration_id"])
        with col2:
            st.metric("姓名", row["attendee_name"])
        with col3:
            st.metric("票种", row["ticket_type"])
        with col4:
            st.metric("来源平台", platform_name)

        st.markdown("---")

        tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
            "📝 报名表", "💳 支付流水", "🎫 签到码", "🪑 座位信息", "💸 退票记录", "🔬 平台原始记录"
        ])

        with tab1:
            st.markdown("#### 报名信息")
            reg_info = {
                "报名ID": row["registration_id"],
                "姓名": row["attendee_name"],
                "邮箱": row["email"],
                "手机": row["phone"],
                "票种": row["ticket_type"],
                "状态": row["status"],
                "报名时间": str(row["registration_time"]),
                "来源平台": platform_name,
                "平台订单号": row.get("platform_order_id", platform_record_id),
                "赞助商ID": row["sponsor_id"] if pd.notna(row.get("sponsor_id")) else "无"
            }
            for k, v in reg_info.items():
                st.markdown(f"- **{k}**: {v}")

            st.markdown("#### 🔗 平台原始记录链接")
            if len(reg_platform) > 0:
                for _, link in reg_platform.iterrows():
                    url = link["platform_url"]
                    rid = link["platform_record_id"]
                    if url and url.strip():
                        st.markdown(f"- [{link['platform_name']} - 报名详情]({url})  `{rid}`")
                    else:
                        st.markdown(f"- **{link['platform_name']}** — 平台记录ID: `{rid}`")
            else:
                st.caption("暂无报名平台原始记录")

        with tab2:
            if pd.notna(row.get("payment_id")):
                st.markdown("#### 支付信息")
                pay_info = {
                    "支付ID": row["payment_id"],
                    "金额": f"¥{row['payment_amount']:.2f}",
                    "状态": row["payment_status"],
                    "支付方式": row["payment_method"],
                    "支付时间": str(row["payment_time"]) if pd.notna(row["payment_time"]) else "未支付",
                    "交易单号": row.get("transaction_id", "N/A"),
                    "平台支付号": row.get("platform_payment_id", "N/A"),
                }
                for k, v in pay_info.items():
                    st.markdown(f"- **{k}**: {v}")

                st.markdown("#### 🔗 平台原始记录链接")
                if len(pay_platform) > 0:
                    for _, link in pay_platform.iterrows():
                        url = link["platform_url"]
                        rid = link["platform_record_id"]
                        if url and url.strip():
                            st.markdown(f"- [{link['platform_name']} - 支付流水]({url})  `{rid}`")
                        else:
                            st.markdown(f"- **{link['platform_name']}** — 平台记录ID: `{rid}`")
                else:
                    st.caption("暂无支付平台原始记录")
            else:
                st.info("暂无支付记录")

        with tab3:
            if pd.notna(row.get("checkin_code")):
                st.markdown("#### 签到码信息")

                status_color = "#10B981" if row["checked_in"] else "#EF4444"
                status_text = "✅ 已核销" if row["checked_in"] else "❌ 未核销"

                st.markdown(
                    f"""
                    <div style="padding: 15px; background: #F8FAFC; border-radius: 8px;">
                        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px;">
                            {row['checkin_code']}
                        </div>
                        <div style="color: {status_color}; font-weight: bold;">
                            {status_text}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

                code_info = {
                    "是否生成": "是" if row["code_generated"] else "否",
                    "是否发送": "是" if row["code_sent"] else "否",
                    "是否核销": "是" if row["checked_in"] else "否",
                    "核销时间": str(row["checkin_time"]) if pd.notna(row["checkin_time"]) else "未核销"
                }
                for k, v in code_info.items():
                    st.markdown(f"- **{k}**: {v}")

                st.markdown("#### 🔗 平台原始记录链接")
                if platform_url and platform_url.strip():
                    st.markdown(f"- [{platform_name} - 签到码详情]({platform_url}/checkin/{row['checkin_code']})")
                else:
                    st.caption("签到码追溯信息见下方「平台原始记录」Tab")
            else:
                st.error("⚠️ 无签到码记录，请检查数据同步")

        with tab4:
            if pd.notna(row.get("seat_id")):
                st.markdown("#### 座位信息")
                seat_info = {
                    "座位ID": row["seat_id"],
                    "区域": row["section"],
                    "排号": row["seat_row"],
                    "座号": row["seat_number"],
                    "座位类型": row["seat_type"]
                }
                for k, v in seat_info.items():
                    st.markdown(f"- **{k}**: {v}")
            else:
                st.info("无分配座位")

        with tab5:
            if pd.notna(row.get("refund_id")):
                st.markdown("#### 退票信息")
                refund_info = {
                    "退票ID": row["refund_id"],
                    "退票金额": f"¥{row['refund_amount']:.2f}",
                    "退票状态": row["refund_status"],
                    "平台退票号": row.get("platform_refund_id", "N/A"),
                }
                for k, v in refund_info.items():
                    st.markdown(f"- **{k}**: {v}")

                if row["refund_status"] == "disputed":
                    st.error("⚠️ 该退票存在争议，请前往退票争议页面处理")

                st.markdown("#### 🔗 平台原始记录链接")
                if len(reg_platform) > 0:
                    for _, link in reg_platform.iterrows():
                        url = link["platform_url"]
                        rid = link["platform_record_id"]
                        if url and url.strip():
                            st.markdown(f"- [{link['platform_name']} - 退票记录]({url}/refund/{row['refund_id']})  `{rid}`")
                        else:
                            st.markdown(f"- **{link['platform_name']}** — 退票关联平台记录ID: `{rid}`")
                else:
                    st.caption("暂无退票关联的平台原始记录")
            else:
                st.info("暂无退票记录")

        with tab6:
            st.markdown("#### 🔬 平台原始记录（多平台）")
            st.caption("从 platform_raw_records 表统一读取，涵盖报名和支付两个链路的完整 JSON payload")

            if len(platform_links) == 0:
                st.warning("未找到对应的平台原始同步记录（导入数据后自动生成）")
            else:
                for _, raw in platform_links.iterrows():
                    with st.expander(
                        f"[{raw['platform_name']}] {raw['source_type']} - {raw['platform_record_id']}  "
                        f"(同步于 {raw['synced_at']})",
                        expanded=True
                    ):
                        st.markdown(f"**平台**: {raw['platform_name']}")
                        st.markdown(f"**原始记录ID**: {raw['platform_record_id']}")

                        url = raw["platform_url"]
                        if url and url.strip():
                            st.markdown(f"**平台链接**: [{url}]({url})")
                        else:
                            st.markdown(f"**平台链接**: 无（本地导入数据）")

                        st.markdown("**原始 JSON Payload:**")
                        try:
                            payload = json.loads(raw["raw_payload"])
                            st.json(payload)
                        except Exception:
                            st.code(raw["raw_payload"], language="json")

    except Exception as e:
        st.error(f"查询出错: {str(e)}")
        import traceback
        with st.expander("调试信息"):
            st.code(traceback.format_exc())
