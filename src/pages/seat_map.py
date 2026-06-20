import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from src.data.queries import Queries


SEAT_COLORS = {
    "checked_in": "#10B981",
    "not_checked_in": "#F59E0B",
    "no_code": "#EF4444",
    "unassigned": "#D1D5DB"
}

SEAT_LABELS = {
    "checked_in": "已核销",
    "not_checked_in": "未核销",
    "no_code": "无签到码",
    "unassigned": "未售出"
}


def render_seat_map():
    st.markdown("## 🪑 座位核销地图")
    queries = Queries()

    seat_data = queries.get_seat_checkin_status()
    seat_df = seat_data.to_pandas()

    sections = sorted(seat_df["section"].unique())

    st.markdown("### 🎨 图例说明")
    legend_cols = st.columns(len(SEAT_COLORS))
    for i, (status, color) in enumerate(SEAT_COLORS.items()):
        with legend_cols[i]:
            st.markdown(
                f'<div style="display: flex; align-items: center; gap: 8px;">'
                f'<div style="width: 20px; height: 20px; background: {color}; '
                f'border-radius: 4px;"></div>'
                f'<span>{SEAT_LABELS[status]}</span>'
                f'</div>',
                unsafe_allow_html=True
            )

    st.markdown("---")

    for section in sections:
        section_df = seat_df[seat_df["section"] == section].copy()

        if len(section_df) == 0:
            continue

        seat_type = section_df["seat_type"].iloc[0]
        total_seats = len(section_df)
        checked_in = len(section_df[section_df["status"] == "checked_in"])
        no_code = len(section_df[section_df["status"] == "no_code"])
        rate = checked_in / total_seats * 100 if total_seats > 0 else 0

        with st.expander(
            f"🎟️ {section}区 - {seat_type}  |  共 {total_seats} 座  |  "
            f"已核销 {checked_in} ({rate:.1f}%)  |  无码 {no_code}",
            expanded=(section == "A")
        ):
            fig = _plot_seat_section(section_df, section)
            st.plotly_chart(fig, use_container_width=True)

            st.markdown("#### 📋 区域明细")
            display_df = section_df[[
                "seat_id", "seat_row", "seat_number", "seat_type",
                "attendee_name", "ticket_type", "checkin_code",
                "checked_in", "checkin_time"
            ]].copy()
            display_df["checked_in"] = display_df["checked_in"].fillna(False).map({
                True: "✅ 已核销",
                False: "❌ 未核销"
            })
            st.dataframe(
                display_df,
                use_container_width=True,
                height=300,
                hide_index=True
            )

    st.markdown("---")
    st.markdown("### 📊 各区核销对比")

    summary_df = seat_df.groupby("section").agg(
        total_seats=("seat_id", "count"),
        checked_in=("status", lambda x: (x == "checked_in").sum()),
        no_code=("status", lambda x: (x == "no_code").sum()),
        not_checked_in=("status", lambda x: (x == "not_checked_in").sum())
    ).reset_index()
    summary_df["checkin_rate"] = summary_df["checked_in"] / summary_df["total_seats"] * 100
    summary_df = summary_df.sort_values("section")

    fig_summary = go.Figure()
    fig_summary.add_trace(go.Bar(
        x=summary_df["section"],
        y=summary_df["checked_in"],
        name="已核销",
        marker_color=SEAT_COLORS["checked_in"]
    ))
    fig_summary.add_trace(go.Bar(
        x=summary_df["section"],
        y=summary_df["not_checked_in"],
        name="未核销",
        marker_color=SEAT_COLORS["not_checked_in"]
    ))
    fig_summary.add_trace(go.Bar(
        x=summary_df["section"],
        y=summary_df["no_code"],
        name="无签到码",
        marker_color=SEAT_COLORS["no_code"]
    ))
    fig_summary.update_layout(
        barmode="stack",
        xaxis_title="区域",
        yaxis_title="座位数",
        height=350,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig_summary, use_container_width=True)


def _plot_seat_section(section_df: pd.DataFrame, section_name: str) -> go.Figure:
    rows = sorted(section_df["seat_row"].unique(), reverse=True)
    max_seats = section_df["seat_number"].max()

    fig = go.Figure()

    for i, row in enumerate(rows):
        row_df = section_df[section_df["seat_row"] == row].sort_values("seat_number")

        for _, seat in row_df.iterrows():
            status = seat["status"] if pd.notna(seat["status"]) else "unassigned"
            color = SEAT_COLORS.get(status, "#D1D5DB")

            label = seat["seat_id"]
            hover_text = f"""
            座位: {seat['seat_id']}<br>
            状态: {SEAT_LABELS.get(status, '未知')}<br>
            持票人: {seat['attendee_name'] if pd.notna(seat['attendee_name']) else '未售出'}<br>
            票种: {seat['ticket_type'] if pd.notna(seat['ticket_type']) else '-'}<br>
            签到码: {seat['checkin_code'] if pd.notna(seat['checkin_code']) else '无'}<br>
            核销时间: {seat['checkin_time'] if pd.notna(seat['checkin_time']) else '-'}
            """

            fig.add_trace(go.Scatter(
                x=[seat["seat_number"]],
                y=[i],
                mode="markers+text",
                marker=dict(
                    size=18,
                    color=color,
                    line=dict(color="white", width=1),
                    symbol="square"
                ),
                text=str(seat["seat_number"]),
                textposition="middle center",
                textfont=dict(size=9, color="white"),
                hovertemplate=hover_text,
                name=f"第{row}排",
                showlegend=False
            ))

    fig.update_layout(
        title=f"{section_name}区座位图",
        xaxis=dict(
            title="座位号",
            tickmode="linear",
            tick0=1,
            dtick=1,
            range=[0, max_seats + 1],
            showgrid=False
        ),
        yaxis=dict(
            title="排号",
            tickvals=list(range(len(rows))),
            ticktext=[f"{r}排" for r in rows],
            showgrid=False
        ),
        height=100 + len(rows) * 40,
        margin=dict(l=60, r=20, t=40, b=40),
        plot_bgcolor="#f8fafc"
    )

    return fig
