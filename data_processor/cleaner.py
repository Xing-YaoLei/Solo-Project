import pandas as pd
import numpy as np
from datetime import datetime
import re
from typing import Tuple, List, Dict


class DataCleaner:
    def __init__(self):
        self.required_columns = {
            'orders': ['order_id', 'order_no', 'user_id', 'merchant_id', 'order_type',
                       'order_status', 'pickup_address', 'delivery_address', 'create_time'],
            'payments': ['txn_id', 'order_id', 'user_id', 'pay_type', 'pay_amount', 'pay_status'],
            'trajectories': ['traj_id', 'rider_id', 'lng', 'lat', 'record_time']
        }

    def clean_orders(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        missing_cols = [col for col in self.required_columns['orders'] if col not in df.columns]
        if missing_cols:
            issues.append({'type': 'missing_columns', 'columns': missing_cols})
            for col in missing_cols:
                df[col] = None

        df['order_id'] = df['order_id'].astype(str).str.strip()
        df['order_no'] = df['order_no'].astype(str).str.strip()
        df['user_id'] = df['user_id'].astype(str).str.strip()
        df['merchant_id'] = df['merchant_id'].astype(str).str.strip()
        
        if 'rider_id' in df.columns:
            df['rider_id'] = df['rider_id'].astype(str).str.strip()
            df['rider_id'] = df['rider_id'].replace({'nan': None, 'None': None, '': None})

        df['order_type'] = df['order_type'].astype(str).str.strip().str.lower()
        df['order_status'] = df['order_status'].astype(str).str.strip().str.lower()

        valid_statuses = ['created', 'accepted', 'picked_up', 'delivered', 'cancelled', 'expired']
        invalid_status = df[~df['order_status'].isin(valid_statuses)]
        if not invalid_status.empty:
            issues.append({'type': 'invalid_order_status', 'count': len(invalid_status)})
            df.loc[~df['order_status'].isin(valid_statuses), 'order_status'] = 'unknown'

        time_columns = ['create_time', 'accept_time', 'pickup_time', 'delivery_time', 'cancel_time']
        for col in time_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                null_count = df[col].isnull().sum()
                if null_count > 0 and col == 'create_time':
                    issues.append({'type': 'null_create_time', 'count': null_count})

        df['pickup_address'] = df['pickup_address'].astype(str).str.strip()
        df['delivery_address'] = df['delivery_address'].astype(str).str.strip()

        coord_cols = ['pickup_lng', 'pickup_lat', 'delivery_lng', 'delivery_lat']
        for col in coord_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                if 'lng' in col:
                    invalid = df[(df[col] < 73) | (df[col] > 135)][col]
                else:
                    invalid = df[(df[col] < 3) | (df[col] > 54)][col]
                if not invalid.empty:
                    issues.append({'type': f'invalid_{col}', 'count': len(invalid)})
                    df.loc[invalid.index, col] = None

        if 'distance_km' in df.columns:
            df['distance_km'] = pd.to_numeric(df['distance_km'], errors='coerce')
            invalid_dist = df[(df['distance_km'] < 0) | (df['distance_km'] > 100)]
            if not invalid_dist.empty:
                issues.append({'type': 'invalid_distance', 'count': len(invalid_dist)})
                df.loc[invalid_dist.index, 'distance_km'] = None

        amount_cols = ['estimated_amount', 'actual_amount', 'subsidy_amount']
        for col in amount_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                df[col] = df[col].fillna(0)
                negative = df[df[col] < 0]
                if not negative.empty:
                    issues.append({'type': f'negative_{col}', 'count': len(negative)})
                    df.loc[negative.index, col] = 0

        if 'cancel_reason' in df.columns:
            df['cancel_reason'] = df['cancel_reason'].astype(str).str.strip()
            df['cancel_reason'] = df['cancel_reason'].replace({'nan': None, 'None': None, '': None})

        df['is_risk_order'] = df.get('is_risk_order', False).astype(bool)
        df['risk_level'] = df.get('risk_level', 'normal').astype(str).str.strip().str.lower()

        if 'data_source' not in df.columns:
            df['data_source'] = 'unknown'
        df['data_source'] = df['data_source'].astype(str).str.strip()

        df = df.dropna(subset=['order_id', 'create_time'])
        
        return df, issues

    def clean_payments(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        missing_cols = [col for col in self.required_columns['payments'] if col not in df.columns]
        if missing_cols:
            issues.append({'type': 'missing_columns', 'columns': missing_cols})
            for col in missing_cols:
                df[col] = None

        df['txn_id'] = df['txn_id'].astype(str).str.strip()
        df['order_id'] = df['order_id'].astype(str).str.strip()
        df['user_id'] = df['user_id'].astype(str).str.strip()
        df['pay_type'] = df['pay_type'].astype(str).str.strip().str.lower()
        df['pay_status'] = df['pay_status'].astype(str).str.strip().str.lower()

        valid_pay_status = ['pending', 'success', 'failed', 'refunded', 'partial_refunded']
        invalid = df[~df['pay_status'].isin(valid_pay_status)]
        if not invalid.empty:
            issues.append({'type': 'invalid_pay_status', 'count': len(invalid)})
            df.loc[~df['pay_status'].isin(valid_pay_status), 'pay_status'] = 'unknown'

        df['pay_amount'] = pd.to_numeric(df['pay_amount'], errors='coerce')
        df['pay_amount'] = df['pay_amount'].fillna(0)
        negative = df[df['pay_amount'] < 0]
        if not negative.empty:
            issues.append({'type': 'negative_pay_amount', 'count': len(negative)})
            df.loc[negative.index, 'pay_amount'] = 0

        if 'refund_amount' in df.columns:
            df['refund_amount'] = pd.to_numeric(df['refund_amount'], errors='coerce')
            df['refund_amount'] = df['refund_amount'].fillna(0)

        if 'pay_time' in df.columns:
            df['pay_time'] = pd.to_datetime(df['pay_time'], errors='coerce')
        if 'refund_time' in df.columns:
            df['refund_time'] = pd.to_datetime(df['refund_time'], errors='coerce')

        if 'third_party_txn_id' in df.columns:
            df['third_party_txn_id'] = df['third_party_txn_id'].astype(str).str.strip()
            df['third_party_txn_id'] = df['third_party_txn_id'].replace({'nan': None, 'None': None, '': None})

        if 'currency' not in df.columns:
            df['currency'] = 'CNY'

        if 'data_source' not in df.columns:
            df['data_source'] = 'unknown'
        df['data_source'] = df['data_source'].astype(str).str.strip()

        df = df.dropna(subset=['txn_id', 'order_id'])
        
        return df, issues

    def clean_trajectories(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        missing_cols = [col for col in self.required_columns['trajectories'] if col not in df.columns]
        if missing_cols:
            issues.append({'type': 'missing_columns', 'columns': missing_cols})
            for col in missing_cols:
                df[col] = None

        df['traj_id'] = df['traj_id'].astype(str).str.strip()
        df['rider_id'] = df['rider_id'].astype(str).str.strip()
        
        if 'order_id' in df.columns:
            df['order_id'] = df['order_id'].astype(str).str.strip()
            df['order_id'] = df['order_id'].replace({'nan': None, 'None': None, '': None})

        df['lng'] = pd.to_numeric(df['lng'], errors='coerce')
        df['lat'] = pd.to_numeric(df['lat'], errors='coerce')

        invalid_lng = df[(df['lng'] < 73) | (df['lng'] > 135)]
        invalid_lat = df[(df['lat'] < 3) | (df['lat'] > 54)]
        if not invalid_lng.empty:
            issues.append({'type': 'invalid_longitude', 'count': len(invalid_lng)})
        if not invalid_lat.empty:
            issues.append({'type': 'invalid_latitude', 'count': len(invalid_lat)})

        df = df.dropna(subset=['lng', 'lat'])

        if 'speed_kmh' in df.columns:
            df['speed_kmh'] = pd.to_numeric(df['speed_kmh'], errors='coerce')
            invalid_speed = df[(df['speed_kmh'] < 0) | (df['speed_kmh'] > 150)]
            if not invalid_speed.empty:
                issues.append({'type': 'invalid_speed', 'count': len(invalid_speed)})
                df.loc[invalid_speed.index, 'speed_kmh'] = None

        if 'heading' in df.columns:
            df['heading'] = pd.to_numeric(df['heading'], errors='coerce')
            invalid_heading = df[(df['heading'] < 0) | (df['heading'] > 360)]
            if not invalid_heading.empty:
                issues.append({'type': 'invalid_heading', 'count': len(invalid_heading)})
                df.loc[invalid_heading.index, 'heading'] = None

        if 'accuracy_m' in df.columns:
            df['accuracy_m'] = pd.to_numeric(df['accuracy_m'], errors='coerce')

        df['record_time'] = pd.to_datetime(df['record_time'], errors='coerce')
        null_time = df['record_time'].isnull().sum()
        if null_time > 0:
            issues.append({'type': 'null_record_time', 'count': null_time})
        df = df.dropna(subset=['record_time'])

        if 'data_source' not in df.columns:
            df['data_source'] = 'unknown'
        df['data_source'] = df['data_source'].astype(str).str.strip()

        df = df.dropna(subset=['traj_id', 'rider_id'])
        
        return df, issues

    def clean_address(self, address: str) -> str:
        if not address or pd.isna(address):
            return ''
        address = str(address).strip()
        address = re.sub(r'\s+', '', address)
        address = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\-]', '', address)
        return address

    def validate_phone(self, phone: str) -> bool:
        if not phone or pd.isna(phone):
            return False
        phone = str(phone).strip()
        pattern = r'^1[3-9]\d{9}$'
        return bool(re.match(pattern, phone))
