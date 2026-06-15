import requests

BASE = 'http://localhost:8001/api'

# 测试登录
r = requests.post(f'{BASE}/auth/login', json={'username': 'admin', 'password': 'admin123'})
print('=== 登录测试 ===')
print(f'Status: {r.status_code}')
login_data = r.json()
print(f'Response keys: {list(login_data.keys())}')
print(f'User: {login_data.get("user")}')
token = login_data['accessToken']
headers = {'Authorization': f'Bearer {token}'}
print()

# 测试总览
r = requests.get(f'{BASE}/dashboard/overview', headers=headers)
print('=== 总览指标 ===')
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 测试章节分布
r = requests.get(f'{BASE}/dashboard/chapter-distribution', headers=headers)
print('=== 课程章节分布 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
if data:
    for item in data[:3]:
        print(f'  - {item}')
print()

# 测试标签排行
r = requests.get(f'{BASE}/dashboard/tag-ranking', headers=headers)
print('=== 题目标签排行 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
if data:
    for item in data[:3]:
        print(f'  - {item}')
print()

# 测试作业漏斗
r = requests.get(f'{BASE}/dashboard/homework-funnel', headers=headers)
print('=== 作业记录漏斗 ===')
print(f'Status: {r.status_code}')
print(f'Response: {r.json()}')
print()

# 测试趋势
r = requests.get(f'{BASE}/dashboard/trend?days=7', headers=headers)
print('=== 趋势数据 ===')
print(f'Status: {r.status_code}')
data = r.json()
if isinstance(data, dict):
    print(f'Keys: {list(data.keys())}')
    if 'data' in data:
        print(f'Data count: {len(data["data"])} items')
else:
    print(f'Count: {len(data)} items')
print()

# 测试批次列表
r = requests.get(f'{BASE}/import/batches', headers=headers)
print('=== 批次列表 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
if data:
    print(f'First item keys: {list(data[0].keys())}')
    print(f'First item: {data[0]}')
print()

# 测试口径版本
r = requests.get(f'{BASE}/caliber/versions', headers=headers)
print('=== 口径版本 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
if data:
    print(f'First item keys: {list(data[0].keys())}')
    print(f'First item: {data[0]}')
print()

# 测试进度注释
r = requests.get(f'{BASE}/import/notes', headers=headers)
print('=== 进度注释 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
print()

# 测试进度趋势
r = requests.get(f'{BASE}/dashboard/progress-trend', headers=headers)
print('=== 学习进度趋势 ===')
print(f'Status: {r.status_code}')
data = r.json()
print(f'Count: {len(data)} items')
print()

print('=== 所有接口测试完成 ===')
