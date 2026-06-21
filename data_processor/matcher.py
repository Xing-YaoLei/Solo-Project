import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta


class DataMatcher:
    def __init__(self):
        self.field_mappings = {
            'order_system': {
                'orders': {
                    'id': 'order_id',
                    'order_number': 'order_no',
                    'customer_id': 'user_id',
                    'courier_id': 'rider_id',
                    'shop_id': 'merchant_id',
                    'type': 'order_type',
                    'status': 'order_status',
                    'pickup_addr': 'pickup_address',
                    'pickup_longitude': 'pickup_lng',
                    'pickup_latitude': 'pickup_lat',
                    'delivery_addr': 'delivery_address',
                    'delivery_longitude': 'delivery_lng',
                    'delivery_latitude': 'delivery_lat',
                    'distance': 'distance_km',
                    'estimated_price': 'estimated_amount',
                    'actual_price': 'actual_amount',
                    'coupon_amount': 'subsidy_amount',
                    'created_at': 'create_time',
                    'accepted_at': 'accept_time',
                    'picked_at': 'pickup_time',
                    'delivered_at': 'delivery_time',
                    'cancelled_at': 'cancel_time',
                    'cancel_reason': 'cancel_reason',
                    'is_risk': 'is_risk_order',
                    'risk_tag': 'risk_level',
                    'source': 'data_source'
                }
            },
            'payment_system': {
                'payments': {
                    'transaction_id': 'txn_id',
                    'order_id': 'order_id',
                    'user_id': 'user_id',
                    'payment_method': 'pay_type',
                    'amount': 'pay_amount',
                    'status': 'pay_status',
                    'paid_at': 'pay_time',
                    'refund_amount': 'refund_amount',
                    'refunded_at': 'refund_time',
                    'third_party_id': 'third_party_txn_id',
                    'currency_code': 'currency',
                    'source': 'data_source'
                }
            },
            'map_system': {
                'trajectories': {
                    'track_id': 'traj_id',
                    'rider_id': 'rider_id',
                    'order_id': 'order_id',
                    'longitude': 'lng',
                    'latitude': 'lat',
                    'speed': 'speed_kmh',
                    'direction': 'heading',
                    'precision': 'accuracy_m',
                    'timestamp': 'record_time',
                    'source': 'data_source'
                }
            }
        }

        self.status_mappings = {
            'order_system': {
                'pending': 'created',
                'waiting_courier': 'created',
                'courier_assigned': 'accepted',
                'courier_accepted': 'accepted',
                'picked_up': 'picked_up',
                'in_delivery': 'picked_up',
                'completed': 'delivered',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
                'canceled': 'cancelled',
                'expired': 'expired',
                'timeout': 'expired'
            },
            'payment_system': {
                'unpaid': 'pending',
                'pending': 'pending',
                'paid': 'success',
                'success': 'success',
                'failed': 'failed',
                'failure': 'failed',
                'refunded': 'refunded',
                'refund': 'refunded',
                'partial_refund': 'partial_refunded'
            }
        }

        self.type_mappings = {
            'takeout': 'food_delivery',
            'food': 'food_delivery',
            'express': 'express_delivery',
            'shopping': 'shopping',
            'errand': 'errand'
        }

    def match_orders(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        mapping = self.field_mappings.get(source_system, {}).get('orders', {})
        df = self._rename_fields(df, mapping)
        df = self._standardize_order_status(df, source_system)
        df = self._standardize_order_type(df)
        df = self._standardize_amounts(df)
        df = self._ensure_geocoordinates(df)
        df, time_issues = self._standardize_timestamps(df)
        issues.extend(time_issues)
        
        validation_issues = self._validate_order_consistency(df)
        issues.extend(validation_issues)
        
        return df, issues

    def match_payments(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        mapping = self.field_mappings.get(source_system, {}).get('payments', {})
        df = self._rename_fields(df, mapping)
        df = self._standardize_payment_status(df, source_system)
        
        if 'pay_amount' in df.columns:
            df['pay_amount'] = pd.to_numeric(df['pay_amount'], errors='coerce').fillna(0)
        if 'refund_amount' in df.columns:
            df['refund_amount'] = pd.to_numeric(df['refund_amount'], errors='coerce').fillna(0)
        
        validation_issues = self._validate_payment_consistency(df)
        issues.extend(validation_issues)
        
        return df, issues

    def match_trajectories(self, df: pd.DataFrame, source_system: str) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        
        if df.empty:
            return df, issues

        df = df.copy()
        
        mapping = self.field_mappings.get(source_system, {}).get('trajectories', {})
        df = self._rename_fields(df, mapping)
        
        if 'speed_kmh' in df.columns:
            df['speed_kmh'] = pd.to_numeric(df['speed_kmh'], errors='coerce')
        
        if 'record_time' in df.columns:
            df['record_time'] = pd.to_datetime(df['record_time'], errors='coerce')
        
        if 'lng' in df.columns:
            df['lng'] = pd.to_numeric(df['lng'], errors='coerce')
        if 'lat' in df.columns:
            df['lat'] = pd.to_numeric(df['lat'], errors='coerce')
        
        return df, issues

    def _rename_fields(self, df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
        rename_dict = {}
        for source_field, target_field in mapping.items():
            if source_field in df.columns and target_field not in df.columns:
                rename_dict[source_field] = target_field
        if rename_dict:
            df = df.rename(columns=rename_dict)
        return df

    def _standardize_order_status(self, df: pd.DataFrame, source_system: str) -> pd.DataFrame:
        if 'order_status' not in df.columns:
            return df
        
        status_map = self.status_mappings.get(source_system, {})
        if status_map:
            df['order_status'] = df['order_status'].astype(str).str.strip().str.lower()
            df['order_status'] = df['order_status'].map(status_map).fillna(df['order_status'])
        
        return df

    def _standardize_payment_status(self, df: pd.DataFrame, source_system: str) -> pd.DataFrame:
        if 'pay_status' not in df.columns:
            return df
        
        status_map = self.status_mappings.get(source_system, {})
        if status_map:
            df['pay_status'] = df['pay_status'].astype(str).str.strip().str.lower()
            df['pay_status'] = df['pay_status'].map(status_map).fillna(df['pay_status'])
        
        return df

    def _standardize_order_type(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'order_type' not in df.columns:
            return df
        
        df['order_type'] = df['order_type'].astype(str).str.strip().str.lower()
        df['order_type'] = df['order_type'].map(self.type_mappings).fillna(df['order_type'])
        
        return df

    def _standardize_amounts(self, df: pd.DataFrame) -> pd.DataFrame:
        amount_cols = ['estimated_amount', 'actual_amount', 'subsidy_amount']
        for col in amount_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        return df

    def _ensure_geocoordinates(self, df: pd.DataFrame) -> pd.DataFrame:
        coord_cols = ['pickup_lng', 'pickup_lat', 'delivery_lng', 'delivery_lat']
        for col in coord_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df

    def _standardize_timestamps(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict]]:
        issues = []
        time_cols = ['create_time', 'accept_time', 'pickup_time', 'delivery_time', 'cancel_time']
        
        for col in time_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                
                future_mask = df[col] > datetime.now() + timedelta(days=1)
                if future_mask.any():
                    issues.append({'type': f'future_{col}', 'count': future_mask.sum()})
                    df.loc[future_mask, col] = None
        
        return df, issues

    def _validate_order_consistency(self, df: pd.DataFrame) -> List[Dict]:
        issues = []
        
        if 'create_time' in df.columns and 'accept_time' in df.columns:
            invalid = df[(df['accept_time'].notna()) & (df['accept_time'] < df['create_time'])]
            if not invalid.empty:
                issues.append({'type': 'accept_before_create', 'count': len(invalid)})
        
        if 'accept_time' in df.columns and 'pickup_time' in df.columns:
            invalid = df[(df['pickup_time'].notna()) & (df['pickup_time'] < df['accept_time'])]
            if not invalid.empty:
                issues.append({'type': 'pickup_before_accept', 'count': len(invalid)})
        
        if 'pickup_time' in df.columns and 'delivery_time' in df.columns:
            invalid = df[(df['delivery_time'].notna()) & (df['delivery_time'] < df['pickup_time'])]
            if not invalid.empty:
                issues.append({'type': 'delivery_before_pickup', 'count': len(invalid)})
        
        if 'actual_amount' in df.columns and 'estimated_amount' in df.columns:
            large_deviation = df[
                (df['estimated_amount'] > 0) &
                (abs(df['actual_amount'] - df['estimated_amount']) / df['estimated_amount'] > 0.5)
            ]
            if not large_deviation.empty:
                issues.append({'type': 'large_amount_deviation', 'count': len(large_deviation)})
        
        return issues

    def _validate_payment_consistency(self, df: pd.DataFrame) -> List[Dict]:
        issues = []
        
        if 'pay_amount' in df.columns and 'refund_amount' in df.columns:
            invalid = df[df['refund_amount'] > df['pay_amount']]
            if not invalid.empty:
                issues.append({'type': 'refund_exceeds_payment', 'count': len(invalid)})
                df.loc[invalid.index, 'refund_amount'] = df.loc[invalid.index, 'pay_amount']
        
        if 'pay_status' in df.columns and 'pay_time' in df.columns:
            success_no_time = df[(df['pay_status'] == 'success') & (df['pay_time'].isna())]
            if not success_no_time.empty:
                issues.append({'type': 'success_payment_no_time', 'count': len(success_no_time)})
        
        return issues

    def get_supported_systems(self) -> List[str]:
        return list(self.field_mappings.keys())
