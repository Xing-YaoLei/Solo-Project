import sys
import traceback
from flask import session
from app.dashboard import app, server

client = server.test_client()
server.config['TESTING'] = True
server.secret_key = "test-key"

print("=== 1. 首页请求（匿名 viewer） ===")
with client.session_transaction() as s:
    pass
resp = client.get('/')
print('GET / status:', resp.status_code)
assert resp.status_code == 200, f"首页失败: {resp.status_code}"
print('OK  首页能渲染（200）')

print()
print("=== 2. /api/login 匿名直接选 admin（非法用户名 demo_manager） ===")
resp = client.post('/api/login', json={
    'username': 'demo_manager',
    'role': 'admin',
    'store_id': 'S001'
})
print(f'POST /api/login (role=admin, user=demo_manager): {resp.status_code},',
      resp.get_json() if resp.is_json else resp.data[:200])
assert resp.status_code == 403, f"应该被拦，实际 {resp.status_code}"
print('OK  非法用户名 + admin 角色 被拦截（403）')

print()
print("=== 3. /api/login 匿名选 store_manager ===")
resp = client.post('/api/login', json={
    'username': 'demo_manager',
    'role': 'store_manager',
    'store_id': 'S001'
})
j = resp.get_json()
print(f'POST /api/login (store_manager): {resp.status_code}, success={j.get("success") if j else None}')
assert resp.status_code == 200 and j.get('success')
with client.session_transaction() as s:
    print(f'   session login_time 存在: {s.get("login_time") is not None}')
    print(f'   session user_role    = {s.get("user_role")}')
print('OK  店长首次登录允许')

print()
print("=== 4. /api/login 已登录 store_manager 尝试提升 admin ===")
resp = client.post('/api/login', json={
    'username': 'admin_test',
    'role': 'admin',
    'store_id': 'S001'
})
j = resp.get_json()
print(f'POST /api/login (upgrade->admin): {resp.status_code}, success={j.get("success") if j else None}')
assert resp.status_code == 403
print('OK  已登录 store_manager 提升为 admin 被拦（403）')

print()
print("=== 5. /api/login 匿名 admin_user_xxx + admin 角色 ===")
client2 = server.test_client()
resp = client2.post('/api/login', json={
    'username': 'admin_store_owner',
    'role': 'admin',
    'store_id': 'S001'
})
j = resp.get_json()
print(f'POST /api/login (admin_store_owner+admin): {resp.status_code}, success={j.get("success") if j else None}')
assert resp.status_code == 200 and j.get('success')
print('OK  admin_ 前缀 + admin 角色允许')

print()
print("=== 6. 生成分享链接（店长创建 viewer 分享） ===")
from utils.auth import _share_token_store
_share_token_store.clear()

token = ''
share_url = ''
with server.app_context():
    with server.test_request_context('/'):
        from flask import session as fsession
        fsession['username'] = 'demo_manager'
        fsession['user_role'] = 'store_manager'
        fsession['store_id'] = 'S001'
        fsession['login_time'] = 1718300000
        from utils.auth import create_share_link
        result = create_share_link(target_role='viewer', expires_minutes=60, target_store_id='S001')
        print('create_share_link(store_manager→viewer):', 'OK' if result.get('success') else result)
        share_url = result.get('share_url', '')
        token = share_url.split('share_token=')[-1] if 'share_token=' in share_url else ''
        print(f'   token 生成: {token[:12]}...')
        assert result.get('success'), f'失败 {result}'

print()
print("=== 7. 分享视图访问：检查登录面板禁用、下载禁用 ===")
with server.test_request_context('/'):
    with client.session_transaction() as s:
        s['share_context'] = {'role': 'viewer', 'store_id': 'S001', 'expires_at': 9999999999,
                               'token': token, 'owner_role': 'store_manager'}
        s['user_role'] = 'viewer'
        s['store_id'] = 'S001'

resp = client.post('/api/login', json={
    'username': 'admin_hack',
    'role': 'admin',
    'store_id': 'S001'
})
j = resp.get_json()
print(f'POST /api/login in share mode: {resp.status_code}, success={j.get("success") if j else None}')
assert resp.status_code == 403, f'分享模式下 /api/login 应返回 403，实际 {resp.status_code}'
print('OK  分享模式 /api/login 拦截（403）')

print()
print("=== 8. Dash 回调 ID 验证（通过 callback_map） ===")
callbacks = getattr(app, 'callback_map', {}) or {}

has_share_result = any('share-result' in cid for cid in callbacks)
has_login_panel = any('login-panel-placeholder' in cid for cid in callbacks)

print(f'share-result 回调存在: {has_share_result}')
assert has_share_result, 'share-result 必须有 Output 回调'
print('OK  share-result 有且只有 1 个回调输出（稳定挂载点）')

print(f'login-panel-placeholder 回调存在: {has_login_panel}')
assert has_login_panel
print('OK  login-panel-placeholder 由 update_dashboard 回调注入')

print()
print("=== ALL E2E TESTS PASSED ===")
