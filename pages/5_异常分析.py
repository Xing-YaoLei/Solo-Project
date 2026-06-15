import streamlit as st
import polars as pl
from datetime import datetime
from config import setup_logger, SEVERITY_COLORS
from src.data.database import db
from src.analysis.anomaly_detector import AnomalyDetector
from src.utils.filters import build_filter_conditions, generate_filter_description

logger = setup_logger()

st.set_page_config(
    page_title="异常分析 - 高校教务教材订购漏斗报表",
    page_icon="⚠️",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_data(ttl=3600)
def get_terms():
    return db.query("SELECT * FROM academic_term ORDER BY start_date DESC")

@st.cache_data(ttl=3600)
def get_departments():
    return db.query("SELECT * FROM department ORDER BY dept_name")

def main():
    st.title("⚠️ 异常分析")
    st.markdown("智能检测数据异常，结合教室资源解释异常点")
    st.markdown("---")
    
    terms = get_terms()
    departments = get_departments()
    anomaly_detector = AnomalyDetector()
    
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
        
        anomaly_type_options = ["全部"] + [at["code"] for at in anomaly_detector.ANOMALY_TYPES]
        selected_anomaly_type = st.selectbox(
            "异常类型",
            options=anomaly_type_options,
            format_func=lambda x: "全部" if x == "全部" else next((at["name"] for at in anomaly_detector.ANOMALY_TYPES if at["code"] == x), x),
            index=0
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
            index=0
        )
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        with st.spinner("正在检测异常..."):
            anomalies = anomaly_detector.detect_anomalies(selected_term)
        
        if selected_dept != "全部":
            anomalies = anomalies.filter(
                pl.col("description").str.contains(f"'{selected_dept}'")
            )
        
        if selected_anomaly_type != "全部":
            anomalies = anomalies.filter(pl.col("anomaly_type") == selected_anomaly_type)
        
        if selected_severity != "全部":
            anomalies = anomalies.filter(pl.col("severity") == selected_severity)
        
        summary = anomaly_detector.get_anomaly_summary(selected_term)
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("⚠️ 总异常数", summary["total_anomalies"])
        with col2:
            st.metric("🔴 严重异常", summary["by_severity"].get("high", 0))
        with col3:
            st.metric("🟠 中等异常", summary["by_severity"].get("medium", 0))
        
        st.markdown("---")
        
        st.subheader("📊 异常类型分布")
        if summary["by_type"]:
            type_df = pl.DataFrame([
                {"异常类型": k, "数量": v, 
                 "名称": next((at["name"] for at in anomaly_detector.ANOMALY_TYPES if at["code"] == k), k)}
                for k, v in summary["by_type"].items()
            ])
            
            col1, col2 = st.columns([1, 1])
            with col1:
                st.bar_chart(
                    type_df.to_pandas(),
                    x="名称",
                    y="数量",
                    color="#f97316"
                )
            with col2:
                st.dataframe(
                    type_df.select(["名称", "数量"]).to_pandas(),
                    use_container_width=True,
                    hide_index=True
                )
        
        st.markdown("---")
        
        st.subheader("📋 异常详情")
        
        if not anomalies.is_empty():
            display_df = anomalies.with_columns([
                pl.col("anomaly_type").apply(
                    lambda x: next((at["name"] for at in anomaly_detector.ANOMALY_TYPES if at["code"] == x), x)
                ).alias("异常类型"),
                pl.col("severity").alias("严重程度"),
                pl.col("description").alias("异常描述"),
                pl.col("detected_at").alias("检测时间"),
                pl.col("status").alias("状态")
            ])
            
            column_config = {
                "anomaly_id": st.column_config.TextColumn("异常ID", width="small"),
                "order_id": st.column_config.TextColumn("订单ID", width="small"),
                "异常类型": st.column_config.TextColumn("异常类型", width="medium"),
                "严重程度": st.column_config.SelectboxColumn(
                    "严重程度",
                    options=["high", "medium", "low"],
                    format_func=lambda x: {
                        "high": "🔴 严重",
                        "medium": "🟠 中等",
                        "low": "🟢 轻微"
                    }.get(x, x)
                ),
                "异常描述": st.column_config.TextColumn("异常描述", width="large"),
                "detected_at": st.column_config.DatetimeColumn("检测时间"),
                "status": st.column_config.SelectboxColumn(
                    "状态",
                    options=["open", "investigating", "resolved"],
                    format_func=lambda x: {
                        "open": "🔓 未处理",
                        "investigating": "🔍 调查中",
                        "resolved": "✅ 已解决"
                    }.get(x, x)
                ),
            }
            
            event = st.dataframe(
                display_df.select([
                    "anomaly_id", "order_id", "异常类型", "严重程度",
                    "异常描述", "detected_at", "status"
                ]).to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config=column_config,
                on_select="rerun",
                selection_mode="single-row"
            )
            
            if event.selection.rows:
                selected_idx = event.selection.rows[0]
                selected_anomaly = display_df.row(selected_idx, named=True)
                
                st.markdown("---")
                st.subheader("🔍 异常详情分析")
                
                col1, col2 = st.columns([1, 1])
                
                with col1:
                    st.info(f"""
                    **异常信息**
                    - 异常ID: {selected_anomaly['anomaly_id']}
                    - 异常类型: {selected_anomaly['异常类型']}
                    - 严重程度: {selected_anomaly['严重程度']}
                    - 描述: {selected_anomaly['异常描述']}
                    """)
                    
                    related_data = selected_anomaly.get("related_data", {})
                    if related_data:
                        st.json(related_data)
                
                with col2:
                    if selected_anomaly['异常类型'] == "教室容量不匹配":
                        st.warning("🏫 教室资源分析")
                        
                        order_id = selected_anomaly["order_id"]
                        course_sql = f"""
                        SELECT c.course_id, c.course_name, c.student_count
                        FROM textbook_order o
                        JOIN course c ON o.course_id = c.course_id
                        WHERE o.order_id = '{order_id}'
                        """
                        course_info = db.query(course_sql).to_dicts()
                        
                        if course_info:
                            course_id = course_info[0]["course_id"]
                            classroom_info = anomaly_detector.get_classroom_info(course_id)
                            
                            if not classroom_info.is_empty():
                                st.dataframe(
                                    classroom_info.to_pandas(),
                                    use_container_width=True,
                                    hide_index=True
                                )
                                
                                st.info("""
                                💡 **异常解释**：
                                该课程的选课人数超过了排课教室的容量，可能导致：
                                1. 教材订购数量需要增加以覆盖旁听学生
                                2. 教室安排需要调整
                                3. 考虑开设平行班
                                """)
                    else:
                        st.info("💡 点击包含教室信息的异常可查看详细分析")
            
            st.markdown("---")
            
            st.download_button(
                "📥 导出异常报告",
                anomalies.to_pandas().to_csv(index=False).encode("utf-8-sig"),
                f"异常报告_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv",
                "text/csv"
            )
        else:
            st.success("✅ 未检测到异常数据")
    
    except Exception as e:
        logger.error(f"加载异常分析页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
