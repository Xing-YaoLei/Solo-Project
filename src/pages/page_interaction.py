import streamlit as st
import polars as pl
from datetime import datetime

from src.utils.analyzer import risk_analyzer
from src.utils.ui_components import styled_dataframe, render_delay_banner

from config.settings import RISK_WORDS, INTERACTION_TYPES


RISK_WORD_EXPLANATIONS = {
    "退回": "文书审核未通过，需退回修改后重新提交",
    "补正": "文书内容存在缺失或不完整，需要补充材料",
    "不完整": "文书关键信息缺失，不符合归档要求",
    "错误": "文书内容存在实质性错误，需修正",
    "遗漏": "应当包含的内容或材料被遗漏",
    "逾期": "超过规定的办理或提交时限",
    "违规": "内容或流程违反相关规定",
    "异议": "对文书内容或处理结果存在异议",
    "撤销": "文书或相关决定被撤销",
    "无效": "文书不具备法律效力或无效",
    "瑕疵": "文书存在小的缺陷或问题",
    "风险": "存在潜在的法律风险或合规风险",
    "争议": "涉及争议事项或争议焦点",
    "纠纷": "涉及法律纠纷或矛盾",
    "违约": "存在违反合同约定的情形",
    "赔偿": "涉及赔偿责任或赔偿请求",
    "诉讼": "涉及诉讼程序或诉讼风险",
    "仲裁": "涉及仲裁程序或仲裁事项",
}


ACTION_COLORS = {
    "提交": "#3b82f6",
    "审核": "#8b5cf6",
    "退回": "#ef4444",
    "修改": "#f59e0b",
    "发布": "#22c55e",
    "归档": "#0d9488",
}


def _render_timeline(logs: pl.DataFrame):
    if logs.is_empty():
        st.info("暂无互动记录")
        return

    st.markdown("### 📜 互动时间线")

    for i, log in enumerate(logs.iter_rows(named=True)):
        action = log["action"]
        color = ACTION_COLORS.get(action, "#6b7280")

        with st.container():
            col_dot, col_content = st.columns([1, 20])

            with col_dot:
                st.markdown(
                    f"<div style='width:16px;height:16px;border-radius:50%;"
                    f"background-color:{color};margin-top:6px;'></div>",
                    unsafe_allow_html=True,
                )
                if i < logs.height - 1:
                    st.markdown(
                        "<div style='width:2px;height:40px;background-color:#e5e7eb;"
                        "margin-left:7px;'></div>",
                        unsafe_allow_html=True,
                    )

            with col_content:
                st.markdown(
                    f"<span style='color:{color};font-weight:bold;'>{action}</span> "
                    f"· <span style='color:#6b7280;font-size:12px;'>"
                    f"{log['action_time']}</span>",
                    unsafe_allow_html=True,
                )
                st.markdown(f"**操作人：** {log['operator']}")
                st.markdown(f"**详情：** {log['detail']}")
                st.markdown("")


def render_interaction():
    st.title("📝 互动记录明细")
    st.caption("查看文书全生命周期互动记录，了解风险词命中解释口径")

    delay_info = risk_analyzer.get_sync_delay_info()
    render_delay_banner(delay_info)

    selected_doc_id = st.session_state.get("selected_doc_id", "")

    col1, col2 = st.columns([2, 1])
    with col1:
        doc_id = st.text_input(
            "输入文书编号查询",
            value=selected_doc_id,
            placeholder="例如：DOC00000001",
            key="interaction_doc_id",
        )
    with col2:
        case_id = st.text_input(
            "或输入案件编号",
            placeholder="例如：CASE000001",
            key="interaction_case_id",
        )

    st.markdown("---")

    case_docs = risk_analyzer.loader.get_table("case_docs")
    interaction_logs = risk_analyzer.loader.get_table("interaction_logs")

    if case_docs is None or interaction_logs is None:
        st.info("数据加载中...")
        return

    target_doc = None
    target_logs = None

    if doc_id:
        target_doc = case_docs.filter(pl.col("doc_id") == doc_id)
        if target_doc.height > 0:
            target_logs = interaction_logs.filter(pl.col("doc_id") == doc_id)
    elif case_id:
        target_docs = case_docs.filter(pl.col("case_id") == case_id)
        if target_docs.height > 0:
            target_doc = target_docs.head(1)
            target_logs = interaction_logs.filter(pl.col("case_id") == case_id)

    if target_doc is not None and target_doc.height > 0:
        doc_info = target_doc.row(0, named=True)

        st.markdown(f"### 📄 文书信息 - {doc_info['doc_id']}")

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.info(f"**案件编号**\n{doc_info['case_id']}")
        with col2:
            st.info(f"**文书类型**\n{doc_info['doc_type']}")
        with col3:
            st.info(f"**所属区域**\n{doc_info['region']}")
        with col4:
            status_color = (
                "#ef4444" if doc_info['status'] == "已退回"
                else "#22c55e" if doc_info['status'] in ["已通过", "已发布"]
                else "#f59e0b"
            )
            st.markdown(
                f"<div style='background-color:#f3f4f6;padding:12px;"
                f"border-radius:8px;'>"
                f"<div style='font-size:12px;color:#6b7280;'>当前状态</div>"
                f"<div style='font-size:16px;font-weight:bold;color:{status_color};'>"
                f"{doc_info['status']}</div></div>",
                unsafe_allow_html=True,
            )

        st.markdown("---")

        col_left, col_right = st.columns([3, 2])

        with col_left:
            if target_logs is not None and target_logs.height > 0:
                target_logs = target_logs.sort("action_time")
                _render_timeline(target_logs)
            else:
                st.info("暂无互动记录")

        with col_right:
            st.markdown("### ⚠️ 风险词命中分析")

            risk_word_count = doc_info.get("risk_word_count", 0)
            risk_words_str = doc_info.get("risk_words", "")
            risk_words_list = [w.strip() for w in risk_words_str.split(",") if w.strip()] if risk_words_str else []

            st.metric("命中风险词数", f"{risk_word_count} 个")

            if risk_words_list:
                st.markdown("#### 命中词解释")
                for word in risk_words_list:
                    explanation = RISK_WORD_EXPLANATIONS.get(word, "暂无解释")
                    with st.expander(f"🔴 {word}", expanded=True):
                        st.write(f"**解释口径：** {explanation}")
            else:
                st.info("未命中风险词")

            st.markdown("#### 📊 风险评估")
            if risk_word_count >= 5:
                st.error("🔴 高风险 - 建议重点关注，优先处理")
            elif risk_word_count >= 3:
                st.warning("🟡 中风险 - 需关注跟进")
            elif risk_word_count >= 1:
                st.info("🟢 低风险 - 正常审核即可")
            else:
                st.success("🟢 无风险")

            st.markdown("#### 🔄 退回次数")
            st.metric("退回次数", f"{doc_info.get('return_count', 0)} 次")

        st.markdown("---")

        if st.button("← 返回审核退回追踪", type="secondary"):
            st.session_state["current_page"] = "📋 审核退回追踪"
            st.rerun()

    else:
        if doc_id or case_id:
            st.warning("未找到匹配的文书记录，请检查编号是否正确")
        else:
            st.info("👆 请输入文书编号或案件编号查询互动记录")

        st.markdown("---")
        st.markdown("### 🔤 风险词解释口径速查")
        st.caption("点击查看各风险词的标准解释口径")

        risk_words_df = pl.DataFrame({
            "风险词": list(RISK_WORD_EXPLANATIONS.keys()),
            "解释口径": list(RISK_WORD_EXPLANATIONS.values()),
        })

        search_word = st.text_input("搜索风险词", placeholder="输入关键词搜索...", key="risk_word_search")
        if search_word:
            risk_words_df = risk_words_df.filter(
                pl.col("风险词").str.contains(search_word) |
                pl.col("解释口径").str.contains(search_word)
            )

        styled_dataframe(risk_words_df, height=400)

        st.markdown("---")
        st.markdown("### 📌 最近高风险文书")
        st.caption("点击文书编号可查看详细互动记录")

        high_risk_samples = risk_analyzer.get_returned_samples(limit=10)
        if not high_risk_samples.is_empty():
            for row in high_risk_samples.iter_rows(named=True):
                if st.button(
                    f"📄 {row['doc_id']} - {row['doc_type']} - "
                    f"{row['region']} - {row['risk_word_count']}个风险词",
                    key=f"goto_{row['doc_id']}",
                    use_container_width=True,
                ):
                    st.session_state["selected_doc_id"] = row["doc_id"]
                    st.rerun()
        else:
            st.info("暂无高风险文书")
