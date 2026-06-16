import pandas as pd
import numpy as np
from datetime import datetime
import plotly.graph_objects as go
from utils.style_config import COLORS, CHART_COLORS


def format_number(num, suffix=''):
    if pd.isna(num) or num is None:
        return '-'
    if isinstance(num, float):
        if num >= 10000:
            return f'{num/10000:.1f}万{suffix}'
        return f'{num:.2f}{suffix}'
    return f'{num}{suffix}'


def format_percent(num):
    if pd.isna(num) or num is None:
        return '-'
    return f'{num:.2f}%'


def format_date(date_val):
    if pd.isna(date_val) or date_val is None:
        return '-'
    if isinstance(date_val, str):
        return date_val
    return date_val.strftime('%Y-%m-%d')


def format_datetime(dt_val):
    if pd.isna(dt_val) or dt_val is None:
        return '-'
    if isinstance(dt_val, str):
        return dt_val
    return dt_val.strftime('%Y-%m-%d %H:%M:%S')


def get_date_range(days_back=30):
    end_date = datetime.now().date()
    start_date = end_date - pd.Timedelta(days=days_back)
    return start_date, end_date


def create_metric_card(title, value, subtext=None, color=COLORS['primary']):
    return go.Indicator(
        mode='number+delta',
        value=value,
        title={'text': f'<span style="font-size: 16px; color: {COLORS["text_light"]}">{title}</span>'},
        number={
            'font': {'size': 28, 'color': color},
            'prefix': ''
        },
        delta=None
    )


def create_gauge_chart(value, title, max_val=100, unit='%'):
    return go.Figure(go.Indicator(
        mode='gauge+number',
        value=value,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': title, 'font': {'size': 14}},
        number={'suffix': unit, 'font': {'size': 20}},
        gauge={
            'axis': {'range': [None, max_val]},
            'bar': {'color': COLORS['primary']},
            'steps': [
                {'range': [0, max_val*0.6], 'color': '#E8F5E9'},
                {'range': [max_val*0.6, max_val*0.85], 'color': '#FFF3E0'},
                {'range': [max_val*0.85, max_val], 'color': '#FFEBEE'}
            ],
            'threshold': {
                'line': {'color': COLORS['danger'], 'width': 4},
                'thickness': 0.75,
                'value': max_val*0.85
            }
        }
    ))


def safe_df_to_records(df):
    if df is None or df.empty:
        return []
    df = df.replace({np.nan: None})
    return df.to_dict('records')


def generate_table_columns(df, exclude_columns=None):
    if exclude_columns is None:
        exclude_columns = []
    columns = []
    for col in df.columns:
        if col in exclude_columns:
            continue
        columns.append({
            'name': col,
            'id': col,
            'selectable': True,

        })
    return columns


def get_status_badge(status, status_colors):
    color = status_colors.get(status, COLORS['gray'])
    return f'''
    <span style="
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        background-color: {color}20;
        color: {color};
        font-size: 12px;
        font-weight: 500;
        border: 1px solid {color}40;
    ">{status}</span>
    '''


def create_datatable(**kwargs):
    from dash import dash_table
    defaults = {
        'sort_action': 'native',
        'filter_action': 'native',
        'page_action': 'native',
        'page_size': 10,
        'style_table': {'overflowX': 'auto'},
        'style_header': {
            'backgroundColor': COLORS['primary_light'],
            'color': COLORS['primary'],
            'fontWeight': 'bold',
            'textAlign': 'left'
        },
        'style_cell': {
            'padding': '10px',
            'textAlign': 'left',
            'borderBottom': f'1px solid {COLORS["border"]}'
        },
        'style_data_conditional': [
            {'if': {'row_index': 'odd'}, 'backgroundColor': COLORS['background']}
        ]
    }
    defaults.update(kwargs)
    return dash_table.DataTable(**defaults)
