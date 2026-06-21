import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from dash import html, dcc
import dash_bootstrap_components as dbc


def build_calendar_timeslot_chart(reservation_df, capacity_df=None, conflicts=None):
    if reservation_df.empty:
        return go.Figure().update_layout(title="暂无预约数据")

    reservation_df = reservation_df.copy()
    reservation_df["time_slot_label"] = (
        reservation_df["time_slot_start"].astype(str) + "-" + reservation_df["time_slot_end"].astype(str)
    )

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,
        subplot_titles=("预约趋势", "到场率"),
        row_heights=[0.6, 0.4],
    )

    for area_name, group in reservation_df.groupby("scenic_area_name"):
        daily = group.groupby("reservation_date").agg(
            reserved_count=("reserved_count", "sum"),
            checked_in_count=("checked_in_count", "sum"),
            cancelled_count=("cancelled_count", "sum"),
        ).reset_index()

        fig.add_trace(
            go.Scatter(
                x=daily["reservation_date"],
                y=daily["reserved_count"],
                mode="lines+markers",
                name=f"{area_name}-预约",
                line=dict(width=2),
            ),
            row=1, col=1,
        )

        fig.add_trace(
            go.Scatter(
                x=daily["reservation_date"],
                y=daily["checked_in_count"],
                mode="lines+markers",
                name=f"{area_name}-签到",
                line=dict(width=2, dash="dot"),
            ),
            row=1, col=1,
        )

        if "attendance_rate" in group.columns:
            rate_daily = group.groupby("reservation_date")["attendance_rate"].mean().reset_index()
            fig.add_trace(
                go.Scatter(
                    x=rate_daily["reservation_date"],
                    y=rate_daily["attendance_rate"],
                    mode="lines+markers",
                    name=f"{area_name}-到场率",
                    line=dict(width=2),
                ),
                row=2, col=1,
            )

    if capacity_df is not None and not capacity_df.empty:
        cap_daily = capacity_df.groupby("effective_date")["max_capacity"].sum().reset_index()
        fig.add_trace(
            go.Bar(
                x=cap_daily["effective_date"],
                y=cap_daily["max_capacity"],
                name="容量上限",
                marker_color="rgba(220, 53, 69, 0.3)",
                marker_line_color="rgb(220, 53, 69)",
            ),
            row=1, col=1,
        )

    if conflicts:
        conflict_dates = list(set(c.get("date") for c in conflicts if c.get("date")))
        if conflict_dates:
            fig.add_vrect(
                x0=min(conflict_dates),
                x1=max(conflict_dates),
                fillcolor="rgba(255, 193, 7, 0.15)",
                line_width=0,
                row="all", col="all",
                annotation_text="冲突时段影响区域",
                annotation_position="top left",
            )

    fig.update_layout(
        height=600,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template="plotly_white",
    )
    fig.update_yaxes(title_text="人数", row=1, col=1)
    fig.update_yaxes(title_text="到场率", tickformat=".0%", row=2, col=1)

    return fig


def build_capacity_rule_chart(capacity_df):
    if capacity_df.empty:
        return go.Figure().update_layout(title="暂无容量规则数据")

    fig = go.Figure()

    for area_id, group in capacity_df.groupby("scenic_area_id"):
        group = group.copy()
        group["time_slot_label"] = (
            group["time_slot_start"].astype(str) + "-" + group["time_slot_end"].astype(str)
        )

        fig.add_trace(go.Bar(
            x=group["time_slot_label"],
            y=group["max_capacity"],
            name=f"{area_id}-标准容量",
            marker_color="steelblue",
        ))

        fig.add_trace(go.Bar(
            x=group["time_slot_label"],
            y=group["overflow_capacity"],
            name=f"{area_id}-溢出容量",
            marker_color="lightsalmon",
        ))

    fig.update_layout(
        barmode="stack",
        title="时段容量规则",
        xaxis_title="时段",
        yaxis_title="容量",
        height=400,
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02),
    )

    return fig


def build_conflict_timeline(conflict_df):
    if conflict_df.empty:
        return go.Figure().update_layout(title="暂无冲突数据")

    fig = go.Figure()

    conflict_df = conflict_df.copy()
    conflict_df["time_label"] = (
        conflict_df["conflict_time_start"].astype(str) + "-" + conflict_df["conflict_time_end"].astype(str)
    )
    conflict_df["date_label"] = conflict_df["conflict_date"].astype(str) + " " + conflict_df["time_label"]

    color_map = {"critical": "red", "warning": "orange"}

    for _, row in conflict_df.iterrows():
        fig.add_trace(go.Scatter(
            x=[row["conflict_date"], row["conflict_date"]],
            y=[row["conflict_time_start"], row["conflict_time_end"]],
            mode="lines+markers",
            line=dict(
                width=6,
                color=color_map.get(row.get("severity", "warning"), "orange"),
            ),
            marker=dict(size=10),
            name=row.get("conflict_type", ""),
            showlegend=False,
            hovertext=row.get("description", ""),
            hoverinfo="text",
        ))

    fig.update_layout(
        title="冲突时间线",
        height=400,
        template="plotly_white",
        xaxis_title="日期",
        yaxis_title="时段",
    )

    return fig


def build_timeslot_heatmap(reservation_df):
    if reservation_df.empty:
        return go.Figure().update_layout(title="暂无热力图数据")

    reservation_df = reservation_df.copy()
    reservation_df["slot_label"] = (
        reservation_df["time_slot_start"].astype(str) + "-" + reservation_df["time_slot_end"].astype(str)
    )

    pivot = reservation_df.pivot_table(
        index="slot_label",
        columns="reservation_date",
        values="reserved_count",
        aggfunc="sum",
        fill_value=0,
    )

    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=[str(c) for c in pivot.columns],
        y=pivot.index,
        colorscale="YlOrRd",
        text=pivot.values,
        texttemplate="%{text}",
        colorbar=dict(title="预约人数"),
    ))

    fig.update_layout(
        title="日历时段热力图",
        xaxis_title="日期",
        yaxis_title="时段",
        height=500,
        template="plotly_white",
    )

    return fig
