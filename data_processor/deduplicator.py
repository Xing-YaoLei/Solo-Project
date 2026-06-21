import pandas as pd
import hashlib
from typing import List, Dict, Tuple


class DataDeduplicator:
    def __init__(self):
        self.dedup_keys = {
            'orders': ['order_id'],
            'payments': ['txn_id'],
            'trajectories': ['traj_id']
        }

    def dedup_orders(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        dup_count = df.duplicated(subset=['order_id'], keep='first').sum()
        if dup_count > 0:
            issues.append({'type': 'duplicate_order_id', 'count': dup_count})
            df = df.drop_duplicates(subset=['order_id'], keep='first')

        df['_dup_hash'] = df.apply(lambda row: self._generate_hash(
            row, ['order_no', 'user_id', 'merchant_id', 'create_time', 'pickup_address', 'delivery_address']
        ), axis=1)
        
        content_dup = df.duplicated(subset=['_dup_hash'], keep=False)
        if content_dup.sum() > 0:
            content_dup_count = df[content_dup].groupby('_dup_hash').size().reset_index(name='count')
            content_dup_count = content_dup_count[content_dup_count['count'] > 1]
            issues.append({'type': 'content_duplicate', 'count': len(content_dup_count)})
            df = df.drop_duplicates(subset=['_dup_hash'], keep='first')

        df = df.drop(columns=['_dup_hash'])
        
        return df, issues

    def dedup_payments(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        dup_count = df.duplicated(subset=['txn_id'], keep='first').sum()
        if dup_count > 0:
            issues.append({'type': 'duplicate_txn_id', 'count': dup_count})
            df = df.drop_duplicates(subset=['txn_id'], keep='first')

        df['_dup_hash'] = df.apply(lambda row: self._generate_hash(
            row, ['order_id', 'user_id', 'pay_amount', 'pay_time']
        ), axis=1)
        
        content_dup = df.duplicated(subset=['_dup_hash'], keep=False)
        if content_dup.sum() > 0:
            content_dup_count = df[content_dup].groupby('_dup_hash').size().reset_index(name='count')
            content_dup_count = content_dup_count[content_dup_count['count'] > 1]
            issues.append({'type': 'content_duplicate', 'count': len(content_dup_count)})
            df = df.drop_duplicates(subset=['_dup_hash'], keep='first')

        df = df.drop(columns=['_dup_hash'])
        
        return df, issues

    def dedup_trajectories(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        dup_count = df.duplicated(subset=['traj_id'], keep='first').sum()
        if dup_count > 0:
            issues.append({'type': 'duplicate_traj_id', 'count': dup_count})
            df = df.drop_duplicates(subset=['traj_id'], keep='first')

        df['_time_key'] = df['rider_id'].astype(str) + '_' + df['record_time'].astype(str)
        time_dup = df.duplicated(subset=['_time_key'], keep='first').sum()
        if time_dup > 0:
            issues.append({'type': 'duplicate_rider_time', 'count': time_dup})
            df = df.drop_duplicates(subset=['_time_key'], keep='first')

        df = df.drop(columns=['_time_key'])
        
        return df, issues

    def _generate_hash(self, row: pd.Series, columns: List[str]) -> str:
        values = []
        for col in columns:
            if col in row.index and pd.notna(row[col]):
                values.append(str(row[col]))
            else:
                values.append('')
        combined = '|'.join(values)
        return hashlib.md5(combined.encode('utf-8')).hexdigest()

    def check_cross_source_duplicates(self, df: pd.DataFrame, 
                                      existing_ids: List[str]) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        id_col = self._get_id_column(df)
        if id_col and id_col in df.columns:
            cross_dup = df[df[id_col].astype(str).isin([str(i) for i in existing_ids])]
            if not cross_dup.empty:
                issues.append({'type': 'cross_source_duplicate', 'count': len(cross_dup)})
                df = df[~df[id_col].astype(str).isin([str(i) for i in existing_ids])]
        
        return df, issues

    def _get_id_column(self, df: pd.DataFrame) -> str:
        for id_col in ['order_id', 'txn_id', 'traj_id']:
            if id_col in df.columns:
                return id_col
        return None
