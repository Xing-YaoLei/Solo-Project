import streamlit as st
import polars as pl
from datetime import datetime
from config import setup_logger
from src.data.database import db
from src.export.export_utils import ExportService
from src.utils.filters import build_filter_conditions, generate_filter_description, serialize_filters

logger = setup_logger()

st.set_page_config(
    page_title="数据导出 - 高校教务教材订购漏斗报表",
    page_icon="📥",
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

def get_textbook_data(filters):
    where_sql, params = build_filter_conditions(filters)
    
    sql = f"""
    SELECT 
        o.order_id,
        o.course_id,
        c.course_name,
        c.course_code,
        d.dept_name,
        o.term_id,
        t.term_name,
        o.textbook_isbn,
        o.textbook_name,
        o.publisher,
        o.price,
        o.quantity,
        o.order_status,
        o.data_source,
        o.created_at,
        o.updated_at,
        c.student_count,
        c.grade,
        c.major
    FROM textbook_order o
    JOIN course c ON o.course_id = c.course_id
    JOIN department d ON c.dept_id = d.dept_id
    JOIN academic_term t ON o.term_id = t.term_id
    {where_sql}
    ORDER BY o.created_at DESC
    """
    
    return db.query(sql, params if params else None)

def get_funnel_data(term_id):
    from src.analysis.funnel_engine import FunnelEngine
    engine = FunnelEngine()
    return engine.calculate_funnel(term_id)

def get_gap_data(filters):
    from src.data.gap_analyzer import GapAnalyzer
    analyzer = GapAnalyzer()
    
    term_id = filters.get("term_id")
    severity = filters.get("severity")
    status = filters.get("gap_status")
    
    return analyzer.get_gaps(
        term_id=term_id if term_id != "全部" else None,
        severity=severity if severity != "全部" else None,
        status=status if status != "全部" else None
    )

def main():
    st.title("📥 数据导出")
    st.markdown("导出报表数据，文件自动携带筛选条件水印，转发后可追溯取数范围")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    export_service = ExportService()
    
    export_type = st.radio(
        "选择导出类型",
        options=["textbook", "funnel", "gap"],
        format_func=lambda x: {
            "textbook": "📚 教材清单导出",
            "funnel": "📊 漏斗报表导出",
            "gap": "⚠️ 缺口报告导出"
        }.get(x, x),
        horizontal=True
    )
    
    st.markdown("---")
    
    with st.sidebar:
        st.header("🔍 筛选条件")
        
        term_options = terms.select(["term_id", "term_name"]).to_dicts()
        selected_term = st.selectbox(
            "选择学期",
            options=["全部"] + [t["term_id"] for t in term_options],
            format_func=lambda x: "全部" if x == "全部" else next((t["term_name"] for t in term_options if t["term_id"] == x), x),
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
        
        if export_type == "textbook":
            grade_options = ["全部", "2021", "2022", "2023", "2024"]
            selected_grade = st.selectbox("选择年级", grade_options, index=0)
            
            status_options = ["全部", "submitted", "approved", "purchased", "stocked", "distributed", "pending", "rejected"]
            selected_status = st.selectbox(
                "订单状态",
                options=status_options,
                format_func=lambda x: {
                    "全部": "全部",
                    "submitted": "已提交",
                    "approved": "已审批",
                    "purchased": "已采购",
                    "stocked": "已入库",
                    "distributed": "已发放",
                    "pending": "待处理",
                    "rejected": "已拒绝"
                }.get(x, x),
                index=0
            )
            
            data_source_options = ["全部", "teaching_platform", "campus_card", "student_application"]
            selected_data_source = st.selectbox(
                "数据源",
                options=data_source_options,
                format_func=lambda x: {
                    "全部": "全部",
                    "teaching_platform": "教学平台",
                    "campus_card": "一卡通",
                    "student_application": "学生申请表"
                }.get(x, x),
                index=0
            )
            
            filters = {
                "term_id": selected_term,
                "dept_id": selected_dept,
                "course_id": selected_course,
                "grade": selected_grade,
                "order_status": selected_status,
                "data_source": selected_data_source
            }
        
        elif export_type == "gap":
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
                index=0
            )
            
            status_options = ["全部", "open", "in_progress", "closed"]
            selected_gap_status = st.selectbox(
                "处理状态",
                options=status_options,
                format_func=lambda x: {
                    "全部": "全部",
                    "open": "🔓 未处理",
                    "in_progress": "🔄 处理中",
                    "closed": "🔒 已关闭"
                }.get(x, x),
                index=0
            )
            
            filters = {
                "term_id": selected_term,
                "severity": selected_severity,
                "gap_status": selected_gap_status
            }
        
        else:
            filters = {
                "term_id": selected_term,
                "dept_id": selected_dept,
                "course_id": selected_course
            }
        
        filter_desc = generate_filter_description(filters)
        st.info(f"📊 **当前筛选**\n{filter_desc}")
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        st.subheader("📋 数据预览")
        
        with st.spinner("正在加载数据..."):
            if export_type == "textbook":
                df = get_textbook_data(filters)
            elif export_type == "funnel":
                term_for_funnel = selected_term if selected_term != "全部" else "2024-2025-2"
                df = get_funnel_data(term_for_funnel)
            else:
                df = get_gap_data(filters)
        
        if not df.is_empty():
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("📊 数据条数", f"{len(df):,}")
            with col2:
                if export_type == "textbook" and "price" in df.columns:
                    total_amount = (df["price"].fill_null(0) * df["quantity"].fill_null(0)).sum()
                    st.metric("💰 总金额", f"¥{total_amount:,.2f}")
            with col3:
                file_size = f"{(df.estimated_size('mb')):.2f} MB"
                st.metric("📦 预计文件大小", file_size)
            
            st.markdown("---")
            
            st.dataframe(
                df.to_pandas().head(50),
                use_container_width=True,
                hide_index=True
            )
            
            st.caption(f"显示前50条数据，共{len(df):,}条")
            
            st.markdown("---")
            
            st.subheader("📤 导出选项")
            
            col1, col2 = st.columns([1, 1])
            
            with col1:
                export_format = st.radio(
                    "导出格式",
                    options=["excel", "pdf"],
                    format_func=lambda x: {
                        "excel": "📊 Excel (.xlsx)",
                        "pdf": "📄 PDF (.pdf)"
                    }.get(x, x),
                    horizontal=True
                )
            
            with col2:
                include_watermark = st.checkbox("包含筛选条件水印", value=True)
                include_metadata = st.checkbox("包含取数范围说明", value=True)
            
            st.markdown("---")
            
            if st.button("📥 生成导出文件", type="primary", use_container_width=True):
                with st.spinner(f"正在生成{export_format.upper()}文件..."):
                    try:
                        if export_type == "textbook":
                            file_path = export_service.export_textbooks(df, filters, export_format)
                        elif export_type == "funnel":
                            file_path = export_service.export_funnel_report(df, filters, export_format)
                        else:
                            file_path = export_service.export_gap_report(df, filters, export_format)
                        
                        st.success(f"✅ 文件生成成功！")
                        
                        with open(file_path, "rb") as f:
                            file_bytes = f.read()
                        
                        file_name = {
                            "textbook": "教材清单",
                            "funnel": "漏斗报表",
                            "gap": "缺口报告"
                        }.get(export_type, "导出数据")
                        
                        file_ext = "xlsx" if export_format == "excel" else "pdf"
                        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if export_format == "excel" else "application/pdf"
                        
                        st.download_button(
                            f"📥 下载 {file_name}.{file_ext}",
                            file_bytes,
                            f"{file_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{file_ext}",
                            mime_type,
                            use_container_width=True
                        )
                        
                        st.info("""
                        💡 **导出文件特性**：
                        - 自动包含筛选条件水印，转发后可追溯取数范围
                        - 包含导出时间和取数标识
                        - 支持Excel和PDF两种格式
                        """)
                        
                        with st.expander("📌 查看筛选条件元数据"):
                            st.json(serialize_filters(filters))
                            
                    except Exception as e:
                        logger.error(f"导出文件失败: {e}")
                        st.error(f"文件生成失败: {str(e)}")
        else:
            st.info("暂无符合条件的数据，请调整筛选条件")
    
    except Exception as e:
        logger.error(f"加载导出页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
