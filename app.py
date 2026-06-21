import streamlit as st
from datetime import date, timedelta
import polars as pl
import json

from src.data.repository import DataRepository
from src.data.simulator import DataSimulator
from src.data.duckdb_manager import DuckDBManager
from src.pipeline.manager import PipelineManager
from src.charts.chart_builder import ChartBuilder
from src.utils.export_manager import ExportManager
from src.config import Config


st.set_page_config(
    page_title=f"{Config.SCENIC_NAME} - 游客投诉漏斗报表",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title(f"🏞️ {Config.SCENIC_NAME} - 游客投诉漏斗报表")
st.caption("基于 Streamlit + Polars + DuckDB + MinIO 构建")


@st.cache_resource(show_spinner=False)
def get_repo():
    return DataRepository()


@st.cache_resource(show_spinner=False)
def get_chart_builder():
    return ChartBuilder()


@st.cache_resource(show_spinner=False)
def get_pipeline():
    return PipelineManager()


@st.cache_resource(show_spinner=False)
def get_export_mgr():
    return ExportManager()


@st.cache_data(show_spinner=False)
def init_data_cached():
    try:
        db = DuckDBManager()
        result = db.execute_query("SELECT COUNT(*) as cnt FROM complaints")
        if result["cnt"][0] == 0:
            raise Exception("No data")
        return True, None
    except Exception:
        simulator = DataSimulator()
        counts = simulator.initialize_all_data(days=90)
        return True, counts


def init_data():
    if "data_initialized" not in st.session_state:
        st.session_state.data_initialized = False

    if not st.session_state.data_initialized:
        with st.spinner("正在初始化模拟数据..."):
            success, counts = init_data_cached()
            if success:
                st.session_state.data_initialized = True
                if counts:
                    st.success(f"数据初始化完成: 投诉{counts['complaints']}条, 订单{counts['orders']}条")


repo = get_repo()
chart_builder = get_chart_builder()
pipeline = get_pipeline()
export_mgr = get_export_mgr()

init_data()


with st.sidebar:
    st.header("📋 筛选条件")

    date_range = st.date_input(
        "选择日期范围",
        value=(date.today() - timedelta(days=30), date.today()),
        key="date_range"
    )

    region = st.selectbox(
        "选择区域",
        ["全部"] + Config.SCENIC_REGIONS,
        key="region_filter"
    )

    close_hours_threshold = st.slider(
        "超时阈值(小时)",
        min_value=1,
        max_value=72,
        value=24,
        key="close_hours_threshold"
    )

    st.divider()
    st.subheader("📤 分享筛选")
    filter_dict = {
        "start_date": str(st.session_state.date_range[0]) if len(st.session_state.date_range) > 0 else "",
        "end_date": str(st.session_state.date_range[1]) if len(st.session_state.date_range) > 1 else "",
        "region": st.session_state.region_filter,
        "threshold": st.session_state.close_hours_threshold
    }

    filter_hash = export_mgr.generate_filter_hash(filter_dict)
    st.code(f"筛选ID: {filter_hash}")

    share_str = export_mgr.build_shareable_filter_string(filter_dict)
    st.code(f"分享参数: {share_str[:50]}...", language=None)

    st.divider()
    st.subheader("🔄 数据管理")
    if st.button("重新生成模拟数据", type="secondary"):
        with st.spinner("正在重新生成数据..."):
            simulator = DataSimulator()
            counts = simulator.initialize_all_data(days=90)
            st.success(f"数据已重新生成: 投诉{counts['complaints']}条")
            st.rerun()


start_date, end_date = st.session_state.date_range if len(st.session_state.date_range) >= 2 else (date.today() - timedelta(days=30), date.today())
selected_region = st.session_state.region_filter if st.session_state.region_filter != "全部" else None


tab1, tab2, tab3, tab4 = st.tabs(["📊 漏斗总览", "📈 多维度分析", "🔍 明细查询", "⚙️ 取数链路"])

with tab1:
    col1, col2, col3, col4 = st.columns(4)

    funnel_data = repo.get_complaints_funnel(start_date, end_date, selected_region)
    total_complaints = funnel_data.select(pl.sum("count")).item() if len(funnel_data) > 0 else 0
    closed_count = funnel_data.filter(pl.col("status") == "已关闭").select(pl.sum("count")).item() if len(funnel_data) > 0 else 0
    processing_count = funnel_data.filter(pl.col("status") == "处理中").select(pl.sum("count")).item() if len(funnel_data) > 0 else 0

    daily_df = repo.get_daily_trend(start_date, end_date, selected_region)
    avg_daily = daily_df["total_count"].mean() if len(daily_df) > 0 else 0

    with col1:
        st.metric("总投诉量", int(funnel_data["count"].sum()) if len(funnel_data) > 0 else 0, delta=f"日均 {avg_daily:.1f}")
    with col2:
        close_rate = (closed_count / total_complaints * 100) if total_complaints > 0 else 0
        st.metric("已关闭", int(closed_count or 0), delta=f"关闭率 {close_rate:.1f}%")
    with col3:
        st.metric("处理中", int(processing_count or 0))
    with col4:
        close_hours_df = repo.get_close_hours_distribution(start_date, end_date, selected_region)
        timeout_count = repo.get_timeout_complaints(close_hours_threshold, start_date, end_date, selected_region)
        st.metric("超时投诉", len(timeout_count), delta=f">{close_hours_threshold}小时")

    st.divider()

    col_left, col_right = st.columns([3, 2])

    with col_left:
        funnel_fig = chart_builder.funnel_chart(funnel_data, f"投诉漏斗 ({start_date} ~ {end_date})")
        st.plotly_chart(funnel_fig, use_container_width=True)

    with col_right:
        close_dist_df = repo.get_close_hours_distribution(start_date, end_date, selected_region)
        close_dist_fig = chart_builder.close_hours_distribution_chart(close_dist_df, "关闭时长分布")
        st.plotly_chart(close_dist_fig, use_container_width=True)

    st.divider()
    st.subheader("📅 每日趋势")
    trend_fig = chart_builder.daily_trend_chart(daily_df, "每日投诉趋势")
    st.plotly_chart(trend_fig, use_container_width=True)

    st.divider()
    st.subheader("🗺️ 区域对比")
    region_df = repo.get_complaints_by_region(start_date, end_date)
    region_fig = chart_builder.region_comparison_chart(region_df, "各区域投诉对比")
    st.plotly_chart(region_fig, use_container_width=True)

    csv_data = export_mgr.export_to_csv(daily_df, filter_dict, "每日投诉趋势")
    st.download_button(
        "📥 导出当前数据 (CSV)",
        data=csv_data,
        file_name=f"complaints_daily_{filter_hash}.csv",
        mime="text/csv",
        key="download_daily_csv"
    )

with tab2:
    st.header("📈 多维度分析")

    sub_col1, sub_col2 = st.columns(2)

    with sub_col1:
        st.subheader("🏷️ 问题标签分布")
        tag_df = repo.get_complaints_by_tag(start_date, end_date, selected_region)
        tag_fig = chart_builder.tag_distribution_chart(tag_df)
        st.plotly_chart(tag_fig, use_container_width=True)

        selected_tag = st.selectbox(
            "选择标签查看明细",
            tag_df["tag"].to_list() if len(tag_df) > 0 else [],
            key="tag_detail_select"
        )

        if selected_tag:
            if st.button("🔍 查看该标签明细", key="go_tag_detail"):
                st.session_state.selected_tag_detail = selected_tag
                st.switch_page = "detail"

        tag_csv = export_mgr.export_to_csv(tag_df, filter_dict, "问题标签分布")
        st.download_button(
            "📥 导出标签数据",
            data=tag_csv,
            file_name=f"complaints_by_tag_{filter_hash}.csv",
            mime="text/csv"
        )

    with sub_col2:
        st.subheader("👤 责任归属分布")
        resp_df = repo.get_responsibility_distribution(start_date, end_date, selected_region)
        resp_fig = chart_builder.responsibility_chart(resp_df)
        st.plotly_chart(resp_fig, use_container_width=True)

        resp_csv = export_mgr.export_to_csv(resp_df, filter_dict, "责任归属分布")
        st.download_button(
            "📥 导出责任归属数据",
            data=resp_csv,
            file_name=f"complaints_by_resp_{filter_hash}.csv",
            mime="text/csv"
        )

    st.divider()

    sub_col3, sub_col4 = st.columns(2)

    with sub_col3:
        st.subheader("📞 回访结果分布")
        followup_df = repo.get_followup_results(start_date, end_date, selected_region)
        followup_fig = chart_builder.followup_result_chart(followup_df)
        st.plotly_chart(followup_fig, use_container_width=True)

    with sub_col4:
        st.subheader("⏱️ 关闭时长 vs 区域")
        region_close_df = repo.get_complaints_by_region(start_date, end_date)
        st.dataframe(
            region_close_df.select(["region", "total_count", "avg_close_hours"]),
            use_container_width=True,
            hide_index=True,
            column_config={
                "region": "区域",
                "total_count": "投诉总数",
                "avg_close_hours": st.column_config.NumberColumn("平均关闭时长(小时)", format="%.1f")
            }
        )

    st.divider()
    st.header("📊 同比环比分析")

    yoy_col, mom_col = st.columns(2)

    with yoy_col:
        st.subheader("年同比 (YoY)")
        current_df, prev_df = repo.get_yo_y_data(start_date, end_date, selected_region)

        if len(current_df) > 0 and len(prev_df) > 0:
            current_total = current_df["total_count"].sum()
            prev_total = prev_df["total_count"].sum()
            yoy_change = (current_total - prev_total) / prev_total * 100 if prev_total > 0 else 0

            st.metric("本期投诉量", int(current_total), delta=f"{yoy_change:+.1f}% 同比")

            yoy_fig = chart_builder.yoy_comparison_chart(current_df, prev_df, "年同比趋势")
            st.plotly_chart(yoy_fig, use_container_width=True)
        else:
            st.info("暂无足够的同比数据")

    with mom_col:
        st.subheader("月环比 (MoM)")
        current_mom, prev_mom = repo.get_mo_m_data(start_date, end_date, selected_region)

        if len(current_mom) > 0 and len(prev_mom) > 0:
            current_total = current_mom["total_count"].sum()
            prev_total = prev_mom["total_count"].sum()
            mom_change = (current_total - prev_total) / prev_total * 100 if prev_total > 0 else 0

            st.metric("本期投诉量", int(current_total), delta=f"{mom_change:+.1f}% 环比")

            mom_fig = chart_builder.yoy_comparison_chart(current_mom, prev_mom, "月环比趋势")
            st.plotly_chart(mom_fig, use_container_width=True)
        else:
            st.info("暂无足够的环比数据")

    st.divider()
    st.subheader("📋 同环比详细数据")
    compare_data = {
        "指标": ["投诉总量", "已关闭数", "处理中数", "平均关闭时长(小时)"],
        "本期": [
            int(current_df["total_count"].sum()) if len(current_df) > 0 else 0,
            int(current_df["closed_count"].sum()) if len(current_df) > 0 else 0,
            int(current_df["processing_count"].sum()) if len(current_df) > 0 else 0,
            f"{tag_df['avg_close_hours'].mean():.1f}" if len(tag_df) > 0 else "N/A"
        ],
        "同比": [
            int(prev_df["total_count"].sum()) if len(prev_df) > 0 else 0,
            int(prev_df["closed_count"].sum()) if len(prev_df) > 0 else 0,
            int(prev_df["processing_count"].sum()) if len(prev_df) > 0 else 0,
            "N/A"
        ],
        "环比": [
            int(prev_mom["total_count"].sum()) if len(prev_mom) > 0 else 0,
            int(prev_mom["closed_count"].sum()) if len(prev_mom) > 0 else 0,
            int(prev_mom["processing_count"].sum()) if len(prev_mom) > 0 else 0,
            "N/A"
        ]
    }
    st.dataframe(compare_data, use_container_width=True, hide_index=True)

with tab3:
    st.header("🔍 投诉明细查询")

    timeout_df = repo.get_timeout_complaints(close_hours_threshold, start_date, end_date, selected_region)

    st.subheader(f"⚠️ 超时投诉样本 (>{close_hours_threshold}小时)")
    st.info(f"共发现 {len(timeout_df)} 条超时投诉，点击可查看详情")

    if len(timeout_df) > 0:
        display_df = timeout_df.select([
            "complaint_id", "complaint_date", "region", "tag",
            "close_hours", "responsibility", "description"
        ])
        st.dataframe(
            display_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "complaint_id": "投诉ID",
                "complaint_date": "投诉日期",
                "region": "区域",
                "tag": "问题标签",
                "close_hours": st.column_config.NumberColumn("关闭时长(小时)", format="%.1f"),
                "responsibility": "责任部门",
                "description": "投诉描述"
            },
            on_select="rerun",
            selection_mode="single-row"
        )

        selected_rows = st.session_state.get("selection", [])
        if selected_rows:
            complaint_id = timeout_df[selected_rows[0]]["complaint_id"].item()
            st.session_state.selected_complaint_id = complaint_id

    st.divider()

    tag_for_detail = st.selectbox(
        "按问题标签筛选",
        ["全部"] + Config.COMPLAINT_TAGS,
        key="detail_tag_filter"
    )

    if tag_for_detail != "全部":
        tag_detail_df = repo.get_complaints_by_tag_detail(tag_for_detail, start_date, end_date, selected_region)
        st.subheader(f"🏷️ '{tag_for_detail}' 标签投诉明细")
        st.dataframe(
            tag_detail_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "complaint_id": "投诉ID",
                "complaint_date": "投诉日期",
                "region": "区域",
                "tag": "问题标签",
                "description": "投诉描述",
                "status": "状态",
                "close_hours": st.column_config.NumberColumn("关闭时长(小时)", format="%.1f"),
                "responsibility": "责任部门",
                "followup_result": "回访结果"
            }
        )

        detail_csv = export_mgr.export_to_csv(tag_detail_df, filter_dict, f"标签_{tag_for_detail}_明细")
        st.download_button(
            f"📥 导出{tag_for_detail}明细",
            data=detail_csv,
            file_name=f"complaints_tag_{tag_for_detail}_{filter_hash}.csv",
            mime="text/csv"
        )

    st.divider()
    st.subheader("📎 证据附件示例")

    evidence_types = {
        "evidence_photo1.jpg": "现场照片1",
        "evidence_photo2.jpg": "现场照片2",
        "evidence_screenshot.png": "系统截图",
        "evidence_video.mp4": "视频证据"
    }

    for file_key, file_name in evidence_types.items():
        col_a, col_b, col_c = st.columns([3, 2, 1])
        with col_a:
            st.text(f"📄 {file_name}")
        with col_b:
            st.caption(f"文件名: {file_key}")
        with col_c:
            st.button("查看", key=f"view_{file_key}", disabled=True)

    st.info("💡 证据附件用于解释投诉处理口径，确保每个投诉都有据可查")

with tab4:
    st.header("⚙️ 取数链路管理")
    st.caption("可追踪的三步取数流程：小程序订单 → 摄像头统计 → 商户流水")

    steps_info = pipeline.get_step_info()

    col_pipeline, col_status = st.columns([3, 2])

    with col_pipeline:
        st.subheader("📊 取数步骤")
        for i, step in enumerate(steps_info):
            with st.expander(f"步骤 {i+1}: {step['name']}", expanded=True):
                st.write(f"**步骤ID**: {step['id']}")
                st.write(f"**描述**: {step['description']}")

                step_history = st.button(
                    "查看历史执行",
                    key=f"history_{step['id']}"
                )

                if step_history:
                    st.info(f"正在加载 {step['name']} 的执行历史...")

        st.divider()

        run_start, run_end = st.columns(2)
        with run_start:
            run_start_date = st.date_input("运行起始日期", value=start_date, key="pipeline_start")
        with run_end:
            run_end_date = st.date_input("运行结束日期", value=end_date, key="pipeline_end")

        col_run1, col_run2, col_run3 = st.columns(3)
        with col_run1:
            if st.button("▶️ 运行全部步骤", type="primary", use_container_width=True):
                with st.spinner("正在执行取数链路..."):
                    results = pipeline.run_pipeline(run_start_date, run_end_date)
                    st.success(f"取数完成！状态: {results['status']}")
                    st.rerun()
        with col_run2:
            selected_step = st.selectbox(
                "选择单步",
                [s["name"] for s in steps_info],
                key="single_step_select"
            )
        with col_run3:
            if st.button("⏭️ 运行单步", use_container_width=True):
                step_id = steps_info[selected_step.index(selected_step) if isinstance(selected_step, str) else 0]["id"]
                with st.spinner(f"正在执行 {selected_step}..."):
                    result = pipeline.run_single_step(step_id, run_start_date, run_end_date)
                    st.success(f"执行完成: {result['status']}")
                    st.rerun()

    with col_status:
        st.subheader("📋 近期运行记录")

        recent_runs = pipeline.get_recent_runs(limit=10)

        if recent_runs:
            for run in recent_runs:
                status_color = "🟢" if run["failed_steps"] == 0 and run["success_steps"] > 0 else "🔴" if run["failed_steps"] > 0 else "🟡"
                with st.expander(f"{status_color} {run['run_id']}"):
                    st.write(f"**成功步骤**: {run['success_steps']}/{run['total_steps']}")
                    st.write(f"**失败步骤**: {run['failed_steps']}")
                    st.write(f"**开始时间**: {run['start_time']}")
                    if run.get("total_duration"):
                        st.write(f"**总耗时**: {run['total_duration']:.1f}秒")

                    step_details = pipeline.get_step_status(run["run_id"])
                    for sd in step_details:
                        icon = "✅" if sd["status"] == "success" else "❌" if sd["status"] == "failed" else "⏳"
                        st.text(f"  {icon} {sd['step_name']} - {sd.get('records_count', 0)}条记录")
        else:
            st.info("暂无运行记录")

    st.divider()
    st.subheader("📝 取数链路说明")

    st.markdown("""
    **三步取数设计说明：**

    1. **小程序订单数据** - 从小程序侧拉取游客订单信息，包括订单量、游客数、消费金额等，作为分析投诉率的分母
    2. **摄像头统计数据** - 从摄像头系统获取各区域实时客流统计，用于计算各区域投诉密度
    3. **商户流水数据** - 从商户平台同步消费流水，关联投诉与消费行为的关系

    **可追踪特性：**
    - 每步执行都记录开始/结束时间、处理记录数、错误信息
    - 数据同时写入 DuckDB（分析用）和 MinIO（原始存储）
    - 支持单步重跑，便于定位问题
    - 所有运行历史可查，数据血缘清晰
    """)

st.divider()
st.caption(f"🚀 景区运营游客投诉漏斗报表 | 筛选ID: {filter_hash} | 数据范围: {start_date} ~ {end_date}")
