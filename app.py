"""
美业门店顾客回访风险监测平台 - Streamlit 主应用
"""
import os
import sys
import logging
from datetime import datetime, date, timedelta
from io import BytesIO

import streamlit as st
import polars as pl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import config
from src.data import duckdb_manager
from src.utils.data_cleaner import DataCleaner
from src.modules.risk_engine import RiskEngine, ThresholdConfig
from src.modules.charts import ChartGenerator
from src.modules.review_report import ReviewReportGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

st.set_page_config(
    page_title=config.app_title,
    page_icon="💄",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-header {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #6b7280;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .metric-card-success {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    .metric-card-warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .metric-card-info {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    .section-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: #374151;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 1rem;
    }
    .tab-content {
        padding-top: 1rem;
    }
    .delay-badge {
        background-color: #fef3c7;
        color: #92400e;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_risk_engine(_threshold_config):
    """获取风险引擎实例（带缓存）"""
    return RiskEngine(_threshold_config)


@st.cache_resource
def get_chart_generator(_threshold_config):
    """获取图表生成器实例（带缓存）"""
    return ChartGenerator(_threshold_config)


@st.cache_data
def get_core_metrics(store_id, date_from, date_to, _threshold_config):
    """获取核心指标（带缓存）"""
    charts = get_chart_generator(_threshold_config)
    return charts.get_core_metrics_cards(store_id, date_from, date_to)


def init_session_state():
    """初始化会话状态"""
    if "thresholds" not in st.session_state:
        st.session_state.thresholds = ThresholdConfig(
            low_course_consumption_rate=config.thresholds.low_course_consumption_rate,
            high_material_usage_ratio=config.thresholds.high_material_usage_ratio,
            negative_review_ratio=config.thresholds.negative_review_ratio,
            overdue_visit_days=config.thresholds.overdue_visit_days,
            review_delay_hours=config.thresholds.review_delay_hours,
        )
    if "selected_store" not in st.session_state:
        st.session_state.selected_store = None
    if "date_range" not in st.session_state:
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        st.session_state.date_range = (start_date, end_date)
    if "page" not in st.session_state:
        st.session_state.page = "dashboard"


def render_sidebar():
    """渲染侧边栏"""
    with st.sidebar:
        st.markdown("### 🎛️ 控制面板")

        st.radio(
            "导航",
            options=["dashboard", "data_import", "review_report"],
            format_func=lambda x: {
                "dashboard": "📊 风险监测仪表盘",
                "data_import": "📥 数据导入",
                "review_report": "📋 复盘报告",
            }[x],
            key="page",
            label_visibility="collapsed",
        )

        st.divider()

        st.markdown("### ⚙️ 预警阈值设置")

        with st.expander("消课率阈值", expanded=True):
            st.session_state.thresholds.low_course_consumption_rate = st.slider(
                "低消课率预警阈值",
                min_value=0.1,
                max_value=0.95,
                value=st.session_state.thresholds.low_course_consumption_rate,
                step=0.05,
                format="%.0f%%",
                help="消课率低于此值时触发预警",
            )

        with st.expander("耗材异常阈值", expanded=True):
            st.session_state.thresholds.high_material_usage_ratio = st.slider(
                "耗材用量超标倍数",
                min_value=1.0,
                max_value=5.0,
                value=st.session_state.thresholds.high_material_usage_ratio,
                step=0.1,
                format="%.1fx",
                help="实际用量/标准用量超过此倍数时标记为异常",
            )

        with st.expander("评价风险阈值", expanded=True):
            st.session_state.thresholds.negative_review_ratio = st.slider(
                "差评率预警阈值",
                min_value=0.01,
                max_value=0.3,
                value=st.session_state.thresholds.negative_review_ratio,
                step=0.01,
                format="%.0f%%",
                help="差评率超过此值时触发预警",
            )
            st.session_state.thresholds.review_delay_hours = st.slider(
                "点评延迟阈值(小时)",
                min_value=1,
                max_value=168,
                value=st.session_state.thresholds.review_delay_hours,
                step=1,
                help="服务后超过此时间提交的点评标记为延迟",
            )

        with st.expander("回访逾期阈值", expanded=True):
            st.session_state.thresholds.overdue_visit_days = st.slider(
                "逾期未回访天数",
                min_value=7,
                max_value=90,
                value=st.session_state.thresholds.overdue_visit_days,
                step=1,
                help="超过此天数未到店的客户标记为逾期",
            )

        st.divider()

        st.markdown("### 🏪 门店筛选")
        stores = ["全部门店", "S001", "S002", "S003", "S004"]
        store_labels = {
            "全部门店": None,
            "S001": "S001 (旗舰店)",
            "S002": "S002 (分店A)",
            "S003": "S003 (分店B)",
            "S004": "S004 (体验店)",
        }
        selected = st.selectbox(
            "选择门店",
            options=stores,
            format_func=lambda x: store_labels[x] if x != "全部门店" else "全部门店",
            index=0,
        )
        st.session_state.selected_store = None if selected == "全部门店" else selected

        st.markdown("### 📅 时间范围")
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        date_range = st.date_input(
            "选择分析周期",
            value=(start_date, end_date),
            max_value=end_date,
        )
        if isinstance(date_range, tuple) and len(date_range) == 2:
            st.session_state.date_range = date_range

        st.divider()

        if st.button("🔄 刷新数据", type="primary", use_container_width=True):
            st.cache_data.clear()
            st.rerun()

        st.caption("业务人员可自行调整阈值，实时更新预警结果")


def render_metric_cards():
    """渲染核心指标卡片"""
    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range
    thresholds = st.session_state.thresholds

    metrics = get_core_metrics(store_id, date_from, date_to, thresholds)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(f"""
        <div class="metric-card metric-card-info">
            <div style="font-size:0.9rem;opacity:0.9;">💰 充值总额</div>
            <div style="font-size:1.8rem;font-weight:700;margin-top:0.3rem;">
                ¥{metrics["total_recharge"]:,.0f}
            </div>
            <div style="font-size:0.8rem;opacity:0.8;margin-top:0.2rem;">
                消费: ¥{metrics["total_consumption"]:,.0f}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        consumption_rate = metrics["consumption_rate"]
        threshold_rate = thresholds.low_course_consumption_rate * 100
        card_class = "metric-card-success" if consumption_rate >= threshold_rate else "metric-card-warning"
        st.markdown(f"""
        <div class="metric-card {card_class}">
            <div style="font-size:0.9rem;opacity:0.9;">🎯 整体消课率</div>
            <div style="font-size:1.8rem;font-weight:700;margin-top:0.3rem;">
                {consumption_rate:.1f}%
            </div>
            <div style="font-size:0.8rem;opacity:0.8;margin-top:0.2rem;">
                阈值: {threshold_rate:.0f}%
                {"✅ 达标" if consumption_rate >= threshold_rate else "⚠️ 偏低"}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        avg_rating = metrics["avg_rating"]
        card_class = "metric-card-success" if avg_rating >= 4.5 else "metric-card-warning" if avg_rating >= 4.0 else "metric-card"
        st.markdown(f"""
        <div class="metric-card {card_class}">
            <div style="font-size:0.9rem;opacity:0.9;">⭐ 平均评分</div>
            <div style="font-size:1.8rem;font-weight:700;margin-top:0.3rem;">
                {avg_rating:.2f}
            </div>
            <div style="font-size:0.8rem;opacity:0.8;margin-top:0.2rem;">
                共 {metrics["review_count"]} 条评价
                {" · " + str(metrics["delayed_reviews"]) + "条延迟" if metrics["delayed_reviews"] > 0 else ""}
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col4:
        pending = metrics["pending_alerts"]
        card_class = "metric-card-warning" if pending > 0 else "metric-card-success"
        st.markdown(f"""
        <div class="metric-card {card_class}">
            <div style="font-size:0.9rem;opacity:0.9;">🚨 待处理预警</div>
            <div style="font-size:1.8rem;font-weight:700;margin-top:0.3rem;">
                {pending}
            </div>
            <div style="font-size:0.8rem;opacity:0.8;margin-top:0.2rem;">
                {"请及时处理" if pending > 0 else "暂无待处理预警"}
            </div>
        </div>
        """, unsafe_allow_html=True)


def render_recharge_section():
    """渲染充值流水图表区"""
    st.markdown('<div class="section-title">💰 充值流水分析</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range
    thresholds = st.session_state.thresholds
    charts = get_chart_generator(thresholds)

    col1, col2 = st.columns([2, 1])

    with col1:
        granularity = st.selectbox(
            "时间粒度",
            options=["day", "week", "month"],
            format_func=lambda x: {"day": "按日", "week": "按周", "month": "按月"}[x],
            index=0,
            key="recharge_granularity",
            label_visibility="collapsed",
        )
        fig = charts.get_recharge_trend_chart(store_id, date_from, date_to, granularity)
        st.plotly_chart(fig, use_container_width=True, key="recharge_chart")

    with col2:
        fig = charts.get_payment_method_distribution(store_id, date_from, date_to)
        st.plotly_chart(fig, use_container_width=True, key="payment_chart")

    st.caption("💡 标注 ⚠️ 的日期存在延迟点评，分析趋势时请注意时间错位影响")


def render_review_section():
    """渲染评价标签图表区"""
    st.markdown('<div class="section-title">⭐ 客户评价分析</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range
    thresholds = st.session_state.thresholds
    charts = get_chart_generator(thresholds)

    col1, col2 = st.columns(2)

    with col1:
        fig = charts.get_rating_distribution_chart(store_id, date_from, date_to)
        st.plotly_chart(fig, use_container_width=True, key="rating_chart")

    with col2:
        fig = charts.get_review_tags_chart(store_id, date_from, date_to, top_n=15)
        st.plotly_chart(fig, use_container_width=True, key="tags_chart")

    st.markdown("##### ⏱️ 点评延迟分布")
    fig = charts.get_review_delay_timeline(store_id, date_from, date_to)
    st.plotly_chart(fig, use_container_width=True, key="delay_chart")


def render_course_section():
    """渲染项目卡项图表区"""
    st.markdown('<div class="section-title">🎯 项目卡项分析</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    thresholds = st.session_state.thresholds
    charts = get_chart_generator(thresholds)

    col1, col2 = st.columns([2, 1])

    with col1:
        top_n = st.slider("显示 TOP N 项目", min_value=5, max_value=20, value=10, key="course_top_n")
        fig = charts.get_course_consumption_chart(store_id, top_n=top_n)
        st.plotly_chart(fig, use_container_width=True, key="course_chart")

    with col2:
        fig = charts.get_course_consumption_rate_gauge(store_id)
        st.plotly_chart(fig, use_container_width=True, key="course_gauge")


def render_material_section():
    """渲染耗材异常图表区"""
    st.markdown('<div class="section-title">📦 耗材异常监测</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range
    thresholds = st.session_state.thresholds
    charts = get_chart_generator(thresholds)

    col1, col2 = st.columns([2, 1])

    with col1:
        fig = charts.get_material_abnormality_chart(store_id, date_from, date_to, top_n=10)
        st.plotly_chart(fig, use_container_width=True, key="material_chart")

    with col2:
        fig = charts.get_alert_summary_chart(store_id)
        st.plotly_chart(fig, use_container_width=True, key="alert_summary_chart")


def render_details_section():
    """渲染明细数据区（与图表分离）"""
    st.markdown('<div class="section-title">📋 明细数据</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range

    detail_tab = st.tabs(["⚠️ 预警明细", "📉 低消课客户", "📦 耗材异常", "⭐ 差评记录"])

    engine = get_risk_engine(st.session_state.thresholds)
    report_gen = ReviewReportGenerator(st.session_state.thresholds)

    with detail_tab[0]:
        alerts_df = engine.get_pending_alerts(store_id)
        if alerts_df.height > 0:
            st.dataframe(
                alerts_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
                column_config={
                    "alert_level": st.column_config.SelectboxColumn(
                        "预警等级",
                        options=["HIGH", "MEDIUM", "LOW"],
                    ),
                    "alert_type": "预警类型",
                    "alert_message": "预警内容",
                    "trigger_date": "触发时间",
                    "is_resolved": "已处理",
                },
            )
            st.caption(f"共 {alerts_df.height} 条待处理预警")
        else:
            st.info("暂无待处理预警")

    with detail_tab[1]:
        low_consumption_df = report_gen.get_consumer_risk_details(store_id)
        if low_consumption_df.height > 0:
            st.dataframe(
                low_consumption_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.caption(f"共 {low_consumption_df.height} 位客户消课率低于阈值")
        else:
            st.info("暂无低消课率客户")

    with detail_tab[2]:
        material_df = report_gen.get_material_abnormal_details(store_id, date_from, date_to)
        if material_df.height > 0:
            st.dataframe(
                material_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.caption(f"共 {material_df.height} 条耗材异常记录")
        else:
            st.info("暂无耗材异常记录")

    with detail_tab[3]:
        params = []
        sql = "SELECT * FROM reviews WHERE rating <= 3"
        if store_id:
            sql += " AND store_id = ?"
            params.append(store_id)
        if date_from:
            sql += " AND service_date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND service_date <= ?"
            params.append(date_to)
        sql += " ORDER BY service_date DESC LIMIT 100"
        reviews_df = duckdb_manager.query(sql, params)
        if reviews_df.height > 0:
            st.dataframe(
                reviews_df.to_pandas(),
                use_container_width=True,
                hide_index=True,
            )
            st.caption(f"共 {reviews_df.height} 条差评记录（最多显示100条）")
        else:
            st.info("暂无差评记录")


def render_dashboard_page():
    """渲染仪表盘主页面"""
    st.markdown('<div class="main-header">💄 美业门店顾客回访风险监测平台</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">实时监测消课率、耗材异常、客户评价和回访逾期风险</div>', unsafe_allow_html=True)

    render_metric_cards()

    st.markdown('<div class="tab-content">', unsafe_allow_html=True)

    tab1, tab2, tab3, tab4 = st.tabs([
        "💰 充值流水",
        "⭐ 评价标签",
        "🎯 项目卡项",
        "📦 耗材异常",
    ])

    with tab1:
        render_recharge_section()

    with tab2:
        render_review_section()

    with tab3:
        render_course_section()

    with tab4:
        render_material_section()

    st.markdown('</div>', unsafe_allow_html=True)

    st.divider()
    render_details_section()


def render_data_import_page():
    """渲染数据导入页面"""
    st.markdown('<div class="main-header">📥 数据导入</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">上传点评记录、库存表和收银流水，系统自动清洗和入库</div>', unsafe_allow_html=True)

    st.info("支持 CSV / Excel / Parquet / JSON 格式，上传后系统将自动执行：列名标准化 → 去重 → 口径匹配 → 数值/日期清洗 → 入库")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📝 点评记录")
        review_file = st.file_uploader(
            "上传点评记录文件",
            type=["csv", "xlsx", "xls", "parquet", "json"],
            key="review_upload",
        )
        if review_file is not None:
            try:
                raw_bytes = review_file.read()
                raw_df = DataCleaner.load_dataframe(raw_bytes, review_file.name)
                st.success(f"读取成功：{raw_df.height} 行数据")

                cleaned_df, stats = DataCleaner.clean_reviews(raw_df)
                st.info(f"清洗完成：{stats['original_rows']} → {stats['cleaned_rows']} 行，去重 {stats['removed_duplicates']} 条")

                if st.button("导入点评记录", type="primary", key="import_reviews"):
                    duckdb_manager.insert_dataframe("reviews", cleaned_df, if_exists="upsert")
                    engine = get_risk_engine(st.session_state.thresholds)
                    engine.mark_review_delays()
                    st.success(f"成功导入 {cleaned_df.height} 条点评记录")
                    st.cache_data.clear()

                with st.expander("预览清洗后数据"):
                    st.dataframe(cleaned_df.head(20).to_pandas(), use_container_width=True, hide_index=True)
            except Exception as e:
                st.error(f"处理失败：{e}")

    with col2:
        st.subheader("🏪 库存表")
        inventory_file = st.file_uploader(
            "上传库存表文件",
            type=["csv", "xlsx", "xls", "parquet", "json"],
            key="inventory_upload",
        )
        if inventory_file is not None:
            try:
                raw_bytes = inventory_file.read()
                raw_df = DataCleaner.load_dataframe(raw_bytes, inventory_file.name)
                st.success(f"读取成功：{raw_df.height} 行数据")

                cleaned_df, stats = DataCleaner.clean_inventory(raw_df)
                st.info(f"清洗完成：{stats['original_rows']} → {stats['cleaned_rows']} 行，去重 {stats['removed_duplicates']} 条")

                if st.button("导入库存表", type="primary", key="import_inventory"):
                    duckdb_manager.insert_dataframe("inventory", cleaned_df, if_exists="upsert")
                    st.success(f"成功导入 {cleaned_df.height} 条库存记录")
                    st.cache_data.clear()

                with st.expander("预览清洗后数据"):
                    st.dataframe(cleaned_df.head(20).to_pandas(), use_container_width=True, hide_index=True)
            except Exception as e:
                st.error(f"处理失败：{e}")

    st.divider()

    col3, col4 = st.columns(2)

    with col3:
        st.subheader("💳 收银流水")
        cashier_file = st.file_uploader(
            "上传收银流水文件",
            type=["csv", "xlsx", "xls", "parquet", "json"],
            key="cashier_upload",
        )
        if cashier_file is not None:
            try:
                raw_bytes = cashier_file.read()
                raw_df = DataCleaner.load_dataframe(raw_bytes, cashier_file.name)
                st.success(f"读取成功：{raw_df.height} 行数据")

                cleaned_df, stats = DataCleaner.clean_cashier_transactions(raw_df)
                st.info(f"清洗完成：{stats['original_rows']} → {stats['cleaned_rows']} 行，去重 {stats['removed_duplicates']} 条")

                if st.button("导入收银流水", type="primary", key="import_cashier"):
                    duckdb_manager.insert_dataframe("cashier_transactions", cleaned_df, if_exists="upsert")
                    st.success(f"成功导入 {cleaned_df.height} 条收银流水记录")
                    st.cache_data.clear()

                with st.expander("预览清洗后数据"):
                    st.dataframe(cleaned_df.head(20).to_pandas(), use_container_width=True, hide_index=True)
            except Exception as e:
                st.error(f"处理失败：{e}")

    with col4:
        st.subheader("🎫 项目卡项")
        course_file = st.file_uploader(
            "上传项目卡项文件",
            type=["csv", "xlsx", "xls", "parquet", "json"],
            key="course_upload",
        )
        if course_file is not None:
            try:
                raw_bytes = course_file.read()
                raw_df = DataCleaner.load_dataframe(raw_bytes, course_file.name)
                st.success(f"读取成功：{raw_df.height} 行数据")

                cleaned_df, stats = DataCleaner.clean_course_items(raw_df)
                st.info(f"清洗完成：{stats['original_rows']} → {stats['cleaned_rows']} 行，去重 {stats['removed_duplicates']} 条")

                if st.button("导入项目卡项", type="primary", key="import_course"):
                    duckdb_manager.insert_dataframe("course_items", cleaned_df, if_exists="upsert")
                    st.success(f"成功导入 {cleaned_df.height} 条卡项记录")
                    st.cache_data.clear()

                with st.expander("预览清洗后数据"):
                    st.dataframe(cleaned_df.head(20).to_pandas(), use_container_width=True, hide_index=True)
            except Exception as e:
                st.error(f"处理失败：{e}")

    st.divider()
    st.subheader("📊 数据概览")
    tables = [
        ("reviews", "点评记录"),
        ("inventory", "库存表"),
        ("cashier_transactions", "收银流水"),
        ("course_items", "项目卡项"),
        ("material_usage", "耗材使用"),
        ("risk_alerts", "风险预警"),
    ]
    cols = st.columns(3)
    for i, (table_name, label) in enumerate(tables):
        with cols[i % 3]:
            count = duckdb_manager.get_table_row_count(table_name)
            st.metric(label, f"{count:,} 条")


def render_review_report_page():
    """渲染复盘报告页面"""
    st.markdown('<div class="main-header">📋 复盘报告</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">围绕消课率和耗材异常，自动生成可导出的复盘材料</div>', unsafe_allow_html=True)

    store_id = st.session_state.selected_store
    date_from, date_to = st.session_state.date_range

    report_gen = ReviewReportGenerator(st.session_state.thresholds)

    col1, col2 = st.columns([1, 3])

    with col1:
        st.subheader("📝 报告配置")
        period_days = st.slider("复盘周期(天)", min_value=7, max_value=90, value=30)
        report_store = st.selectbox(
            "门店",
            options=["全部门店", "S001", "S002", "S003", "S004"],
            index=0,
        )
        gen_store_id = None if report_store == "全部门店" else report_store

        if st.button("生成复盘报告", type="primary", use_container_width=True):
            with st.spinner("正在生成复盘报告..."):
                report = report_gen.generate_report(
                    store_id=gen_store_id,
                    period_days=period_days,
                )
                st.session_state.current_report = report
            st.success("报告生成成功！")

    with col2:
        if "current_report" in st.session_state:
            report = st.session_state.current_report

            st.markdown(f"### {report.title}")
            st.markdown(f"**报告ID**: {report.report_id} | **生成时间**: {report.generated_at.strftime('%Y-%m-%d %H:%M:%S')}")
            st.markdown(f"**整体风险等级**: :red[**HIGH**]" if report.overall_risk_level == "HIGH"
                        else f"**整体风险等级**: :orange[**MEDIUM**]" if report.overall_risk_level == "MEDIUM"
                        else f"**整体风险等级**: :green[**LOW**]")

            st.divider()
            st.markdown("#### 📋 执行摘要")
            st.write(report.executive_summary)

            st.divider()

            for section in report.sections:
                with st.expander(section.title, expanded=True):
                    st.markdown(section.content)
                    if section.data_summary:
                        st.markdown("**📊 关键数据**")
                        summary_df = pl.DataFrame([
                            {"指标": k, "数值": str(v)}
                            for k, v in section.data_summary.items()
                        ])
                        st.dataframe(summary_df.to_pandas(), use_container_width=True, hide_index=True)
                    if section.recommendations:
                        st.markdown("**💡 改进建议**")
                        for i, rec in enumerate(section.recommendations, 1):
                            st.markdown(f"{i}. {rec}")

            st.divider()
            st.subheader("📥 导出报告")

            col_a, col_b = st.columns(2)
            with col_a:
                md_content = report.to_markdown()
                st.download_button(
                    label="下载 Markdown 格式",
                    data=md_content,
                    file_name=f"复盘报告_{report.report_id}.md",
                    mime="text/markdown",
                    use_container_width=True,
                )
            with col_b:
                csv_bytes = report.to_csv_bytes()
                st.download_button(
                    label="下载 CSV 数据",
                    data=csv_bytes,
                    file_name=f"复盘数据_{report.report_id}.csv",
                    mime="text/csv",
                    use_container_width=True,
                )
        else:
            st.info("👈 请在左侧配置参数并点击生成按钮")

        st.divider()
        st.subheader("🔍 耗材异常深度复盘")

        material_df = report_gen.get_material_abnormal_details(store_id, date_from, date_to)
        if material_df.height > 0:
            st.warning(f"检测到 {material_df.height} 条耗材异常记录，以下围绕消课率进行关联复盘")

            st.markdown("""
            **复盘思路**：
            1. 耗材异常是否集中在特定技师或特定项目上？
            2. 异常耗材对应的项目卡项消课率是否偏低？
            3. 是否存在因为耗材浪费导致项目体验下降，进而影响消课意愿的情况？
            """)

            tech_group = material_df.group_by("technician_name").agg(
                pl.count().alias("异常次数"),
                pl.col("ratio").mean().round(2).alias("平均超标倍数"),
            ).sort("异常次数", descending=True).head(5)

            st.markdown("##### 👨‍⚕️ 技师异常排名 TOP 5")
            st.dataframe(tech_group.to_pandas(), use_container_width=True, hide_index=True)

            course_sql = """
                SELECT ci.course_name,
                       SUM(ci.total_sessions) as total,
                       SUM(ci.used_sessions) as used,
                       ROUND(SUM(ci.used_sessions) * 100.0 / NULLIF(SUM(ci.total_sessions), 0), 1) as rate
                FROM course_items ci
            """
            params = []
            if store_id:
                course_sql += " WHERE ci.store_id = ?"
                params.append(store_id)
            course_sql += " GROUP BY ci.course_name ORDER BY rate ASC LIMIT 10"
            low_courses = duckdb_manager.query(course_sql, params)

            st.markdown("##### 📉 消课率最低的项目 TOP 10")
            st.dataframe(low_courses.to_pandas(), use_container_width=True, hide_index=True)

            st.info("💡 建议：将耗材异常高的项目与低消课率项目交叉分析，排查是否存在服务质量问题")
        else:
            st.success("暂无耗材异常记录，继续保持！")


def main():
    init_session_state()
    render_sidebar()

    if st.session_state.page == "dashboard":
        render_dashboard_page()
    elif st.session_state.page == "data_import":
        render_data_import_page()
    elif st.session_state.page == "review_report":
        render_review_report_page()


if __name__ == "__main__":
    main()
