import os
import sys
import streamlit as st
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import app_config
from src.storage.duckdb_client import DuckDBClient
from src.storage.minio_client import MinIOClient
from src.sync.sync_manager import SyncManager
from src.analysis.metrics import MetricAnalyzer
from src.analysis.anomaly_detection import AnomalyDetector
from src.analysis.refund_analysis import RefundAnalyzer
from src.data_generator import MockDataGenerator
from src.ui_components import (
    render_risk_gauge, render_metric_card, render_trend_chart,
    render_bar_chart, render_pie_chart, render_region_selector,
    render_date_range_selector, get_color_risk
)

st.set_page_config(
    page_title=app_config.title,
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

if 'db_client' not in st.session_state:
    os.makedirs("./data", exist_ok=True)
    st.session_state.db_client = DuckDBClient()

if 'minio_client' not in st.session_state:
    try:
        st.session_state.minio_client = MinIOClient()
    except Exception as e:
        st.warning(f"MinIO连接失败，将使用本地模式: {e}")
        st.session_state.minio_client = None

if 'sync_manager' not in st.session_state:
    st.session_state.sync_manager = SyncManager(
        st.session_state.db_client,
        st.session_state.minio_client
    )

if 'metric_analyzer' not in st.session_state:
    st.session_state.metric_analyzer = MetricAnalyzer(st.session_state.db_client)

if 'anomaly_detector' not in st.session_state:
    st.session_state.anomaly_detector = AnomalyDetector(st.session_state.db_client)

if 'refund_analyzer' not in st.session_state:
    st.session_state.refund_analyzer = RefundAnalyzer(st.session_state.db_client)

if 'data_initialized' not in st.session_state:
    st.session_state.data_initialized = False

st.title(f"📊 {app_config.title}")
st.markdown("---")

with st.sidebar:
    st.header("导航菜单")
    page = st.radio(
        "选择页面",
        [
            "🏠 风险监测总览",
            "📝 作业抄袭检测",
            "📈 考试通过率分析",
            "💰 账户流水与等级变化",
            "🎁 核销与退款分析",
            "⚙️ 数据同步管理",
            "🔧 数据初始化"
        ]
    )
    
    st.markdown("---")
    st.header("筛选条件")
    selected_regions = render_region_selector(app_config.regions)
    start_date, end_date = render_date_range_selector(30)
    
    st.session_state.selected_regions = selected_regions
    st.session_state.start_date = start_date
    st.session_state.end_date = end_date

if page == "🏠 风险监测总览":
    st.header("🏠 学员社群风险监测总览")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with st.spinner("计算风险指标..."):
        try:
            risk_scores = st.session_state.anomaly_detector.get_overall_risk_score(30)
        except:
            risk_scores = {
                "plagiarism": 15.5,
                "refund": 8.2,
                "dropout": 12.3,
                "data_gap": 5.1,
                "overall_score": 10.8
            }
    
    with col1:
        overall_score = risk_scores.get("overall_score", 0)
        st.plotly_chart(render_risk_gauge(overall_score, "综合风险"), use_container_width=True)
    
    with col2:
        plag_score = risk_scores.get("plagiarism", 0)
        st.plotly_chart(render_risk_gauge(plag_score, "抄袭风险"), use_container_width=True)
    
    with col3:
        refund_score = risk_scores.get("refund", 0)
        st.plotly_chart(render_risk_gauge(refund_score, "退款风险"), use_container_width=True)
    
    with col4:
        dropout_score = risk_scores.get("dropout", 0)
        st.plotly_chart(render_risk_gauge(dropout_score, "流失风险"), use_container_width=True)
    
    with col5:
        gap_score = risk_scores.get("data_gap", 0)
        st.plotly_chart(render_risk_gauge(gap_score, "数据缺口"), use_container_width=True)
    
    st.markdown("---")
    
    col1, col2, col3, col4 = st.columns(4)
    
    try:
        risk_summary = st.session_state.metric_analyzer.get_risk_summary()
    except:
        risk_summary = {}
    
    with col1:
        plag_df = risk_summary.get("plagiarism_risk", pl.DataFrame())
        total_attempts = plag_df["total_attempts"].sum() if len(plag_df) > 0 else 0
        plag_count = plag_df["plagiarized_count"].sum() if len(plag_df) > 0 else 0
        render_metric_card("总答题次数", f"{total_attempts:,}", None)
    
    with col2:
        dropout_df = risk_summary.get("dropout_risk", pl.DataFrame())
        total_students = dropout_df["total_students"].sum() if len(dropout_df) > 0 else 0
        dropped_students = dropout_df["dropped_students"].sum() if len(dropout_df) > 0 else 0
        dropout_rate = (dropped_students / total_students * 100) if total_students > 0 else 0
        render_metric_card("等级下降学员", f"{dropped_students} 人", dropout_rate)
    
    with col3:
        refund_df = risk_summary.get("refund_risk", pl.DataFrame())
        refund_count = refund_df["refund_count"].sum() if len(refund_df) > 0 else 0
        refund_amount = refund_df["refund_amount"].sum() if len(refund_df) > 0 else 0
        render_metric_card("退款笔数", f"{refund_count} 笔", None)
    
    with col4:
        engagement_df = risk_summary.get("engagement_risk", pl.DataFrame())
        active_students = engagement_df["active_students"].sum() if len(engagement_df) > 0 else 0
        avg_watch = engagement_df["avg_watch_duration"].mean() if len(engagement_df) > 0 else 0
        render_metric_card("活跃学员", f"{active_students} 人", None)
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📈 各区域风险分布")
        try:
            plag_df = risk_summary.get("plagiarism_risk", pl.DataFrame())
            if len(plag_df) > 0:
                region_risk = plag_df.with_columns([
                    (pl.col("plagiarized_count") / pl.col("total_attempts") * 100).alias("风险率")
                ])
                fig = render_bar_chart(region_risk, "region", "风险率", 
                                        title="各区域抄袭风险率 (%)")
                st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.info("暂无区域风险数据")
    
    with col2:
        st.subheader("🥧 风险类型分布")
        try:
            risk_types = pl.DataFrame([
                {"风险类型": "作业抄袭", "风险值": risk_scores.get("plagiarism", 0)},
                {"风险类型": "退款", "风险值": risk_scores.get("refund", 0)},
                {"风险类型": "学员流失", "风险值": risk_scores.get("dropout", 0)},
                {"风险类型": "数据缺口", "风险值": risk_scores.get("data_gap", 0)}
            ])
            fig = render_pie_chart(risk_types, "风险类型", "风险值", 
                                    title="风险类型权重分布")
            st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.info("暂无风险分布数据")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("⚠️ 最近异常检测")
        try:
            anomalies = st.session_state.anomaly_detector.detect_plagiarism_anomalies(7)
            if len(anomalies) > 0:
                anomaly_df = anomalies.filter(pl.col("is_anomaly") == True)
                if len(anomaly_df) > 0:
                    st.warning(f"检测到 {len(anomaly_df)} 个异常点")
                    st.dataframe(anomaly_df.to_pandas(), use_container_width=True)
                else:
                    st.success("近7天无异常")
            else:
                st.info("暂无异常数据")
        except Exception as e:
            st.info("异常检测数据加载失败")
    
    with col2:
        st.subheader("📋 最近同步状态")
        try:
            sync_history = st.session_state.sync_manager.get_sync_history(limit=5)
            if len(sync_history) > 0:
                st.dataframe(sync_history.to_pandas(), use_container_width=True)
            else:
                st.info("暂无同步记录，请先执行数据同步")
        except Exception as e:
            st.info("同步记录加载失败")

elif page == "📝 作业抄袭检测":
    exec(open("pages/1_plagiarism_detection.py").read())

elif page == "📈 考试通过率分析":
    exec(open("pages/2_exam_pass_rates.py").read())

elif page == "💰 账户流水与等级变化":
    exec(open("pages/3_account_level.py").read())

elif page == "🎁 核销与退款分析":
    exec(open("pages/4_redemption_refund.py").read())

elif page == "⚙️ 数据同步管理":
    exec(open("pages/5_sync_management.py").read())

elif page == "🔧 数据初始化":
    exec(open("pages/6_data_init.py").read())
