import streamlit as st
import polars as pl
from datetime import datetime

from ui_components import display_dataframe_with_highlight, render_date_filter

st.set_page_config(
    page_title="变更时间线 - 家装工地客户确认风险监测",
    page_icon="📜",
    layout="wide",
)


@st.cache_resource
def get_repository():
    from data_layer import DataRepository
    return DataRepository()


def apply_auth_filter(df: pl.DataFrame) -> pl.DataFrame:
    repo = get_repository()
    user_id = st.session_state.get("current_user_id", "U004")
    auth_scope = repo.get_auth_scope(user_id)

    if auth_scope and auth_scope.get("region"):
        project_ids = (
            repo.get_project_confirmations()
            .filter(pl.col("region") == auth_scope["region"])["project_id"]
            .to_list()
        )
        if "project_id" in df.columns:
            df = df.filter(pl.col("project_id").is_in(project_ids))
    return df


def main():
    st.title("📜 变更时间线")
    st.caption("追踪项目口径变更历史，用于解释指标口径变化")

    repo = get_repository()

    st.markdown("---")

    timeline = repo.get_change_timeline()
    if timeline.height == 0:
        st.warning("⚠️ 暂无变更记录")
        return

    timeline = apply_auth_filter(timeline)

    filter_col1, filter_col2, filter_col3 = st.columns(3)

    with filter_col1:
        start_date, end_date = render_date_filter(key_prefix="timeline")
    with filter_col2:
        change_types = timeline["change_type"].unique().to_list() if "change_type" in timeline.columns else []
        selected_types = st.multiselect(
            "🔄 变更类型",
            options=change_types,
            default=change_types,
            key="timeline_type",
        )
    with filter_col3:
        search = st.text_input("🔎 搜索项目/字段/说明", key="timeline_search")

    filtered = timeline.clone()
    if start_date and "changed_at" in filtered.columns:
        filtered = filtered.filter(pl.col("changed_at") >= datetime.combine(start_date, datetime.min.time()))
    if end_date and "changed_at" in filtered.columns:
        filtered = filtered.filter(pl.col("changed_at") <= datetime.combine(end_date, datetime.max.time()))
    if selected_types and "change_type" in filtered.columns:
        filtered = filtered.filter(pl.col("change_type").is_in(selected_types))
    if search:
        kw = search.lower()
        filtered = filtered.filter(
            pl.col("project_id").str.to_lowercase().str.contains(kw)
            | pl.col("field_name").fill_null("").str.to_lowercase().str.contains(kw)
            | pl.col("description").fill_null("").str.to_lowercase().str.contains(kw)
        )

    st.markdown(f"### 共 **{filtered.height}** 条变更记录")

    st.markdown("---")

    if filtered.height == 0:
        st.info("当前筛选条件下无变更记录")
        return

    display_dataframe_with_highlight(filtered, page_size=30)

    st.markdown("---")
    st.subheader("📊 变更类型统计")

    type_summary = filtered.group_by("change_type").agg([
        pl.count("id").alias("变更次数"),
        pl.n_unique("project_id").alias("涉及项目数"),
    ]).sort("变更次数", descending=True)

    import plotly.graph_objects as go
    from ui_components import safe_render_chart

    def create_type_chart(df):
        pandas_df = df.to_pandas()
        fig = go.Figure(data=[
            go.Bar(
                x=pandas_df["change_type"],
                y=pandas_df["变更次数"],
                marker_color="#9b59b6",
                text=pandas_df["变更次数"],
                textposition="outside",
            )
        ])
        fig.update_layout(
            title="变更类型分布",
            xaxis_title="变更类型",
            yaxis_title="变更次数",
            height=350,
            margin=dict(l=10, r=10, t=50, b=60),
            xaxis_tickangle=-20,
        )
        return fig

    last_update = repo.get_last_update_time("change_timeline")

    def reload_timeline():
        st.cache_data.clear()
        st.rerun()

    fig = safe_render_chart(
        chart_func=create_type_chart,
        component_name="变更类型统计图",
        last_update_time=last_update,
        retry_callback=reload_timeline,
        retry_key="timeline_chart_retry",
        df=type_summary,
    )
    if fig:
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")
    st.subheader("📖 口径变更说明")

    with st.expander("📘 风险等级判定口径", expanded=True):
        st.markdown(
            """
            **风险等级判定规则**（最近更新：2024-01-15）：

            | 风险等级 | 资料完整率 | 判定说明 |
            |---------|-----------|---------|
            | 🟢 低风险 | ≥90% | 资料基本完整，客户确认无重大遗漏 |
            | 🟡 中风险 | 70%-89% | 存在少量资料缺失，需及时补充 |
            | 🟠 高风险 | 50%-69% | 资料缺失较严重，需重点跟进 |
            | 🔴 极高风险 | <50% | 大量资料缺失，存在合规风险 |

            **变更历史**：
            - v1.2 (2024-01-15)：调整完整率阈值，由原来的 80%/60%/40% 调整为 90%/70%/50%
            - v1.1 (2023-11-01)：新增采购确认作为判定维度
            - v1.0 (2023-08-01)：初始版本，基于设计确认和收款确认判定
            """
        )

    with st.expander("📘 资料完整率计算口径", expanded=False):
        st.markdown(
            """
            **完整率计算公式**（最近更新：2024-01-10）：

            ```
            完整率 = (设计确认项 + 收款确认项 + 采购确认项) / 3 × 100%
            ```

            其中每一项：
            - 有记录且无必填字段缺失 → 记为 1
            - 无记录或存在必填字段缺失 → 记为 0

            **变更历史**：
            - v1.1 (2024-01-10)：补充必填字段缺失判定逻辑
            - v1.0 (2023-08-01)：初始版本
            """
        )

    with st.expander("📘 同环比计算口径", expanded=False):
        st.markdown(
            """
            **同环比计算公式**（最近更新：2024-01-05）：

            - 环比增长率（MoM）= (本期值 - 上月同期值) / 上月同期值 × 100%
            - 同比增长率（YoY）= (本期值 - 上年同期值) / 上年同期值 × 100%

            **变更历史**：
            - v1.0 (2024-01-05)：初始版本，采用自然月对比
            """
        )

    st.markdown("---")
    if st.button("🔍 跳转到明细查询页面", type="primary"):
        st.switch_page("pages/3_🔍_明细查询.py")


if __name__ == "__main__":
    main()
