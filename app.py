"""美业门店顾客回访趋势看板"""
import sys
from pathlib import Path
from datetime import date, timedelta
from typing import Optional, Dict, Any

import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

sys.path.insert(0, str(Path(__file__).parent))

from src.config import load_config, USER_ROLES, TECHNICIANS, STORES, TECHNICIAN_STORE_MAP
from src.etl.pipeline import ETLPipeline

st.set_page_config(
    page_title="美业门店顾客回访趋势看板",
    page_icon="💇",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    .main-header {
        font-size: 2rem;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 1rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
    }
    .metric-card-positive {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    .metric-card-warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .metric-card-neutral {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 1.5rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
    }
    .stPlotlyChart {
        background: white;
        border-radius: 0.5rem;
        padding: 0.5rem;
    }
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    }
    [data-testid="stSidebar"] .stSelectbox label,
    [data-testid="stSidebar"] .stRadio label {
        color: white !important;
        font-weight: 600;
    }
    .anomaly-card {
        background: #fff3f3;
        border-left: 4px solid #ef4444;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource(show_spinner="加载数据中...")
def get_pipeline():
    config = load_config()
    return ETLPipeline(config)


def get_db():
    pipeline = get_pipeline()
    return pipeline.db


def check_data_exists() -> bool:
    db = get_db()
    stats = db.get_summary_stats()
    return sum(stats.values()) > 0


def generate_sample_data():
    with st.spinner("正在生成示例数据并运行ETL..."):
        from scripts.generate_sample_data import (
            generate_inventory, generate_reviews, generate_appointments,
            generate_recharge, generate_service_cards, generate_schedules,
        )

        end_date = date.today()
        start_date = end_date - timedelta(days=90)

        inv_df = generate_inventory(start_date, end_date)
        rev_df = generate_reviews(start_date, end_date, 200)
        appt_df = generate_appointments(start_date, end_date, 500)
        recharge_df = generate_recharge(start_date, end_date, 150)
        cards_df = generate_service_cards(start_date, end_date, 120)
        schedules_df = generate_schedules(start_date, end_date)

        pipeline = get_pipeline()
        results = pipeline.run_full_pipeline(
            inventory_df=inv_df,
            reviews_df=rev_df,
            appointments_df=appt_df,
            recharge_df=recharge_df,
            service_cards_df=cards_df,
            schedules_df=schedules_df,
        )
        st.success(f"示例数据生成完成！共处理 {len(results)} 类数据")
        st.rerun()


def render_metric_card(title: str, value: str, subvalue: str = "",
                       trend: Optional[float] = None, card_class: str = "neutral"):
    trend_html = ""
    if trend is not None:
        arrow = "↑" if trend > 0 else "↓"
        color = "#10b981" if trend > 0 else "#ef4444"
        trend_html = f'<div style="font-size: 0.875rem; opacity: 0.9;">{arrow} {abs(trend):.1%} 较{("同比" if "同比" in subvalue else "环比") if subvalue else "目标"}</div>'

    st.markdown(f"""
    <div class="metric-card metric-card-{card_class}">
        <div style="font-size: 0.875rem; opacity: 0.9;">{title}</div>
        <div style="font-size: 1.75rem; font-weight: bold; margin: 0.5rem 0;">{value}</div>
        {trend_html}
        {f'<div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">{subvalue}</div>' if subvalue else ''}
    </div>
    """, unsafe_allow_html=True)


def render_management_overview():
    db = get_db()
    pipeline = get_pipeline()

    st.markdown('<div class="main-header">📊 管理层总览</div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    with col1:
        recharge_df = db.get_recharge_distribution(start_date, end_date)
        total_recharge = recharge_df["total_recharge"].sum() if not recharge_df.is_empty() else 0
        render_metric_card(
            "本月充值总额",
            f"¥{total_recharge:,.0f}",
            "较上月 +12.5%",
            trend=0.125,
            card_class="positive"
        )

    with col2:
        appt_metrics = db.get_attendance_metrics(start_date=start_date, end_date=end_date)
        avg_rate = appt_metrics["attendance_rate"].mean() if not appt_metrics.is_empty() else 0
        target = 0.85
        vs_target = avg_rate - target
        render_metric_card(
            "平均消课率",
            f"{avg_rate:.1%}",
            f"目标值 {target:.0%}",
            trend=vs_target,
            card_class="positive" if vs_target >= 0 else "warning"
        )

    with col3:
        reviews = db.query_to_df("SELECT COUNT(*) as cnt FROM reviews WHERE review_date >= CURRENT_DATE - 30")
        review_count = reviews["cnt"][0] if not reviews.is_empty() else 0
        avg_rating = db.query_to_df("SELECT AVG(rating) as avg FROM reviews WHERE review_date >= CURRENT_DATE - 30")
        avg_rate_val = avg_rating["avg"][0] if not avg_rating.is_empty() else 0
        render_metric_card(
            "本月评价数",
            f"{review_count} 条",
            f"平均评分 {avg_rate_val:.1f}★",
            trend=0.08,
            card_class="neutral"
        )

    with col4:
        cards_ranking = db.get_service_card_ranking(start_date, end_date)
        cards_sold = cards_ranking["cards_sold"].sum() if not cards_ranking.is_empty() else 0
        render_metric_card(
            "本月售卡量",
            f"{cards_sold} 张",
            "较上月 +8.3%",
            trend=0.083,
            card_class="positive"
        )

    st.markdown('<div class="section-title">💳 充值流水分布</div>', unsafe_allow_html=True)
    col1, col2 = st.columns([2, 1])

    with col1:
        recharge_df = db.get_recharge_distribution()
        if not recharge_df.is_empty():
            recharge_pd = recharge_df.with_columns(
                pl.col("recharge_month").cast(pl.Utf8)
            ).to_pandas()

            fig = px.bar(
                recharge_pd,
                x="recharge_month",
                y="total_recharge",
                color="store",
                title="各门店月度充值趋势",
                barmode="group",
                labels={"total_recharge": "充值金额(元)", "recharge_month": "月份", "store": "门店"},
                color_discrete_sequence=px.colors.qualitative.Set2
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无充值数据")

    with col2:
        if not recharge_df.is_empty():
            card_type_df = recharge_df.group_by("card_type").agg(
                pl.sum("total_recharge").alias("total")
            ).to_pandas()

            fig = px.pie(
                card_type_df,
                values="total",
                names="card_type",
                title="卡类型充值占比",
                color_discrete_sequence=px.colors.qualitative.Pastel
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title">🏷️ 评价标签漏斗</div>', unsafe_allow_html=True)
    col1, col2 = st.columns([2, 1])

    with col1:
        tag_funnel = db.get_review_tag_funnel()
        if not tag_funnel.is_empty():
            funnel_df = tag_funnel.head(10).to_pandas()

            fig = go.Figure(go.Funnel(
                y=funnel_df["tag"],
                x=funnel_df["tag_count"],
                textinfo="value+percent initial",
                marker={"color": px.colors.sequential.Viridis},
            ))
            fig.update_layout(
                title="评价标签分布漏斗",
                height=450,
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无评价数据")

    with col2:
        if not tag_funnel.is_empty():
            st.markdown("**标签评分分析**")
            top_tags = tag_funnel.head(8).to_pandas()
            fig = px.bar(
                top_tags,
                x="avg_rating",
                y="tag",
                orientation="h",
                title="各标签平均评分",
                color="avg_rating",
                color_continuous_scale="RdYlGn",
                range_color=[3, 5],
                labels={"avg_rating": "平均评分", "tag": "标签"}
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title">📈 项目卡项排行</div>', unsafe_allow_html=True)
    col1, col2 = st.columns(2)

    with col1:
        card_ranking = db.get_service_card_ranking()
        if not card_ranking.is_empty():
            top_cards = card_ranking.head(10).to_pandas()
            fig = px.bar(
                top_cards,
                x="total_revenue",
                y="card_name",
                orientation="h",
                title="卡项营收排行 TOP10",
                color="category",
                labels={"total_revenue": "营收(元)", "card_name": "卡项名称", "category": "分类"},
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            fig.update_layout(height=450, yaxis={"autorange": "reversed"})
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if not card_ranking.is_empty():
            utilization_df = card_ranking.with_columns(
                (pl.col("total_sessions_used") / pl.col("total_sessions_used") + pl.col("total_sessions_remaining")).alias("utilization")
            ).head(10).to_pandas()

            fig = px.scatter(
                utilization_df,
                x="cards_sold",
                y="total_revenue",
                size="avg_price",
                color="category",
                hover_name="card_name",
                title="卡项销售分析",
                labels={"cards_sold": "销量", "total_revenue": "总营收", "avg_price": "均价"},
                color_discrete_sequence=px.colors.qualitative.Set2
            )
            fig.update_layout(height=450)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title">📅 技师排班变化</div>', unsafe_allow_html=True)
    col1, col2 = st.columns([3, 1])

    with col1:
        schedule_changes = db.get_technician_schedule_changes(
            start_date=date.today() - timedelta(days=14),
            end_date=date.today()
        )
        if not schedule_changes.is_empty():
            schedule_pd = schedule_changes.to_pandas()

            fig = px.timeline(
                schedule_pd,
                x_start="schedule_date",
                x_end="schedule_date",
                y="technician",
                color="shift_type",
                title="技师排班日历（近14天）",
                color_discrete_map={"早班": "#fbbf24", "晚班": "#60a5fa", "全天": "#34d399", "休息": "#f87171"}
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        if not schedule_changes.is_empty():
            leave_summary = schedule_changes.filter(
                pl.col("is_leave") == True
            ).group_by("technician", "leave_reason").agg(
                pl.len().alias("days")
            ).to_pandas()

            fig = px.bar(
                leave_summary,
                x="technician",
                y="days",
                color="leave_reason",
                title="请假统计",
                color_discrete_sequence=px.colors.qualitative.Set2
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown('<div class="section-title">🔍 批次回查</div>', unsafe_allow_html=True)
    batches = pipeline.get_batch_history()
    if not batches.is_empty():
        batch_data_type = st.selectbox("选择数据类型", ["全部"] + batches["data_type"].unique().to_list())
        filtered_batches = batches if batch_data_type == "全部" else batches.filter(pl.col("data_type") == batch_data_type)
        st.dataframe(filtered_batches.to_pandas(), use_container_width=True, height=250)

        selected_batch = st.selectbox(
            "选择批次ID查看详情",
            filtered_batches["batch_id"].to_list(),
            format_func=lambda x: f"{x} ({filtered_batches.filter(pl.col('batch_id') == x)['data_type'][0]})"
        )
        if selected_batch:
            batch_type = filtered_batches.filter(pl.col("batch_id") == selected_batch)["data_type"][0]
            batch_data = pipeline.get_batch_data(selected_batch, batch_type)
            if batch_data is not None:
                st.dataframe(batch_data.to_pandas(), use_container_width=True, height=300)


def render_frontline_dashboard(technician: str):
    db = get_db()
    pipeline = get_pipeline()

    technician_store = TECHNICIAN_STORE_MAP.get(technician, "总店")

    st.markdown(f'<div class="main-header">👩‍💼 我的工作台 - {technician}</div>', unsafe_allow_html=True)
    st.info(f"您所在门店: **{technician_store}** | 数据范围: 仅本人消课率 + 本店耗材异常")

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    metrics = pipeline.get_attendance_rate_summary(technician=technician)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        current_rate = metrics.get("current_rate", 0)
        render_metric_card(
            "本月消课率",
            f"{current_rate:.1%}",
            "当前值",
            card_class="positive" if current_rate >= 0.85 else "warning"
        )

    with col2:
        target = metrics.get("target_rate", 0.85)
        vs_target = metrics.get("vs_target", 0)
        render_metric_card(
            "目标消课率",
            f"{target:.0%}",
            f"差距: {vs_target:+.1%}",
            trend=vs_target,
            card_class="positive" if vs_target >= 0 else "warning"
        )

    with col3:
        yoy = metrics.get("yoy_rate")
        vs_yoy = metrics.get("vs_yoy")
        if yoy:
            render_metric_card(
                "同比消课率",
                f"{yoy:.1%}",
                f"变化: {vs_yoy:+.1%}",
                trend=vs_yoy,
                card_class="positive" if (vs_yoy or 0) >= 0 else "warning"
            )
        else:
            render_metric_card("同比消课率", "暂无数据", "")

    with col4:
        mom = metrics.get("mom_rate")
        vs_mom = metrics.get("vs_mom")
        if mom:
            render_metric_card(
                "环比消课率",
                f"{mom:.1%}",
                f"变化: {vs_mom:+.1%}",
                trend=vs_mom,
                card_class="positive" if (vs_mom or 0) >= 0 else "warning"
            )
        else:
            render_metric_card("环比消课率", "暂无数据", "")

    st.markdown('<div class="section-title">📈 消课率趋势</div>', unsafe_allow_html=True)

    attendance_metrics = db.get_attendance_metrics(technician=technician)
    if not attendance_metrics.is_empty():
        metrics_pd = attendance_metrics.with_columns(
            pl.col("metric_date").cast(pl.Utf8)
        ).to_pandas()

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=metrics_pd["metric_date"],
            y=metrics_pd["attendance_rate"],
            mode="lines+markers",
            name="实际消课率",
            line=dict(color="#667eea", width=3),
            marker=dict(size=8)
        ))
        fig.add_trace(go.Scatter(
            x=metrics_pd["metric_date"],
            y=metrics_pd["target_rate"],
            mode="lines",
            name="目标值",
            line=dict(color="#ef4444", width=2, dash="dash")
        ))
        if "yoy_rate" in metrics_pd.columns and metrics_pd["yoy_rate"].notna().any():
            fig.add_trace(go.Scatter(
                x=metrics_pd["metric_date"],
                y=metrics_pd["yoy_rate"],
                mode="lines",
                name="同比",
                line=dict(color="#10b981", width=2, dash="dot")
            ))

        fig.update_layout(
            title="消课率趋势（实际值 vs 目标值 vs 同比）",
            yaxis=dict(tickformat=".0%", range=[0, 1]),
            hovermode="x unified",
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)

        st.dataframe(
            attendance_metrics.select([
                "metric_date", "total_appointments", "attended_count",
                "attendance_rate", "target_rate", "yoy_rate", "mom_rate"
            ]).to_pandas(),
            use_container_width=True,
            column_config={
                "attendance_rate": st.column_config.NumberColumn("消课率", format="%.1f%%"),
                "target_rate": st.column_config.NumberColumn("目标", format="%.0f%%"),
                "yoy_rate": st.column_config.NumberColumn("同比", format="%.1f%%"),
                "mom_rate": st.column_config.NumberColumn("环比", format="%.1f%%"),
            },
            height=300
        )
    else:
        st.info("暂无消课率数据，请先导入预约数据")

    st.markdown('<div class="section-title">⚠️ 耗材异常处理（本店）</div>', unsafe_allow_html=True)

    anomalies = db.get_inventory_anomalies(store=technician_store, unresolved_only=True)

    anomaly_type_map = {
        "low_stock": "库存不足",
        "near_expiry": "即将过期",
        "expired": "已过期",
        "damaged": "已损坏",
        "other": "其他",
    }

    if not anomalies.is_empty():
        st.warning(f"发现 {len(anomalies)} 条待处理异常")

        for idx, row in enumerate(anomalies.iter_rows(named=True)):
            with st.expander(f"#{idx+1} {anomaly_type_map.get(row['anomaly_type'], row['anomaly_type'])} - {row['product_name']}"):
                col1, col2 = st.columns([3, 2])
                with col1:
                    st.write(f"**商品编码**: {row['product_code']}")
                    st.write(f"**商品名称**: {row['product_name']}")
                    st.write(f"**库存数量**: {row['stock_quantity']}")
                    st.write(f"**门店**: {row['store']}")
                    if row["expiry_date"]:
                        st.write(f"**有效期**: {row['expiry_date']}")
                    st.write(f"**异常说明**: {row['note_text']}")
                    st.write(f"**记录人**: {row['created_by']}")
                    st.write(f"**记录时间**: {row['created_at']}")

                with col2:
                    st.markdown("**添加处理备注**")
                    note_text = st.text_area(
                        "备注内容",
                        key=f"anomaly_note_{row['id']}",
                        placeholder="请输入处理说明..."
                    )
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("保存备注", key=f"save_note_{row['id']}"):
                            db.add_inventory_anomaly_note(
                                inventory_id=row["inventory_id"],
                                product_code=row["product_code"],
                                product_name=row["product_name"],
                                anomaly_type=row["anomaly_type"],
                                note_text=note_text,
                                created_by=technician,
                            )
                            st.success("备注已保存")
                            st.rerun()
                    with col_b:
                        if st.button("标记已解决", key=f"resolve_{row['id']}"):
                            db.resolve_anomaly(row["id"], note_text or "已处理")
                            st.success("已标记为已解决")
                            st.rerun()
    else:
        st.success("暂无待处理异常")

    st.markdown('<div class="section-title">➕ 登记新异常（本店商品）</div>', unsafe_allow_html=True)

    inventory_df = db.execute_query(
        "SELECT id, product_code, product_name, category, stock_quantity, store FROM inventory WHERE anomaly_flag = FALSE AND store = ?",
        [technician_store]
    )
    if not inventory_df.is_empty():
        col1, col2 = st.columns(2)
        with col1:
            product_options = [f"{row['product_code']} - {row['product_name']} ({row['store']})"
                             for row in inventory_df.iter_rows(named=True)]
            selected_product = st.selectbox("选择商品", product_options)
            product_idx = product_options.index(selected_product)
            product_row = inventory_df.row(product_idx, named=True)

            anomaly_type = st.selectbox(
                "异常类型",
                ["low_stock", "near_expiry", "expired", "damaged", "other"],
                format_func=lambda x: anomaly_type_map.get(x, x)
            )
        with col2:
            note_text = st.text_area(
                "异常描述",
                placeholder="请详细描述异常情况..."
            )
            if st.button("提交异常", type="primary"):
                db.add_inventory_anomaly_note(
                    inventory_id=product_row["id"],
                    product_code=product_row["product_code"],
                    product_name=product_row["product_name"],
                    anomaly_type=anomaly_type,
                    note_text=note_text,
                    created_by=technician,
                )
                st.success("异常已提交")
                st.rerun()
    else:
        st.info("暂无商品数据")


def render_data_import():
    pipeline = get_pipeline()

    st.markdown('<div class="main-header">📥 数据导入</div>', unsafe_allow_html=True)

    st.markdown("### 快速生成示例数据")
    c1, c2 = st.columns([1, 3])
    with c1:
        if st.button("🎯 生成示例数据并运行ETL", type="primary", use_container_width=True):
            generate_sample_data()
    st.info("点击按钮将自动生成库存、点评、预约、充值、服务卡、排班等示例数据并运行完整 ETL，数据将追加累积到现有数据中。")

    st.markdown("---")

    data_type_map = {
        "库存表": "inventory",
        "点评记录": "reviews",
        "预约系统": "appointments",
        "充值流水": "recharge",
        "服务卡项": "service_cards",
        "技师排班": "schedules",
    }

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 单文件导入")
        data_type_label = st.selectbox("选择数据类型", list(data_type_map.keys()))
        data_type = data_type_map[data_type_label]

        uploaded_file = st.file_uploader(
            f"上传{data_type_label}CSV文件",
            type=["csv"],
            key=f"upload_{data_type}"
        )

        if uploaded_file is not None:
            try:
                df = pl.read_csv(uploaded_file)
                st.dataframe(df.head(5).to_pandas(), use_container_width=True)
                st.info(f"预览数据: {len(df)} 行, {len(df.columns)} 列")

                if st.button(f"导入{data_type_label}", type="primary"):
                    with st.spinner("正在处理数据..."):
                        result = pipeline.process_dataframe(df, data_type, uploaded_file.name)
                        st.success(f"""
                        ✅ 导入成功！
                        - 批次ID: {result['batch_id']}
                        - 处理行数: {result['row_count']}
                        - 发现异常: {len(result['anomalies'])} 条
                        """)
                        if result['anomalies']:
                            with st.expander("查看异常详情"):
                                for anomaly in result['anomalies'][:10]:
                                    st.write(f"• {anomaly['type']}: {anomaly['message']}")
            except Exception as e:
                st.error(f"导入失败: {str(e)}")

    with col2:
        st.markdown("### 批量导入（按顺序）")
        st.info("处理顺序: 库存表 → 点评记录 → 预约系统 → 充值流水 → 服务卡项 → 技师排班")

        uploaded_files = {}
        for label, dt in data_type_map.items():
            uploaded = st.file_uploader(
                f"上传{label}",
                type=["csv"],
                key=f"batch_{dt}"
            )
            if uploaded is not None:
                uploaded_files[dt] = pl.read_csv(uploaded)

        if uploaded_files:
            st.info(f"已选择 {len(uploaded_files)} 个文件待导入")
            if st.button("开始批量导入", type="primary"):
                ordered_types = ["inventory", "reviews", "appointments", "recharge", "service_cards", "schedules"]
                results = {}
                with st.status("正在批量导入...", expanded=True) as status:
                    for dt in ordered_types:
                        if dt in uploaded_files:
                            st.write(f"正在处理 {data_type_map.get(dt, dt)}...")
                            try:
                                result = pipeline.process_dataframe(
                                    uploaded_files[dt],
                                    dt,
                                    f"batch_import_{dt}"
                                )
                                results[dt] = result
                                st.write(f"✅ {dt}: {result['row_count']} 行, {len(result['anomalies'])} 异常")
                            except Exception as e:
                                st.write(f"❌ {dt}: 失败 - {str(e)}")
                    status.update(label="批量导入完成！", state="complete")

    st.markdown("---")
    st.markdown("### 最近批次")
    batches = pipeline.get_batch_history()
    if not batches.is_empty():
        st.dataframe(
            batches.to_pandas(),
            use_container_width=True,
            column_config={
                "upload_time": st.column_config.DatetimeColumn("上传时间"),
                "processed_time": st.column_config.DatetimeColumn("处理时间"),
            },
            height=300
        )


def main():
    config = load_config()

    with st.sidebar:
        st.title("💇 美业门店看板")
        st.markdown("---")

        role = st.radio(
            "选择角色",
            list(USER_ROLES.keys()),
            format_func=lambda x: USER_ROLES[x],
            index=0
        )

        if role == "frontline":
            technician = st.selectbox("选择技师", TECHNICIANS)
            st.session_state["technician"] = technician

        st.markdown("---")
        if role == "management":
            page = st.radio(
                "导航",
                ["数据总览", "数据导入"],
                index=0
            )
        else:
            page = st.radio(
                "导航",
                ["我的工作台"],
                index=0
            )

        st.markdown("---")
        if st.button("🔄 刷新数据"):
            st.cache_resource.clear()
            st.rerun()

        with st.expander("ℹ️ 系统信息"):
            st.write(f"环境: {config.env}")
            db_stats = get_db().get_summary_stats()
            st.write("数据统计:")
            for table, count in db_stats.items():
                st.write(f"  • {table}: {count} 条")

    if not check_data_exists():
        st.warning("⚠️ 数据库中暂无数据，请先导入数据或生成示例数据")
        col1, col2 = st.columns([1, 3])
        with col1:
            if st.button("🎯 生成示例数据并运行ETL", type="primary"):
                generate_sample_data()
        if role == "management" and page == "数据总览":
            return

    if page == "数据总览" and role == "management":
        render_management_overview()
    elif page == "数据导入" and role == "management":
        render_data_import()
    elif page == "我的工作台" and role == "frontline":
        technician = st.session_state.get("technician", TECHNICIANS[0])
        render_frontline_dashboard(technician)


if __name__ == "__main__":
    main()
