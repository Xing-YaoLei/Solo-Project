import sys
sys.path.insert(0, '/Users/yaoleyxing/Developer/solo-mange-pro/MP0113/backend')
from datetime import datetime, timedelta
from app.db.duckdb_conn import get_duckdb_connection
from app.services.analytics_service import get_verification_records, _fetch_all, _rows_to_dicts

print("=== 1. 先直接调用 get_verification_records API 函数 ===")
d = get_verification_records(page=1, page_size=3)
for i, r in enumerate(d['items'][:3]):
    print(f"  [{i+1}] 列名: {list(r.keys())[:8]}")
    print(f"       内容: record_no={r.get('record_no')} member_name={r.get('member_name')} course_no={r.get('course_no')}")
print()

print("=== 2. 直接跑完整 SQL（带 WHERE）看列名和结果 ===")
con = get_duckdb_connection()
end_date = datetime.now().strftime("%Y-%m-%d")
start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

cursor = con.execute("""
    SELECT
        f.record_id,
        f.record_no,
        f.member_id,
        m.name AS member_name,
        m.member_no,
        f.course_id,
        c.course_no,
        c.course_type
    FROM fact_course_record f
    LEFT JOIN dim_member m ON f.member_id = m.member_id
    LEFT JOIN courses c ON f.course_id = c.course_id
    WHERE f.verify_date BETWEEN ? AND ?
    ORDER BY f.verify_time DESC LIMIT 3
""", [start_date, end_date])

cols, rows = _fetch_all(cursor)
print("   SQL 列名:", cols)
for r in rows[:3]:
    print("   行:", r)

print()
print("=== 3. 不带 WHERE 的 JOIN 查询 ===")
cursor2 = con.execute("""
    SELECT f.record_no, f.member_id, f.course_id, m.name, c.course_no
    FROM fact_course_record f
    LEFT JOIN dim_member m ON f.member_id = m.member_id
    LEFT JOIN courses c ON f.course_id = c.course_id
    LIMIT 3
""")
cols2, rows2 = _fetch_all(cursor2)
print("   列名:", cols2)
for r in rows2:
    print("   ", r)
con.close()
