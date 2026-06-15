import streamlit as st
import polars as pl
from datetime import datetime
from config import setup_logger, SEVERITY_COLORS, STATUS_COLORS
from src.data.database import db
from src.utils.filters import build_filter_conditions, generate_filter_description, serialize_filters
from src.export.export_utils import ExportService

logger = setup_logger()

st.set_page_config(
    page_title="教材清单 - 高校教务教材订购漏斗报表",
    page_icon="📚",
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

@st.cache_data(ttl=3600)
def get_publishers():
    return db.query("SELECT DISTINCT publisher FROM textbook_order WHERE publisher IS NOT NULL ORDER BY publisher")

@st.cache_data(ttl=300)
def get_textbook_list(filters):
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

def main():
    st.title("📚 教材清单")
    st.markdown("教材订购总览，支持多条件筛选和联动查询")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    publishers = get_publishers()
    
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
        
        pub_options = ["全部"] + [p["publisher"] for p in publishers.to_dicts()]
        selected_publisher = st.selectbox("选择出版社", pub_options, index=0)
        
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
        
        price_min, price_max = st.slider("价格范围", 0.0, 200.0, (0.0, 200.0))
        
        search_text = st.text_input("🔍 搜索教材名称/ISBN", "")
        
        st.markdown("---")
        
        filters = {
            "term_id": selected_term,
            "dept_id": selected_dept,
            "course_id": selected_course,
            "grade": selected_grade,
            "order_status": selected_status,
            "publisher": selected_publisher,
            "data_source": selected_data_source,
            "price_min": price_min,
            "price_max": price_max,
            "search_text": search_text
        }
        
        filter_desc = generate_filter_description(filters)
        st.info(f"📊 **当前筛选**\n{filter_desc}")
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        with st.spinner("正在加载教材清单..."):
            df = get_textbook_list(filters)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("📋 教材总数", f"{len(df):,}")
        with col2:
            total_amount = (df["price"].fill_null(0) * df["quantity"].fill_null(0)).sum()
            st.metric("💰 总金额", f"¥{total_amount:,.2f}")
        with col3:
            total_qty = df["quantity"].sum()
            st.metric("📦 总数量", f"{total_qty:,}")
        with col4:
            avg_price = df["price"].mean() if len(df) > 0 else 0
            st.metric("📊 平均价格", f"¥{avg_price:.2f}")
        
        st.markdown("---")
        
        export_service = ExportService()
        
        col1, col2, col3 = st.columns([1, 1, 2])
        with col1:
            if st.button("📥 导出Excel", key="export_excel"):
                with st.spinner("正在生成Excel文件..."):
                    excel_path = export_service.export_textbooks(df, filters, "excel")
                    with open(excel_path, "rb") as f:
                        st.download_button(
                            "下载Excel文件",
                            f,
                            f"教材清单_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
        
        with col2:
            if st.button("📄 导出PDF", key="export_pdf"):
                with st.spinner("正在生成PDF文件..."):
                    pdf_path = export_service.export_textbooks(df, filters, "pdf")
                    with open(pdf_path, "rb") as f:
                        st.download_button(
                            "下载PDF文件",
                            f,
                            f"教材清单_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf",
                            "application/pdf"
                        )
        
        with col3:
            st.info("💡 导出文件自动包含筛选条件水印，转发后可追溯取数范围")
        
        st.markdown("---")
        
        if not df.is_empty():
            display_df = df.with_columns([
                pl.col("price").alias("价格"),
                pl.col("quantity").alias("数量"),
                pl.col("student_count").alias("选课人数"),
                (pl.col("price").fill_null(0) * pl.col("quantity").fill_null(0)).alias("小计金额")
            ])
            
            column_config = {
                "order_id": st.column_config.TextColumn("订单ID", width="small"),
                "course_code": st.column_config.TextColumn("课程代码", width="small"),
                "course_name": st.column_config.TextColumn("课程名称", width="medium"),
                "dept_name": st.column_config.TextColumn("院系", width="medium"),
                "term_name": st.column_config.TextColumn("学期", width="medium"),
                "textbook_isbn": st.column_config.TextColumn("ISBN", width="medium"),
                "textbook_name": st.column_config.TextColumn("教材名称", width="large"),
                "publisher": st.column_config.TextColumn("出版社", width="medium"),
                "price": st.column_config.NumberColumn("价格", format="¥%.2f"),
                "quantity": st.column_config.NumberColumn("数量", format="%d"),
                "小计金额": st.column_config.NumberColumn("小计金额", format="¥%.2f"),
                "order_status": st.column_config.SelectboxColumn(
                    "状态",
                    options=["submitted", "approved", "purchased", "stocked", "distributed", "pending", "rejected"],
                    format_func=lambda x: {
                        "submitted": "📝 已提交",
                        "approved": "✅ 已审批",
                        "purchased": "📦 已采购",
                        "stocked": "🏪 已入库",
                        "distributed": "🚚 已发放",
                        "pending": "⏳ 待处理",
                        "rejected": "❌ 已拒绝"
                    }.get(x, x)
                ),
                "data_source": st.column_config.SelectboxColumn(
                    "数据源",
                    options=["teaching_platform", "campus_card", "student_application"],
                    format_func=lambda x: {
                        "teaching_platform": "🖥️ 教学平台",
                        "campus_card": "💳 一卡通",
                        "student_application": "📋 学生申请表"
                    }.get(x, x)
                ),
                "student_count": st.column_config.NumberColumn("选课人数", format="%d"),
                "grade": st.column_config.TextColumn("年级", width="small"),
                "major": st.column_config.TextColumn("专业", width="medium"),
                "created_at": st.column_config.DatetimeColumn("创建时间"),
            }
            
            st.dataframe(
                display_df.select([
                    "order_id", "course_code", "course_name", "dept_name", "term_name",
                    "textbook_isbn", "textbook_name", "publisher", "price", "quantity",
                    "小计金额", "order_status", "data_source", "student_count", "grade", "major", "created_at"
                ]).to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config=column_config
            )
            
            with st.expander("📌 筛选条件元数据"):
                st.json(serialize_filters(filters))
                
        else:
            st.info("暂无符合条件的教材数据")
    
    except Exception as e:
        logger.error(f"加载教材清单页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
