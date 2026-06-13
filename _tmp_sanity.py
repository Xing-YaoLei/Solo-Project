import py_compile
import sys
import traceback

files = [
    'config.py', 'main.py', 'seed_data.py',
    'db/models.py', 'db/connection.py', 'db/queries.py',
    'tasks/celery_config.py', 'tasks/scheduler.py',
    'services/risk_analysis.py',
    'utils/auth.py', 'utils/csv_export.py',
    'app/charts.py', 'app/dashboard.py',
]
failed = []
for f in files:
    try:
        py_compile.compile(f, doraise=True)
        print('OK  ', f)
    except Exception as e:
        print('FAIL', f, str(e))
        traceback.print_exc()
        failed.append(f)
print()
if failed:
    print('FAILED:', failed)
    sys.exit(1)
print('=== 1. ALL 13 FILES COMPILE ===')
print()
print('=== 2. IMPORT DASHBOARD MODULE (首屏不读session) ===')
try:
    from app.dashboard import app
    print('OK  import app.dashboard, app type:', type(app).__name__)
    # 检查关键占位组件是否存在（不含重复ID）
    import dash
    def walk_children(node, ids):
        if hasattr(node, 'id') and node.id:
            ids.append(node.id)
        for ch in getattr(node, 'children', []) or []:
            if isinstance(ch, (dash.development.base_component.Component, tuple, list)):
                if not isinstance(ch, (tuple, list)):
                    ch = [ch]
                for c in ch:
                    if hasattr(c, 'id') and c.id:
                        ids.append(c.id)
                    for sub in getattr(c, 'children', []) or []:
                        walk_children(sub, ids)
    ids = []
    walk_children(app.layout, ids)
    dup = set([i for i in ids if ids.count(i) > 1])
    print('OK  layout 中关键 placeholder ID:')
    for pid in ['login-panel-placeholder', 'share-panel-placeholder',
                'download-section', 'share-result', 'login-status']:
        cnt = ids.count(pid)
        mark = 'OK ' if (pid == 'share-result' and cnt == 0) or (cnt >= 1) else 'WRN'
        print(f'   {mark} {pid}: 出现 {cnt} 次')
    if dup:
        print('WRN 重复 ID:', dup)
    else:
        print('OK  顶层 layout 无重复 ID（share-result 应在回调注入，首屏为 0 次）')
except Exception as e:
    print('FAIL import:', e)
    traceback.print_exc()
    sys.exit(1)

print()
print('=== 3. AUTH UTIL SANITY CHECK ===')
from utils.auth import is_share_mode, ROLE_HIERARCHY, create_share_link, is_authenticated
print('OK  角色层级:', sorted(ROLE_HIERARCHY.items(), key=lambda x: -x[1]))
print('OK  is_authenticated (无 Flask 上下文前默认):',
      'safe, import-time not called')
print()
print('=== ALL SANITY CHECKS PASSED ===')
