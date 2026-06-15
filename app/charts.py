import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from config import Config

PALETTE = {
    "primary": "#1890FF",
    "success": "#52C41A",
    "warning": "#FAAD14",
    "error": "#FF4D4F",
    "purple": "#722ED1",
    "cyan": "#13C2C2",
    "magenta": "#EB2F96",
    "orange": "#FA8C16",
    "info": "#1890FF",
    "bg": "#F5F7FA",
    "text": "#1F2937",
}

STAGE_COLORS = ["#1890FF", "#13C2C2", "#52C41A", "#722ED1", "#FAAD14", "#FA8C16", "#EB2F96"]


def _apply_layout(fig, title, height=420, showlegend=True, margin=None):
    default_margin = dict(l=40, r=20, t=60, b=40)
    if margin:
        default_margin.update(margin)
    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=15, family="PingFang SC, Microsoft YaHei, sans-serif", color=PALETTE["text"]),
            x=0.02,
            xanchor="left",
        ),
        template="plotly_white",
        plot_bgcolor="white",
        paper_bgcolor="white",
        height=height,
        showlegend=showlegend,
        margin=default_margin,
        font=dict(family="PingFang SC, Microsoft YaHei, sans-serif", size=12, color=PALETTE["text"]),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.15,
            xanchor="center",
            x=0.5,
            font=dict(size=11),
            bgcolor="rgba(255,255,255,0.8)",
        ),
        hoverlabel=dict(
            bgcolor="white",
            font_size=12,
            font_family="PingFang SC, Microsoft YaHei, sans-serif",
        ),
    )
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor="#EEF0F4", linecolor="#E5E7EB", zeroline=False)
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor="#EEF0F4", linecolor="#E5E7EB", zeroline=False)
    return fig


def create_funnel_chart(funnel_df):
    if funnel_df is None or funnel_df.empty:
        return go.Figure()
    df = funnel_df.sort_values("stage_order")
    fig = go.Figure(go.Funnel(
        y=df["stage"],
        x=df["count"],
        text=df["stage"],
        textinfo="value+percent initial",
        textfont=dict(size=13, color="white"),
        marker=dict(
            color=STAGE_COLORS[:len(df)],
            line=dict(width=1, color="white"),
        ),
        connector=dict(fillcolor="#EEF0F4", line=dict(width=0.5, color="#D1D5DB")),
        opacity=0.92,
    ))

    for i, row in df.iterrows():
        if i > 0:
            fig.add_annotation(
                x=row["count"],
                y=row["stage"],
                xanchor="left",
                ax=40,
                text=f"转化率 {row['conversion_rate']}%<br>流失 {row['drop_off']}%",
                showarrow=False,
                font=dict(size=11, color=PALETTE["error"]),
                bgcolor="white",
                bordercolor="#FFCCC7",
                borderwidth=1,
                borderpad=3,
            )

    return _apply_layout(fig, "📊 选课排课漏斗分析", height=480, showlegend=False)


def create_duration_histogram(duration_stats):
    if duration_stats is None or duration_stats.empty:
        return go.Figure()

    phases = ["初审", "排课", "终审"]
    phase_colors = [PALETTE["primary"], PALETTE["purple"], PALETTE["success"]]
    buckets = ["0-4h", "4-8h", "8-12h", "12-24h", "24-48h", "48-72h", ">72h"]

    fig = go.Figure()
    for p, phase in enumerate(phases):
        subset = duration_stats[duration_stats["phase"] == phase]
        subset = subset.set_index("duration_bucket").reindex(buckets).reset_index()
        fig.add_trace(go.Bar(
            x=subset["duration_bucket"],
            y=subset["count"].fillna(0),
            name=phase,
            marker_color=phase_colors[p],
            opacity=0.85,
            text=subset["percentage"].fillna(0).apply(lambda v: f"{v:.1f}%"),
            textposition="outside",
            textfont=dict(size=10),
            hovertemplate=f"{phase}<br>时长区间: %{{x}}<br>申请数: %{{y}}<extra></extra>",
        ))

    shapes = []
    for xi, b in enumerate(buckets):
        threshold_map = {0: "0-8h", 1: "0-24h", 2: "0-24h"}
        for p, th in threshold_map.items():
            pass

    for xi, b in enumerate(buckets):
        if b == "24-48h":
            shapes.append(dict(
                type="line",
                x0=xi - 0.5,
                y0=0,
                x1=xi - 0.5,
                y1=1,
                yref="paper",
                line=dict(color=PALETTE["error"], width=2, dash="dash"),
            ))
            fig.add_annotation(
                x=xi - 0.5,
                y=1,
                yref="paper",
                xanchor="left",
                text="<-- 目标阈值 24h",
                showarrow=False,
                font=dict(size=10, color=PALETTE["error"]),
            )
            break

    fig.update_layout(barmode="group", bargap=0.15, bargroupgap=0.1)
    return _apply_layout(fig, "⏱ 审核时长分布（按阶段与区间）", height=420)


def create_college_barchart(college_df):
    if college_df is None or college_df.empty:
        return go.Figure()
    df = college_df.sort_values("applications", ascending=False)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df["college"],
        y=df["applications"],
        name="申请数",
        marker_color=PALETTE["primary"],
        opacity=0.9,
        text=df["applications"],
        textposition="outside",
        textfont=dict(size=11),
    ))
    fig.add_trace(go.Bar(
        x=df["college"],
        y=df["success"],
        name="成功数",
        marker_color=PALETTE["success"],
        opacity=0.9,
        text=df["success"],
        textposition="inside",
        textfont=dict(size=11, color="white"),
    ))

    fig2 = go.Figure()
    for i, row in df.iterrows():
        fig2.add_trace(go.Scatter(
            x=[row["college"]],
            y=[row["avg_total_hours"]],
            mode="markers",
            marker=dict(
                size=row["anomaly_count"] * 2 + 10,
                color=PALETTE["warning"] if row["avg_total_hours"] > 48 else PALETTE["cyan"],
                opacity=0.75,
                line=dict(width=1, color="white"),
            ),
            name=f"{row['college']} 平均{row['avg_total_hours']}h",
            showlegend=False,
            hovertemplate=f"{row['college']}<br>平均总时长: {row['avg_total_hours']}h<br>异常: {row['anomaly_count']}<extra></extra>",
        ))

    return _apply_layout(fig, "🏫 各学院申请与成功情况对比", height=400)


def create_conflict_heatmap(schedules_df):
    if schedules_df is None or schedules_df.empty:
        return go.Figure()

    weekdays = Config.WEEKDAYS[:5]
    slots = Config.TIME_SLOTS

    pivot_data = []
    for wd in weekdays:
        for ts in slots:
            rows = schedules_df[(schedules_df["weekday"] == wd) & (schedules_df["time_slot"] == ts)]
            if rows.empty:
                pivot_data.append({"weekday": wd, "time_slot": ts, "count": 0, "conflict": 0, "courses": ""})
            else:
                has_cf = (rows.get("is_conflict", pd.Series([False])).astype(int).sum() > 0)
                courses = "<br>".join(rows["course_name"].tolist()[:2])
                pivot_data.append({
                    "weekday": wd,
                    "time_slot": ts,
                    "count": len(rows),
                    "conflict": 1 if has_cf else 0,
                    "courses": courses,
                })

    df = pd.DataFrame(pivot_data)
    pivot = df.pivot(index="time_slot", columns="weekday", values="count").reindex(slots)
    conflict_pivot = df.pivot(index="time_slot", columns="weekday", values="conflict").reindex(slots)
    courses_pivot = df.pivot(index="time_slot", columns="weekday", values="courses").reindex(slots)

    z_values = pivot.fillna(0).values.tolist()
    cf_values = conflict_pivot.fillna(0).values.tolist()

    colorscale = [
        [0, "#F9FAFB"],
        [0.05, "#D6E4FF"],
        [0.2, "#91CAFF"],
        [0.5, "#4096FF"],
        [0.8, "#1677FF"],
        [1, "#0958D9"],
    ]

    fig = go.Figure()
    fig.add_trace(go.Heatmap(
        z=z_values,
        x=weekdays,
        y=slots,
        colorscale=colorscale,
        showscale=True,
        colorbar=dict(title="排课数", orientation="h", y=-0.2, len=0.5),
        hovertemplate="星期: %{x}<br>时段: %{y}<br>排课数: %{z}<extra></extra>",
        opacity=0.9,
    ))

    for yi in range(len(slots)):
        for xi in range(len(weekdays)):
            if cf_values[yi][xi] == 1:
                fig.add_shape(
                    type="rect",
                    x0=xi - 0.45,
                    x1=xi + 0.45,
                    y0=yi - 0.45,
                    y1=yi + 0.45,
                    line=dict(color=PALETTE["error"], width=3),
                    fillcolor="rgba(255,77,79,0.12)",
                )
                fig.add_annotation(
                    x=xi,
                    y=yi,
                    text="⚠ 冲突",
                    showarrow=False,
                    font=dict(size=12, color=PALETTE["error"], family="PingFang SC"),
                )
            else:
                v = z_values[yi][xi]
                if v > 0:
                    fig.add_annotation(
                        x=xi,
                        y=yi,
                        text=str(int(v)),
                        showarrow=False,
                        font=dict(size=14, color="white" if v >= 1 else PALETTE["primary"]),
                    )

    return _apply_layout(fig, "🗓 教室排课热力图（红色边框=教室冲突）", height=460, showlegend=False)


def create_stage_duration_chart(funnel_df):
    if funnel_df is None or funnel_df.empty:
        return go.Figure()
    df = funnel_df.sort_values("stage_order").iloc[1:]
    durations = df["avg_duration_hours"].tolist()
    stages = df["stage"].tolist()

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=stages,
        y=durations,
        marker_color=[
            PALETTE["success"] if d <= 8
            else (PALETTE["warning"] if d <= 24 else PALETTE["error"])
            for d in durations
        ],
        text=[f"{d:.1f}h" for d in durations],
        textposition="outside",
        textfont=dict(size=12),
        hovertemplate="阶段: %{x}<br>平均耗时: %{y:.1f}小时<extra></extra>",
    ))

    fig.add_hline(
        y=24,
        line_dash="dash",
        line_color=PALETTE["warning"],
        annotation_text="警戒线 24h",
        annotation_position="top right",
        annotation_font_color=PALETTE["warning"],
    )

    return _apply_layout(fig, "📈 各阶段平均处理时长", height=380, showlegend=False)


def create_status_piechart(applications_df):
    if applications_df is None or applications_df.empty:
        return go.Figure()

    if "status" not in applications_df.columns:
        return go.Figure()

    counts = applications_df["status"].value_counts()
    fig = go.Figure(data=[go.Pie(
        labels=counts.index.tolist(),
        values=counts.values.tolist(),
        hole=0.55,
        sort=False,
        direction="clockwise",
        textinfo="label+percent",
        textfont=dict(size=11),
        marker=dict(
            colors=[
                PALETTE["primary"], PALETTE["cyan"], PALETTE["success"],
                PALETTE["warning"], PALETTE["error"], PALETTE["purple"],
                "#B37FEB", "#36CFC9", "#95DE64", "#FFA940", "#FF7875", "#85A5FF",
            ],
            line=dict(color="white", width=2),
        ),
        hovertemplate="%{label}<br>数量: %{value}<br>占比: %{percent}<extra></extra>",
    )])

    total = counts.sum()
    success = counts.get("选课成功", 0)
    success_rate = success / total * 100 if total else 0
    fig.add_annotation(
        text=f"<b>总申请</b><br><span style='font-size:22px;color:#1890FF'>{total}</span><br><br><b>成功率</b><br><span style='font-size:18px;color:#52C41A'>{success_rate:.1f}%</span>",
        x=0.5, y=0.5,
        showarrow=False,
        font=dict(size=11, family="PingFang SC"),
    )

    return _apply_layout(fig, "🥧 申请状态分布", height=400)


def create_anomaly_trend(anomaly_df):
    if anomaly_df is None or anomaly_df.empty or "detected_at" not in anomaly_df.columns:
        return go.Figure()

    df = anomaly_df.copy()
    df["date"] = pd.to_datetime(df["detected_at"], errors="coerce").dt.date
    daily = df.groupby(["date", "severity"]).size().unstack(fill_value=0).reset_index()

    fig = go.Figure()
    for sev, color in [("高", PALETTE["error"]), ("中", PALETTE["warning"]), ("低", PALETTE["info"])]:
        if sev in daily.columns:
            fig.add_trace(go.Scatter(
                x=daily["date"],
                y=daily[sev],
                mode="lines+markers",
                name=f"{sev}严重",
                line=dict(width=2.5, color=color),
                marker=dict(size=8, line=dict(width=1, color="white")),
                stackgroup="one",
            ))

    return _apply_layout(fig, "🚨 异常趋势（按严重程度）", height=360)


def create_gauge_chart(value, title, max_val=100, threshold=80, unit="%"):
    if value is None or pd.isna(value):
        value = 0

    color = PALETTE["success"] if value <= threshold else (PALETTE["warning"] if value <= threshold * 1.2 else PALETTE["error"])

    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=float(value),
        domain={"x": [0, 1], "y": [0, 1]},
        title={"text": title, "font": {"size": 14, "color": PALETTE["text"]}},
        delta={"reference": threshold, "relative": False, "font": {"size": 11}},
        gauge={
            "axis": {"range": [None, max_val], "tickwidth": 1, "tickfont": {"size": 10}},
            "bar": {"color": color, "thickness": 0.6},
            "bgcolor": "white",
            "borderwidth": 2,
            "bordercolor": "#E5E7EB",
            "steps": [
                {"range": [0, threshold * 0.8], "color": "#D9F7BE"},
                {"range": [threshold * 0.8, threshold], "color": "#FFF1B8"},
                {"range": [threshold, max_val], "color": "#FFCCC7"},
            ],
            "threshold": {
                "line": {"color": PALETTE["warning"], "width": 3},
                "thickness": 0.8,
                "value": threshold,
            },
        },
        number={"font": {"size": 28, "color": color}, "suffix": unit},
    ))
    fig.update_layout(
        height=260,
        margin=dict(l=10, r=10, t=50, b=10),
        paper_bgcolor="white",
    )
    return fig


def create_duration_heatmap(duration_stats, phase="总计"):
    if duration_stats is None or duration_stats.empty:
        return go.Figure()
    buckets = ["0-4h", "4-8h", "8-12h", "12-24h", "24-48h", "48-72h", ">72h"]
    phases = ["初审", "排课", "终审", "总计"]

    pivot = duration_stats.pivot(index="phase", columns="duration_bucket", values="percentage").fillna(0)
    pivot = pivot.reindex(phases)
    pivot = pivot[[c for c in buckets if c in pivot.columns]]

    colorscale = [
        [0, "#F6FFED"],
        [0.2, "#B7EB8F"],
        [0.4, "#FFFB8F"],
        [0.6, "#FFD666"],
        [0.8, "#FFA940"],
        [1, "#FF4D4F"],
    ]

    fig = go.Figure(go.Heatmap(
        z=pivot.values.tolist(),
        x=pivot.columns.tolist(),
        y=pivot.index.tolist(),
        colorscale=colorscale,
        showscale=True,
        colorbar=dict(title="占比(%)", orientation="h", y=-0.25, len=0.4),
        text=[[f"{v:.1f}%" for v in row] for row in pivot.values.tolist()],
        texttemplate="%{text}",
        textfont=dict(size=11, color="#1F2937"),
        hovertemplate="阶段: %{y}<br>时长区间: %{x}<br>占比: %{z:.1f}%<extra></extra>",
    ))

    return _apply_layout(fig, "🔥 审核时长分布热力图（阶段×区间）", height=320, showlegend=False)
