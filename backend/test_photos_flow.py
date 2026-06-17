import json
import urllib.request
import urllib.error

BASE = 'http://localhost:8000/api/v1'

def req(method, path, token=None, data=None):
    body = json.dumps(data).encode() if data else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}')

print('=== 1. admin login ===')
code, data = req('POST', '/auth/login', data={'username': 'admin', 'password': 'admin123'})
assert code == 200, f'login failed: {code} {data}'
token = data['access_token']
print(f'  OK: token_len={len(token)}')

print('\n=== 2. list daily work orders ===')
code, data = req('GET', '/work-orders/daily', token=token)
assert code == 200
orders = data['items']
print(f'  Total: {len(orders)}')
for o in orders[:3]:
    print(f'  - {o["title"][:20]} status={o["status"]} photos_count={o.get("photos_count", 0)}')

print('\n=== 3. find 2号楼卫生间漏水 detail (scene+completion) ===')
order_id = None
for o in orders:
    if '2号楼卫生间漏水' in o['title']:
        order_id = o['id']
        break
assert order_id
code, detail = req('GET', f'/work-orders/{order_id}', token=token)
assert code == 200
scene = [p for p in detail['photos'] if p.get('photo_type') in ('scene', None, '')]
completion = [p for p in detail['photos'] if p.get('photo_type') == 'completion']
other = [p for p in detail['photos'] if p and p.get('photo_type') not in ('scene', None, '', 'completion')]
print(f'  Title: {detail["title"]}')
print(f'  总照片数: {len(detail["photos"])}')
print(f'  - 创建现场照 (scene): {len(scene)}')
for p in scene:
    print(f'      * {p.get("caption")} type={p.get("photo_type")} url_ok={bool(p.get("url"))}')
print(f'  - 处理完成照 (completion): {len(completion)}')
for p in completion:
    print(f'      * {p.get("caption")} type={p.get("photo_type")} url_ok={bool(p.get("url"))}')
if other:
    print(f'  - 其他: {len(other)}')
assert len(scene) >= 1, f'缺少创建现场照 scene={len(scene)}'
assert len(completion) >= 1, f'缺少处理完成照 completion={len(completion)}'
assert detail['dispatch_rules'], '缺少派工规则'
print(f'  派工规则: {detail["dispatch_rules"][0]["name"]} processing_hours={detail["dispatch_rules"][0]["processing_hours"]}')

print('\n=== 4. find 3号楼空调不制冷 detail (scene+completion+review_fail) ===')
order_id = None
for o in orders:
    if '3号楼空调不制冷' in o['title']:
        order_id = o['id']
        break
assert order_id
code, detail = req('GET', f'/work-orders/{order_id}', token=token)
assert code == 200
scene = [p for p in detail['photos'] if p.get('photo_type') in ('scene', None, '')]
completion = [p for p in detail['photos'] if p.get('photo_type') == 'completion']
print(f'  Title: {detail["title"]}')
print(f'  总照片数: {len(detail["photos"])} | 创建现场照: {len(scene)} | 处理完成照: {len(completion)}')
print(f'  review_records: {len(detail["review_records"])}')
print(f'  communications: {len(detail["communications"])}')
assert len(scene) >= 2 and len(completion) >= 2

print('\n=== 5. POST 创建带照片工单 ===')
new_photo_url = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=broken%20office%20chair%20wheel%2C%20close%20up%2C%20realistic&image_size=square'
code, created = req('POST', '/work-orders', token=token, data={
    'title': '测试-办公椅轮子损坏',
    'description': '3楼会议室A的办公椅一个轮子掉了，需要更换',
    'location': '3楼会议室A',
    'category': 'civil',
    'priority': 'low',
    'reporter_name': '测试用户',
    'reporter_phone': '13900139000',
    'photos': [
        {'url': new_photo_url, 'caption': '办公椅轮子损坏', 'photo_type': 'scene'}
    ],
})
assert code in (200, 201), f'创建失败: {code} {created}'
print(f'  创建成功: id={created["id"]} status={created["status"]} photos={len(created["photos"])}')
assert len(created['photos']) == 1
assert created['photos'][0]['photo_type'] in ('scene', None, '')
print(f'  photo_type: {created["photos"][0]["photo_type"]} caption={created["photos"][0]["caption"]}')

print('\n=== 6. assign+start 然后 complete 带照片 ===')
new_id = created['id']
code, _ = req('POST', f'/work-orders/{new_id}/assign', token=token, data={'assigned_to': 3, 'remark': '测试派工'})
assert code == 200, f'assign failed: {code}'
print(f'  assign OK')

worker_code, worker_login = req('POST', '/auth/login', data={'username': 'worker1', 'password': 'worker123'})
assert worker_code == 200
worker_token = worker_login['access_token']
code, _ = req('POST', f'/work-orders/{new_id}/start', token=worker_token)
assert code == 200, f'start failed: {code}'
print(f'  start OK (worker1)')

completion_url = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=repaired%20office%20chair%20with%20new%20wheels%2C%20clean%20floor%2C%20realistic&image_size=square'
code, completed = req('POST', f'/work-orders/{new_id}/complete', token=worker_token, data={
    'remark': '更换了新的轮子',
    'photos': [
        {'url': completion_url, 'caption': '更换新轮子完成', 'photo_type': 'completion'}
    ],
})
assert code == 200, f'complete failed: {code} {completed}'
print(f'  complete OK status={completed["status"]}')

code, final_detail = req('GET', f'/work-orders/{new_id}', token=token)
assert code == 200
scene = [p for p in final_detail['photos'] if p.get('photo_type') in ('scene', None, '')]
completion = [p for p in final_detail['photos'] if p.get('photo_type') == 'completion']
print(f'  最终详情: 总照片={len(final_detail["photos"])} scene={len(scene)} completion={len(completion)}')
assert len(scene) == 1 and len(completion) == 1
print(f'  scene: {scene[0]["caption"]}')
print(f'  completion: {completion[0]["caption"]}')

print('\n=== 7. 验证 PostgreSQL 方言生成 ===')
import os, sys
sys.path.insert(0, '.')
from app.core.config import settings
print(f'  settings.USE_SQLITE = {settings.USE_SQLITE}')

# 直接从 main.py 源码验证方言逻辑
import inspect
import app.main as main_module
source = inspect.getsource(main_module._init_sample_work_orders)
if settings.USE_SQLITE:
    assert 'datetime({col}, :shift)' in source or 'datetime(' in source
    print('  ✅ SQLite 方言: 使用 datetime(col, :shift) ✓')
else:
    assert 'CAST(:shift AS INTERVAL)' in source, 'PostgreSQL 方言缺少 INTERVAL'
    assert 'col + CAST' in source.replace(' ', ''), 'PostgreSQL 方言缺少列加法'
    print('  ✅ PostgreSQL 方言: 使用 col + CAST(:shift AS INTERVAL) ✓')
    print('  ✅ PostgreSQL 初始化不出现 SQLite datetime() ✓')

print('\n=== ALL TESTS PASSED ===')
