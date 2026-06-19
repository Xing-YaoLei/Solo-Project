import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st

from src.config.settings import settings
from src.data import repository, minio_client
from src.pages import (
    render_overview_page,
    render_transactions_page,
    render_insurance_page,
    render_inventory_page,
    render_rework_page,
)
from src.pages.ui_utils import init_page_config


def main():
    init_page_config("汽车维修保养提醒趋势看板")

    if "data_loaded" not in st.session_state:
        with st.spinner("正在加载数据..."):
            repository.load_all(use_mock=settings.USE_MOCK_DATA)
            st.session_state.data_loaded = True
            st.session_state.repository = repository

    st.markdown("# 🚗 汽车维修保养提醒趋势看板")
    st.caption("基于 Streamlit · Polars · DuckDB · MinIO 构建的汽车维修数据分析平台")

    with st.sidebar:
        st.markdown("### 📊 导航菜单")
        page = st.radio(
            "选择页面",
            options=[
                "📈 总览看板",
                "💰 收银流水与工单版本",
                "🛡️ 保险材料口径对照",
                "📦 配件库存与缺货缺口",
                "🔧 返修率复盘分析",
            ],
            index=0,
        )

        st.divider()
        st.markdown("### ⚙️ 系统设置")

        storage_status = "✅ MinIO 已连接" if minio_client.is_connected else "⚠️ 使用本地存储"
        st.info(storage_status)

        data_source = "✅ 模拟数据已加载" if st.session_state.data_loaded else "❌ 数据未加载"
        st.info(data_source)

        if st.button("🔄 重新加载数据", use_container_width=True):
            with st.spinner("正在重新加载数据..."):
                repository.load_all(use_mock=True)
                st.session_state.data_loaded = True
                st.session_state.repository = repository
                st.success("数据已重新加载！")

        if st.button("💾 保存数据到存储", use_container_width=True):
            with st.spinner("正在保存数据..."):
                repository.save_all()
                st.success("数据已保存！")

        st.divider()
        st.markdown("### 📋 数据表概览")
        tables_info = {
            "车辆档案": repository.vehicles.shape[0] if repository.vehicles is not None else 0,
            "收银流水": repository.cash_transactions.shape[0] if repository.cash_transactions is not None else 0,
            "维修工单": repository.work_orders.shape[0] if repository.work_orders is not None else 0,
            "工单项目": repository.work_order_items.shape[0] if repository.work_order_items is not None else 0,
            "工单版本": repository.work_order_versions.shape[0] if repository.work_order_versions is not None else 0,
            "配件库存": repository.parts_inventory.shape[0] if repository.parts_inventory is not None else 0,
            "库存历史": repository.parts_inventory_history.shape[0] if repository.parts_inventory_history is not None else 0,
            "保险材料": repository.insurance_docs.shape[0] if repository.insurance_docs is not None else 0,
            "诊断结果": repository.diagnosis_results.shape[0] if repository.diagnosis_results is not None else 0,
            "保养提醒": repository.maintenance_reminders.shape[0] if repository.maintenance_reminders is not None else 0,
            "返修记录": repository.rework_records.shape[0] if repository.rework_records is not None else 0,
            "缺货记录": repository.parts_shortage.shape[0] if repository.parts_shortage is not None else 0,
        }
        for name, count in tables_info.items():
            st.caption(f"{name}: {count:,} 条")

    st.divider()

    if page == "📈 总览看板":
        render_overview_page()
    elif page == "💰 收银流水与工单版本":
        render_transactions_page()
    elif page == "🛡️ 保险材料口径对照":
        render_insurance_page()
    elif page == "📦 配件库存与缺货缺口":
        render_inventory_page()
    elif page == "🔧 返修率复盘分析":
        render_rework_page()

    st.divider()
    st.caption("© 2024 汽车维修保养数据分析平台 | 数据层：收银流水/维修工单(含版本) | 口径对照：保险材料 | 异常解释：配件库存")


if __name__ == "__main__":
    main()
