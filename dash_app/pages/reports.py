from datetime import date
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from dash import dcc, html, Input, Output, State, dash_table, callback, no_update
import dash_bootstrap_components as dbc

from dash_app.components import (
    default_date_range,
    create_filter_bar,
    create_stat_card,
    create_data_table,
    render_empty,
    status_badge,
)
from data_processing import (
    get_regions_df,
    get_coaches_df,
    get_appointments_df,
    get_schedules_df,
    get_reschedule_df,
    calculate_attendance_rate,
    calculate_capacity_utilization,
    calculate_hourly_distribution,
    get_prev_period_dates,
    compute_week_over_week,
    compute_period_over_period,
    get_multi_region_comparison,
)

PRIMARY_COLOR = "#1e88e5"
PRIMARY_LIGHT = "#64b5f6"
PRIMARY_DARK = "#1565c0"
COLORS = {
    "primary": "#1e88e5",
    "primary_light": "#64b5f6",
    "primary_dark": "#1565c0",
    "success": "#43a047",
    "warning": "#fb8c00",
    "danger": "#e53935",
    "info": "#00acc1",
    "secondary": "#78909c",
    "purple": "#8e24aa",
    "pink": "#d81b60",
    "teal": "#00897b",
}
RAINBOW_PALETTE = [
    "#1e88e5", "#43a047", "#fb8c00", "#e53935",
    "#8e24aa", "#00acc1", "#78909c", "#d81b60",
    "#00897b", "#f4511e", "#5e35b1", "#3949ab",
]


def _get_region_options():
    regions_df = get_regions_df()
    if regions_df.empty:
        return []
    return [
        {"label": row["region_name"], "value": int(row["id"])}
        for _, row in regions_df.iterrows()
    ]


def _pct_change(cur, prev):
    if prev > 0:
        return round((cur - prev) / prev * 100, 1)
    return None if cur == 0 else 100.0


def _build_extra_filters():
    dim_options = [
        {"label": "按日期", "value": "date"},
        {"label": "按区域", "value": "region"},
        {"label": "按教练", "value": "coach"},
    ]
    y_axis_options = [
        {"label": "到场率(%)", "value": "attendance_rate"},
        {"label": "预约数", "value": "total_appointments"},
        {"label": "到场数", "value": "attended"},
        {"label": "取消数", "value": "cancelled"},
        {"label": "旷约数", "value": "no_show"},
        {"label": "取消率(%)", "value": "cancel_rate"},
        {"label": "旷约率(%)", "value": "no_show_rate"},
    ]
    return [
        html.Div([
            html.Label("统计维度"),
            dcc.Dropdown(
                id="reports-dim",
                options=dim_options,
                value="date",
                clearable=False,
            )
        ], className="filter-item"),
        html.Div([
            html.Label("Y轴指标"),
            dcc.Dropdown(
                id="reports-y-metric",
                options=y_axis_options,
                value="attendance_rate",
                clearable=False,
            )
        ], className="filter-item"),
    ]


def _compute_kpis(appointments_df, schedules_df, reschedule_df,
                  compare_appt_df, compare_sched_df):
    if appointments_df.empty:
        return {
            "total_appointments": 0,
            "total_attended": 0,
            "total_cancelled": 0,
            "total_no_show": 0,
            "avg_attendance_rate": 0.0,
            "top_region": "-",
            "ta_trend": None,
            "atd_trend": None,
            "cnl_trend": None,
            "ns_trend": None,
            "ar_trend": None,
        }

    att_stats = calculate_attendance_rate(appointments_df)
    total_appointments = att_stats["total_appointments"].sum()
    total_attended = att_stats["attended"].sum()
    total_cancelled = att_stats["cancelled"].sum()
    total_no_show = att_stats["no_show"].sum()
    avg_attendance_rate = round(total_attended / total_appointments * 100, 1) if total_appointments > 0 else 0.0

    region_compare = get_multi_region_comparison(appointments_df, schedules_df)
    if not region_compare.empty:
        top_row = region_compare.sort_values("total_appointments", ascending=False).iloc[0]
        top_region = top_row["region_name"] if pd.notna(top_row["region_name"]) else "未知区域"
    else:
        top_region = "-"

    result = {
        "total_appointments": total_appointments,
        "total_attended": total_attended,
        "total_cancelled": total_cancelled,
        "total_no_show": total_no_show,
        "avg_attendance_rate": avg_attendance_rate,
        "top_region": top_region,
    }

    if not compare_appt_df.empty:
        cmp_att = calculate_attendance_rate(compare_appt_df)
        cmp_ta = cmp_att["total_appointments"].sum() if not cmp_att.empty else 0
        cmp_atd = cmp_att["attended"].sum() if not cmp_att.empty else 0
        cmp_cnl = cmp_att["cancelled"].sum() if not cmp_att.empty else 0
        cmp_ns = cmp_att["no_show"].sum() if not cmp_att.empty else 0
        cmp_ar = round(cmp_atd / cmp_ta * 100, 1) if cmp_ta > 0 else 0.0

        result["ta_trend"] = _pct_change(total_appointments, cmp_ta)
        result["atd_trend"] = _pct_change(total_attended, cmp_atd)
        result["cnl_trend"] = _pct_change(total_cancelled, cmp_cnl)
        result["ns_trend"] = _pct_change(total_no_show, cmp_ns)
        result["ar_trend"] = round(avg_attendance_rate - cmp_ar, 1) if (avg_attendance_rate > 0 or cmp_ar > 0) else None
    else:
        result["ta_trend"] = None
        result["atd_trend"] = None
        result["cnl_trend"] = None
        result["ns_trend"] = None
        result["ar_trend"] = None

    return result


def _build_trend_figure(appointments_df, compare_appt_df,
                        dimension, y_metric, compare_mode):
    if appointments_df.empty:
        return go.Figure()

    att_stats = calculate_attendance_rate(appointments_df)

    if dimension == "date":
        group_col = "appointment_date"
        x_label = "日期"
    elif dimension == "region":
        group_col = "region_name"
        x_label = "区域"
    else:
        if "coach_name" in appointments_df.columns:
            coach_group = appointments_df.groupby("coach_name", dropna=False).agg(
                total_appointments=("appointment_no", "nunique"),
                attended=("status", lambda x: (x == "attended").sum()),
                cancelled=("status", lambda x: (x == "cancelled").sum()),
                no_show=("status", lambda x: (x == "no_show").sum()),
            ).reset_index()
            coach_group["coach_name"] = coach_group["coach_name"].fillna("未知教练")
            coach_group["attendance_rate"] = np.where(
                coach_group["total_appointments"] > 0,
                coach_group["attended"] / coach_group["total_appointments"] * 100, 0
            )
            coach_group["cancel_rate"] = np.where(
                coach_group["total_appointments"] > 0,
                coach_group["cancelled"] / coach_group["total_appointments"] * 100, 0
            )
            coach_group["no_show_rate"] = np.where(
                coach_group["total_appointments"] > 0,
                coach_group["no_show"] / coach_group["total_appointments"] * 100, 0
            )
            att_stats = coach_group
            group_col = "coach_name"
            x_label = "教练"
        else:
            group_col = "appointment_date"
            x_label = "日期"

    y_label_map = {
        "attendance_rate": "到场率(%)",
        "total_appointments": "预约数",
        "attended": "到场数",
        "cancelled": "取消数",
        "no_show": "旷约数",
        "cancel_rate": "取消率(%)",
        "no_show_rate": "旷约率(%)",
    }
    y_label = y_label_map.get(y_metric, y_metric)

    fig = go.Figure()

    if dimension == "region":
        regions = att_stats[group_col].fillna("未知区域").unique()
        for i, region in enumerate(regions):
            region_data = att_stats[att_stats[group_col].fillna("未知区域") == region]
            color_idx = i % len(RAINBOW_PALETTE)
            fig.add_trace(go.Scatter(
                x=region_data["appointment_date"],
                y=region_data[y_metric] if y_metric in region_data.columns else region_data["total_appointments"],
                mode="lines+markers",
                name=str(region),
                line=dict(color=RAINBOW_PALETTE[color_idx], width=2.5),
                marker=dict(size=6, color=RAINBOW_PALETTE[color_idx]),
            ))
    else:
        sort_col = group_col
        if dimension == "date":
            att_stats = att_stats.sort_values(sort_col)
        fig.add_trace(go.Scatter(
            x=att_stats[group_col],
            y=att_stats[y_metric] if y_metric in att_stats.columns else att_stats["total_appointments"],
            mode="lines+markers",
            name="本期",
            line=dict(color=PRIMARY_COLOR, width=3),
            marker=dict(size=7, color=PRIMARY_COLOR),
            fill="tozeroy",
            fillcolor=f"rgba(30, 136, 229, 0.08)",
        ))

    if compare_mode != "none" and not compare_appt_df.empty and dimension == "date":
        cmp_att = calculate_attendance_rate(compare_appt_df)
        if not cmp_att.empty:
            cmp_att = cmp_att.sort_values("appointment_date")

            compare_label_map = {
                "week": "上周",
                "month": "上期",
                "yoy": "去年同期",
            }
            cmp_label = compare_label_map.get(compare_mode, "对比期")

            cur_dates = pd.to_datetime(att_stats["appointment_date"])
            cmp_dates = pd.to_datetime(cmp_att["appointment_date"])
            if len(cmp_dates) > 0 and len(cur_dates) > 0:
                days_offset = (cur_dates.min() - cmp_dates.min()).days
                aligned_x = cmp_dates + pd.Timedelta(days=days_offset)
                y_col = y_metric if y_metric in cmp_att.columns else "total_appointments"

                fig.add_trace(go.Scatter(
                    x=aligned_x,
                    y=cmp_att[y_col],
                    mode="lines+markers",
                    name=cmp_label,
                    line=dict(color=COLORS["secondary"], width=2, dash="dash"),
                    marker=dict(size=5, color=COLORS["secondary"]),
                    opacity=0.7,
                ))

    title_suffix = ""
    if compare_mode != "none":
        cl = {"week": "环比上周", "month": "环比上月", "yoy": "同比去年"}.get(compare_mode, "")
        title_suffix = f" ({cl})"

    fig.update_layout(
        title=None,
        xaxis_title=x_label,
        yaxis_title=y_label,
        hovermode="x unified" if dimension == "date" else "closest",
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=30, b=10),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=11),
        ),
    )
    fig.update_xaxes(
        showgrid=True, gridwidth=1, gridcolor="#f0f0f0", linecolor="#e0e0e0",
        tickangle=-30 if dimension != "date" else 0,
    )
    fig.update_yaxes(
        showgrid=True, gridwidth=1, gridcolor="#f0f0f0", linecolor="#e0e0e0",
        zeroline=True, zerolinecolor="#e0e0e0",
    )

    return fig


def _build_radar_figure(appointments_df, schedules_df, reschedule_df):
    if appointments_df.empty:
        return go.Figure()

    region_compare = get_multi_region_comparison(appointments_df, schedules_df)
    if region_compare.empty:
        return go.Figure()

    cap_util = calculate_capacity_utilization(schedules_df)
    if not cap_util.empty:
        region_cap = cap_util.groupby("region_name").agg(
            util=("utilization_rate", "mean")
        ).reset_index()
        region_compare = region_compare.merge(
            region_cap, on="region_name", how="left"
        )
    else:
        region_compare["util"] = 0

    if not reschedule_df.empty and "old_region_id" not in reschedule_df.columns:
        pass

    region_compare["region_name"] = region_compare["region_name"].fillna("未知区域")
    region_compare["util"] = region_compare["util"].fillna(0)

    radar_dims = ["attendance_rate", "cancel_rate", "reschedule_rate", "util"]
    radar_labels = ["到场率", "取消率", "改约率", "容量利用率"]

    regions = region_compare["region_name"].tolist()
    if len(regions) > 1:
        fig = go.Figure()
        for i, (_, row) in enumerate(region_compare.iterrows()):
            color_idx = i % len(RAINBOW_PALETTE)
            values = []
            for dim in radar_dims:
                v = row.get(dim, 0)
                if pd.isna(v):
                    v = 0
                values.append(min(v, 100))
            fig.add_trace(go.Scatterpolar(
                r=values + [values[0]],
                theta=radar_labels + [radar_labels[0]],
                fill="toself",
                name=str(row["region_name"]),
                line=dict(color=RAINBOW_PALETTE[color_idx], width=2),
                fillcolor=f"rgba{tuple(int(RAINBOW_PALETTE[color_idx].lstrip('#')[j:j+2], 16) for j in (0, 2, 4)) + (0.15,)}",
                opacity=0.85,
            ))
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100],
                    tickfont=dict(size=10),
                ),
                angularaxis=dict(
                    tickfont=dict(size=12),
                ),
            ),
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=-0.1,
                xanchor="center",
                x=0.5,
                font=dict(size=11),
            ),
            plot_bgcolor="white",
            paper_bgcolor="white",
            margin=dict(l=30, r=30, t=10, b=30),
        )
    else:
        metrics = []
        values = []
        colors_list = []
        label_map = {
            "attendance_rate": "到场率",
            "cancel_rate": "取消率",
            "reschedule_rate": "改约率",
            "util": "容量利用率",
        }
        for dim, lbl in zip(radar_dims, radar_labels):
            v = region_compare.iloc[0].get(dim, 0)
            if pd.isna(v):
                v = 0
            metrics.append(lbl)
            values.append(min(v, 100))
            colors_list.append(PRIMARY_COLOR if dim != "cancel_rate" else COLORS["warning"])

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=metrics,
            y=values,
            marker_color=colors_list,
            marker_line_color=[PRIMARY_DARK if c == PRIMARY_COLOR else "#e65100" for c in colors_list],
            marker_line_width=1.5,
            text=[f"{v:.1f}%" for v in values],
            textposition="outside",
            width=0.55,
            opacity=0.9,
        ))
        fig.update_layout(
            title=None,
            xaxis_title="指标",
            yaxis_title="百分比(%)",
            plot_bgcolor="white",
            paper_bgcolor="white",
            margin=dict(l=10, r=10, t=10, b=10),
            yaxis=dict(range=[0, max(100, max(values) * 1.2) if values else 100]),
        )
        fig.update_yaxes(
            showgrid=True, gridwidth=1, gridcolor="#f0f0f0", linecolor="#e0e0e0",
        )
        fig.update_xaxes(linecolor="#e0e0e0")

    return fig


def _build_heatmap_figure(appointments_df):
    if appointments_df.empty:
        return go.Figure()

    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekday_cn = {
        "Monday": "周一", "Tuesday": "周二", "Wednesday": "周三",
        "Thursday": "周四", "Friday": "周五", "Saturday": "周六", "Sunday": "周日",
    }

    grouped = appointments_df.groupby(["weekday", "hour"]).agg(
        total=("appointment_no", "nunique"),
        attended=("status", lambda x: (x == "attended").sum()),
    ).reset_index()
    grouped["attendance_rate"] = np.where(
        grouped["total"] > 0,
        grouped["attended"] / grouped["total"] * 100,
        0
    )

    pivot = grouped.pivot(index="weekday", columns="hour", values="attendance_rate").fillna(0)
    for wd in weekday_order:
        if wd not in pivot.index:
            pivot.loc[wd] = 0
    pivot = pivot.reindex(weekday_order)

    for h in range(6, 23):
        if h not in pivot.columns:
            pivot[h] = 0
    pivot = pivot.reindex(sorted(pivot.columns), axis=1)

    hour_labels = [f"{int(h):02d}:00" for h in pivot.columns]
    weekday_labels = [weekday_cn.get(w, w) for w in pivot.index]

    colorscale = [
        [0.0, "#ffebee"],
        [0.2, "#ffcdd2"],
        [0.4, "#90caf9"],
        [0.6, "#42a5f5"],
        [0.8, "#1e88e5"],
        [1.0, "#0d47a1"],
    ]

    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=hour_labels,
        y=weekday_labels,
        colorscale=colorscale,
        zmin=0,
        zmax=100,
        hovertemplate="时段: %{x}<br>星期: %{y}<br>到场率: %{z:.1f}%<extra></extra>",
        showscale=True,
        colorbar=dict(
            title="到场率(%)",
            thickness=15,
            titleside="right",
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
    fig.update_xaxes(linecolor="#e0e0e0", tickangle=-30)
    fig.update_yaxes(linecolor="#e0e0e0")

    return fig


def _build_region_table(appointments_df, schedules_df, compare_appt_df, compare_sched_df, trend_label):
    if appointments_df.empty:
        return render_empty("暂无区域对比数据")

    region_stats = get_multi_region_comparison(appointments_df, schedules_df)
    if region_stats.empty:
        return render_empty("暂无区域对比数据")

    cap_stats = calculate_capacity_utilization(schedules_df)
    if not cap_stats.empty:
        cap_region = cap_stats.groupby("region_name").agg(
            capacity_util=("utilization_rate", "mean"),
        ).reset_index()
        region_stats = region_stats.merge(cap_region, on="region_name", how="left")
    else:
        region_stats["capacity_util"] = 0

    region_stats["region_name"] = region_stats["region_name"].fillna("未知区域")
    region_stats["capacity_util"] = region_stats["capacity_util"].fillna(0)

    max_ar = max(region_stats["attendance_rate"].max(), 1)

    compare_regions = pd.DataFrame()
    if not compare_appt_df.empty:
        compare_regions = get_multi_region_comparison(compare_appt_df, compare_sched_df)

    def _arrow(val):
        if val is None or pd.isna(val):
            return '<span style="color:#999">—</span>'
        if val > 0.1:
            return f'<span style="color:#43a047;font-weight:600">↑ {abs(val):.1f}%</span>'
        elif val < -0.1:
            return f'<span style="color:#e53935;font-weight:600">↓ {abs(val):.1f}%</span>'
        else:
            return f'<span style="color:#78909c">→ {abs(val):.1f}%</span>'

    rows = []
    for _, row in region_stats.iterrows():
        ar = row.get("attendance_rate", 0)
        ar = 0 if pd.isna(ar) else ar
        bar_pct = min(ar / max_ar * 100, 100)

        ar_trend = None
        if not compare_regions.empty:
            cmp_row = compare_regions[compare_regions["region_name"] == row["region_name"]]
            if not cmp_row.empty:
                cmp_ar = cmp_row.iloc[0].get("attendance_rate", 0)
                cmp_ar = 0 if pd.isna(cmp_ar) else cmp_ar
                ar_trend = round(ar - cmp_ar, 1) if (ar > 0 or cmp_ar > 0) else None

        cancel_pct = row.get("cancel_rate", 0)
        cancel_pct = 0 if pd.isna(cancel_pct) else cancel_pct
        cancel_trend = None
        if not compare_regions.empty:
            cmp_row = compare_regions[compare_regions["region_name"] == row["region_name"]]
            if not cmp_row.empty:
                cmp_cancel = cmp_row.iloc[0].get("cancel_rate", 0)
                cmp_cancel = 0 if pd.isna(cmp_cancel) else cmp_cancel
                cancel_trend = round(cancel_pct - cmp_cancel, 1) if (cancel_pct > 0 or cmp_cancel > 0) else None

        ta = row.get("total_appointments", 0)
        ta = 0 if pd.isna(ta) else int(ta)
        ta_trend = None
        if not compare_regions.empty:
            cmp_row = compare_regions[compare_regions["region_name"] == row["region_name"]]
            if not cmp_row.empty:
                cmp_ta = cmp_row.iloc[0].get("total_appointments", 0)
                cmp_ta = 0 if pd.isna(cmp_ta) else int(cmp_ta)
                ta_trend = _pct_change(ta, cmp_ta)

        bar_color = "#43a047" if ar >= 85 else ("#1e88e5" if ar >= 70 else ("#fb8c00" if ar >= 55 else "#e53935"))

        capacity_val = row.get("capacity_util", 0)
        capacity_val = 0 if pd.isna(capacity_val) else capacity_val

        rows.append(html.Tr([
            html.Td(row["region_name"], style={"font-weight": "600", "color": "#333"}),
            html.Td([
                html.Div([
                    html.Div(
                        style={
                            "width": f"{bar_pct:.1f}%",
                            "height": "18px",
                            "background": f"linear-gradient(90deg, {bar_color} 0%, {bar_color}dd 100%)",
                            "borderRadius": "4px",
                            "minWidth": "2px",
                        }
                    ),
                ], style={
                    "display": "flex",
                    "alignItems": "center",
                    "gap": "10px",
                    "width": "100%",
                }),
                html.Span(
                    f"{ar:.1f}%",
                    style={"fontWeight": "600", "color": bar_color, "marginLeft": "8px", "whiteSpace": "nowrap"}
                ),
            ], style={"minWidth": "240px", "verticalAlign": "middle"}),
            html.Td(f"{ta:,}", style={"textAlign": "right", "fontWeight": "500"}),
            html.Td(dcc.Markdown(_arrow(ta_trend)) if trend_label else html.Span("—", style={"color": "#999"}),
                    style={"textAlign": "center"}),
            html.Td(f"{cancel_pct:.1f}%", style={"textAlign": "right", "color": "#fb8c00", "fontWeight": "500"}),
            html.Td(dcc.Markdown(_arrow(cancel_trend)) if trend_label else html.Span("—", style={"color": "#999"}),
                    style={"textAlign": "center"}),
            html.Td(f"{capacity_val:.1f}%", style={"textAlign": "right", "color": "#00acc1", "fontWeight": "500"}),
            html.Td(dcc.Markdown(_arrow(ar_trend)) if trend_label else html.Span("—", style={"color": "#999"}),
                    style={"textAlign": "center"}),
        ], style={
            "borderBottom": "1px solid #f0f0f0",
            "transition": "background 0.2s",
        }))

    table_header = html.Thead(html.Tr([
        html.Th("门店区域", style={"textAlign": "left", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("到场率进度", style={"textAlign": "left", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("预约数", style={"textAlign": "right", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("预约同环比" if trend_label else "预约变化", style={"textAlign": "center", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("取消率", style={"textAlign": "right", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("取消同环比" if trend_label else "取消变化", style={"textAlign": "center", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("容量利用", style={"textAlign": "right", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
        html.Th("到场率同环比" if trend_label else "到场率变化", style={"textAlign": "center", "padding": "12px", "background": "#fafafa", "color": "#757575", "fontSize": "12px", "fontWeight": "600", "borderBottom": "2px solid #e0e0e0"}),
    ]))

    return html.Div([
        html.Div([
            html.Div([
                html.Div("区域多维对比", className="card-title"),
                html.Div(
                    f"按门店区域对比核心运营指标，颜色条表示到场率进度"
                    + (f" | 对比模式: {trend_label}" if trend_label else ""),
                    className="card-subtitle",
                ),
            ], className="card-header"),
            html.Div([
                html.Table(
                    [table_header, html.Tbody(rows)],
                    style={
                        "width": "100%",
                        "borderCollapse": "collapse",
                        "fontSize": "13px",
                    }
                )
            ], style={"overflowX": "auto", "padding": "8px 0"}),
        ], className="card"),
    ])


def _get_export_dataframe(appointments_df, schedules_df, reschedule_df):
    if appointments_df.empty:
        return pd.DataFrame()

    export_df = appointments_df.copy()
    cols_map = {
        "appointment_no": "预约编号",
        "appointment_date": "预约日期",
        "start_time": "开始时间",
        "end_time": "结束时间",
        "region_name": "门店区域",
        "coach_name": "教练",
        "member_name": "会员姓名",
        "member_code": "会员号",
        "status": "预约状态",
        "time_slot": "时段",
        "weekday": "星期",
    }
    for old, new in cols_map.items():
        if old in export_df.columns:
            export_df = export_df.rename(columns={old: new})

    keep_cols = [v for v in cols_map.values() if v in export_df.columns]
    export_df = export_df[keep_cols]

    status_cn = {
        "booked": "已预约",
        "attended": "已到场",
        "cancelled": "已取消",
        "no_show": "未到场",
        "completed": "已完成",
    }
    if "预约状态" in export_df.columns:
        export_df["预约状态"] = export_df["预约状态"].map(lambda s: status_cn.get(str(s).lower(), s))

    weekday_cn = {
        "Monday": "周一", "Tuesday": "周二", "Wednesday": "周三",
        "Thursday": "周四", "Friday": "周五", "Saturday": "周六", "Sunday": "周日",
    }
    if "星期" in export_df.columns:
        export_df["星期"] = export_df["星期"].map(lambda w: weekday_cn.get(str(w), w))

    return export_df


def layout():
    start_date, end_date = default_date_range(30)
    region_options = _get_region_options()
    extra_filters = _build_extra_filters()
    return html.Div([
        dcc.Store(id="reports-current-appt-store"),
            dcc.Store(id="reports-current-sched-store"),
            dcc.Store(id="reports-compare-appt-store"),
            dcc.Store(id="reports-compare-sched-store"),
            dcc.Store(id="reports-reschedule-store"),
            dcc.Download(id="reports-download-csv"),

            html.Div([
                html.H1("📈 综合报表分析"),
                html.P(
                    "到场率/日期/区域多维对比分析 | 支持同环比对比、热力图分布与数据导出",
                    style={"margin": "4px 0 0 0", "color": "#757575", "fontSize": "14px"}
                ),
            ], className="page-header"),

            create_filter_bar(
                start_date_default=start_date,
                end_date_default=end_date,
                region_options=region_options,
                extra_filters=extra_filters,
                show_compare=True,
            ),

            html.Div([
                html.Div([
                    dbc.Button(
                        [html.Span("📥 ", style={"marginRight": "6px"}), "导出CSV"],
                        id="reports-export-btn",
                        color="primary",
                        outline=True,
                        size="sm",
                        style={
                            "background": "white",
                            "border": f"2px solid {PRIMARY_COLOR}",
                            "color": PRIMARY_COLOR,
                            "fontWeight": "600",
                            "padding": "8px 18px",
                            "borderRadius": "8px",
                            "transition": "all 0.2s",
                        }
                    ),
                ], style={
                    "display": "flex",
                    "justifyContent": "flex-end",
                    "marginBottom": "16px",
                })
            ]),

            html.Div(id="reports-stats-grid", className="stats-grid"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("到场率趋势对比", className="card-title"),
                        html.Div(
                            "支持按日期/区域/教练多维度展示，可切换同环比对比模式",
                            className="card-subtitle",
                        ),
                    ], className="card-header"),
                    html.Div(id="reports-trend-chart", className="chart-container"),
                ], className="card"),
            ]),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("区域多维能力画像", className="card-title"),
                        html.Div(
                            "雷达图对比各区域到场率/取消率/改约率/容量利用率",
                            className="card-subtitle",
                        ),
                    ], className="card-header"),
                    html.Div(id="reports-radar-chart", className="chart-container"),
                ], className="card"),

                html.Div([
                    html.Div([
                        html.Div("星期×时段 到场率热力图", className="card-title"),
                        html.Div(
                            "高密度时段识别与到场率分布洞察",
                            className="card-subtitle",
                        ),
                    ], className="card-header"),
                    html.Div(id="reports-heatmap-chart", className="chart-container"),
                ], className="card"),
            ], className="grid-2"),

            html.Div(id="reports-region-table"),

        ])


def register_callbacks(app):
    @app.callback(
        [
            Output("reports-current-appt-store", "data"),
            Output("reports-current-sched-store", "data"),
            Output("reports-compare-appt-store", "data"),
            Output("reports-compare-sched-store", "data"),
            Output("reports-reschedule-store", "data"),
        ],
        [
            Input("filter-start-date", "date"),
            Input("filter-end-date", "date"),
            Input("filter-region", "value"),
            Input("filter-compare-mode", "value"),
        ],
        prevent_initial_call=False,
    )
    def load_reports_data(start_date_str, end_date_str, region_ids, compare_mode):
        if not start_date_str or not end_date_str:
            return {}, {}, {}, {}, {}

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        cur_appt = get_appointments_df(start_date, end_date, region_ids)
        cur_sched = get_schedules_df(start_date, end_date, region_ids)
        cur_resched = get_reschedule_df(start_date, end_date)

        cur_appt_data = cur_appt.to_dict("records") if not cur_appt.empty else {}
        cur_sched_data = cur_sched.to_dict("records") if not cur_sched.empty else {}
        resched_data = cur_resched.to_dict("records") if not cur_resched.empty else {}

        cmp_appt_data = {}
        cmp_sched_data = {}
        if compare_mode and compare_mode != "none":
            prev_start, prev_end = get_prev_period_dates(start_date, end_date, compare_mode)
            cmp_appt = get_appointments_df(prev_start, prev_end, region_ids)
            cmp_sched = get_schedules_df(prev_start, prev_end, region_ids)
            cmp_appt_data = cmp_appt.to_dict("records") if not cmp_appt.empty else {}
            cmp_sched_data = cmp_sched.to_dict("records") if not cmp_sched.empty else {}

        return cur_appt_data, cur_sched_data, cmp_appt_data, cmp_sched_data, resched_data

    @app.callback(
        [
            Output("reports-stats-grid", "children"),
            Output("reports-trend-chart", "children"),
            Output("reports-radar-chart", "children"),
            Output("reports-heatmap-chart", "children"),
            Output("reports-region-table", "children"),
        ],
        [
            Input("reports-current-appt-store", "data"),
            Input("reports-current-sched-store", "data"),
            Input("reports-compare-appt-store", "data"),
            Input("reports-compare-sched-store", "data"),
            Input("reports-reschedule-store", "data"),
            Input("reports-dim", "value"),
            Input("reports-y-metric", "value"),
            Input("filter-compare-mode", "value"),
        ],
        prevent_initial_call=False,
    )
    def render_reports(
        cur_appt_data, cur_sched_data,
        cmp_appt_data, cmp_sched_data, resched_data,
        dimension, y_metric, compare_mode
    ):
        cur_appt = pd.DataFrame(cur_appt_data) if cur_appt_data else pd.DataFrame()
        cur_sched = pd.DataFrame(cur_sched_data) if cur_sched_data else pd.DataFrame()
        cmp_appt = pd.DataFrame(cmp_appt_data) if cmp_appt_data else pd.DataFrame()
        cmp_sched = pd.DataFrame(cmp_sched_data) if cmp_sched_data else pd.DataFrame()
        resched = pd.DataFrame(resched_data) if resched_data else pd.DataFrame()

        trend_label_map = {
            "none": None,
            "week": "环比上周",
            "month": "环比上月",
            "yoy": "同比去年",
        }
        trend_label = trend_label_map.get(compare_mode or "none", None)

        kpis = _compute_kpis(cur_appt, cur_sched, resched, cmp_appt, cmp_sched)

        def _safe_int(v):
            try:
                return f"{int(v):,}"
            except (ValueError, TypeError):
                return str(v)

        stat_cards = [
            create_stat_card(
                label="总预约数",
                value=_safe_int(kpis["total_appointments"]),
                trend_value=kpis.get("ta_trend"),
                trend_label=trend_label,
            ),
            create_stat_card(
                label="实到场数",
                value=_safe_int(kpis["total_attended"]),
                trend_value=kpis.get("atd_trend"),
                trend_label=trend_label,
            ),
            create_stat_card(
                label="取消数",
                value=_safe_int(kpis["total_cancelled"]),
                trend_value=kpis.get("cnl_trend"),
                trend_label=trend_label,
            ),
            create_stat_card(
                label="旷约数",
                value=_safe_int(kpis["total_no_show"]),
                trend_value=kpis.get("ns_trend"),
                trend_label=trend_label,
            ),
            create_stat_card(
                label="平均到场率",
                value=f"{kpis['avg_attendance_rate']:.1f}",
                trend_value=kpis.get("ar_trend"),
                trend_label=trend_label,
                value_suffix="%",
            ),
            create_stat_card(
                label="TOP 区域",
                value=str(kpis["top_region"]),
                value_prefix="🏆 ",
            ),
        ]

        if cur_appt.empty:
            empty_fig = go.Figure(layout=dict(
                annotations=[dict(
                    text="暂无数据",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5,
                    showarrow=False,
                    font=dict(size=20, color="#999"),
                )],
                plot_bgcolor="white",
                paper_bgcolor="white",
                margin=dict(l=10, r=10, t=10, b=10),
            ))
            empty_graph = dcc.Graph(
                figure=empty_fig,
                style={"height": "360px"},
                config={"displayModeBar": False, "responsive": True},
            )
            region_table = render_empty("暂无区域对比数据，请调整筛选条件")
            return stat_cards, empty_graph, empty_graph, empty_graph, region_table

        trend_fig = _build_trend_figure(cur_appt, cmp_appt, dimension, y_metric, compare_mode or "none")
        radar_fig = _build_radar_figure(cur_appt, cur_sched, resched)
        heatmap_fig = _build_heatmap_figure(cur_appt)

        trend_graph = dcc.Graph(
            figure=trend_fig,
            style={"height": "380px"},
            config={"displayModeBar": False, "responsive": True},
        )
        radar_graph = dcc.Graph(
            figure=radar_fig,
            style={"height": "420px"},
            config={"displayModeBar": False, "responsive": True},
        )
        heatmap_graph = dcc.Graph(
            figure=heatmap_fig,
            style={"height": "420px"},
            config={"displayModeBar": False, "responsive": True},
        )

        region_table = _build_region_table(cur_appt, cur_sched, cmp_appt, cmp_sched, trend_label)

        return stat_cards, trend_graph, radar_graph, heatmap_graph, region_table

    @app.callback(
        Output("reports-download-csv", "data"),
        Input("reports-export-btn", "n_clicks"),
        State("reports-current-appt-store", "data"),
        State("reports-current-sched-store", "data"),
        State("reports-reschedule-store", "data"),
        State("filter-start-date", "date"),
        State("filter-end-date", "date"),
        prevent_initial_call=True,
    )
    def export_csv(n_clicks, cur_appt_data, cur_sched_data, resched_data, start_str, end_str):
        if not n_clicks:
            return no_update

        cur_appt = pd.DataFrame(cur_appt_data) if cur_appt_data else pd.DataFrame()
        cur_sched = pd.DataFrame(cur_sched_data) if cur_sched_data else pd.DataFrame()
        resched = pd.DataFrame(resched_data) if resched_data else pd.DataFrame()

        export_df = _get_export_dataframe(cur_appt, cur_sched, resched)

        timestamp = date.today().isoformat()
        if start_str and end_str:
            fname = f"综合报表_{start_str}_至_{end_str}_{timestamp}.csv"
        else:
            fname = f"综合报表_{timestamp}.csv"

        return dcc.send_data_frame(
            export_df.to_csv,
            filename=fname,
            index=False,
            encoding="utf-8-sig",
        )


def register_page():
    return {
        "layout": layout,
        "register_callbacks": register_callbacks,
    }
