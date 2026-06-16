COLORS = {
    'primary': '#1E88E5',
    'secondary': '#FFC107',
    'success': '#4CAF50',
    'danger': '#F44336',
    'warning': '#FF9800',
    'info': '#00BCD4',
    'dark': '#37474F',
    'light': '#F5F7FA',
    'white': '#FFFFFF',
    'gray': '#9E9E9E',
    'border': '#E0E0E0',
    'background': '#FAFAFA',
    'text': '#212121',
    'text_light': '#757575',
}

CHART_COLORS = [
    '#1E88E5', '#4CAF50', '#FFC107', '#F44336', '#00BCD4',
    '#9C27B0', '#FF9800', '#607D8B', '#E91E63', '#009688'
]

RISK_COLORS = {
    '已过期': '#F44336',
    '临期(30天内)': '#FF9800',
    '近效期(90天内)': '#FFC107',
    '半年内': '#4CAF50',
    '正常': '#1E88E5',
}

TASK_STATUS_COLORS = {
    '待处理': '#F44336',
    '处理中': '#FF9800',
    '已完成': '#4CAF50',
    '已取消': '#9E9E9E',
}

FOLLOWUP_STATUS_COLORS = {
    '已完成': '#4CAF50',
    '进行中': '#FF9800',
    '待处理': '#F44336',
    '无需回访': '#9E9E9E',
}

CARD_STYLE = {
    'padding': '20px',
    'margin': '10px 0',
    'backgroundColor': COLORS['white'],
    'borderRadius': '8px',
    'boxShadow': '0 2px 8px rgba(0,0,0,0.1)'
}

HEADER_STYLE = {
    'backgroundColor': COLORS['primary'],
    'color': COLORS['white'],
    'padding': '20px 30px',
    'marginBottom': '20px',
    'borderRadius': '8px'
}

METRIC_CARD_STYLE = {
    'padding': '20px',
    'textAlign': 'center',
    'backgroundColor': COLORS['white'],
    'borderRadius': '8px',
    'boxShadow': '0 2px 8px rgba(0,0,0,0.1)',
    'borderLeft': f'4px solid {COLORS["primary"]}'
}

TABLE_STYLE = {
    'overflowX': 'auto',
    'overflowY': 'auto',
    'maxHeight': '500px'
}

TAB_STYLE = {
    'backgroundColor': COLORS['light'],
    'border': f'1px solid {COLORS["border"]}',
    'borderBottom': 'none',
    'padding': '12px 24px',
    'fontWeight': '500',
    'color': COLORS['text_light']
}

TAB_SELECTED_STYLE = {
    'backgroundColor': COLORS['white'],
    'border': f'1px solid {COLORS["primary"]}',
    'borderBottom': f'3px solid {COLORS["primary"]}',
    'padding': '12px 24px',
    'fontWeight': '600',
    'color': COLORS['primary']
}

SIDEBAR_STYLE = {
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'bottom': 0,
    'width': '240px',
    'padding': '20px',
    'backgroundColor': COLORS['dark'],
    'color': COLORS['white']
}

CONTENT_STYLE = {
    'marginLeft': '260px',
    'marginRight': '20px',
    'padding': '20px',
    'backgroundColor': COLORS['background']
}
