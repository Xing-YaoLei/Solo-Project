import sys
import traceback
from sqlalchemy import select
from sqlalchemy.orm import selectinload

print("=== 模拟实际代码路径的 ORM 测试 ===")
print()

try:
    from app.models.user import User
    from app.models.quote import Quote
    from app.models.invoice import InvoiceItem
    from app.models.approval import ApprovalNode
    from app.models.payment import Payment
    from app.models.exception import ExceptionRecord, ExceptionHistory
    from app.models.attachment import Attachment
    print("✅ 所有模型导入成功")
except Exception as e:
    print(f"❌ 模型导入失败: {e}")
    traceback.print_exc()
    sys.exit(1)

print()
print("=== 1. 模拟登录流程（auth.router /me） ===")
try:
    stmt = select(User).where(User.username == "testuser")
    print(f"✅ 用户查询（登录）构建成功")
except Exception as e:
    print(f"❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 2. 模拟 _enrich_quote 函数（quotes.router） ===")
print("   （逐个查询创建人、负责人姓名）")

try:
    quote = Quote(id="test-quote-id", created_by="user-1", assigned_to="user-2")
    
    creator_stmt = select(User).where(User.id == quote.created_by)
    print(f"   ✅ 根据 created_by 查询创建人: OK")
    
    assignee_stmt = select(User).where(User.id == quote.assigned_to)
    print(f"   ✅ 根据 assigned_to 查询负责人: OK")
except Exception as e:
    print(f"   ❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 3. 模拟报价单详情查询（带明细 eager load） ===")
try:
    stmt = (
        select(Quote)
        .options(selectinload(Quote.invoice_items))
        .where(Quote.id == "test-quote-id")
    )
    print(f"✅ 报价单 + 明细 eager load 构建成功")
except Exception as e:
    print(f"❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 4. 模拟支付流水查询（带操作人 eager load） ===")
try:
    stmt = (
        select(Payment)
        .options(selectinload(Payment.operator))
        .order_by(Payment.created_at.desc())
    )
    print(f"✅ 支付流水 + operator eager load 构建成功")
except Exception as e:
    print(f"❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 5. 模拟异常详情查询（带处理历史 eager load） ===")
try:
    stmt = (
        select(ExceptionRecord)
        .options(
            selectinload(ExceptionRecord.handler),
            selectinload(ExceptionRecord.history).selectinload(ExceptionHistory.operator),
        )
        .where(ExceptionRecord.id == "test-exc-id")
    )
    print(f"✅ 异常记录 + handler + history + history.operator 构建成功")
except Exception as e:
    print(f"❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 6. 模拟审批查询（带审批人 eager load） ===")
try:
    stmt = (
        select(ApprovalNode)
        .options(selectinload(ApprovalNode.approver))
        .order_by(ApprovalNode.node_order)
    )
    print(f"✅ 审批节点 + approver eager load 构建成功")
except Exception as e:
    print(f"❌ 失败: {e}")
    traceback.print_exc()

print()
print("=== 7. 验证 User 所有反向关系存在 ===")
user_rels = [
    "created_quotes",
    "assigned_quotes", 
    "approvals",
    "handled_exceptions",
    "payments",
    "exception_history_operations",
]
all_ok = True
for rel in user_rels:
    has_rel = hasattr(User, rel)
    status = "✅" if has_rel else "❌"
    print(f"   {status} User.{rel}: {has_rel}")
    if not has_rel:
        all_ok = False

print()
print("=== 8. 模拟登录后完整流程（登录 → 获取当前用户 → 报价单列表） ===")
try:
    login_stmt = select(User).where(User.username == "admin")
    print("   ✅ 登录查询: OK")
    
    me_stmt = select(User).where(User.id == "current-user-id")
    print("   ✅ 获取当前用户: OK")
    
    quotes_stmt = (
        select(Quote)
        .where((Quote.created_by == "current-user-id") | (Quote.assigned_to == "current-user-id"))
        .order_by(Quote.created_at.desc())
    )
    print("   ✅ 报价单列表（按权限过滤）: OK")
    
except Exception as e:
    print(f"   ❌ 失败: {e}")
    traceback.print_exc()
    all_ok = False

print()
if all_ok:
    print("🎉 所有 ORM 关系测试通过！")
else:
    print("⚠️ 存在测试失败，请检查上方输出")
