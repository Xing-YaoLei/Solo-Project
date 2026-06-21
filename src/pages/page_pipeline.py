import streamlit as st
import plotly.graph_objects as go
from typing import Dict, Any, List

from src.utils.analyzer import risk_analyzer
from src.utils.ui_components import render_delay_banner, styled_dataframe


STATUS_COLORS = {
    "completed": "#22c55e",
    "running": "#3b82f6",
    "pending": "#9ca3af",
    "error": "#ef4444",
    "partial": "#f59e0b",
}

STATUS_LABELS = {
    "completed": "已完成",
    "running": "进行中",
    "pending": "待执行",
    "error": "出错",
    "partial": "部分完成",
    "unknown": "未知",
}


def _render_pipeline_card(pipeline: Dict[str, Any]):
    status = pipeline.get("overall_status", "unknown")
    status_color = STATUS_COLORS.get(status, "#9ca3af")
    status_label = STATUS_LABELS.get(status, "未知")

    is_delayed = pipeline.get("is_delayed", False)
    delay_hours = pipeline.get("delay_hours", 0)

    with st.container():
        col_title, col_status, col_delay = st.columns([3, 1, 1])
        with col_title:
            st.subheader(f"📦 {pipeline['source_name']}")
            st.caption(pipeline.get("description", ""))
        with col_status:
            st.markdown(
                f"<span style='color:{status_color};font-weight:bold;'>"
                f"● {status_label}</span>",
                unsafe_allow_html=True,
            )
        with col_delay:
            if is_delayed:
                st.markdown(
                    f"<span style='color:#ef4444;font-weight:bold;'>"
                    f"⚠️ 延迟 {delay_hours}h</span>",
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f"<span style='color:#22c55e;'>"
                    f"✓ 同步正常</span>",
                    unsafe_allow_html=True,
                )

        steps = pipeline.get("steps", [])
        if steps:
            fig = go.Figure()

            y_positions = list(range(len(steps)))
            y_positions.reverse()

            for i, step in enumerate(steps):
                y = y_positions[i]
                step_status = step.get("status", "pending")
                step_color = STATUS_COLORS.get(step_status, "#9ca3af")

                fig.add_shape(
                    type="circle",
                    x0=0.05, x1=0.15,
                    y0=y - 0.2, y1=y + 0.2,
                    fillcolor=step_color,
                    line_color=step_color,
                )

                duration = step.get("duration_seconds")
                duration_text = ""
                if duration:
                    if duration >= 60:
                        duration_text = f" ({int(duration // 60)}分{int(duration % 60)}秒)"
                    else:
                        duration_text = f" ({int(duration)}秒)"

                record_text = ""
                if step.get("record_count", 0) > 0:
                    record_text = f" · {step['record_count']}条记录"

                fig.add_annotation(
                    x=0.2,
                    y=y,
                    text=f"<b>{step['step_name']}</b>{duration_text}{record_text}",
                    showarrow=False,
                    xanchor="left",
                    yanchor="middle",
                    font=dict(size=12),
                )

                if i < len(steps) - 1:
                    next_y = y_positions[i + 1]
                    next_status = steps[i + 1].get("status", "pending")
                    line_color = (
                        STATUS_COLORS.get(step_status, "#9ca3af")
                        if next_status != "pending"
                        else "#e5e7eb"
                    )
                    fig.add_shape(
                        type="line",
                        x0=0.1, x1=0.1,
                        y0=y - 0.2, y1=next_y + 0.2,
                        line=dict(color=line_color, width=3),
                    )

            fig.update_layout(
                height=len(steps) * 50 + 20,
                margin=dict(l=0, r=0, t=10, b=10),
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False,
                           range=[0, 1]),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False,
                           range=[-0.5, len(steps) - 0.5]),
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
            )

            st.plotly_chart(fig, use_container_width=True)

        last_sync = pipeline.get("last_sync_time")
        if last_sync:
            st.caption(f"最后同步时间：{last_sync}")
        else:
            st.caption("最后同步时间：暂无")

        st.markdown("---")


def render_pipeline():
    st.title("🔗 取数链路追踪")
    st.caption("追踪三大数据源的取数步骤状态与同步延迟")

    delay_info = risk_analyzer.get_sync_delay_info()
    render_delay_banner(delay_info)

    pipelines = risk_analyzer.get_sync_delay_info()

    st.markdown("### 📊 数据链路总览")

    col1, col2, col3 = st.columns(3)
    total_sources = len(pipelines)
    healthy = sum(1 for p in pipelines if not p.get("is_delayed") and p.get("overall_status") == "completed")
    delayed = sum(1 for p in pipelines if p.get("is_delayed"))
    running = sum(1 for p in pipelines if p.get("overall_status") == "running")

    with col1:
        st.metric("数据源总数", f"{total_sources} 个")
    with col2:
        st.metric("运行正常", f"{healthy} 个", delta_color="normal")
    with col3:
        st.metric("同步延迟", f"{delayed} 个", delta=f"{delayed}", delta_color="inverse")

    st.markdown("---")
    st.markdown("### 🔍 各数据源链路详情")

    source_order = ["case", "calendar", "payment"]
    ordered_pipelines = []
    for sid in source_order:
        for p in pipelines:
            if p["source_id"] == sid:
                ordered_pipelines.append(p)
                break

    for pipeline in ordered_pipelines:
        with st.expander(
            f"📦 {pipeline['source_name']} - "
            f"{STATUS_LABELS.get(pipeline.get('overall_status', 'unknown'), '未知')}"
            f"{' ⚠️延迟' if pipeline.get('is_delayed') else ''}",
            expanded=True,
        ):
            _render_pipeline_card(pipeline)

    st.markdown("---")
    st.markdown("### 📋 延迟影响说明")

    st.info(
        """
        **数据延迟对趋势判断的影响：**

        - 🔴 **收款流水延迟**：当收款流水数据延迟超过24小时时，
          近期的"收款→文书"关联分析可能不完整，建议关注历史数据而非最近1-2天。
        - 🟡 **日历工具延迟**：日历数据延迟会影响发布排期的同环比准确性，
          请注意甄别近期排期数据。
        - 🟢 **案件系统延迟**：案件系统是核心数据来源，如出现延迟，
          所有指标均需谨慎解读。

        > 💡 提示：延迟数据在趋势图上会用橙色虚线标注，
        > 请结合标注位置判断趋势的可靠性。
        """
    )

    st.markdown("### 📈 同步历史记录")

    delay_annotations = risk_analyzer.get_delay_annotations()

    if delay_annotations:
        st.markdown("#### ⚠️ 当前延迟标注")
        for ann in delay_annotations:
            st.warning(
                f"**{ann['source_name']}** 同步截止于 "
                f"{ann['last_sync_time'].strftime('%Y-%m-%d %H:%M')}，"
                f"已延迟约 {int(ann['delay_hours'])} 小时。"
                f"该时间点之后的数据可能不完整，趋势图中已用橙色虚线标注此截止点。"
            )

    history_data = [
        {"日期": "2026-06-20", "案件系统": "02:00 同步", "日历工具": "05:00 同步", "收款流水": "⚠️ 延迟30h（截止06-19 12:00）", "备注": "财务系统升级导致延迟"},
        {"日期": "2026-06-19", "案件系统": "02:00 同步", "日历工具": "05:00 同步", "收款流水": "12:00 同步", "备注": "收款流水升级前最后一次正常同步"},
        {"日期": "2026-06-18", "案件系统": "02:00 同步", "日历工具": "⚠️ 延迟5h（原05:00→10:00）", "收款流水": "12:00 同步", "备注": "日历服务维护"},
        {"日期": "2026-06-17", "案件系统": "02:00 同步", "日历工具": "05:00 同步", "收款流水": "12:00 同步", "备注": ""},
        {"日期": "2026-06-16", "案件系统": "⚠️ 延迟2h（原02:00→04:00）", "日历工具": "05:00 同步", "收款流水": "12:00 同步", "备注": "系统常规备份"},
    ]

    import polars as pl
    history_df = pl.DataFrame(history_data)
    styled_dataframe(history_df, height=250)

    st.info(
        "💡 **同步历史说明：** 表中标注了各数据源每日的实际同步时间。"
        "当某数据源出现延迟时，会在对应单元格中标注⚠️和延迟信息，"
        "包括原始计划同步时间和实际恢复时间。"
        "趋势图上的橙色虚线即为收款流水最后同步时间点，"
        "该点右侧的数据可能因延迟而不完整。"
    )
