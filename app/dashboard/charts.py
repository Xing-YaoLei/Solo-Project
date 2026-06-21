from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots


COLOR_PALETTE = {
    'primary': '#1F4E79',
    'secondary': '#2E75B6',
    'accent': '#4472C4',
    'success': '#70AD47',
    'warning': '#FFC000',
    'danger': '#C00000',
    'info': '#5B9BD5',
    'light': '#D6E4F0',
    'text': '#333333',
    'muted': '#808080',
}

STAGE_COLORS = {
    '咨询': '#5B9BD5',
    '立案': '#70AD47',
    '举证': '#FFC000',
    '开庭': '#ED7D31',
    '调解': '#7030A0',
    '判决': '#4472C4',
    '上诉': '#C00000',
    '执行': '#00B0F0',
    '结案归档': '#7F7F7F',
}

RISK_COLORS = {
    '高危': '#C00000',
    '中危': '#FFC000',
    '低危': '#70AD47',
}


class ClientTrendChart:
    @staticmethod
    def build(df: pd.DataFrame, title: str = '客户档案增长趋势') -> go.Figure:
        if df.empty or 'month' not in df.columns:
            fig = go.Figure()
            fig.add_annotation(
                text='暂无客户数据', showarrow=False,
                font=dict(size=18, color=COLOR_PALETTE['muted'])
            )
            ClientTrendChart._style_layout(fig, title)
            return fig

        fig = make_subplots(
            rows=2, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            row_heights=[0.6, 0.4],
            specs=[[{"type": "scatter"}], [{"type": "bar"}]]
        )

        client_types = [c for c in df.columns if c not in ['month', '累计']]
        for ct in client_types:
            fig.add_trace(
                go.Bar(
                    x=df['month'],
                    y=df[ct],
                    name=ct,
                    hovertemplate=f'{ct}: %{{y}} 人<extra></extra>',
                    marker_line_width=0
                ),
                row=2, col=1
            )

        if '累计' in df.columns:
            fig.add_trace(
                go.Scatter(
                    x=df['month'],
                    y=df['累计'],
                    name='累计客户',
                    mode='lines+markers',
                    line=dict(color=COLOR_PALETTE['primary'], width=3),
                    marker=dict(size=8, line=dict(width=2, color='white')),
                    fill='tozeroy',
                    fillcolor='rgba(31, 78, 121, 0.1)',
                    hovertemplate='累计: %{y} 人<extra></extra>'
                ),
                row=1, col=1
            )

        ClientTrendChart._style_layout(fig, title)
        fig.update_layout(
            barmode='stack',
            legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
        )
        fig.update_yaxes(title_text='累计客户数', row=1, col=1, gridcolor='#EEEEEE')
        fig.update_yaxes(title_text='月度新增', row=2, col=1, gridcolor='#EEEEEE')
        fig.update_xaxes(showgrid=False)
        return fig

    @staticmethod
    def _style_layout(fig: go.Figure, title: str):
        fig.update_layout(
            title=dict(
                text=title,
                font=dict(size=18, color=COLOR_PALETTE['primary'], family='Microsoft YaHei'),
                x=0.5, xanchor='center'
            ),
            height=480,
            margin=dict(l=60, r=30, t=80, b=50),
            plot_bgcolor='white',
            paper_bgcolor='white',
            font=dict(family='Microsoft YaHei, SimHei, sans-serif', size=11),
            hoverlabel=dict(bgcolor='white', font_size=12, font_family='Microsoft YaHei')
        )


class CaseStageChart:
    STAGE_ORDER = ['咨询', '立案', '举证', '开庭', '调解', '判决', '上诉', '执行', '结案归档']

    @staticmethod
    def build(df: pd.DataFrame, title: str = '案件阶段构成') -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text='暂无案件数据', showarrow=False,
                font=dict(size=18, color=COLOR_PALETTE['muted'])
            )
            CaseStageChart._style_layout(fig, title)
            return fig

        fig = make_subplots(
            rows=1, cols=2,
            column_widths=[0.55, 0.45],
            specs=[[{"type": "bar"}, {"type": "pie"}]]
        )

        valid_stages = [s for s in CaseStageChart.STAGE_ORDER if s in df['阶段'].values]
        filtered = df[df['阶段'].isin(valid_stages)].copy()

        bar_colors = [STAGE_COLORS.get(s, COLOR_PALETTE['accent']) for s in filtered['阶段']]
        fig.add_trace(
            go.Bar(
                x=filtered['阶段'],
                y=filtered['数量'],
                marker=dict(color=bar_colors, line=dict(width=0)),
                text=filtered['数量'],
                textposition='outside',
                texttemplate='%{text} 件',
                hovertemplate=(
                    '<b>%{x}</b><br>'
                    '案件数: %{y} 件<br>'
                    '占比: %{customdata[0]}%<br>'
                    '平均标的: ¥%{customdata[1]:,.0f}<extra></extra>'
                ),
                customdata=filtered[['占比', '平均金额']].values
            ),
            row=1, col=1
        )

        pie_df = filtered[filtered['数量'] > 0].copy()
        pie_colors = [STAGE_COLORS.get(s, COLOR_PALETTE['accent']) for s in pie_df['阶段']]
        fig.add_trace(
            go.Pie(
                labels=pie_df['阶段'],
                values=pie_df['数量'],
                hole=0.5,
                marker=dict(colors=pie_colors, line=dict(color='white', width=2)),
                textinfo='label+percent',
                textfont=dict(size=11),
                sort=False,
                direction='clockwise',
                hovertemplate='<b>%{label}</b><br>%{value} 件 (%{percent})<extra></extra>'
            ),
            row=1, col=2
        )

        total = filtered['数量'].sum()
        fig.add_annotation(
            text=f'<b>总计</b><br><span style="font-size:22px;color:{COLOR_PALETTE["primary"]}">{total}</span><br>件',
            x=0.77, y=0.5, showarrow=False,
            font=dict(size=12, color=COLOR_PALETTE['muted'])
        )

        CaseStageChart._style_layout(fig, title)
        fig.update_yaxes(title_text='案件数量', row=1, col=1, gridcolor='#EEEEEE')
        fig.update_xaxes(showgrid=False, tickangle=30, row=1, col=1)
        fig.update_layout(showlegend=False)
        return fig

    @staticmethod
    def _style_layout(fig: go.Figure, title: str):
        fig.update_layout(
            title=dict(
                text=title,
                font=dict(size=18, color=COLOR_PALETTE['primary'], family='Microsoft YaHei'),
                x=0.5, xanchor='center'
            ),
            height=480,
            margin=dict(l=60, r=30, t=80, b=80),
            plot_bgcolor='white',
            paper_bgcolor='white',
            font=dict(family='Microsoft YaHei, SimHei, sans-serif', size=11),
            hoverlabel=dict(bgcolor='white', font_size=12, font_family='Microsoft YaHei')
        )


class EvidenceTable:
    @staticmethod
    def build(df: pd.DataFrame, title: str = '证据附件明细') -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.add_annotation(
                text='暂无证据数据', showarrow=False,
                font=dict(size=18, color=COLOR_PALETTE['muted'])
            )
            EvidenceTable._style_layout(fig, title)
            return fig

        display_cols = [
            ('证据编号', 'evidence_code'),
            ('证据名称', 'evidence_name'),
            ('类型', 'evidence_type'),
            ('状态', 'status'),
            ('关联案件', 'case_number'),
            ('文件大小', 'file_size'),
            ('是否提交', 'submitted_to_court'),
            ('入库时间', 'created_at')
        ]
        available = [(cn, ck) for cn, ck in display_cols if ck in df.columns]
        if not available:
            available = list(zip(df.columns[:8], df.columns[:8]))

        header_vals = [cn for cn, _ in available]
        cell_vals = []
        fill_colors = []

        status_idx = None
        submitted_idx = None
        for i, (cn, ck) in enumerate(available):
            col_data = df[ck].copy()
            if ck == 'file_size':
                col_data = col_data.apply(lambda x: f'{int(x)/1024:.1f}KB' if pd.notna(x) and x != '' else '-')
            elif ck == 'submitted_to_court':
                col_data = col_data.apply(lambda x: '✓ 已提交' if x else '○ 未提交')
            elif ck == 'created_at':
                col_data = pd.to_datetime(col_data, errors='coerce').dt.strftime('%Y-%m-%d')
                col_data = col_data.fillna('-')
            if ck == 'status':
                status_idx = i
            if ck == 'submitted_to_court':
                submitted_idx = i
            cell_vals.append(col_data.tolist())

        colors_map = {
            '待收集': '#FFF2CC',
            '已收集': '#E2EFDA',
            '已提交': '#DDEBF7',
            '已质证': '#EDEDED',
            '存疑': '#FCE4D6',
        }
        if status_idx is not None and 'status' in df.columns:
            fill_colors.append(df['status'].map(colors_map).fillna('white').tolist())
        else:
            fill_colors.append(['white'] * len(df))

        for _ in range(len(available) - 1):
            fill_colors.append(fill_colors[0])

        fig = go.Figure(data=[go.Table(
            header=dict(
                values=[f'<b>{h}</b>' for h in header_vals],
                fill_color=COLOR_PALETTE['primary'],
                font=dict(color='white', size=12, family='Microsoft YaHei'),
                align='center',
                height=36,
                line_color='white'
            ),
            cells=dict(
                values=cell_vals,
                fill_color=fill_colors,
                font=dict(size=11, color=COLOR_PALETTE['text'], family='Microsoft YaHei'),
                align=['center', 'left', 'center', 'center', 'center', 'center', 'center', 'center'],
                height=30,
                line_color='#EEEEEE',
                hovertemplate='%{value}<extra></extra>'
            ),
            columnwidth=[120, 240, 80, 80, 100, 80, 80, 90]
        )])

        EvidenceTable._style_layout(fig, title, df_total=len(df))
        return fig

    @staticmethod
    def _style_layout(fig: go.Figure, title: str, df_total: int = 0):
        fig.update_layout(
            title=dict(
                text=f'{title} <span style="font-size:12px;color:#808080;">(共 {df_total} 条)</span>',
                font=dict(size=18, color=COLOR_PALETTE['primary'], family='Microsoft YaHei'),
                x=0.5, xanchor='center'
            ),
            height=480,
            margin=dict(l=30, r=30, t=80, b=30),
            paper_bgcolor='white',
            font=dict(family='Microsoft YaHei, SimHei, sans-serif')
        )


class HearingAnomalyChart:
    @staticmethod
    def build(df: pd.DataFrame, hearings_all_df: Optional[pd.DataFrame] = None,
              title: str = '庭审日程与异常标注') -> go.Figure:
        if (df is None or df.empty) and (hearings_all_df is None or hearings_all_df.empty):
            fig = go.Figure()
            fig.add_annotation(
                text='暂无庭审日程数据', showarrow=False,
                font=dict(size=18, color=COLOR_PALETTE['muted'])
            )
            HearingAnomalyChart._style_layout(fig, title)
            return fig

        today = pd.Timestamp.now().normalize()
        date_window_start = today - pd.Timedelta(days=7)
        date_window_end = today + pd.Timedelta(days=60)

        all_hearings = pd.DataFrame()
        if hearings_all_df is not None and not hearings_all_df.empty:
            all_hearings = hearings_all_df.copy()
            all_hearings['scheduled_at'] = pd.to_datetime(all_hearings['scheduled_at'], errors='coerce')
            all_hearings = all_hearings[
                (all_hearings['scheduled_at'].dt.date >= date_window_start.date()) &
                (all_hearings['scheduled_at'].dt.date <= date_window_end.date())
            ].copy()

        anomaly_df = pd.DataFrame()
        if df is not None and not df.empty:
            anomaly_df = df.copy()
            anomaly_df['scheduled_at'] = pd.to_datetime(anomaly_df['scheduled_at'], errors='coerce')

        anomaly_ids = set(anomaly_df['id'].values) if 'id' in anomaly_df.columns and not anomaly_df.empty else set()

        normal_df = pd.DataFrame()
        if not all_hearings.empty:
            mask = ~all_hearings['id'].isin(anomaly_ids)
            normal_df = all_hearings[mask].copy()

        fig = go.Figure()

        fig.add_vline(
            x=today, line_dash="dash", line_color=COLOR_PALETTE['danger'], line_width=2,
            annotation_text="今", annotation_position="top right",
            annotation_font=dict(color=COLOR_PALETTE['danger'], size=12)
        )

        if not normal_df.empty:
            normal_labels = normal_df.apply(
                lambda r: f"{r.get('case_number', '')[:12]}<br>{r.get('hearing_type', '庭审')}",
                axis=1
            )
            normal_hovers = normal_df.apply(
                lambda r: HearingAnomalyChart._build_hover(r, has_anomaly=False),
                axis=1
            )
            fig.add_trace(
                go.Scatter(
                    x=normal_df['scheduled_at'],
                    y=normal_df.index % 1,
                    mode='markers',
                    name='正常庭审',
                    marker=dict(
                        symbol='circle', size=14,
                        color=COLOR_PALETTE['success'],
                        line=dict(width=2, color='white')
                    ),
                    text=normal_labels,
                    hovertext=normal_hovers,
                    hovertemplate='%{hovertext}<extra></extra>',
                    opacity=0.85
                )
            )

        if not anomaly_df.empty:
            for risk_level, color in RISK_COLORS.items():
                subset = anomaly_df[anomaly_df['紧急程度'] == risk_level] if '紧急程度' in anomaly_df.columns else anomaly_df
                if subset.empty:
                    continue
                labels = subset.apply(
                    lambda r: f"<b style='color:{color}'>⚠</b> {r.get('case_number', '')[:12]}<br>{r.get('hearing_type', '庭审')}",
                    axis=1
                )
                hovers = subset.apply(
                    lambda r: HearingAnomalyChart._build_hover(r, has_anomaly=True),
                    axis=1
                )
                fig.add_trace(
                    go.Scatter(
                        x=subset['scheduled_at'],
                        y=subset.index % 1 + 0.0,
                        mode='markers',
                        name=f'{risk_level}异常',
                        marker=dict(
                            symbol='diamond', size=20,
                            color=color,
                            line=dict(width=3, color='white')
                        ),
                        text=labels,
                        hovertext=hovers,
                        hovertemplate='%{hovertext}<extra></extra>',
                        opacity=0.95
                    )
                )

            anomaly_count_map = {}
            if '异常类型' in anomaly_df.columns:
                for types in anomaly_df['异常类型']:
                    if isinstance(types, str):
                        for t in types.split('、'):
                            anomaly_count_map[t] = anomaly_count_map.get(t, 0) + 1
                    elif isinstance(types, list):
                        for t in types:
                            anomaly_count_map[t] = anomaly_count_map.get(t, 0) + 1

        HearingAnomalyChart._style_layout(fig, title)
        fig.update_xaxes(
            title_text='开庭时间',
            showgrid=True, gridcolor='#EEEEEE', gridwidth=1,
            zeroline=False, showline=True, linecolor='#CCCCCC',
            rangeslider_visible=True,
            dtick='D7',
            tickformat='%m-%d',
            tickfont=dict(size=10),
        )
        fig.update_yaxes(visible=False, range=[-0.5, 0.5])
        fig.update_layout(
            xaxis_range=[date_window_start, date_window_end],
            legend=dict(
                orientation='h',
                yanchor='bottom', y=1.02,
                xanchor='right', x=1,
                bgcolor='rgba(255,255,255,0.8)'
            )
        )
        return fig

    @staticmethod
    def _build_hover(row: pd.Series, has_anomaly: bool) -> str:
        parts = [f"<b>{row.get('case_name', '未命名案件')}</b>"]
        if 'case_number' in row and row.get('case_number'):
            parts.append(f"案号: {row['case_number']}")
        parts.append(f"类型: {row.get('hearing_type', '庭审')}")
        sched = row.get('scheduled_at')
        if sched:
            if isinstance(sched, (pd.Timestamp, datetime)):
                parts.append(f"时间: {sched.strftime('%Y-%m-%d %H:%M')}")
            else:
                parts.append(f"时间: {sched}")
        if row.get('location'):
            parts.append(f"地点: {row['location']}")
        if row.get('主办律师'):
            parts.append(f"律师: {row['主办律师']}")
        if row.get('current_stage'):
            parts.append(f"阶段: {row['current_stage']}")
        if has_anomaly:
            if '异常类型' in row and row.get('异常类型'):
                parts.append(f"<span style='color:#C00000'><b>异常: {row['异常类型']}</b></span>")
            if '紧急程度' in row and row.get('紧急程度'):
                c = RISK_COLORS.get(row['紧急程度'], '#C00000')
                parts.append(f"<span style='color:{c}'><b>等级: {row['紧急程度']}</b></span>")
        return '<br>'.join(parts)

    @staticmethod
    def _style_layout(fig: go.Figure, title: str):
        fig.update_layout(
            title=dict(
                text=title,
                font=dict(size=18, color=COLOR_PALETTE['primary'], family='Microsoft YaHei'),
                x=0.5, xanchor='center'
            ),
            height=480,
            margin=dict(l=50, r=30, t=100, b=60),
            plot_bgcolor='white',
            paper_bgcolor='white',
            font=dict(family='Microsoft YaHei, SimHei, sans-serif', size=11),
            hoverlabel=dict(
                bgcolor='white', bordercolor='#CCCCCC',
                font_size=12, font_family='Microsoft YaHei',
                align='left'
            )
        )
