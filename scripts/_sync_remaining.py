#!/usr/bin/env python3
"""临时脚本：补同步收款流水和门锁记录"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tasks.sync_tasks import _fetch_payments_from_source, _fetch_door_locks_from_source
from utils.data_cleaner import DataCleaner, save_anomalies_to_db
from utils.database import get_db_session
from data.models import PaymentTransaction, DoorLockRecord
import uuid
import random
from datetime import datetime

for name, fetch_func, clean_func, Model, unique_field in [
    ('收款流水', _fetch_payments_from_source, DataCleaner.clean_payment_transactions, PaymentTransaction, 'transaction_no'),
    ('门锁记录', _fetch_door_locks_from_source, DataCleaner.clean_door_lock_records, DoorLockRecord, 'record_no'),
]:
    records = fetch_func()
    for r in records:
        r[unique_field] = r[unique_field] + str(random.randint(100000, 999999))
    clean_result = clean_func(records)
    ok = 0
    with get_db_session() as db:
        for cleaned in clean_result.cleaned_data:
            try:
                data = {}
                for k, v in cleaned.items():
                    if not hasattr(Model, k) or k == 'id':
                        continue
                    if k in ('property_id', 'order_id') and v:
                        try:
                            data[k] = uuid.UUID(v)
                            continue
                        except Exception:
                            pass
                    data[k] = v
                if 'property_id' not in data or not data['property_id']:
                    continue
                obj = Model(**data)
                obj.synced_at = datetime.utcnow()
                db.add(obj)
                db.flush()
                ok += 1
            except Exception as e:
                db.rollback()
                continue
        if clean_result.anomalies:
            try:
                save_anomalies_to_db(clean_result.anomalies)
            except Exception:
                pass
    print(f'{name}: 成功写入 {ok} 条, 异常 {clean_result.anomaly_count} 个')

print('补同步完成')
