import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from data.data_loader import data_loader


class DataProcessor:
    def __init__(self):
        self.loader = data_loader

    def get_overview_metrics(self, start_date=None, end_date=None, store_id=None):
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        audit_tasks = self.loader.get_audit_tasks(store_id)
        followup_records = self.loader.get_followup_records(store_id)
        cashier_records = self.loader.get_cashier_records(start_date, end_date, store_id)

        total_prescriptions = len(prescriptions) if not prescriptions.empty else 0
        unclear_prescriptions = len(prescriptions[prescriptions['is_clear'] == False]) if not prescriptions.empty else 0
        unclear_rate = (unclear_prescriptions / total_prescriptions * 100) if total_prescriptions > 0 else 0

        passed_prescriptions = len(prescriptions[prescriptions['audit_status'] == '已通过']) if not prescriptions.empty else 0
        pass_rate = (passed_prescriptions / total_prescriptions * 100) if total_prescriptions > 0 else 0

        total_tasks = len(audit_tasks) if not audit_tasks.empty else 0
        pending_tasks = len(audit_tasks[audit_tasks['task_status'] == '待处理']) if not audit_tasks.empty else 0
        completed_tasks = len(audit_tasks[audit_tasks['task_status'] == '已完成']) if not audit_tasks.empty else 0
        task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

        followup_needed = len(audit_tasks[audit_tasks['followup_needed'] == True]) if not audit_tasks.empty else 0
        followup_completed = len(followup_records[followup_records['followup_status'] == '已完成']) if not followup_records.empty else 0
        followup_rate = (followup_completed / followup_needed * 100) if followup_needed > 0 else 0

        total_amount = cashier_records['total_amount'].sum() if not cashier_records.empty else 0

        return {
            'total_prescriptions': total_prescriptions,
            'unclear_prescriptions': unclear_prescriptions,
            'unclear_rate': round(unclear_rate, 2),
            'pass_rate': round(pass_rate, 2),
            'total_tasks': total_tasks,
            'pending_tasks': pending_tasks,
            'task_completion_rate': round(task_completion_rate, 2),
            'followup_needed': followup_needed,
            'followup_completed': followup_completed,
            'followup_rate': round(followup_rate, 2),
            'total_amount': round(total_amount, 2),
        }

    def get_prescription_trend(self, start_date=None, end_date=None, store_id=None, freq='D'):
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        if prescriptions.empty:
            return pd.DataFrame()

        prescriptions['date'] = pd.to_datetime(prescriptions['created_at']).dt.to_period(freq).dt.to_timestamp()
        trend = prescriptions.groupby(['date', 'audit_status']).size().unstack(fill_value=0)

        trend['total'] = trend.sum(axis=1)
        trend['unclear'] = prescriptions[prescriptions['is_clear'] == False].groupby('date').size().reindex(trend.index, fill_value=0)
        trend['unclear_rate'] = (trend['unclear'] / trend['total'] * 100).round(2)

        return trend.reset_index()

    def get_unclear_reason_distribution(self, start_date=None, end_date=None, store_id=None):
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        if prescriptions.empty:
            return pd.DataFrame()

        unclear = prescriptions[prescriptions['is_clear'] == False]
        if unclear.empty:
            return pd.DataFrame()

        dist = unclear.groupby('unclear_reason').agg({
            'prescription_id': 'count',
            'store_id': lambda x: x.nunique()
        }).reset_index()
        dist.columns = ['reason', 'count', 'store_count']
        dist['percentage'] = (dist['count'] / dist['count'].sum() * 100).round(2)
        dist = dist.sort_values('count', ascending=False)

        return dist

    def get_prescription_by_store(self, start_date=None, end_date=None):
        prescriptions = self.loader.get_prescriptions(start_date, end_date)
        stores = self.loader.get_stores()

        if prescriptions.empty:
            return pd.DataFrame()

        by_store = prescriptions.groupby('store_id').agg({
            'prescription_id': 'count',
            'is_clear': lambda x: (x == False).sum(),
            'audit_status': lambda x: (x == '已通过').sum()
        }).reset_index()
        by_store.columns = ['store_id', 'total', 'unclear', 'passed']

        if not stores.empty:
            by_store = by_store.merge(stores[['store_id', 'store_name', 'store_code']], on='store_id', how='left')

        by_store['unclear_rate'] = (by_store['unclear'] / by_store['total'] * 100).round(2)
        by_store['pass_rate'] = (by_store['passed'] / by_store['total'] * 100).round(2)
        by_store = by_store.sort_values('unclear_rate', ascending=False)

        return by_store

    def get_prescription_photo_stats(self, start_date=None, end_date=None, store_id=None, mode='absolute'):
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        stores = self.loader.get_stores()

        if prescriptions.empty:
            return pd.DataFrame()

        photo_stats = prescriptions.groupby('store_id').agg({
            'prescription_id': 'count',
            'is_photo_provided': lambda x: (x == True).sum(),
            'photo_count': 'sum'
        }).reset_index()
        photo_stats.columns = ['store_id', 'total_prescriptions', 'with_photo', 'total_photos']

        if not stores.empty:
            photo_stats = photo_stats.merge(stores[['store_id', 'store_name', 'store_code']], on='store_id', how='left')

        photo_stats['no_photo'] = photo_stats['total_prescriptions'] - photo_stats['with_photo']

        if mode == 'percentage':
            photo_stats['with_photo'] = (photo_stats['with_photo'] / photo_stats['total_prescriptions'] * 100).round(2)
            photo_stats['no_photo'] = (photo_stats['no_photo'] / photo_stats['total_prescriptions'] * 100).round(2)

        photo_stats = photo_stats.sort_values('with_photo', ascending=mode == 'percentage')

        return photo_stats

    def get_drug_ranking(self, start_date=None, end_date=None, store_id=None, top_n=10):
        cashier_items = self.loader.get_cashier_items()
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        drugs = self.loader.get_drugs()

        if cashier_items.empty or prescriptions.empty:
            return pd.DataFrame()

        rx_items = cashier_items[cashier_items['prescription_id'].isin(prescriptions['prescription_id'])]

        ranking = rx_items.groupby('drug_id').agg({
            'cashier_item_id': 'count',
            'quantity': 'sum',
            'subtotal': 'sum'
        }).reset_index()
        ranking.columns = ['drug_id', 'prescription_count', 'total_quantity', 'total_amount']

        if not drugs.empty:
            ranking = ranking.merge(drugs[['drug_id', 'drug_name', 'specification', 'category']], on='drug_id', how='left')

        ranking = ranking.sort_values('prescription_count', ascending=False).head(top_n)

        return ranking

    def get_batch_expiry_analysis(self, store_id=None, risk_days=90):
        inventory = self.loader.get_inventory(store_id)
        drugs = self.loader.get_drugs()
        stores = self.loader.get_stores()

        if inventory.empty:
            return pd.DataFrame()

        today = datetime.now().date()
        inventory['expiry_date'] = pd.to_datetime(inventory['expiry_date'])
        inventory['days_to_expiry'] = (inventory['expiry_date'].dt.date - today).apply(lambda x: x.days)
        inventory['expiry_date'] = inventory['expiry_date'].dt.date

        def get_expiry_status(days):
            if days < 0:
                return '已过期'
            elif days <= 30:
                return '临期(30天内)'
            elif days <= 90:
                return '近效期(90天内)'
            elif days <= 180:
                return '半年内'
            else:
                return '正常'

        inventory['expiry_status'] = inventory['days_to_expiry'].apply(get_expiry_status)

        if not drugs.empty:
            inventory = inventory.merge(drugs[['drug_id', 'drug_name', 'specification']], on='drug_id', how='left')
        if not stores.empty:
            inventory = inventory.merge(stores[['store_id', 'store_name']], on='store_id', how='left')

        inventory['stock_value'] = inventory['quantity'] * inventory['unit_cost']

        return inventory

    def get_member_prescription_analysis(self, start_date=None, end_date=None, store_id=None):
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        members = self.loader.get_members()
        audit_tasks = self.loader.get_audit_tasks(store_id)

        if prescriptions.empty:
            return pd.DataFrame()

        member_rx = prescriptions.groupby('member_id').agg({
            'prescription_id': 'count',
            'is_clear': lambda x: (x == False).sum(),
            'total_amount': lambda x: x.sum() if 'total_amount' in x else 0
        }).reset_index()
        member_rx.columns = ['member_id', 'rx_count', 'unclear_count', 'total_amount']

        if not members.empty:
            member_rx = member_rx.merge(members[['member_id', 'name', 'member_card_no', 'chronic_disease', 'member_level', 'phone']], on='member_id', how='left')

        member_rx['unclear_rate'] = (member_rx['unclear_count'] / member_rx['rx_count'] * 100).round(2)
        member_rx = member_rx.sort_values('rx_count', ascending=False)

        return member_rx

    def get_replenishment_analysis(self, start_date=None, end_date=None, store_id=None):
        replenishment = self.loader.get_replenishment_orders(store_id, start_date, end_date)
        replenishment_items = self.loader.get_replenishment_items()
        drugs = self.loader.get_drugs()

        if replenishment.empty:
            return pd.DataFrame()

        replenishment['order_date'] = pd.to_datetime(replenishment['order_date'])
        replenishment['actual_date'] = pd.to_datetime(replenishment['actual_date'])
        replenishment['expected_date'] = pd.to_datetime(replenishment['expected_date'])

        replenishment['delay_days'] = (replenishment['actual_date'] - replenishment['expected_date']).apply(lambda x: x.days if pd.notna(x) else None)
        replenishment['is_delayed'] = replenishment['delay_days'] > 0

        return replenishment

    def get_replenishment_items_for_prescription(self, prescription_id):
        cashier_items = self.loader.get_cashier_items(prescription_id=prescription_id)
        if cashier_items.empty:
            return pd.DataFrame()

        results = []
        for _, item in cashier_items.iterrows():
            inventory = self.loader.get_inventory(batch_no=item['batch_no'])
            if not inventory.empty and inventory['replenishment_order_id'].iloc[0] is not None:
                repl_items = self.loader.get_replenishment_items(order_id=inventory['replenishment_order_id'].iloc[0])
                if not repl_items.empty:
                    repl_items['batch_no'] = item['batch_no']
                    repl_items['prescription_id'] = prescription_id
                    results.append(repl_items)

        if results:
            return pd.concat(results, ignore_index=True)
        return pd.DataFrame()

    def get_inventory_for_prescription(self, prescription_id):
        cashier_items = self.loader.get_cashier_items(prescription_id=prescription_id)
        if cashier_items.empty:
            return pd.DataFrame()

        inventory_records = []
        for _, item in cashier_items.iterrows():
            if pd.notna(item['inventory_id']):
                inv = self.loader.get_inventory()
                inv_record = inv[inv['inventory_id'] == item['inventory_id']]
                if not inv_record.empty:
                    inventory_records.append(inv_record)

        if inventory_records:
            return pd.concat(inventory_records, ignore_index=True)
        return pd.DataFrame()

    def get_task_with_conclusions(self, start_date=None, end_date=None, store_id=None, task_status=None):
        tasks = self.loader.get_audit_tasks(store_id, task_status)
        prescriptions = self.loader.get_prescriptions(start_date, end_date, store_id)
        stores = self.loader.get_stores()
        members = self.loader.get_members()

        if tasks.empty:
            return pd.DataFrame()

        if not prescriptions.empty:
            tasks = tasks.merge(prescriptions[['prescription_id', 'prescription_no', 'member_id', 'unclear_reason', 'review_conclusion']], on='prescription_id', how='left')
        if not stores.empty:
            tasks = tasks.merge(stores[['store_id', 'store_name']], on='store_id', how='left')
        if not members.empty and 'member_id' in tasks.columns:
            tasks = tasks.merge(members[['member_id', 'name', 'phone']], on='member_id', how='left')

        tasks['processing_time_hours'] = None
        if 'completed_time' in tasks.columns and 'assigned_time' in tasks.columns:
            tasks['processing_time_hours'] = ((pd.to_datetime(tasks['completed_time']) - pd.to_datetime(tasks['assigned_time'])).apply(lambda x: x.total_seconds() / 3600 if pd.notna(x) else None)).round(2)

        return tasks

    def get_followup_performance(self, start_date=None, end_date=None, store_id=None):
        followup_records = self.loader.get_followup_records(store_id)
        audit_tasks = self.loader.get_audit_tasks(store_id)

        if followup_records.empty:
            return pd.DataFrame()

        followup_records['followup_date'] = pd.to_datetime(followup_records['followup_time']).dt.date

        daily_perf = followup_records.groupby('followup_date').agg({
            'followup_record_id': 'count',
            'followup_status': lambda x: (x == '已完成').sum(),
            'contact_result': lambda x: (x == '成功联系').sum()
        }).reset_index()
        daily_perf.columns = ['date', 'total_followups', 'completed', 'contacted']

        daily_perf['completion_rate'] = (daily_perf['completed'] / daily_perf['total_followups'] * 100).round(2)
        daily_perf['contact_rate'] = (daily_perf['contacted'] / daily_perf['total_followups'] * 100).round(2)

        return daily_perf

    def get_followup_by_operator(self, start_date=None, end_date=None, store_id=None):
        followup_records = self.loader.get_followup_records(store_id)

        if followup_records.empty:
            return pd.DataFrame()

        by_operator = followup_records.groupby('followup_operator').agg({
            'followup_record_id': 'count',
            'followup_status': lambda x: (x == '已完成').sum(),
            'contact_result': lambda x: (x == '成功联系').sum()
        }).reset_index()
        by_operator.columns = ['operator', 'total', 'completed', 'contacted']

        by_operator['completion_rate'] = (by_operator['completed'] / by_operator['total'] * 100).round(2)
        by_operator['contact_rate'] = (by_operator['contacted'] / by_operator['total'] * 100).round(2)
        by_operator = by_operator.sort_values('completion_rate', ascending=False)

        return by_operator


data_processor = DataProcessor()
