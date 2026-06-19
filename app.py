import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, datetime, timedelta
import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository
from src.business_logic.sales_analysis import SalesAnalyzer
from src.business_logic.conversion_rate import ConversionRateCalculator
from src.business_logic.oversell_detector import OversellDetector
from src.utils.data_generator import MockDataGenerator

st.set_page_config(
    page_title="旅游民宿套餐售卖趋势看板",
    page_icon="🏨",
    layout="wide",
    initial_sidebar_state="expanded",
)

PACKAGE_NAMES = {
    "PKG001": "山景豪华套房",
    "PKG002": "海景双床房",
    "PKG003": "家庭亲子房",
    "PKG004": "蜜月情侣房",
    "PKG005": "团建聚会别墅",
}


@st.cache_resource(show_spinner="正在初始化数据仓库...")
def init_repository():
    config = load_config()
    repo = DataRepository(config, use_minio=False)
    return repo


@st.cache_resource(show_spinner="正在初始化业务逻辑...")
def init_services(repo):
    return {
        "sales": SalesAnalyzer(repo),
        "conversion": ConversionRateCalculator(repo),
        "oversell": OversellDetector(repo),
    }


def init_database():
    repo = init_repository()
    config = load_config()

    if not os.path.exists(config.duckdb.db_path) or st.session_state.get("force_regenerate", False):
        st.info("正在生成演示数据...")
        generator = MockDataGenerator(repo)
        end_date = date.today()
        start_date = end_date - timedelta(days=180)
        generator.generate_all_data(start_date, end_date, order_count=800)
        st.success("演示数据生成完成！")
        st.session_state["force_regenerate"] = False
        st.rerun()

    return repo


def format_number(num):
    if num is None:
        return "0"
    if isinstance(num, float):
        return f"{num:,.2f}"
    return f"{num:,}"


def format_currency(num):
    if num is None:
        return "¥0"
    return f"¥{format_number(num)}"


def format_percent(num):
    if num is None:
        return "0%"
    return f"{num:.2f}%"


def get_delta_color(value):
    if value is None:
        return "off"
    if value > 0:
        return "normal"
    elif value < 0:
        return "inverse"
    return "off"


def render_sidebar():
    st.sidebar.header("🏨 旅游民宿套餐售卖趋势看板")
    st.sidebar.markdown("---")

    st.sidebar.subheader("📅 时间范围")
    col1, col2 = st.sidebar.columns(2)
    with col1:
        start_date = st.date_input(
            "开始日期",
            value=date.today() - timedelta(days=30),
            key="start_date",
        )
    with col2:
        end_date = st.date_input(
            "结束日期",
            value=date.today(),
            key="end_date",
        )

    st.sidebar.markdown("---")
    st.sidebar.subheader("🎯 套餐筛选")
    all_packages = ["全部"] + list(PACKAGE_NAMES.keys())
    selected_package = st.sidebar.selectbox(
        "选择套餐",
        options=all_packages,
        format_func=lambda x: f"{x} - {PACKAGE_NAMES.get(x, '')}" if x != "全部" else "全部套餐",
        key="package_filter",
    )

    st.sidebar.markdown("---")
    st.sidebar.subheader("📊 转化率口径")
    conversion_versions = services["conversion"].repository.get_conversion_rate_versions(is_active=True)
    if not conversion_versions.is_empty():
        version_options = conversion_versions["version_code"].to_list()
        version_labels = [
            f"{row['version_code']} - {row['version_name']}"
            for row in conversion_versions.iter_rows(named=True)
        ]
        selected_version = st.sidebar.selectbox(
            "选择口径版本",
            options=version_options,
            format_func=lambda x: next(
                (label for label in version_labels if label.startswith(x)), x
            ),
            key="conversion_version",
        )

        with st.sidebar.expander("📖 口径说明"):
            desc = services["conversion"].get_version_description(selected_version)
            if desc:
                st.text(desc)
    else:
        selected_version = "v1.0"
        st.sidebar.info("暂无可用的转化率口径版本")

    st.sidebar.markdown("---")
    st.sidebar.subheader("🔄 数据操作")
    if st.sidebar.button("🔄 重新生成数据", type="secondary"):
        st.session_state["force_regenerate"] = True
        st.rerun()

    if st.sidebar.button("📊 刷新数据", type="primary"):
        st.cache_data.clear()
        st.rerun()

    return {
        "start_date": start_date,
        "end_date": end_date,
        "package_id": selected_package if selected_package != "全部" else None,
        "conversion_version": selected_version,
    }


def render_kpi_cards(sales_summary, comparison):
    st.subheader("📈 核心指标")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        current = sales_summary["total_revenue"]
        prev = comparison["total_revenue"]["previous"]
        delta = comparison["total_revenue"]["relative_difference"]
        st.metric(
            "总营收",
            format_currency(current),
            f"{delta:+.2f}%" if delta else None,
            delta_color=get_delta_color(delta),
        )

    with col2:
        current = sales_summary["total_orders"]
        prev = comparison["total_orders"]["previous"]
        delta = comparison["total_orders"]["relative_difference"]
        st.metric(
            "订单数",
            format_number(current),
            f"{delta:+.2f}%" if delta else None,
            delta_color=get_delta_color(delta),
        )

    with col3:
        current = sales_summary["total_rooms"]
        prev = comparison["total_rooms"]["previous"]
        delta = comparison["total_rooms"]["relative_difference"]
        st.metric(
            "售房间数",
            format_number(current),
            f"{delta:+.2f}%" if delta else None,
            delta_color=get_delta_color(delta),
        )

    with col4:
        current = sales_summary["avg_order_value"]
        prev = comparison["avg_order_value"]["previous"]
        delta = comparison["avg_order_value"]["relative_difference"]
        st.metric(
            "客单价",
            format_currency(current),
            f"{delta:+.2f}%" if delta else None,
            delta_color=get_delta_color(delta),
        )

    col5, col6, col7, col8 = st.columns(4)

    with col5:
        st.metric(
            "平均房价",
            format_currency(sales_summary["avg_price_per_room"]),
        )

    with col6:
        st.metric(
            "平均入住天数",
            f"{sales_summary['avg_length_of_stay']:.1f} 晚",
        )

    with col7:
        st.metric(
            "总客人数",
            format_number(sales_summary["total_guests"]),
        )

    with col8:
        st.metric(
            "取消率",
            format_percent(sales_summary["cancellation_rate"]),
            delta_color="inverse",
        )


def render_sales_trend(sales_trend, filters):
    st.subheader("📊 销售趋势")

    if sales_trend.is_empty():
        st.info("暂无销售趋势数据")
        return

    col1, col2 = st.columns([3, 1])
    with col2:
        period = st.selectbox(
            "时间粒度",
            options=["day", "week", "month"],
            format_func=lambda x: {"day": "日", "week": "周", "month": "月"}[x],
            key="trend_period",
        )

    sales_trend = services["sales"].get_sales_trend(
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        package_id=filters["package_id"],
        period=period,
    )

    if not sales_trend.is_empty():
        fig = make_subplots(specs=[[{"secondary_y": True}]])

        fig.add_trace(
            go.Bar(
                x=sales_trend["order_date"].to_list(),
                y=sales_trend["revenue"].to_list(),
                name="营收",
                marker_color="#1f77b4",
                opacity=0.7,
            ),
            secondary_y=False,
        )

        fig.add_trace(
            go.Scatter(
                x=sales_trend["order_date"].to_list(),
                y=sales_trend["rooms"].to_list(),
                name="售房间数",
                mode="lines+markers",
                line=dict(color="#ff7f0e", width=2),
                marker=dict(size=6),
            ),
            secondary_y=True,
        )

        if "revenue_ma7" in sales_trend.columns:
            fig.add_trace(
                go.Scatter(
                    x=sales_trend["order_date"].to_list(),
                    y=sales_trend["revenue_ma7"].to_list(),
                    name="营收7日均值",
                    mode="lines",
                    line=dict(color="#2ca02c", width=2, dash="dash"),
                ),
                secondary_y=False,
            )

        fig.update_layout(
            title="营收与售房趋势",
            xaxis_title="日期",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            height=400,
        )
        fig.update_yaxes(title_text="营收 (元)", secondary_y=False)
        fig.update_yaxes(title_text="售房间数", secondary_y=True)

        st.plotly_chart(fig, use_container_width=True)

        with st.expander("📋 查看趋势明细"):
            display_df = sales_trend.clone()
            display_df = display_df.with_columns(
                order_date=pl.col("order_date").cast(pl.Utf8)
            )
            st.dataframe(display_df.to_pandas(), use_container_width=True)


def render_conversion_rate(filters, orders_df, inventory_df):
    st.subheader("🎯 套餐转化率分析")

    col1, col2 = st.columns([2, 1])

    with col1:
        try:
            conversion_trend = services["conversion"].get_trend(
                orders_df,
                inventory_df,
                filters["conversion_version"],
                date_col="order_date",
                period="day",
            )

            if not conversion_trend.is_empty():
                fig = go.Figure()
                fig.add_trace(
                    go.Scatter(
                        x=conversion_trend["order_date"].to_list(),
                        y=conversion_trend["conversion_rate"].to_list(),
                        mode="lines+markers",
                        name="转化率",
                        line=dict(color="#9467bd", width=2),
                        fill="tozeroy",
                        fillcolor="rgba(148, 103, 189, 0.2)",
                    )
                )

                avg_rate = conversion_trend["conversion_rate"].mean()
                fig.add_hline(
                    y=avg_rate,
                    line_dash="dash",
                    line_color="red",
                    annotation_text=f"均值: {avg_rate:.2f}%",
                )

                fig.update_layout(
                    title=f"转化率趋势 ({filters['conversion_version']})",
                    xaxis_title="日期",
                    yaxis_title="转化率 (%)",
                    height=350,
                )

                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("暂无转化率数据")
        except Exception as e:
            st.error(f"计算转化率时出错: {e}")

    with col2:
        st.markdown("#### 同环比分析")
        try:
            versions = ["v1.0", "v1.1", "v2.0", "v2.1"]
            comparison = services["conversion"].compare_versions(
                orders_df, inventory_df, versions
            )

            if not comparison.is_empty():
                display_df = comparison.select(
                    ["version_code", "version_name", "numerator", "denominator", "conversion_rate"]
                )
                display_df = display_df.with_columns(
                    conversion_rate=pl.col("conversion_rate").round(2)
                )
                st.dataframe(
                    display_df.to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("暂无版本对比数据")
        except Exception as e:
            st.error(f"版本对比时出错: {e}")

    notes = repo.get_analysis_notes(
        record_type="conversion",
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )
    if not notes.is_empty():
        with st.expander("📝 分析备注", expanded=True):
            for row in notes.head(3).iter_rows(named=True):
                st.info(
                    f"**{row['analysis_date']}** - {row['analyst']}\n\n"
                    f"{row['content']}\n\n"
                    f"**结论**: {row.get('conclusion', 'N/A')}\n\n"
                    f"**行动项**: {row.get('action_items', 'N/A')}"
                )


def render_channel_performance(channel_perf):
    st.subheader("📱 渠道表现")

    if channel_perf.is_empty():
        st.info("暂无渠道数据")
        return

    col1, col2 = st.columns(2)

    with col1:
        fig = px.bar(
            channel_perf.to_pandas(),
            x="channel",
            y="revenue",
            color="conversion_rate",
            title="各渠道营收与转化率",
            labels={"channel": "渠道", "revenue": "营收 (元)", "conversion_rate": "转化率"},
            color_continuous_scale="Blues",
            height=350,
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = px.pie(
            channel_perf.to_pandas(),
            values="rooms_sold",
            names="channel",
            title="各渠道售房占比",
            hole=0.4,
            height=350,
        )
        st.plotly_chart(fig, use_container_width=True)

    with st.expander("📋 渠道表现明细"):
        display_df = channel_perf.clone()
        numeric_cols = [
            "revenue", "avg_order_value", "channel_fee", "net_revenue",
            "cancellation_rate"
        ]
        for col in numeric_cols:
            if col in display_df.columns:
                if col == "cancellation_rate":
                    display_df = display_df.with_columns(pl.col(col).round(2))
                else:
                    display_df = display_df.with_columns(pl.col(col).round(2))
        st.dataframe(display_df.to_pandas(), use_container_width=True)


def render_package_performance(package_perf):
    st.subheader("🏠 套餐表现")

    if package_perf.is_empty():
        st.info("暂无套餐数据")
        return

    fig = px.scatter(
        package_perf.to_pandas(),
        x="rooms_sold",
        y="revenue",
        size="orders_count",
        color="occupancy_rate",
        hover_name="package_id",
        text="package_id",
        title="套餐表现气泡图 (大小=订单数, 颜色=入住率)",
        labels={
            "rooms_sold": "售房间数",
            "revenue": "营收 (元)",
            "occupancy_rate": "入住率 (%)",
        },
        color_continuous_scale="RdYlGn",
        height=400,
        size_max=50,
    )
    fig.update_traces(textposition="top center")
    st.plotly_chart(fig, use_container_width=True)

    with st.expander("📋 套餐表现明细"):
        display_df = package_perf.clone()
        display_df = display_df.with_columns(
            package_name=pl.col("package_id").replace(PACKAGE_NAMES)
        )
        numeric_cols = [
            "revenue", "avg_order_value", "avg_length_of_stay",
            "avg_unit_price", "occupancy_rate", "conversion_rate"
        ]
        for col in numeric_cols:
            if col in display_df.columns:
                display_df = display_df.with_columns(pl.col(col).round(2))

        cols = ["package_id", "package_name", "orders_count", "rooms_sold", "revenue",
                "avg_order_value", "occupancy_rate", "conversion_rate"]
        available_cols = [c for c in cols if c in display_df.columns]
        st.dataframe(
            display_df.select(available_cols).to_pandas(),
            use_container_width=True,
            hide_index=True,
        )


def render_oversell_alerts(filters):
    st.subheader("⚠️ 超卖预警")

    oversells = services["oversell"].get_pending_oversells()

    if oversells.is_empty():
        st.success("✅ 当前无待处理的超卖记录")
        return

    stats = services["oversell"].get_oversell_statistics(
        filters["start_date"], filters["end_date"]
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("超卖事件总数", stats["total_incidents"])
    with col2:
        st.metric("超卖房间总数", stats["total_oversell_rooms"])
    with col3:
        st.metric("待处理", stats["pending_count"], delta_color="inverse")
    with col4:
        st.metric("平均处理时长", f"{stats['avg_resolution_time_hours']:.1f} 小时")

    st.markdown("#### 待处理超卖记录")
    for row in oversells.iter_rows(named=True):
        with st.container():
            col1, col2, col3, col4 = st.columns([2, 1, 1, 2])
            with col1:
                pkg_name = PACKAGE_NAMES.get(row["package_id"], row["package_id"])
                st.markdown(f"**{pkg_name}** - {row['oversell_date']}")
                st.caption(f"超卖 {row['oversell_rooms']} 间房 | 状态: {row['status']}")
            with col2:
                st.metric("超卖房间", row["oversell_rooms"], delta_color="inverse")
            with col3:
                status_colors = {
                    "pending": "🔴",
                    "processing": "🟡",
                    "resolved": "🟢",
                }
                st.markdown(f"### {status_colors.get(row['status'], '⚪')}")
            with col4:
                if st.button("📝 处理", key=f"handle_{row['oversell_id']}"):
                    st.session_state[f"selected_oversell_{row['oversell_id']}"] = True

        if st.session_state.get(f"selected_oversell_{row['oversell_id']}"):
            with st.expander("🔍 超卖详情与处理", expanded=True):
                root_cause = services["oversell"].analyze_oversell_root_cause(
                    row["package_id"], row["oversell_date"]
                )

                col_a, col_b = st.columns(2)
                with col_a:
                    st.markdown("#### 📊 根因分析")
                    for cause in root_cause["potential_causes"]:
                        st.warning(f"• {cause}")

                    st.markdown("#### 👥 受影响订单")
                    affected = services["oversell"].get_affected_orders(
                        row["package_id"], row["oversell_date"]
                    )
                    if not affected.is_empty():
                        st.dataframe(
                            affected.select(["order_id", "channel", "checkin_date", "checkout_date", "rooms", "customer_name"]).to_pandas(),
                            use_container_width=True,
                        )

                with col_b:
                    st.markdown("#### ✅ 处理操作")
                    handling_result = st.text_area(
                        "处理结果",
                        placeholder="请输入处理结果，如：协调客户升级房型、退款补偿等",
                        key=f"result_{row['oversell_id']}",
                    )
                    remark = st.text_area(
                        "备注",
                        placeholder="其他需要记录的信息",
                        key=f"remark_{row['oversell_id']}",
                    )
                    handler = st.text_input(
                        "处理人",
                        value=st.session_state.get("current_user", "管理员"),
                        key=f"handler_{row['oversell_id']}",
                    )

                    if st.button("✅ 标记已解决", key=f"resolve_{row['oversell_id']}", type="primary"):
                        if handling_result:
                            services["oversell"].resolve_oversell(
                                row["oversell_id"], handling_result, remark
                            )
                            st.success("已标记为已解决！")
                            st.session_state[f"selected_oversell_{row['oversell_id']}"] = False
                            st.rerun()
                        else:
                            st.error("请填写处理结果")

                notes = repo.get_analysis_notes(
                    record_type="oversell",
                    record_id=row["oversell_id"],
                )
                if not notes.is_empty():
                    st.markdown("#### 📝 历史备注")
                    for note_row in notes.iter_rows(named=True):
                        st.info(
                            f"**{note_row['analysis_date']}** - {note_row['analyst']}\n\n"
                            f"{note_row['content']}\n\n"
                            f"**结论**: {note_row.get('conclusion', 'N/A')}"
                        )

        st.markdown("---")


def render_drill_down(filters):
    st.subheader("🔍 逐层展开分析")

    analysis_level = st.radio(
        "选择分析层级",
        options=["📦 套餐库存", "📱 渠道订单", "💰 价格规则"],
        horizontal=True,
    )

    if analysis_level == "📦 套餐库存":
        st.markdown("#### 📦 套餐库存明细")
        inventory = repo.get_package_inventory(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
        )

        if not inventory.is_empty():
            inventory = inventory.with_columns(
                package_name=pl.col("package_id").replace(PACKAGE_NAMES)
            )

            fig = go.Figure()
            for pkg_id in inventory["package_id"].unique().to_list()[:5]:
                pkg_data = inventory.filter(pl.col("package_id") == pkg_id).sort("date")
                pkg_name = PACKAGE_NAMES.get(pkg_id, pkg_id)
                fig.add_trace(
                    go.Scatter(
                        x=pkg_data["date"].to_list(),
                        y=pkg_data["available_rooms"].to_list(),
                        mode="lines",
                        name=f"{pkg_name} 可用房量",
                        stackgroup="one",
                    )
                )

            fig.update_layout(
                title="可用房量趋势",
                xaxis_title="日期",
                yaxis_title="可用房间数",
                height=350,
            )
            st.plotly_chart(fig, use_container_width=True)

            with st.expander("📋 库存明细数据"):
                display_df = inventory.sort("date", descending=True)
                display_df = display_df.with_columns(date=pl.col("date").cast(pl.Utf8))
                st.dataframe(
                    display_df.select(
                        ["date", "package_id", "package_name", "total_rooms",
                         "booked_rooms", "reserved_rooms", "available_rooms", "unit_price"]
                    ).to_pandas(),
                    use_container_width=True,
                )
        else:
            st.info("暂无库存数据")

    elif analysis_level == "📱 渠道订单":
        st.markdown("#### 📱 渠道订单明细")
        orders = repo.get_ota_orders(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
        )

        if not orders.is_empty():
            col1, col2 = st.columns(2)
            with col1:
                status_dist = orders["order_status"].value_counts().to_pandas()
                fig = px.pie(
                    status_dist,
                    values="count",
                    names="order_status",
                    title="订单状态分布",
                    height=300,
                )
                st.plotly_chart(fig, use_container_width=True)

            with col2:
                payment_dist = orders["payment_status"].value_counts().to_pandas()
                fig = px.pie(
                    payment_dist,
                    values="count",
                    names="payment_status",
                    title="支付状态分布",
                    height=300,
                )
                st.plotly_chart(fig, use_container_width=True)

            with st.expander("📋 订单明细数据 (可追溯到收款流水)"):
                display_df = orders.sort("order_date", descending=True).head(100)
                display_df = display_df.with_columns(
                    order_date=pl.col("order_date").cast(pl.Utf8),
                    checkin_date=pl.col("checkin_date").cast(pl.Utf8),
                    checkout_date=pl.col("checkout_date").cast(pl.Utf8),
                    package_name=pl.col("package_id").replace(PACKAGE_NAMES),
                )

                selected_order = st.selectbox(
                    "选择订单查看收款流水",
                    options=["请选择订单"] + display_df["order_id"].to_list(),
                    key="order_detail_select",
                )

                if selected_order != "请选择订单":
                    payments = repo.get_payment_transactions(order_id=selected_order)
                    if not payments.is_empty():
                        st.markdown("##### 💰 收款流水记录")
                        payment_display = payments.with_columns(
                            transaction_date=pl.col("transaction_date").cast(pl.Utf8)
                        )
                        st.dataframe(
                            payment_display.select(
                                ["transaction_id", "transaction_date", "amount",
                                 "payment_method", "transaction_status", "channel_fee", "net_amount", "remark"]
                            ).to_pandas(),
                            use_container_width=True,
                        )

                    door_records = repo.get_door_lock_records(order_id=selected_order)
                    if not door_records.is_empty():
                        st.markdown("##### 🔑 门锁记录")
                        door_display = door_records.with_columns(
                            checkin_time=pl.col("checkin_time").cast(pl.Utf8),
                            checkout_time=pl.col("checkout_time").cast(pl.Utf8),
                        )
                        st.dataframe(
                            door_display.select(
                                ["record_id", "room_id", "checkin_time",
                                 "checkout_time", "guest_name", "operator"]
                            ).to_pandas(),
                            use_container_width=True,
                        )

                display_cols = [
                    "order_id", "order_date", "package_id", "package_name", "channel",
                    "checkin_date", "checkout_date", "nights", "rooms", "guests",
                    "order_amount", "paid_amount", "order_status", "payment_status",
                    "customer_name",
                ]
                available_cols = [c for c in display_cols if c in display_df.columns]
                st.dataframe(
                    display_df.select(available_cols).to_pandas(),
                    use_container_width=True,
                )
        else:
            st.info("暂无订单数据")

    elif analysis_level == "💰 价格规则":
        st.markdown("#### 💰 价格规则明细")
        pricing = repo.get_pricing_rules(
            package_id=filters["package_id"],
            is_active=True,
        )

        if not pricing.is_empty():
            pricing = pricing.with_columns(
                package_name=pl.col("package_id").replace(PACKAGE_NAMES),
                start_date=pl.col("start_date").cast(pl.Utf8),
                end_date=pl.col("end_date").cast(pl.Utf8),
            )

            for row in pricing.iter_rows(named=True):
                with st.container():
                    col1, col2, col3 = st.columns([3, 2, 2])
                    with col1:
                        st.markdown(f"**{row['rule_name']}**")
                        st.caption(
                            f"{row['package_name']} | 有效期: {row['start_date']} ~ {row['end_date']}"
                        )
                    with col2:
                        st.metric("基础价格", format_currency(row["base_price"]))
                    with col3:
                        discounts = []
                        if row["early_bird_discount"] > 0:
                            discounts.append(f"早鸟 {row['early_bird_discount']}%")
                        if row["last_minute_discount"] > 0:
                            discounts.append(f"临期 {row['last_minute_discount']}%")
                        if row["long_stay_discount"] > 0:
                            discounts.append(f"长住 {row['long_stay_discount']}%")
                        st.caption("优惠: " + ", ".join(discounts) if discounts else "无特殊优惠")

                    with st.expander("📋 规则详情"):
                        detail_cols = [
                            "rule_id", "rule_type", "min_nights", "max_nights",
                            "weekend_surcharge", "holiday_surcharge",
                            "early_bird_discount", "last_minute_discount", "long_stay_discount"
                        ]
                        detail_data = {k: row[k] for k in detail_cols}
                        st.json(detail_data)

                st.markdown("---")
        else:
            st.info("暂无价格规则数据")


def main():
    global repo, services

    st.title("🏨 旅游民宿套餐售卖趋势看板")
    st.markdown("---")

    repo = init_database()
    services = init_services(repo)

    filters = render_sidebar()

    if filters["start_date"] >= filters["end_date"]:
        st.error("开始日期必须早于结束日期")
        return

    sales_summary = services["sales"].get_sales_summary(
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        package_id=filters["package_id"],
    )

    prev_days = (filters["end_date"] - filters["start_date"]).days
    prev_start = filters["start_date"] - timedelta(days=prev_days)
    prev_end = filters["start_date"] - timedelta(days=1)

    comparison = services["sales"].compare_periods(
        current_start=filters["start_date"],
        current_end=filters["end_date"],
        previous_start=prev_start,
        previous_end=prev_end,
        package_id=filters["package_id"],
    )

    render_kpi_cards(sales_summary, comparison)

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📈 销售趋势",
        "🎯 转化率分析",
        "📊 渠道与套餐",
        "⚠️ 超卖预警",
        "🔍 逐层展开",
    ])

    with tab1:
        sales_trend = services["sales"].get_sales_trend(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
            period="day",
        )
        render_sales_trend(sales_trend, filters)

    with tab2:
        orders_df = repo.get_ota_orders(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
        )
        inventory_df = repo.get_package_inventory(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
        )
        render_conversion_rate(filters, orders_df, inventory_df)

    with tab3:
        channel_perf = services["sales"].get_channel_performance(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            package_id=filters["package_id"],
        )
        render_channel_performance(channel_perf)

        package_perf = services["sales"].get_package_performance(
            start_date=filters["start_date"],
            end_date=filters["end_date"],
            conversion_version=filters["conversion_version"],
        )
        render_package_performance(package_perf)

    with tab4:
        render_oversell_alerts(filters)

    with tab5:
        render_drill_down(filters)

    st.markdown("---")
    st.caption(
        "© 2024 旅游民宿套餐售卖趋势看板 | 技术栈: Streamlit + Polars + DuckDB + MinIO"
    )


if __name__ == "__main__":
    main()
