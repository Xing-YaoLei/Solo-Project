import streamlit as st
import polars as pl
from datetime import datetime, timedelta
from config import setup_logger, STATUS_COLORS
from src.data.database import db
from src.utils.filters import build_filter_conditions, generate_filter_description

logger = setup_logger()

st.set_page_config(
    page_title="审批记录 - 高校教务教材订购漏斗报表",
    page_icon="✅",
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

@st.cache_data(ttl=300)
def get_approval_records(filters):
    where_sql, params = build_filter_conditions(filters)
    
    sql = f"""
    SELECT 
        a.approval_id,
        a.order_id,
        o.textbook_name,
        c.course_name,
        c.course_code,
        d.dept_name,
        t.term_name,
        a.approval_step,
        a.approver,
        a.approval_time,
        a.approval_result,
        a.opinion,
        o.order_status,
        o.created_at as order_created_at
    FROM approval_record a
    JOIN textbook_order o ON a.order_id = o.order_id
    JOIN course c ON o.course_id = c.course_id
    JOIN department d ON c.dept_id = d.dept_id
    JOIN academic_term t ON o.term_id = t.term_id
    {where_sql}
    ORDER BY a.approval_time DESC NULLS LAST, a.approval_step
    """
    
    return db.query(sql, params if params else None)

@st.cache_data(ttl=300)
def get_approval_summary(filters):
    where_sql, params = build_filter_conditions(filters)
    
    sql = f"""
    SELECT 
        a.approval_step,
        a.approval_result,
        COUNT(*) as count,
        AVG(CASE WHEN a.approval_time IS NOT NULL AND o.created_at IS NOT NULL 
            THEN DATEDIFF('day', o.created_at, a.approval_time) ELSE NULL END) as avg_days
    FROM approval_record a
    JOIN textbook_order o ON a.order_id = o.order_id
    {where_sql}
    GROUP BY a.approval_step, a.approval_result
    ORDER BY a.approval_step, a.approval_result
    """
    
    return db.query(sql, params if params else None)

def main():
    st.title("✅ 审批记录")
    st.markdown("审批流程跟踪，与课程目录联动筛选")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    
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
        
        step_options = ["全部", 1, 2, 3, 4, 5]
        selected_step = st.selectbox("审批步骤", step_options, format_func=lambda x: "全部" if x == "全部" else f"第{x}步", index=0)
        
        result_options = ["全部", "approved", "rejected", "pending"]
        selected_result = st.selectbox(
            "审批结果",
            options=result_options,
            format_func=lambda x: {
                "全部": "全部",
                "approved": "通过",
                "rejected": "拒绝",
                "pending": "待审批"
            }.get(x, x),
            index=0
        )
        
        approvers = db.query("SELECT DISTINCT approver FROM approval_record ORDER BY approver").to_dicts()
        approver_options = ["全部"] + [a["approver"] for a in approvers]
        selected_approver = st.selectbox("审批人", approver_options, index=0)
        
        date_range = st.date_input(
            "审批日期范围",
            value=(datetime.now() - timedelta(days=90), datetime.now()),
            max_value=datetime.now()
        )
        
        st.markdown("---")
        
        filters = {
            "term_id": selected_term,
            "dept_id": selected_dept,
            "course_id": selected_course,
            "approval_step": selected_step,
            "approval_result": selected_result,
            "approver": selected_approver,
            "date_from": date_range[0].strftime("%Y-%m-%d") if len(date_range) > 0 else None,
            "date_to": date_range[1].strftime("%Y-%m-%d") if len(date_range) > 1 else None
        }
        
        filter_desc = generate_filter_description(filters)
        st.info(f"📊 **当前筛选**\n{filter_desc}")
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        with st.spinner("正在加载审批记录..."):
            df = get_approval_records(filters)
            summary_df = get_approval_summary(filters)
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("📋 审批记录总数", f"{len(df):,}")
        with col2:
            approved_count = len(df.filter(pl.col("approval_result") == "approved"))
            st.metric("✅ 已通过", f"{approved_count:,}")
        with col3:
            rejected_count = len(df.filter(pl.col("approval_result") == "rejected"))
            st.metric("❌ 已拒绝", f"{rejected_count:,}")
        with col4:
            pending_count = len(df.filter(pl.col("approval_result").is_null() | (pl.col("approval_result") == "pending")))
            st.metric("⏳ 待审批", f"{pending_count:,}")
        
        st.markdown("---")
        
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.subheader("📊 审批步骤统计")
            if not summary_df.is_empty():
                pivot_df = summary_df.pivot(
                    index="approval_step",
                    columns="approval_result",
                    values="count"
                ).fill_null(0)
                st.dataframe(
                    pivot_df.to_pandas(),
                    use_container_width=True,
                    hide_index=False,
                    column_config={
                        "approval_step": st.column_config.TextColumn("审批步骤"),
                        "approved": st.column_config.NumberColumn("通过", format="%d"),
                        "rejected": st.column_config.NumberColumn("拒绝", format="%d"),
                        "pending": st.column_config.NumberColumn("待处理", format="%d")
                    }
                )
            else:
                st.info("暂无统计数据")
        
        with col2:
            st.subheader("📈 审批效率")
            if not summary_df.is_empty():
                for step in range(1, 5):
                    step_data = summary_df.filter(pl.col("approval_step") == step)
                    if not step_data.is_empty():
                        avg_days = step_data["avg_days"].mean()
                        if avg_days is not None:
                            st.metric(f"第{step}步平均耗时", f"{avg_days:.1f}天")
            else:
                st.info("暂无效率数据")
        
        st.markdown("---")
        
        st.subheader("📋 审批记录详情")
        
        if not df.is_empty():
            column_config = {
                "approval_id": st.column_config.TextColumn("审批ID", width="small"),
                "order_id": st.column_config.TextColumn("订单ID", width="small"),
                "textbook_name": st.column_config.TextColumn("教材名称", width="medium"),
                "course_name": st.column_config.TextColumn("课程名称", width="medium"),
                "course_code": st.column_config.TextColumn("课程代码", width="small"),
                "dept_name": st.column_config.TextColumn("院系", width="medium"),
                "term_name": st.column_config.TextColumn("学期", width="medium"),
                "approval_step": st.column_config.NumberColumn("步骤", format="%d"),
                "approver": st.column_config.TextColumn("审批人", width="small"),
                "approval_time": st.column_config.DatetimeColumn("审批时间"),
                "approval_result": st.column_config.SelectboxColumn(
                    "结果",
                    options=["approved", "rejected", "pending"],
                    format_func=lambda x: {
                        "approved": "✅ 通过",
                        "rejected": "❌ 拒绝",
                        "pending": "⏳ 待审批"
                    }.get(x, x)
                ),
                "opinion": st.column_config.TextColumn("意见", width="large"),
                "order_status": st.column_config.SelectboxColumn(
                    "订单状态",
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
            }
            
            st.dataframe(
                df.select([
                    "approval_id", "order_id", "textbook_name", "course_name",
                    "course_code", "dept_name", "term_name", "approval_step",
                    "approver", "approval_time", "approval_result", "opinion", "order_status"
                ]).to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config=column_config
            )
            
            st.download_button(
                "📥 导出审批记录",
                df.to_pandas().to_csv(index=False).encode("utf-8-sig"),
                f"审批记录_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv",
                "text/csv"
            )
        else:
            st.info("暂无符合条件的审批记录")
    
    except Exception as e:
        logger.error(f"加载审批记录页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
