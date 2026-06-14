from app.db.duckdb_conn import get_duckdb_connection
con = get_duckdb_connection()
print('=== fact_course_record 前3行 ===')
for r in con.execute('SELECT record_id, record_no, member_id, membership_id, course_id FROM fact_course_record LIMIT 3').fetchall():
    print(' ', r)
print()
print('=== dim_member 前3行 ===')
for r in con.execute('SELECT member_id, member_no, name FROM dim_member LIMIT 3').fetchall():
    print(' ', r)
print()
print('=== courses 前3行 ===')
for r in con.execute('SELECT course_id, course_no, member_id, coach_name, course_type FROM courses LIMIT 3').fetchall():
    print(' ', r)
print()
print('=== JOIN 测试（只查1行）===')
for r in con.execute("""
    SELECT f.record_id, f.member_id, f.course_id, m.name, c.course_no, c.course_type
    FROM fact_course_record f 
    LEFT JOIN dim_member m ON f.member_id = m.member_id
    LEFT JOIN courses c ON f.course_id = c.course_id
    LIMIT 1
""").fetchall():
    print(' ', r)
con.close()
