import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, case
from app.database import get_session
from app.models import Property, Contract, Tenant, MeterReading, RepairRecord, OverdueNote, ImportBatch
from app.auth import is_manager, get_allowed_projects, get_allowed_districts, get_managed_property_ids


class ReportDataService:
    def __init__(self, user=None):
        self.user = user

    def _get_scope_property_ids(self, session):
        if not self.user or is_manager(self.user):
            return None

        user_id = self.user.id
        allowed_projects = get_allowed_projects(user_id)
        allowed_districts = get_allowed_districts(user_id)
        managed_ids = get_managed_property_ids(user_id)

        subq_conditions = []
        if allowed_projects:
            subq_conditions.append(Property.project_name.in_(allowed_projects))
        if allowed_districts:
            subq_conditions.append(Property.district.in_(allowed_districts))
        if managed_ids:
            subq_conditions.append(Property.property_id.in_(managed_ids))

        if not subq_conditions:
            return []

        rows = session.query(Property.property_id).filter(or_(*subq_conditions)).all()
        return [r[0] for r in rows]

    def _apply_scope(self, session, query, model):
        if not self.user or is_manager(self.user):
            return query

        if model == Property:
            user_id = self.user.id
            allowed_projects = get_allowed_projects(user_id)
            allowed_districts = get_allowed_districts(user_id)
            managed_ids = get_managed_property_ids(user_id)
            conditions = []
            if allowed_projects:
                conditions.append(model.project_name.in_(allowed_projects))
            if allowed_districts:
                conditions.append(model.district.in_(allowed_districts))
            if managed_ids:
                conditions.append(model.property_id.in_(managed_ids))
            if conditions:
                query = query.filter(or_(*conditions))
        elif model == Contract:
            allowed_prop_ids = self._get_scope_property_ids(session)
            if allowed_prop_ids is not None and allowed_prop_ids is not []:
                if allowed_prop_ids:
                    query = query.filter(model.property_id.in_(allowed_prop_ids))
                else:
                    query = query.filter(model.property_id == '__NO_MATCH__')
        return query

    def get_overview_metrics(self):
        with get_session() as session:
            prop_query = session.query(Property)
            prop_query = self._apply_scope(session, prop_query, Property)
            total_properties = prop_query.count()

            listed_props = prop_query.filter(Property.listing_status == 'published').count()

            contract_query = session.query(Contract)
            contract_query = self._apply_scope(session, contract_query, Contract)
            active_contracts = contract_query.filter(Contract.contract_status == 'active').count()

            occupancy_rate = (active_contracts / total_properties * 100) if total_properties > 0 else 0

            listing_funnel = (
                session.query(
                    Property.listing_status,
                    func.count(Property.id)
                )
            )
            listing_funnel = self._apply_scope(session, listing_funnel, Property)
            listing_funnel = listing_funnel.group_by(Property.listing_status).all()

            overdue = contract_query.filter(Contract.overdue_status == 'overdue').count()
            overdue_amount = (
                contract_query.filter(Contract.overdue_status == 'overdue')
                .with_entities(func.coalesce(func.sum(Contract.overdue_amount), 0)).scalar()
            )

            return {
                'total_properties': total_properties,
                'listed_properties': listed_props,
                'listing_rate': (listed_props / total_properties * 100) if total_properties > 0 else 0,
                'active_contracts': active_contracts,
                'occupancy_rate': round(occupancy_rate, 2),
                'overdue_count': overdue,
                'overdue_amount': float(overdue_amount or 0),
                'listing_funnel': {status: cnt for status, cnt in listing_funnel},
            }

    def get_listing_funnel_data(self):
        with get_session() as session:
            query = session.query(
                Property.district,
                Property.listing_status,
                func.count(Property.id).label('cnt')
            )
            query = self._apply_scope(session, query, Property)
            query = query.group_by(Property.district, Property.listing_status)
            df = pd.read_sql(query.statement, session.bind)

        if df.empty:
            return pd.DataFrame(columns=['district', 'status', 'count'])

        pivot = df.pivot_table(
            index='district',
            columns='listing_status',
            values='cnt',
            fill_value=0,
            aggfunc='sum'
        ).reset_index()
        return pivot

    def get_photo_distribution(self):
        with get_session() as session:
            query = session.query(Property)
            query = self._apply_scope(session, query, Property)
            df = pd.read_sql(query.statement, session.bind)

        if df.empty:
            return pd.DataFrame(columns=['bin', 'count'])

        bins = [0, 1, 3, 5, 10, 20, float('inf')]
        labels = ['0张', '1-2张', '3-4张', '5-9张', '10-19张', '20张以上']
        df['photo_bin'] = pd.cut(df['photo_count'], bins=bins, labels=labels, right=False)
        dist = df['photo_bin'].value_counts().sort_index().reset_index()
        dist.columns = ['photo_bin', 'count']
        return dist

    def get_tenant_funnel(self):
        with get_session() as session:
            query = session.query(
                Tenant.profile_stage,
                func.count(Tenant.id).label('count')
            )
            stages_order = ['inquiry', 'viewing', 'deposit', 'signing', 'checked_in', 'moved_out']
            query = query.group_by(Tenant.profile_stage)
            data = query.all()

        stage_map = dict(data)
        result = []
        for stage in stages_order:
            result.append({
                'stage': stage,
                'stage_name': {
                    'inquiry': '意向',
                    'viewing': '看房',
                    'deposit': '意向金',
                    'signing': '签约中',
                    'checked_in': '已入住',
                    'moved_out': '已退租',
                }.get(stage, stage),
                'count': stage_map.get(stage, 0)
            })
        return pd.DataFrame(result)

    def get_contract_version_ranking(self):
        with get_session() as session:
            query = session.query(
                Contract.contract_version,
                func.count(Contract.id).label('usage_count'),
                func.count(
                    case(
                        (and_(Contract.contract_status == 'active', Contract.overdue_status == 'overdue'),
                         Contract.id)
                    )
                ).label('overdue_count'),
                func.avg(Contract.monthly_rent).label('avg_rent'),
            )
            query = self._apply_scope(session, query, Contract)
            query = query.group_by(Contract.contract_version).order_by(
                func.count(Contract.id).desc()
            )
            df = pd.read_sql(query.statement, session.bind)
        return df

    def get_repair_trend(self, months=6):
        end_date = datetime.today()
        start_date = end_date - timedelta(days=months * 30)

        with get_session() as session:
            query = session.query(
                RepairRecord.repair_type,
                RepairRecord.repair_status,
                RepairRecord.report_time,
                RepairRecord.cost,
                RepairRecord.satisfaction,
            )
            query = query.filter(RepairRecord.report_time >= start_date)
            df = pd.read_sql(query.statement, session.bind)

        if df.empty:
            return pd.DataFrame(columns=['month', 'type', 'status', 'count'])

        df['month'] = pd.to_datetime(df['report_time']).dt.to_period('M').astype(str)
        monthly = (
            df.groupby(['month', 'repair_type', 'repair_status'])
            .size().reset_index(name='count')
            .sort_values('month')
        )
        return monthly

    def get_repair_summary(self):
        with get_session() as session:
            query = session.query(
                RepairRecord.repair_type,
                RepairRecord.repair_status,
                func.count(RepairRecord.id).label('count'),
                func.coalesce(func.sum(RepairRecord.cost), 0).label('total_cost'),
                func.coalesce(func.avg(RepairRecord.satisfaction), 0).label('avg_satisfaction'),
            )
            query = query.group_by(RepairRecord.repair_type, RepairRecord.repair_status)
            df = pd.read_sql(query.statement, session.bind)
        return df

    def get_overdue_contracts(self):
        with get_session() as session:
            query = session.query(
                Contract.contract_no,
                Contract.property_id,
                Contract.tenant_id,
                Contract.monthly_rent,
                Contract.overdue_days,
                Contract.overdue_amount,
                Contract.contract_status,
                Property.project_name,
                Property.unit_no,
                Tenant.name.label('tenant_name'),
                Tenant.phone.label('tenant_phone'),
            ).outerjoin(Property, Contract.property_id == Property.property_id
            ).outerjoin(Tenant, Contract.tenant_id == Tenant.tenant_id)
            query = query.filter(Contract.overdue_status == 'overdue')
            query = self._apply_scope(session, query, Contract)
            query = query.order_by(Contract.overdue_days.desc())
            df = pd.read_sql(query.statement, session.bind)
        return df

    def get_overdue_notes(self, contract_no):
        with get_session() as session:
            notes = (
                session.query(OverdueNote)
                .filter(OverdueNote.contract_no == contract_no)
                .order_by(OverdueNote.created_at.desc())
                .all()
            )
            result = []
            for n in notes:
                result.append({
                    'id': n.id,
                    'content': n.note_content,
                    'type': n.note_type,
                    'created_by': n.created_by,
                    'created_at': n.created_at.strftime('%Y-%m-%d %H:%M') if n.created_at else '',
                })
            return result

    def add_overdue_note(self, contract_no, content, note_type='remark', created_by=None):
        with get_session() as session:
            note = OverdueNote(
                contract_no=contract_no,
                note_content=content,
                note_type=note_type,
                created_by=created_by,
            )
            session.add(note)
            session.commit()
            return note.id

    def get_occupancy_detail(self):
        with get_session() as session:
            prop_query = session.query(
                Property.property_id,
                Property.project_name,
                Property.district,
                Property.building,
                Property.unit_no,
                Property.room_type,
                Property.area,
                Property.listing_status,
                Property.manager_id,
                Contract.contract_no,
                Contract.contract_status,
                Contract.monthly_rent,
                Contract.start_date,
                Contract.end_date,
                Contract.overdue_status,
                Tenant.name.label('tenant_name'),
                Tenant.phone.label('tenant_phone'),
            ).outerjoin(Contract, and_(
                Contract.property_id == Property.property_id,
                Contract.contract_status == 'active'
            )).outerjoin(Tenant, Contract.tenant_id == Tenant.tenant_id)

            prop_query = self._apply_scope(session, prop_query, Property)
            prop_query = prop_query.order_by(Property.project_name, Property.building, Property.unit_no)
            df = pd.read_sql(prop_query.statement, session.bind)

        if df.empty:
            return df

        df['occupancy_status'] = df['contract_status'].apply(
            lambda x: '已出租' if x == 'active' else '空闲'
        )
        return df

    def get_batch_history(self, limit=50):
        with get_session() as session:
            batches = (
                session.query(ImportBatch)
                .order_by(ImportBatch.started_at.desc())
                .limit(limit)
                .all()
            )
            result = []
            for b in batches:
                result.append({
                    'batch_no': b.batch_no,
                    'batch_type': b.batch_type,
                    'source_file': b.source_file,
                    'total': b.total_records,
                    'success': b.success_records,
                    'failed': b.failed_records,
                    'status': b.status,
                    'error': b.error_message,
                    'started_at': b.started_at.strftime('%Y-%m-%d %H:%M') if b.started_at else '',
                    'completed_at': b.completed_at.strftime('%Y-%m-%d %H:%M') if b.completed_at else '',
                })
            return result
