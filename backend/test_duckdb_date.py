import duckdb
from app.db.database import DUCKDB_PATH

conn = duckdb.connect(str(DUCKDB_PATH))

tests = [
    ("CURRENT_DATE", "SELECT CURRENT_DATE"),
    ("CURRENT_DATE - 30", "SELECT CURRENT_DATE - 30"),
    ("DATE '2026-06-17'", "SELECT DATE '2026-06-17'"),
    ("EXTRACT(HOUR FROM '2026-06-17 09:15:00'::TIMESTAMP)", "SELECT EXTRACT(HOUR FROM '2026-06-17 09:15:00'::TIMESTAMP)"),
]

for name, sql in tests:
    try:
        r = conn.execute(sql).fetchone()
        print(f"  OK {name} = {r[0]}")
    except Exception as e:
        print(f"  FAIL {name}: {str(e)[:80]}")

print()
for tbl in ["charging_records_clean", "access_logs_clean", "health_metrics_clean"]:
    try:
        r = conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()
        print(f"  {tbl}: {r[0]} rows")
    except Exception as e:
        print(f"  {tbl}: ERROR {e}")

print()
try:
    r = conn.execute("""
        SELECT COUNT(DISTINCT resident_id)
        FROM charging_records_clean
        WHERE charge_date >= CURRENT_DATE - 30
    """).fetchone()
    print(f"近30天 charging_records_clean DISTINCT resident_id: {r[0]}")
except Exception as e:
    print(f"近30天查询失败: {e}")
