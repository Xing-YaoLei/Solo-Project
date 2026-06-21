import sys
import traceback

print("=== 测试 ORM 关系是否有 AmbiguousForeignKeysError ===")
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
    print(f"❌ 模型导入失败: {type(e).__name__}: {e}")
    traceback.print_exc()
    sys.exit(1)

print()
print("=== 测试查询构建（模拟登录和报价列表） ===")

try:
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    stmt = select(User).where(User.username == "admin")
    print(f"✅ 用户查询（登录）构建成功: {stmt}")
except Exception as e:
    print(f"❌ 用户查询失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = select(Quote).order_by(Quote.created_at.desc())
    print(f"✅ 报价单列表查询构建成功")
except Exception as e:
    print(f"❌ 报价单查询失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(Quote)
        .options(selectinload(Quote.creator))
        .order_by(Quote.created_at.desc())
    )
    print(f"✅ 报价单列表 + creator eager load 构建成功")
except Exception as e:
    print(f"❌ 报价单 + creator 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(Quote)
        .options(selectinload(Quote.assignee))
        .order_by(Quote.created_at.desc())
    )
    print(f"✅ 报价单列表 + assignee eager load 构建成功")
except Exception as e:
    print(f"❌ 报价单 + assignee 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(ApprovalNode)
        .options(selectinload(ApprovalNode.approver))
    )
    print(f"✅ 审批节点 + approver eager load 构建成功")
except Exception as e:
    print(f"❌ 审批节点 + approver 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(Payment)
        .options(selectinload(Payment.operator))
    )
    print(f"✅ 支付流水 + operator eager load 构建成功")
except Exception as e:
    print(f"❌ 支付流水 + operator 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(ExceptionRecord)
        .options(selectinload(ExceptionRecord.handler))
    )
    print(f"✅ 异常记录 + handler eager load 构建成功")
except Exception as e:
    print(f"❌ 异常记录 + handler 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
try:
    stmt = (
        select(ExceptionHistory)
        .options(selectinload(ExceptionHistory.operator))
    )
    print(f"✅ 异常历史 + operator eager load 构建成功")
except Exception as e:
    print(f"❌ 异常历史 + operator 失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
print("=== 测试 User 反向关系 ===")
try:
    user_stmt = (
        select(User)
        .options(selectinload(User.created_quotes))
        .options(selectinload(User.assigned_quotes))
        .options(selectinload(User.approvals))
        .options(selectinload(User.handled_exceptions))
    )
    print(f"✅ User 反向关系 eager load 构建成功")
except Exception as e:
    print(f"❌ User 反向关系失败: {type(e).__name__}: {e}")
    traceback.print_exc()

print()
print("=== 所有查询构建测试完成 ===")
