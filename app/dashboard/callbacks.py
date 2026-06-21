import os
import json
from datetime import datetime
from typing import Dict, Any
import logging

import dash
from dash import dcc, html, Input, Output, State, no_update, ctx
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from flask import session
from flask_login import current_user

from app.models import db, User, Case
from app.services.data_service import (
    QueryService, TrendService, FinanceService, RefreshService
)
from app.services.auth_service import AuthService, ShareLinkService, VirtualUser
from app.services.export_service import ExportService
from app.dashboard.charts import (
    ClientTrendChart, CaseStageChart, EvidenceTable, HearingAnomalyChart
)
from app.dashboard.components import (
    build_full_layout, build_dashboard_content,
    build_kpi_cards, build_refresh_time_display
)

logger = logging.getLogger(__name__)


def _empty_figure(text: str = '暂无数据') -> go.Figure:
    fig = go.Figure()
    fig.add_annotation(
        text=text, showarrow=False,
        font=dict(size=18, color='#808080')
    )
    fig.update_layout(
        height=440, paper_bgcolor='white', plot_bgcolor='white',
        title=None, xaxis=dict(visible=False), yaxis=dict(visible=False)
    )
    return fig


def register_callbacks(app, cfg):
    config_dict = {
        'ROLE_PERMISSIONS': cfg.ROLE_PERMISSIONS,
        'EXPORT_CALIBER_NOTES': cfg.EXPORT_CALIBER_NOTES
    }

    @app.callback(
        Output('user-info-store', 'data'),
        Output('main-container', 'children'),
        Input('url', 'pathname'),
        prevent_initial_call=False
    )
    def route_page(pathname):
        with app.server.app_context():
            user = None
            user_info = None
            is_share_view = False
            share_ctx = session.get('share_context')
            virtual_dict = session.get('virtual_user')

            if share_ctx and virtual_dict:
                user = VirtualUser(virtual_dict.get('role', 'client'), share_ctx)
                is_share_view = True
                perms = cfg.ROLE_PERMISSIONS.get(user.role, {})
                user_info = {
                    **virtual_dict,
                    'permissions': perms,
                    'is_share_view': True,
                    'share_context': share_ctx,
                    'department': virtual_dict.get('department', '')
                }
            else:
                if not current_user.is_authenticated:
                    return {}, html.Div(
                        dcc.Location(pathname='/login', id='rl1', refresh=True)
                    )
                user = current_user._get_current_object()
                perms = AuthService.get_user_permissions(user)
                user_info = {
                    **user.to_dict(),
                    'permissions': perms,
                    'is_share_view': False,
                    'share_context': {}
                }

            if pathname and pathname.startswith('/share/'):
                pass

            layout = build_dashboard_content(user, user_info, cfg)
            return user_info, layout

    @app.callback(
        Output('trend-chart', 'figure'),
        Output('stage-chart', 'figure'),
        Output('evidence-table', 'figure'),
        Output('hearing-chart', 'figure'),
        Output('kpi-cards', 'children'),
        Output('refresh-times', 'children'),
        Input('auto-refresh-interval', 'n_intervals'),
        Input('refresh-trigger-store', 'data'),
        Input('filters-store', 'data'),
        State('user-info-store', 'data'),
        prevent_initial_call=False
    )
    def refresh_charts(n_intervals, refresh_trigger, filters_data, user_info):
        trigger_ids = [t['prop_id'] for t in ctx.triggered] if ctx.triggered else ['initial']
        with app.server.app_context():
            if not user_info:
                ef = _empty_figure('请先登录')
                return ef, ef, ef, ef, [], html.Span()

            user = None
            if user_info.get('is_share_view'):
                user = VirtualUser(
                    user_info.get('role', 'client'),
                    user_info.get('share_context', {})
                )
            else:
                user = User.query.get(user_info.get('id'))
                if not user:
                    ef = _empty_figure('用户无效')
                    return ef, ef, ef, ef, [], html.Span()

            include_finance = AuthService.can_view_finance(user) if not user_info.get('is_share_view') else \
                user_info.get('share_context', {}).get('can_view_finance', False)

            cases_df = QueryService.get_cases_df(user, config_dict, include_finance=include_finance)
            clients_df = QueryService.get_clients_df(user, config_dict)
            evidences_df = QueryService.get_evidences_df(user, config_dict)
            hearings_df = QueryService.get_hearings_df(user, config_dict)
            payments_df = QueryService.get_payments_df(user, config_dict, include_finance=include_finance)

            share_filter = user_info.get('share_context', {}).get('filters', {})
            filtered_case_ids = share_filter.get('case_id') if share_filter else None
            filtered_client_ids = share_filter.get('client_id') if share_filter else None

            if filtered_case_ids:
                if not cases_df.empty and 'id' in cases_df.columns:
                    cases_df = cases_df[cases_df['id'].isin(filtered_case_ids)]
                if not hearings_df.empty and 'case_id' in hearings_df.columns:
                    hearings_df = hearings_df[hearings_df['case_id'].isin(filtered_case_ids)]
                if not evidences_df.empty and 'case_id' in evidences_df.columns:
                    evidences_df = evidences_df[evidences_df['case_id'].isin(filtered_case_ids)]
                if not payments_df.empty and 'case_id' in payments_df.columns:
                    payments_df = payments_df[payments_df['case_id'].isin(filtered_case_ids)]
                if not clients_df.empty and filtered_client_ids and 'id' in clients_df.columns:
                    clients_df = clients_df[clients_df['id'].isin(filtered_client_ids)]

            client_trend_df = TrendService.get_client_trend_df(clients_df)
            case_stage_df = TrendService.get_case_stage_distribution(cases_df)
            evidence_detail_df = TrendService.get_evidence_detail_df(evidences_df, cases_df)
            hearing_anomaly_df = TrendService.get_hearing_anomaly_df(hearings_df, cases_df)

            trend_fig = ClientTrendChart.build(client_trend_df, '客户档案增长趋势')
            stage_fig = CaseStageChart.build(case_stage_df, '案件阶段构成分布')
            evidence_fig = EvidenceTable.build(evidence_detail_df, '证据附件明细清单')
            hearing_fig = HearingAnomalyChart.build(
                hearing_anomaly_df, hearings_df, '庭审日程异常标注（近7天/后60天）'
            )

            kpi_children = build_kpi_cards(
                cases_df, hearings_df, hearing_anomaly_df,
                evidence_detail_df, payments_df
            )

            refresh_data = RefreshService.get_last_refresh_time()
            refresh_el = build_refresh_time_display(refresh_data)

            return trend_fig, stage_fig, evidence_fig, hearing_fig, kpi_children, refresh_el

    @app.callback(
        Output('refresh-trigger-store', 'data'),
        Input('btn-refresh-now', 'n_clicks'),
        State('refresh-trigger-store', 'data'),
        prevent_initial_call=True
    )
    def manual_refresh(n_clicks, current):
        if not n_clicks:
            return no_update
        try:
            with app.server.app_context():
                from app.tasks.data_sync import refresh_materialized_views
                uid = None
                if current_user.is_authenticated:
                    uid = current_user.id
                try:
                    refresh_materialized_views.delay(triggered_by=uid)
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"Manual refresh celery call skipped: {e}")
        return (current or 0) + 1

    @app.callback(
        Output('export-modal', 'is_open', allow_duplicate=True),
        Output('export-status', 'children', allow_duplicate=True),
        Output('export-download-link', 'href', allow_duplicate=True),
        Output('export-download-link', 'style', allow_duplicate=True),
        Input('btn-export', 'n_clicks'),
        prevent_initial_call='initial_duplicate'
    )
    def open_export_modal(n_clicks):
        if not n_clicks:
            return no_update, no_update, no_update, no_update
        return True, html.Div(), '', {'display': 'none'}

    @app.callback(
        Output('export-modal', 'is_open', allow_duplicate=True),
        Input('btn-close-export', 'n_clicks'),
        prevent_initial_call='initial_duplicate'
    )
    def close_export_modal(n_clicks):
        if not n_clicks:
            return no_update
        return False

    @app.callback(
        Output('export-status', 'children', allow_duplicate=True),
        Output('export-download-link', 'href', allow_duplicate=True),
        Output('export-download-link', 'style', allow_duplicate=True),
        Input('btn-confirm-export', 'n_clicks'),
        State('include-finance-checklist', 'value'),
        State('filters-store', 'data'),
        State('user-info-store', 'data'),
        prevent_initial_call='initial_duplicate'
    )
    def confirm_export(n_clicks, finance_values, filters, user_info):
        if not n_clicks or not user_info:
            return no_update, no_update, no_update

        with app.server.app_context():
            user = None
            if user_info.get('is_share_view'):
                can_dl = user_info.get('share_context', {}).get('can_download', True)
                if not can_dl:
                    return (
                        html.Div([
                            html.I(className='fas fa-ban',
                                   style={'marginRight': '8px', 'color': '#C00000'}),
                            html.Span('此分享链接不允许下载数据',
                                      style={'color': '#C00000', 'fontWeight': '600'})
                        ], style={'padding': '12px', 'background': '#FCE4D6', 'borderRadius': '6px'}),
                        '',
                        {'display': 'none'}
                    )
                user = VirtualUser(
                    user_info.get('role', 'client'),
                    user_info.get('share_context', {})
                )
            else:
                user = User.query.get(user_info.get('id'))
                if not user:
                    return (
                        html.Div('用户无效', style={'color': '#C00000'}),
                        '', {'display': 'none'}
                    )

            include_finance = 'include' in (finance_values or [])
            if not AuthService.can_view_finance(user) and not user_info.get('is_share_view'):
                include_finance = False

            try:
                service = ExportService(cfg)
                filepath = service.export_dashboard_data(
                    user, filters=filters or {}, include_finance=include_finance
                )
                filename = os.path.basename(filepath)
                url = f'/download/{filename}'
                msg = html.Div([
                    html.I(className='fas fa-check-circle',
                           style={'color': '#70AD47', 'marginRight': '8px'}),
                    html.Span('文件生成成功！点击下方按钮下载',
                              style={'color': '#375623', 'fontWeight': '600'})
                ], style={'padding': '12px', 'background': '#E2EFDA', 'borderRadius': '6px'})
                style = {
                    'display': 'inline-block',
                    'padding': '10px 20px',
                    'background': '#70AD47',
                    'color': 'white', 'textDecoration': 'none',
                    'borderRadius': '6px', 'fontWeight': '500',
                    'textAlign': 'center', 'marginTop': '16px'
                }
                return msg, url, style
            except Exception as e:
                logger.error(f"Export error: {e}", exc_info=True)
                return (
                    html.Div([
                        html.I(className='fas fa-exclamation-triangle',
                               style={'color': '#C00000', 'marginRight': '8px'}),
                        html.Span(f'生成失败：{str(e)[:80]}',
                                  style={'color': '#C00000', 'fontWeight': '600'})
                    ], style={'padding': '12px', 'background': '#FCE4D6', 'borderRadius': '6px'}),
                    '', {'display': 'none'}
                )

    @app.callback(
        Output('share-modal', 'is_open', allow_duplicate=True),
        Input('btn-share', 'n_clicks'),
        prevent_initial_call='initial_duplicate'
    )
    def open_share_modal(n_clicks):
        if not n_clicks:
            return no_update
        return True

    @app.callback(
        Output('share-modal', 'is_open', allow_duplicate=True),
        Output('share-case-select', 'options'),
        Input('btn-share', 'n_clicks'),
        State('user-info-store', 'data'),
        prevent_initial_call='initial_duplicate'
    )
    def populate_cases_on_share(n_clicks, user_info):
        if not n_clicks or not user_info or user_info.get('is_share_view'):
            return no_update, []
        with app.server.app_context():
            user = User.query.get(user_info.get('id'))
            if not user:
                return no_update, []
            cd_config = {'ROLE_PERMISSIONS': cfg.ROLE_PERMISSIONS}
            cases_df = QueryService.get_cases_df(user, cd_config, include_finance=False)
            if cases_df.empty:
                return True, []
            opts = []
            for _, row in cases_df.iterrows():
                label = f"{row.get('case_number', '')} - {row.get('case_name', '')[:20]}"
                opts.append({'label': label, 'value': row.get('id')})
            return True, opts

    @app.callback(
        Output('share-modal', 'is_open', allow_duplicate=True),
        Input('btn-close-share', 'n_clicks'),
        prevent_initial_call='initial_duplicate'
    )
    def close_share_modal(n_clicks):
        if not n_clicks:
            return no_update
        return False

    @app.callback(
        Output('share-link-output', 'children'),
        Output('share-link-msg', 'children'),
        Input('btn-create-share', 'n_clicks'),
        State('share-role-select', 'value'),
        State('share-ttl-select', 'value'),
        State('share-finance-checklist', 'value'),
        State('share-case-select', 'value'),
        State('user-info-store', 'data'),
        prevent_initial_call='initial_duplicate'
    )
    def create_share(n_clicks, role, ttl, finance_vals, case_ids, user_info):
        if not n_clicks or not user_info:
            return html.Div(), html.Div()
        if user_info.get('is_share_view'):
            return html.Div(), html.Span(
                '分享用户不可创建链接', style={'color': '#C00000'}
            )
        with app.server.app_context():
            user = User.query.get(user_info.get('id'))
            if not user:
                return html.Div(), html.Span('用户无效', style={'color': '#C00000'})
            if not AuthService.can_share(user):
                return html.Div(), html.Span(
                    '当前角色无分享权限', style={'color': '#C00000'}
                )
            try:
                can_finance = 'include' in (finance_vals or [])
                single_case = case_ids[0] if case_ids and len(case_ids) == 1 else None
                link_type = 'case' if single_case else 'dashboard'
                link = ShareLinkService.create_share_link(
                    creator=user,
                    link_type=link_type,
                    case_id=single_case,
                    role_scope=role or 'client',
                    can_view_finance=can_finance,
                    can_download=True,
                    ttl_hours=ttl or 72
                )
                from flask import request as flask_req
                try:
                    base = flask_req.host_url.rstrip('/')
                except Exception:
                    base = 'http://localhost:8050'
                url = f"{base}/share/{link.token}"
                output = html.Div([
                    html.Label('生成成功，可复制以下链接分享：', style={
                        'display': 'block', 'marginBottom': '8px',
                        'fontWeight': '500', 'color': '#333', 'fontSize': '13px'
                    }),
                    html.Div(url, style={
                        'padding': '12px', 'background': '#F8FAFC',
                        'border': '1px solid #DDEBF7', 'borderRadius': '6px',
                        'fontFamily': 'monospace', 'fontSize': '12px',
                        'color': '#1F4E79', 'wordBreak': 'break-all',
                        'lineHeight': '1.6', 'userSelect': 'all'
                    })
                ])
                msg = html.Div([
                    html.I(className='fas fa-check-circle',
                           style={'marginRight': '6px', 'color': '#70AD47'}),
                    html.Span(
                        f'链接有效 {ttl or 72} 小时 · 范围：{role or "client"} · '
                        f'{"含财务数据" if can_finance else "不含财务数据"}'
                        f'{" · 单案限定" if single_case else " · 全可见范围"}',
                        style={'fontSize': '12px', 'color': '#375623'}
                    )
                ], style={
                    'padding': '10px', 'background': '#E2EFDA',
                    'borderRadius': '6px', 'marginTop': '12px'
                })
                return output, msg
            except Exception as e:
                logger.error(f"Share link error: {e}", exc_info=True)
                return html.Div(), html.Span(
                    f'创建失败：{str(e)[:60]}', style={'color': '#C00000'}
                )
