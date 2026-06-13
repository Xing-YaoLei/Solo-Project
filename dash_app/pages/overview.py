from datetime import date
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from dash import dcc, html, Input, Output, State, dash_table, callback
import dash_bootstrap_components as dbc

from dash_app.components import (
    create_layout,
    default_date_range,
    create_filter_bar,
    create_stat_card,
    create_data_table,
    render_empty,
)
from data_processing import (
    get_regions_df,
    get_appointments_df,
    get_reschedule_df,
    calculate_attendance_rate,
    calculate_hourly_distribution,
    get_prev_period_dates,
    compute_period_over_period,
    get_multi_region_comparison,
)

PRIMARY_COLOR = "#1e88e5"
COLORS = {
    "primary": "#1e88e5",
    "success": "#43a047",
    "warning": "#fb8c00",
    "danger": "#e53935",
    "info": "#00acc1",
    "secondary": "#78909c",
}


def _get_region_options():
    regions_df = get_regions_df()
    if regions_df.empty:
        return []
    return [
        {"label": row["region_name"], "value": int(row["id"])}
        for _, row in regions_df.iterrows()
    ]


def _compute_stats(appointments_df, reschedule_df, compare_mode):
    if appointments_df.empty:
        return {
            "total_appointments": 0,
            "attendance_rate": 0.0,
            "cancel_rate": 0.0,
            "total_reschedules": 0,
            "total_appointments_trend": None,
            "attendance_rate_trend": None,
            "cancel_rate_trend": None,
            "total_reschedules_trend": None,
            "trend_label": "",
        }

    attendance_stats = calculate_attendance_rate(appointments_df)

    total_appointments = attendance_stats["total_appointments"].sum() if not attendance_stats.empty else 0
    total_attended = attendance_stats["attended"].sum() if not attendance_stats.empty else 0
    total_cancelled = attendance_stats["cancelled"].sum() if not attendance_stats.empty else 0

    attendance_rate = (total_attended / total_appointments * 100) if total_appointments > 0 else 0.0
    cancel_rate = (total_cancelled / total_appointments * 100) if total_appointments > 0 else 0.0
    total_reschedules = len(reschedule_df) if not reschedule_df.empty else 0

    trend_label_map = {
        "none": "",
        "week": "环比上周",
        "month": "环比上月",
        "yoy": "同比去年",
    }
    trend_label = trend_label_map.get(compare_mode, "")

    result = {
        "total_appointments": total_appointments,
        "attendance_rate": round(attendance_rate, 1),
        "cancel_rate": round(cancel_rate, 1),
        "total_reschedules": total_reschedules,
        "total_appointments_trend": None,
        "attendance_rate_trend": None,
        "cancel_rate_trend": None,
        "total_reschedules_trend": None,
        "trend_label": trend_label,
    }

    return result


def _compute_compare_stats(current_start, current_end, region_ids, compare_mode):
    if compare_mode == "none":
        return None, None

    prev_start, prev_end = get_prev_period_dates(current_start, current_end, compare_mode)

    prev_appointments_df = get_appointments_df(prev_start, prev_end, region_ids)
    prev_reschedule_df = get_reschedule_df(prev_start, prev_end)

    prev_attendance = calculate_attendance_rate(prev_appointments_df)
    prev_total = prev_attendance["total_appointments"].sum() if not prev_attendance.empty else 0
    prev_attended = prev_attendance["attended"].sum() if not prev_attendance.empty else 0
    prev_cancelled = prev_attendance["cancelled"].sum() if not prev_attendance.empty else 0

    prev_attendance_rate = (prev_attended / prev_total * 100) if prev_total > 0 else 0.0
    prev_cancel_rate = (prev_cancelled / prev_total * 100) if prev_total > 0 else 0.0
    prev_reschedules = len(prev_reschedule_df) if not prev_reschedule_df.empty else 0

    current_appointments_df = get_appointments_df(current_start, current_end, region_ids)
    current_reschedule_df = get_reschedule_df(current_start, current_end)
    current_attendance = calculate_attendance_rate(current_appointments_df)

    cur_total = current_attendance["total_appointments"].sum() if not current_attendance.empty else 0
    cur_attended = current_attendance["attended"].sum() if not current_attendance.empty else 0
    cur_cancelled = current_attendance["cancelled"].sum() if not current_attendance.empty else 0

    cur_attendance_rate = (cur_attended / cur_total * 100) if cur_total > 0 else 0.0
    cur_cancel_rate = (cur_cancelled / cur_total * 100) if cur_total > 0 else 0.0
    cur_reschedules = len(current_reschedule_df) if not current_reschedule_df.empty else 0

    def _pct(cur, prev):
        if prev > 0:
            return round((cur - prev) / prev * 100, 1)
        return None

    return {
        "total_appointments_trend": _pct(cur_total, prev_total),
        "attendance_rate_trend": round(cur_attendance_rate - prev_attendance_rate, 1) if (prev_attendance_rate > 0 or cur_attendance_rate > 0) else None,
        "cancel_rate_trend": round(cur_cancel_rate - prev_cancel_rate, 1) if (prev_cancel_rate > 0 or cur_cancel_rate > 0) else None,
        "total_reschedules_trend": _pct(cur_reschedules, prev_reschedules),
    }, (prev_start, prev_end)


def _create_trend_chart(appointments_df, compare_mode, compare_dates):
    if appointments_df.empty:
        return go.Figure()

    daily = appointments_df.groupby("appointment_date").agg(
        count=("appointment_no", "nunique")
    ).reset_index()
    daily["appointment_date"] = pd.to_datetime(daily["appointment_date"])
    daily = daily.sort_values("appointment_date")

    fig = go.Figure()

    if compare_mode != "none" and compare_dates is not None:
        prev_start, prev_end = compare_dates
        prev_appointments_df = get_appointments_df(prev_start, prev_end)
        if not prev_appointments_df.empty:
            prev_daily = prev_appointments_df.groupby("appointment_date").agg(
                count=("appointment_no", "nunique")
            ).reset_index()
            prev_daily["appointment_date"] = pd.to_datetime(prev_daily["appointment_date"])
            prev_daily = prev_daily.sort_values("appointment_date")

            days_offset = (daily["appointment_date"].min() - prev_daily["appointment_date"].min()).days
            prev_daily["aligned_date"] = prev_daily["appointment_date"] + pd.Timedelta(days=days_offset)

            trend_label_map = {
                "week": "上周",
                "month": "上期",
                "yoy": "去年同期",
            }
            prev_label = trend_label_map.get(compare_mode, "对比期")

            fig.add_trace(go.Scatter(
                x=prev_daily["aligned_date"],
                y=prev_daily["count"],
                mode="lines",
                name=prev_label,
                line=dict(color=COLORS["secondary"], width=2, dash="dash"),
                opacity=0.6,
            ))

    fig.add_trace(go.Scatter(
        x=daily["appointment_date"],
        y=daily["count"],
        mode="lines+markers",
        name="本期",
        line=dict(color=PRIMARY_COLOR, width=3),
        marker=dict(size=6, color=PRIMARY_COLOR),
        fill="tozeroy",
        fillcolor=f"rgba(30, 136, 229, 0.1)",
    ))

    fig.update_layout(
        title=None,
        xaxis_title="日期",
        yaxis_title="预约数",
        hovermode="x unified",
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=10, b=10),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
        ),
    )
    fig.update_xaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor="#f0f0f0",
        linecolor="#e0e0e0",
    )
    fig.update_yaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor="#f0f0f0",
        linecolor="#e0e0e0",
        zeroline=True,
        zerolinecolor="#e0e0e0",
    )

    return fig


def _create_region_chart(appointments_df):
    if appointments_df.empty:
        return go.Figure()

    region_stats = appointments_df.groupby("region_name", dropna=False).agg(
        total=("appointment_no", "nunique"),
        attended=("status", lambda x: (x == "attended").sum()),
        cancelled=("status", lambda x: (x == "cancelled").sum()),
    ).reset_index()
    region_stats["region_name"] = region_stats["region_name"].fillna("未知区域")
    region_stats = region_stats.sort_values("total", ascending=True)

    fig = go.Figure()

    fig.add_trace(go.Bar(
        y=region_stats["region_name"],
        x=region_stats["attended"],
        name="已到场",
        orientation="h",
        marker=dict(color=COLORS["success"]),
    ))

    fig.add_trace(go.Bar(
        y=region_stats["region_name"],
        x=region_stats["cancelled"],
        name="已取消",
        orientation="h",
        marker=dict(color=COLORS["danger"]),
    ))

    other_count = region_stats["total"] - region_stats["attended"] - region_stats["cancelled"]
    fig.add_trace(go.Bar(
        y=region_stats["region_name"],
        x=other_count,
        name="其他状态",
        orientation="h",
        marker=dict(color=COLORS["info"]),
    ))

    fig.update_layout(
        barmode="stack",
        title=None,
        xaxis_title="预约数",
        yaxis_title="区域",
        hovermode="y unified",
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=10, b=10),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
        ),
    )
    fig.update_xaxes(
        showgrid=True,
        gridwidth=1,
        gridcolor="#f0f0f0",
        linecolor="#e0e0e0",
    )
    fig.update_yaxes(
        linecolor="#e0e0e0",
    )

    return fig


def _create_time_heatmap(appointments_df):
    if appointments_df.empty:
        return go.Figure()

    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekday_cn = {
        "Monday": "周一",
        "Tuesday": "周二",
        "Wednesday": "周三",
        "Thursday": "周四",
        "Friday": "周五",
        "Saturday": "周六",
        "Sunday": "周日",
    }

    heatmap_data = appointments_df.groupby(["weekday", "hour"]).agg(
        count=("appointment_no", "nunique")
    ).reset_index()

    pivot = heatmap_data.pivot(index="weekday", columns="hour", values="count").fillna(0)
    for wd in weekday_order:
        if wd not in pivot.index:
            pivot.loc[wd] = 0
    pivot = pivot.reindex(weekday_order)

    for h in range(6, 23):
        if h not in pivot.columns:
            pivot[h] = 0
    pivot = pivot.reindex(sorted(pivot.columns), axis=1)

    hour_labels = [f"{h:02d}:00" for h in pivot.columns]
    weekday_labels = [weekday_cn.get(w, w) for w in pivot.index]

    colorscale = [
        [0.0, "#e3f2fd"],
        [0.25, "#90caf9"],
        [0.5, "#42a5f5"],
        [0.75, "#1e88e5"],
        [1.0, "#0d47a1"],
    ]

    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=hour_labels,
        y=weekday_labels,
        colorscale=colorscale,
        hovertemplate="时段: %{x}<br>星期: %{y}<br>预约数: %{z}<extra></extra>",
        showscale=True,
        colorbar=dict(
            title="预约数",
            thickness=15,
        ),
    ))

    fig.update_layout(
        title=None,
        xaxis_title="时段",
        yaxis_title="星期",
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=10, b=10),
    )
    fig.update_xaxes(
        linecolor="#e0e0e0",
    )
    fig.update_yaxes(
        linecolor="#e0e0e0",
    )

    return fig


def layout():
    start_date, end_date = default_date_range(30)
    region_options = _get_region_options()
    sidebar = create_layout("overview")

    return html.Div([
        sidebar,
        html.Div([
            html.Div([
                html.H1("📊 预约趋势概览"),
                html.P(f"数据范围: {start_date} ~ {end_date} | 实时同步健身私教预约数据"),
            ], className="page-header"),

            create_filter_bar(
                start_date_default=start_date,
                end_date_default=end_date,
                region_options=region_options,
                show_compare=True,
            ),

            html.Div(id="overview-stats-grid", className="stats-grid"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("预约趋势折线图", className="card-title"),
                        html.Div("每日预约数变化趋势，支持同环比对比", className="card-subtitle"),
                    ], className="card-header"),
                    html.Div(id="overview-trend-chart", className="chart-container"),
                ], className="card"),
            ]),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("区域预约分布", className="card-title"),
                        html.Div("按门店区域统计预约构成", className="card-subtitle"),
                    ], className="card-header"),
                    html.Div(id="overview-region-chart", className="chart-container"),
                ], className="card"),

                html.Div([
                    html.Div([
                        html.Div("时段分布热力图", className="card-title"),
                        html.Div("星期 × 时段 预约密度分布", className="card-subtitle"),
                    ], className="card-header"),
                    html.Div(id="overview-time-chart", className="chart-container"),
                ], className="card"),
            ], className="grid-2"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("预约明细数据", className="card-title"),
                        html.Div("支持排序、筛选与分页", className="card-subtitle"),
                    ], className="card-header"),
                    html.Div(id="overview-detail-table-container"),
                ], className="card"),
            ]),

        ], className="main-content"),
    ], className="app-container")


def register_callbacks(app):
    @app.callback(
        [
            Output("overview-stats-grid", "children"),
            Output("overview-trend-chart", "children"),
            Output("overview-region-chart", "children"),
            Output("overview-time-chart", "children"),
            Output("overview-detail-table-container", "children"),
        ],
        [
            Input("filter-start-date", "date"),
            Input("filter-end-date", "date"),
            Input("filter-region", "value"),
            Input("filter-compare-mode", "value"),
        ],
    )
    def update_overview(start_date_str, end_date_str, region_ids, compare_mode):
        if not start_date_str or not end_date_str:
            empty_chart = dcc.Graph(figure=go.Figure(), style={"height": "320px"})
            return [
                create_stat_card("总预约数", "-"),
                create_stat_card("到场率", "-", value_suffix="%"),
                create_stat_card("取消率", "-", value_suffix="%"),
                create_stat_card("改约数", "-"),
            ], empty_chart, empty_chart, empty_chart, render_empty()

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        appointments_df = get_appointments_df(start_date, end_date, region_ids)
        reschedule_df = get_reschedule_df(start_date, end_date)

        compare_result, compare_dates = _compute_compare_stats(
            start_date, end_date, region_ids, compare_mode
        )

        stats = _compute_stats(appointments_df, reschedule_df, compare_mode)
        if compare_result:
            stats.update(compare_result)

        stat_cards = [
            create_stat_card(
                "总预约数",
                f"{stats['total_appointments']:,}",
                stats["total_appointments_trend"],
                stats["trend_label"],
            ),
            create_stat_card(
                "到场率",
                f"{stats['attendance_rate']:.1f}",
                stats["attendance_rate_trend"],
                stats["trend_label"],
                value_suffix="%",
            ),
            create_stat_card(
                "取消率",
                f"{stats['cancel_rate']:.1f}",
                stats["cancel_rate_trend"],
                stats["trend_label"],
                value_suffix="%",
            ),
            create_stat_card(
                "改约数",
                f"{stats['total_reschedules']:,}",
                stats["total_reschedules_trend"],
                stats["trend_label"],
            ),
        ]

        trend_fig = _create_trend_chart(appointments_df, compare_mode, compare_dates)
        region_fig = _create_region_chart(appointments_df)
        time_fig = _create_time_heatmap(appointments_df)

        trend_chart = dcc.Graph(
            figure=trend_fig,
            style={"height": "320px"},
            config={"displayModeBar": False, "responsive": True},
        )
        region_chart = dcc.Graph(
            figure=region_fig,
            style={"height": "360px"},
            config={"displayModeBar": False, "responsive": True},
        )
        time_chart = dcc.Graph(
            figure=time_fig,
            style={"height": "360px"},
            config={"displayModeBar": False, "responsive": True},
        )

        if appointments_df.empty:
            detail_table = render_empty("暂无预约明细数据")
        else:
            display_df = appointments_df.copy()
            if "status" in display_df.columns:
                from dash_app.components import status_badge
                display_df["状态"] = display_df["status"].apply(lambda s: status_badge(s))
            cols_rename = {
                "appointment_no": "预约编号",
                "appointment_date": "预约日期",
                "start_time": "开始时间",
                "end_time": "结束时间",
                "region_name": "门店区域",
                "coach_name": "教练",
                "member_name": "会员",
                "member_code": "会员号",
            }
            for old, new in cols_rename.items():
                if old in display_df.columns:
                    display_df = display_df.rename(columns={old: new})

            keep_cols = [
                "预约编号", "预约日期", "开始时间", "结束时间",
                "门店区域", "教练", "会员", "会员号", "状态"
            ]
            keep_cols = [c for c in keep_cols if c in display_df.columns]
            display_df = display_df[keep_cols]

            detail_table = create_data_table(display_df, "overview-detail", page_size=15)

        return stat_cards, trend_chart, region_chart, time_chart, detail_table


def register_page():
    return {
        "layout": layout,
        "register_callbacks": register_callbacks,
    }
