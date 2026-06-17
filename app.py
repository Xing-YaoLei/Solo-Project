import streamlit as st
import plotly.graph_objects as go
import polars as pl
from datetime import datetime, date, timedelta
import logging
import os

from config import config, get_compliance_rules_text
from data import DuckDBClient, MinIOClient
from processing import DataProcessor, ComplianceCalculator
from components import (
    FunnelChart, AnomalyMarker, TaskGenerator, DownloadHandler,
    CheckinView, RiskEventView, ElderProfileView
)
from utils import SampleDataGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

st.set_page_config(
    page_title=config.app_name,
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

@st.cache_resource
def get_db_client():
    return DuckDBClient()

@st.cache_resource
def get_minio_client():
    try:
        return MinIOClient()
    except Exception as e:
        logger.warning(f"MinIO client initialization failed: {e}")
        return None

def init_session_state():
    if "start_date" not in st.session_state:
        st.session_state.start_date = date.today() - timedelta(days=30)
    if "end_date" not in st.session_state:
        st.session_state.end_date = date.today()
    if "current_view" not in st.session_state:
        st.session_state.current_view = "漏斗总览"
    if "data_initialized" not in st.session_state:
        st.session_state.data_initialized = False

def check_and_generate_sample_data(db: DuckDBClient):
    elders = db.get_elders()
    if len(elders) == 0:
        st.info("🔄 正在初始化示例数据，用于演示系统功能...")
        generator = SampleDataGenerator(db)
        generator.generate_and_save(days=30)
        st.success("✅ 示例数据已生成，包含15位老人30天的康复活动数据")
        st.session_state.data_initialized = True
    else:
        st.session_state.data_initialized = True

def render_sidebar():
    with st.sidebar:
        st.title("🏥 养老护理康复")
        st.subheader("活动漏斗报表")
        
        st.divider()
        
        st.subheader("📅 统计期间")
        start_date = st.date_input(
            "开始日期",
            value=st.session_state.start_date,
            max_value=st.session_state.end_date
        )
        end_date = st.date_input(
            "结束日期",
            value=st.session_state.end_date,
            min_value=start_date
        )
        
        st.session_state.start_date = start_date
        st.session_state.end_date = end_date
        
        st.divider()
        
        st.subheader("📊 常用视图")
        view_options = ["漏斗总览", "活动签到", "风险事件", "老人档案", "备注任务"]
        selected_view = st.radio(
            "选择视图",
            view_options,
            index=view_options.index(st.session_state.current_view),
            label_visibility="collapsed"
        )
        st.session_state.current_view = selected_view
        
        st.divider()
        
        st.subheader("⚙️ 系统设置")
        
        threshold = st.slider(
            "护理达标阈值 (%)",
            min_value=60,
            max_value=95,
            value=int(config.thresholds.compliance_threshold),
            help="超过该阈值将生成备注任务进行复盘确认"
        )
        config.thresholds.compliance_threshold = float(threshold)
        
        fall_days = st.slider(
            "跌倒影响天数",
            min_value=3,
            max_value=14,
            value=config.thresholds.fall_impact_days
        )
        config.thresholds.fall_impact_days = fall_days
        
        terminal_delay = st.slider(
            "终端延迟阈值 (小时)",
            min_value=6,
            max_value=72,
            value=config.thresholds.terminal_delay_threshold_hours
        )
        config.thresholds.terminal_delay_threshold_hours = terminal_delay
        
        st.divider()
        
        with st.expander("🔄 数据管理"):
            if st.button("重新生成示例数据", type="secondary"):
                db = get_db_client()
                generator = SampleDataGenerator(db)
                generator.generate_and_save(days=30)
                st.success("✅ 示例数据已重新生成")
                st.rerun()
            
            if st.button("清除所有数据", type="secondary"):
                db = get_db_client()
                db.conn.execute("DELETE FROM elders")
                db.conn.execute("DELETE FROM rehabilitation_activities")
                db.conn.execute("DELETE FROM risk_events")
                db.conn.execute("DELETE FROM activity_checkins")
                db.conn.execute("DELETE FROM anomaly_records")
                db.conn.execute("DELETE FROM compliance_tasks")
                st.warning("⚠️ 所有数据已清除")
                st.rerun()
        
        minio_client = get_minio_client()
        if minio_client and minio_client.is_available():
            st.success("✅ MinIO 已连接")
        else:
            st.info("ℹ️ 使用本地数据存储")
        
        st.divider()
        st.caption(f"v1.0.0 | {datetime.now().strftime('%Y-%m-%d %H:%M')}")

def render_header(anomaly_marker: AnomalyMarker, task_generator: TaskGenerator):
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.title("🏥 养老护理康复活动漏斗报表")
        st.caption(f"统计期间: {st.session_state.start_date} 至 {st.session_state.end_date}")
    
    with col2:
        if st.button("🔄 刷新看板", type="primary", use_container_width=True):
            st.rerun()
    
    try:
        if anomaly_marker.has_anomalies():
            anomaly_summary = anomaly_marker.get_anomaly_summary()
            if anomaly_summary:
                warning_cols = st.columns(len(anomaly_summary))
                for i, item in enumerate(anomaly_summary):
                    with warning_cols[i]:
                        st.markdown(
                            f"<div style='padding:10px; border-radius:5px; "
                            f"background-color:{item['color']}20; border:1px solid {item['color']}'>"
                            f"<span style='color:{item['color']}'>{item['icon']} {item['label']}: {item['count']} 条</span>"
                            f"</div>",
                            unsafe_allow_html=True
                        )
    except Exception as e:
        logger.warning(f"Failed to render anomaly summary: {e}")
    
    task_generator.render_task_badges()

def render_funnel_view(db: DuckDBClient, processor: DataProcessor, 
                       calculator: ComplianceCalculator, anomaly_marker: AnomalyMarker,
                       task_generator: TaskGenerator):
    start_date_str = st.session_state.start_date.strftime("%Y-%m-%d")
    end_date_str = st.session_state.end_date.strftime("%Y-%m-%d")
    
    funnel_stages = processor.calculate_funnel_stages(start_date_str, end_date_str)
    funnel_chart = FunnelChart(funnel_stages)
    
    summary = funnel_chart.get_summary_stats()
    compliance_summary = calculator.get_compliance_summary(start_date_str, end_date_str)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("总活动数", summary["total_activities"])
    with col2:
        st.metric("护理达标数", summary["final_compliant"])
    with col3:
        st.metric(
            "整体达标率",
            f"{compliance_summary['compliance_rate']}%",
            delta=f"阈值 {compliance_summary['threshold']}%"
        )
    with col4:
        st.metric("达标等级", compliance_summary["level"])
    
    col1, col2 = st.columns([3, 2])
    
    with col1:
        st.subheader("📊 康复活动漏斗")
        fig_funnel = funnel_chart.create_funnel_figure()
        try:
            fig_funnel = anomaly_marker.add_anomaly_markers_to_chart(fig_funnel)
        except Exception as e:
            logger.warning(f"Failed to add anomaly markers to chart: {e}")
        st.plotly_chart(fig_funnel, use_container_width=True)
        
        anomaly_marker.render_saved_conclusions_near_chart()
        
        task_generator.display_task_conclusions_near_chart()
    
    with col2:
        st.subheader("📈 各阶段转化率")
        fig_conversion = funnel_chart.create_conversion_bar_chart()
        st.plotly_chart(fig_conversion, use_container_width=True)
    
    st.subheader("📋 漏斗详情")
    funnel_table = funnel_chart.create_detailed_funnel_table()
    st.dataframe(funnel_table, use_container_width=True, hide_index=True)
    
    if summary["max_drop_rate"] > 20:
        st.warning(
            f"⚠️ 最大流失点在「{summary['max_drop_stage']}」阶段，"
            f"流失率 {summary['max_drop_rate']}%，请重点关注"
        )
    
    st.divider()
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("📈 每日达标趋势")
        daily_trend = processor.get_daily_trend(start_date_str, end_date_str)
        
        if len(daily_trend) > 0:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=daily_trend["plan_date"],
                y=daily_trend["total_activities"],
                name="总活动数",
                marker_color="#1f77b4"
            ))
            fig.add_trace(go.Bar(
                x=daily_trend["plan_date"],
                y=daily_trend["compliant_count"],
                name="达标数",
                marker_color="#2ca02c"
            ))
            fig.add_trace(go.Scatter(
                x=daily_trend["plan_date"],
                y=daily_trend["compliance_rate"],
                name="达标率(%)",
                yaxis="y2",
                mode="lines+markers",
                marker_color="#ff7f0e"
            ))
            fig.add_hline(
                y=config.thresholds.compliance_threshold,
                line_dash="dash",
                line_color="red",
                annotation_text=f"达标阈值 {config.thresholds.compliance_threshold}%"
            )
            fig.update_layout(
                barmode="group",
                yaxis2=dict(
                    title="达标率(%)",
                    overlaying="y",
                    side="right",
                    range=[0, 100]
                ),
                yaxis_title="活动数",
                height=400,
                margin={"l": 20, "r": 20, "t": 20, "b": 20},
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            
            fig = anomaly_marker.add_anomaly_markers_to_chart(fig)
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("🏆 老人达标排名")
        elder_ranking = processor.get_elder_compliance_ranking(start_date_str, end_date_str, limit=10)
        
        if len(elder_ranking) > 0:
            display_ranking = elder_ranking.select([
                "elder_name", "total_activities", "compliant_count", "compliance_rate"
            ]).rename({
                "elder_name": "老人姓名",
                "total_activities": "活动总数",
                "compliant_count": "达标数",
                "compliance_rate": "达标率(%)"
            })
            
            st.dataframe(
                display_ranking,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "达标率(%)": st.column_config.ProgressColumn(
                        "达标率(%)",
                        format="%.2f",
                        min_value=0,
                        max_value=100
                    )
                }
            )
    
    st.divider()
    
    new_tasks = task_generator.generate_tasks_if_needed(start_date_str, end_date_str)
    if new_tasks:
        st.info(f"📋 已自动生成 {len(new_tasks)} 条护理达标备注任务")
    
    st.subheader("📌 数据异常检测")
    anomaly_marker.render_anomaly_alerts()

def render_other_views(db: DuckDBClient, processor: DataProcessor, 
                       anomaly_marker: AnomalyMarker,
                       checkin_view: CheckinView, risk_view: RiskEventView, 
                       profile_view: ElderProfileView):
    start_date_str = st.session_state.start_date.strftime("%Y-%m-%d")
    end_date_str = st.session_state.end_date.strftime("%Y-%m-%d")
    
    current_view = st.session_state.current_view
    
    if current_view == "活动签到":
        checkin_view.render(start_date_str, end_date_str, anomaly_marker)
    elif current_view == "风险事件":
        risk_view.render(start_date_str, end_date_str, anomaly_marker)
    elif current_view == "老人档案":
        profile_view.render(start_date_str, end_date_str, anomaly_marker)
    elif current_view == "备注任务":
        st.header("📋 护理达标备注任务")
        from components.task_generator import TaskGenerator
        task_gen = TaskGenerator(db)
        task_gen.render_tasks_panel()

def render_download_section(download_handler: DownloadHandler):
    st.divider()
    start_date_str = st.session_state.start_date.strftime("%Y-%m-%d")
    end_date_str = st.session_state.end_date.strftime("%Y-%m-%d")
    download_handler.render_download_button(start_date_str, end_date_str)
    
    download_handler.render_history_reports()
    
    with st.expander("📖 查看护理达标计算规则"):
        st.text(get_compliance_rules_text())

def main():
    init_session_state()
    
    db = get_db_client()
    minio_client = get_minio_client()
    
    check_and_generate_sample_data(db)
    
    render_sidebar()
    
    processor = DataProcessor(db)
    calculator = ComplianceCalculator(db)
    task_generator = TaskGenerator(db)
    download_handler = DownloadHandler(db, minio_client)
    checkin_view = CheckinView(db)
    risk_view = RiskEventView(db)
    profile_view = ElderProfileView(db)
    
    start_date_str = st.session_state.start_date.strftime("%Y-%m-%d")
    end_date_str = st.session_state.end_date.strftime("%Y-%m-%d")
    
    anomalies = processor.detect_all_anomalies()
    anomaly_marker = AnomalyMarker(anomalies, db)
    
    render_header(anomaly_marker, task_generator)
    
    if st.session_state.current_view == "漏斗总览":
        render_funnel_view(db, processor, calculator, anomaly_marker, task_generator)
    else:
        render_other_views(db, processor, anomaly_marker, 
                          checkin_view, risk_view, profile_view)
    
    render_download_section(download_handler)

if __name__ == "__main__":
    main()
