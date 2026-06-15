import streamlit as st
import polars as pl
from datetime import datetime
from config import settings, setup_logger, FUNNEL_STAGES, SEVERITY_COLORS, STATUS_COLORS
from src.data.database import db
from src.analysis.funnel_engine import FunnelEngine
from src.data.diff_detector import DiffDetector
from src.data.gap_analyzer import GapAnalyzer
from src.analysis.anomaly_detector import AnomalyDetector
from src.analysis.evaluation_analysis import EvaluationAnalysis

logger = setup_logger()

st.set_page_config(
    page_title=settings.APP_TITLE,
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main {
        background-color: #f8fafc;
    }
    .stApp {
        background-color: #f8fafc;
    }
    .css-1d391kg {
        background-color: #1e3a8a;
    }
    .metric-card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-left: 4px solid #1e3a8a;
    }
    .high-severity {
        background-color: #fef2f2;
        border-left: 4px solid #ef4444;
    }
    .medium-severity {
        background-color: #fff7ed;
        border-left: 4px solid #f97316;
    }
    .low-severity {
        background-color: #f0fdf4;
        border-left: 4px solid #10b981;
    }
    h1, h2, h3 {
        color: #1e3a8a;
    }
    .stButton>button {
        background-color: #1e3a8a;
        color: white;
        border-radius: 8px;
        padding: 10px 24px;
        border: none;
    }
    .stButton>button:hover {
        background-color: #3730a3;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data(ttl=3600)
def get_terms():
    return db.query("SELECT * FROM academic_term ORDER BY start_date DESC")

@st.cache_data(ttl=3600)
def get_departments():
    return db.query("SELECT * FROM department ORDER BY dept_name")

@st.cache_data(ttl=3600)
def get_summary_stats(term_id):
    funnel_engine = FunnelEngine()
    diff_detector = DiffDetector()
    gap_analyzer = GapAnalyzer()
    anomaly_detector = AnomalyDetector()
    eval_analysis = EvaluationAnalysis()
    
    funnel_data = funnel_engine.calculate_funnel(term_id)
    diff_summary = diff_detector.get_diff_summary(term_id=term_id)
    gap_summary = gap_analyzer.get_gap_summary(term_id)
    anomaly_summary = anomaly_detector.get_anomaly_summary(term_id)
    eval_coverage = eval_analysis.get_evaluation_coverage(term_id)
    
    total_orders = db.query(f"SELECT COUNT(*) as cnt FROM textbook_order WHERE term_id = '{term_id}'")["cnt"][0]
    total_students = db.query(f"SELECT COUNT(DISTINCT student_id) as cnt FROM campus_card_record WHERE order_id IN (SELECT order_id FROM textbook_order WHERE term_id = '{term_id}')")["cnt"][0]
    
    if "conversion_rate" not in funnel_data.columns and "stage_conversion" in funnel_data.columns:
        funnel_data = funnel_data.with_columns(pl.col("stage_conversion").alias("conversion_rate"))
    
    return {
        "funnel_data": funnel_data,
        "diff_summary": diff_summary,
        "gap_summary": gap_summary,
        "anomaly_summary": anomaly_summary,
        "eval_coverage": eval_coverage,
        "total_orders": total_orders,
        "total_students": total_students
    }

def main():
    st.title("📚 高校教务教材订购漏斗报表")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    
    with st.sidebar:
        st.header("🔍 筛选条件")
        
        term_options = terms.select(["term_id", "term_name"]).to_dicts()
        selected_term = st.selectbox(
            "选择学期",
            options=[t["term_id"] for t in term_options],
            format_func=lambda x: next((t["term_name"] for t in term_options if t["term_id"] == x), x),
            index=0
        )
        
        dept_options = ["全部"] + [d["dept_id"] for d in departments.to_dicts()]
        selected_dept = st.selectbox(
            "选择院系",
            options=dept_options,
            format_func=lambda x: "全部" if x == "全部" else next((d["dept_name"] for d in departments.to_dicts() if d["dept_id"] == x), x),
            index=0
        )
        
        st.markdown("---")
        st.info(f"""
        📊 **当前筛选条件**
        - 学期: {next((t["term_name"] for t in term_options if t["term_id"] == selected_term), selected_term)}
        - 院系: {selected_dept if selected_dept != "全部" else "全部院系"}
        """)
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        stats = get_summary_stats(selected_term)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">📋 教材订购总数</div>
                <div style="font-size: 32px; font-weight: bold; color: #1e3a8a;">{stats['total_orders']:,}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">👥 覆盖学生数</div>
                <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">{stats['total_students']:,}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            conversion_rate = 0
            if len(stats["funnel_data"]) >= 2:
                first = stats["funnel_data"]["count"][0]
                last = stats["funnel_data"]["count"][-1]
                conversion_rate = (last / first * 100) if first > 0 else 0
            
            st.markdown(f"""
            <div class="metric-card">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">📈 整体转化率</div>
                <div style="font-size: 32px; font-weight: bold; color: #10b981;">{conversion_rate:.1f}%</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            severity_class = "high-severity" if stats["gap_summary"]["total_gaps"] > 50 else "medium-severity" if stats["gap_summary"]["total_gaps"] > 20 else "low-severity"
            st.markdown(f"""
            <div class="metric-card {severity_class}">
                <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">⚠️ 待处理缺口</div>
                <div style="font-size: 32px; font-weight: bold; color: #ef4444;">{stats['gap_summary']['total_gaps']}</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("🔄 七阶转化漏斗")
            if not stats["funnel_data"].is_empty():
                funnel_df = stats["funnel_data"].select(["stage_name", "count", "conversion_rate"])
                st.dataframe(
                    funnel_df.to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "stage_name": st.column_config.TextColumn("阶段", width="medium"),
                        "count": st.column_config.NumberColumn("数量", format="%d"),
                        "conversion_rate": st.column_config.ProgressColumn(
                            "转化率",
                            format="%.1f%%",
                            min_value=0,
                            max_value=100
                        )
                    }
                )
            else:
                st.info("暂无漏斗数据")
        
        with col2:
            st.subheader("📊 数据质量概览")
            
            quality_cols = st.columns(3)
            with quality_cols[0]:
                st.metric("🔀 数据差异", stats["diff_summary"]["total_diffs"], 
                         help="不同数据源之间的字段差异数量")
            with quality_cols[1]:
                st.metric("❌ 数据缺口", stats["gap_summary"]["total_gaps"],
                         help="缺失字段或关联记录的数量")
            with quality_cols[2]:
                st.metric("⚠️ 异常检测", stats["anomaly_summary"]["total_anomalies"],
                         help="统计方法检测出的异常值数量")
            
            st.markdown("---")
            
            severity_cols = st.columns(3)
            with severity_cols[0]:
                st.markdown(f"""
                <div style="text-align: center; padding: 10px; background: #fef2f2; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #ef4444;">{stats['gap_summary']['by_severity'].get('high', 0)}</div>
                    <div style="font-size: 12px; color: #64748b;">🔴 严重</div>
                </div>
                """, unsafe_allow_html=True)
            with severity_cols[1]:
                st.markdown(f"""
                <div style="text-align: center; padding: 10px; background: #fff7ed; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #f97316;">{stats['gap_summary']['by_severity'].get('medium', 0)}</div>
                    <div style="font-size: 12px; color: #64748b;">🟠 中等</div>
                </div>
                """, unsafe_allow_html=True)
            with severity_cols[2]:
                st.markdown(f"""
                <div style="text-align: center; padding: 10px; background: #f0fdf4; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">{stats['gap_summary']['by_severity'].get('low', 0)}</div>
                    <div style="font-size: 12px; color: #64748b;">🟢 轻微</div>
                </div>
                """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📝 评教覆盖分析")
            if stats["eval_coverage"]:
                eval_cols = st.columns(2)
                with eval_cols[0]:
                    st.metric("评教覆盖率", f"{stats['eval_coverage'].get('coverage_rate', 0):.1f}%")
                with eval_cols[1]:
                    st.metric("平均评分", f"{stats['eval_coverage'].get('avg_score', 0):.2f}")
                
                try:
                    terms = get_terms()
                    if len(terms) >= 2:
                        current_term = selected_term
                        previous_term = terms["term_id"][1] if terms["term_id"][0] == current_term else terms["term_id"][0]
                        eval_analysis = EvaluationAnalysis()
                        improvement_data = eval_analysis.analyze_coverage_improvement(current_term, previous_term)
                        trend = improvement_data.get('trend', 0)
                        st.info(f"📈 较上学期{'提升' if trend > 0 else '下降'} {abs(trend):.1f} 个百分点")
                except Exception as e:
                    logger.warning(f"获取评教改善数据失败: {e}")
            else:
                st.info("暂无评教数据")
        
        with col2:
            st.subheader("🏫 异常类型分布")
            if stats["anomaly_summary"]["by_type"]:
                anomaly_df = pl.DataFrame([
                    {"类型": k, "数量": v} 
                    for k, v in stats["anomaly_summary"]["by_type"].items()
                ])
                st.dataframe(
                    anomaly_df.to_pandas(),
                    use_container_width=True,
                    hide_index=True
                )
            else:
                st.info("暂无异常数据")
        
        st.markdown("---")
        
        st.subheader("💡 核心洞察")
        insights = []
        
        if stats["gap_summary"]["total_gaps"] > 0:
            insights.append(f"⚠️ 发现 **{stats['gap_summary']['total_gaps']}** 个数据缺口需要处理，其中 **{stats['gap_summary']['by_severity'].get('high', 0)}** 个为严重级别")
        
        if stats["diff_summary"]["total_diffs"] > 0:
            insights.append(f"🔀 检测到 **{stats['diff_summary']['total_diffs']}** 条数据源差异，主要集中在 {', '.join([d['field_name'] for d in stats['diff_summary']['by_field'][:3]])} 字段")
        
        if stats["eval_coverage"].get("coverage_rate", 0) < 80:
            insights.append(f"📝 评教覆盖率为 **{stats['eval_coverage'].get('coverage_rate', 0):.1f}%**，建议督促学生完成评教")
        
        if not insights:
            insights.append("✅ 数据质量良好，未发现明显问题")
        
        for insight in insights:
            st.markdown(f"- {insight}")
        
        st.markdown("---")
        
        st.caption("""
        📌 使用说明：
        - 左侧边栏可选择学期和院系进行筛选
        - 点击上方页面导航查看详细分析
        - 所有导出文件均包含筛选条件水印，转发后可追溯取数范围
        """)
        
    except Exception as e:
        logger.error(f"加载主页数据失败: {e}")
        st.error(f"数据加载失败，请检查数据库连接。错误信息: {str(e)}")
        st.info("请先运行 `python init_analysis.py` 初始化示例数据")

if __name__ == "__main__":
    main()
