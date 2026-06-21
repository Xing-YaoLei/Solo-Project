import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from typing import List, Dict, Optional


def create_order_trend_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无数据")
    
    df = orders_df.copy()
    df['date'] = df['create_time'].dt.floor('H')
    hourly_orders = df.groupby('date').size().reset_index(name='count')
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=hourly_orders['date'],
        y=hourly_orders['count'],
        mode='lines+markers',
        name='订单量',
        line=dict(color='#1976D2', width=3),
        marker=dict(size=6)
    ))
    
    fig.update_layout(
        title='订单量趋势',
        xaxis_title='时间',
        yaxis_title='订单数',
        hovermode='x unified',
        template='plotly_white',
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_delivery_time_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无数据")
    
    completed = orders_df[orders_df['order_status'] == 'delivered'].copy()
    delivery_times = []
    
    for _, row in completed.iterrows():
        if pd.notna(row['pickup_time']) and pd.notna(row['delivery_time']):
            duration = (row['delivery_time'] - row['pickup_time']).total_seconds() / 60
            delivery_times.append(duration)
    
    if not delivery_times:
        return go.Figure().update_layout(title="暂无配送时长数据")
    
    bins = [0, 15, 30, 45, 60, float('inf')]
    labels = ['<15分钟', '15-30分钟', '30-45分钟', '45-60分钟', '>60分钟']
    delivery_df = pd.DataFrame({'duration': delivery_times})
    delivery_df['range'] = pd.cut(delivery_df['duration'], bins=bins, labels=labels)
    distribution = delivery_df['range'].value_counts().sort_index()
    
    colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336']
    
    fig = go.Figure(go.Bar(
        x=distribution.index,
        y=distribution.values,
        marker_color=colors,
        text=distribution.values,
        textposition='auto'
    ))
    
    fig.update_layout(
        title='配送时长分布',
        xaxis_title='配送时长区间',
        yaxis_title='订单数',
        template='plotly_white',
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_order_type_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无数据")
    
    type_counts = orders_df['order_type'].value_counts()
    
    fig = go.Figure(go.Pie(
        labels=type_counts.index,
        values=type_counts.values,
        hole=0.4,
        textinfo='label+percent',
        marker=dict(colors=px.colors.qualitative.Set3)
    ))
    
    fig.update_layout(
        title='订单类型分布',
        template='plotly_white',
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_hourly_distribution_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无数据")
    
    df = orders_df.copy()
    df['hour'] = df['create_time'].dt.hour
    hourly_counts = df.groupby('hour').size().reindex(range(24), fill_value=0)
    
    fig = go.Figure(go.Bar(
        x=[f'{h:02d}:00' for h in hourly_counts.index],
        y=hourly_counts.values,
        marker_color='#2196F3',
        text=hourly_counts.values,
        textposition='auto'
    ))
    
    fig.update_layout(
        title='24小时订单分布',
        xaxis_title='小时',
        yaxis_title='订单数',
        template='plotly_white',
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_order_address_map(orders_df: pd.DataFrame, 
                            status_filter: str = 'all',
                            type_filter: str = 'all',
                            map_type: str = 'scatter') -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无订单数据")
    
    df = orders_df.copy()
    
    if status_filter == 'delivered':
        df = df[df['order_status'] == 'delivered']
    elif status_filter == 'cancelled':
        df = df[df['order_status'] == 'cancelled']
    elif status_filter == 'risk':
        df = df[df['is_risk_order'] == True]
    
    if type_filter != 'all':
        df = df[df['order_type'] == type_filter]
    
    df = df.dropna(subset=['pickup_lng', 'pickup_lat'])
    
    if df.empty:
        return go.Figure().update_layout(title="筛选后无订单数据")
    
    center_lat = df['pickup_lat'].mean()
    center_lng = df['pickup_lng'].mean()
    
    if map_type == 'heatmap':
        fig = go.Figure(go.Densitymapbox(
            lat=df['pickup_lat'],
            lon=df['pickup_lng'],
            z=[1] * len(df),
            radius=20,
            colorscale='Viridis',
            showscale=True,
            name='订单密度'
        ))
    elif map_type == 'density':
        fig = go.Figure(go.Histogram2d(
            x=df['pickup_lng'],
            y=df['pickup_lat'],
            colorscale='Viridis',
            showscale=True,
            nbinsx=50,
            nbinsy=50
        ))
    else:
        color_map = {
            'delivered': '#4CAF50',
            'cancelled': '#F44336',
            'created': '#2196F3',
            'accepted': '#FF9800',
            'picked_up': '#9C27B0'
        }
        
        fig = go.Figure()
        
        for status in df['order_status'].unique():
            status_df = df[df['order_status'] == status]
            color = color_map.get(status, '#9E9E9E')
            
            fig.add_trace(go.Scattermapbox(
                lat=status_df['pickup_lat'],
                lon=status_df['pickup_lng'],
                mode='markers',
                marker=go.scattermapbox.Marker(
                    size=8,
                    color=color,
                    opacity=0.7
                ),
                text=status_df.apply(lambda row: 
                    f"订单: {row['order_no']}<br>"
                    f"状态: {row['order_status']}<br>"
                    f"取货: {row['pickup_address']}<br>"
                    f"送货: {row['delivery_address']}", axis=1),
                hoverinfo='text',
                name=status
            ))
        
        fig.update_layout(
            legend=dict(
                title='订单状态',
                orientation='h',
                yanchor='bottom',
                y=1.02,
                xanchor='right',
                x=1
            )
        )
    
    fig.update_layout(
        mapbox=dict(
            style='carto-positron',
            center=dict(lat=center_lat, lon=center_lng),
            zoom=11
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        title='订单地址分布'
    )
    
    return fig


def create_trajectory_map(traj_df: pd.DataFrame, 
                         order_info: Optional[Dict] = None) -> go.Figure:
    if traj_df.empty:
        return go.Figure().update_layout(title="暂无轨迹数据")
    
    center_lat = traj_df['lat'].mean()
    center_lng = traj_df['lng'].mean()
    
    fig = go.Figure()
    
    fig.add_trace(go.Scattermapbox(
        lat=traj_df['lat'],
        lon=traj_df['lng'],
        mode='lines+markers',
        line=dict(color='#1976D2', width=3),
        marker=go.scattermapbox.Marker(
            size=6,
            color=traj_df.index,
            colorscale='Viridis',
            showscale=True,
            colorbar=dict(title='时间顺序')
        ),
        text=traj_df.apply(lambda row: 
            f"时间: {row['record_time']}<br>"
            f"速度: {row['speed_kmh']:.1f} km/h<br>"
            f"精度: {row['accuracy_m']:.1f} m", axis=1),
        hoverinfo='text',
        name='骑手轨迹'
    ))
    
    if order_info:
        if 'pickup_lat' in order_info and order_info['pickup_lat']:
            fig.add_trace(go.Scattermapbox(
                lat=[order_info['pickup_lat']],
                lon=[order_info['pickup_lng']],
                mode='markers',
                marker=go.scattermapbox.Marker(
                    size=15,
                    color='#4CAF50',
                    symbol='marker'
                ),
                text=f"取货点<br>{order_info.get('pickup_address', '')}",
                hoverinfo='text',
                name='取货点'
            ))
        
        if 'delivery_lat' in order_info and order_info['delivery_lat']:
            fig.add_trace(go.Scattermapbox(
                lat=[order_info['delivery_lat']],
                lon=[order_info['delivery_lng']],
                mode='markers',
                marker=go.scattermapbox.Marker(
                    size=15,
                    color='#F44336',
                    symbol='marker'
                ),
                text=f"送货点<br>{order_info.get('delivery_address', '')}",
                hoverinfo='text',
                name='送货点'
            ))
    
    fig.update_layout(
        mapbox=dict(
            style='carto-positron',
            center=dict(lat=center_lat, lon=center_lng),
            zoom=13
        ),
        margin=dict(l=0, r=0, t=0, b=0),
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='right',
            x=1
        )
    )
    
    return fig


def create_speed_chart(traj_df: pd.DataFrame) -> go.Figure:
    if traj_df.empty:
        return go.Figure().update_layout(title="暂无速度数据")
    
    fig = go.Figure(go.Scatter(
        x=traj_df['record_time'],
        y=traj_df['speed_kmh'],
        mode='lines+markers',
        line=dict(color='#FF5722', width=2),
        marker=dict(size=4),
        fill='tozeroy',
        fillcolor='rgba(255, 87, 34, 0.1)'
    ))
    
    fig.update_layout(
        title='速度变化曲线',
        xaxis_title='时间',
        yaxis_title='速度 (km/h)',
        template='plotly_white',
        margin=dict(l=40, r=40, t=30, b=40)
    )
    
    return fig


def create_subsidy_trend_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无补贴数据")
    
    df = orders_df.copy()
    df['date'] = df['create_time'].dt.date
    daily_subsidy = df.groupby('date').agg({
        'subsidy_amount': 'sum',
        'order_id': 'count'
    }).reset_index()
    daily_subsidy.columns = ['date', 'total_subsidy', 'order_count']
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=daily_subsidy['date'],
        y=daily_subsidy['total_subsidy'],
        name='补贴金额',
        yaxis='y',
        marker_color='#FFC107',
        text=[f'¥{v:,.2f}' for v in daily_subsidy['total_subsidy']],
        textposition='auto'
    ))
    
    fig.add_trace(go.Scatter(
        x=daily_subsidy['date'],
        y=daily_subsidy['order_count'],
        name='订单数',
        yaxis='y2',
        mode='lines+markers',
        line=dict(color='#1976D2', width=3),
        marker=dict(size=6)
    ))
    
    fig.update_layout(
        title='补贴金额趋势',
        xaxis=dict(title='日期'),
        yaxis=dict(
            title='补贴金额 (元)',
            side='left'
        ),
        yaxis2=dict(
            title='订单数',
            side='right',
            overlaying='y'
        ),
        template='plotly_white',
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1),
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_subsidy_type_chart(orders_df: pd.DataFrame) -> go.Figure:
    if orders_df.empty:
        return go.Figure().update_layout(title="暂无补贴数据")
    
    df = orders_df[orders_df['subsidy_amount'] > 0].copy()
    
    if df.empty:
        return go.Figure().update_layout(title="暂无补贴订单")
    
    type_subsidy = df.groupby('order_type')['subsidy_amount'].sum().sort_values(ascending=False)
    
    fig = go.Figure(go.Pie(
        labels=type_subsidy.index,
        values=type_subsidy.values,
        hole=0.4,
        textinfo='label+value+percent',
        texttemplate='%{label}<br>¥%{value:,.2f}<br>%{percent}',
        marker=dict(colors=px.colors.qualitative.Pastel)
    ))
    
    fig.update_layout(
        title='各类型补贴金额分布',
        template='plotly_white',
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_rejection_reason_chart(rejections_df: pd.DataFrame) -> go.Figure:
    if rejections_df.empty:
        return go.Figure().update_layout(title="暂无拒单数据")
    
    reason_counts = rejections_df['reject_reason'].value_counts().head(10)
    
    fig = go.Figure(go.Bar(
        y=reason_counts.index,
        x=reason_counts.values,
        orientation='h',
        marker_color='#F44336',
        text=reason_counts.values,
        textposition='auto'
    ))
    
    fig.update_layout(
        title='拒单原因分布',
        xaxis_title='拒单次数',
        yaxis_title='拒单原因',
        template='plotly_white',
        margin=dict(l=150, r=40, t=40, b=40)
    )
    
    return fig


def create_compensation_chart(rejections_df: pd.DataFrame) -> go.Figure:
    if rejections_df.empty:
        return go.Figure().update_layout(title="暂无赔付数据")
    
    df = rejections_df.copy()
    df['date'] = df['reject_time'].dt.date
    daily_compensation = df.groupby('date').agg({
        'compensation_amount': 'sum',
        'rejection_id': 'count'
    }).reset_index()
    daily_compensation.columns = ['date', 'total_compensation', 'rejection_count']
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=daily_compensation['date'],
        y=daily_compensation['total_compensation'],
        name='赔付金额',
        marker_color='#F44336',
        text=[f'¥{v:,.2f}' for v in daily_compensation['total_compensation']],
        textposition='auto'
    ))
    
    fig.add_trace(go.Scatter(
        x=daily_compensation['date'],
        y=daily_compensation['rejection_count'],
        name='拒单数',
        mode='lines+markers',
        yaxis='y2',
        line=dict(color='#FF9800', width=3),
        marker=dict(size=6)
    ))
    
    fig.update_layout(
        title='赔付金额趋势',
        xaxis=dict(title='日期'),
        yaxis=dict(title='赔付金额 (元)', side='left'),
        yaxis2=dict(title='拒单数', side='right', overlaying='y'),
        template='plotly_white',
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1),
        margin=dict(l=40, r=40, t=40, b=40)
    )
    
    return fig


def create_rider_metrics(traj_df: pd.DataFrame, 
                        orders_df: pd.DataFrame,
                        rider_id: str) -> List:
    if traj_df.empty:
        return [html.Div("暂无骑手数据", className="text-muted")]
    
    total_distance = 0
    for i in range(1, len(traj_df)):
        from math import radians, sin, cos, sqrt, atan2
        R = 6371.0
        lat1, lon1 = radians(traj_df.iloc[i-1]['lat']), radians(traj_df.iloc[i-1]['lng'])
        lat2, lon2 = radians(traj_df.iloc[i]['lat']), radians(traj_df.iloc[i]['lng'])
        d_lon = lon2 - lon1
        d_lat = lat2 - lat1
        a = sin(d_lat/2)**2 + cos(lat1) * cos(lat2) * sin(d_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        total_distance += R * c
    
    avg_speed = traj_df['speed_kmh'].mean() if 'speed_kmh' in traj_df.columns else 0
    max_speed = traj_df['speed_kmh'].max() if 'speed_kmh' in traj_df.columns else 0
    duration_min = (traj_df['record_time'].max() - traj_df['record_time'].min()).total_seconds() / 60
    
    rider_orders = orders_df[orders_df['rider_id'] == rider_id]
    
    metrics = [
        dbc.Row([
            dbc.Col([
                html.P("行驶距离", className="text-muted mb-1"),
                html.H5(f"{total_distance:.2f} km", className="text-primary")
            ])
        ]),
        html.Hr(className="my-2"),
        dbc.Row([
            dbc.Col([
                html.P("平均速度", className="text-muted mb-1"),
                html.H5(f"{avg_speed:.1f} km/h", className="text-success")
            ])
        ]),
        html.Hr(className="my-2"),
        dbc.Row([
            dbc.Col([
                html.P("最高速度", className="text-muted mb-1"),
                html.H5(f"{max_speed:.1f} km/h", className="text-warning")
            ])
        ]),
        html.Hr(className="my-2"),
        dbc.Row([
            dbc.Col([
                html.P("在线时长", className="text-muted mb-1"),
                html.H5(f"{duration_min:.0f} 分钟", className="text-info")
            ])
        ]),
        html.Hr(className="my-2"),
        dbc.Row([
            dbc.Col([
                html.P("配送订单", className="text-muted mb-1"),
                html.H5(f"{len(rider_orders)} 单", className="text-primary")
            ])
        ])
    ]
    
    return metrics


from dash import html
import dash_bootstrap_components as dbc
