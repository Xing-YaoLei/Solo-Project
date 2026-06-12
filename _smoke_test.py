import sys
sys.path.insert(0, ".")

from src.data.seed import seed_all_data
from src.data import DataRepository
from src.auth import authenticate, init_default_users, User
from src.business import (
    LossCalculator,
    compute_trend,
    compute_reason_composition,
    detect_store_exceptions,
    get_all_metric_versions,
    explain_version_change,
)
from src.share import ShareManager, build_share_payload_from_user

print("=== 1. 初始化默认用户 ===")
init_default_users()

print("\n=== 2. 生成模拟数据 ===")
stats = seed_all_data()
print(f"数据量：{stats}")

print("\n=== 3. 用户认证 ===")
user = authenticate("admin", "admin123")
print(f"admin 登录: {user is not None}, role={user.role if user else None}")
user2 = authenticate("store01", "wrongpass")
print(f"store01 错误密码: {user2 is None}")
viewer = authenticate("viewer", "viewer123")
print(f"viewer 登录: {viewer is not None}")

print("\n=== 4. 数据仓库查询 ===")
repo = DataRepository()
loss = repo.get_loss_reports()
print(f"报损单数量: {len(loss)}")
print(f"报损单列: {loss.columns}")
stores = repo.get_stores()
print(f"门店数: {len(stores)}")

print("\n=== 5. 损耗计算 (v2.0) ===")
receipts = repo.get_member_receipts()
delivery = repo.get_delivery_orders()
inventory = repo.get_inventory()
calc = LossCalculator("v2.0")
result = calc.compute(loss, receipts, delivery, inventory)
print(f"  损耗率: {result.loss_rate * 100:.2f}%")
print(f"  报损金额: ¥{result.loss_amount:,.2f}")
print(f"  分母: ¥{result.denominator:,.2f}")
print(f"  报损单数: {result.report_count}")
print(f"  公式: {result.formula}")
if result.note:
    print(f"  备注: {result.note}")

print("\n=== 6. 趋势计算 ===")
trend = compute_trend(loss, receipts, delivery, inventory, "day", "v2.0")
print(f"趋势记录数: {len(trend)}, 列={trend.columns}")
if not trend.is_empty():
    print(f"  第一条: {trend.row(0, named=True)}")

print("\n=== 7. 原因构成 ===")
reason = compute_reason_composition(loss, "v2.0")
print(f"原因数: {len(reason)}")
print(reason)

print("\n=== 8. 异常门店检测 ===")
exc = detect_store_exceptions(loss, receipts, delivery, metric_version="v2.0")
print(f"门店异常: {len(exc)} 家")
print(exc)

print("\n=== 9. 口径版本 ===")
for v in get_all_metric_versions():
    print(f"  {v.version}: {v.description} (生效: {v.effective_date})")
print("\n版本变更解释:")
print(explain_version_change("v1.0", "v2.0"))

print("\n=== 10. 分享功能 ===")
share_user = authenticate("admin", "admin123")
mgr = ShareManager()
payload = build_share_payload_from_user(share_user, metric_version="v2.0")
token = mgr.serializer.dumps(payload.__dict__)
print(f"分享 token 长度: {len(token)}")
parsed = mgr.parse_token(token)
print(f"解析成功: {parsed is not None}")
if parsed:
    print(f"  owner={parsed.owner}, role={parsed.owner_role}")
    print(f"  formula footer: {parsed.get_formula_footer()[:80]}...")

print("\n=== 11. 权限过滤 ===")
from src.auth import filter_data_by_permission
viewer_user = authenticate("viewer", "viewer123")
filtered = filter_data_by_permission(viewer_user, loss)
print(f"viewer 可看报损单: {len(filtered)} (门店: {viewer_user.stores})")

print("\n✅ 所有冒烟测试通过！")
