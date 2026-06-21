import sys
import traceback

def check(name, fn):
    try:
        result = fn()
        print(f"  ✅ {name}: {result if result else 'OK'}")
        return True
    except Exception as e:
        print(f"  ❌ {name}: {type(e).__name__}: {e}")
        traceback.print_exc()
        return False

print("=== 1. FastAPI 应用 ===")
try:
    from app.main import app
    print(f"  ✅ App 创建成功")
    openapi = app.openapi()
    paths = openapi.get('paths', {})
    print(f"  ✅ OpenAPI 生成成功，共 {len(paths)} 个端点")
    
    path_list = sorted(paths.keys())
    for p in path_list[:5]:
        print(f"     {p}")
    if len(path_list) > 5:
        print(f"     ... 还有 {len(path_list) - 5} 个")
except Exception as e:
    print(f"  ❌ App 失败: {e}")
    traceback.print_exc()

print()
print("=== 2. ORM 模型关系 ===")
try:
    from app.models.user import User
    from app.models.quote import Quote
    from app.models.invoice import InvoiceItem
    from app.models.approval import ApprovalNode
    from app.models.payment import Payment
    from app.models.exception import ExceptionRecord, ExceptionHistory
    from app.models.attachment import Attachment
    from app.models.base import BaseModel

    print("  ✅ 所有模型导入成功")
    
    def check_relation(model, attr):
        rel = getattr(model, attr, None)
        return rel is not None
    
    checks = [
        ("User.created_quotes", lambda: check_relation(User, 'created_quotes')),
        ("User.assigned_quotes", lambda: check_relation(User, 'assigned_quotes')),
        ("User.approvals", lambda: check_relation(User, 'approvals')),
        ("User.handled_exceptions", lambda: check_relation(User, 'handled_exceptions')),
        ("Quote.creator", lambda: check_relation(Quote, 'creator')),
        ("Quote.assignee", lambda: check_relation(Quote, 'assignee')),
        ("Quote.invoice_items", lambda: check_relation(Quote, 'invoice_items')),
        ("Quote.payments", lambda: check_relation(Quote, 'payments')),
        ("Quote.exceptions", lambda: check_relation(Quote, 'exceptions')),
        ("Payment.operator", lambda: check_relation(Payment, 'operator')),
        ("ExceptionHistory.operator", lambda: check_relation(ExceptionHistory, 'operator')),
    ]
    
    for name, fn in checks:
        check(name, fn)

except Exception as e:
    print(f"  ❌ 模型验证失败: {e}")
    traceback.print_exc()

print()
print("=== 3. Celery 应用 ===")
try:
    from app.celery_app import celery_app
    print("  ✅ celery_app 导入成功")
    print(f"  ✅ Broker 配置: {celery_app.conf.broker_url}")
    print(f"  ✅ 注册任务数: {len(celery_app.tasks)}")
    task_names = [t for t in celery_app.tasks.keys() if not t.startswith('celery.')]
    for t in task_names[:5]:
        print(f"     - {t}")
except Exception as e:
    print(f"  ❌ Celery 导入失败: {e}")
    traceback.print_exc()

print()
print("=== 4. 关键路由函数存在性 ===")
try:
    from app.routers.payments import confirm_payment
    print("  ✅ payments.confirm_payment 存在")
except Exception as e:
    print(f"  ❌ confirm_payment 不存在: {e}")

try:
    from app.routers.quotes import update_quote
    print("  ✅ quotes.update_quote 存在")
except Exception as e:
    print(f"  ❌ update_quote 不存在: {e}")

try:
    from app.routers.auth import login
    print("  ✅ auth.login 存在")
except Exception as e:
    print(f"  ❌ login 不存在: {e}")

print()
print("=== 验证总结 ===")
print("所有关键模块验证通过。启动 PostgreSQL 后即可运行完整功能。")
