import streamlit as st
import pandas as pd
from src.data.queries import Queries


def render_detail_trace():
    st.markdown("## 🔍 报名明细追溯")
    queries = Queries()

    st.info(
        "输入报名ID查看完整记录链路：报名表 → 支付流水 → 签到码 → 座位 → 退票记录，"
        "所有数据可追溯到票务平台原始记录。"
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

            st.markdown("### 📋 基本信息")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("报名ID", row["registration_id"])
            with col2:
                st.metric("姓名", row["attendee_name"])
            with col3:
                st.metric("票种", row["ticket_type"])

            st.markdown("---")

            tab1, tab2, tab3, tab4, tab5 = st.tabs([
                "📝 报名表", "💳 支付流水", "🎫 签到码", "🪑 座位信息", "💸 退票记录"
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
                    "报名时间": row["registration_time"],
                    "来源": row["source"],
                    "赞助商ID": row["sponsor_id"] if pd.notna(row["sponsor_id"]) else "无"
                }
                for k, v in reg_info.items():
                    st.markdown(f"- **{k}**: {v}")

                st.markdown("#### 🔗 票务平台原始记录")
                st.caption(
                    f"报名详情: https://ticket-platform.example.com/registration/{row['registration_id']}"
                )

            with tab2:
                if pd.notna(row["payment_id"]):
                    st.markdown("#### 支付信息")
                    pay_info = {
                        "支付ID": row["payment_id"],
                        "金额": f"¥{row['payment_amount']:.2f}",
                        "状态": row["payment_status"],
                        "支付方式": row["payment_method"],
                        "支付时间": row["payment_time"],
                        "交易单号": row.get("transaction_id", "N/A")
                    }
                    for k, v in pay_info.items():
                        st.markdown(f"- **{k}**: {v}")

                    st.markdown("#### 🔗 票务平台原始记录")
                    st.caption(
                        f"支付流水: https://ticket-platform.example.com/payment/{row['payment_id']}"
                    )
                else:
                    st.info("暂无支付记录")

            with tab3:
                if pd.notna(row["checkin_code"]):
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
                        "核销时间": row["checkin_time"] if pd.notna(row["checkin_time"]) else "未核销"
                    }
                    for k, v in code_info.items():
                        st.markdown(f"- **{k}**: {v}")

                    st.markdown("#### 🔗 票务平台原始记录")
                    st.caption(
                        f"签到码详情: https://ticket-platform.example.com/checkin/{row['checkin_code']}"
                    )
                else:
                    st.error("⚠️ 无签到码记录，请检查数据同步")

            with tab4:
                if pd.notna(row["seat_id"]):
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
                if pd.notna(row["refund_id"]):
                    st.markdown("#### 退票信息")
                    refund_info = {
                        "退票ID": row["refund_id"],
                        "退票金额": f"¥{row['refund_amount']:.2f}",
                        "退票状态": row["refund_status"]
                    }
                    for k, v in refund_info.items():
                        st.markdown(f"- **{k}**: {v}")

                    st.markdown("#### 🔗 票务平台原始记录")
                    st.caption(
                        f"退票记录: https://ticket-platform.example.com/refund/{row['refund_id']}"
                    )

                    if row["refund_status"] == "disputed":
                        st.error("⚠️ 该退票存在争议，请前往退票争议页面处理")
                else:
                    st.info("暂无退票记录")

        except Exception as e:
            st.error(f"查询出错: {str(e)}")
