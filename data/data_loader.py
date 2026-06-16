import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from data.mock_data import mock_data
import warnings
warnings.filterwarnings('ignore')


class DataLoader:
    def __init__(self, use_mock=True):
        self.use_mock = use_mock
        self.mock_data = mock_data
        self._SessionLocal = None
        self._text = None

    def _get_db_session(self):
        if self.use_mock:
            return None
        if self._SessionLocal is None:
            import importlib
            models_db = importlib.import_module('models.database')
            self._SessionLocal = models_db.SessionLocal
        return self._SessionLocal()

    def _execute_query(self, query, params=None):
        if self.use_mock:
            return None
        try:
            if self._text is None:
                from sqlalchemy import text
                self._text = text
            db = self._get_db_session()
            result = pd.read_sql(self._text(query), db.bind, params=params)
            db.close()
            return result
        except Exception as e:
            print(f"Database query error: {e}")
            return None

    def get_table(self, table_name):
        if self.use_mock and table_name in self.mock_data:
            return self.mock_data[table_name].copy()
        query = f"SELECT * FROM {table_name}"
        return self._execute_query(query)

    def get_stores(self):
        return self.get_table('stores')

    def get_drugs(self):
        return self.get_table('drugs')

    def get_members(self):
        return self.get_table('members')

    def get_prescriptions(self, start_date=None, end_date=None, store_id=None):
        df = self.get_table('prescriptions')
        if df is None or df.empty:
            return df
        if start_date:
            df = df[df['created_at'] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df['created_at'] <= pd.to_datetime(end_date)]
        if store_id:
            df = df[df['store_id'] == store_id]
        return df

    def get_cashier_records(self, start_date=None, end_date=None, store_id=None):
        df = self.get_table('cashier_records')
        if df is None or df.empty:
            return df
        if start_date:
            df = df[df['sale_time'] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df['sale_time'] <= pd.to_datetime(end_date)]
        if store_id:
            df = df[df['store_id'] == store_id]
        return df

    def get_cashier_items(self, cashier_record_id=None, prescription_id=None):
        df = self.get_table('cashier_items')
        if df is None or df.empty:
            return df
        if cashier_record_id:
            df = df[cashier_record_id == df['cashier_record_id']]
        if prescription_id:
            df = df[df['prescription_id'] == prescription_id]
        return df

    def get_insurance_records(self, start_date=None, end_date=None, store_id=None):
        df = self.get_table('insurance_records')
        if df is None or df.empty:
            return df
        if start_date:
            df = df[df['settlement_time'] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df['settlement_time'] <= pd.to_datetime(end_date)]
        if store_id:
            df = df[df['store_id'] == store_id]
        return df

    def get_inventory(self, store_id=None, drug_id=None, batch_no=None):
        df = self.get_table('inventory')
        if df is None or df.empty:
            return df
        if store_id:
            df = df[df['store_id'] == store_id]
        if drug_id:
            df = df[df['drug_id'] == drug_id]
        if batch_no:
            df = df[df['batch_no'] == batch_no]
        return df

    def get_replenishment_orders(self, store_id=None, start_date=None, end_date=None):
        df = self.get_table('replenishment_orders')
        if df is None or df.empty:
            return df
        if store_id:
            df = df[df['store_id'] == store_id]
        if start_date:
            df = df[df['order_date'] >= pd.to_datetime(start_date).date()]
        if end_date:
            df = df[df['order_date'] <= pd.to_datetime(end_date).date()]
        return df

    def get_replenishment_items(self, order_id=None, drug_id=None):
        df = self.get_table('replenishment_items')
        if df is None or df.empty:
            return df
        if order_id:
            df = df[df['order_id'] == order_id]
        if drug_id:
            df = df[df['drug_id'] == drug_id]
        return df

    def get_audit_tasks(self, store_id=None, task_status=None, task_type=None):
        df = self.get_table('audit_tasks')
        if df is None or df.empty:
            return df
        if store_id:
            df = df[df['store_id'] == store_id]
        if task_status:
            df = df[df['task_status'] == task_status]
        if task_type:
            df = df[df['task_type'] == task_type]
        return df

    def get_followup_records(self, store_id=None, followup_status=None):
        df = self.get_table('followup_records')
        if df is None or df.empty:
            return df
        if store_id:
            df = df[df['store_id'] == store_id]
        if followup_status:
            df = df[df['followup_status'] == followup_status]
        return df

    def get_prescription_photos(self, prescription_id=None):
        df = self.get_table('prescription_photos')
        if df is None or df.empty:
            return df
        if prescription_id:
            df = df[df['prescription_id'] == prescription_id]
        return df


data_loader = DataLoader(use_mock=True)
