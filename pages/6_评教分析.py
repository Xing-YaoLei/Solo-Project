import streamlit as st
import polars as pl
import plotly.graph_objects as go
from datetime import datetime
from config import setup_logger
from src.data.database import db
from src.analysis.evaluation_analysis import EvaluationAnalysis
from src.utils.filters import build_filter_conditions, generate_filter_description

logger = setup_logger()

st.set_page_config(
    page_title="评教分析 - 高校教务教材订购漏斗报表",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_data(ttl=3600)
def get_terms():
    return db.query("SELECT * FROM academic_term ORDER BY start_date DESC")

@st.cache_data(ttl=3600)
def get_departments():
    return db.query("SELECT * FROM department ORDER BY dept_name")

@st.cache_data(ttl=3600)
def get_courses(dept_id=None):
    sql = "SELECT * FROM course WHERE 1=1"
    params = {}
    if dept_id and dept_id != "全部":
        sql += " AND dept_id = ?"
        params["1"] = dept_id
    sql += " ORDER BY course_name"
    return db.query(sql, params if params else None)

def create_coverage_chart(coverage_data):
    if coverage_data.is_empty():
        return None
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=coverage_data["term_name"].to_list(),
        y=coverage_data["coverage_rate"].to_list(),
        name="评教覆盖率",
        marker_color="#1e3a8a",
        text=[f"{v:.1f}%" for v in coverage_data["coverage_rate"].to_list()],
        textposition="auto",
    ))
    
    fig.add_trace(go.Scatter(
        x=coverage_data["term_name"].to_list(),
        y=coverage_data["avg_score"].to_list(),
        name="平均评分",
        yaxis="y2",
        mode="lines+markers",
        line=dict(color="#f97316", width=3),
        marker=dict(size=10),
    ))
    
    fig.update_layout(
        title="多学期评教覆盖率与平均评分趋势",
        xaxis_title="学期",
        yaxis=dict(
            title="覆盖率(%)",
            range=[0, 100],
            side="left"
        ),
        yaxis2=dict(
            title="平均评分",
            range=[0, 100],
            side="right",
            overlaying="y"
        ),
        height=500,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)"
    )
    
    return fig

def create_dept_chart(dept_data):
    if dept_data.is_empty():
        return None
    
    fig = go.Figure(go.Bar(
        y=dept_data["dept_name"].to_list(),
        x=dept_data["coverage_rate"].to_list(),
        orientation="h",
        marker_color=[
            "#10b981" if v >= 90 else "#f97316" if v >= 80 else "#ef4444" 
            for v in dept_data["coverage_rate"].to_list()
        ],
        text=[f"{v:.1f}%" for v in dept_data["coverage_rate"].to_list()],
        textposition="auto",
    ))
    
    fig.update_layout(
        title="各院系评教覆盖率",
        xaxis_title="覆盖率(%)",
        yaxis_title="院系",
        height=400,
        xaxis=dict(range=[0, 100]),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)"
    )
    
    return fig

def main():
    st.title("📝 评教分析")
    st.markdown("评教覆盖率追踪与改善分析，关联教材订购效果")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    eval_analysis = EvaluationAnalysis()
    
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
        
        courses = get_courses(selected_dept)
        course_options = ["全部"] + [c["course_id"] for c in courses.to_dicts()]
        selected_course = st.selectbox(
            "选择课程",
            options=course_options,
            format_func=lambda x: "全部" if x == "全部" else next((c["course_name"] for c in courses.to_dicts() if c["course_id"] == x), x),
            index=0
        )
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        filters = {}
        if selected_dept != "全部":
            filters["dept_id"] = selected_dept
        if selected_course != "全部":
            filters["course_id"] = selected_course
        
        with st.spinner("正在加载评教数据..."):
            coverage = eval_analysis.get_evaluation_coverage(selected_term, filters)
            improvement = eval_analysis.analyze_coverage_improvement(selected_term)
            correlation = eval_analysis.get_correlation_analysis(selected_term)
            dept_coverage = eval_analysis.get_coverage_by_department(selected_term)
            term_trend = eval_analysis.get_term_trend()
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric(
                "📊 评教覆盖率",
                f"{coverage.get('coverage_rate', 0):.1f}%",
                delta=f"{improvement.get('trend', 0):+.1f}%"
            )
        with col2:
            st.metric(
                "⭐ 平均评分",
                f"{coverage.get('avg_score', 0):.2f}",
                delta=f"{improvement.get('score_trend', 0):+.2f}"
            )
        with col3:
            st.metric(
                "📋 参评人数",
                f"{coverage.get('submitted_count', 0):,}",
                delta=f"{improvement.get('count_trend', 0):+}"
            )
        with col4:
            st.metric(
                "👥 应评人数",
                f"{coverage.get('total_count', 0):,}"
            )
        
        st.markdown("---")
        
        st.subheader("📈 覆盖率改善分析")
        
        if improvement.get("trend", 0) > 0:
            st.success(f"""
            ✅ **评教覆盖率较上学期提升 {improvement.get('trend', 0):.1f} 个百分点**
            
            - 上学期覆盖率: {improvement.get('prev_coverage', 0):.1f}%
            - 本学期覆盖率: {improvement.get('current_coverage', 0):.1f}%
            - 提升人数: {improvement.get('count_trend', 0):+} 人
            """)
        elif improvement.get("trend", 0) < 0:
            st.warning(f"""
            ⚠️ **评教覆盖率较上学期下降 {abs(improvement.get('trend', 0)):.1f} 个百分点**
            
            - 上学期覆盖率: {improvement.get('prev_coverage', 0):.1f}%
            - 本学期覆盖率: {improvement.get('current_coverage', 0):.1f}%
            - 减少人数: {improvement.get('count_trend', 0):+} 人
            """)
        else:
            st.info("ℹ️ 评教覆盖率与上学期持平")
        
        st.markdown("---")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.subheader("📊 多学期趋势对比")
            trend_chart = create_coverage_chart(term_trend)
            if trend_chart:
                st.plotly_chart(trend_chart, use_container_width=True)
            else:
                st.info("暂无趋势数据")
        
        with col2:
            st.subheader("🏢 各院系覆盖率")
            dept_chart = create_dept_chart(dept_coverage)
            if dept_chart:
                st.plotly_chart(dept_chart, use_container_width=True)
            else:
                st.info("暂院系数据")
        
        st.markdown("---")
        
        st.subheader("🔗 教材订购与评教关联分析")
        
        if correlation:
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.info(f"""
                **关联分析结果**
                
                - 高评分课程教材订购率: **{correlation.get('high_score_order_rate', 0):.1f}%**
                - 低评分课程教材订购率: **{correlation.get('low_score_order_rate', 0):.1f}%**
                - 差异: **{correlation.get('correlation', 0):.1f} 个百分点**
                """)
                
                if correlation.get('correlation', 0) > 10:
                    st.success("""
                    💡 **洞察**: 评教评分与教材订购率存在显著正相关，
                    高评分课程的教材订购率明显更高。
                    建议关注低评分课程的教学质量改进。
                    """)
            
            with col2:
                if not correlation.get('by_course', pl.DataFrame()).is_empty():
                    st.dataframe(
                        correlation['by_course'].to_pandas(),
                        use_container_width=True,
                        hide_index=True,
                        column_config={
                            "course_name": st.column_config.TextColumn("课程名称", width="medium"),
                            "avg_score": st.column_config.NumberColumn("平均评分", format="%.2f"),
                            "order_rate": st.column_config.ProgressColumn(
                                "教材订购率",
                                format="%.1f%%",
                                min_value=0,
                                max_value=100
                            ),
                            "student_count": st.column_config.NumberColumn("学生数", format="%d"),
                        }
                    )
        
        st.markdown("---")
        
        st.subheader("📋 评教详情")
        
        eval_sql = f"""
        SELECT 
            e.eval_id,
            e.student_id,
            s.student_name,
            e.course_id,
            c.course_name,
            d.dept_name,
            e.score,
            e.comment,
            e.eval_time,
            e.is_submitted
        FROM teaching_evaluation e
        JOIN student s ON e.student_id = s.student_id
        JOIN course c ON e.course_id = c.course_id
        JOIN department d ON c.dept_id = d.dept_id
        WHERE c.dept_id = (SELECT dept_id FROM course WHERE course_id = e.course_id)
        """
        
        params = {}
        param_idx = 1
        
        if selected_term:
            eval_sql += " AND e.eval_time >= (SELECT start_date FROM academic_term WHERE term_id = ?)"
            params[str(param_idx)] = selected_term
            param_idx += 1
            eval_sql += " AND e.eval_time <= (SELECT end_date FROM academic_term WHERE term_id = ?)"
            params[str(param_idx)] = selected_term
            param_idx += 1
        
        if selected_dept != "全部":
            eval_sql += " AND c.dept_id = ?"
            params[str(param_idx)] = selected_dept
            param_idx += 1
        
        if selected_course != "全部":
            eval_sql += " AND e.course_id = ?"
            params[str(param_idx)] = selected_course
            param_idx += 1
        
        eval_sql += " ORDER BY e.eval_time DESC LIMIT 500"
        
        eval_data = db.query(eval_sql, params if params else None)
        
        if not eval_data.is_empty():
            column_config = {
                "eval_id": st.column_config.TextColumn("评教ID", width="small"),
                "student_id": st.column_config.TextColumn("学号", width="small"),
                "student_name": st.column_config.TextColumn("姓名", width="small"),
                "course_name": st.column_config.TextColumn("课程", width="medium"),
                "dept_name": st.column_config.TextColumn("院系", width="medium"),
                "score": st.column_config.NumberColumn("评分", format="%.2f"),
                "comment": st.column_config.TextColumn("评价", width="large"),
                "eval_time": st.column_config.DatetimeColumn("时间"),
                "is_submitted": st.column_config.CheckboxColumn("已提交"),
            }
            
            st.dataframe(
                eval_data.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config=column_config
            )
            
            st.download_button(
                "📥 导出评教数据",
                eval_data.to_pandas().to_csv(index=False).encode("utf-8-sig"),
                f"评教数据_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv",
                "text/csv"
            )
        else:
            st.info("暂无评教数据")
    
    except Exception as e:
        logger.error(f"加载评教分析页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
