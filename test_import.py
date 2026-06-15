import requests

BASE = 'http://localhost:8001/api'

# 登录
r = requests.post(f'{BASE}/auth/login', json={'username': 'admin', 'password': 'admin123'})
token = r.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# 测试导入直播平台数据
print('=== 导入直播平台数据 ===')
r = requests.post(f'{BASE}/import/trigger', json={'source': 'live', 'remark': '测试导入'}, headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 测试导入就业表数据
print('=== 导入就业表数据 ===')
r = requests.post(f'{BASE}/import/trigger', json={'source': 'employment'}, headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 测试导入LMS数据
print('=== 导入LMS系统数据 ===')
r = requests.post(f'{BASE}/import/trigger', json={'source': 'lms'}, headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 再次验证章节分布
print('=== 导入后的章节分布（前3条） ===')
r = requests.get(f'{BASE}/dashboard/chapter-distribution', headers=headers)
data = r.json()
for item in data[:3]:
    print(f'  - {item}')
print()

# 再次验证标签排行
print('=== 导入后的标签排行（前3条） ===')
r = requests.get(f'{BASE}/dashboard/tag-ranking', headers=headers)
data = r.json()
for item in data[:3]:
    print(f'  - {item}')
print()

# 验证总览指标
print('=== 导入后的总览指标 ===')
r = requests.get(f'{BASE}/dashboard/overview', headers=headers)
print(f'Response: {r.json()}')
print()

# 验证作业漏斗
print('=== 导入后的作业漏斗 ===')
r = requests.get(f'{BASE}/dashboard/homework-funnel', headers=headers)
print(f'Response: {r.json()}')
print()

# 验证批次列表
print('=== 导入后的批次列表 ===')
r = requests.get(f'{BASE}/import/batches', headers=headers)
data = r.json()
print(f'Count: {len(data)}')
for item in data:
    print(f'  - batchId={item["batchId"]}, source={item["source"]}, status={item["status"]}, recordCount={item["recordCount"]}, operator={item["operator"]}')
print()

# 验证进度趋势
print('=== 导入后的学习进度趋势 ===')
r = requests.get(f'{BASE}/dashboard/progress-trend', headers=headers)
data = r.json()
print(f'Count: {len(data)}')
if data:
    print(f'First 3:')
    for item in data[:3]:
        print(f'  - {item}')
print()

# 添加测试注释
print('=== 添加进度注释 ===')
r = requests.post(f'{BASE}/import/notes', json={'date': '2026-06-16', 'note': '测试注释：期末考试周，参与度下降'}, headers=headers)
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 验证注释列表
print('=== 添加后的进度注释 ===')
r = requests.get(f'{BASE}/import/notes', headers=headers)
data = r.json()
print(f'Count: {len(data)}')
for item in data:
    print(f'  - date={item["date"]}, note={item["note"]}, createdBy={item["createdBy"]}')
print()

print('=== 所有数据导入和功能测试完成！ ===')
