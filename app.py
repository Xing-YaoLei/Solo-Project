import streamlit as st
from datetime import date

from src.data import DuckDBStore, MinIODataLoader
from src.processing import DataCleaner, DataMatcher
from src.services import ThresholdService, FallReviewService, CareStandardService
from src.pages import (
    DashboardPage,
    ThresholdPage,
    StandardVersionPage,
    DataManagementPage
)

st.set_page_config(
    page_title="养老护理康复活动趋势看板",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://github.com/elder-care-dashboard',
        'Report a bug': "https://github.com/elder-care-dashboard/issues",
        'About': "# 养老护理康复活动趋势看板\n专门用于复盘养老护理的康复活动"
    }
)

st.markdown("""
<style>
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 95%;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        border-radius: 4px 4px 0px 0px;
        gap: 1px;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #f0f2f6;
    }
    div[data-testid="stMetricDelta"] svg {
        display: none;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource(show_spinner="正在初始化系统...")
def init_services():
    db = DuckDBStore()
    minio_loader = MinIODataLoader()
    cleaner = DataCleaner()
    matcher = DataMatcher()
    
    threshold_service = ThresholdService(db)
    standard_service = CareStandardService(db)
    fall_service = FallReviewService(db, threshold_service)
    
    return {
        "db": db,
        "minio_loader": minio_loader,
        "cleaner": cleaner,
        "matcher": matcher,
        "threshold_service": threshold_service,
        "standard_service": standard_service,
        "fall_service": fall_service
    }

services = init_services()

with st.sidebar:
    st.markdown("# 🏥 养老护理看板")
    st.markdown("---")
    
    page = st.radio(
        "导航菜单",
        ["📊 趋势看板", "⚙️ 阈值配置", "📜 口径版本", "📥 数据管理"],
        index=0
    )
    
    st.markdown("---")
    
    with st.expander("ℹ️ 系统信息", expanded=True):
        minio_available = services["minio_loader"].is_available
        if minio_available:
            st.success("✅ MinIO 已连接")
        else:
            st.warning("⚠️ MinIO 未连接，仅支持本地模式")
        
        st.info(f"""
        **技术栈:**
        - Streamlit (前端)
        - Polars (数据处理)
        - DuckDB (数据存储)
        - MinIO (对象存储)
        
        **当前时间:** {date.today().strftime('%Y-%m-%d')}
        """)
    
    with st.expander("🔧 系统操作"):
        if st.button("🔄 清除缓存", use_container_width=True):
            st.cache_data.clear()
            st.success("缓存已清除")
        
        if st.button("💾 优化数据库", use_container_width=True):
            with st.spinner("正在优化数据库..."):
                services["db"].con.execute("VACUUM")
                services["db"].con.execute("ANALYZE")
            st.success("数据库优化完成")
        
        if st.button("🔄 重新连接MinIO", use_container_width=True):
            st.cache_resource.clear()
            st.rerun()

if page == "📊 趋势看板":
    dashboard = DashboardPage(
        services["db"],
        services["threshold_service"],
        services["fall_service"],
        services["standard_service"]
    )
    dashboard.render()

elif page == "⚙️ 阈值配置":
    threshold_page = ThresholdPage(
        services["db"],
        services["threshold_service"]
    )
    threshold_page.render()

elif page == "📜 口径版本":
    standard_page = StandardVersionPage(
        services["db"],
        services["standard_service"]
    )
    standard_page.render()

elif page == "📥 数据管理":
    data_page = DataManagementPage(
        services["db"],
        services["minio_loader"],
        services["cleaner"],
        services["matcher"],
        services["standard_service"]
    )
    data_page.render()

st.markdown("---")
st.caption("© 2024 养老护理康复活动趋势看板 | 基于 Streamlit + Polars + DuckDB + MinIO 构建")
