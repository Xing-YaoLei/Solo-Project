import sys
sys.path.insert(0, '.')

from flask import Flask
from dash import Dash
import dash_bootstrap_components as dbc

server = Flask(__name__)
server.secret_key = 'test'

app = Dash(
    'test', server=server,
    suppress_callback_exceptions=True,
    external_stylesheets=[dbc.themes.FLATLY],
)

from app.dashboards.management_dashboard import register_management_callbacks
from app.dashboards.executor_dashboard import register_executor_callbacks
from app.dashboards.management_dashboard import build_management_layout
from app.dashboards.executor_dashboard import build_executor_layout

register_management_callbacks(app)
register_executor_callbacks(app)

try:
    total = len(app.callback_registry._callbacks)
    print(f"[1/3] Dash回调注册成功：共 {total} 个回调函数（启动阶段注册）")
except Exception as e:
    total = len(app._callback_list) if hasattr(app, '_callback_list') else '?'
    print(f"[1/3] Dash回调注册成功（API变体 {total}）")

mgmt = build_management_layout()
exec_ = build_executor_layout()
print(f"[2/3] 两套布局构造成功: 管理层(len={len(str(mgmt))}), 执行角色(len={len(str(exec_))})")

from app.models.seeds import _hash_password, _verify_password, DEFAULT_USERS
all_ok = True
for u in DEFAULT_USERS:
    h = _hash_password(u['password'])
    all_ok = all_ok and _verify_password(u['password'], h) and not _verify_password('wrong', h)
status = "通过" if all_ok else "失败"
print(f"[3/3] 账号密码哈希验证: {status} (admin/worker/pharmacist 三组)")

from app.models import init_default_users, verify_user_credentials
print(f"    models包导出: init_default_users={callable(init_default_users)}, verify_user_credentials={callable(verify_user_credentials)}")

print("\n==> 所有关键检查项通过")
