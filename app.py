import streamlit as st
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

st.set_page_config(
    page_title="活动票务核销风险监测",
    page_icon="🎫",
    layout="wide",
    initial_sidebar_state="expanded"
)

from src.pages.overview import render_overview
from src.pages.seat_map import render_seat_map
from src.pages.checkin_codes import render_checkin_codes
from src.pages.sponsors import render_sponsors
from src.pages.refunds import render_refunds
from src.pages.detail_trace import render_detail_trace
from src.data.mock_data import load_data_into_duckdb, generate_all_data, save_data_to_csv
from src.data.data_loader import DataLoader
from src.utils.config import Config


def init_data():
    loader = DataLoader()
    tables = loader.list_tables()

    if len(tables) == 0:
        with st.sidebar:
            with st.spinner("正在初始化模拟数据..."):
                data = generate_all_data()
                save_data_to_csv(data)
                load_data_into_duckdb(data)
        st.sidebar.success("✅ 数据初始化完成")

    return loader


def main():
    st.sidebar.markdown("# 🎫 票务核销监测")
    st.sidebar.markdown("---")

    loader = init_data()

    page = st.sidebar.radio(
        "导航菜单",
        [
            "📊 核销总览",
            "🪑 座位核销地图",
            "🎫 签到码追踪",
            "🏢 赞助清单",
            "💸 退票争议",
            "🔍 明细追溯"
        ],
        index=0
    )

    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📦 数据源")

    tables = loader.list_tables()
    st.sidebar.caption(f"已加载 {len(tables)} 张数据表")
    for t in tables:
        count = loader.ddb.get_row_count(t)
        st.sidebar.caption(f"- {t}: {count:,} 条")

    if st.sidebar.button("🔄 重新生成数据", use_container_width=True):
        with st.spinner("正在重新生成数据..."):
            data = generate_all_data()
            save_data_to_csv(data)
            load_data_into_duckdb(data)
        st.sidebar.success("✅ 数据已重新生成")
        st.rerun()

    st.sidebar.markdown("---")
    st.sidebar.caption("Powered by Streamlit + Polars + DuckDB + MinIO")

    if page == "📊 核销总览":
        render_overview()
    elif page == "🪑 座位核销地图":
        render_seat_map()
    elif page == "🎫 签到码追踪":
        render_checkin_codes()
    elif page == "🏢 赞助清单":
        render_sponsors()
    elif page == "💸 退票争议":
        render_refunds()
    elif page == "🔍 明细追溯":
        render_detail_trace()


if __name__ == "__main__":
    main()
