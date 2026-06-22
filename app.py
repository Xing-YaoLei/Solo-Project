import streamlit as st
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.components.common import set_page_config

set_page_config()

st.sidebar.title("📊 合规审计证据归档趋势看板")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "导航菜单",
    [
        "📈 趋势总览看板",
        "⚠️ 权限越权追踪",
        "📋 证据附件分析",
        "✅ 检查清单管理",
        "🎯 抽样记录明细",
        "🔄 同步链路审计"
    ]
)

st.sidebar.markdown("---")
st.sidebar.info(
    "技术栈: Streamlit + Polars + DuckDB + MinIO\n\n"
    "功能: 证据归档趋势分析、权限越权追踪、同环比分析、抽样口径解释"
)

if page == "📈 趋势总览看板":
    from src.pages import dashboard
    dashboard.show()
elif page == "⚠️ 权限越权追踪":
    from src.pages import violation_tracking
    violation_tracking.show()
elif page == "📋 证据附件分析":
    from src.pages import evidence_analysis
    evidence_analysis.show()
elif page == "✅ 检查清单管理":
    from src.pages import checklist
    checklist.show()
elif page == "🎯 抽样记录明细":
    from src.pages import sampling
    sampling.show()
elif page == "🔄 同步链路审计":
    from src.pages import sync_audit
    sync_audit.show()
