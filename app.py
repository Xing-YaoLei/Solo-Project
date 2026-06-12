from __future__ import annotations

import sys
from datetime import date, datetime, timedelta
from typing import Optional

import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go

sys.path.insert(0, ".")

from src.auth import User, authenticate, filter_data_by_permission, init_default_users, PERMISSIONS
from src.business import (
    LossCalculator,
    compute_trend,
    compute_reason_composition,
    detect_store_exceptions,
    explain_version_change,
    get_all_metric_versions,
    get_metric_version,
)
from src.data import DataRepository
from src.data.seed import ensure_seeded
from src.share import ShareManager, SharePayload, build_share_payload_from_user

st.set_page_config(
    page_title="连锁咖啡报损复核趋势看板",
    page_icon="☕",
    layout="wide",
)


def init_session():
    if "user" not in st.session_state:
        st.session_state.user = None
    if "share_payload" not in st.session_state:
        st.session_state.share_payload = None
    init_default_users()


def render_login():
    st.title("☕ 连锁咖啡报损复核趋势看板")
    st.markdown("请登录以查看数据")
    with st.form("login_form"):
        username = st.text_input("用户名")
        password = st.text_input("密码", type="password")
        submitted = st.form_submit_button("登录")
        if submitted:
            user = authenticate(username, password)
            if user:
                st.session_state.user = user
                st.success("登录成功")
                st.rerun()
            else:
                st.error("用户名或密码错误")
    with st.expander("测试账号"):
        st.markdown(
            """
            - `admin` / `admin123` - 管理员（全部权限）
            - `area01` / `area123` - 区域经理（S001-S003）
            - `store01` / `store123` - 门店经理（仅 S001）
            - `viewer` / `viewer123` - 仅查看（S001、S002）
            """
        )


def effective_user() -> User:
    if st.session_state.share_payload:
        return st.session_state.share_payload.to_share_user()
    return st.session_state.user


def render_refresh_time_bar(repo: DataRepository):
    refresh_time = repo.get_refresh_time()
    col1, col2, col3 = st.columns([6, 2, 2])
    with col1:
        if refresh_time:
            try:
                rt = datetime.fromisoformat(refresh_time)
                st.markdown(
                    f"🕒 **最近刷新时间**：{rt.strftime('%Y-%m-%d %H:%M:%S')} "
                    f"（{_time_ago(rt)}）"
                )
            except Exception:
                st.markdown(f"🕒 **最近刷新时间**：{refresh_time}")
        else:
            st.markdown("🕒 **最近刷新时间**：暂无记录")
    with col2:
        user = effective_user()
        if user and user.has_permission("refresh_data"):
            if st.button("🔄 立即刷新", width="stretch"):
                with st.spinner("正在从 MinIO 同步数据..."):
                    stats = repo.sync_all_from_minio()
                    st.success(f"同步完成：{stats}")
                    st.rerun()
    with col3:
        if st.button("🚪 退出登录", width="stretch"):
            st.session_state.user = None
            st.session_state.share_payload = None
            st.rerun()


def _time_ago(dt: datetime) -> str:
    delta = datetime.now() - dt
    sec = int(delta.total_seconds())
    if sec < 60:
        return f"{sec}秒前"
    if sec < 3600:
        return f"{sec // 60}分钟前"
    if sec < 86400:
        return f"{sec // 3600}小时前"
    return f"{sec // 86400}天前"


def render_sidebar_filters(
    repo: DataRepository,
    user: User,
    locked_metric_version: Optional[str] = None,
    locked_stores: Optional[list[str]] = None,
    locked_date_range: Optional[tuple] = None,
):
    with st.sidebar:
        st.header("📊 筛选条件")
        all_stores_df = repo.get_stores()
        all_stores = list(zip(all_stores_df["store_id"].to_list(), all_stores_df["store_name"].to_list()))
        accessible_ids = user.can_access_stores([s[0] for s in all_stores])
        effective_accessible = accessible_ids
        if locked_stores:
            effective_accessible = [s for s in accessible_ids if s in locked_stores]
        store_options = [f"{sid} - {sname}" for sid, sname in all_stores if sid in effective_accessible]
        default_stores = store_options
        if locked_stores:
            default_stores = [f"{sid} - {sname}" for sid, sname in all_stores if sid in locked_stores and sid in effective_accessible]
        selected_store_labels = st.multiselect(
            "门店",
            options=store_options,
            default=default_stores,
            disabled=locked_stores is not None,
        )
        selected_store_ids = [label.split(" - ")[0] for label in selected_store_labels] if selected_store_labels else effective_accessible
        if locked_stores:
            selected_store_ids = [s for s in selected_store_ids if s in locked_stores]

        default_end = date.today()
        default_start = default_end - timedelta(days=29)
        if locked_date_range:
            default_start, default_end = locked_date_range
        date_range = st.date_input(
            "日期范围",
            value=(default_start, default_end),
            max_value=date.today(),
            disabled=locked_date_range is not None,
        )
        start_date = date_range[0]
        end_date = date_range[1] if len(date_range) > 1 else default_end

        versions = get_all_metric_versions()
        version_options = {v.version: f"{v.version} - {v.description}" for v in versions}
        default_idx = 0
        if locked_metric_version and locked_metric_version in version_options:
            default_idx = list(version_options.keys()).index(locked_metric_version)
        version_label = st.selectbox(
            "损耗率口径版本",
            options=list(version_options.keys()),
            format_func=lambda v: version_options[v],
            index=default_idx,
            disabled=locked_metric_version is not None,
        )
        if locked_metric_version:
            version_label = locked_metric_version
        mv = get_metric_version(version_label)
        if mv:
            st.info(f"公式：{mv.formula}\n\n生效日期：{mv.effective_date.isoformat()}")
            with st.expander("📜 版本变更说明（复盘用）"):
                vs = sorted(versions, key=lambda x: x.effective_date)
                for i in range(1, len(vs)):
                    st.markdown(f"**{vs[i-1].version} → {vs[i].version}**")
                    st.text(explain_version_change(vs[i-1].version, vs[i].version))
                    st.markdown("---")

        freq = st.radio("趋势粒度", ["日", "周", "月"], horizontal=True, disabled=locked_date_range is not None)
        freq_map = {"日": "day", "周": "week", "月": "month"}
        selected_freq = freq_map[freq]

        show_only_passed = st.checkbox("仅显示已复核通过", value=True)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "store_ids": selected_store_ids,
            "metric_version": version_label,
            "freq": selected_freq,
            "show_only_passed": show_only_passed,
        }


def render_kpis(calc_result, filters):
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("损耗率", f"{calc_result.loss_rate * 100:.2f}%")
    c2.metric("报损金额", f"¥{calc_result.loss_amount:,.2f}")
    c3.metric("分母(销售+库存)", f"¥{calc_result.denominator:,.2f}")
    c4.metric("报损单数", f"{calc_result.report_count:,} 单")
    mv = get_metric_version(filters["metric_version"])
    if mv:
        st.caption(f"📐 口径 {filters['metric_version']}：{mv.formula}")
    if calc_result.note:
        st.caption(f"ℹ️ {calc_result.note}")


def render_trend_chart(trend_df, share_payload: Optional[SharePayload]):
    st.subheader("📈 报损单趋势")
    if trend_df.is_empty():
        st.info("暂无趋势数据")
        return
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=trend_df["period"].to_list(),
            y=trend_df["loss_amount"].to_list(),
            name="报损金额",
            yaxis="y",
            marker_color="#EF4444",
            opacity=0.75,
        )
    )
    fig.add_trace(
        go.Scatter(
            x=trend_df["period"].to_list(),
            y=[r * 100 for r in trend_df["loss_rate"].to_list()],
            name="损耗率(%)",
            yaxis="y2",
            mode="lines+markers",
            line_color="#2563EB",
        )
    )
    fig.update_layout(
        barmode="overlay",
        xaxis_title="日期",
        yaxis=dict(title="报损金额(¥)", side="left"),
        yaxis2=dict(title="损耗率(%)", overlaying="y", side="right", range=[0, 15]),
        hovermode="x unified",
        height=380,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    st.plotly_chart(fig, width="stretch")
    if share_payload and share_payload.include_metric_footer:
        st.caption(f"📝 {share_payload.get_formula_footer()}")


def render_reason_chart(reason_df, share_payload: Optional[SharePayload]):
    st.subheader("🥧 损耗原因构成")
    if reason_df.is_empty():
        st.info("暂无原因数据")
        return
    fig = px.pie(
        reason_df.to_pandas(),
        names="loss_reason",
        values="loss_amount",
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_traces(textposition="inside", textinfo="percent+label")
    fig.update_layout(height=380, legend=dict(orientation="h", yanchor="bottom", y=-0.2))
    st.plotly_chart(fig, width="stretch")

    with st.expander("查看原因金额明细"):
        display_df = reason_df.with_columns(
            (pl.col("pct") * 100).round(2).alias("占比(%)"),
            pl.col("loss_amount").round(2).alias("金额(¥)"),
        ).select(["loss_reason", "金额(¥)", "占比(%)"])
        st.dataframe(display_df.to_pandas(), width="stretch", hide_index=True)
    if share_payload and share_payload.include_metric_footer:
        st.caption(f"📝 {share_payload.get_formula_footer()}")


def render_review_detail(
    loss_df: pl.DataFrame,
    user: User,
    repo: DataRepository,
    delivery_df: pl.DataFrame | None = None,
    receipts_df: pl.DataFrame | None = None,
):
    st.subheader("📝 复核意见明细")
    if not user.has_permission("view_review_detail"):
        st.warning("您当前权限无法查看复核意见明细。")
        return
    if loss_df.is_empty():
        st.info("暂无数据")
        return
    cols = [
        "id", "report_no", "report_date", "store_id", "store_name",
        "sku_id", "sku_name",
        "loss_quantity", "unit", "loss_amount", "loss_reason",
        "review_status", "reviewer", "review_comment", "review_date",
    ]
    available = [c for c in cols if c in loss_df.columns]
    display_cols = [c for c in available if c not in ("id", "store_id", "sku_id")]
    display = loss_df.select(available).sort("report_date", descending=True)
    display_view = display.select(display_cols)
    if display_view.height > 200:
        st.dataframe(display_view.head(200).to_pandas(), width="stretch", hide_index=True, on_select="rerun", selection_mode="single-row")
        st.caption(f"仅展示最近 200 条，共 {display_view.height} 条")
    else:
        event = st.dataframe(display_view.to_pandas(), width="stretch", hide_index=True, on_select="rerun", selection_mode="single-row")

    selected_idx = None
    try:
        sel = st.session_state.get("selection", None)
        if sel and hasattr(sel, "rows") and sel.rows:
            selected_idx = sel.rows[0]
    except Exception:
        pass
    try:
        from streamlit.dataframe_selection import DataframeSelection
        for k in st.session_state:
            v = st.session_state[k]
            if isinstance(v, DataframeSelection) and hasattr(v, "selection") and v.selection.rows:
                selected_idx = v.selection.rows[0]
                break
    except Exception:
        pass
    try:
        for k, v in st.session_state.items():
            if isinstance(v, dict) and "rows" in v and v["rows"]:
                selected_idx = v["rows"][0]
                break
    except Exception:
        pass

    selected_row = None
    try:
        sels = st.dataframe(display_view, on_select="ignore")
    except Exception:
        pass

    if display_view.height > 0:
        st.markdown("---")
        report_options = display_view["report_no"].to_list()
        if report_options:
            chosen_report = st.selectbox(
                "🔎 选择要追溯来源的报损单",
                options=report_options,
                index=0,
                format_func=lambda x: f"{x} | {display_view.filter(pl.col('report_no') == x)['store_name'][0]} | {display_view.filter(pl.col('report_no') == x)['sku_name'][0]}",
                key="trace_report_select",
            )
            if chosen_report:
                row_mask = display.filter(pl.col("report_no") == chosen_report)
                if not row_mask.is_empty():
                    selected_row = row_mask.row(0, named=True)
    if selected_row:
        _render_trace_panel(selected_row, delivery_df, receipts_df)


def _render_trace_panel(selected_row: dict, delivery_df, receipts_df):
    with st.expander(f"🛒 明细追溯：报损单 {selected_row.get('report_no')}", expanded=True):
        store_id = selected_row.get("store_id")
        sku_id = selected_row.get("sku_id")
        sku_name = selected_row.get("sku_name")
        store_name = selected_row.get("store_name")
        report_date = selected_row.get("report_date")
        loss_qty = selected_row.get("loss_quantity")
        loss_amt = selected_row.get("loss_amount")
        c1, c2, c3, c4 = st.columns(4)
        c1.markdown(f"**门店**：{store_name} (`{store_id}`)")
        c2.markdown(f"**商品**：{sku_name} (`{sku_id}`)")
        c3.markdown(f"**报损日期**：{report_date}")
        c4.markdown(f"**报损数量/金额**：{loss_qty} / ¥{loss_amt:,.2f}")

        from datetime import timedelta
        start = report_date - timedelta(days=1)
        end = report_date + timedelta(days=1)

        st.markdown("#### 📦 外卖平台订单来源")
        if delivery_df is not None and not delivery_df.is_empty():
            matched = delivery_df.filter(
                (pl.col("store_id") == store_id) &
                (pl.col("product_id") == sku_id) &
                (pl.col("order_date") >= start) &
                (pl.col("order_date") <= end)
            )
            if matched.is_empty():
                st.info(f"报损日期 ±1 天无对应外卖订单（共 0 条）")
            else:
                platform_group = matched.group_by("platform").agg([
                    pl.col("id").count().alias("订单数"),
                    pl.col("quantity").sum().alias("销量"),
                    pl.col("total_amount").sum().alias("销售额"),
                ]).sort("销售额", descending=True)
                st.dataframe(platform_group.to_pandas(), width="stretch", hide_index=True)
                show_cols = [c for c in ["order_no", "platform", "order_date", "product_name", "quantity", "unit_price", "total_amount", "status"] if c in matched.columns]
                with st.expander(f"查看 {matched.height} 条外卖订单明细"):
                    st.dataframe(matched.select(show_cols).to_pandas(), width="stretch", hide_index=True)
        else:
            st.caption("暂无外卖平台数据")

        st.markdown("#### 🧾 会员小票来源")
        if receipts_df is not None and not receipts_df.is_empty():
            matched_r = receipts_df.filter(
                (pl.col("store_id") == store_id) &
                (pl.col("product_id") == sku_id) &
                (pl.col("sale_date") >= start) &
                (pl.col("sale_date") <= end)
            )
            if matched_r.is_empty():
                st.info(f"报损日期 ±1 天无对应会员小票（共 0 条）")
            else:
                channel_group = matched_r.group_by("channel").agg([
                    pl.col("id").count().alias("小票数"),
                    pl.col("quantity").sum().alias("销量"),
                    pl.col("total_amount").sum().alias("销售额"),
                ]).sort("销售额", descending=True)
                st.dataframe(channel_group.to_pandas(), width="stretch", hide_index=True)
                show_cols_r = [c for c in ["id", "channel", "sale_date", "product_name", "quantity", "unit_price", "total_amount", "member_id"] if c in matched_r.columns]
                with st.expander(f"查看 {matched_r.height} 条会员小票明细"):
                    st.dataframe(matched_r.select(show_cols_r).to_pandas(), width="stretch", hide_index=True)
        else:
            st.caption("暂无会员小票数据")


def render_store_exception(exception_df: pl.DataFrame, user: User):
    st.subheader("🚨 责任门店异常标注")
    if not user.has_permission("view_exception"):
        st.warning("您当前权限无法查看异常门店。")
        return
    if exception_df.is_empty():
        st.info("暂无门店数据")
        return
    threshold = st.slider("异常阈值（损耗率 %）", 1.0, 15.0, 5.0, 0.5, key="threshold_slider")
    exception_df = exception_df.with_columns(
        (pl.col("loss_rate") * 100 > threshold).alias("is_exception")
    )
    df_display = exception_df.with_columns(
        (pl.col("loss_rate") * 100).round(2).alias("损耗率(%)"),
        pl.col("loss_amount").round(2).alias("报损金额(¥)"),
        pl.col("denominator").round(2).alias("分母(¥)"),
    ).select([
        "store_id", "store_name", "报损金额(¥)", "分母(¥)", "损耗率(%)", "report_count", "is_exception"
    ]).rename({"report_count": "报损单数"})

    def color_row(row):
        if row.get("is_exception"):
            return ["background-color: #fef2f2; color: #991b1b"] * len(row)
        return [""] * len(row)

    pdf = df_display.to_pandas()
    styled = pdf.style.apply(color_row, axis=1)
    st.dataframe(styled, width="stretch", hide_index=True)

    exception_count = exception_df.filter(pl.col("is_exception")).height
    st.caption(
        f"🚩 异常门店 {exception_count} / {exception_df.height} 家，"
        f"阈值：损耗率 > {threshold}%"
    )


def render_share_panel(user: User, filters: dict):
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔗 分享看板")
    if not user.has_permission("share_dashboard"):
        st.sidebar.warning("您没有分享权限")
        return
    ttl = st.sidebar.slider("有效时长（小时）", 1, 24 * 7, 24)
    include_footer = st.sidebar.checkbox("附带损耗率口径", value=True)
    charts_all = ["trend", "reason_composition", "review_detail", "store_exception"]
    chart_labels = {
        "trend": "报损单趋势",
        "reason_composition": "损耗原因构成",
        "review_detail": "复核意见明细",
        "store_exception": "责任门店异常",
    }
    selected_charts = st.sidebar.multiselect(
        "包含图表",
        options=charts_all,
        default=charts_all,
        format_func=lambda c: chart_labels[c],
    )
    if st.sidebar.button("生成分享链接", width="stretch"):
        mgr = ShareManager()
        payload = build_share_payload_from_user(
            user=user,
            metric_version=filters["metric_version"],
            filters=filters,
            charts=selected_charts,
            ttl_hours=ttl,
            include_metric_footer=include_footer,
        )
        token = mgr.dumps_payload(payload)
        try:
            base_url = st.secrets["base_url"]
        except Exception:
            base_url = "http://localhost:8501"
        url = f"{base_url}/?share={token}"
        st.sidebar.success("链接已生成：")
        st.sidebar.code(url, language=None)
        st.sidebar.caption(
            f"分享的权限角色：{payload.owner_role}，"
            f"可查看门店：{payload.allowed_stores if payload.allowed_stores else '（admin 全部门店）'}，"
            f"口径版本：{payload.metric_version}"
        )


def render_metric_versions_panel(user: User, repo: DataRepository):
    if not user.has_permission("manage_metrics"):
        return
    with st.expander("⚙️ 损耗率口径版本管理", expanded=False):
        st.markdown("### 历史版本")
        mvs = repo.get_metric_versions()
        if not mvs.is_empty():
            st.dataframe(mvs.to_pandas(), width="stretch", hide_index=True)
        st.markdown("### 新增版本")
        with st.form("new_version_form"):
            c1, c2 = st.columns(2)
            with c1:
                version = st.text_input("版本号 (如 v2.1)")
                description = st.text_input("描述")
                formula = st.text_input("计算公式")
            with c2:
                effective_date = st.date_input("生效日期")
                changelog = st.text_area("变更说明（复盘时展示）")
                created_by = st.text_input("创建人", value=user.username)
            submitted = st.form_submit_button("保存版本")
            if submitted and version:
                repo.insert_metric_version(
                    version=version,
                    description=description,
                    formula=formula,
                    effective_date=effective_date,
                    created_by=created_by,
                    changelog=changelog,
                )
                st.success(f"已保存版本 {version}")
                st.rerun()


def render_main():
    user = effective_user()
    if not user:
        render_login()
        return

    repo = DataRepository()
    ensure_seeded()

    try:
        from src.config import app_config
        import os
        os.makedirs(os.path.dirname(app_config.duckdb_path), exist_ok=True)
    except Exception:
        pass

    if st.session_state.share_payload:
        payload = st.session_state.share_payload
        st.success(
            f"🔗 您正在通过分享链接访问（由 {payload.owner} 分享，"
            f"角色：{payload.owner_role}）"
        )
        if payload.is_expired():
            st.error("该分享链接已过期。")
            return

    render_refresh_time_bar(repo)

    share_payload = st.session_state.share_payload
    locked_mv = share_payload.metric_version if share_payload else None
    locked_stores = share_payload.allowed_stores if share_payload and share_payload.allowed_stores else None
    locked_dates = None
    if share_payload and share_payload.filters:
        sd = share_payload.filters.get("start_date")
        ed = share_payload.filters.get("end_date")
        if isinstance(sd, str) and isinstance(ed, str):
            try:
                from datetime import date as _d
                sd_d = _d.fromisoformat(sd) if isinstance(sd, str) else sd
                ed_d = _d.fromisoformat(ed) if isinstance(ed, str) else ed
                locked_dates = (sd_d, ed_d)
            except Exception:
                pass

    filters = render_sidebar_filters(
        repo, user,
        locked_metric_version=locked_mv,
        locked_stores=locked_stores,
        locked_date_range=locked_dates,
    )
    metric_version = filters["metric_version"]
    if share_payload:
        metric_version = share_payload.metric_version
        filters["metric_version"] = share_payload.metric_version

    start_date = filters["start_date"]
    end_date = filters["end_date"]
    store_ids = filters["store_ids"] or None

    loss_df = repo.get_loss_reports(start_date, end_date, store_ids)
    receipts_df = repo.get_member_receipts(start_date, end_date, store_ids)
    delivery_df = repo.get_delivery_orders(start_date, end_date, store_ids)
    inventory_df = repo.get_inventory(start_date, end_date, store_ids)

    loss_df = filter_data_by_permission(user, loss_df)
    receipts_df = filter_data_by_permission(user, receipts_df)
    delivery_df = filter_data_by_permission(user, delivery_df)
    inventory_df = filter_data_by_permission(user, inventory_df)

    if filters["show_only_passed"] and not loss_df.is_empty():
        loss_df = loss_df.filter(pl.col("review_status") == "通过")

    calculator = LossCalculator(metric_version)
    calc_result = calculator.compute(loss_df, receipts_df, delivery_df, inventory_df)

    st.title("☕ 连锁咖啡报损复核趋势看板")
    st.markdown(f"👋 {user.username}（{user.role}）")

    render_kpis(calc_result, filters)

    share_payload = st.session_state.share_payload
    allowed_charts = (
        share_payload.charts if share_payload
        else ["trend", "reason_composition", "review_detail", "store_exception"]
    )

    tab_list = []
    tab_contents = []
    if "trend" in allowed_charts:
        trend_df = compute_trend(loss_df, receipts_df, delivery_df, inventory_df, filters["freq"], metric_version)
        tab_list.append("报损单趋势")
        tab_contents.append(("trend", trend_df))
    if "reason_composition" in allowed_charts:
        reason_df = compute_reason_composition(loss_df, metric_version)
        tab_list.append("损耗原因构成")
        tab_contents.append(("reason", reason_df))
    if "review_detail" in allowed_charts:
        tab_list.append("复核意见明细")
        tab_contents.append(("review", (loss_df, delivery_df, receipts_df)))
    if "store_exception" in allowed_charts:
        exception_df = detect_store_exceptions(loss_df, receipts_df, delivery_df, metric_version=metric_version)
        tab_list.append("责任门店异常")
        tab_contents.append(("exception", exception_df))

    tabs = st.tabs(tab_list) if tab_list else []
    for i, (name, data) in enumerate(tab_contents):
        with tabs[i]:
            if name == "trend":
                render_trend_chart(data, share_payload)
            elif name == "reason":
                render_reason_chart(data, share_payload)
            elif name == "review":
                l_df, d_df, r_df = data
                render_review_detail(l_df, user, repo, d_df, r_df)
            elif name == "exception":
                render_store_exception(data, user)

    render_metric_versions_panel(user, repo)
    render_share_panel(user, filters)


def check_share_token():
    from urllib.parse import urlparse, parse_qs
    query = st.query_params
    if "share" in query:
        token = query["share"] if isinstance(query["share"], str) else query["share"][0]
        mgr = ShareManager()
        payload = mgr.parse_token(token)
        if payload:
            st.session_state.share_payload = payload
            st.session_state.user = payload.to_share_user()
        else:
            st.warning("分享链接无效或已过期。")


def main():
    init_session()
    check_share_token()
    render_main()


if __name__ == "__main__":
    main()
