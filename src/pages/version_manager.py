import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime, timedelta
import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go

from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository
from src.business_logic.conversion_rate import ConversionRateCalculator


PACKAGE_NAMES = {
    "PKG001": "山景豪华套房",
    "PKG002": "海景双床房",
    "PKG003": "家庭亲子房",
    "PKG004": "蜜月情侣房",
    "PKG005": "团建聚会别墅",
}


st.set_page_config(
    page_title="转化率口径版本管理",
    page_icon="📊",
    layout="wide",
)


@st.cache_resource(show_spinner="正在初始化...")
def init_repository():
    config = load_config()
    repo = DataRepository(config, use_minio=True)
    return repo


@st.cache_resource(show_spinner="正在初始化服务...")
def init_services(repo):
    return {
        "conversion": ConversionRateCalculator(repo),
    }


def render_version_list(repo, conversion_calculator):
    st.subheader("📋 口径版本列表")

    versions = repo.get_conversion_rate_versions()

    if versions.is_empty():
        st.info("暂无转化率口径版本")
        return

    versions = versions.with_columns(
        effective_date=pl.col("effective_date").cast(pl.Utf8),
        expiry_date=pl.col("expiry_date").cast(pl.Utf8),
        created_at=pl.col("created_at").cast(pl.Utf8),
    )

    display_cols = [
        "version_code", "version_name", "description", "time_range",
        "is_active", "effective_date", "expiry_date", "created_by", "created_at"
    ]
    available_cols = [c for c in display_cols if c in versions.columns]

    st.dataframe(
        versions.select(available_cols).to_pandas(),
        use_container_width=True,
        hide_index=True,
    )

    st.markdown("---")

    selected_version = st.selectbox(
        "选择版本查看详情",
        options=versions["version_code"].to_list(),
        format_func=lambda x: next(
            (f"{row['version_code']} - {row['version_name']}"
             for row in versions.iter_rows(named=True)
             if row['version_code'] == x), x
        ),
        key="selected_version_detail",
    )

    if selected_version:
        version_detail = versions.filter(pl.col("version_code") == selected_version).row(0, named=True)

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("#### 📝 版本信息")
            info_data = {
                "版本名称": version_detail["version_name"],
                "版本代码": version_detail["version_code"],
                "描述": version_detail["description"],
                "创建人": version_detail["created_by"],
                "创建时间": version_detail["created_at"],
                "生效日期": version_detail["effective_date"],
                "失效日期": version_detail["expiry_date"],
                "是否启用": "✅ 是" if version_detail["is_active"] else "❌ 否",
                "时间范围": version_detail["time_range"],
            }
            for k, v in info_data.items():
                st.write(f"**{k}**: {v or '无'}")

        with col2:
            st.markdown("#### 🧮 计算公式")
            st.code(
                f"**分子公式**:\n```python\n{version_detail['numerator_formula']}\n```\n"
                f"**分母公式**:\n```python\n{version_detail['denominator_formula']}\n```\n"
                f"**过滤器**:\n```\n{version_detail['filters'] or '无'}\n```"
            )

        st.markdown("#### 📊 公式说明")
        st.info(
            conversion_calculator.get_version_description(selected_version)
        )

        st.markdown("#### 🔄 版本对比")
        all_versions = versions["version_code"].to_list()
        compare_with = st.multiselect(
            "选择要对比的版本",
            options=all_versions,
            default=[v for v in all_versions if v != selected_version][:2],
            key="compare_versions",
        )

        if compare_with:
            start_date = st.date_input(
                "选择数据起始日期",
                value=date.today() - timedelta(days=30),
                key="comp_start_date",
            )
            end_date = st.date_input(
                "选择数据结束日期",
                value=date.today(),
                key="comp_end_date",
            )

            if st.button("📊 生成对比报告", key="gen_compare"):
                orders_df = repo.get_ota_orders(start_date=start_date, end_date=end_date)
                inventory_df = repo.get_package_inventory(start_date=start_date, end_date=end_date)

                if orders_df.is_empty() or inventory_df.is_empty():
                    st.warning("所选日期范围内没有足够的数据进行对比")
                else:
                    comparison = conversion_calculator.compare_versions(
                        orders_df, inventory_df, [selected_version] + compare_with
                    )

                    if not comparison.is_empty():
                        st.info("没有可对比的数据")
                    else:
                        col1, col2 = st.columns(2)

                        with col1:
                            fig = go.Figure()
                            for row in comparison.iter_rows(named=True):
                                fig.add_trace(go.Bar(
                                    name=row["version_name"],
                                    x=["转化率"],
                                    y=[row["conversion_rate"]],
                                    text=f"{row['conversion_rate']:.2f}%",
                                    textposition="auto",
                                ))

                            fig.update_layout(
                                title="各版本转化率对比",
                                yaxis_title="转化率 (%)",
                                height=400,
                            )
                            st.plotly_chart(fig, use_container_width=True)

                        with col2:
                            display_comp = comparison.select([
                                "version_code", "version_name",
                                "numerator", "denominator", "conversion_rate"
                            ]).with_columns(
                                conversion_rate=pl.col("conversion_rate").round(2)
                            )
                            st.dataframe(
                                display_comp.to_pandas(),
                                use_container_width=True,
                                hide_index=True,
                            )

                        if len([selected_version] + compare_with) >= 2:
                            st.markdown("#### 🔍 差异分析")
                            for v1 in compare_with:
                                try:
                                    diff = conversion_calculator.explain_difference(
                                        orders_df, inventory_df, selected_version, v1
                                    )
                                    with st.expander(f"{selected_version} vs {v1}", expanded=False):
                                        col_a, col_b = st.columns(2)
                                        with col_a:
                                            st.metric(
                                                f"{selected_version} 转化率",
                                                f"{diff['conversion_rate_1']:.2f}%"
                                            )
                                        with col_b:
                                            st.metric(
                                                f"{v1} 转化率",
                                                f"{diff['conversion_rate_2']:.2f}%"
                                            )
                                        st.metric(
                                            "绝对差异",
                                            f"{diff['absolute_difference']:.2f}%"
                                        )
                                        if diff['relative_difference']:
                                            st.metric(
                                                "相对差异",
                                                f"{diff['relative_difference']:.2f}%"
                                            )
                                        st.markdown("**差异原因**:")
                                        for d in diff['differences']:
                                            st.warning(f"• {d}")
                                except Exception as e:
                                    st.error(f"对比 {selected_version} 和 {v1} 时出错: {e}")


def render_create_version(repo):
    st.subheader("➕ 创建新版本")

    with st.form("create_version_form"):
        col1, col2 = st.columns(2)

        with col1:
            version_name = st.text_input("版本名称", placeholder="例如: 付费转化率 v3.0")
            version_code = st.text_input("版本代码", placeholder="例如: v3.0")
            description = st.text_area("版本描述", placeholder="描述这个版本的用途和计算逻辑")
            created_by = st.text_input("创建人", value=st.session_state.get("current_user", "管理员"))
            effective_date = st.date_input("生效日期", value=date.today())
            expiry_date = st.date_input("失效日期", value=None)

        with col2:
            time_range = st.selectbox(
                "时间范围",
                options=["daily", "weekly", "monthly"],
                format_func=lambda x: {"daily": "按日", "weekly": "按周", "monthly": "按月"}[x],
            )
            filters = st.text_area("过滤条件", placeholder="例如: order_status = 'paid'")
            numerator_formula = st.text_area(
                "分子公式",
                placeholder="例如: count(col('order_id').filter(col('payment_status') == 'paid'))",
                help="使用Polars表达式，可用函数: col, sum, count, mean, max, min, when, lit, n_unique",
            )
            denominator_formula = st.text_area(
                "分母公式",
                placeholder="例如: sum(col('available_rooms'))",
                help="使用Polars表达式，可用函数: col, sum, count, mean, max, min, when, lit, n_unique",
            )
            is_active = st.checkbox("立即启用", value=True)

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("#### 📚 公式示例")
            st.code(
                "**订单数 / 可用房量:\n"
                "分子: count(col('order_id'))\n"
                "分母: sum(col('available_rooms'))\n\n"
                "**付费订单数 / 总房量:\n"
                "分子: count(col('order_id').filter(col('payment_status') == 'paid'))\n"
                "分母: sum(col('total_rooms'))\n\n"
                "**实际收入 / 潜在最大收入:\n"
                "分子: sum(col('paid_amount'))\n"
                "分母: sum(col('total_rooms') * col('unit_price'))\n"
            )

        with col2:
            st.markdown("#### ⚠️ 注意事项")
            st.warning(
                "1. 公式必须是合法的Polars表达式\n"
                "2. 使用 col('列名') 引用列\n"
                "3. 可用函数: sum, count, mean, max, min, when, lit, n_unique\n"
                "4. 过滤器使用SQL语法\n"
                "5. 创建后公式会保存到数据库中\n"
            )

        submitted = st.form_submit_button("✅ 创建版本", type="primary")

        if submitted:
            if not version_name or not version_code or not numerator_formula or not denominator_formula:
                st.error("请填写所有必填项")
            else:
                try:
                    version_data = {
                        "version_name": version_name,
                        "version_code": version_code,
                        "description": description,
                        "numerator_formula": numerator_formula,
                        "denominator_formula": denominator_formula,
                        "time_range": time_range,
                        "filters": filters or None,
                        "is_active": is_active,
                        "created_by": created_by,
                        "effective_date": effective_date,
                        "expiry_date": expiry_date or None,
                    }

                    version_id = repo.save_conversion_rate_version(version_data)
                    st.success(f"版本创建成功！版本ID: {version_id}")
                    st.balloons()

                except Exception as e:
                    st.error(f"创建版本时出错: {e}")


def main():
    st.title("📊 转化率口径版本管理")
    st.markdown("---")

    repo = init_repository()
    services = init_services(repo)
    conversion_calculator = services["conversion"]

    tab1, tab2 = st.tabs(["📋 版本列表", "➕ 创建新版本"])

    with tab1:
        render_version_list(repo, conversion_calculator)

    with tab2:
        render_create_version(repo)

    st.markdown("---")
    st.caption(
        "© 2024 旅游民宿套餐售卖趋势看板 | 转化率口径版本管理系统"
    )


if __name__ == "__main__":
    main()
