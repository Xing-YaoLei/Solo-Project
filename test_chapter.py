import requests
import sqlite3

BASE = 'http://localhost:8001/api'

# 登录
r = requests.post(f'{BASE}/auth/login', json={'username': 'admin', 'password': 'admin123'})
token = r.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# 1. 先查数据库里真实的各章节题目数
conn = sqlite3.connect('./backend/test.db')
cur = conn.cursor()
cur.execute('''
    SELECT c.name as course_name, ch.name as chapter_name, COUNT(q.id) as real_q_count
    FROM chapters ch
    JOIN courses c ON ch.course_id = c.id
    JOIN questions q ON q.chapter_id = ch.id
    GROUP BY c.name, ch.name, ch.order_index
    ORDER BY c.name, ch.order_index
''')
db_chapters = cur.fetchall()
conn.close()

print('=== 数据库真实章节题数 ===')
total_db = 0
for row in db_chapters:
    print(f'  {row[0]} / {row[1]}: {row[2]}题')
    total_db += row[2]
print(f'总计: {total_db} 题')
print()

# 2. 再查API返回的章节分布
print('=== API 返回的章节分布 ===')
r = requests.get(f'{BASE}/dashboard/chapter-distribution', headers=headers)
api_data = r.json()
total_api = 0
for item in api_data:
    print(f'  {item["courseName"]} / {item["chapterName"]}: questionCount={item["questionCount"]}, completedCount={item["completedCount"]}, completionRate={item["completionRate"]}%')
    total_api += item['questionCount']
print(f'总计: {len(api_data)} 条，总题数合计: {total_api}')
print()

# 验证
if total_db == total_api:
    print('✅ 验证通过：API 返回的 questionCount 与数据库真实题数完全一致')
else:
    print(f'❌ 验证失败：数据库 {total_db} 题，API 返回 {total_api} 题')
