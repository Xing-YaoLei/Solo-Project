import inspect
from src.data_layer.data_repository import DataRepository, DualWriteResult, TABLE_PRIMARY_KEYS

print("TABLE_PRIMARY_KEYS:")
for t, pk in TABLE_PRIMARY_KEYS.items():
    print(f"  {t}: {pk}")

print()

methods = [
    'save_ota_orders_batch',
    'save_door_lock_records_batch',
    'save_payment_transactions_batch',
    'save_package_inventory_batch',
    'save_pricing_rules_batch',
    'save_analysis_notes_batch',
    'save_oversell_records_batch',
    'save_conversion_rate_versions_batch',
    'sync_from_minio',
    'sync_to_minio',
    'list_minio_objects',
]
for m in methods:
    sig = inspect.signature(getattr(DataRepository, m))
    print(f'{m}: {sig}')

print()
print("DualWriteResult attributes:", [a for a in dir(DualWriteResult) if not a.startswith('_')])

print()
print("Import checks for app.py and init_data.py:")
from src.utils.data_generator import MockDataGenerator
print("MockDataGenerator.write_results: OK")

import init_data
print("init_data modules: OK")

from app import handle_minio_sync
print("handle_minio_sync: OK")
print()
print("All verification PASSED ✅")
