import streamlit as st
import pandas as pd
import json
from src.data.queries import Queries


def render_detail_trace():
    st.markdown("## 🔍 报名明细追溯")
    queries = Queries()

    st.info(
        "输入报名ID查看完整记录链路：报名表 → 支付流水 → 签到码 → 座位 → 退票记录，"
        "所有数据可追溯到票务平台原始记录（支持大麦网、猫眼、微信小程序、官方自研等多平台）。"
    )

    reg_id = st.text_input(
        "输入报名ID",
        placeholder="例如：REG202606001",
        key="detail_reg_id"
    )

    if reg_id.strip():
        try:
            detail = queries.get_registration_detail(reg_id.strip()).to_pandas()

            if len(detail) == 0:
                st.warning("未找到该报名ID的记录")
                return

            row = detail.iloc[0]

            platform_sql = f"SELECT name, base_url, api_prefix FROM platforms WHERE code = '{row['platform_code']}'"
            try:
                platform_info = queries.ddb.query(platform_sql).to_pandas()
                platform_name = platform_info.iloc[0]["name"] if len(platform_info) > 0 else row["platform_code"]
                platform_base_url = platform_info.iloc[0]["base_url"] if len(platform_info) > 0 else "#"
            except Exception:
                platform_name = row.get("platform_code", "未知平台")
                platform_base_url = "#"

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
                    "平台订单号": row.get("platform_order_id", "N/A"),
                    "赞助商ID": row["sponsor_id"] if pd.notna(row.get("sponsor_id")) else "无"
                }
                for k, v in reg_info.items():
                    st.markdown(f"- **{k}**: {v}")

                st.markdown("#### 🔗 平台原始记录链接")
                platform_reg_url = platform_base_url + "/api/trade/" + row.get("platform_order_id", "")
                st.markdown(f"[{platform_name} - 报名详情]({platform_reg_url})")

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

                    pay_platform_code = row.get("payment_platform_code", row.get("platform_code", ""))
                    pay_platform_sql = f"SELECT name, base_url FROM platforms WHERE code = '{pay_platform_code}'"
                    try:
                        pay_pf = queries.ddb.query(pay_platform_sql).to_pandas()
                        if len(pay_pf) > 0:
                            pay_platform_name = pay_pf.iloc[0]["name"]
                            pay_platform_url = pay_pf.iloc[0]["base_url"]
                            full_url = pay_platform_url + "/payments/" + str(row.get("platform_payment_id", ""))
                            st.markdown(f"#### 🔗 平台原始记录链接")
                            st.markdown(f"[{pay_platform_name} - 支付流水]({full_url})")
                    except Exception:
                        pass
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

                    checkin_platform_url = platform_base_url + "/checkin/" + str(row["checkin_code"])
                    st.markdown(f"#### 🔗 平台原始记录链接")
                    st.markdown(f"[{platform_name} - 签到码详情]({checkin_platform_url})")
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

                    refund_platform_url = platform_base_url + "/refund/" + str(row.get("platform_refund_id", row["refund_id"]))
                    st.markdown(f"#### 🔗 平台原始记录链接")
                    st.markdown(f"[{platform_name} - 退票记录]({refund_platform_url})")

                    if row["refund_status"] == "disputed":
                        st.error("⚠️ 该退票存在争议，请前往退票争议页面处理")
                else:
                    st.info("暂无退票记录")

            with tab6:
                st.markdown("#### 🔬 平台原始记录（多平台）")
                st.caption("从 platform_raw_records 表读取的真实原始数据，包含平台返回的完整 JSON payload")

                reg_raw = queries.get_platform_raw_records("registration", row["registration_id"]).to_pandas()
                pay_raw = queries.get_platform_raw_records("payment", row.get("payment_id")).to_pandas() if pd.notna(row.get("payment_id")) else pd.DataFrame()

                if len(reg_raw) == 0 and len(pay_raw) == 0:
                    st.warning("未找到对应的平台原始同步记录")
                else:
                    all_raw = pd.concat([reg_raw, pay_raw], ignore_index=True)

                    for _, raw in all_raw.iterrows():
                        with st.expander(
                            f"[{raw['platform_name']}] {raw['source_type']} - {raw['platform_record_id']}  "
                            f"(同步于 {raw['synced_at']})",
                            expanded=True
                        ):
                            st.markdown(f"**平台**: {raw['platform_name']}")
                            st.markdown(f"**原始记录ID**: {raw['platform_record_id']}")
                            st.markdown(f"**平台链接**: [{raw['platform_url']}]({raw['platform_url']})")

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
