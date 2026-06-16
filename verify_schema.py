import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.services.duckdb_service import DuckDBService

db = DuckDBService()

print("=== members 表结构 ===")
cols = db.conn.execute("PRAGMA table_info(members)").fetchall()
for c in cols:
    print(f"  {c[1]}: {c[2]}")

print()
print("=== member_profile_changes 表结构 ===")
cols = db.conn.execute("PRAGMA table_info(member_profile_changes)").fetchall()
for c in cols:
    print(f"  {c[1]}: {c[2]}")

print()
print("=== 测试 QUALIFY 查询 ===")
try:
    result = db.conn.execute("""
        SELECT * FROM members
        QUALIFY ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY imported_at DESC) = 1
    """).fetchall()
    print(f"查询成功，返回 {len(result)} 行")
except Exception as e:
    print(f"查询失败: {e}")

print()
print("=== 测试批量插入同一会员不同批次 ===")
try:
    db.conn.execute("DELETE FROM members WHERE member_id = 'TEST_001'")
    db.conn.execute("DELETE FROM member_profile_changes WHERE member_id = 'TEST_001'")
    db.conn.execute("DELETE FROM import_batches WHERE batch_id LIKE 'BATCH_member_TEST%'")

    db.conn.execute("""
        INSERT INTO members
        (member_id, member_name, phone, store_id, register_date, chronic_disease, allergy_info, last_visit_date, batch_id, imported_at)
        VALUES ('TEST_001', '张三', '13800138000', 'store_01', '2024-01-01', '高血压', '青霉素', '2024-06-01', 'BATCH_member_TEST01', '2024-06-01 10:00:00')
    """)

    db.conn.execute("""
        INSERT INTO members
        (member_id, member_name, phone, store_id, register_date, chronic_disease, allergy_info, last_visit_date, batch_id, imported_at)
        VALUES ('TEST_001', '张三', '13800138000', 'store_01', '2024-01-01', '糖尿病', '青霉素', '2024-06-15', 'BATCH_member_TEST02', '2024-06-15 10:00:00')
    """)

    print("✅ 插入成功，同一会员不同批次")

    count = db.conn.execute("SELECT COUNT(*) FROM members WHERE member_id = 'TEST_001'").fetchone()[0]
    print(f"  members 表中 TEST_001 记录数: {count} (期望 2)")

    latest = db.conn.execute("""
        SELECT * FROM members WHERE member_id = 'TEST_001'
        QUALIFY ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY imported_at DESC) = 1
    """).fetchone()
    print(f"  最新记录 chronic_disease: {latest[5]} (期望 糖尿病)")

    snapshot = db.get_member_snapshot_at_batch('TEST_001', 'BATCH_member_TEST01')
    if snapshot:
        print(f"  批次 TEST01 快照 chronic_disease: {snapshot.get('chronic_disease')} (期望 高血压)")
    else:
        print("  ⚠️  未找到批次 TEST01 快照")

    snapshot2 = db.get_member_snapshot_at_batch('TEST_001', 'BATCH_member_TEST02')
    if snapshot2:
        print(f"  批次 TEST02 快照 chronic_disease: {snapshot2.get('chronic_disease')} (期望 糖尿病)")
    else:
        print("  ⚠️  未找到批次 TEST02 快照")

    db.conn.execute("DELETE FROM members WHERE member_id = 'TEST_001'")
    db.conn.execute("DELETE FROM member_profile_changes WHERE member_id = 'TEST_001'")
    print("✅ 测试数据清理完成")

except Exception as e:
    print(f"❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()

db.close()
print()
print("✅ 所有验证完成")
