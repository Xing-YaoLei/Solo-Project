import streamlit as st
import polars as pl
import plotly.graph_objects as go
from datetime import datetime
from config import setup_logger, FUNNEL_STAGES
from src.data.database import db
from src.analysis.funnel_engine import FunnelEngine
from src.utils.filters import build_filter_conditions, generate_filter_description

logger = setup_logger()

st.set_page_config(
    page_title="漏斗分析 - 高校教务教材订购漏斗报表",
    page_icon="🔄",
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

def create_funnel_chart(funnel_data):
    if funnel_data.is_empty():
        return None
    
    stages = funnel_data["stage_name"].to_list()
    values = funnel_data["count"].to_list()
    colors = [stage["color"] for stage in FUNNEL_STAGES[:len(stages)]]
    
    fig = go.Figure(go.Funnel(
        y=stages,
        x=values,
        textinfo="value+percent initial",
        textposition="inside",
        marker={"color": colors},
        connector={"line": {"color": "#cbd5e1", "width": 2}}
    ))
    
    fig.update_layout(
        title="教材订购七阶转化漏斗",
        height=600,
        font=dict(family="Arial, sans-serif", size=12),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)"
    )
    
    return fig

def create_trend_chart(trend_data):
    if trend_data.is_empty():
        return None
    
    fig = go.Figure()
    
    for stage in FUNNEL_STAGES:
        stage_data = trend_data.filter(pl.col("stage_code") == stage["code"])
        if not stage_data.is_empty():
            fig.add_trace(go.Scatter(
                x=stage_data["term_name"].to_list(),
                y=stage_data["count"].to_list(),
                mode="lines+markers",
                name=stage["name"],
                line=dict(color=stage["color"], width=2),
                marker=dict(size=8)
            ))
    
    fig.update_layout(
        title="多学期漏斗趋势对比",
        xaxis_title="学期",
        yaxis_title="数量",
        height=500,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)"
    )
    
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor="#e2e8f0")
    fig.update_xaxes(showgrid=False)
    
    return fig

def main():
    st.title("🔄 漏斗分析")
    st.markdown("分析教材订购全流程的转化情况，识别瓶颈环节")
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
        
        courses = get_courses(selected_dept)
        course_options = ["全部"] + [c["course_id"] for c in courses.to_dicts()]
        selected_course = st.selectbox(
            "选择课程",
            options=course_options,
            format_func=lambda x: "全部" if x == "全部" else next((c["course_name"] for c in courses.to_dicts() if c["course_id"] == x), x),
            index=0
        )
        
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
        
        st.markdown("---")
        filter_desc = generate_filter_description({
            "term_id": selected_term,
            "dept_id": selected_dept,
            "course_id": selected_course,
            "order_status": selected_status
        })
        st.info(f"📊 **当前筛选**\n{filter_desc}")
        
        st.markdown("---")
        st.caption(f"数据更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        funnel_engine = FunnelEngine()
        
        filters = {}
        if selected_dept != "全部":
            filters["dept_id"] = selected_dept
        if selected_course != "全部":
            filters["course_id"] = selected_course
        if selected_status != "全部":
            filters["order_status"] = selected_status
        
        with st.spinner("正在计算漏斗数据..."):
            funnel_data = funnel_engine.calculate_funnel(selected_term, filters)
        
        if "conversion_rate" not in funnel_data.columns and "stage_conversion" in funnel_data.columns:
            funnel_data = funnel_data.with_columns(pl.col("stage_conversion").alias("conversion_rate"))
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if not funnel_data.is_empty():
                total_courses = funnel_data["count"][0]
                total_distributed = funnel_data["count"][-1]
                conversion_rate = (total_distributed / total_courses * 100) if total_courses > 0 else 0
                
                st.metric(
                    "🎯 整体转化率",
                    f"{conversion_rate:.1f}%",
                    delta=f"{total_distributed:,} / {total_courses:,}"
                )
        
        with col2:
            if not funnel_data.is_empty() and len(funnel_data) > 1:
                max_drop_idx = (funnel_data["count"] / funnel_data["count"].shift(1)).arg_min()
                if max_drop_idx > 0:
                    stage_name = funnel_data["stage_name"][max_drop_idx]
                    drop_rate = (1 - funnel_data["conversion_rate"][max_drop_idx] / 100) * 100
                    
                    st.metric(
                        "⚠️ 最大流失环节",
                        stage_name,
                        delta=f"流失率 {drop_rate:.1f}%"
                    )
        
        with col3:
            metrics = funnel_engine.get_funnel_metrics(selected_term, filters)
            st.metric(
                "💰 总采购金额",
                f"¥{metrics.get('total_amount', 0):,.2f}"
            )
        
        st.markdown("---")
        
        col1, col2 = st.columns([3, 2])
        
        with col1:
            st.subheader("📊 漏斗图")
            funnel_chart = create_funnel_chart(funnel_data)
            if funnel_chart:
                st.plotly_chart(funnel_chart, use_container_width=True)
            else:
                st.info("暂无漏斗数据")
        
        with col2:
            st.subheader("📋 详细数据")
            if not funnel_data.is_empty():
                display_df = funnel_data.select([
                    "stage_name", "count", "conversion_rate", 
                    "drop_off", "description"
                ]).with_columns([
                    (pl.col("conversion_rate") / 100).alias("转化率"),
                    (pl.col("drop_off") / 100).alias("流失率")
                ])
                
                st.dataframe(
                    display_df.to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "stage_name": st.column_config.TextColumn("阶段", width="medium"),
                        "count": st.column_config.NumberColumn("数量", format="%d"),
                        "conversion_rate": st.column_config.ProgressColumn(
                            "转化率", format="%.1f%%", min_value=0, max_value=100
                        ),
                        "drop_off": st.column_config.ProgressColumn(
                            "流失率", format="%.1f%%", min_value=0, max_value=100
                        ),
                        "description": st.column_config.TextColumn("说明")
                    }
                )
            else:
                st.info("暂无详细数据")
        
        st.markdown("---")
        
        st.subheader("📈 多学期趋势对比")
        with st.spinner("正在加载趋势数据..."):
            try:
                terms = db.query("SELECT term_id FROM academic_term ORDER BY start_date")
                if len(terms) >= 2:
                    start_term = terms["term_id"][0]
                    end_term = terms["term_id"][-1]
                    trend_data = funnel_engine.get_trend_data(start_term, end_term, filters)
                    trend_chart = create_trend_chart(trend_data)
                    if trend_chart:
                        st.plotly_chart(trend_chart, use_container_width=True)
                    else:
                        st.info("暂无趋势数据")
                else:
                    st.info("至少需要2个学期数据才能显示趋势")
            except Exception as e:
                logger.warning(f"加载趋势数据失败: {e}")
                st.info("暂无趋势数据")
        
        st.markdown("---")
        
        st.subheader("🔍 阶段下钻分析")
        if not funnel_data.is_empty():
            stage_options = funnel_data["stage_name"].to_list()
            selected_stage = st.selectbox("选择要下钻的阶段", stage_options)
            
            stage_code = next(
                (s["code"] for s in FUNNEL_STAGES if s["name"] == selected_stage),
                None
            )
            
            if stage_code:
                drill_down_data = funnel_engine.drill_down(selected_term, stage_code, filters)
                if not drill_down_data.is_empty():
                    st.dataframe(
                        drill_down_data.to_pandas(),
                        use_container_width=True,
                        hide_index=True
                    )
                    
                    st.download_button(
                        "📥 导出下钻数据",
                        drill_down_data.to_pandas().to_csv(index=False).encode("utf-8-sig"),
                        f"下钻数据_{selected_stage}_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv",
                        "text/csv",
                        key="download_drilldown"
                    )
                else:
                    st.info("该阶段暂无下钻数据")
    
    except Exception as e:
        logger.error(f"加载漏斗分析页面失败: {e}")
        st.error(f"数据加载失败: {str(e)}")

if __name__ == "__main__":
    main()
