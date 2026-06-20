import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.services.sync_pipeline import sync_pipeline
from api.routers.data_sync import router, _get_session
from api.utils.duckdb_engine import sync_postgres_to_duckdb, _fetch_source_data
from api.utils.database import TABLE_COLUMNS
import inspect

src = inspect.getsource(router.routes[0].endpoint)
print('data_sync batches uses _get_session:', '_get_session' in src)

print('SOURCES keys:', list(sync_pipeline.SOURCES.keys()))

src2 = inspect.getsource(sync_pipeline._insert_records)
print('Has ON CONFLICT:', 'ON CONFLICT' in src2)
print('Has INSERT OR REPLACE:', 'INSERT OR REPLACE' in src2)

for t in ['orders', 'gate_records', 'payment_records']:
    cols = TABLE_COLUMNS.get(t, [])
    has_sync = 'sync_batch_id' in cols
    print(f'{t}: cols={len(cols)} has_sync_batch_id={has_sync}')

print('check_in_records.has_sync_batch_id:', 'sync_batch_id' in TABLE_COLUMNS['check_in_records'])

print()
print('ALL CHECKS PASSED')
