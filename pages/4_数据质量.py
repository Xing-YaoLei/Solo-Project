import streamlit as st
import polars as pl
from datetime import datetime
from config import setup_logger, SEVERITY_COLORS, DATA_SOURCES
from src.data.database import db
from src.data.diff_detector import DiffDetector
from src.data.gap_analyzer import GapAnalyzer
from src.utils.filters import build_filter_conditions, generate_filter_description

logger = setup_logger()

st.set_page_config(
    page_title="数据质量 - 高校教务教材订购漏斗报表",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_data(ttl=3600)
def get_terms():
    return db.query("SELECT * FROM academic_term ORDER BY start_date DESC")

@st.cache_data(ttl=3600)
def get_data_sources():
    return db.query("SELECT * FROM data_source WHERE is_active = TRUE ORDER BY source_name")

def main():
    st.title("🔍 数据质量")
    st.markdown("多数据源差异检测和数据缺口分析")
    st.markdown("---")
    
    terms = get_terms()
    sources = get_data_sources()
    
    tab1, tab2 = st.tabs(["📊 数据差异检测", "⚠️ 数据缺口分析"])
    
    with tab1:
        st.subheader("📊 数据差异检测")
        st.markdown("对比不同数据源之间的字段差异")
        
        with st.sidebar:
            st.header("🔍 差异检测筛选")
            
            term_options = terms.select(["term_id", "term_name"]).to_dicts()
            selected_term_diff = st.selectbox(
                "选择学期",
                options=[t["term_id"] for t in term_options],
                format_func=lambda x: next((t["term_name"] for t in term_options if t["term_id"] == x), x),
                index=0,
                key="diff_term"
            )
            
            source_options = [s["source_id"] for s in sources.to_dicts()]
            col_a, col_b = st.columns(2)
            with col_a:
                source_a = st.selectbox(
                    "数据源A",
                    options=source_options,
                    format_func=lambda x: next((s["source_name"] for s in sources.to_dicts() if s["source_id"] == x), x),
                    index=0,
                    key="source_a"
                )
            with col_b:
                source_b = st.selectbox(
                    "数据源B",
                    options=source_options,
                    format_func=lambda x: next((s["source_name"] for s in sources.to_dicts() if s["source_id"] == x), x),
                    index=1,
                    key="source_b"
                )
            
            status_options = ["全部", "pending", "resolved"]
            selected_status_diff = st.selectbox(
                "差异状态",
                options=status_options,
                format_func=lambda x: {
                    "全部": "全部",
                    "pending": "待处理",
                    "resolved": "已解决"
                }.get(x, x),
                index=0,
                key="diff_status"
            )
            
            st.markdown("---")
            st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            diff_detector = DiffDetector()
            
            if st.button("🔄 检测差异", type="primary"):
                with st.spinner("正在检测数据源差异..."):
                    diffs = diff_detector.detect_diff(source_a, source_b, term_id=selected_term_diff)
                    if not diffs.is_empty():
                        diff_detector.save_diff_records(diffs)
                        st.success(f"✅ 检测到 {len(diffs)} 条差异记录并已保存")
                    else:
                        st.info("未检测到差异")
            
            status_filter = None if selected_status_diff == "全部" else selected_status_diff
            diff_records = diff_detector.get_diff_records(
                source_a=source_a,
                source_b=source_b,
                status=status_filter
            )
            
            summary = diff_detector.get_diff_summary(term_id=selected_term_diff)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("🔀 总差异数", summary["total_diffs"])
            with col2:
                st.metric("⏳ 待处理", summary["pending_diffs"])
            with col3:
                st.metric("✅ 已解决", summary["resolved_diffs"])
            
            st.markdown("---")
            
            if not diff_records.is_empty():
                st.subheader("📋 差异详情")
                
                field_summary = pl.DataFrame(summary["by_field"])
                st.bar_chart(
                    field_summary.to_pandas(),
                    x="field_name",
                    y="diff_count",
                    color="#1e3a8a"
                )
                
                st.markdown("---")
                
                display_df = diff_records.with_columns([
                    pl.col("field_name").alias("字段名"),
                    pl.col("value_a").alias(f"{source_a}值"),
                    pl.col("value_b").alias(f"{source_b}值"),
                    pl.col("detected_at").alias("检测时间"),
                    pl.col("status").alias("状态")
                ])
                
                column_config = {
                    "diff_id": st.column_config.TextColumn("差异ID", width="small"),
                    "order_id": st.column_config.TextColumn("订单ID", width="small"),
                    "source_a": st.column_config.TextColumn("数据源A", width="small"),
                    "source_b": st.column_config.TextColumn("数据源B", width="small"),
                    "field_name": st.column_config.TextColumn("字段名", width="medium"),
                    "value_a": st.column_config.TextColumn(f"{source_a}值", width="large"),
                    "value_b": st.column_config.TextColumn(f"{source_b}值", width="large"),
                    "detected_at": st.column_config.DatetimeColumn("检测时间"),
                    "status": st.column_config.SelectboxColumn(
                        "状态",
                        options=["pending", "resolved"],
                        format_func=lambda x: {
                            "pending": "⏳ 待处理",
                            "resolved": "✅ 已解决"
                        }.get(x, x)
                    ),
                }
                
                st.dataframe(
                    display_df.select([
                        "diff_id", "order_id", "source_a", "source_b",
                        "field_name", "value_a", "value_b", "detected_at", "status"
                    ]).to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config=column_config
                )
                
                col1, col2 = st.columns([1, 3])
                with col1:
                    selected_diff_id = st.selectbox(
                        "选择要处理的差异ID",
                        options=diff_records["diff_id"].to_list()
                    )
                with col2:
                    if st.button("✅ 标记为已解决"):
                        if diff_detector.resolve_diff(selected_diff_id):
                            st.success("差异已标记为已解决")
                            st.rerun()
                        else:
                            st.error("操作失败")
            else:
                st.info("暂无差异记录，请点击上方按钮检测差异")
        
        except Exception as e:
            logger.error(f"加载差异检测页面失败: {e}")
            st.error(f"数据加载失败: {str(e)}")
    
    with tab2:
        st.subheader("⚠️ 数据缺口分析")
        st.markdown("识别缺失字段和关联记录的数据缺口")
        
        with st.sidebar:
            st.header("🔍 缺口分析筛选")
            
            term_options = terms.select(["term_id", "term_name"]).to_dicts()
            selected_term_gap = st.selectbox(
                "选择学期",
                options=[t["term_id"] for t in term_options],
                format_func=lambda x: next((t["term_name"] for t in term_options if t["term_id"] == x), x),
                index=0,
                key="gap_term"
            )
            
            severity_options = ["全部", "high", "medium", "low"]
            selected_severity = st.selectbox(
                "严重程度",
                options=severity_options,
                format_func=lambda x: {
                    "全部": "全部",
                    "high": "🔴 严重",
                    "medium": "🟠 中等",
                    "low": "🟢 轻微"
                }.get(x, x),
                index=0,
                key="gap_severity"
            )
            
            status_options_gap = ["全部", "open", "in_progress", "closed"]
            selected_status_gap = st.selectbox(
                "处理状态",
                options=status_options_gap,
                format_func=lambda x: {
                    "全部": "全部",
                    "open": "🔓 未处理",
                    "in_progress": "🔄 处理中",
                    "closed": "🔒 已关闭"
                }.get(x, x),
                index=0,
                key="gap_status"
            )
            
            gap_analyzer = GapAnalyzer()
            gap_type_options = ["全部"] + [gt["code"] for gt in gap_analyzer.GAP_TYPES]
            selected_gap_type = st.selectbox(
                "缺口类型",
                options=gap_type_options,
                format_func=lambda x: "全部" if x == "全部" else gap_analyzer.get_gap_type_name(x),
                index=0,
                key="gap_type"
            )
            
            st.markdown("---")
            st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            gap_analyzer = GapAnalyzer()
            
            if st.button("🔄 识别缺口", type="primary"):
                with st.spinner("正在识别数据缺口..."):
                    gaps = gap_analyzer.identify_gaps(selected_term_gap)
                    st.success(f"✅ 识别到 {len(gaps)} 个数据缺口")
            
            severity_filter = None if selected_severity == "全部" else selected_severity
            status_filter = None if selected_status_gap == "全部" else selected_status_gap
            type_filter = None if selected_gap_type == "全部" else selected_gap_type
            
            gap_records = gap_analyzer.get_gaps(
                term_id=selected_term_gap,
                severity=severity_filter,
                status=status_filter,
                gap_type=type_filter
            )
            
            summary = gap_analyzer.get_gap_summary(selected_term_gap)
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("⚠️ 总缺口数", summary["total_gaps"])
            with col2:
                st.metric("🔴 严重", summary["by_severity"].get("high", 0))
            with col3:
                st.metric("🟠 中等", summary["by_severity"].get("medium", 0))
            with col4:
                st.metric("🟢 轻微", summary["by_severity"].get("low", 0))
            
            st.markdown("---")
            
            if not gap_records.is_empty():
                st.subheader("📋 缺口详情")
                
                severity_cols = st.columns(3)
                with severity_cols[0]:
                    st.markdown(f"""
                    <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 28px; font-weight: bold; color: #ef4444;">{summary['by_severity'].get('high', 0)}</div>
                        <div style="font-size: 14px; color: #64748b;">🔴 严重</div>
                    </div>
                    """, unsafe_allow_html=True)
                with severity_cols[1]:
                    st.markdown(f"""
                    <div style="text-align: center; padding: 15px; background: #fff7ed; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 28px; font-weight: bold; color: #f97316;">{summary['by_severity'].get('medium', 0)}</div>
                        <div style="font-size: 14px; color: #64748b;">🟠 中等</div>
                    </div>
                    """, unsafe_allow_html=True)
                with severity_cols[2]:
                    st.markdown(f"""
                    <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 28px; font-weight: bold; color: #10b981;">{summary['by_severity'].get('low', 0)}</div>
                        <div style="font-size: 14px; color: #64748b;">🟢 轻微</div>
                    </div>
                    """, unsafe_allow_html=True)
                
                display_df = gap_records.with_columns([
                    pl.col("gap_type").apply(gap_analyzer.get_gap_type_name).alias("缺口类型"),
                    pl.col("severity").alias("严重程度"),
                    pl.col("suggested_action").alias("建议措施"),
                    pl.col("deadline").alias("截止日期"),
                    pl.col("status").alias("状态")
                ])
                
                def get_severity_color(severity):
                    return f"background-color: {SEVERITY_COLORS.get(severity, '#e2e8f0')}10; border-left: 4px solid {SEVERITY_COLORS.get(severity, '#64748b')};"
                
                column_config = {
                    "gap_id": st.column_config.TextColumn("缺口ID", width="small"),
                    "order_id": st.column_config.TextColumn("订单ID", width="small"),
                    "textbook_name": st.column_config.TextColumn("教材名称", width="medium"),
                    "course_name": st.column_config.TextColumn("课程名称", width="medium"),
                    "dept_name": st.column_config.TextColumn("院系", width="medium"),
                    "缺口类型": st.column_config.TextColumn("缺口类型", width="medium"),
                    "missing_field": st.column_config.TextColumn("缺失字段", width="small"),
                    "严重程度": st.column_config.SelectboxColumn(
                        "严重程度",
                        options=["high", "medium", "low"],
                        format_func=lambda x: {
                            "high": "🔴 严重",
                            "medium": "🟠 中等",
                            "low": "🟢 轻微"
                        }.get(x, x)
                    ),
                    "建议措施": st.column_config.TextColumn("建议措施", width="large"),
                    "deadline": st.column_config.DateColumn("截止日期"),
                    "status": st.column_config.SelectboxColumn(
                        "状态",
                        options=["open", "in_progress", "closed"],
                        format_func=lambda x: {
                            "open": "🔓 未处理",
                            "in_progress": "🔄 处理中",
                            "closed": "🔒 已关闭"
                        }.get(x, x)
                    ),
                }
                
                st.dataframe(
                    display_df.select([
                        "gap_id", "order_id", "textbook_name", "course_name", "dept_name",
                        "缺口类型", "missing_field", "严重程度", "建议措施", "deadline", "status"
                    ]).to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config=column_config
                )
                
                col1, col2, col3 = st.columns([1, 2, 1])
                with col1:
                    selected_gap_id = st.selectbox(
                        "选择要处理的缺口ID",
                        options=gap_records["gap_id"].to_list(),
                        key="gap_select"
                    )
                with col2:
                    new_status = st.selectbox(
                        "更新状态",
                        options=["open", "in_progress", "closed"],
                        format_func=lambda x: {
                            "open": "🔓 未处理",
                            "in_progress": "🔄 处理中",
                            "closed": "🔒 已关闭"
                        }.get(x, x),
                        key="gap_status_update"
                    )
                with col3:
                    responsible = st.text_input("责任人", "", key="gap_responsible")
                
                if st.button("✅ 更新缺口状态"):
                    if gap_analyzer.mark_gap(selected_gap_id, new_status, responsible if responsible else None):
                        st.success("缺口状态已更新")
                        st.rerun()
                    else:
                        st.error("操作失败")
            else:
                st.info("暂无缺口记录，请点击上方按钮识别数据缺口")
        
        except Exception as e:
            logger.error(f"加载缺口分析页面失败: {e}")
            st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
