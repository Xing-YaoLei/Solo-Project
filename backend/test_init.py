import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 先删除旧数据库
from app.services.duckdb_init import get_duckdb_path
path = get_duckdb_path()
if os.path.exists(path):
    os.remove(path)
    print(f"Removed old DB: {path}")

try:
    from app.services.duckdb_init import init_duckdb
    result = init_duckdb()
    print(f"✅ init_duckdb returned: {result}")

    import duckdb
    conn = duckdb.connect(path)
    print()
    print("📊 Final data counts:")
    for table in ['merchants', 'settlements', 'orders', 'customer_service_records', 'payment_flows', 'approval_nodes', 'amount_checks', 'caliber_diffs']:
        count = conn.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
        print(f'   {table}: {count}')
    conn.close()
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
