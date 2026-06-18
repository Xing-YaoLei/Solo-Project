import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from typing import Dict, List


def create_appointment_trend_chart(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=df['date'],
        y=df['预约量'],
        name='预约量',
        marker_color='rgba(59, 130, 246, 0.7)',
        hovertemplate='日期: %{x}<br>预约量: %{y}',
    ))

    fig.add_trace(go.Bar(
        x=df['date'],
        y=df['到店量'],
        name='到店量',
        marker_color='rgba(16, 185, 129, 0.7)',
        hovertemplate='日期: %{x}<br>到店量: %{y}',
    ))

    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df['到店率'],
        name='到店率(%)',
        yaxis='y2',
        mode='lines+markers',
        line=dict(color='#f59e0b', width=2),
        marker=dict(size=6),
        hovertemplate='日期: %{x}<br>到店率: %{y}%',
    ))

    fig.update_layout(
        barmode='group',
        hovermode='x unified',
        yaxis=dict(title='数量'),
        yaxis2=dict(
            title='到店率(%)',
            overlaying='y',
            side='right',
            range=[0, 100]
        ),
        legend=dict(orientation='h', yanchor='bottom', y=1.02),
        margin=dict(l=40, r=40, t=20, b=40),
    )

    return fig


def create_vehicle_brand_chart(brand_data: List[Dict]) -> go.Figure:
    if not brand_data:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    df = pd.DataFrame(brand_data)
    fig = px.pie(
        df,
        values='count',
        names='brand',
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Set3,
    )
    fig.update_traces(
        textposition='inside',
        textinfo='percent+label',
        hovertemplate='品牌: %{label}<br>数量: %{value}',
    )
    fig.update_layout(
        showlegend=True,
        margin=dict(l=20, r=20, t=20, b=20),
    )
    return fig


def create_vehicle_age_chart(age_data: List[Dict] = None) -> go.Figure:
    if not age_data:
        age_data = [
            {'age_group': '0-2年', 'count': 45},
            {'age_group': '2-5年', 'count': 78},
            {'age_group': '5-8年', 'count': 56},
            {'age_group': '8年以上', 'count': 23},
        ]
    df = pd.DataFrame(age_data)
    fig = px.bar(
        df,
        x='age_group',
        y='count',
        color='count',
        color_continuous_scale='Blues',
    )
    fig.update_layout(
        xaxis_title='车龄区间',
        yaxis_title='车辆数',
        showlegend=False,
        margin=dict(l=20, r=20, t=20, b=20),
    )
    return fig


def create_diagnosis_category_chart(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    category_df = df.groupby('故障类别')['数量'].sum().reset_index()
    category_df = category_df.sort_values('数量', ascending=True)

    fig = px.bar(
        category_df,
        y='故障类别',
        x='数量',
        color='故障类别',
        orientation='h',
        color_discrete_sequence=px.colors.qualitative.Pastel,
    )
    fig.update_layout(
        xaxis_title='数量',
        yaxis_title='',
        showlegend=False,
        margin=dict(l=100, r=20, t=20, b=20),
    )
    return fig


def create_diagnosis_severity_chart(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    severity_df = df.groupby('严重程度')['数量'].sum().reset_index()

    color_map = {
        '严重': '#ef4444',
        '中等': '#f59e0b',
        '轻微': '#10b981',
        '未知': '#9ca3af',
    }

    fig = px.pie(
        severity_df,
        values='数量',
        names='严重程度',
        color='严重程度',
        color_discrete_map=color_map,
    )
    fig.update_traces(
        textposition='inside',
        textinfo='percent+label',
    )
    fig.update_layout(
        margin=dict(l=20, r=20, t=20, b=20),
    )
    return fig


def create_order_type_chart(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    fig = px.pie(
        df,
        values='数量',
        names='项目类型',
        hole=0.5,
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_traces(
        textposition='inside',
        textinfo='percent+label',
    )
    fig.update_layout(
        margin=dict(l=20, r=20, t=20, b=20),
    )
    return fig


def create_order_amount_chart(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    df = df.sort_values('总金额', ascending=True)
    fig = px.bar(
        df,
        y='项目类型',
        x='总金额',
        color='总金额',
        orientation='h',
        color_continuous_scale='Greens',
    )
    fig.update_layout(
        xaxis_title='金额(元)',
        yaxis_title='',
        showlegend=False,
        margin=dict(l=100, r=20, t=20, b=20),
    )
    return fig


def create_rework_trend_chart(trend_data: List[Dict]) -> go.Figure:
    if not trend_data:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    df = pd.DataFrame(trend_data)
    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df['date'],
        y=df['rework_rate'],
        mode='lines+markers',
        name='返修率',
        line=dict(color='#ef4444', width=2),
        fill='tozeroy',
        fillcolor='rgba(239, 68, 68, 0.1)',
        hovertemplate='日期: %{x}<br>返修率: %{y}%',
    ))

    fig.update_layout(
        yaxis=dict(title='返修率(%)', range=[0, None]),
        margin=dict(l=40, r=20, t=20, b=40),
    )
    return fig


def create_rework_reason_chart(reason_data: List[Dict]) -> go.Figure:
    if not reason_data:
        reason_data = [
            {'rework_type': '配件相关', 'count': 12},
            {'rework_type': '工艺相关', 'count': 8},
            {'rework_type': '诊断相关', 'count': 5},
            {'rework_type': '客户相关', 'count': 3},
            {'rework_type': '其他', 'count': 2},
        ]
    df = pd.DataFrame(reason_data)
    df = df.sort_values('count', ascending=True)

    fig = px.bar(
        df,
        y='rework_type',
        x='count',
        color='count',
        orientation='h',
        color_continuous_scale='Reds',
    )
    fig.update_layout(
        xaxis_title='数量',
        yaxis_title='返修原因',
        showlegend=False,
        margin=dict(l=80, r=20, t=20, b=20),
    )
    return fig


def create_caliber_compare_chart(compare_data: List[Dict]) -> go.Figure:
    if not compare_data:
        compare_data = [
            {'version': 'v1.0', 'rate': 3.2},
            {'version': 'v1.1', 'rate': 5.8},
        ]
    df = pd.DataFrame(compare_data)

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=df['version'],
        y=df['rate'],
        marker_color=['#3b82f6', '#ef4444'],
        text=df['rate'].apply(lambda x: f'{x}%'),
        textposition='auto',
    ))
    fig.update_layout(
        yaxis=dict(title='返修率(%)'),
        xaxis=dict(title='口径版本'),
        showlegend=False,
        margin=dict(l=40, r=20, t=20, b=40),
    )
    return fig


def create_parts_shortage_chart(parts_data: List[Dict]) -> go.Figure:
    if not parts_data:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", showarrow=False, font=dict(size=20, color="gray"))
        return fig

    df = pd.DataFrame(parts_data[:10])
    df = df.sort_values('shortage_count', ascending=True)

    fig = px.bar(
        df,
        y='part_name',
        x='shortage_count',
        color='shortage_count',
        orientation='h',
        color_continuous_scale='Oranges',
    )
    fig.update_layout(
        xaxis_title='缺货次数',
        yaxis_title='',
        showlegend=False,
        margin=dict(l=120, r=20, t=20, b=20),
    )
    return fig


def create_parts_rework_correlation_chart(corr_data: List[Dict] = None) -> go.Figure:
    if not corr_data:
        corr_data = [
            {'part_name': '刹车片', 'shortage_count': 15, 'rework_count': 3},
            {'part_name': '机油滤芯', 'shortage_count': 12, 'rework_count': 1},
            {'part_name': '空气滤芯', 'shortage_count': 10, 'rework_count': 2},
            {'part_name': '火花塞', 'shortage_count': 8, 'rework_count': 4},
            {'part_name': '蓄电池', 'shortage_count': 6, 'rework_count': 1},
        ]
    df = pd.DataFrame(corr_data)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['shortage_count'],
        y=df['rework_count'],
        mode='markers+text',
        text=df['part_name'],
        textposition='top center',
        marker=dict(
            size=12,
            color=df['rework_count'],
            colorscale='Reds',
            showscale=True,
        ),
        hovertemplate='配件: %{text}<br>缺货次数: %{x}<br>关联返修: %{y}',
    ))
    fig.update_layout(
        xaxis=dict(title='缺货次数'),
        yaxis=dict(title='关联返修次数'),
        margin=dict(l=40, r=20, t=20, b=40),
    )
    return fig
