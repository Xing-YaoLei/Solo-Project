from datetime import date, datetime, timedelta
import numpy as np
import pandas as pd
import plotly.graph_objs as go
from dash import dcc, html, Input, Output, State, callback, no_update
import dash_bootstrap_components as dbc

from dash_app.components import (
    create_filter_bar,
    create_stat_card,
    default_date_range,
    render_empty,
)
from data_processing import (
    get_regions_df,
    get_schedules_df,
    calculate_capacity_utilization,
    get_prev_period_dates,
    compute_period_over_period,
)

THEME_COLOR = "#1e88e5"
THEME_COLOR_LIGHT = "#64b5f6"
THEME_COLOR_DARK = "#1565c0"
COMPARE_COLOR = "#ff7043"
COMPARE_COLOR_LIGHT = "#ffab91"


def _build_region_options():
    regions_df = get_regions_df()
    if regions_df.empty:
        return []
    return [
        {"label": row["region_name"], "value": int(row["id"])}
        for _, row in regions_df.iterrows()
    ]


def _compute_kpis(schedules_df: pd.DataFrame) -> dict:
    if schedules_df.empty:
        return {
            "bookable_slots": 0,
            "utilization_rate": 0.0,
            "over_capacity_slots": 0,
        }

    cap_df = calculate_capacity_utilization(schedules_df)
    bookable_slots = int(cap_df["total_slots"].sum())

    total_max = cap_df["total_max_capacity"].sum()
    total_actual = cap_df["total_actual_capacity"].sum()
    utilization_rate = (total_actual / total_max * 100) if total_max > 0 else 0.0

    over_capacity_slots = int(
        (cap_df["utilization_rate"] > 100).sum()
    )

    return {
        "bookable_slots": bookable_slots,
        "utilization_rate": round(utilization_rate, 1),
        "over_capacity_slots": over_capacity_slots,
    }


def _compute_heatmap_data(cap_df: pd.DataFrame) -> pd.DataFrame:
    if cap_df.empty:
        return pd.DataFrame()

    pivot = cap_df.pivot_table(
        index="time_slot",
        columns="course_date",
        values="utilization_rate",
        aggfunc="mean",
        fill_value=0,
    )
    pivot = pivot.sort_index()
    return pivot


def _build_heatmap_figure(pivot_df: pd.DataFrame, compare_pivot_df: pd.DataFrame = None):
    if pivot_df.empty:
        return go.Figure()

    dates = [str(d) for d in pivot_df.columns]
    slots = list(pivot_df.index)
    z_values = pivot_df.values

    fig = go.Figure()
    fig.add_trace(go.Heatmap(
        z=z_values,
        x=dates,
        y=slots,
        colorscale=[
            [0.0, "#e3f2fd"],
            [0.25, "#90caf9"],
            [0.5, THEME_COLOR],
            [0.75, "#0d47a1"],
            [1.0, "#b71c1c"],
        ],
        zmin=0,
        zmax=120,
        colorbar=dict(
            title="利用率(%)",
            titleside="right",
        ),
        hovertemplate=(
            "日期: %{x}<br>"
            "时段: %{y}<br>"
            "利用率: %{z:.1f}%<extra></extra>"
        ),
    ))

    fig.update_layout(
        title=dict(
            text="容量热力图 (日期 × 时段)",
            font=dict(size=16, color="#333"),
        ),
        xaxis=dict(
            title="日期",
            tickangle=-45,
            tickfont=dict(size=10),
        ),
        yaxis=dict(
            title="时段",
            tickfont=dict(size=10),
        ),
        height=480,
        margin=dict(l=60, r=40, t=60, b=100),
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    return fig


def _compute_trend_data(cap_df: pd.DataFrame) -> pd.DataFrame:
    if cap_df.empty:
        return pd.DataFrame()

    daily = cap_df.groupby("course_date").agg(
        total_max=("total_max_capacity", "sum"),
        total_actual=("total_actual_capacity", "sum"),
        total_slots=("total_slots", "sum"),
    ).reset_index()
    daily["utilization_rate"] = np.where(
        daily["total_max"] > 0,
        daily["total_actual"] / daily["total_max"] * 100,
        0,
    )
    return daily


def _build_trend_figure(daily_df: pd.DataFrame, compare_daily_df: pd.DataFrame = None,
                        compare_mode: str = "none"):
    if daily_df.empty:
        return go.Figure()

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=daily_df["course_date"],
        y=daily_df["utilization_rate"],
        mode="lines+markers",
        name="当前利用率",
        line=dict(color=THEME_COLOR, width=2.5),
        marker=dict(size=6, color=THEME_COLOR),
        yaxis="y",
    ))

    if compare_mode != "none" and compare_daily_df is not None and not compare_daily_df.empty:
        compare_label_map = {
            "week": "上周",
            "month": "上月",
            "yoy": "去年同期",
        }
        compare_label = compare_label_map.get(compare_mode, "对比期")

        aligned_x = daily_df["course_date"].tolist()
        aligned_y = compare_daily_df["utilization_rate"].tolist()

        if len(aligned_y) < len(aligned_x):
            aligned_y = aligned_y + [np.nan] * (len(aligned_x) - len(aligned_y))
        elif len(aligned_y) > len(aligned_x):
            aligned_y = aligned_y[:len(aligned_x)]

        fig.add_trace(go.Scatter(
            x=aligned_x,
            y=aligned_y,
            mode="lines+markers",
            name=f"{compare_label}利用率",
            line=dict(color=COMPARE_COLOR, width=2, dash="dash"),
            marker=dict(size=5, color=COMPARE_COLOR),
            yaxis="y",
        ))

        fig.add_trace(go.Scatter(
            x=list(range(len(aligned_x))),
            y=daily_df["total_slots"],
            mode="lines",
            name="当前时段数",
            line=dict(color=THEME_COLOR_LIGHT, width=1.5),
            yaxis="y2",
            opacity=0.5,
            showlegend=False,
        ))

    fig.update_layout(
        title=dict(
            text="容量利用率趋势" + (" (含同环比对比)" if compare_mode != "none" else ""),
            font=dict(size=16, color="#333"),
        ),
        xaxis=dict(
            title="日期",
            tickangle=-45,
        ),
        yaxis=dict(
            title="利用率(%)",
            side="left",
            range=[0, 120],
            showgrid=True,
            gridcolor="#f0f0f0",
        ),
        yaxis2=dict(
            title="时段数",
            side="right",
            overlaying="y",
            showgrid=False,
            range=[0, max(daily_df["total_slots"].max() * 1.2, 10)],
        ) if (compare_mode != "none" and not daily_df.empty) else None,
        height=400,
        margin=dict(l=60, r=60, t=60, b=100),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
        hovermode="x unified",
    )
    return fig


def _compute_region_comparison(schedules_df: pd.DataFrame) -> pd.DataFrame:
    if schedules_df.empty:
        return pd.DataFrame()

    cap_df = calculate_capacity_utilization(schedules_df)
    region_stats = cap_df.groupby("region_name").agg(
        total_slots=("total_slots", "sum"),
        total_max=("total_max_capacity", "sum"),
        total_actual=("total_actual_capacity", "sum"),
    ).reset_index()

    region_stats["utilization_rate"] = np.where(
        region_stats["total_max"] > 0,
        region_stats["total_actual"] / region_stats["total_max"] * 100,
        0,
    )
    region_stats["over_slots"] = cap_df.groupby("region_name").apply(
        lambda g: (g["utilization_rate"] > 100).sum()
    ).values
    return region_stats.sort_values("utilization_rate", ascending=False)


def _build_region_figure(region_df: pd.DataFrame, compare_region_df: pd.DataFrame = None,
                         compare_mode: str = "none"):
    if region_df.empty:
        return go.Figure()

    fig = go.Figure()

    regions = region_df["region_name"].tolist()
    fig.add_trace(go.Bar(
        x=regions,
        y=region_df["utilization_rate"],
        name="当前利用率",
        marker_color=THEME_COLOR,
        marker_line_color=THEME_COLOR_DARK,
        marker_line_width=1,
        opacity=0.85,
        text=[f"{v:.1f}%" for v in region_df["utilization_rate"]],
        textposition="outside",
    ))

    fig.add_trace(go.Scatter(
        x=regions,
        y=region_df["total_slots"],
        mode="lines+markers",
        name="时段数",
        yaxis="y2",
        line=dict(color=THEME_COLOR_LIGHT, width=2),
        marker=dict(size=8, symbol="circle"),
    ))

    if compare_mode != "none" and compare_region_df is not None and not compare_region_df.empty:
        compare_label_map = {
            "week": "上周",
            "month": "上月",
            "yoy": "去年同期",
        }
        compare_label = compare_label_map.get(compare_mode, "对比期")

        merged = region_df[["region_name", "utilization_rate"]].merge(
            compare_region_df[["region_name", "utilization_rate"]],
            on="region_name",
            how="left",
            suffixes=("_cur", "_cmp"),
        ).fillna(0)

        fig.add_trace(go.Bar(
            x=merged["region_name"],
            y=merged["utilization_rate_cmp"],
            name=f"{compare_label}利用率",
            marker_color=COMPARE_COLOR,
            marker_line_color="#d84315",
            marker_line_width=1,
            opacity=0.6,
            text=[f"{v:.1f}%" for v in merged["utilization_rate_cmp"]],
            textposition="outside",
        ))

    fig.update_layout(
        title=dict(
            text="按区域容量对比" + (" (含同环比对比)" if compare_mode != "none" else ""),
            font=dict(size=16, color="#333"),
        ),
        xaxis=dict(
            title="区域",
            tickangle=-30,
        ),
        yaxis=dict(
            title="利用率(%)",
            side="left",
            range=[0, 120],
            showgrid=True,
            gridcolor="#f0f0f0",
        ),
        yaxis2=dict(
            title="时段数",
            side="right",
            overlaying="y",
            showgrid=False,
            range=[0, max(region_df["total_slots"].max() * 1.2, 10)],
        ),
        barmode="group",
        height=400,
        margin=dict(l=60, r=60, t=60, b=100),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    return fig


def layout():
    start_date_str, end_date_str = default_date_range(days=30)
    region_options = _build_region_options()

    return html.Div([
        dcc.Store(id="capacity-current-schedules-store"),
        dcc.Store(id="capacity-compare-schedules-store"),

        html.Div(
            "📅 日历时段容量看板",
            className="page-header",
        ),

        create_filter_bar(
            start_date_default=start_date_str,
            end_date_default=end_date_str,
            region_options=region_options,
            show_compare=True,
        ),

        html.Div(
            id="capacity-kpi-row",
            className="kpi-row",
        ),

        html.Div([
            html.Div([
                dcc.Graph(
                    id="capacity-heatmap",
                    config={"responsive": True},
                ),
            ], className="chart-card chart-card-full"),
        ], className="chart-row"),

        html.Div([
            html.Div([
                dcc.Graph(
                    id="capacity-trend",
                    config={"responsive": True},
                ),
            ], className="chart-card chart-card-half"),
            html.Div([
                dcc.Graph(
                    id="capacity-region-compare",
                    config={"responsive": True},
                ),
            ], className="chart-card chart-card-half"),
        ], className="chart-row"),
    ], className="page-container")


def _register_callbacks(app):
    @app.callback(
        Output("capacity-current-schedules-store", "data"),
        Output("capacity-compare-schedules-store", "data"),
        Input("filter-start-date", "date"),
        Input("filter-end-date", "date"),
        Input("filter-region", "value"),
        Input("filter-compare-mode", "value"),
        prevent_initial_call=False,
    )
    def load_data(start_date_str, end_date_str, region_ids, compare_mode):
        if not start_date_str or not end_date_str:
            return {}, {}

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        current_df = get_schedules_df(start_date, end_date, region_ids)
        current_data = current_df.to_dict("records") if not current_df.empty else {}

        compare_data = {}
        if compare_mode and compare_mode != "none":
            prev_start, prev_end = get_prev_period_dates(start_date, end_date, compare_mode)
            compare_df = get_schedules_df(prev_start, prev_end, region_ids)
            compare_data = compare_df.to_dict("records") if not compare_df.empty else {}

        return current_data, compare_data

    @app.callback(
        Output("capacity-kpi-row", "children"),
        Input("capacity-current-schedules-store", "data"),
        Input("capacity-compare-schedules-store", "data"),
        Input("filter-compare-mode", "value"),
        prevent_initial_call=False,
    )
    def render_kpis(current_data, compare_data, compare_mode):
        current_df = pd.DataFrame(current_data) if current_data else pd.DataFrame()
        compare_df = pd.DataFrame(compare_data) if compare_data else pd.DataFrame()

        current_kpis = _compute_kpis(current_df)
        compare_kpis = _compute_kpis(compare_df)

        trend_map = {
            "week": "环比上周",
            "month": "环比上月",
            "yoy": "同比去年",
        }
        trend_label = trend_map.get(compare_mode, "") if compare_mode != "none" else None

        def _calc_pct_change(cur, cmp):
            if cmp == 0:
                return None if cur == 0 else 100.0
            return (cur - cmp) / cmp * 100.0

        slot_trend = _calc_pct_change(
            current_kpis["bookable_slots"], compare_kpis["bookable_slots"]
        ) if (compare_mode != "none" and trend_label) else None

        util_trend = (
            current_kpis["utilization_rate"] - compare_kpis["utilization_rate"]
        ) if (compare_mode != "none" and trend_label) else None

        over_trend = _calc_pct_change(
            current_kpis["over_capacity_slots"], compare_kpis["over_capacity_slots"]
        ) if (compare_mode != "none" and trend_label) else None

        return [
            create_stat_card(
                label="可预约时段数",
                value=current_kpis["bookable_slots"],
                trend_value=slot_trend,
                trend_label=trend_label,
                value_suffix=" 个",
            ),
            create_stat_card(
                label="容量利用率",
                value=f'{current_kpis["utilization_rate"]}',
                trend_value=util_trend,
                trend_label=trend_label,
                value_suffix=" %",
            ),
            create_stat_card(
                label="超额时段数",
                value=current_kpis["over_capacity_slots"],
                trend_value=over_trend,
                trend_label=trend_label,
                value_suffix=" 个",
            ),
        ]

    @app.callback(
        Output("capacity-heatmap", "figure"),
        Input("capacity-current-schedules-store", "data"),
        Input("capacity-compare-schedules-store", "data"),
        prevent_initial_call=False,
    )
    def render_heatmap(current_data, compare_data):
        current_df = pd.DataFrame(current_data) if current_data else pd.DataFrame()
        compare_df = pd.DataFrame(compare_data) if compare_data else pd.DataFrame()

        if current_df.empty:
            return go.Figure(layout=dict(
                title="容量热力图 (日期 × 时段)",
                annotations=[dict(
                    text="暂无数据",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5,
                    showarrow=False,
                    font=dict(size=20, color="#999"),
                )],
                height=480,
            ))

        cap_df = calculate_capacity_utilization(current_df)
        pivot = _compute_heatmap_data(cap_df)

        compare_pivot = None
        if not compare_df.empty:
            cmp_cap = calculate_capacity_utilization(compare_df)
            compare_pivot = _compute_heatmap_data(cmp_cap)

        return _build_heatmap_figure(pivot, compare_pivot)

    @app.callback(
        Output("capacity-trend", "figure"),
        Input("capacity-current-schedules-store", "data"),
        Input("capacity-compare-schedules-store", "data"),
        Input("filter-compare-mode", "value"),
        prevent_initial_call=False,
    )
    def render_trend(current_data, compare_data, compare_mode):
        current_df = pd.DataFrame(current_data) if current_data else pd.DataFrame()
        compare_df = pd.DataFrame(compare_data) if compare_data else pd.DataFrame()

        if current_df.empty:
            return go.Figure(layout=dict(
                title="容量利用率趋势",
                annotations=[dict(
                    text="暂无数据",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5,
                    showarrow=False,
                    font=dict(size=20, color="#999"),
                )],
                height=400,
            ))

        cap_df = calculate_capacity_utilization(current_df)
        daily = _compute_trend_data(cap_df)

        compare_daily = None
        if compare_mode != "none" and not compare_df.empty:
            cmp_cap = calculate_capacity_utilization(compare_df)
            compare_daily = _compute_trend_data(cmp_cap)

        return _build_trend_figure(daily, compare_daily, compare_mode or "none")

    @app.callback(
        Output("capacity-region-compare", "figure"),
        Input("capacity-current-schedules-store", "data"),
        Input("capacity-compare-schedules-store", "data"),
        Input("filter-compare-mode", "value"),
        prevent_initial_call=False,
    )
    def render_region_compare(current_data, compare_data, compare_mode):
        current_df = pd.DataFrame(current_data) if current_data else pd.DataFrame()
        compare_df = pd.DataFrame(compare_data) if compare_data else pd.DataFrame()

        if current_df.empty:
            return go.Figure(layout=dict(
                title="按区域容量对比",
                annotations=[dict(
                    text="暂无数据",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5,
                    showarrow=False,
                    font=dict(size=20, color="#999"),
                )],
                height=400,
            ))

        region_stats = _compute_region_comparison(current_df)

        compare_region_stats = None
        if compare_mode != "none" and not compare_df.empty:
            compare_region_stats = _compute_region_comparison(compare_df)

        return _build_region_figure(region_stats, compare_region_stats, compare_mode or "none")


def register_page():
    return {
        "layout": layout,
        "register_callbacks": _register_callbacks,
    }
