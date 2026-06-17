import base64
import os
import uuid
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from datetime import datetime
from dash import Input, Output, State, ctx, html, dcc, dash_table, no_update
from dash.exceptions import PreventUpdate
from flask_login import login_user, logout_user, current_user
from werkzeug.security import check_password_hash

from app.dash_app.layouts import (
    create_login_layout, create_main_layout,
    create_overview_tab, create_analytics_tab,
    create_overdue_tab, create_detail_tab, create_import_tab,
    LoginUser, get_current_dash_user, create_kpi_card,
)
from app.database import get_session
from app.models import User
from app.auth import is_manager
from app.report_service import ReportDataService
from app.config import config
from app.tasks import (
    import_crm_properties_task,
    import_crm_tenants_task,
    import_contracts_task,
    import_meter_readings_task,
    import_repair_records_task,
)


def save_uploaded_file(contents, filename):
    if contents is None:
        return None
    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(config.UPLOAD_DIR, safe_name)
    with open(file_path, 'wb') as f:
        f.write(decoded)
    return file_path


def register_callbacks(app):

    @app.callback(
        Output('page-content', 'children'),
        Output('url', 'pathname'),
        Input('login-btn', 'n_clicks'),
        Input('logout-btn', 'n_clicks'),
        State('login-username', 'value'),
        State('login-password', 'value'),
        State('url', 'pathname'),
        prevent_initial_call=False,
    )
    def handle_auth(login_clicks, logout_clicks, username, password, current_path):
        triggered = ctx.triggered_id

        if triggered == 'logout-btn' and logout_clicks:
            logout_user()
            return create_login_layout(), '/login'

        if triggered == 'login-btn' and login_clicks:
            if not username or not password:
                msg = html.Div('请输入用户名和密码', className='text-danger')
                return create_login_layout(), '/login'

            with get_session() as session:
                user = session.query(User).filter(User.username == username.strip()).first()
                if not user or not user.is_active:
                    msg = html.Div('用户不存在或已禁用', className='text-danger')
                    return create_login_layout(), '/login'

                if check_password_hash(user.password_hash, password):
                    login_user_obj = LoginUser(user)
                    login_user(login_user_obj)
                    user.last_login = datetime.utcnow()
                    session.commit()
                    return create_main_layout(), '/dashboard'
                else:
                    msg = html.Div('密码错误', className='text-danger')
                    return create_login_layout(), '/login'

        if current_user.is_authenticated:
            return create_main_layout(), '/dashboard'

        return create_login_layout(), '/login'

    @app.callback(
        Output('login-message', 'children'),
        Input('login-btn', 'n_clicks'),
        State('login-username', 'value'),
        State('login-password', 'value'),
        prevent_initial_call=True,
    )
    def show_login_message(login_clicks, username, password):
        if not login_clicks:
            raise PreventUpdate
        if not username or not password:
            return html.Div('请输入用户名和密码', className='text-danger')
        with get_session() as session:
            user = session.query(User).filter(User.username == username.strip()).first()
            if not user:
                return html.Div('用户不存在', className='text-danger')
            if not check_password_hash(user.password_hash, password):
                return html.Div('密码错误', className='text-danger')
        return html.Div('登录成功，正在跳转...', className='text-success')

    @app.callback(
        Output('tab-content', 'children'),
        Input('main-tabs', 'value'),
        prevent_initial_call=False,
    )
    def render_tab(tab_value):
        if not current_user.is_authenticated:
            raise PreventUpdate

        if tab_value == 'overview':
            return create_overview_tab()
        elif tab_value == 'analytics':
            return create_analytics_tab()
        elif tab_value == 'overdue':
            return create_overdue_tab()
        elif tab_value == 'detail':
            return create_detail_tab()
        elif tab_value == 'import':
            return create_import_tab()
        raise PreventUpdate

    @app.callback(
        [
            Output('overview-kpi-row', 'children'),
            Output('overview-kpi-row-2', 'children'),
            Output('listing-funnel-chart', 'figure'),
            Output('listing-by-district-chart', 'figure'),
        ],
        [Input('main-tabs', 'value'), Input('refresh-trigger', 'data')],
        prevent_initial_call=False,
    )
    def update_overview(tab_value, _refresh):
        if not current_user.is_authenticated:
            raise PreventUpdate

        user = get_current_dash_user()
        svc = ReportDataService(user)
        metrics = svc.get_overview_metrics()

        kpi = create_kpi_card

        row1 = [
            dcc.Loading(type='circle', children=[
                html.Div(kpi('房源总数', f"{metrics['total_properties']:,}", '全部在管房源', 'primary', '🏠'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('已上架房源', f"{metrics['listed_properties']:,}", '发布状态', 'success', '✅'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('上架率', f"{metrics['listing_rate']:.1f}%", '已发布/总数', 'info', '📊'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('出租率', f"{metrics['occupancy_rate']:.1f}%", '活跃合同/房源', 'warning', '🏡'),
                         className='mb-4')
            ]),
        ]

        row2 = [
            dcc.Loading(type='circle', children=[
                html.Div(kpi('活跃合同数', f"{metrics['active_contracts']:,}", '履行中合同', 'success', '📄'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('逾期合同数', f"{metrics['overdue_count']:,}", '租金逾期', 'danger', '⚠️'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('逾期总金额', f"{metrics['overdue_amount']:,.0f}元", '累计逾期', 'danger', '💰'),
                         className='mb-4')
            ]),
            dcc.Loading(type='circle', children=[
                html.Div(kpi('本月维修工单', '--', '新增维修', 'secondary', '🔧'),
                         className='mb-4')
            ]),
        ]

        funnel_data = metrics['listing_funnel']
        funnel_labels = ['草稿', '待审核', '已发布', '已下架']
        funnel_values = [
            funnel_data.get('draft', 0),
            funnel_data.get('pending_review', 0),
            funnel_data.get('published', 0),
            funnel_data.get('offline', 0),
        ]
        funnel_colors = ['#95a5a6', '#f39c12', '#27ae60', '#e74c3c']
        fig_funnel = go.Figure(go.Funnel(
            y=funnel_labels,
            x=funnel_values,
            textinfo='value+percent initial',
            marker={'color': funnel_colors},
            textfont={'size': 14},
        ))
        fig_funnel.update_layout(
            title='房源上架漏斗流程',
            title_x=0.5,
            margin=dict(l=20, r=20, t=60, b=20),
        )

        pivot_df = svc.get_listing_funnel_data()
        if not pivot_df.empty:
            status_cols = [c for c in pivot_df.columns if c != 'district']
            fig_bar = go.Figure()
            color_map = {'draft': '#95a5a6', 'pending_review': '#f39c12',
                         'published': '#27ae60', 'offline': '#e74c3c'}
            name_map = {'draft': '草稿', 'pending_review': '待审核',
                        'published': '已发布', 'offline': '已下架'}
            for col in status_cols:
                fig_bar.add_trace(go.Bar(
                    x=pivot_df['district'],
                    y=pivot_df[col],
                    name=name_map.get(col, col),
                    marker_color=color_map.get(col, '#3498db'),
                ))
            fig_bar.update_layout(
                barmode='stack',
                title='各区域房源上架分布',
                title_x=0.5,
                xaxis_title='区域',
                yaxis_title='房源数量',
                legend_title='状态',
                margin=dict(l=20, r=20, t=60, b=20),
            )
        else:
            fig_bar = go.Figure()
            fig_bar.update_layout(title='暂无数据', title_x=0.5)

        return row1, row2, fig_funnel, fig_bar

    @app.callback(
        [
            Output('photo-distribution-chart', 'figure'),
            Output('photo-box-chart', 'figure'),
            Output('tenant-funnel-chart', 'figure'),
            Output('tenant-conversion-chart', 'figure'),
            Output('contract-version-chart', 'figure'),
            Output('contract-version-table', 'data'),
            Output('repair-trend-chart', 'figure'),
            Output('repair-type-chart', 'figure'),
            Output('repair-status-chart', 'figure'),
        ],
        [Input('main-tabs', 'value'), Input('refresh-trigger', 'data')],
        prevent_initial_call=False,
    )
    def update_analytics(tab_value, _refresh):
        if not current_user.is_authenticated:
            raise PreventUpdate
        user = get_current_dash_user()
        svc = ReportDataService(user)

        photo_df = svc.get_photo_distribution()
        if not photo_df.empty:
            fig_photo_pie = px.pie(
                photo_df, names='photo_bin', values='count',
                title='房源照片数量分布',
                hole=0.4,
                color_discrete_sequence=px.colors.sequential.Blues_r,
            )
            fig_photo_pie.update_traces(textinfo='percent+label', textfont_size=12)
            fig_photo_pie.update_layout(title_x=0.5, margin=dict(l=10, r=10, t=60, b=10))

            fig_photo_bar = px.bar(
                photo_df, x='photo_bin', y='count',
                title='各照片档房源数',
                color='count',
                color_continuous_scale='Blues',
                text='count',
            )
            fig_photo_bar.update_layout(
                title_x=0.5, xaxis_title='照片数量区间', yaxis_title='房源数量',
                margin=dict(l=10, r=10, t=60, b=10),
                showlegend=False,
            )
            fig_photo_bar.update_traces(textposition='outside')
        else:
            fig_photo_pie = go.Figure()
            fig_photo_pie.update_layout(title='暂无数据', title_x=0.5)
            fig_photo_bar = fig_photo_pie

        tenant_df = svc.get_tenant_funnel()
        if not tenant_df.empty and tenant_df['count'].sum() > 0:
            fig_tenant_funnel = go.Figure(go.Funnel(
                y=tenant_df['stage_name'],
                x=tenant_df['count'],
                textinfo='value+percent previous',
                marker={'color': ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#95a5a6']},
            ))
            fig_tenant_funnel.update_layout(
                title='租客档案转化漏斗',
                title_x=0.5,
                margin=dict(l=20, r=20, t=60, b=20),
            )

            conv_df = tenant_df[tenant_df['count'] > 0].copy()
            if len(conv_df) > 1:
                base_val = conv_df['count'].iloc[0]
                base_val = base_val if base_val > 0 else 1
                conv_df['conversion'] = conv_df['count'] / base_val * 100
                fig_conv = px.line(
                    conv_df, x='stage_name', y='conversion',
                    markers=True, title='阶段转化率（%）',
                    color_discrete_sequence=['#e74c3c'],
                )
                fig_conv.update_traces(line=dict(width=3), marker=dict(size=10))
                fig_conv.update_layout(
                    title_x=0.5, xaxis_title='阶段', yaxis_title='转化率(%)',
                    margin=dict(l=20, r=20, t=60, b=20),
                )
                fig_conv.update_yaxes(range=[0, 105])
            else:
                fig_conv = go.Figure()
                fig_conv.update_layout(title='暂无数据', title_x=0.5)
        else:
            fig_tenant_funnel = go.Figure()
            fig_tenant_funnel.update_layout(title='暂无数据', title_x=0.5)
            fig_conv = fig_tenant_funnel

        version_df = svc.get_contract_version_ranking()
        if not version_df.empty:
            fig_version = px.bar(
                version_df, x='contract_version', y='usage_count',
                title='合同版本使用排行',
                color='overdue_count',
                color_continuous_scale='Reds',
                text='usage_count',
                hover_data={'avg_rent': ':,.0f'},
            )
            fig_version.update_layout(
                title_x=0.5, xaxis_title='合同版本', yaxis_title='使用数量',
                margin=dict(l=20, r=20, t=60, b=20),
            )
            fig_version.update_traces(textposition='outside')
            table_data = version_df.round(2).to_dict('records')
        else:
            fig_version = go.Figure()
            fig_version.update_layout(title='暂无数据', title_x=0.5)
            table_data = []

        trend_df = svc.get_repair_trend()
        if not trend_df.empty:
            monthly_sum = trend_df.groupby(['month', 'repair_type'])['count'].sum().reset_index()
            fig_repair_trend = px.line(
                monthly_sum, x='month', y='count', color='repair_type',
                markers=True, title='维修工单月度趋势',
            )
            fig_repair_trend.update_layout(
                title_x=0.5, xaxis_title='月份', yaxis_title='工单数',
                margin=dict(l=20, r=20, t=60, b=20),
                legend_title='维修类型',
            )
            fig_repair_trend.update_traces(line=dict(width=2), marker=dict(size=8))

            type_sum = trend_df.groupby('repair_type')['count'].sum().reset_index()
            fig_repair_type = px.pie(
                type_sum, names='repair_type', values='count',
                title='维修类型占比',
                hole=0.3,
                color_discrete_sequence=px.colors.qualitative.Set2,
            )
            fig_repair_type.update_traces(textinfo='percent+label')
            fig_repair_type.update_layout(title_x=0.5, margin=dict(l=10, r=10, t=60, b=10))

            status_sum = trend_df.groupby(['month', 'repair_status'])['count'].sum().reset_index()
            fig_repair_status = px.area(
                status_sum, x='month', y='count', color='repair_status',
                title='维修状态月度变化',
                groupnorm='fraction',
            )
            fig_repair_status.update_layout(
                title_x=0.5, xaxis_title='月份', yaxis_title='占比',
                margin=dict(l=20, r=20, t=60, b=20),
                legend_title='状态',
            )
        else:
            fig_repair_trend = go.Figure()
            fig_repair_trend.update_layout(title='暂无数据', title_x=0.5)
            fig_repair_type = fig_repair_trend
            fig_repair_status = fig_repair_trend

        return (
            fig_photo_pie, fig_photo_bar,
            fig_tenant_funnel, fig_conv,
            fig_version, table_data,
            fig_repair_trend, fig_repair_type, fig_repair_status,
        )

    @app.callback(
        Output('overdue-table', 'data'),
        Output('overdue-contract-select', 'options'),
        Input('main-tabs', 'value'),
        Input('note-submit-result', 'children'),
        prevent_initial_call=False,
    )
    def update_overdue_table(tab_value, _note_submit):
        if not current_user.is_authenticated:
            raise PreventUpdate
        user = get_current_dash_user()
        svc = ReportDataService(user)
        df = svc.get_overdue_contracts()
        if df.empty:
            return [], []

        options = [
            {'label': f"{row.contract_no} - {row.project_name or ''} {row.unit_no or ''}",
             'value': row.contract_no}
            for _, row in df.iterrows()
        ]
        return df.to_dict('records'), options

    @app.callback(
        Output('note-history-container', 'children'),
        [
            Input('overdue-table', 'selected_rows'),
            Input('overdue-contract-select', 'value'),
            Input('note-submit-result', 'children'),
        ],
        State('overdue-table', 'data'),
        prevent_initial_call=False,
    )
    def update_note_history(selected_rows, selected_contract, _refresh, table_data):
        if not current_user.is_authenticated:
            raise PreventUpdate

        contract_no = None
        if selected_contract:
            contract_no = selected_contract
        elif selected_rows and table_data and len(selected_rows) > 0:
            idx = selected_rows[0]
            if idx < len(table_data):
                contract_no = table_data[idx].get('contract_no')

        if not contract_no:
            return html.Div('请选择上方表格中的合同或下拉选择合同编号查看注释记录',
                            className='text-muted text-center py-4')

        user = get_current_dash_user()
        svc = ReportDataService(user)
        notes = svc.get_overdue_notes(contract_no)

        if not notes:
            return html.Div(f'合同 {contract_no} 暂无注释记录',
                            className='text-muted text-center py-4')

        type_badges = {
            'remark': 'secondary',
            'collection': 'warning',
            'negotiation': 'info',
            'legal': 'danger',
            'resolved': 'success',
        }
        type_names = {
            'remark': '备注',
            'collection': '催缴',
            'negotiation': '协商',
            'legal': '法律',
            'resolved': '已解决',
        }

        cards = []
        for note in notes:
            badge = type_badges.get(note.get('type', 'remark'), 'secondary')
            tname = type_names.get(note.get('type', 'remark'), '备注')
            cards.append(
                dbc.Card([
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                html.Small([
                                    html.Span(f"[{note.get('created_at', '')}]",
                                              className='text-muted me-2'),
                                    dbc.Badge(tname, color=badge, className='me-2'),
                                    html.Strong(note.get('content', '')),
                                ]),
                            ], width=12),
                        ]),
                    ]),
                ], className='mb-2 shadow-sm')
            )

        return [
            html.H6(f'合同 {contract_no} 的注释记录（共 {len(notes)} 条）',
                    className='mb-3 text-primary'),
            *cards,
        ]

    @app.callback(
        Output('note-submit-result', 'children'),
        Input('submit-note-btn', 'n_clicks'),
        State('overdue-table', 'selected_rows'),
        State('overdue-contract-select', 'value'),
        State('overdue-table', 'data'),
        State('note-type', 'value'),
        State('note-content', 'value'),
        prevent_initial_call=True,
    )
    def submit_note(n_clicks, selected_rows, selected_contract, table_data, note_type, content):
        if not n_clicks:
            raise PreventUpdate
        if not current_user.is_authenticated:
            return html.Div('请先登录', className='text-danger')

        contract_no = None
        if selected_contract:
            contract_no = selected_contract
        elif selected_rows and table_data and len(selected_rows) > 0:
            idx = selected_rows[0]
            if idx < len(table_data):
                contract_no = table_data[idx].get('contract_no')

        if not contract_no:
            return html.Div('请先选择合同', className='text-warning')
        if not content or not content.strip():
            return html.Div('请输入注释内容', className='text-danger')

        user = get_current_dash_user()
        svc = ReportDataService(user)
        try:
            svc.add_overdue_note(contract_no, content.strip(), note_type, user.id if user else None)
            return html.Div([
                html.I(className='fa fa-check-circle'),
                f' 注释已提交（{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}）'
            ], className='text-success')
        except Exception as e:
            return html.Div(f'提交失败: {str(e)}', className='text-danger')

    @app.callback(
        Output('occupancy-detail-table', 'data'),
        Output('detail-project-filter', 'options'),
        Output('detail-district-filter', 'options'),
        Output('detail-summary', 'children'),
        [
            Input('main-tabs', 'value'),
            Input('detail-project-filter', 'value'),
            Input('detail-district-filter', 'value'),
            Input('detail-status-filter', 'value'),
            Input('refresh-trigger', 'data'),
        ],
        prevent_initial_call=False,
    )
    def update_occupancy_detail(tab_value, projects, districts, status, _refresh):
        if not current_user.is_authenticated:
            raise PreventUpdate
        user = get_current_dash_user()
        svc = ReportDataService(user)
        df = svc.get_occupancy_detail()

        if df.empty:
            return [], [], [], html.Div('暂无数据', className='text-muted text-center')

        project_opts = [{'label': p, 'value': p} for p in sorted(df['project_name'].dropna().unique())]
        district_opts = [{'label': d, 'value': d} for d in sorted(df['district'].dropna().unique())]

        filtered = df.copy()
        if projects:
            filtered = filtered[filtered['project_name'].isin(projects)]
        if districts:
            filtered = filtered[filtered['district'].isin(districts)]
        if status and status != 'all':
            filtered = filtered[filtered['occupancy_status'] == status]

        total = len(filtered)
        rented = (filtered['occupancy_status'] == '已出租').sum()
        free = total - rented
        rate = (rented / total * 100) if total > 0 else 0

        summary = dbc.Row([
            dbc.Col(html.Div([
                html.Strong('筛选后总数: '), f'{total} 套',
            ], className='fs-5'), width=3),
            dbc.Col(html.Div([
                html.Strong('已出租: ', style={'color': '#27ae60'}),
                html.Span(f'{rented} 套', style={'color': '#27ae60', 'fontWeight': 'bold'}),
            ], className='fs-5'), width=3),
            dbc.Col(html.Div([
                html.Strong('空闲: ', style={'color': '#e74c3c'}),
                html.Span(f'{free} 套', style={'color': '#e74c3c', 'fontWeight': 'bold'}),
            ], className='fs-5'), width=3),
            dbc.Col(html.Div([
                html.Strong('筛选后出租率: ', style={'color': '#3498db'}),
                html.Span(f'{rate:.1f}%', style={'color': '#3498db', 'fontWeight': 'bold', 'fontSize': '1.3rem'}),
            ], className='fs-5'), width=3),
        ])

        if 'start_date' in filtered.columns:
            filtered['start_date'] = filtered['start_date'].astype(str).replace('NaT', '')
        if 'end_date' in filtered.columns:
            filtered['end_date'] = filtered['end_date'].astype(str).replace('NaT', '')

        return filtered.to_dict('records'), project_opts, district_opts, summary

    def _handle_upload(contents, filename, task_func, status_div):
        if not contents:
            raise PreventUpdate
        try:
            file_path = save_uploaded_file(contents, filename)
            user = get_current_dash_user()
            user_id = user.id if user else None
            result = task_func.delay(file_path, user_id)
            return html.Div([
                html.I(className='fa fa-spinner fa-spin me-2'),
                f'{filename} 导入任务已提交，任务ID: {result.id}，请等待后台处理...'
            ], className='text-info')
        except Exception as e:
            return html.Div(f'提交失败: {str(e)}', className='text-danger')

    @app.callback(
        Output('crm-prop-upload-status', 'children'),
        Input('upload-crm-property', 'contents'),
        State('upload-crm-property', 'filename'),
        prevent_initial_call=True,
    )
    def upload_crm_property(contents, filename):
        return _handle_upload(contents, filename, import_crm_properties_task, 'crm-prop-upload-status')

    @app.callback(
        Output('crm-tenant-upload-status', 'children'),
        Input('upload-crm-tenant', 'contents'),
        State('upload-crm-tenant', 'filename'),
        prevent_initial_call=True,
    )
    def upload_crm_tenant(contents, filename):
        return _handle_upload(contents, filename, import_crm_tenants_task, 'crm-tenant-upload-status')

    @app.callback(
        Output('contract-upload-status', 'children'),
        Input('upload-contract', 'contents'),
        State('upload-contract', 'filename'),
        prevent_initial_call=True,
    )
    def upload_contract(contents, filename):
        return _handle_upload(contents, filename, import_contracts_task, 'contract-upload-status')

    @app.callback(
        Output('meter-upload-status', 'children'),
        Input('upload-meter', 'contents'),
        State('upload-meter', 'filename'),
        prevent_initial_call=True,
    )
    def upload_meter(contents, filename):
        return _handle_upload(contents, filename, import_meter_readings_task, 'meter-upload-status')

    @app.callback(
        Output('repair-upload-status', 'children'),
        Input('upload-repair', 'contents'),
        State('upload-repair', 'filename'),
        prevent_initial_call=True,
    )
    def upload_repair(contents, filename):
        return _handle_upload(contents, filename, import_repair_records_task, 'repair-upload-status')

    @app.callback(
        Output('batch-history-table', 'data'),
        [Input('main-tabs', 'value'),
         Input('refresh-batch-interval', 'n_intervals')],
        prevent_initial_call=False,
    )
    def update_batch_history(tab_value, _n):
        if not current_user.is_authenticated:
            raise PreventUpdate
        if not is_manager(current_user):
            raise PreventUpdate
        user = get_current_dash_user()
        svc = ReportDataService(user)
        return svc.get_batch_history(50)
