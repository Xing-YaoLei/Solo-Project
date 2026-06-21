import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any
import logging

import dash
from dash import dcc, html, Input, Output, State, no_update
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from flask import session, current_app as flask_app
from flask_login import current_user

from app.models import db, User, Case
from app.services.data_service import (
    QueryService, TrendService, FinanceService, RefreshService
)
from app.services.auth_service import AuthService, ShareLinkService, VirtualUser
from app.services.export_service import ExportService
from app.dashboard.charts import (
    ClientTrendChart, CaseStageChart, EvidenceTable, HearingAnomalyChart,
    COLOR_PALETTE, STAGE_COLORS, RISK_COLORS
)


def build_full_layout(cfg) -> html.Div:
    return html.Div(
        id='app-root',
        style={
            'backgroundColor': '#F5F7FA',
            'minHeight': '100vh',
            'fontFamily': 'Microsoft YaHei, SimHei, sans-serif'
        },
        children=[
            dcc.Location(id='url', refresh=False),
            dcc.Interval(
                id='auto-refresh-interval',
                interval=cfg.DASH_UPDATE_INTERVAL_SECONDS * 1000,
                n_intervals=0,
                disabled=False
            ),
            html.Div(id='session-store-hidden', style={'display': 'none'}),
            dcc.Store(id='user-info-store'),
            dcc.Store(id='filters-store', data={}),
            dcc.Store(id='refresh-trigger-store', data=0),
            dcc.Loading(
                id='page-loading',
                type='dot',
                color=COLOR_PALETTE['primary'],
                fullscreen=False,
                children=[
                    html.Div(id='main-container')
                ]
            ),
            _build_custom_css()
        ]
    )


def _build_custom_css():
    return html.Style('''
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
        }
        .nav-item {
            padding: 10px 20px;
            display: flex;
            align-items: center;
            color: #555;
            cursor: pointer;
            transition: all 0.15s;
            font-size: 13px;
            border-left: 3px solid transparent;
        }
        .nav-item:hover {
            background: #F5F9FC;
            color: #1F4E79;
            border-left-color: #2E75B6;
        }
        .nav-active {
            background: #F5F9FC !important;
            color: #1F4E79 !important;
            border-left-color: #1F4E79 !important;
            font-weight: 600;
        }
        .kpi-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
        }
        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.1);
        }
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 4px; height: 100%;
            background: var(--accent, #2E75B6);
        }
        .refresh-time-badge {
            float: right;
            background: #F0F4F8;
            color: #555;
            font-size: 11px;
            font-weight: 400;
            padding: 3px 10px;
            border-radius: 12px;
            border: 1px solid #E0E6ED;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .refresh-time-badge::before {
            content: '';
            width: 6px; height: 6px;
            background: #70AD47;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 2s infinite;
        }
        .anomaly-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            margin-right: 4px;
        }
        .danger-pill { background: #FCE4D6; color: #C00000; }
        .warning-pill { background: #FFF2CC; color: #7F6000; }
        .success-pill { background: #E2EFDA; color: #375623; }
        .info-pill { background: #DDEBF7; color: #1F4E79; }
    ''')


def build_dashboard_content(user, user_info: Dict[str, Any], cfg) -> html.Div:
    perms = user_info.get('permissions', {})
    can_export = perms.get('can_export', False)
    can_share = perms.get('can_share', False) and not user_info.get('is_share_view')
    can_view_finance = perms.get('can_view_finance', False)
    is_share = user_info.get('is_share_view', False)

    header = _build_header(user, user_info, perms, can_export, can_share, is_share)
    sidebar = html.Div() if is_share else _build_sidebar(user_info, cfg)
    export_modal = _build_export_modal(can_view_finance, user_info)
    share_modal = _build_share_modal(cfg, can_view_finance)

    content = html.Div([
        html.Div(id='kpi-cards', className='kpi-row', style={
            'display': 'grid',
            'gridTemplateColumns': 'repeat(auto-fit, minmax(240px, 1fr))',
            'gap': '16px',
            'marginBottom': '20px'
        }),
        dbc.Row([
            dbc.Col(md=12, lg=6, style={'marginBottom': '20px'}, children=[
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className='fas fa-chart-line',
                               style={'marginRight': '8px', 'color': COLOR_PALETTE['primary']}),
                        '客户档案趋势',
                        html.Span(id='refresh-times', className='refresh-time-badge')
                    ], style={'fontWeight': '600', 'background': '#FAFBFD'}),
                    dbc.CardBody(
                        dcc.Graph(id='trend-chart',
                                  config={'displaylogo': False, 'responsive': True},
                                  style={'height': '440px'})
                    )
                ], style={'borderRadius': '10px', 'boxShadow': '0 2px 8px rgba(0,0,0,0.06)'})
            ]),
            dbc.Col(md=12, lg=6, style={'marginBottom': '20px'}, children=[
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className='fas fa-layer-group',
                               style={'marginRight': '8px', 'color': COLOR_PALETTE['primary']}),
                        '案件阶段构成'
                    ], style={'fontWeight': '600', 'background': '#FAFBFD'}),
                    dbc.CardBody(
                        dcc.Graph(id='stage-chart',
                                  config={'displaylogo': False, 'responsive': True},
                                  style={'height': '440px'})
                    )
                ], style={'borderRadius': '10px', 'boxShadow': '0 2px 8px rgba(0,0,0,0.06)'})
            ])
        ]),
        dbc.Row([
            dbc.Col(md=12, lg=6, style={'marginBottom': '20px'}, children=[
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className='fas fa-folder-open',
                               style={'marginRight': '8px', 'color': COLOR_PALETTE['primary']}),
                        '证据附件明细'
                    ], style={'fontWeight': '600', 'background': '#FAFBFD'}),
                    dbc.CardBody(
                        dcc.Graph(id='evidence-table',
                                  config={'displaylogo': False, 'responsive': True},
                                  style={'height': '440px'})
                    )
                ], style={'borderRadius': '10px', 'boxShadow': '0 2px 8px rgba(0,0,0,0.06)'})
            ]),
            dbc.Col(md=12, lg=6, style={'marginBottom': '20px'}, children=[
                dbc.Card([
                    dbc.CardHeader([
                        html.I(className='fas fa-calendar-exclamation',
                               style={'marginRight': '8px', 'color': COLOR_PALETTE['danger']}),
                        '庭审日程异常标注'
                    ], style={'fontWeight': '600', 'background': '#FAFBFD'}),
                    dbc.CardBody(
                        dcc.Graph(id='hearing-chart',
                                  config={'displaylogo': False, 'responsive': True},
                                  style={'height': '440px'})
                    )
                ], style={'borderRadius': '10px', 'boxShadow': '0 2px 8px rgba(0,0,0,0.06)'})
            ])
        ]),
        _build_caliber_section(cfg)
    ], style={'padding': '20px'})

    return html.Div([
        header,
        html.Div([
            sidebar,
            html.Div(content, id='content-area',
                     style={
                         'marginLeft': '0' if is_share else '250px',
                         'minHeight': 'calc(100vh - 64px)',
                         'maxWidth': '100%' if is_share else 'none'
                     })
        ], style={'display': 'flex'}),
        export_modal,
        share_modal
    ])


def _build_header(user, user_info, perms, can_export, can_share, is_share):
    share_label = ''
    if is_share:
        share_ctx = user_info.get('share_context', {})
        share_label = html.Span([
            html.I(className='fas fa-share-alt', style={'marginRight': '6px'}),
            f"分享视图 · {share_ctx.get('case_name') or share_ctx.get('client_name') or '数据看板'}",
        ], style={
            'background': '#FFF2CC', 'color': '#7F6000', 'padding': '5px 14px',
            'borderRadius': '20px', 'fontSize': '12px', 'marginLeft': '16px',
            'fontWeight': '500'
        })

    user_role_map = {
        'admin': ('管理员', '#7030A0'),
        'partner': ('合伙人', '#1F4E79'),
        'lawyer': ('律师', '#2E75B6'),
        'paralegal': ('律师助理', '#5B9BD5'),
        'client': ('客户', '#ED7D31'),
        'auditor': ('审计', '#7F7F7F'),
    }
    role_name, role_color = user_role_map.get(user.role, ('访客', '#808080'))

    export_btn = ''
    if can_export:
        export_btn = dbc.Button(
            [html.I(className='fas fa-file-export', style={'marginRight': '6px'}), '导出数据'],
            id='btn-export', color='success', size='sm',
            style={'marginRight': '10px', 'fontWeight': '500'}
        )

    share_btn = ''
    if can_share:
        share_btn = dbc.Button(
            [html.I(className='fas fa-share-alt', style={'marginRight': '6px'}), '分享'],
            id='btn-share', color='light', size='sm',
            style={'marginRight': '10px', 'fontWeight': '500'}
        )

    logout_link = ''
    if not is_share:
        logout_link = html.A([
            html.I(className='fas fa-sign-out-alt',
                   style={'marginLeft': '14px', 'color': 'rgba(255,255,255,0.8)', 'fontSize': '16px'}),
        ], href='/logout', title='退出登录', style={'textDecoration': 'none'})

    return html.Header([
        html.Div([
            html.A([
                html.I(className='fas fa-gavel',
                       style={'fontSize': '24px', 'marginRight': '12px', 'color': 'white'}),
                html.Span('法律服务案件委托风险监测',
                          style={'fontSize': '18px', 'fontWeight': '700', 'letterSpacing': '1px'}),
                share_label
            ], style={'display': 'flex', 'alignItems': 'center', 'color': 'white', 'textDecoration': 'none'})
        ], style={'display': 'flex', 'alignItems': 'center'}),
        html.Div([
            html.Button(
                [html.I(className='fas fa-sync-alt', style={'marginRight': '6px'}), '刷新'],
                id='btn-refresh-now',
                style={
                    'background': 'rgba(255,255,255,0.15)', 'color': 'white',
                    'border': '1px solid rgba(255,255,255,0.25)', 'borderRadius': '6px',
                    'padding': '7px 16px', 'cursor': 'pointer', 'marginRight': '10px',
                    'fontSize': '13px', 'fontWeight': '500'
                }
            ),
            share_btn,
            export_btn,
            html.Div([
                html.Div([
                    html.I(className='fas fa-user-circle',
                           style={'fontSize': '28px', 'opacity': '0.9', 'color': 'white'})
                ], style={'marginRight': '10px'}),
                html.Div([
                    html.Div(getattr(user, 'full_name', '访客'),
                             style={'color': 'white', 'fontWeight': '600', 'fontSize': '14px'}),
                    html.Span(role_name, style={
                        'background': role_color, 'color': 'white',
                        'padding': '2px 8px', 'borderRadius': '10px',
                        'fontSize': '11px', 'display': 'inline-block', 'marginTop': '2px'
                    })
                ]),
                logout_link
            ], style={'display': 'flex', 'alignItems': 'center'})
        ], style={'display': 'flex', 'alignItems': 'center'})
    ], style={
        'background': f'linear-gradient(135deg, {COLOR_PALETTE["primary"]}, {COLOR_PALETTE["secondary"]})',
        'padding': '0 32px', 'height': '64px',
        'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between',
        'boxShadow': '0 2px 12px rgba(31,78,121,0.25)',
        'position': 'sticky', 'top': '0', 'zIndex': '1000'
    })


def _build_sidebar(user_info, cfg):
    perms = user_info.get('permissions', {})
    scope_desc_map = {
        'admin': '全所数据',
        'partner': '部门数据',
        'lawyer': '本人案件',
        'paralegal': '团队案件',
        'auditor': '只读审计',
        'client': '我的委托'
    }
    scope = scope_desc_map.get(user_info.get('role', ''), '默认范围')
    dept = user_info.get('department', '-')
    can_view_finance = perms.get('can_view_finance', False)

    return html.Aside([
        html.Div([
            html.Div('数据范围', style={
                'fontSize': '11px', 'color': '#808080', 'marginBottom': '6px',
                'textTransform': 'uppercase', 'letterSpacing': '0.5px'
            }),
            html.Div([
                html.I(className='fas fa-shield-alt',
                       style={'marginRight': '8px', 'color': COLOR_PALETTE['primary']}),
                scope
            ], style={'fontWeight': '600', 'color': '#333', 'fontSize': '14px'}),
            html.Div(f'部门：{dept}', style={
                'fontSize': '12px', 'color': '#808080', 'marginTop': '4px'
            }),
        ], style={'padding': '20px', 'borderBottom': '1px solid #EEE'}),

        html.Div([
            html.Div('模块导航', style={
                'fontSize': '11px', 'color': '#808080', 'marginBottom': '12px',
                'padding': '0 20px', 'textTransform': 'uppercase', 'letterSpacing': '0.5px'
            }),
            html.Div([
                html.Div([
                    html.I(className='fas fa-th-large', style={'marginRight': '10px'}),
                    '监测总览',
                    html.Span('●', style={'marginLeft': 'auto', 'color': COLOR_PALETTE['primary'],
                                          'fontWeight': '600', 'fontSize': '10px'})
                ], className='nav-item nav-active'),
                html.Div([
                    html.I(className='fas fa-users', style={'marginRight': '10px'}),
                    '客户档案',
                    html.Span('', style={'marginLeft': 'auto', 'color': '#AAA', 'fontSize': '11px'})
                ], className='nav-item'),
                html.Div([
                    html.I(className='fas fa-briefcase', style={'marginRight': '10px'}),
                    '案件管理',
                ], className='nav-item'),
                html.Div([
                    html.I(className='fas fa-file-alt', style={'marginRight': '10px'}),
                    '证据管理',
                ], className='nav-item'),
                html.Div([
                    html.I(className='fas fa-gavel', style={'marginRight': '10px'}),
                    '庭审日程',
                ], className='nav-item'),
                html.Div([
                    html.I(className='fas fa-coins',
                           style={'marginRight': '10px',
                                  'opacity': '1' if can_view_finance else '0.35'}),
                    '收款台账',
                    html.Span('🔒' if not can_view_finance else '',
                              style={'marginLeft': 'auto', 'fontSize': '11px'})
                ], className='nav-item',
                    style={'opacity': '1' if can_view_finance else '0.5'}),
            ])
        ], style={'paddingTop': '16px'}),

        html.Div([
            html.Div('自动刷新', style={
                'fontSize': '11px', 'color': '#808080', 'marginBottom': '8px',
                'padding': '0 20px', 'textTransform': 'uppercase', 'letterSpacing': '0.5px'
            }),
            html.Div([
                html.I(className='fas fa-clock', style={'marginRight': '10px', 'color': '#70AD47'}),
                f'每 {cfg.DASH_UPDATE_INTERVAL_SECONDS // 60} 分钟',
                html.Span([
                    html.Div(style={
                        'width': '8px', 'height': '8px', 'background': '#70AD47',
                        'borderRadius': '50%', 'animation': 'pulse 2s infinite',
                        'marginLeft': 'auto'
                    })
                ], style={'marginLeft': 'auto', 'display': 'flex', 'alignItems': 'center'})
            ], className='nav-item', style={'cursor': 'default'})
        ], style={'marginTop': '20px'}),

    ], style={
        'width': '250px', 'background': 'white',
        'boxShadow': '2px 0 8px rgba(0,0,0,0.04)', 'minHeight': 'calc(100vh - 64px)',
        'position': 'fixed', 'left': '0', 'top': '64px', 'zIndex': '900',
        'overflowY': 'auto'
    })


def build_kpi_cards(cases_df, hearings_df, hearing_anomaly_df, evidence_df, payments_df) -> html.Div:
    total_cases = len(cases_df) if not cases_df.empty else 0
    active_cases = len(cases_df[cases_df['status'] == 'active']) if not cases_df.empty and 'status' in cases_df.columns else 0
    high_risk = 0
    if not cases_df.empty and 'risk_assessment' in cases_df.columns:
        high_risk = len(cases_df[cases_df['risk_assessment'] == 'high'])

    now = pd.Timestamp.now(tz='UTC').tz_localize(None)
    total_hearings = 0
    if not hearings_df.empty:
        hearings_dt = pd.to_datetime(hearings_df['scheduled_at'], errors='coerce')
        total_hearings = len(hearings_df[hearings_dt >= now - pd.Timedelta(days=1)])

    anomaly_count = len(hearing_anomaly_df) if not hearing_anomaly_df.empty else 0
    high_anomaly = 0
    if not hearing_anomaly_df.empty and '紧急程度' in hearing_anomaly_df.columns:
        high_anomaly = len(hearing_anomaly_df[hearing_anomaly_df['紧急程度'] == '高危'])

    total_evidence = len(evidence_df) if not evidence_df.empty else 0
    pending_evidence = 0
    if not evidence_df.empty and 'status' in evidence_df.columns:
        pending_evidence = len(evidence_df[evidence_df['status'].isin(['待收集', '存疑'])])

    total_claim = 0.0
    overdue_amount = 0.0
    if not cases_df.empty and 'claim_amount' in cases_df.columns:
        try:
            total_claim = float(cases_df['claim_amount'].sum())
        except Exception:
            total_claim = 0.0
    if not payments_df.empty:
        try:
            overdue_mask = (payments_df.get('is_overdue') == True) & (payments_df.get('status') != '已结清')
            if 'scheduled_amount' in payments_df.columns:
                overdue_amount = float(payments_df[overdue_mask]['scheduled_amount'].sum()) if overdue_mask.any() else 0.0
            elif 'actual_amount' in payments_df.columns:
                overdue_amount = float(payments_df[overdue_mask]['actual_amount'].sum()) if overdue_mask.any() else 0.0
        except Exception:
            overdue_amount = 0.0

    def _fmt_amount(val: float) -> str:
        if val >= 100000000:
            return f'{val/100000000:.2f}亿'
        elif val >= 10000:
            return f'{val/10000:.1f}万'
        return f'{val:,.0f}'

    cards = [
        _kpi_card('在办案件', f'{active_cases}',
                  f'共 {total_cases} 件委托',
                  'fas fa-briefcase', COLOR_PALETTE['primary'],
                  sub_badge=f'高风险 {high_risk}' if high_risk > 0 else None,
                  sub_badge_type='danger' if high_risk > 0 else None),
        _kpi_card('近期庭审', f'{total_hearings}',
                  f'未来60天排期',
                  'fas fa-gavel', COLOR_PALETTE['accent'],
                  sub_badge=f'异常 {anomaly_count}' if anomaly_count > 0 else None,
                  sub_badge_type='danger' if anomaly_count > 0 else None),
        _kpi_card('高危异常', f'{high_anomaly}',
                  f'庭审异常 {anomaly_count} 项',
                  'fas fa-exclamation-triangle', COLOR_PALETTE['danger'],
                  sub_badge='需立即处理' if high_anomaly > 0 else '暂无紧急事项',
                  sub_badge_type='warning' if high_anomaly == 0 else 'danger'),
        _kpi_card('证据管理', f'{total_evidence}',
                  f'已归档证据文件',
                  'fas fa-folder-open', '#7030A0',
                  sub_badge=f'待处理 {pending_evidence}' if pending_evidence > 0 else '全部就绪',
                  sub_badge_type='warning' if pending_evidence > 0 else 'success'),
    ]

    if payments_df is not None and not payments_df.empty:
        cards.append(
            _kpi_card('诉讼标的', f'¥{_fmt_amount(total_claim)}',
                      '全部案件标的总额',
                      'fas fa-chart-pie', COLOR_PALETTE['success'],
                      sub_badge=f'逾期 ¥{_fmt_amount(overdue_amount)}' if overdue_amount > 0 else '回款正常',
                      sub_badge_type='danger' if overdue_amount > 0 else 'success')
        )

    return cards


def _kpi_card(title: str, value: str, desc: str,
              icon: str, accent_color: str,
              sub_badge: str = None, sub_badge_type: str = None) -> dbc.Card:
    badge_class = 'info-pill'
    if sub_badge_type == 'danger':
        badge_class = 'danger-pill'
    elif sub_badge_type == 'warning':
        badge_class = 'warning-pill'
    elif sub_badge_type == 'success':
        badge_class = 'success-pill'

    badge_html = ''
    if sub_badge:
        badge_html = html.Span(sub_badge, className=f'anomaly-pill {badge_class}')

    return dbc.Card([
        dbc.CardBody([
            html.Div([
                html.Div([
                    html.I(className=icon,
                           style={'fontSize': '22px', 'color': accent_color})
                ], style={
                    'width': '48px', 'height': '48px', 'borderRadius': '10px',
                    'background': f'{accent_color}15',
                    'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center'
                }),
                html.Div([
                    html.Div(title, style={
                        'fontSize': '12px', 'color': '#808080', 'marginBottom': '4px'
                    }),
                    html.Div(value, style={
                        'fontSize': '26px', 'fontWeight': '700',
                        'color': '#1a1a1a', 'lineHeight': '1.2'
                    })
                ], style={'marginLeft': '14px'})
            ], style={'display': 'flex', 'alignItems': 'center', 'marginBottom': '12px'}),
            html.Div([
                html.Div(desc, style={'fontSize': '12px', 'color': '#808080', 'flex': '1'}),
                badge_html
            ], style={'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between'})
        ])
    ], className='kpi-card', style={'--accent': accent_color})


def build_refresh_time_display(refresh_data: Dict) -> html.Div:
    overall = refresh_data.get('overall') or refresh_data.get('mv')
    if overall:
        try:
            dt = datetime.fromisoformat(overall.replace('Z', '+00:00'))
            time_str = dt.astimezone().strftime('%m-%d %H:%M')
        except Exception:
            time_str = str(overall)[:16].replace('T', ' ')
    else:
        time_str = datetime.now().strftime('%m-%d %H:%M')
    return html.Span([
        html.I(className='far fa-clock', style={'marginRight': '4px'}),
        f'更新于 {time_str}'
    ])


def _build_caliber_section(cfg) -> html.Div:
    caliber_notes = cfg.EXPORT_CALIBER_NOTES
    cards = []
    icons = {
        'case_stage': 'fas fa-layer-group',
        'payment_status': 'fas fa-coins',
        'evidence_status': 'fas fa-file-alt',
        'hearing_status': 'fas fa-gavel',
    }
    for section, items in caliber_notes.items():
        rows = []
        if isinstance(items, dict):
            for k, desc in items.items():
                rows.append(html.Tr([
                    html.Td(k, style={
                        'padding': '6px 10px', 'borderBottom': '1px solid #F0F0F0',
                        'fontWeight': '500', 'color': '#333', 'whiteSpace': 'nowrap',
                        'width': '100px', 'fontSize': '12px'
                    }),
                    html.Td(desc, style={
                        'padding': '6px 10px', 'borderBottom': '1px solid #F0F0F0',
                        'fontSize': '11px', 'color': '#666', 'lineHeight': '1.5'
                    })
                ]))
        title_map = {
            'case_stage': '案件阶段口径',
            'payment_status': '收款状态口径',
            'evidence_status': '证据状态口径',
            'hearing_status': '庭审状态口径',
        }
        cards.append(html.Div([
            html.Div([
                html.I(className=icons.get(section, 'fas fa-info-circle'),
                       style={'marginRight': '8px', 'color': COLOR_PALETTE['primary']}),
                html.Span(title_map.get(section, section), style={'fontWeight': '600', 'color': '#333'})
            ], style={'marginBottom': '8px', 'fontSize': '13px'}),
            html.Table([html.Tbody(rows)], style={'width': '100%', 'borderCollapse': 'collapse'})
        ], style={
            'background': '#FAFBFD', 'padding': '14px',
            'borderRadius': '8px', 'border': '1px solid #EEF2F7',
            'minHeight': '100%'
        }))

    return html.Div([
        html.Div([
            html.I(className='fas fa-book-open',
                   style={'marginRight': '10px', 'color': COLOR_PALETTE['primary']}),
            html.Span('案件进展口径说明',
                      style={'fontSize': '15px', 'fontWeight': '700', 'color': '#1a1a1a'}),
            html.Span('（导出文件将包含完整口径定义）',
                      style={'marginLeft': '10px', 'fontSize': '12px', 'color': '#808080', 'fontWeight': '400'})
        ], style={'marginBottom': '14px'}),
        html.Div(cards, style={
            'display': 'grid',
            'gridTemplateColumns': 'repeat(auto-fit, minmax(280px, 1fr))',
            'gap': '14px'
        })
    ])


def _build_export_modal(can_view_finance: bool, user_info: Dict) -> dbc.Modal:
    finance_disabled = not can_view_finance
    finance_value = ['include'] if can_view_finance else []

    return dbc.Modal([
        dbc.ModalHeader([
            html.I(className='fas fa-file-export',
                   style={'marginRight': '10px', 'color': COLOR_PALETTE['success']}),
            '导出监测数据'
        ], style={'background': '#FAFBFD'}),
        dbc.ModalBody([
            html.Div([
                html.Label('导出选项', style={
                    'display': 'block', 'marginBottom': '10px',
                    'fontWeight': '600', 'color': '#333'
                }),
                dcc.Checklist(
                    id='include-finance-checklist',
                    options=[
                        {'label': '  包含财务明细（收款流水、标的金额）', 'value': 'include',
                         'disabled': finance_disabled}
                    ],
                    value=finance_value,
                    inputStyle={'marginRight': '6px'},
                    style={
                        'padding': '12px', 'background': '#F8FAFC',
                        'borderRadius': '6px', 'border': '1px solid #E8EEF5'
                    }
                ),
                html.Div([
                    html.I(className='fas fa-info-circle', style={'marginRight': '6px', 'color': '#5B9BD5'}),
                    '导出文件为 .xlsx 格式，包含：客户趋势、案件分布、证据明细、庭审异常、总览表、'
                    '数据口径页、导出信息页',
                ], style={
                    'marginTop': '14px', 'padding': '12px',
                    'background': '#EAF3FB', 'borderRadius': '6px',
                    'fontSize': '12px', 'color': '#1F4E79', 'lineHeight': '1.7'
                }),
                html.Div(id='export-status', style={'marginTop': '16px'}),
                html.A(
                    [html.I(className='fas fa-download', style={'marginRight': '6px'}), '下载导出文件'],
                    id='export-download-link',
                    href='',
                    target='_blank',
                    style={
                        'display': 'none',
                        'padding': '10px 20px',
                        'background': COLOR_PALETTE['success'],
                        'color': 'white', 'textDecoration': 'none',
                        'borderRadius': '6px', 'fontWeight': '500',
                        'textAlign': 'center'
                    }
                )
            ])
        ]),
        dbc.ModalFooter([
            dbc.Button('取消', id='btn-close-export', color='secondary', size='sm'),
            dbc.Button(
                [html.I(className='fas fa-file-excel', style={'marginRight': '6px'}), '确认导出'],
                id='btn-confirm-export', color='success', size='sm'
            )
        ])
    ], id='export-modal', is_open=False, size='md', centered=True, backdrop=True)


def _build_share_modal(cfg, can_view_finance: bool) -> dbc.Modal:
    finance_disabled = not can_view_finance

    return dbc.Modal([
        dbc.ModalHeader([
            html.I(className='fas fa-share-alt',
                   style={'marginRight': '10px', 'color': COLOR_PALETTE['accent']}),
            '生成分享链接'
        ], style={'background': '#FAFBFD'}),
        dbc.ModalBody([
            html.Div([
                html.Div([
                    html.Label('分享范围（角色）', style={
                        'display': 'block', 'marginBottom': '6px',
                        'fontWeight': '500', 'color': '#333', 'fontSize': '13px'
                    }),
                    dcc.Dropdown(
                        id='share-role-select',
                        options=[
                            {'label': '客户视角（仅本人案件）', 'value': 'client'},
                            {'label': '律师视角（本人负责）', 'value': 'lawyer'},
                            {'label': '审计视角（只读全部）', 'value': 'auditor'},
                        ],
                        value='client',
                        clearable=False,
                        style={'fontSize': '13px'}
                    )
                ], style={'marginBottom': '14px'}),

                html.Div([
                    html.Label('有效期', style={
                        'display': 'block', 'marginBottom': '6px',
                        'fontWeight': '500', 'color': '#333', 'fontSize': '13px'
                    }),
                    dcc.Dropdown(
                        id='share-ttl-select',
                        options=[
                            {'label': '1 小时', 'value': 1},
                            {'label': '24 小时', 'value': 24},
                            {'label': '72 小时（推荐）', 'value': 72},
                            {'label': '7 天', 'value': 168},
                        ],
                        value=72,
                        clearable=False,
                        style={'fontSize': '13px'}
                    )
                ], style={'marginBottom': '14px'}),

                html.Div([
                    html.Label('包含内容', style={
                        'display': 'block', 'marginBottom': '6px',
                        'fontWeight': '500', 'color': '#333', 'fontSize': '13px'
                    }),
                    dcc.Checklist(
                        id='share-finance-checklist',
                        options=[
                            {'label': '  允许查看财务数据', 'value': 'include',
                             'disabled': finance_disabled}
                        ],
                        value=[],
                        inputStyle={'marginRight': '6px'},
                        style={
                            'padding': '10px', 'background': '#F8FAFC',
                            'borderRadius': '6px', 'border': '1px solid #E8EEF5',
                            'fontSize': '13px'
                        }
                    ),
                    html.Div('若当前角色无财务权限，此选项默认禁用',
                             style={'fontSize': '11px', 'color': '#808080', 'marginTop': '4px'})
                ], style={'marginBottom': '14px'}),

                html.Div([
                    html.Label('限定案件（可选）', style={
                        'display': 'block', 'marginBottom': '6px',
                        'fontWeight': '500', 'color': '#333', 'fontSize': '13px'
                    }),
                    dcc.Dropdown(
                        id='share-case-select',
                        options=[],
                        placeholder='不选则分享全部可见案件',
                        multi=True,
                        style={'fontSize': '13px'}
                    )
                ], style={'marginBottom': '14px'}),

                html.Div(id='share-link-msg'),
                html.Div(id='share-link-output')
            ])
        ]),
        dbc.ModalFooter([
            dbc.Button('关闭', id='btn-close-share', color='secondary', size='sm'),
            dbc.Button(
                [html.I(className='fas fa-link', style={'marginRight': '6px'}), '生成链接'],
                id='btn-create-share', color='primary', size='sm'
            )
        ])
    ], id='share-modal', is_open=False, size='lg', centered=True)
