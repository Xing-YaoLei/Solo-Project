from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from flask import current_app
from sqlalchemy import and_, or_, func
import pandas as pd
import numpy as np

from app.models import (
    db, User, Client, Case, CaseStageHistory, Evidence, Hearing,
    PaymentTransaction, Email, EmailAttachment, CalendarEvent,
    DataRefreshLog, DashboardMaterializedView
)


class QueryService:
    @staticmethod
    def _get_team_case_ids(user: User) -> List[str]:
        all_cases = Case.query.all()
        team_case_ids = []
        for case in all_cases:
            if case.responsible_lawyer_id == user.id:
                team_case_ids.append(case.id)
            elif case.assistant_lawyer_ids and user.id in case.assistant_lawyer_ids:
                team_case_ids.append(case.id)
        return team_case_ids

    @staticmethod
    def apply_role_scope(query, user: User, model, config):
        role = user.role
        perms = config['ROLE_PERMISSIONS'].get(role, {})
        scope = perms.get('scope', 'assigned')

        is_virtual = hasattr(user, '_share_context')

        if is_virtual and scope in ('assigned', 'team', 'department'):
            return query

        if scope in ('all', 'all_readonly'):
            return query

        elif scope == 'department':
            if model == Case:
                dept_lawyers = User.query.filter_by(department=user.department).with_entities(User.id).all()
                dept_ids = [u.id for u in dept_lawyers]
                return query.filter(Case.responsible_lawyer_id.in_(dept_ids))
            elif model == Client:
                dept_lawyers = User.query.filter_by(department=user.department).with_entities(User.id).all()
                dept_ids = [u.id for u in dept_lawyers]
                client_ids = Case.query.filter(Case.responsible_lawyer_id.in_(dept_ids)).with_entities(Case.client_id).all()
                cids = [c[0] for c in client_ids]
                return query.filter(Client.id.in_(cids))
            elif model in (Evidence, Hearing, PaymentTransaction):
                dept_lawyers = User.query.filter_by(department=user.department).with_entities(User.id).all()
                dept_ids = [u.id for u in dept_lawyers]
                case_ids = Case.query.filter(Case.responsible_lawyer_id.in_(dept_ids)).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                if model == Evidence:
                    return query.filter(Evidence.case_id.in_(cids))
                elif model == Hearing:
                    return query.filter(Hearing.case_id.in_(cids))
                elif model == PaymentTransaction:
                    return query.filter(PaymentTransaction.case_id.in_(cids))
            else:
                return query

        elif scope == 'team':
            team_case_ids = QueryService._get_team_case_ids(user)
            if model == Case:
                return query.filter(Case.id.in_(team_case_ids))
            elif model == Client:
                case_client_ids = Case.query.filter(
                    Case.id.in_(team_case_ids)
                ).with_entities(Case.client_id).all()
                cids = [c[0] for c in case_client_ids]
                return query.filter(Client.id.in_(cids))
            elif model in (Evidence, Hearing, PaymentTransaction):
                if model == Evidence:
                    return query.filter(Evidence.case_id.in_(team_case_ids))
                elif model == Hearing:
                    return query.filter(Hearing.case_id.in_(team_case_ids))
                elif model == PaymentTransaction:
                    return query.filter(PaymentTransaction.case_id.in_(team_case_ids))
            else:
                return query

        elif scope == 'assigned':
            if model == Case:
                return query.filter(Case.responsible_lawyer_id == user.id)
            elif model == Client:
                case_client_ids = Case.query.filter_by(
                    responsible_lawyer_id=user.id
                ).with_entities(Case.client_id).all()
                cids = [c[0] for c in case_client_ids]
                return query.filter(Client.id.in_(cids))
            elif model == Evidence:
                case_ids = Case.query.filter_by(responsible_lawyer_id=user.id).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                return query.filter(Evidence.case_id.in_(cids))
            elif model == Hearing:
                case_ids = Case.query.filter_by(responsible_lawyer_id=user.id).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                return query.filter(Hearing.case_id.in_(cids))
            elif model == PaymentTransaction:
                case_ids = Case.query.filter_by(responsible_lawyer_id=user.id).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                return query.filter(PaymentTransaction.case_id.in_(cids))
            else:
                return query

        elif scope == 'own_cases':
            if is_virtual:
                share_ctx = getattr(user, '_share_context', {})
                filters = share_ctx.get('filters', {})
                v_client_ids = filters.get('client_id', [])
                v_case_ids = filters.get('case_id', [])

                if model == Case:
                    if v_client_ids:
                        return query.filter(Case.client_id.in_(v_client_ids))
                    elif v_case_ids:
                        return query.filter(Case.id.in_(v_case_ids))
                    else:
                        return query.filter(False)
                elif model == Client:
                    if v_client_ids:
                        return query.filter(Client.id.in_(v_client_ids))
                    elif v_case_ids:
                        case_clients = Case.query.filter(
                            Case.id.in_(v_case_ids)
                        ).with_entities(Case.client_id).distinct().all()
                        derived_client_ids = [c[0] for c in case_clients]
                        return query.filter(Client.id.in_(derived_client_ids))
                    else:
                        return query.filter(False)
                elif model == Evidence:
                    case_q = Case.query
                    if v_client_ids:
                        case_q = case_q.filter(Case.client_id.in_(v_client_ids))
                    elif v_case_ids:
                        case_q = case_q.filter(Case.id.in_(v_case_ids))
                    else:
                        return query.filter(False)
                    cids = [c.id for c in case_q.with_entities(Case.id).all()]
                    return query.filter(Evidence.case_id.in_(cids))
                elif model == Hearing:
                    case_q = Case.query
                    if v_client_ids:
                        case_q = case_q.filter(Case.client_id.in_(v_client_ids))
                    elif v_case_ids:
                        case_q = case_q.filter(Case.id.in_(v_case_ids))
                    else:
                        return query.filter(False)
                    cids = [c.id for c in case_q.with_entities(Case.id).all()]
                    return query.filter(Hearing.case_id.in_(cids))
                elif model == PaymentTransaction:
                    if v_client_ids:
                        return query.filter(PaymentTransaction.client_id.in_(v_client_ids))
                    elif v_case_ids:
                        return query.filter(PaymentTransaction.case_id.in_(v_case_ids))
                    else:
                        return query.filter(False)
                else:
                    return query
            elif model == Case:
                return query.filter(Case.client_id == user.id)
            elif model == Client:
                return query.filter(Client.id == user.id)
            elif model == Evidence:
                case_ids = Case.query.filter_by(client_id=user.id).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                return query.filter(Evidence.case_id.in_(cids))
            elif model == Hearing:
                case_ids = Case.query.filter_by(client_id=user.id).with_entities(Case.id).all()
                cids = [c[0] for c in case_ids]
                return query.filter(Hearing.case_id.in_(cids))
            elif model == PaymentTransaction:
                return query.filter(PaymentTransaction.client_id == user.id)
            else:
                return query

        return query

    @staticmethod
    def get_cases_df(user: User, config, include_finance: bool = True) -> pd.DataFrame:
        query = Case.query
        query = QueryService.apply_role_scope(query, user, Case, config)
        cases = query.all()
        data = [c.to_dict(include_finance=include_finance) for c in cases]
        return pd.DataFrame(data) if data else pd.DataFrame()

    @staticmethod
    def get_clients_df(user: User, config) -> pd.DataFrame:
        query = Client.query
        query = QueryService.apply_role_scope(query, user, Client, config)
        clients = query.all()
        data = [c.to_dict() for c in clients]
        return pd.DataFrame(data) if data else pd.DataFrame()

    @staticmethod
    def get_evidences_df(user: User, config) -> pd.DataFrame:
        query = Evidence.query.join(Case)
        query = QueryService.apply_role_scope(query, user, Evidence, config)
        evidences = query.all()
        data = [e.to_dict() for e in evidences]
        return pd.DataFrame(data) if data else pd.DataFrame()

    @staticmethod
    def get_hearings_df(user: User, config, start_date: Optional[datetime] = None,
                        end_date: Optional[datetime] = None) -> pd.DataFrame:
        query = Hearing.query
        query = QueryService.apply_role_scope(query, user, Hearing, config)
        if start_date:
            query = query.filter(Hearing.scheduled_at >= start_date)
        if end_date:
            query = query.filter(Hearing.scheduled_at <= end_date)
        hearings = query.order_by(Hearing.scheduled_at.asc()).all()
        data = [h.to_dict() for h in hearings]
        return pd.DataFrame(data) if data else pd.DataFrame()

    @staticmethod
    def get_payments_df(user: User, config, include_finance: bool = True) -> pd.DataFrame:
        query = PaymentTransaction.query
        query = QueryService.apply_role_scope(query, user, PaymentTransaction, config)
        payments = query.all()
        data = [p.to_dict(include_finance=include_finance) for p in payments]
        return pd.DataFrame(data) if data else pd.DataFrame()


class TrendService:
    STAGE_ORDER = ['咨询', '立案', '举证', '开庭', '调解', '判决', '上诉', '执行', '结案归档']

    @staticmethod
    def get_client_trend_df(clients_df: pd.DataFrame, months: int = 12) -> pd.DataFrame:
        if clients_df.empty:
            return pd.DataFrame()
        df = clients_df.copy()
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['month'] = df['created_at'].dt.to_period('M')
        cutoff = pd.Timestamp.now() - pd.DateOffset(months=months)
        df = df[df['created_at'] >= cutoff]
        monthly = df.groupby(['month', 'client_type']).size().unstack(fill_value=0)
        monthly.index = monthly.index.astype(str)
        monthly['累计'] = monthly.sum(axis=1).cumsum()
        monthly = monthly.reset_index()
        return monthly

    @staticmethod
    def get_case_stage_distribution(cases_df: pd.DataFrame) -> pd.DataFrame:
        if cases_df.empty:
            return pd.DataFrame(columns=['阶段', '数量', '占比'])
        df = cases_df.copy()

        has_finance = 'claim_amount' in df.columns
        agg_dict = {'数量': ('id', 'count')}
        if has_finance:
            agg_dict['平均金额'] = ('claim_amount', 'mean')

        dist = df.groupby('current_stage').agg(**agg_dict).reindex(TrendService.STAGE_ORDER).fillna(0)
        dist = dist.reset_index().rename(columns={'current_stage': '阶段'})
        total = dist['数量'].sum()
        dist['占比'] = (dist['数量'] / total * 100).round(1) if total > 0 else 0
        return dist

    @staticmethod
    def get_evidence_detail_df(evidences_df: pd.DataFrame, cases_df: pd.DataFrame) -> pd.DataFrame:
        if evidences_df.empty:
            return pd.DataFrame()
        result = evidences_df.copy()
        if not cases_df.empty:
            case_info = cases_df[['id', 'case_number', 'case_name', 'current_stage', 'responsible_lawyer_name']]
            case_info = case_info.rename(columns={
                'id': 'case_id',
                'responsible_lawyer_name': '主办律师'
            })
            result = result.merge(case_info, on='case_id', how='left')
        return result

    @staticmethod
    def get_hearing_anomaly_df(hearings_df: pd.DataFrame, cases_df: pd.DataFrame) -> pd.DataFrame:
        if hearings_df.empty:
            return pd.DataFrame()
        df = hearings_df.copy()
        df['scheduled_at'] = pd.to_datetime(df['scheduled_at'])
        now = pd.Timestamp.now(tz='UTC').tz_localize(None) if df['scheduled_at'].dt.tz is None else pd.Timestamp.now(tz='UTC')
        df['days_until'] = (df['scheduled_at'] - now).dt.total_seconds() / 86400

        anomaly_dfs = []

        upcoming = df[(df['days_until'] >= 0) & (df['days_until'] <= 7) & (df['status'].isin(['已排期', '正常']))]
        if not upcoming.empty:
            upcoming_df = upcoming.copy()
            upcoming_df['异常类型'] = '临近开庭(7天内)'
            upcoming_df['紧急程度'] = upcoming_df['days_until'].apply(
                lambda x: '高危' if x <= 1 else ('中危' if x <= 3 else '低危')
            )
            anomaly_dfs.append(upcoming_df)

        not_ready = df[(df['days_until'] >= 0) & (df['days_until'] <= 3) &
                       (df['preparation_status'].isin(['未开始', '进行中']))]
        if not not_ready.empty:
            not_ready_df = not_ready.copy()
            not_ready_df['异常类型'] = '临近未准备充分'
            not_ready_df['紧急程度'] = '高危'
            anomaly_dfs.append(not_ready_df)

        conflict = df[df['anomalies'].apply(lambda x: isinstance(x, list) and len(x) > 0)]
        if not conflict.empty:
            conflict_df = conflict.copy()
            conflict_df['异常类型'] = conflict_df['anomalies'].apply(lambda x: '、'.join(x))
            conflict_df['紧急程度'] = '高危'
            anomaly_dfs.append(conflict_df)

        rescheduled = df[df['status'] == '已改期']
        if not rescheduled.empty:
            resched_df = rescheduled.copy()
            resched_df['异常类型'] = '已改期'
            resched_df['紧急程度'] = '中危'
            anomaly_dfs.append(resched_df)

        past_unfinished = df[(df['days_until'] < 0) & (~df['status'].isin(['已完成']))]
        if not past_unfinished.empty:
            past_df = past_unfinished.copy()
            past_df['异常类型'] = '已过时间未完成'
            past_df['紧急程度'] = '中危'
            anomaly_dfs.append(past_df)

        if anomaly_dfs:
            result = pd.concat(anomaly_dfs, ignore_index=True)
            if not cases_df.empty:
                case_info = cases_df[['id', 'case_number', 'current_stage', 'responsible_lawyer_name']]
                case_info = case_info.rename(columns={
                    'id': 'case_id',
                    'responsible_lawyer_name': '主办律师'
                })
                result = result.merge(case_info, on='case_id', how='left')
            result = result.drop_duplicates(subset=['id', '异常类型'])
            return result
        return pd.DataFrame()


class FinanceService:
    @staticmethod
    def get_payment_summary_df(payments_df: pd.DataFrame, cases_df: pd.DataFrame) -> pd.DataFrame:
        if payments_df.empty:
            return pd.DataFrame()
        df = payments_df.copy()

        has_finance = all(col in df.columns for col in ['contract_amount', 'scheduled_amount', 'actual_amount'])

        if has_finance:
            summary = df.groupby('case_id').agg(
                合同总额=('contract_amount', 'sum'),
                应收总额=('scheduled_amount', 'sum'),
                实收总额=('actual_amount', 'sum'),
                笔数=('id', 'count')
            ).reset_index()
            summary['回款率'] = (summary['实收总额'] / summary['应收总额'] * 100).round(1).where(summary['应收总额'] > 0, 0)
            summary['差额'] = summary['应收总额'] - summary['实收总额']
        else:
            summary = df.groupby('case_id').agg(
                笔数=('id', 'count')
            ).reset_index()

        if not cases_df.empty:
            case_info = cases_df[['id', 'case_number', 'case_name', 'client_name', 'current_stage']]
            case_info = case_info.rename(columns={'id': 'case_id'})
            summary = summary.merge(case_info, on='case_id', how='left')
        return summary


class RefreshService:
    @staticmethod
    def get_last_refresh_time(refresh_type: str = None) -> Dict[str, Any]:
        result = {
            'overall': None,
            'email': None,
            'calendar': None,
            'payment': None,
            'mv': None
        }
        if refresh_type:
            log = DataRefreshLog.query.filter_by(
                refresh_type=refresh_type, status='success'
            ).order_by(DataRefreshLog.finished_at.desc()).first()
            if log:
                result[refresh_type] = log.finished_at.isoformat() if log.finished_at else None
        else:
            for rt in ['email', 'calendar', 'payment', 'mv']:
                log = DataRefreshLog.query.filter_by(
                    refresh_type=rt, status='success'
                ).order_by(DataRefreshLog.finished_at.desc()).first()
                if log:
                    result[rt] = log.finished_at.isoformat() if log.finished_at else None
            latest = DataRefreshLog.query.filter_by(
                status='success'
            ).order_by(DataRefreshLog.finished_at.desc()).first()
            if latest:
                result['overall'] = latest.finished_at.isoformat() if latest.finished_at else None
        return result
