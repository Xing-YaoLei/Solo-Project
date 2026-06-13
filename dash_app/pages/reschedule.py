from datetime import date
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from dash import dcc, html, dash_table, Input, Output, callback
import dash_bootstrap_components as dbc

from dash_app.components import (
    create_layout,
    default_date_range,
    create_filter_bar,
    create_stat_card,
    create_data_table,
    render_empty,
    status_badge,
)
from data_processing import (
    get_regions_df,
    get_appointments_df,
    get_reschedule_df,
    analyze_reschedule_impact,
    get_multi_region_comparison,
)

PRIMARY_COLOR = "#1e88e5"
PRIMARY_DARK = "#1565c0"
PRIMARY_LIGHT = "#e3f2fd"
COLORS = {
    "primary": "#1e88e5",
    "success": "#43a047",
    "warning": "#fb8c00",
    "danger": "#e53935",
    "info": "#00acc1",
    "secondary": "#78909c",
    "purple": "#8e24aa",
    "orange": "#ef6c00",
}

RESCHEDULE_TYPE_MAP = {
    "member": ("会员发起", COLORS["warning"]),
    "coach": ("教练发起", COLORS["info"]),
    "system": ("系统自动", COLORS["secondary"]),
}

RESCHEDULE_REASON_CALIBER = {
    "member_sick": {
        "label": "会员身体不适",
        "explanation": "会员因生病、受伤等健康原因无法按原计划上课，属于不可抗力类改约，通常提前1天以上通知。",
        "color": COLORS["warning"],
    },
    "member_busy": {
        "label": "会员临时有事",
        "explanation": "会员因工作、家庭等个人事务冲突导致无法上课，是最常见的改约类型，需关注高频改约会员。",
        "color": COLORS["primary"],
    },
    "coach_sick": {
        "label": "教练身体不适",
        "explanation": "教练因健康原因无法授课，需及时协调其他代课教练并通知会员，避免会员到场空跑。",
        "color": COLORS["danger"],
    },
    "coach_conflict": {
        "label": "教练时间冲突",
        "explanation": "教练因排课冲突、培训、会议等工作原因需调整课时，属于运营调度类改约。",
        "color": COLORS["info"],
    },
    "system_auto": {
        "label": "系统自动调整",
        "explanation": "因门店停业、设备故障、课程下架等运营事件由系统批量自动触发的改约。",
        "color": COLORS["secondary"],
    },
    "weather": {
        "label": "天气原因",
        "explanation": "暴雨、台风、暴雪等极端天气导致会员无法到店，属于不可抗力类改约。",
        "color": COLORS["purple"],
    },
    "other": {
        "label": "其他原因",
        "explanation": "未分类的改约原因，建议运营人员补充完善分类信息，便于后续统计分析。",
        "color": COLORS["orange"],
    },
}


def _reschedule_type_label(rtype):
    return RESCHEDULE_TYPE_MAP.get(rtype, (rtype, COLORS["secondary"]))[0]


def _reschedule_type_color(rtype):
    return RESCHEDULE_TYPE_MAP.get(rtype, (rtype, COLORS["secondary"]))[1]


def _reschedule_reason_label(reason):
    info = RESCHEDULE_REASON_CALIBER.get(reason)
    return info["label"] if info else reason


def _reschedule_reason_color(reason):
    info = RESCHEDULE_REASON_CALIBER.get(reason)
    return info["color"] if info else COLORS["secondary"]


def _get_region_options():
    regions_df = get_regions_df()
    if regions_df.empty:
        return []
    return [
        {"label": row["region_name"], "value": int(row["id"])}
        for _, row in regions_df.iterrows()
    ]


def _get_reschedule_type_options():
    return [
        {"label": label, "value": key}
        for key, (label, _) in RESCHEDULE_TYPE_MAP.items()
    ]


def _get_reschedule_reason_options(reschedule_df):
    if reschedule_df.empty or "reschedule_reason" not in reschedule_df.columns:
        return [
            {"label": v["label"], "value": k}
            for k, v in RESCHEDULE_REASON_CALIBER.items()
        ]
    unique_reasons = reschedule_df["reschedule_reason"].dropna().unique()
    options = []
    for reason in unique_reasons:
        label = _reschedule_reason_label(reason)
        options.append({"label": label, "value": reason})
    for k, v in RESCHEDULE_REASON_CALIBER.items():
        if k not in unique_reasons:
            options.append({"label": v["label"], "value": k})
    return options


def _build_extra_filters(reschedule_df):
    return [
        html.Div([
            html.Label("改约类型"),
            dcc.Dropdown(
                id="reschedule-filter-type",
                options=_get_reschedule_type_options(),
                value=[],
                multi=True,
                placeholder="全部类型",
                clearable=True
            )
        ], className="filter-item"),
        html.Div([
            html.Label("改约原因"),
            dcc.Dropdown(
                id="reschedule-filter-reason",
                options=_get_reschedule_reason_options(reschedule_df),
                value=[],
                multi=True,
                placeholder="全部原因",
                clearable=True
            )
        ], className="filter-item"),
    ]


def _filter_reschedule(reschedule_df, filter_types, filter_reasons):
    if reschedule_df.empty:
        return reschedule_df
    df = reschedule_df.copy()
    if filter_types:
        df = df[df["reschedule_type"].isin(filter_types)]
    if filter_reasons:
        df = df[df["reschedule_reason"].isin(filter_reasons)]
    return df


def _compute_reschedule_stats(reschedule_df, appointments_df, region_ids):
    if reschedule_df.empty and appointments_df.empty:
        return {
            "total_reschedules": 0,
            "impact_rate": 0.0,
            "avg_days_advance": 0.0,
            "top_reason": "-",
            "top_reason_count": 0,
        }

    filtered_appointments = appointments_df
    if region_ids and "region_id" in filtered_appointments.columns:
        filtered_appointments = filtered_appointments[filtered_appointments["region_id"].isin(region_ids)]

    total_appointments = len(filtered_appointments) if not filtered_appointments.empty else 0
    total_reschedules = len(reschedule_df) if not reschedule_df.empty else 0

    impact_rate = (total_reschedules / total_appointments * 100) if total_appointments > 0 else 0.0

    if not reschedule_df.empty:
        reschedule_df = reschedule_df.copy()
        reschedule_df["old_date_dt"] = pd.to_datetime(reschedule_df["old_date"])
        reschedule_df["rescheduled_at_dt"] = pd.to_datetime(reschedule_df["rescheduled_at"])
        reschedule_df["days_advance"] = (
            reschedule_df["old_date_dt"] - reschedule_df["rescheduled_at_dt"]
        ).dt.days
        reschedule_df["days_advance"] = reschedule_df["days_advance"].clip(lower=0)
        avg_days_advance = round(reschedule_df["days_advance"].mean(), 1) if len(reschedule_df) > 0 else 0.0

        reason_counts = reschedule_df["reschedule_reason"].value_counts()
        if not reason_counts.empty:
            top_reason_key = reason_counts.index[0]
            top_reason = _reschedule_reason_label(top_reason_key)
            top_reason_count = int(reason_counts.iloc[0])
        else:
            top_reason = "-"
            top_reason_count = 0
    else:
        avg_days_advance = 0.0
        top_reason = "-"
        top_reason_count = 0

    return {
        "total_reschedules": total_reschedules,
        "impact_rate": round(impact_rate, 1),
        "avg_days_advance": avg_days_advance,
        "top_reason": top_reason,
        "top_reason_count": top_reason_count,
    }


def _create_reschedule_trend_chart(reschedule_df, appointments_df):
    if reschedule_df.empty and appointments_df.empty:
        return go.Figure()

    fig = go.Figure()

    if not appointments_df.empty:
        appt_daily = appointments_df.copy()
        appt_daily["date"] = pd.to_datetime(appt_daily["appointment_date"])
        appt_daily = appt_daily.groupby("date").agg(
            appt_count=("appointment_no", "nunique")
        ).reset_index().sort_values("date")

        fig.add_trace(go.Bar(
            x=appt_daily["date"],
            y=appt_daily["appt_count"],
            name="预约数",
            marker=dict(color=PRIMARY_LIGHT, line=dict(color=PRIMARY_COLOR, width=1)),
            opacity=0.7,
            yaxis="y1",
        ))

    if not reschedule_df.empty:
        res_daily = reschedule_df.copy()
        res_daily["date"] = pd.to_datetime(res_daily["old_date"])
        res_daily = res_daily.groupby("date").agg(
            res_count=("record_no", "nunique")
        ).reset_index().sort_values("date")

        fig.add_trace(go.Scatter(
            x=res_daily["date"],
            y=res_daily["res_count"],
            mode="lines+markers",
            name="改约数",
            line=dict(color=COLORS["danger"], width=3),
            marker=dict(size=7, color=COLORS["danger"]),
            yaxis="y2",
        ))

    fig.update_layout(
        title=None,
        xaxis=dict(
            title="日期",
            showgrid=True,
            gridcolor="#f0f0f0",
            linecolor="#e0e0e0",
        ),
        yaxis=dict(
            title="预约数",
            side="left",
            showgrid=True,
            gridcolor="#f0f0f0",
            linecolor="#e0e0e0",
            zeroline=True,
            zerolinecolor="#e0e0e0",
        ),
        yaxis2=dict(
            title="改约数",
            side="right",
            overlaying="y",
            showgrid=False,
            linecolor="#e0e0e0",
            zeroline=True,
            zerolinecolor="#e0e0e0",
        ),
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
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )

    return fig


def _create_reason_pie_chart(analysis_result):
    by_reason = analysis_result.get("by_reason", pd.DataFrame())
    if by_reason.empty:
        return go.Figure()

    by_reason = by_reason.copy()
    by_reason["label"] = by_reason["reschedule_reason"].apply(_reschedule_reason_label)
    by_reason["color"] = by_reason["reschedule_reason"].apply(_reschedule_reason_color)

    fig = go.Figure(data=[go.Pie(
        labels=by_reason["label"],
        values=by_reason["count"],
        marker=dict(colors=by_reason["color"]),
        textinfo="label+percent",
        hole=0.55,
        sort=False,
        hovertemplate="<b>%{label}</b><br>数量: %{value}<br>占比: %{percent}<extra></extra>",
    )])
    fig.update_layout(
        margin=dict(l=10, r=10, t=10, b=10),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.05,
            xanchor="center",
            x=0.5,
            font=dict(size=11),
        ),
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
        plot_bgcolor="white",
        paper_bgcolor="white",
    )
    return fig


def _create_type_stacked_bar(reschedule_df):
    if reschedule_df.empty:
        return go.Figure()

    df = reschedule_df.copy()
    df["date"] = pd.to_datetime(df["old_date"]).dt.strftime("%m-%d")
    daily_type = df.groupby(["date", "reschedule_type"]).size().reset_index(name="count")

    fig = go.Figure()
    type_order = ["member", "coach", "system"]
    for rtype in type_order:
        subset = daily_type[daily_type["reschedule_type"] == rtype]
        if not subset.empty:
            fig.add_trace(go.Bar(
                x=subset["date"],
                y=subset["count"],
                name=_reschedule_type_label(rtype),
                marker=dict(color=_reschedule_type_color(rtype)),
                hovertemplate="日期: %{x}<br>类型: " + _reschedule_type_label(rtype) + "<br>数量: %{y}<extra></extra>",
            ))

    fig.update_layout(
        barmode="stack",
        title=None,
        xaxis=dict(
            title="日期",
            showgrid=False,
            linecolor="#e0e0e0",
        ),
        yaxis=dict(
            title="改约数",
            showgrid=True,
            gridcolor="#f0f0f0",
            linecolor="#e0e0e0",
            zeroline=True,
            zerolinecolor="#e0e0e0",
        ),
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
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _create_days_histogram(reschedule_df):
    if reschedule_df.empty:
        return go.Figure()

    df = reschedule_df.copy()
    df["old_date_dt"] = pd.to_datetime(df["old_date"])
    df["rescheduled_at_dt"] = pd.to_datetime(df["rescheduled_at"])
    df["days_advance"] = (df["old_date_dt"] - df["rescheduled_at_dt"]).dt.days
    df["days_advance"] = df["days_advance"].clip(lower=0, upper=30)

    bin_edges = [0, 1, 2, 3, 5, 7, 14, 31]
    bin_labels = ["当天", "提前1天", "提前2天", "提前3-4天", "提前5-6天", "提前1-2周", "提前2周以上"]
    df["bin_group"] = pd.cut(
        df["days_advance"],
        bins=bin_edges,
        labels=bin_labels,
        include_lowest=True,
        right=False,
    )
    hist_data = df.groupby("bin_group", observed=True).size().reset_index(name="count")

    fig = go.Figure(data=[go.Bar(
        x=hist_data["bin_group"],
        y=hist_data["count"],
        marker=dict(
            color=hist_data["count"],
            colorscale=[[0, PRIMARY_LIGHT], [0.5, PRIMARY_COLOR], [1, PRIMARY_DARK]],
            showscale=False,
        ),
        text=hist_data["count"],
        textposition="outside",
        hovertemplate="提前天数: %{x}<br>改约数: %{y}<extra></extra>",
    )])
    fig.update_layout(
        title=None,
        xaxis=dict(
            title="改约提前天数",
            showgrid=False,
            linecolor="#e0e0e0",
        ),
        yaxis=dict(
            title="改约数",
            showgrid=True,
            gridcolor="#f0f0f0",
            linecolor="#e0e0e0",
            zeroline=True,
            zerolinecolor="#e0e0e0",
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=10, b=10),
        bargap=0.2,
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _create_region_rate_chart(reschedule_df, appointments_df):
    if appointments_df.empty:
        return go.Figure()

    appt_by_region = appointments_df.copy()
    if "region_name" not in appt_by_region.columns:
        appt_by_region["region_name"] = "未知区域"
    appt_stats = appt_by_region.groupby("region_name", dropna=False).agg(
        total_appt=("appointment_no", "nunique"),
    ).reset_index()

    if not reschedule_df.empty:
        region_map = {}
        if not appointments_df.empty and "region_name" in appointments_df.columns:
            cols = ["appointment_no", "region_name"]
            cols = [c for c in cols if c in appointments_df.columns]
            if len(cols) == 2:
                region_map = dict(zip(
                    appointments_df["appointment_no"],
                    appointments_df["region_name"]
                ))
        res_df = reschedule_df.copy()
        if "region_name" not in res_df.columns:
            res_df["region_name"] = res_df["appointment_no"].map(region_map)
        res_df["region_name"] = res_df["region_name"].fillna("未知区域")
        res_stats = res_df.groupby("region_name", dropna=False).agg(
            total_res=("record_no", "nunique"),
        ).reset_index()
    else:
        res_stats = pd.DataFrame(columns=["region_name", "total_res"])

    merged = appt_stats.merge(res_stats, on="region_name", how="left")
    merged["total_res"] = merged["total_res"].fillna(0).astype(int)
    merged["reschedule_rate"] = np.where(
        merged["total_appt"] > 0,
        round(merged["total_res"] / merged["total_appt"] * 100, 1),
        0.0
    )
    merged = merged.sort_values("reschedule_rate", ascending=True)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        y=merged["region_name"],
        x=merged["reschedule_rate"],
        name="改约率",
        orientation="h",
        marker=dict(
            color=merged["reschedule_rate"],
            colorscale=[[0, COLORS["success"]], [0.5, PRIMARY_COLOR], [1, COLORS["danger"]]],
            showscale=False,
        ),
        text=merged["reschedule_rate"].apply(lambda x: f"{x}%"),
        textposition="outside",
        hovertemplate=(
            "区域: %{y}<br>改约率: %{x}%<br>"
            "<extra></extra>"
        ),
        customdata=merged[["total_appt", "total_res"]].values,
    ))

    fig.update_layout(
        title=None,
        xaxis=dict(
            title="改约率 (%)",
            showgrid=True,
            gridcolor="#f0f0f0",
            linecolor="#e0e0e0",
            zeroline=True,
            zerolinecolor="#e0e0e0",
            ticksuffix="%",
        ),
        yaxis=dict(
            title="区域",
            showgrid=False,
            linecolor="#e0e0e0",
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=10, r=10, t=10, b=10),
        font=dict(family="-apple-system, 'PingFang SC', sans-serif", size=12),
    )
    return fig


def _create_caliber_cards(reschedule_df):
    cards = []
    stats_df = pd.DataFrame()

    if not reschedule_df.empty and "reschedule_reason" in reschedule_df.columns:
        stats_df = reschedule_df.groupby("reschedule_reason").agg(
            count=("record_no", "nunique"),
        ).reset_index()
        total = len(reschedule_df)
        stats_df["pct"] = round(stats_df["count"] / total * 100, 1) if total > 0 else 0.0

    all_reasons = list(RESCHEDULE_REASON_CALIBER.keys())
    if not stats_df.empty:
        present_reasons = stats_df["reschedule_reason"].tolist()
        for r in present_reasons:
            if r not in all_reasons:
                all_reasons.append(r)

    for reason_key in all_reasons:
        caliber_info = RESCHEDULE_REASON_CALIBER.get(reason_key, {
            "label": reason_key,
            "explanation": "自定义改约原因",
            "color": COLORS["secondary"],
        })

        count_val = 0
        pct_val = 0.0
        if not stats_df.empty:
            match = stats_df[stats_df["reschedule_reason"] == reason_key]
            if not match.empty:
                count_val = int(match["count"].iloc[0])
                pct_val = float(match["pct"].iloc[0])

        card = html.Div([
            html.Div([
                html.Div([
                    html.Span(style={
                        "display": "inline-block",
                        "width": "12px",
                        "height": "12px",
                        "borderRadius": "50%",
                        "background": caliber_info["color"],
                        "marginRight": "8px",
                        "verticalAlign": "middle",
                    }),
                    html.Strong(caliber_info["label"], style={
                        "fontSize": "14px",
                        "color": PRIMARY_DARK,
                        "verticalAlign": "middle",
                    }),
                ], style={"marginBottom": "8px"}),
                html.Div([
                    html.Span(f"改约次数: {count_val}", style={
                        "fontSize": "13px",
                        "color": "#333",
                        "fontWeight": "600",
                        "marginRight": "16px",
                    }),
                    html.Span(f"占比: {pct_val}%", style={
                        "fontSize": "13px",
                        "color": "#333",
                        "fontWeight": "600",
                    }),
                ], style={"marginBottom": "8px"}),
                html.P(caliber_info["explanation"], style={
                    "fontSize": "12px",
                    "color": "#666",
                    "margin": "0",
                    "lineHeight": "1.6",
                }),
            ], style={
                "padding": "12px",
                "background": "#fff",
                "borderRadius": "8px",
                "borderLeft": f"4px solid {caliber_info['color']}",
                "boxShadow": "0 1px 3px rgba(0,0,0,0.08)",
                "height": "100%",
            })
        ], className="col-md-6 col-lg-4")
        cards.append(card)

    return cards


def _create_reschedule_table(reschedule_df, appointments_df):
    if reschedule_df.empty:
        return render_empty("暂无改约明细数据")

    df = reschedule_df.copy()

    region_map = {}
    coach_map = {}
    member_map = {}
    if not appointments_df.empty:
        cols_appt = ["appointment_no", "region_name", "coach_name", "member_name"]
        cols_appt = [c for c in cols_appt if c in appointments_df.columns]
        if "appointment_no" in cols_appt:
            sub = appointments_df[cols_appt].drop_duplicates("appointment_no")
            if "region_name" in sub.columns:
                region_map = dict(zip(sub["appointment_no"], sub["region_name"]))
            if "coach_name" in sub.columns:
                coach_map = dict(zip(sub["appointment_no"], sub["coach_name"]))
            if "member_name" in sub.columns:
                member_map = dict(zip(sub["appointment_no"], sub["member_name"]))

    df["门店区域"] = df["appointment_no"].map(region_map).fillna("-")
    df["教练"] = df["appointment_no"].map(coach_map).fillna("-")
    df["会员"] = df["appointment_no"].map(member_map).fillna("-")

    df["改约类型"] = df["reschedule_type"].apply(_reschedule_type_label)
    df["改约原因"] = df["reschedule_reason"].apply(_reschedule_reason_label)

    df["原预约日期"] = df["old_date"].astype(str)
    df["原时段"] = df["old_start_time"].astype(str) + " - " + df["old_end_time"].astype(str)
    df["新预约日期"] = df["new_date"].astype(str)
    df["新时段"] = df["new_start_time"].astype(str) + " - " + df["new_end_time"].astype(str)

    df["操作时间"] = pd.to_datetime(df["rescheduled_at"]).dt.strftime("%Y-%m-%d %H:%M")

    def _link_text(appt_no):
        return html.A(
            str(appt_no),
            href=f"/?appointment_no={appt_no}",
            target="_blank",
            style={
                "color": PRIMARY_COLOR,
                "textDecoration": "none",
                "fontWeight": "500",
            },
        )

    df["预约编号链接"] = df["appointment_no"].apply(_link_text)

    display_cols = [
        ("record_no", "改约编号"),
        ("预约编号链接", "预约编号"),
        ("门店区域", "门店区域"),
        ("教练", "教练"),
        ("会员", "会员"),
        ("改约类型", "改约类型"),
        ("改约原因", "改约原因"),
        ("原预约日期", "原预约日期"),
        ("原时段", "原时段"),
        ("新预约日期", "新预约日期"),
        ("新时段", "新时段"),
        ("操作时间", "操作时间"),
        ("operator", "操作人"),
    ]

    columns = []
    for col_id, col_name in display_cols:
        if col_id in df.columns:
            columns.append({
                "name": col_name,
                "id": col_id,
                "hideable": True,
                "presentation": "markdown" if col_id == "预约编号链接" else "input",
            })

    style_data_conditional = []
    if "reschedule_type" in df.columns:
        for rtype, (_, color) in RESCHEDULE_TYPE_MAP.items():
            style_data_conditional.append({
                "if": {
                    "filter_query": f"{{reschedule_type}} = '{rtype}'",
                    "column_id": "改约类型",
                },
                "color": color,
                "fontWeight": "600",
            })

    return dash_table.DataTable(
        id="reschedule-detail-table",
        columns=columns,
        data=df.to_dict("records"),
        page_size=15,
        sort_action="native",
        filter_action="native",
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#fafafa",
            "fontWeight": "600",
            "textTransform": "uppercase",
            "fontSize": "11px",
            "letterSpacing": "0.3px",
            "color": "#757575",
            "borderBottom": "2px solid #e0e0e0",
        },
        style_cell={
            "textAlign": "left",
            "padding": "10px",
            "fontSize": "13px",
            "fontFamily": "-apple-system, 'PingFang SC', sans-serif",
        },
        style_data={
            "cursor": "pointer",
            "selector": "td",
        },
        style_data_conditional=style_data_conditional,
    )


def layout():
    start_date, end_date = default_date_range(30)
    region_options = _get_region_options()
    sidebar = create_layout("reschedule")

    try:
        all_reschedule_df = get_reschedule_df(
            date.fromisoformat(start_date),
            date.fromisoformat(end_date),
        )
    except Exception:
        all_reschedule_df = pd.DataFrame()

    extra_filters = _build_extra_filters(all_reschedule_df)

    return html.Div([
        sidebar,
        html.Div([
            html.Div([
                html.H1("🔄 改约记录与口径解释"),
                html.P(f"数据范围: {start_date} ~ {end_date} | 分析预约改约情况及业务口径说明"),
            ], className="page-header"),

            create_filter_bar(
                start_date_default=start_date,
                end_date_default=end_date,
                region_options=region_options,
                extra_filters=extra_filters,
                show_compare=False,
            ),

            html.Div(id="reschedule-stats-grid", className="stats-grid"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div("改约趋势与预约对比", className="card-title"),
                        html.Div("每日改约数与总预约数双轴对比，观察改约波动", className="card-subtitle"),
                    ], className="card-header"),
                    html.Div(id="reschedule-trend-chart", className="chart-container"),
                ], className="card"),
            ]),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("改约原因分布", className="card-title"),
                            html.Div("各原因占比构成分析", className="card-subtitle"),
                        ], className="card-header"),
                        dcc.Graph(id="reschedule-reason-pie", config={"displayModeBar": False},
                                  style={"height": "340px"}),
                    ], className="card"),
                ]),
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("改约类型堆叠图", className="card-title"),
                            html.Div("会员/教练/系统发起改约每日分布", className="card-subtitle"),
                        ], className="card-header"),
                        dcc.Graph(id="reschedule-type-stacked", config={"displayModeBar": False},
                                  style={"height": "340px"}),
                    ], className="card"),
                ]),
            ], className="grid-2"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("改约提前天数分布", className="card-title"),
                            html.Div("从发起改约到原预约日的提前天数统计", className="card-subtitle"),
                        ], className="card-header"),
                        dcc.Graph(id="reschedule-days-hist", config={"displayModeBar": False},
                                  style={"height": "340px"}),
                    ], className="card"),
                ]),
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("按区域改约率对比", className="card-title"),
                            html.Div("各门店改约率横向对比", className="card-subtitle"),
                        ], className="card-header"),
                        dcc.Graph(id="reschedule-region-rate", config={"displayModeBar": False},
                                  style={"height": "340px"}),
                    ], className="card"),
                ]),
            ], className="grid-2"),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("改约原因口径解释", className="card-title"),
                            html.Div("各改约原因的业务定义与统计数据", className="card-subtitle"),
                        ], className="card-header"),
                        html.Div(id="reschedule-caliber-cards", className="row"),
                    ], className="card"),
                ]),
            ]),

            html.Div([
                html.Div([
                    html.Div([
                        html.Div([
                            html.Div("改约明细表", className="card-title"),
                            html.Div("点击预约编号可跳转至对应预约记录（新标签页打开）", className="card-subtitle"),
                        ], className="card-header"),
                        html.Div(id="reschedule-detail-table-container"),
                    ], className="card"),
                ]),
            ]),

        ], className="main-content"),
    ], className="app-container")


def register_callbacks(app):
    @app.callback(
        [
            Output("reschedule-stats-grid", "children"),
            Output("reschedule-trend-chart", "children"),
            Output("reschedule-reason-pie", "figure"),
            Output("reschedule-type-stacked", "figure"),
            Output("reschedule-days-hist", "figure"),
            Output("reschedule-region-rate", "figure"),
            Output("reschedule-caliber-cards", "children"),
            Output("reschedule-detail-table-container", "children"),
        ],
        [
            Input("filter-start-date", "date"),
            Input("filter-end-date", "date"),
            Input("filter-region", "value"),
            Input("reschedule-filter-type", "value"),
            Input("reschedule-filter-reason", "value"),
        ],
    )
    def update_reschedule(start_date_str, end_date_str, region_ids, filter_types, filter_reasons):
        if not start_date_str or not end_date_str:
            empty_fig = go.Figure()
            empty_fig.update_layout(
                plot_bgcolor="white",
                paper_bgcolor="white",
                margin=dict(l=10, r=10, t=10, b=10),
            )
            empty_chart = dcc.Graph(figure=empty_fig, style={"height": "320px"})
            return (
                [
                    create_stat_card("改约总数", "-"),
                    create_stat_card("改约影响率", "-", value_suffix="%"),
                    create_stat_card("平均提前天数", "-", value_suffix=" 天"),
                    create_stat_card("主要改约原因", "-"),
                ],
                empty_chart,
                empty_fig,
                empty_fig,
                empty_fig,
                empty_fig,
                _create_caliber_cards(pd.DataFrame()),
                render_empty("请选择日期范围"),
            )

        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)

        try:
            raw_reschedule_df = get_reschedule_df(start_date, end_date)
        except Exception:
            raw_reschedule_df = pd.DataFrame()

        try:
            appointments_df = get_appointments_df(start_date, end_date, region_ids)
        except Exception:
            appointments_df = pd.DataFrame()

        reschedule_df = raw_reschedule_df.copy()
        if region_ids and not appointments_df.empty and "appointment_no" in appointments_df.columns and "region_id" in appointments_df.columns:
            valid_appt_nos = appointments_df[appointments_df["region_id"].isin(region_ids)]["appointment_no"].unique()
            if "appointment_no" in reschedule_df.columns:
                reschedule_df = reschedule_df[reschedule_df["appointment_no"].isin(valid_appt_nos)]

        reschedule_df = _filter_reschedule(reschedule_df, filter_types, filter_reasons)

        analysis_result = analyze_reschedule_impact(reschedule_df, appointments_df)
        stats = _compute_reschedule_stats(reschedule_df, appointments_df, region_ids)

        stat_cards = [
            create_stat_card(
                "改约总数",
                f"{stats['total_reschedules']:,}",
                value_suffix=" 次",
            ),
            create_stat_card(
                "改约影响率",
                f"{stats['impact_rate']:.1f}",
                value_suffix="%",
            ),
            create_stat_card(
                "平均提前天数",
                f"{stats['avg_days_advance']:.1f}",
                value_suffix=" 天",
            ),
            create_stat_card(
                "主要改约原因",
                f"{stats['top_reason']}",
                value_suffix=f" ({stats['top_reason_count']}次)" if stats['top_reason_count'] > 0 else "",
            ),
        ]

        trend_fig = _create_reschedule_trend_chart(reschedule_df, appointments_df)
        trend_chart = dcc.Graph(
            figure=trend_fig,
            style={"height": "340px"},
            config={"displayModeBar": False, "responsive": True},
        )

        reason_pie_fig = _create_reason_pie_chart(analysis_result)
        type_stacked_fig = _create_type_stacked_bar(reschedule_df)
        days_hist_fig = _create_days_histogram(reschedule_df)
        region_rate_fig = _create_region_rate_chart(reschedule_df, appointments_df)

        caliber_cards = _create_caliber_cards(reschedule_df)
        detail_table = _create_reschedule_table(reschedule_df, appointments_df)

        return (
            stat_cards,
            trend_chart,
            reason_pie_fig,
            type_stacked_fig,
            days_hist_fig,
            region_rate_fig,
            caliber_cards,
            detail_table,
        )


def register_page():
    return {
        "layout": layout,
        "register_callbacks": register_callbacks,
    }
