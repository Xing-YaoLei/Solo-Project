import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

from app.models import RiskLevel


RISK_COLORS = {
    "low": "#28a745",
    "medium": "#ffc107",
    "high": "#fd7e14",
    "critical": "#dc3545",
}


def fig_checklist_distribution(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无数据")
        return fig

    grouped = df.groupby("category")["count"].sum().reset_index()
    grouped = grouped.sort_values("count", ascending=False)

    fig = px.bar(
        grouped,
        x="category",
        y="count",
        color="count",
        color_continuous_scale="Blues",
        text="count",
        labels={"category": "检查类别", "count": "抽样数量"},
        title="各检查类别抽样数量分布",
    )
    fig.update_traces(textposition="outside")
    fig.update_layout(
        xaxis_title="检查类别",
        yaxis_title="抽样数量",
        showlegend=False,
        coloraxis_showscale=False,
        margin=dict(l=20, r=20, t=50, b=40),
    )
    return fig


def fig_sampling_funnel(funnel_data: dict) -> go.Figure:
    labels = list(funnel_data.keys())
    values = list(funnel_data.values())

    colors = ["#007bff", "#6610f2", "#28a745", "#17a2b8", "#fd7e14"]

    fig = go.Figure(
        go.Funnel(
            y=labels,
            x=values,
            textinfo="value+percent initial",
            marker=dict(color=colors[: len(labels)]),
            connector={"line": {"color": "royalblue", "dash": "solid", "width": 2}},
        )
    )
    fig.update_layout(
        title="抽样记录处理漏斗",
        margin=dict(l=20, r=20, t=50, b=40),
    )
    return fig


def fig_rectification_ranking(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="暂无整改计划数据")
        return fig

    display_df = df.copy()
    display_df["label"] = display_df.apply(
        lambda r: f"{r['responsible_person'] or '未指派'} - {r['title'][:20]}",
        axis=1,
    )
    display_df["priority_label"] = display_df["priority"].map(
        {1: "紧急", 2: "高", 3: "中", 4: "低", 5: "很低"}
    ).fillna("中")

    color_map = {"紧急": "#dc3545", "高": "#fd7e14", "中": "#ffc107", "低": "#28a745", "很低": "#6c757d"}

    fig = px.bar(
        display_df,
        x="priority",
        y="label",
        orientation="h",
        color="priority_label",
        color_discrete_map=color_map,
        hover_data=["department", "due_date", "status"],
        labels={"label": "整改计划", "priority": "优先级"},
        title="整改计划优先级排行（Top 10）",
    )
    fig.update_layout(
        yaxis=dict(autorange="reversed"),
        xaxis_title="优先级（1=最高）",
        yaxis_title="",
        legend_title="优先级",
        margin=dict(l=20, r=20, t=50, b=40),
    )
    return fig


def fig_risk_level_changes(df: pd.DataFrame, risk_summary: dict) -> go.Figure:
    if not df.empty:
        df_plot = df.copy()
        df_plot["changed_at"] = pd.to_datetime(df_plot["changed_at"])
        df_plot = df_plot.sort_values("changed_at")

        level_order = ["low", "medium", "high", "critical"]
        level_map = {lvl: i for i, lvl in enumerate(level_order)}
        df_plot["prev_num"] = df_plot["previous_level"].map(level_map)
        df_plot["new_num"] = df_plot["new_level"].map(level_map)

        fig = go.Figure()
        for _, row in df_plot.iterrows():
            if pd.notna(row["prev_num"]) and pd.notna(row["new_num"]):
                color = RISK_COLORS.get(row["new_level"], "#6c757d")
                fig.add_trace(
                    go.Scatter(
                        x=[row["changed_at"], row["changed_at"]],
                        y=[row["prev_num"], row["new_num"]],
                        mode="lines+markers",
                        marker=dict(size=8, color=color),
                        line=dict(width=2, color=color),
                        showlegend=False,
                        hovertext=f"从 {row['previous_level']} 变为 {row['new_level']}",
                    )
                )
        fig.update_layout(
            title="风险等级变更时间线",
            yaxis=dict(
                tickmode="array",
                tickvals=list(range(len(level_order))),
                ticktext=["低", "中", "高", "严重"],
                range=[-0.5, 3.5],
            ),
            margin=dict(l=20, r=20, t=50, b=40),
        )
    else:
        summary_labels = ["低", "中", "高", "严重"]
        summary_values = [
            risk_summary.get("low", 0),
            risk_summary.get("medium", 0),
            risk_summary.get("high", 0),
            risk_summary.get("critical", 0),
        ]
        fig = go.Figure(
            data=[
                go.Pie(
                    labels=summary_labels,
                    values=summary_values,
                    hole=0.5,
                    marker=dict(colors=["#28a745", "#ffc107", "#fd7e14", "#dc3545"]),
                )
            ]
        )
        fig.update_layout(
            title="当前风险等级分布",
            margin=dict(l=20, r=20, t=50, b=40),
        )
    return fig
